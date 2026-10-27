import { describe, expect, it } from "vitest";
import type { FormulaRecord } from "../db/formulas";
import { type EventRow, previewsOf, sortFormulas } from "./preview";

/** The list of formulas (F1): what a row says, and its order. */

const f = (id: string, name: string, extra: Partial<FormulaRecord> = {}): FormulaRecord => ({
  id, name, workbenchId: "b", parentId: null, intention: "", notes: "", containerCapacityMl: null, containerTareUg: null,
  workBatchUg: null, finalBatchUg: null, markers: [], role: null, createdAt: "2026-10-01T10:00:00Z", updatedAt: "2026-10-01T10:00:00Z", ...extra,
});
const e = (id: string, formulaId: string, kind: string, materialId: string | null, createdAt: string, target: string | null = null): EventRow => ({ id, formulaId, kind, materialId, target, createdAt });

const formulas = [f("a", "Zeta"), f("b", "Alfa", { markers: ["favorite"] }), f("c", "Beta", { updatedAt: "2026-10-20T10:00:00Z" })];
const events = [
  e("1", "a", "add", "lin", "2026-10-02T10:00:00Z"),
  e("2", "a", "add", "lin", "2026-10-03T10:00:00Z"),
  e("3", "a", "add", "hed", "2026-10-04T10:00:00Z"),
  e("4", "a", "remove", null, "2026-10-25T10:00:00Z", "3"),
  e("5", "b", "add", "van", "2026-10-05T10:00:00Z"),
];

describe("what a row of the list says", () => {
  it("the materials it carries now, and its last change (a step or its header)", () => {
    const p = previewsOf(formulas, events);
    expect(p.get("a")).toEqual({ materials: 1, lastChange: "2026-10-25T10:00:00Z" });
    expect(p.get("b")).toEqual({ materials: 1, lastChange: "2026-10-05T10:00:00Z" });
    expect(p.get("c")).toEqual({ materials: 0, lastChange: "2026-10-20T10:00:00Z" });
  });
});

describe("the order of the list", () => {
  const p = previewsOf(formulas, events);
  it("favorites first, then by name, by last change or as they come", () => {
    expect(sortFormulas(formulas, "name", p).map((x) => x.id)).toEqual(["b", "c", "a"]);
    expect(sortFormulas(formulas, "changed", p).map((x) => x.id)).toEqual(["b", "a", "c"]);
    expect(sortFormulas(formulas, "versions", p).map((x) => x.id)).toEqual(["b", "a", "c"]);
  });
});
