import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { AppSchema, tables } from "./local/schema";
import type { LocalDb } from "./materials";
import {
  addStrip, closeStrip, setStripBottle, createSession, deleteSession, ensureMoment, loadTastings, removeStrip, revealStrip, saveClosure, setCurve, setFamily, updateMoment,
  writeOpening,
} from "./tastings";

/**
 * The tastings on the copy, without network (V3-60 to V3-63): what the app refuses before it waits in
 * the queue. The sync and what Supabase keeps are db-tests/tastings.test.ts.
 */

const ME = "11111111-1111-4111-8111-111111111111";
const SOMEONE = "22222222-2222-4222-8222-222222222222";
const HEDIONE = "33333333-3333-4333-8333-333333333333";
const THEIRS = "55555555-5555-4555-8555-555555555555";
const MY_DILUTION = "66666666-6666-4666-8666-666666666666";

let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-tastings-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "tastings.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  await copy.execute("insert into materials (id, owner_id, name, kind, solvent, aliases, other_cas, disputed_fields) values (?, null, 'Hedione', 'molecule', 0, '[]', '[]', '[]')", [HEDIONE]);
  await copy.execute("insert into materials (id, owner_id, name, kind, solvent, aliases, other_cas, disputed_fields) values (?, ?, 'Su base', 'composition', 0, '[]', '[]', '[]')", [THEIRS, SOMEONE]);
  await copy.execute("insert into lab_dilutions (id, user_id, material_id, fraction, solvent, made_on) values (?, ?, ?, '0.1', 'DPG', '2026-10-01')", [MY_DILUTION, ME, HEDIONE]);
});

afterAll(async () => {
  await copy.close();
  rmSync(folder, { recursive: true, force: true });
});

it("a session takes four strips at most, each under the next blind label, with its bottle copied", async () => {
  const session = await createSession(db, ME);
  const labels = [];
  for (let i = 0; i < 4; i++) labels.push(await addStrip(db, ME, session, { materialId: HEDIONE, dilutionId: i === 0 ? MY_DILUTION : null }));
  await expect(addStrip(db, ME, session, { materialId: HEDIONE, pure: true })).rejects.toThrow(/four strips/);
  const read = await loadTastings(db, ME);
  expect(read.strips.map((s) => s.blindLabel)).toEqual(["A", "B", "C", "D"]);
  expect(read.strips[0].fraction?.toString()).toBe("1/10");
  expect(read.strips[0].solvent).toBe("DPG");
  expect(read.strips[1].fraction).toBeNull();
  // Taking one out frees its letter.
  await removeStrip(db, ME, labels[1]);
  expect(await addStrip(db, ME, session, { materialId: HEDIONE, pure: true })).toBeTruthy();
  expect((await loadTastings(db, ME)).strips.map((s) => s.blindLabel)).toEqual(["A", "B", "C", "D"]);
  await deleteSession(db, ME, session);
  expect((await loadTastings(db, ME)).strips).toEqual([]);
});

it("a strip is of a material you can see, and of your dilution of that material", async () => {
  const session = await createSession(db, ME);
  await expect(addStrip(db, ME, session, { materialId: THEIRS })).rejects.toThrow(/common material or yours/);
  await expect(addStrip(db, SOMEONE, session, { materialId: HEDIONE, pure: true })).rejects.toThrow(/not one of your/);
  await expect(addStrip(db, SOMEONE, (await createSession(db, SOMEONE)), { materialId: HEDIONE, dilutionId: MY_DILUTION })).rejects.toThrow(/dilutions/);
  await deleteSession(db, ME, session);
});

it("the opening once; the name after t5; a tab after the opening takes only fixed codes", async () => {
  const session = await createSession(db, ME);
  const strip = await addStrip(db, ME, session, { materialId: HEDIONE, pure: true });
  await expect(ensureMoment(db, ME, strip, "t5")).rejects.toThrow(/first the opening/);
  await expect(revealStrip(db, ME, strip)).rejects.toThrow(/after the opening/);
  await writeOpening(db, ME, strip, "jazmín transparente");
  await expect(writeOpening(db, ME, strip, "otra")).rejects.toThrow(/written once/);
  const t0 = (await loadTastings(db, ME)).moments.find((m) => m.moment === "t0")!;
  await expect(updateMoment(db, ME, t0.id, { text: "corregida" })).rejects.toThrow(/never corrected/);
  // Two touches at once on a new tab make it once (seen in the browser: the second write was lost).
  const [t5, again] = await Promise.all([ensureMoment(db, ME, strip, "t5"), ensureMoment(db, ME, strip, "t5")]);
  expect(again).toBe(t5);
  expect((await loadTastings(db, ME)).moments.filter((m) => m.moment === "t5")).toHaveLength(1);
  expect(await ensureMoment(db, ME, strip, "t5")).toBe(t5);
  await expect(updateMoment(db, ME, t5, { intensity: 6 })).rejects.toThrow(/1 to 5/);
  await expect(setFamily(db, ME, t5, "calkin", "ozonic", true)).rejects.toThrow(/unknown family/);
  await expect(setCurve(db, ME, t5, 5, "mid")).rejects.toThrow(/segment/);
  await revealStrip(db, ME, strip);
  expect((await loadTastings(db, ME)).strips[0].revealedAt).not.toBeNull();
  // A tab begins empty: t30 never copies t5.
  await updateMoment(db, ME, t5, { text: "floral", intensity: 4 });
  const t30 = await ensureMoment(db, ME, strip, "t30");
  const m30 = (await loadTastings(db, ME)).moments.find((m) => m.id === t30)!;
  expect([m30.text, m30.intensity]).toEqual([null, null]);
  await expect(removeStrip(db, ME, strip)).rejects.toThrow(/close it instead/);
  await deleteSession(db, ME, session);
});

it("the comparison only once the series is closed", async () => {
  const session = await createSession(db, ME);
  const strip = await addStrip(db, ME, session, { materialId: HEDIONE, pure: true });
  await expect(closeStrip(db, ME, strip)).rejects.toThrow(/without its opening/);
  await writeOpening(db, ME, strip, "verde");
  await saveClosure(db, ME, strip, { decay: "truncates", role: "thesis" });
  await expect(saveClosure(db, ME, strip, { comparison: "la fuente dice…" })).rejects.toThrow(/after closing/);
  await expect(saveClosure(db, ME, strip, { decay: "se va" as never })).rejects.toThrow(/unknown decay/);
  await closeStrip(db, ME, strip);
  await saveClosure(db, ME, strip, { comparison: "la fuente dice…" });
  const read = await loadTastings(db, ME);
  expect(read.closures[0]).toMatchObject({ decay: "truncates", role: "thesis", comparison: "la fuente dice…" });
  expect(read.strips[0].closedAt).not.toBeNull();
  expect(read.strips[0].revealedAt).not.toBeNull();
  await deleteSession(db, ME, session);
});

it("a strip is smelled from a bottle of yours or pure (V3-66, V3-67): chosen before the opening, fixed after", async () => {
  const session = await createSession(db, ME);
  const strip = await addStrip(db, ME, session, { materialId: HEDIONE });
  await expect(writeOpening(db, ME, strip, "jazmín")).rejects.toThrow(/first the bottle/);
  await setStripBottle(db, ME, strip, { dilutionId: MY_DILUTION });
  expect((await loadTastings(db, ME)).strips.find((s) => s.id === strip)?.fraction?.toString()).toBe("1/10");
  await setStripBottle(db, ME, strip, { pure: true });
  const pure = (await loadTastings(db, ME)).strips.find((s) => s.id === strip)!;
  expect([pure.fraction?.toString(), pure.dilutionId, pure.solvent]).toEqual(["1", null, null]);
  await writeOpening(db, ME, strip, "jazmín");
  await expect(setStripBottle(db, ME, strip, { dilutionId: MY_DILUTION })).rejects.toThrow(/fixed once/);
  await deleteSession(db, ME, session);
});
