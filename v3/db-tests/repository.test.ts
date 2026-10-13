import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { Ratio } from "../src/core/arith/ratio";
import { SupabaseConnector } from "../src/db/connector";
import { AppSchema, tables } from "../src/db/local/schema";
import { addComponent, addDose, addRegulation, createMaterial, loadCatalog, setHave, type LocalDb } from "../src/db/materials";
import { admin, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 3.2, the upload: what the repository writes on A's copy reaches the local
 * Supabase as Postgres keeps it (lists as arrays, booleans as booleans, figures exact), A's,
 * with the owner of each row copied from its material.
 */

const TAG = "[prueba 3.2]";
let a: TestUser;
let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;
let common: string;

async function waitFor<T>(probe: () => Promise<T | null | undefined | false>): Promise<T> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    const found = await probe();
    if (found) return found;
    if (Date.now() > deadline) throw new Error("timed out waiting for the sync");
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100n));

beforeAll(async () => {
  a = await signIn("A");
  await admin`delete from materials where name like ${TAG + "%"} and owner_id = ${a.id}`;
  await admin`delete from materials where name like ${TAG + "%"}`;
  [{ id: common }] = await admin`insert into materials (name, kind) values (${`${TAG} Linalool`}, 'molecule') returning id`;
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-upload-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "upload.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  await copy.connect(new SupabaseConnector(a.db, () => "http://127.0.0.1:8080"));
  await waitFor(async () => (await loadCatalog(db, a.id)).materials.has(common));
});

afterAll(async () => {
  await copy?.disconnectAndClear();
  await copy?.close();
  rmSync(folder, { recursive: true, force: true });
  await admin`delete from materials where name like ${TAG + "%"} and owner_id is not null`;
  await admin`delete from materials where name like ${TAG + "%"}`;
  await admin.end();
});

it("what the repository writes reaches Supabase as Postgres keeps it, A's", async () => {
  const id = await createMaterial(db, a.id, {
    name: `${TAG} Mi base`,
    kind: "composition",
    aliases: ["MB", "base de A"],
    solvent: true,
    purity: Ratio.of(1n, 10n ** 30n),
    family: "woody",
  });
  await addComponent(db, a.id, id, common, { kind: "range", min: pct("1"), max: pct("2.5") }, "product", "ficha");
  await addRegulation(db, a.id, id, { regime: "manufacturer", kind: "max", maxValue: pct("0.0082"), authority: "product", source: "certificado" });
  await addDose(db, a.id, id, { typical: pct("2"), basis: "concentrate", authority: "literature", source: "Fraterworks" });
  await setHave(db, a.id, id, true);

  await waitFor(async () => (await copy.getUploadQueueStats()).count === 0);

  const [m] = await admin`select owner_id, name, kind, aliases, solvent, purity::text as purity, family from materials where id = ${id}`;
  expect(m).toEqual({
    owner_id: a.id,
    name: `${TAG} Mi base`,
    kind: "composition",
    aliases: ["MB", "base de A"],
    solvent: true,
    purity: "0.000000000000000000000000000001",
    family: "woody",
  });
  const [c] = await admin`select owner_id, component_id, amount_kind, min::text as min, max::text as max from material_components where material_id = ${id}`;
  expect(c).toEqual({ owner_id: a.id, component_id: common, amount_kind: "range", min: "0.01", max: "0.025" });
  const [r] = await admin`select owner_id, max_value::text as max_value from regulations where material_id = ${id}`;
  expect(r).toEqual({ owner_id: a.id, max_value: "0.000082" });
  const [d] = await admin`select owner_id, typical::text as typical, disputed from material_doses where material_id = ${id}`;
  expect(d).toEqual({ owner_id: a.id, typical: "0.02", disputed: false });
  const have = await admin`select user_id from lab_materials where material_id = ${id}`;
  expect(have).toEqual([{ user_id: a.id }]);
  expect(await copy.getAll("select * from upload_rejections")).toEqual([]);
});
