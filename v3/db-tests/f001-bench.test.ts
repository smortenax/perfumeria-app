import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { Ratio } from "../src/core/arith/ratio";
import { compose } from "../src/core/compose";
import { formatPercent } from "../src/core/display";
import { F001_LINES, f001 } from "../src/core/fixtures/f001";
import { eventOf } from "../src/bench/events";
import { v3IdOf } from "../src/bench/v3-repository";
import { SupabaseConnector } from "../src/db/connector";
import { addEvent, createFormula, createWorkbench, deleteFormula, deleteWorkbench, FormulaInUse, freezeFormula, loadFormula, loadFormulas, loadFrozen, loadWorkbenches, moveFormula, renameWorkbench, usesOfFormula } from "../src/db/formulas";
import { AppSchema, tables } from "../src/db/local/schema";
import { createMaterial, loadCatalog, type LocalDb } from "../src/db/materials";
import { admin, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 8.2, «hecho cuando»: the F-001 made again from nothing, by the way the workbench
 * writes it (each pour, the event of eventOf, with the bar's diluents as the common ones), gives the
 * numbers of the notebook. Its materials are provisional ones of A's: the numbers do not depend on them.
 * And step 8.5: a formula saved as a material does not change when the formula does.
 */

const TAG = "[prueba 8.2]";
const ENDPOINT = "http://127.0.0.1:8080";
let a: TestUser;
let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;

async function waitFor<T>(probe: () => Promise<T | null | undefined | false>): Promise<T> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    const found = await probe();
    if (found) return found;
    if (Date.now() > deadline) throw new Error("timed out waiting for the sync");
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

async function cleanUp(): Promise<void> {
  // The pours of a frozen formula first (they hold it), then the frozen formulas (they hold their formula and its event).
  await admin`delete from formula_events where material_id in (select id from materials where name like ${TAG + "%"} and kind = 'frozen')`;
  await admin`delete from materials where name like ${TAG + "%"} and kind = 'frozen'`;
  await admin`delete from formulas where name like ${TAG + "%"}`;
  await admin`delete from workbenches where name like ${TAG + "%"}`;
  await admin`delete from materials where name like ${TAG + "%"}`;
}

beforeAll(async () => {
  a = await signIn("A");
  await cleanUp();
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-f001-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "f001.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  await copy.connect(new SupabaseConnector(a.db, () => ENDPOINT));
  // The common diluents, downloaded.
  await waitFor(async () => [...(await loadCatalog(db, a.id)).materials.values()].some((m) => m.solvent && /^dpg/i.test(m.name)));
});

afterAll(async () => {
  // What went up, all of it, before it is cleaned up: nothing arrives after.
  await waitFor(async () => (await copy.getUploadQueueStats()).count === 0).catch(() => undefined);
  await copy?.disconnectAndClear();
  await copy?.close();
  rmSync(folder, { recursive: true, force: true });
  await cleanUp();
  await admin.end();
});

it("the F-001, poured again in the workbench's way, weighs as the notebook", async () => {
  const bench = await createWorkbench(db, a.id, { name: `${TAG} banco` });
  const formulaId = await createFormula(db, a.id, { name: `${TAG} Lejía`, workbenchId: bench });
  const made = new Map<string, string>();
  for (const change of f001().history) {
    if (change.kind !== "add" || change.material.key.startsWith("solv:")) continue;
    made.set(change.material.key, await createMaterial(db, a.id, { name: `${TAG} ${change.material.name}`, kind: "provisional" }));
  }
  const catalog = await loadCatalog(db, a.id);
  const common = v3IdOf({ catalog });
  const idOf = (key: string) => made.get(key) ?? common(key);
  for (const change of f001().history) await addEvent(db, a.id, formulaId, eventOf(change, idOf));

  const c = compose(await loadFormula(db, catalog, a.id, formulaId));
  const partOf = (id: string) => c.parts.find((p) => p.material.key === id)?.massUg ?? Ratio.ZERO;
  expect(c.totalUg.eq(Ratio.of(8_745_000))).toBe(true);
  expect(c.aromaticUg.eq(Ratio.of(2_451_900))).toBe(true);
  expect(formatPercent(c.aromaticUg.div(c.totalUg), 2)).toBe("28,04 %");
  for (const [name, labId, , , , pureGrams, percent] of F001_LINES) {
    if (labId === "alcohol") continue;
    const id = made.get(`lab:${labId}`)!;
    expect(partOf(id).eq(Ratio.fromDecimal(pureGrams).mul(Ratio.of(1_000_000))), name).toBe(true);
    expect(formatPercent(partOf(id).div(c.totalUg)), name).toBe(`${percent} %`);
  }
  expect(partOf(common("solv:dpg")).eq(Ratio.of(724_600))).toBe(true);
  expect(formatPercent(partOf(common("solv:dpg")).div(c.totalUg), 2)).toBe("8,29 %");
  expect(partOf(common("solv:alcohol")).eq(Ratio.of(5_568_500))).toBe(true);
  expect(formatPercent(partOf(common("solv:alcohol")).div(c.totalUg), 2)).toBe("63,68 %");
});

it("a formula saved as a material keeps what it was: changing the formula after does not change it (8.5)", async () => {
  const bench = await createWorkbench(db, a.id, { name: `${TAG} banco del acorde` });
  const formulaId = await createFormula(db, a.id, { name: `${TAG} Corazón`, workbenchId: bench });
  const rose = await createMaterial(db, a.id, { name: `${TAG} Rosa`, kind: "provisional" });
  const musk = await createMaterial(db, a.id, { name: `${TAG} Almizcle`, kind: "provisional" });
  await addEvent(db, a.id, formulaId, { kind: "add", materialId: rose, massUg: 300n, fraction: Ratio.ONE, diluentId: null });
  const second = await addEvent(db, a.id, formulaId, { kind: "add", materialId: musk, massUg: 700n, fraction: Ratio.ONE, diluentId: null });
  const frozen = await freezeFormula(db, a.id, formulaId, { name: `${TAG} Corazón congelado` });
  // Afterwards, the formula changes: more rose, and the musk taken away.
  await addEvent(db, a.id, formulaId, { kind: "add", materialId: rose, massUg: 500n, fraction: Ratio.ONE, diluentId: null });
  await addEvent(db, a.id, formulaId, { kind: "remove", target: second });

  const catalog = await loadCatalog(db, a.id);
  const { materials, failed } = await loadFrozen(db, catalog, a.id, [frozen]);
  expect(failed.size).toBe(0);
  const share = new Map(materials[0].vector!.components.map((c) => [c.material.key, c.proportion]));
  expect(share.size).toBe(2);
  expect(share.get(rose)?.eq(Ratio.of(3n, 10n))).toBe(true);
  expect(share.get(musk)?.eq(Ratio.of(7n, 10n))).toBe(true);
  // And Supabase takes it as it is (V3-49: its formula and its event, both of A's).
  await waitFor(async () => (await copy.getUploadQueueStats()).count === 0);
  expect(await copy.getAll("select * from upload_rejections")).toEqual([]);
  const [row] = await admin`select kind, source_formula_id from materials where id = ${frozen}`;
  expect(row).toMatchObject({ kind: "frozen", source_formula_id: formulaId });
});

it("a formula moves to another workbench with its versions, and Supabase takes it (8.1b)", async () => {
  const from = await createWorkbench(db, a.id, { name: `${TAG} banco de origen` });
  const to = await createWorkbench(db, a.id, { name: `${TAG} banco de destino` });
  const mother = await createFormula(db, a.id, { name: `${TAG} madre`, workbenchId: from });
  const version = await createFormula(db, a.id, { name: `${TAG} madre v2`, parentId: mother });
  const other = await createFormula(db, a.id, { name: `${TAG} otra`, workbenchId: from });
  expect(await moveFormula(db, a.id, mother, to)).toBe(2);
  const bench = new Map((await loadFormulas(db, a.id)).map((f) => [f.id, f.workbenchId]));
  expect([bench.get(mother), bench.get(version), bench.get(other)]).toEqual([to, to, from]);
  await waitFor(async () => (await copy.getUploadQueueStats()).count === 0);
  expect(await copy.getAll("select * from upload_rejections")).toEqual([]);
  const rows = await admin`select id, workbench_id from formulas where id in (${mother}, ${version})`;
  expect(rows.map((r) => r.workbench_id)).toEqual([to, to]);
});

it("a formula is deleted with its history and its versions stay; one saved as a material is not; an empty workbench goes; and the heart says where it is used (8.1b)", async () => {
  const bench = await createWorkbench(db, a.id, { name: `${TAG} banco para borrar` });
  const rose = await createMaterial(db, a.id, { name: `${TAG} Rosa para borrar`, kind: "provisional" });
  const mother = await createFormula(db, a.id, { name: `${TAG} madre para borrar`, workbenchId: bench });
  const version = await createFormula(db, a.id, { name: `${TAG} su versión`, parentId: mother });
  await addEvent(db, a.id, mother, { kind: "add", materialId: rose, massUg: 100n, fraction: Ratio.ONE, diluentId: null });
  const heart = await createFormula(db, a.id, { name: `${TAG} corazón para usar`, workbenchId: bench });
  await addEvent(db, a.id, heart, { kind: "add", materialId: rose, massUg: 100n, fraction: Ratio.ONE, diluentId: null });
  const frozen = await freezeFormula(db, a.id, heart, { name: `${TAG} Corazón usado` });
  await addEvent(db, a.id, version, { kind: "add", materialId: frozen, massUg: 50n, fraction: Ratio.ONE, diluentId: null });

  let catalog = await loadCatalog(db, a.id);
  expect(await usesOfFormula(db, catalog, a.id, heart)).toEqual([{ material: `${TAG} Corazón usado`, formulaIds: [version] }]);
  await expect(deleteFormula(db, catalog, a.id, heart)).rejects.toBeInstanceOf(FormulaInUse);

  await deleteFormula(db, catalog, a.id, mother);
  const left = new Map((await loadFormulas(db, a.id)).map((f) => [f.id, f]));
  expect(left.has(mother)).toBe(false);
  expect(left.get(version)?.parentId).toBeNull();
  catalog = await loadCatalog(db, a.id);
  expect((await loadFormula(db, catalog, a.id, version)).history).toHaveLength(1);

  await renameWorkbench(db, a.id, bench, `${TAG} banco renombrado`);
  expect((await loadWorkbenches(db, a.id)).find((w) => w.id === bench)?.name).toBe(`${TAG} banco renombrado`);
  await expect(deleteWorkbench(db, a.id, bench)).rejects.toThrow(/formulas/);
  const empty = await createWorkbench(db, a.id, { name: `${TAG} banco vacío` });
  await deleteWorkbench(db, a.id, empty);

  await waitFor(async () => (await copy.getUploadQueueStats()).count === 0);
  expect(await copy.getAll("select * from upload_rejections")).toEqual([]);
  expect(await admin`select id from formulas where id = ${mother}`).toEqual([]);
  expect(await admin`select id from formula_events where formula_id = ${mother}`).toEqual([]);
  expect(await admin`select id from workbenches where id = ${empty}`).toEqual([]);
  const [v] = await admin`select parent_id from formulas where id = ${version}`;
  expect(v.parent_id).toBeNull();
});
