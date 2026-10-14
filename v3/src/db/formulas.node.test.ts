import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { compose } from "../core/compose";
import { addEvent, createFormula, createWorkbench, loadFormula, loadFormulas } from "./formulas";
import { AppSchema, tables } from "./local/schema";
import { createMaterial, loadCatalog, type LocalDb } from "./materials";
import { timeOf, uuidv7 } from "./uuid7";

/**
 * Plan v3, steps 7.1 and 7.2, without network: workbenches, formulas and their histories on the
 * copy, read back as the engine's formula. The sync and the RLS are db-tests/formulas.test.ts.
 */

const ME = "11111111-1111-4111-8111-111111111111";
const SOMEONE = "22222222-2222-4222-8222-222222222222";
const LINALOOL = "33333333-3333-4333-8333-333333333333";
const DPG = "44444444-4444-4444-8444-444444444444";
const THEIRS = "55555555-5555-4555-8555-555555555555";

let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;
const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100n));
const MG = 1000n;

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-formulas-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "formulas.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  await copy.execute("insert into materials (id, owner_id, name, kind, solvent, aliases, other_cas, disputed_fields) values (?, null, 'Linalool', 'molecule', 0, '[]', '[]', '[]')", [LINALOOL]);
  await copy.execute("insert into materials (id, owner_id, name, kind, solvent, aliases, other_cas, disputed_fields) values (?, null, 'DPG', 'molecule', 1, '[]', '[]', '[]')", [DPG]);
  await copy.execute("insert into materials (id, owner_id, name, kind, solvent, aliases, other_cas, disputed_fields) values (?, ?, 'Su base', 'composition', 0, '[]', '[]', '[]')", [THEIRS, SOMEONE]);
});

afterAll(async () => {
  await copy.close();
  rmSync(folder, { recursive: true, force: true });
});

describe("a UUID v7 orders a history by the time it was made (7.2)", () => {
  it("sorted as text, ids follow their time; within a millisecond, the counter", () => {
    const ids = [uuidv7(1_000), uuidv7(1_000), uuidv7(1_000), uuidv7(2_000)];
    expect([...ids].sort()).toEqual(ids);
    expect(timeOf(ids[3])).toBe(2_000);
    expect(ids[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("workbenches and formulas (7.1, V3-19, V3-20)", () => {
  it("every formula lives in a workbench; a version is born in its mother's", async () => {
    const bench = await createWorkbench(db, ME, { name: "Perfume para mi padre" });
    const mother = await createFormula(db, ME, { name: "Corazón v1", workbenchId: bench, markers: ["accord"], role: "corazón" });
    const daughter = await createFormula(db, ME, { name: "Corazón v2", parentId: mother });
    const all = await loadFormulas(db, ME);
    expect(all.find((f) => f.id === daughter)).toMatchObject({ workbenchId: bench, parentId: mother });
    expect(all.find((f) => f.id === mother)).toMatchObject({ markers: ["accord"], role: "corazón" });
  });

  it("refuses what Supabase would refuse", async () => {
    const bench = await createWorkbench(db, ME, { name: "Otro" });
    const other = await createWorkbench(db, ME, { name: "Y otro" });
    const mother = await createFormula(db, ME, { name: "Madre", workbenchId: bench });
    await expect(createFormula(db, ME, { name: "Sin banco" })).rejects.toThrow();
    await expect(createFormula(db, ME, { name: "Hija fuera", parentId: mother, workbenchId: other })).rejects.toThrow();
    await expect(createFormula(db, ME, { name: "Marca rara", workbenchId: bench, markers: ["heart" as never] })).rejects.toThrow();
    await expect(createFormula(db, SOMEONE, { name: "En banco ajeno", workbenchId: bench })).rejects.toThrow();
    await expect(createWorkbench(db, ME, { name: "  " })).rejects.toThrow();
  });
});

describe("a history, read back as the engine's formula (7.2)", () => {
  it("in the order of its ids, and compose() gives its composition", async () => {
    const bench = await createWorkbench(db, ME, { name: "Pruebas" });
    const f = await createFormula(db, ME, { name: "Linalool en DPG", workbenchId: bench, workBatchUg: 2000n * MG });
    const mine = await createMaterial(db, ME, { name: "Mi acorde provisional", kind: "provisional" });
    const pour = await addEvent(db, ME, f, { kind: "add", materialId: LINALOOL, massUg: 1000n * MG, fraction: pct("10"), diluentId: DPG });
    await addEvent(db, ME, f, { kind: "add", materialId: mine, massUg: 500n * MG, fraction: Ratio.ONE, diluentId: null });
    await addEvent(db, ME, f, { kind: "set_mass", target: pour, massUg: 1500n * MG });
    await addEvent(db, ME, f, { kind: "note", text: "primera prueba" });

    const formula = await loadFormula(db, await loadCatalog(db, ME), ME, f);
    expect(formula.header).toMatchObject({ name: "Linalool en DPG", workBatchUg: 2000n * MG, container: null });
    expect(formula.history.map((c) => c.kind)).toEqual(["add", "add", "set-mass", "note"]);
    const composition = compose(formula);
    const mass = (key: string) => composition.parts.find((p) => p.material.key === key)?.massUg.toString();
    // 1.5 g at 10 % in DPG: 150 mg of linalool and 1350 mg of DPG; and 500 mg of the provisional.
    expect(mass(LINALOOL)).toBe((150n * MG).toString());
    expect(mass(DPG)).toBe((1350n * MG).toString());
    expect(mass(mine)).toBe((500n * MG).toString());
  });

  it("refuses an event Supabase would refuse", async () => {
    const bench = await createWorkbench(db, ME, { name: "Rechazos" });
    const f = await createFormula(db, ME, { name: "F", workbenchId: bench });
    const g = await createFormula(db, ME, { name: "G", workbenchId: bench });
    const pourInG = await addEvent(db, ME, g, { kind: "add", materialId: LINALOOL, massUg: MG, fraction: Ratio.ONE, diluentId: null });
    const note = await addEvent(db, ME, f, { kind: "note", text: "x" });
    const add = (e: Parameters<typeof addEvent>[3]) => addEvent(db, ME, f, e);
    await expect(add({ kind: "add", materialId: LINALOOL, massUg: 0n, fraction: Ratio.ONE, diluentId: null })).rejects.toThrow();
    await expect(add({ kind: "add", materialId: LINALOOL, massUg: MG, fraction: pct("10"), diluentId: null })).rejects.toThrow();
    await expect(add({ kind: "add", materialId: LINALOOL, massUg: MG, fraction: pct("120"), diluentId: DPG })).rejects.toThrow();
    await expect(add({ kind: "add", materialId: THEIRS, massUg: MG, fraction: Ratio.ONE, diluentId: null })).rejects.toThrow();
    await expect(add({ kind: "set_mass", target: pourInG, massUg: MG })).rejects.toThrow();
    await expect(add({ kind: "remove", target: note })).rejects.toThrow();
    await expect(add({ kind: "reweigh", grossUg: MG, tareUg: MG })).rejects.toThrow();
    await expect(add({ kind: "note", text: " " })).rejects.toThrow();
    await expect(addEvent(db, SOMEONE, f, { kind: "note", text: "ajena" })).rejects.toThrow();
  });
});

describe("a frozen formula comes from its formula, up to the event it was frozen at (V3-49)", () => {
  it("used in another formula, it opens into its parts; what its formula adds later does not change it", async () => {
    const bench = await createWorkbench(db, ME, { name: "Acordes" });
    const accord = await createFormula(db, ME, { name: "Acorde", workbenchId: bench, markers: ["accord"] });
    const pour = await addEvent(db, ME, accord, { kind: "add", materialId: LINALOOL, massUg: 400n * MG, fraction: Ratio.of(1n, 4n), diluentId: DPG });
    const frozen = crypto.randomUUID();
    await copy.execute(
      "insert into materials (id, owner_id, name, kind, solvent, aliases, other_cas, disputed_fields, source_formula_id, source_event_id) values (?, ?, 'Acorde congelado', 'frozen', 0, '[]', '[]', '[]', ?, ?)",
      [frozen, ME, accord, pour],
    );
    // After freezing, the accord's formula goes on: the frozen one does not follow.
    await addEvent(db, ME, accord, { kind: "add", materialId: DPG, massUg: 700n * MG, fraction: Ratio.ONE, diluentId: null });
    const perfume = await createFormula(db, ME, { name: "Perfume", workbenchId: bench });
    await addEvent(db, ME, perfume, { kind: "add", materialId: frozen, massUg: 900n * MG, fraction: Ratio.ONE, diluentId: null });

    const parts = compose(await loadFormula(db, await loadCatalog(db, ME), ME, perfume)).parts.map((p) => [p.material.key, p.massUg.toString()]);
    // 900 mg of an accord that was 1/4 linalool and 3/4 DPG.
    expect(parts).toEqual([[DPG, (675n * MG).toString()], [LINALOOL, (225n * MG).toString()]]);
  });
});
