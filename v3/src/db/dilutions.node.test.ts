import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { archiveBottle, createBottle, describeBottle, updateBottle } from "./dilutions";
import { AppSchema, tables } from "./local/schema";
import { loadCatalog, type LocalDb } from "./materials";

/** Your bottles on the copy, without network (V3-67). The sync and the RLS: db-tests/dilutions.test.ts. */

const ME = "11111111-1111-4111-8111-111111111111";
const LABDANUM = "33333333-3333-4333-8333-333333333333";
const DPG = "44444444-4444-4444-8444-444444444444";
const ETH = "55555555-5555-4555-8555-555555555555";
const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));
const G = 1_000_000n;

let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-dilutions-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "dilutions.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  const add = "insert into materials (id, owner_id, name, kind, solvent, aliases, other_cas, disputed_fields) values (?, ?, ?, ?, ?, '[]', '[]', '[]')";
  await copy.execute(add, [LABDANUM, ME, "Labdanum", "natural", 0]);
  await copy.execute(add, [DPG, null, "DPG", "molecule", 1]);
  await copy.execute(add, [ETH, null, "Etanol", "molecule", 1]);
});

afterAll(async () => {
  await copy.close();
  rmSync(folder, { recursive: true, force: true });
});

it("a bottle aimed at 10 % that came out 9,67 % keeps 9,67 %, with its diluents in order", async () => {
  const id = await createBottle(db, ME, { materialId: LABDANUM, label: "al 10 %", materialUg: 967_000n, diluents: [{ diluentId: DPG, massUg: 9_033_000n }] });
  const [b] = (await loadCatalog(db, ME)).dilutions.get(LABDANUM)!;
  expect(b.id).toBe(id);
  expect(b.fraction.eq(pct("9.67"))).toBe(true);
  expect(b.label).toBe("al 10 %");
  expect(b.diluents.map((d) => [d.diluentId, d.fraction.toString(), d.massUg])).toEqual([[DPG, pct("90.33").toString(), 9_033_000n]]);
});

it("three diluents, and a 10 % made from the 50 %", async () => {
  const fifty = await createBottle(db, ME, {
    materialId: LABDANUM,
    label: "al 50 %",
    materialUg: 5n * G,
    diluents: [{ diluentId: ETH, massUg: 3n * G }, { diluentId: DPG, massUg: 2n * G }],
  });
  const ten = await createBottle(db, ME, { materialId: LABDANUM, materialUg: 2n * G, sourceDilutionId: fifty, diluents: [{ diluentId: DPG, massUg: 8n * G }] });
  const b = (await loadCatalog(db, ME)).dilutions.get(LABDANUM)!.find((d) => d.id === ten)!;
  expect(b.fraction.eq(pct("10"))).toBe(true);
  expect(b.sourceDilutionId).toBe(fifty);
  expect(Object.fromEntries(b.diluents.map((d) => [d.diluentId, d.fraction.toString()]))).toEqual({ [ETH]: pct("6").toString(), [DPG]: pct("84").toString() });
});

it("weights can be corrected (V3-67, 5a); a bottle is archived, not deleted", async () => {
  const id = await createBottle(db, ME, { materialId: LABDANUM, materialUg: 1n * G, diluents: [{ diluentId: DPG, massUg: 9n * G }] });
  await updateBottle(db, ME, id, { materialId: LABDANUM, materialUg: 1_030_000n, diluents: [{ diluentId: DPG, massUg: 9n * G }] });
  await archiveBottle(db, ME, id, true);
  const b = (await loadCatalog(db, ME)).dilutions.get(LABDANUM)!.find((d) => d.id === id)!;
  expect(b.fraction.eq(pct("10.2692"))).toBe(true);
  expect(b.archivedAt).not.toBeNull();
  expect(b.diluents).toHaveLength(1);
});

it("refuses a diluent that is not one, a material that is not yours, and a source of another material", async () => {
  await expect(createBottle(db, ME, { materialId: LABDANUM, materialUg: G, diluents: [{ diluentId: LABDANUM, massUg: G }] })).rejects.toThrow(/not a diluent/);
  await expect(createBottle(db, "someone", { materialId: LABDANUM, materialUg: G, diluents: [{ diluentId: DPG, massUg: G }] })).rejects.toThrow(/common material or yours/);
  await expect(createBottle(db, ME, { materialId: LABDANUM, materialUg: G, diluents: [] })).rejects.toThrow(/at least one diluent/);
});

it("a bottle's name, date and note change without touching what it holds", async () => {
  const id = await createBottle(db, ME, { materialId: LABDANUM, materialUg: 997_000n, diluents: [{ diluentId: DPG, massUg: 9_003_000n }] });
  await describeBottle(db, ME, id, { label: "al 10 % (nuevo)", madeOn: "2026-10-19", description: "frasco ámbar" });
  const b = (await loadCatalog(db, ME)).dilutions.get(LABDANUM)!.find((d) => d.id === id)!;
  expect([b.label, b.madeOn, b.description, b.fraction.toString(), b.diluents.length]).toEqual(["al 10 % (nuevo)", "2026-10-19", "frasco ámbar", pct("9.97").toString(), 1]);
  await expect(describeBottle(db, ME, id, { madeOn: "19/10" })).rejects.toThrow(/date/);
});
