import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createFormula, createWorkbench, loadFormulas, updateFormula } from "./formulas";
import { AppSchema, tables } from "./local/schema";
import { endMaceration, listMacerations, macerationState, noteCheck, startMaceration } from "./macerations";
import type { LocalDb } from "./materials";

/** A formula macerating (V3-83), on the copy without network. */

const ME = "11111111-1111-4111-8111-111111111111";
let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-macerations-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "macerations.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
});

afterAll(async () => {
  await copy.close();
  rmSync(folder, { recursive: true, force: true });
});

describe("the days of a maceration and its checks (7, 14, 28)", () => {
  it("day 0 the day it starts; a check reached and not noted is due; the next one ahead", () => {
    expect(macerationState({ startedOn: "2026-10-01", checked: [] }, "2026-10-01")).toEqual({ day: 0, due: null, next: 7 });
    expect(macerationState({ startedOn: "2026-10-01", checked: [] }, "2026-10-09")).toEqual({ day: 8, due: 7, next: 14 });
    expect(macerationState({ startedOn: "2026-10-01", checked: [7] }, "2026-10-09")).toEqual({ day: 8, due: null, next: 14 });
    expect(macerationState({ startedOn: "2026-10-01", checked: [7] }, "2026-11-05")).toEqual({ day: 35, due: 28, next: null });
  });
});

describe("macerating a formula (V3-83)", () => {
  it("starts once, notes a check into the formula's notes, and ends", async () => {
    const bench = await createWorkbench(db, ME, { name: "Mac" });
    const f = await createFormula(db, ME, { name: "Chypre", workbenchId: bench });
    await updateFormula(db, ME, f, { notes: "First mix." });
    const id = await startMaceration(db, ME, f, "2026-10-01");
    expect(await startMaceration(db, ME, f, "2026-10-05")).toBe(id);
    await noteCheck(db, ME, id, 7, "Rounder, less sharp.", "2026-10-08");
    expect((await loadFormulas(db, ME)).find((x) => x.id === f)?.notes).toBe("First mix.\nDay 7 (2026-10-08): Rounder, less sharp.");
    expect((await listMacerations(db, ME)).map((m) => [m.formulaId, m.startedOn, m.checked])).toEqual([[f, "2026-10-01", [7]]]);
    await endMaceration(db, ME, id, "2026-10-30");
    expect(await listMacerations(db, ME)).toEqual([]);
  });
});
