import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { SupabaseConnector } from "../src/db/connector";
import { Ratio } from "../src/core/arith/ratio";
import { compose } from "../src/core/compose";
import { archiveBottle, createBottle, updateBottle } from "../src/db/dilutions";
import { addEvent, createFormula, createWorkbench, loadFormula } from "../src/db/formulas";
import { AppSchema, tables } from "../src/db/local/schema";
import { loadCatalog, type LocalDb } from "../src/db/materials";
import { admin, signIn, type TestUser } from "./local";

/**
 * Your bottles (V3-67) from end to end: made, corrected and archived on A's copy through the app's own
 * code, they go up refused nowhere, with as many diluents as they take; and Supabase keeps them A's.
 */

const TAG = "[prueba diluciones]";
const ENDPOINT = "http://127.0.0.1:8080";
let a: TestUser;
let b: TestUser;
let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;
let labdanum: string;
let dpg: string;
let eth: string;
let ipm: string;
const G = 1_000_000n;

/** What a run leaves behind, in the order the foreign keys need: formulas, bottles, materials. */
async function cleanUp() {
  await admin`delete from formulas where name like ${TAG + "%"}`;
  await admin`delete from workbenches where name like ${TAG + "%"}`;
  await admin`delete from lab_dilutions where material_id in (select id from materials where name like ${TAG + "%"})`;
  await admin`delete from materials where name like ${TAG + "%"}`;
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

beforeAll(async () => {
  [a, b] = await Promise.all([signIn("A"), signIn("B")]);
  await cleanUp();
  [{ id: labdanum }] = await admin`insert into materials (name, kind) values (${`${TAG} Labdanum`}, 'natural') returning id`;
  [{ id: dpg }] = await admin`insert into materials (name, kind, solvent) values (${`${TAG} DPG`}, 'molecule', true) returning id`;
  [{ id: eth }] = await admin`insert into materials (name, kind, solvent) values (${`${TAG} Etanol`}, 'molecule', true) returning id`;
  [{ id: ipm }] = await admin`insert into materials (name, kind, solvent) values (${`${TAG} IPM`}, 'molecule', true) returning id`;
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-dilutions-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "dilutions.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  await copy.connect(new SupabaseConnector(a.db, () => ENDPOINT));
  await waitFor(async () => (await loadCatalog(db, a.id)).materials.has(ipm));
});

afterAll(async () => {
  await copy?.disconnectAndClear();
  await copy?.close();
  rmSync(folder, { recursive: true, force: true });
  await cleanUp();
  await admin.end();
});

it("a bottle with three diluents, one made from it, corrected and archived: all goes up, refused nowhere", async () => {
  const fifty = await createBottle(db, a.id, {
    materialId: labdanum,
    label: "al 50 %",
    materialUg: 5n * G,
    diluents: [{ diluentId: eth, massUg: 3n * G }, { diluentId: ipm, massUg: 1n * G }, { diluentId: dpg, massUg: 1n * G }],
  });
  const ten = await createBottle(db, a.id, { materialId: labdanum, label: "al 10 %", materialUg: 2n * G, sourceDilutionId: fifty, diluents: [{ diluentId: dpg, massUg: 8n * G }] });
  await updateBottle(db, a.id, ten, { materialId: labdanum, label: "al 10 %", materialUg: 2_010_000n, sourceDilutionId: fifty, diluents: [{ diluentId: dpg, massUg: 8n * G }] });
  await archiveBottle(db, a.id, fifty, true);
  const rows = await waitFor(async () => {
    const r = await admin`select d.id, d.fraction::text, d.archived_at is not null as archived, count(x.id)::int as diluents
      from lab_dilutions d left join lab_dilution_diluents x on x.dilution_id = d.id where d.material_id = ${labdanum} group by d.id`;
    return r.length === 2 && r.find((x) => x.id === ten)?.fraction === "0.1004" && r.some((x) => x.archived) ? r : null;
  });
  expect(rows.find((x) => x.id === fifty)).toMatchObject({ fraction: "0.5", archived: true, diluents: 3 });
  expect(rows.find((x) => x.id === ten)).toMatchObject({ diluents: 3 });
  const shares = await admin`select (sum(fraction) = 0.8996) as s from lab_dilution_diluents where dilution_id = ${ten}`;
  expect(shares[0].s).toBe(true);
  expect(await copy.getAll("select * from upload_rejections")).toEqual([]);
});

it("B sees none of A's bottles, cannot hang a diluent on one, nor make one from it", async () => {
  const [{ id }] = await admin`select id from lab_dilutions where material_id = ${labdanum} limit 1`;
  const { data } = await b.db.from("lab_dilution_diluents").select("id").eq("dilution_id", id);
  expect(data).toEqual([]);
  const hang = await b.db.from("lab_dilution_diluents").insert({ dilution_id: id, diluent_id: dpg, fraction: "0.5", position: 9 });
  expect(["23514", "42501"]).toContain(hang.error?.code);
  const from = await b.db.from("lab_dilutions").insert({ material_id: labdanum, fraction: "0.1", source_dilution_id: id });
  expect(["23514", "42501"]).toContain(from.error?.code);
});

it("a diluent is a common material or yours, and its share is below the whole", async () => {
  const [{ id }] = await admin`select id from lab_dilutions where material_id = ${labdanum} limit 1`;
  await expect(admin`insert into lab_dilution_diluents (dilution_id, user_id, diluent_id, fraction, position) values (${id}, ${a.id}, ${eth}, 1, 0)`).rejects.toMatchObject({ code: "23514" });
});

it("a pour with three diluents, from one of your bottles, goes up whole and is read back the same (V3-67)", async () => {
  const workbench = await createWorkbench(db, a.id, { name: `${TAG} banco` });
  const formula = await createFormula(db, a.id, { name: `${TAG} fórmula`, workbenchId: workbench });
  const [{ id: bottle }] = await admin`select id from lab_dilutions where material_id = ${labdanum} and archived_at is null`;
  const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));
  const event = await addEvent(db, a.id, formula, {
    kind: "add",
    materialId: labdanum,
    massUg: G,
    fraction: pct("10"),
    diluentId: dpg,
    secondDiluent: { materialId: eth, fraction: pct("30") },
    moreDiluents: [{ materialId: ipm, fraction: pct("20") }],
    dilutionId: bottle,
  });
  const [up] = await waitFor(async () => {
    const r = await admin`select e.dilution_id, x.position, x.fraction::text from formula_events e join formula_event_diluents x on x.event_id = e.id where e.id = ${event}`;
    return r.length ? r : null;
  });
  expect(up).toEqual({ dilution_id: bottle, position: 3, fraction: "0.2" });
  const f = await loadFormula(db, await loadCatalog(db, a.id), a.id, formula);
  const [line] = compose(f).lines;
  expect(line.moreDiluents?.map((d) => d.fraction.toString())).toEqual(["1/5"]);
  expect(compose(f).parts.find((p) => p.material.key === dpg)?.massUg.eq(Ratio.of(400_000n))).toBe(true);
  expect(await copy.getAll("select * from upload_rejections")).toEqual([]);
  // B can neither read it nor hang a diluent on it; nobody changes it.
  const { data } = await b.db.from("formula_event_diluents").select("id").eq("event_id", event);
  expect(data).toEqual([]);
  const hang = await b.db.from("formula_event_diluents").insert({ id: crypto.randomUUID(), event_id: event, position: 4, diluent_id: dpg, fraction: "0.01" });
  expect(["23514", "42501"]).toContain(hang.error?.code);
  await expect(admin`update formula_event_diluents set fraction = 0.3 where event_id = ${event}`).rejects.toMatchObject({ code: "23514" });
});
