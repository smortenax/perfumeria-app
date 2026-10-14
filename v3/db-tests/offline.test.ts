import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { Ratio } from "../src/core/arith/ratio";
import { SupabaseConnector } from "../src/db/connector";
import { AppSchema, tables } from "../src/db/local/schema";
import { addComponent, createMaterial, createVersion, loadCatalog, setHaveMany, updateMaterial, type LocalDb } from "../src/db/materials";
import { indexCatalog, search } from "../src/db/search";
import { admin, downloadWhen, has, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 6.7 (V3-8, V3-9): with the network cut, A browses, creates and edits its
 * materials and marks what it has, all on its copy; when the network comes back, everything goes
 * up, and another browser of A's (a new copy) gets it.
 */

const TAG = "[prueba 6.7]";
const ENDPOINT = "http://127.0.0.1:8080";
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
  await admin`delete from materials where name like ${TAG + "%"}`;
  [{ id: common }] = await admin`insert into materials (name, kind, cas) values (${`${TAG} Lavanda`}, 'natural', '8000-28-0') returning id`;
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-offline-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "offline.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  // The first time, with network: sign in and download.
  await copy.connect(new SupabaseConnector(a.db, () => ENDPOINT));
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

it("without network A browses, creates, edits and marks; back online, it goes up and another browser gets it", async () => {
  await copy.disconnect();
  expect(copy.currentStatus.connected).toBe(false);

  // Browsing: the catalog and the search, from the copy.
  const offline = await loadCatalog(db, a.id);
  expect(search(indexCatalog(offline), `${TAG} lavanda`)[0]?.members.map((m) => m.material.id)).toContain(common);

  // Creating and editing: a material of A's, a version of the common one, a component, a mark.
  const own = await createMaterial(db, a.id, { name: `${TAG} Mi base`, kind: "composition" });
  await updateMaterial(db, a.id, own, { notes: "escrita sin red" });
  await addComponent(db, a.id, own, { cas: "78-70-6", name: "Linalool" }, { kind: "exact", value: pct("30") }, "product", "certificado");
  const version = await createVersion(db, a.id, common);
  await updateMaterial(db, a.id, version, { supplier: "Maese Lab" });
  expect(await setHaveMany(db, a.id, [version, own], true)).toBe(2);

  const local = await loadCatalog(db, a.id);
  expect(local.materials.get(own)).toMatchObject({ notes: "escrita sin red" });
  expect(local.materials.get(own)!.components).toHaveLength(1);
  expect(local.materials.get(version)).toMatchObject({ basedOnId: common, supplier: "Maese Lab" });
  expect([local.have.has(own), local.have.has(version)]).toEqual([true, true]);
  // Waiting to go up, and nothing in Supabase yet.
  expect((await copy.getUploadQueueStats()).count).toBeGreaterThan(0);
  expect(await admin`select id from materials where id in (${own}, ${version})`).toEqual([]);

  // The network comes back: everything goes up.
  await copy.connect(new SupabaseConnector(a.db, () => ENDPOINT));
  await waitFor(async () => (await copy.getUploadQueueStats()).count === 0);
  expect(await copy.getAll("select * from upload_rejections")).toEqual([]);

  // Another browser of A's, a new copy, gets it all.
  const other = await downloadWhen(a.token, (s) => has(s, "materials", own) && has(s, "materials", version) && (s.get("lab_materials")?.size ?? 0) >= 2);
  expect(other.get("materials")?.get(own)?.notes).toBe("escrita sin red");
  expect(other.get("materials")?.get(version)?.supplier).toBe("Maese Lab");
  expect([...(other.get("material_components")?.values() ?? [])].some((c) => c.material_id === own && c.component_cas === "78-70-6")).toBe(true);
  const marks = [...(other.get("lab_materials")?.values() ?? [])].map((m) => m.material_id);
  expect(marks).toEqual(expect.arrayContaining([own, version]));
});
