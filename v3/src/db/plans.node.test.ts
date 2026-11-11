import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { copyFormula, createFormula, createWorkbench } from "./formulas";
import { AppSchema, tables } from "./local/schema";
import type { LocalDb } from "./materials";
import { loadPlan, removePlanLine, replacePlan, setPlanParts, setPlanShape } from "./plans";

/** The plan of a formula (V3-98), on the copy without network. */

const ME = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const BERGAMOT = "aaaaaaaa-0000-4000-8000-000000000001";
const HEDIONE = "aaaaaaaa-0000-4000-8000-000000000002";
let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-plans-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "plans.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
});

afterAll(async () => {
  await copy.close();
  rmSync(folder, { recursive: true, force: true });
});

describe("the plan of a formula (V3-98)", () => {
  it("keeps its materials in exact parts, in the order written; setting a material twice changes its parts", async () => {
    const bench = await createWorkbench(db, ME, { name: "Plan" });
    const f = await createFormula(db, ME, { name: "Cologne", workbenchId: bench });
    const b = await setPlanParts(db, ME, f, BERGAMOT, Ratio.of(18));
    await setPlanParts(db, ME, f, HEDIONE, Ratio.fromDecimal("0.5"));
    expect(await setPlanParts(db, ME, f, BERGAMOT, Ratio.of(20))).toBe(b);
    const plan = await loadPlan(db, ME, f);
    expect(plan.map((l) => [l.materialId, l.parts.toString(), l.shape])).toEqual([
      [BERGAMOT, "20", null],
      [HEDIONE, "1/2", null],
    ]);
  });

  it("takes the user's shape and goes back to the default; removes a line", async () => {
    const bench = await createWorkbench(db, ME, { name: "Plan 2" });
    const f = await createFormula(db, ME, { name: "Amber", workbenchId: bench });
    const id = await setPlanParts(db, ME, f, BERGAMOT, Ratio.of(1));
    await setPlanShape(db, ME, id, "plateau");
    expect((await loadPlan(db, ME, f))[0].shape).toBe("plateau");
    await setPlanShape(db, ME, id, null);
    expect((await loadPlan(db, ME, f))[0].shape).toBeNull();
    await removePlanLine(db, ME, id);
    expect(await loadPlan(db, ME, f)).toEqual([]);
  });

  it("a new version takes its mother's plan; nobody else's formula takes a line", async () => {
    const bench = await createWorkbench(db, ME, { name: "Plan 3" });
    const f = await createFormula(db, ME, { name: "Fougère", workbenchId: bench });
    const id = await setPlanParts(db, ME, f, HEDIONE, Ratio.of(3));
    await setPlanShape(db, ME, id, "heart");
    const v2 = await copyFormula(db, ME, f, { name: "Fougère 2", asVersion: true });
    expect((await loadPlan(db, ME, v2)).map((l) => [l.materialId, l.parts.toString(), l.shape])).toEqual([[HEDIONE, "3", "heart"]]);
    await expect(setPlanParts(db, OTHER, f, BERGAMOT, Ratio.of(1))).rejects.toThrow("not one of your formulas");
    await expect(setPlanParts(db, ME, f, BERGAMOT, Ratio.of(-1))).rejects.toThrow("negative");
  });
});

describe("writing an imported plan at once (V3-100)", () => {
  const CEDAR = "aaaaaaaa-0000-4000-8000-000000000003";
  it("«replace» leaves exactly the file's lines, in its order, with shape and group", async () => {
    const bench = await createWorkbench(db, ME, { name: "Import 1" });
    const f = await createFormula(db, ME, { name: "Floors v4", workbenchId: bench });
    await setPlanParts(db, ME, f, CEDAR, Ratio.of(9));
    await replacePlan(db, ME, f, [
      { materialId: HEDIONE, parts: Ratio.fromDecimal("13.63"), shape: null, groupName: "Heart" },
      { materialId: BERGAMOT, parts: Ratio.fromDecimal("2.42"), shape: "top", groupName: "Top · Citrus" },
    ]);
    const plan = await loadPlan(db, ME, f);
    expect(plan.map((l) => [l.materialId, l.parts.toString(), l.shape, l.groupName, l.position])).toEqual([
      [HEDIONE, "1363/100", null, "Heart", 0],
      [BERGAMOT, "121/50", "top", "Top · Citrus", 1],
    ]);
  });

  it("«add» keeps what was there, updates the parts it shares and puts the new ones at the end", async () => {
    const bench = await createWorkbench(db, ME, { name: "Import 2" });
    const f = await createFormula(db, ME, { name: "Floors v5", workbenchId: bench });
    const cedar = await setPlanParts(db, ME, f, CEDAR, Ratio.of(9));
    await setPlanShape(db, ME, cedar, "linear");
    await setPlanParts(db, ME, f, HEDIONE, Ratio.of(1));
    await replacePlan(
      db,
      ME,
      f,
      [
        { materialId: HEDIONE, parts: Ratio.of(4), shape: null, groupName: null },
        { materialId: BERGAMOT, parts: Ratio.of(2), shape: null, groupName: "Top" },
      ],
      "add",
    );
    expect((await loadPlan(db, ME, f)).map((l) => [l.materialId, l.parts.toString(), l.shape, l.groupName])).toEqual([
      [CEDAR, "9", "linear", null],
      [HEDIONE, "4", null, null],
      [BERGAMOT, "2", null, "Top"],
    ]);
  });

  it("writes nothing when a line is wrong, and a version takes the groups too", async () => {
    const bench = await createWorkbench(db, ME, { name: "Import 3" });
    const f = await createFormula(db, ME, { name: "Floors v6", workbenchId: bench });
    await setPlanParts(db, ME, f, CEDAR, Ratio.of(9));
    await expect(
      replacePlan(db, ME, f, [
        { materialId: HEDIONE, parts: Ratio.of(1), shape: null, groupName: null },
        { materialId: HEDIONE, parts: Ratio.of(2), shape: null, groupName: null },
      ]),
    ).rejects.toThrow("twice");
    await expect(replacePlan(db, ME, f, [{ materialId: HEDIONE, parts: Ratio.of(-1), shape: null, groupName: null }])).rejects.toThrow("negative");
    await expect(replacePlan(db, OTHER, f, [])).rejects.toThrow("not one of your formulas");
    expect((await loadPlan(db, ME, f)).map((l) => l.materialId)).toEqual([CEDAR]);
    await replacePlan(db, ME, f, [{ materialId: HEDIONE, parts: Ratio.of(1), shape: null, groupName: "Base · Musks" }]);
    const v2 = await copyFormula(db, ME, f, { name: "Floors v6 · 2", asVersion: true });
    expect((await loadPlan(db, ME, v2)).map((l) => l.groupName)).toEqual(["Base · Musks"]);
  });
});
