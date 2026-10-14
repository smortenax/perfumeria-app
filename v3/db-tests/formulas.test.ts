import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Ratio } from "../src/core/arith/ratio";
import { SupabaseConnector } from "../src/db/connector";
import { addEvent, createFormula, createWorkbench, loadFormula } from "../src/db/formulas";
import { AppSchema, tables } from "../src/db/local/schema";
import { loadCatalog, type LocalDb } from "../src/db/materials";
import { admin, downloadWhen, has, signIn, type TestUser } from "./local";

/**
 * Plan v3, steps 7.1b, 7.2 and 7.3, against the local Supabase and PowerSync, with two users:
 * A does not see B's workbenches or formulas, not even through the sync; A adds no event with B's
 * material, and changes or deletes no event; and two copies of A's, without network, add events to
 * the same formula and, synced, both see the same history.
 */

const TAG = "[prueba 7]";
const ENDPOINT = "http://127.0.0.1:8080";
let a: TestUser;
let b: TestUser;
let common: string;
let bMaterial: string;
let bBench: string;
let bFormula: string;
const REFUSED = ["42501", "23514"];

async function insertAs(user: TestUser, table: string, row: Record<string, unknown>): Promise<{ id?: string; code?: string }> {
  const { data, error } = await user.db.from(table).insert(row).select("id").maybeSingle();
  return error ? { code: error.code } : { id: data?.id };
}

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
  await admin`delete from formulas where name like ${TAG + "%"} and parent_id is not null`;
  await admin`delete from formulas where name like ${TAG + "%"}`;
  await admin`delete from workbenches where name like ${TAG + "%"}`;
  await admin`delete from materials where name like ${TAG + "%"}`;
}

beforeAll(async () => {
  await cleanUp();
  [a, b] = await Promise.all([signIn("A"), signIn("B")]);
  [{ id: common }] = await admin`insert into materials (name, kind) values (${`${TAG} Linalool`}, 'molecule') returning id`;
  bMaterial = (await insertAs(b, "materials", { name: `${TAG} B's base`, kind: "composition", owner_id: b.id })).id!;
  bBench = (await insertAs(b, "workbenches", { name: `${TAG} B's bench`, owner_id: b.id })).id!;
  bFormula = (await insertAs(b, "formulas", { name: `${TAG} B's formula`, owner_id: b.id, workbench_id: bBench })).id!;
  expect([bMaterial, bBench, bFormula].every((x) => x)).toBe(true);
});

afterAll(async () => {
  await cleanUp();
  await admin.end();
});

describe("A sees nothing of B's (7.1b, 7.3)", () => {
  it("not in the database, nor through the sync", async () => {
    expect((await a.db.from("workbenches").select("id").eq("id", bBench)).data).toEqual([]);
    expect((await a.db.from("formulas").select("id").eq("id", bFormula)).data).toEqual([]);
    const aBench = (await insertAs(a, "workbenches", { name: `${TAG} A's bench`, owner_id: a.id })).id!;
    const synced = await downloadWhen(a.token, (s) => has(s, "workbenches", aBench));
    expect(has(synced, "workbenches", aBench)).toBe(true);
    expect(has(synced, "workbenches", bBench)).toBe(false);
    expect(has(synced, "formulas", bFormula)).toBe(false);
    const bSynced = await downloadWhen(b.token, (s) => has(s, "formulas", bFormula));
    expect(has(bSynced, "formulas", bFormula)).toBe(true);
    expect(has(bSynced, "workbenches", aBench)).toBe(false);
  });

  it("A cannot put a formula in B's workbench, nor a version of B's formula, nor add to B's history", async () => {
    expect(REFUSED).toContain((await insertAs(a, "formulas", { name: `${TAG} in B's bench`, owner_id: a.id, workbench_id: bBench })).code);
    const aBench = (await insertAs(a, "workbenches", { name: `${TAG} A's other bench`, owner_id: a.id })).id!;
    expect(REFUSED).toContain((await insertAs(a, "formulas", { name: `${TAG} B's daughter`, owner_id: a.id, workbench_id: aBench, parent_id: bFormula })).code);
    expect(REFUSED).toContain((await insertAs(a, "formula_events", { id: crypto.randomUUID(), formula_id: bFormula, kind: "note", text: "x" })).code);
  });
});

describe("a history is A's, with A's or common materials, and only added to (7.3)", () => {
  it("no event with B's material; no event changed or deleted", async () => {
    const bench = (await insertAs(a, "workbenches", { name: `${TAG} A's history bench`, owner_id: a.id })).id!;
    const formula = (await insertAs(a, "formulas", { name: `${TAG} A's formula`, owner_id: a.id, workbench_id: bench })).id!;
    const pour = { id: crypto.randomUUID(), formula_id: formula, kind: "add", mass_ug: 1000, fraction: 1 };
    expect(REFUSED).toContain((await insertAs(a, "formula_events", { ...pour, material_id: bMaterial })).code);
    const added = await insertAs(a, "formula_events", { ...pour, material_id: common });
    expect(added.id).toBe(pour.id);
    // The owner is the formula's, whatever is sent.
    expect(await admin`select owner_id from formula_events where id = ${pour.id}`).toEqual([{ owner_id: a.id }]);
    // Changing or deleting: nothing happens (no policy lets it), and the event is as it was.
    await a.db.from("formula_events").update({ mass_ug: 2000 }).eq("id", pour.id);
    await a.db.from("formula_events").delete().eq("id", pour.id);
    expect(await admin`select mass_ug::text from formula_events where id = ${pour.id}`).toEqual([{ mass_ug: "1000" }]);
    // Not even the loading script changes one.
    await expect(admin`update formula_events set mass_ug = 2000 where id = ${pour.id}`).rejects.toMatchObject({ code: "23514" });
    // A change points at a pour of the same formula; each kind carries what it needs.
    expect(REFUSED).toContain((await insertAs(a, "formula_events", { id: crypto.randomUUID(), formula_id: formula, kind: "remove", target: crypto.randomUUID() })).code);
    expect(REFUSED).toContain((await insertAs(a, "formula_events", { id: crypto.randomUUID(), formula_id: formula, kind: "add", material_id: common, mass_ug: 1000, fraction: 0.1 })).code);
    // Deleting the formula takes its history with it.
    await a.db.from("formulas").delete().eq("id", formula);
    expect(await admin`select id from formula_events where id = ${pour.id}`).toEqual([]);
  });
});

describe("two copies without network, one history (7.2)", () => {
  const folders: string[] = [];
  const copies: PowerSyncDatabase[] = [];
  const open = async (name: string): Promise<[PowerSyncDatabase, LocalDb]> => {
    const folder = mkdtempSync(join(tmpdir(), `perfumeria-v3-${name}-`));
    folders.push(folder);
    const copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: `${name}.sqlite`, dbLocation: folder } });
    copies.push(copy);
    await copy.connect(new SupabaseConnector(a.db, () => ENDPOINT));
    return [copy, wrapPowerSyncWithDrizzle(copy, { schema: tables })];
  };

  afterAll(async () => {
    for (const copy of copies) {
      await copy.disconnectAndClear();
      await copy.close();
    }
    for (const folder of folders) rmSync(folder, { recursive: true, force: true });
  });

  it("each adds its events offline; synced, both see the same history, in the same order", async () => {
    const [one, db1] = await open("one");
    const [two, db2] = await open("two");
    const bench = await createWorkbench(db1, a.id, { name: `${TAG} two copies` });
    const formula = await createFormula(db1, a.id, { name: `${TAG} shared formula`, workbenchId: bench });
    await waitFor(async () => (await one.getUploadQueueStats()).count === 0);
    await waitFor(async () => (await two.getAll("select id from formulas where id = ?", [formula])).length === 1);
    await waitFor(async () => (await loadCatalog(db2, a.id)).materials.has(common));

    // Both without network: each adds its own, interleaved in time.
    await one.disconnect();
    await two.disconnect();
    const e1 = await addEvent(db1, a.id, formula, { kind: "add", materialId: common, massUg: 1_000_000n, fraction: Ratio.ONE, diluentId: null });
    await new Promise((r) => setTimeout(r, 5));
    const e2 = await addEvent(db2, a.id, formula, { kind: "note", text: "desde la segunda copia" });
    await new Promise((r) => setTimeout(r, 5));
    const e3 = await addEvent(db1, a.id, formula, { kind: "note", text: "desde la primera copia" });

    // Back online: both go up, and both come down to each.
    await one.connect(new SupabaseConnector(a.db, () => ENDPOINT));
    await two.connect(new SupabaseConnector(a.db, () => ENDPOINT));
    const ids = async (copy: PowerSyncDatabase) => (await copy.getAll<{ id: string }>("select id from formula_events where formula_id = ? order by id", [formula])).map((r) => r.id);
    await waitFor(async () => (await ids(one)).length === 3 && (await ids(two)).length === 3);
    expect(await ids(one)).toEqual([e1, e2, e3]);
    expect(await ids(two)).toEqual([e1, e2, e3]);
    // And the engine reads the same formula in both.
    const read = async (db: LocalDb) => (await loadFormula(db, await loadCatalog(db, a.id), a.id, formula)).history.map((c) => [c.id, c.kind]);
    expect(await read(db1)).toEqual(await read(db2));
    expect(await one.getAll("select * from upload_rejections")).toEqual([]);
    expect(await two.getAll("select * from upload_rejections")).toEqual([]);
  });
});
