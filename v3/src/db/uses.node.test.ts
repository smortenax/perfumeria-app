import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { addEvent, createFormula, createWorkbench } from "./formulas";
import { AppSchema, tables } from "./local/schema";
import { createVersion, loadCatalog, type LocalDb } from "./materials";
import { formulasUsing } from "./uses";

/** «Used in» (F18), on the copy without network. */

const ME = "11111111-1111-4111-8111-111111111111";
const LINALOOL = "33333333-3333-4333-8333-333333333333";
const DPG = "44444444-4444-4444-8444-444444444444";
const OTHER = "55555555-5555-4555-8555-555555555555";
const G = 1_000_000n;
let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-uses-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "uses.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  const add = "insert into materials (id, owner_id, name, kind, solvent, aliases, other_cas, disputed_fields) values (?, null, ?, 'molecule', ?, '[]', '[]', '[]')";
  await copy.execute(add, [LINALOOL, "Linalool", 0]);
  await copy.execute(add, [DPG, "DPG", 1]);
  await copy.execute(add, [OTHER, "Hedione", 0]);
});

afterAll(async () => {
  await copy.close();
  rmSync(folder, { recursive: true, force: true });
});

it("the formulas that carry it, by the common one or your specification; not a removed pour; a diluent counts", async () => {
  const mine = await createVersion(db, ME, LINALOOL);
  const bench = await createWorkbench(db, ME, { name: "Bench" });
  const byCommon = await createFormula(db, ME, { name: "A", workbenchId: bench });
  const bySpec = await createFormula(db, ME, { name: "B", workbenchId: bench });
  const accord = await createFormula(db, ME, { name: "Accord", workbenchId: bench, markers: ["accord"] });
  const removed = await createFormula(db, ME, { name: "C", workbenchId: bench });
  await addEvent(db, ME, byCommon, { kind: "add", materialId: LINALOOL, massUg: G, fraction: Ratio.ONE, diluentId: null });
  await addEvent(db, ME, bySpec, { kind: "add", materialId: mine, massUg: G, fraction: Ratio.fromDecimal("0.1"), diluentId: DPG });
  await addEvent(db, ME, accord, { kind: "add", materialId: OTHER, massUg: G, fraction: Ratio.ONE, diluentId: null });
  await addEvent(db, ME, accord, { kind: "add", materialId: LINALOOL, massUg: G, fraction: Ratio.ONE, diluentId: null });
  const pour = await addEvent(db, ME, removed, { kind: "add", materialId: LINALOOL, massUg: G, fraction: Ratio.ONE, diluentId: null });
  await addEvent(db, ME, removed, { kind: "remove", target: pour });
  const catalog = await loadCatalog(db, ME);
  const sorted = async (id: string) => (await formulasUsing(db, catalog, ME, id)).sort();
  expect(await sorted(LINALOOL)).toEqual([byCommon, bySpec, accord].sort());
  expect(await sorted(mine)).toEqual([byCommon, bySpec, accord].sort());
  expect(await sorted(OTHER)).toEqual([accord]);
  expect(await sorted(DPG)).toEqual([bySpec]);
});
