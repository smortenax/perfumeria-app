import { describe, expect, it } from "vitest";
import type { FormulaRecord, Workbench } from "../db/formulas";
import { switchBenches, switchFormulas } from "./switcher";

const f = (id: string, name: string, workbenchId: string, parentId: string | null = null, markers: FormulaRecord["markers"] = []): FormulaRecord => ({
  id, name, workbenchId, parentId, intention: "", notes: "", containerCapacityMl: null, containerTareUg: null, workBatchUg: null, finalBatchUg: null, markers, role: null, createdAt: null, updatedAt: null,
});
const bench = (id: string, name: string): Workbench => ({ id, name, notes: null });

const benches = [bench("w", "Wangan"), bench("c", "Cuir"), bench("e", "Éter"), bench("v", "vacío")];
const formulas = [
  f("c1", "Cuir", "c"),
  f("c3", "Cuir v3", "c", "c2", ["favorite"]),
  f("c2", "Cuir v2", "c", "c1"),
  f("a", "Accord de cuir", "c"),
  f("w1", "Fondo", "w"),
];

describe("the bench's switcher (audit F-02 L2)", () => {
  it("lists the workbenches by name, accents aside, with their formulas and the current one marked", () => {
    expect(switchBenches(benches, formulas, "c")).toEqual([
      { id: "c", name: "Cuir", count: 4, current: true },
      { id: "e", name: "Éter", count: 0, current: false },
      { id: "v", name: "vacío", count: 0, current: false },
      { id: "w", name: "Wangan", count: 1, current: false },
    ]);
  });

  it("finds a workbench by its name, without accents or case", () => {
    expect(switchBenches(benches, formulas, "c", "ETER").map((b) => b.id)).toEqual(["e"]);
  });

  it("lists a workbench's formulas with each version under its mother, one step deeper", () => {
    expect(switchFormulas(formulas, "c", "c3").map((x) => [x.id, x.depth, x.current, x.favorite])).toEqual([
      ["a", 0, false, false],
      ["c1", 0, false, false],
      ["c2", 1, false, false],
      ["c3", 2, true, true],
    ]);
  });

  it("keeps a version's depth when the search hides its mother", () => {
    expect(switchFormulas(formulas, "c", "c1", "v3").map((x) => [x.id, x.depth])).toEqual([["c3", 2]]);
  });

  it("gives nothing for an empty workbench, and never loops on a loop of parents", () => {
    expect(switchFormulas(formulas, "v", "c1")).toEqual([]);
    const loop = [f("x", "X", "l", "y"), f("y", "Y", "l", "x")];
    expect(switchFormulas(loop, "l", "x").map((x) => x.id).sort()).toEqual(["x", "y"]);
  });
});
