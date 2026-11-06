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
import { loadPlan, removePlanLine, setPlanParts, setPlanShape } from "./plans";

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
