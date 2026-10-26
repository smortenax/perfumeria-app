import { describe, expect, it } from "vitest";
import type { FormulaRecord } from "../db/formulas";
import { layoutVersionTree, lineage } from "./version-tree";

function formula(id: string, parentId: string | null, createdAt: string): FormulaRecord {
  return {
    id,
    workbenchId: "w",
    parentId,
    name: id,
    intention: "",
    containerCapacityMl: null,
    containerTareUg: null,
    workBatchUg: null,
    finalBatchUg: null,
    markers: [],
    role: null,
    createdAt,
  };
}

const at = (tree: ReturnType<typeof layoutVersionTree>, id: string) => {
  const n = tree.nodes.find((x) => x.formula.id === id)!;
  return [n.column, n.depth];
};

describe("layoutVersionTree", () => {
  it("puts a mother over her versions, oldest on the left", () => {
    const tree = layoutVersionTree([
      formula("b", "a", "2026-10-02"),
      formula("a", null, "2026-10-01"),
      formula("c", "a", "2026-10-03"),
      formula("d", "c", "2026-10-04"),
    ]);
    expect(at(tree, "b")).toEqual([0, 1]);
    expect(at(tree, "c")).toEqual([1, 1]);
    expect(at(tree, "d")).toEqual([1, 2]);
    expect(at(tree, "a")).toEqual([0.5, 0]);
    expect(tree.columns).toBe(2);
    expect(tree.depths).toBe(3);
  });

  it("gives each formula made from nothing a tree of its own, side by side", () => {
    const tree = layoutVersionTree([formula("x", null, "2026-10-01"), formula("y", null, "2026-10-02")]);
    expect(at(tree, "x")).toEqual([0, 0]);
    expect(at(tree, "y")).toEqual([1, 0]);
  });

  it("roots a version whose mother is not in the list instead of hiding it", () => {
    const tree = layoutVersionTree([formula("v", "gone", "2026-10-01")]);
    expect(tree.nodes).toHaveLength(1);
    expect(tree.nodes[0].parentId).toBeNull();
  });

  it("still shows every formula of a cycle a copy out of sync might hold", () => {
    const tree = layoutVersionTree([formula("p", "q", "2026-10-01"), formula("q", "p", "2026-10-02")]);
    expect(tree.nodes.map((n) => n.formula.id).sort()).toEqual(["p", "q"]);
  });
});

describe("lineage", () => {
  it("is the formula and its mothers up to the root", () => {
    const tree = layoutVersionTree([formula("a", null, "1"), formula("b", "a", "2"), formula("c", "b", "3"), formula("z", "a", "4")]);
    expect([...lineage(tree, "c")].sort()).toEqual(["a", "b", "c"]);
    expect(lineage(tree, null).size).toBe(0);
  });
});
