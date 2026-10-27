import { describe, expect, it } from "vitest";
import { lineage, nodeAfterKey, TREE_GAP_X, TREE_GAP_Y, type TreeFormula, versionForest } from "./versionTree";

/** V3-77: each formula a node, each version under the formula it was saved from. */

const f = (id: string, parentId: string | null, createdAt: string, name = id): TreeFormula => ({ id, parentId, name, createdAt });
const at = (forest: ReturnType<typeof versionForest>, id: string) => forest.nodes.find((n) => n.id === id);

describe("versionForest", () => {
  it("hangs each version under the formula it came from, the oldest first, the parent centred over them", () => {
    const forest = versionForest([f("guia", null, "2026-10-01"), f("con", "sin", "2026-10-05"), f("b", "guia", "2026-10-04"), f("sin", "guia", "2026-10-02")]);
    expect(forest.nodes.map((n) => n.id)).toEqual(["guia", "sin", "con", "b"]);
    expect(at(forest, "sin")).toMatchObject({ x: 0, y: 1, level: 2, posInSet: 1, setSize: 2, parentId: "guia" });
    expect(at(forest, "con")).toMatchObject({ x: 0, y: 2, level: 3, parentId: "sin" });
    expect(at(forest, "b")).toMatchObject({ x: 1, y: 1, posInSet: 2 });
    expect(at(forest, "guia")).toMatchObject({ x: 0.5, y: 0, level: 1 });
    expect(forest).toMatchObject({ width: 2, height: 3 });
  });

  it("tucks a branch under its neighbour's where that one stops, so a long history keeps the tree narrow", () => {
    // v1 > v2 > (abedul > v4 > (iris, saf > (v6, final)), castoreum): four last versions in two and a half slots.
    const forest = versionForest([
      f("v1", null, "1"), f("v2", "v1", "2"), f("abedul", "v2", "3"), f("castoreum", "v2", "4"), f("v4", "abedul", "5"),
      f("iris", "v4", "6"), f("saf", "v4", "7"), f("v6", "saf", "8"), f("final", "saf", "9"),
    ]);
    const xs = Object.fromEntries(forest.nodes.map((n) => [n.id, n.x]));
    expect(xs).toEqual({ v1: 1, v2: 1, abedul: 0.5, v4: 0.5, iris: 0, saf: 1, v6: 0.5, final: 1.5, castoreum: 1.5 });
    expect(forest).toMatchObject({ width: 2.5, height: 6 });
  });

  it("sets the trees of a bench side by side, in the order given, and starts a new row when the room is full", () => {
    const list = [f("a", null, "2026-10-03"), f("a2", "a", "2026-10-04"), f("b", null, "2026-10-01"), f("c", null, "2026-10-02")];
    const wide = versionForest(list);
    expect(at(wide, "b")).toMatchObject({ x: 1 + TREE_GAP_X, y: 0, level: 1, posInSet: 2, setSize: 3 });
    expect(wide).toMatchObject({ width: 3 + 2 * TREE_GAP_X, height: 2 });
    const narrow = versionForest(list, 2.5);
    expect(at(narrow, "b")).toMatchObject({ x: 1 + TREE_GAP_X, y: 0 });
    expect(at(narrow, "c")).toMatchObject({ x: 0, y: 2 + TREE_GAP_Y });
    expect(narrow).toMatchObject({ width: 2 + TREE_GAP_X, height: 3 + TREE_GAP_Y });
  });

  it("gives a tree wider than the room a row of its own", () => {
    const forest = versionForest([f("a", null, "1"), f("a1", "a", "2"), f("a2", "a", "3"), f("a3", "a", "4"), f("b", null, "5")], 2);
    expect(at(forest, "a")).toMatchObject({ x: 1, y: 0 });
    expect(at(forest, "b")).toMatchObject({ x: 0, y: 2 + TREE_GAP_Y });
  });

  it("starts a tree with a formula whose parent is not in the list, and leaves none out of a loop of parents", () => {
    const orphan = versionForest([f("v2", "gone", "2026-10-02")]);
    expect(orphan.nodes).toEqual([{ id: "v2", parentId: null, x: 0, y: 0, level: 1, posInSet: 1, setSize: 1 }]);
    const loop = versionForest([f("x", "y", "2026-10-01"), f("y", "x", "2026-10-02")]);
    expect(loop.nodes.map((n) => n.id)).toEqual(["x", "y"]);
  });

  it("is empty without formulas", () => {
    expect(versionForest([])).toEqual({ nodes: [], width: 0, height: 0 });
  });
});

describe("lineage", () => {
  it("is the formula and those it comes from, up to the first", () => {
    const { nodes } = versionForest([f("guia", null, "1"), f("sin", "guia", "2"), f("con", "sin", "3"), f("b", "guia", "4")]);
    expect([...lineage(nodes, "con")].sort()).toEqual(["con", "guia", "sin"]);
    expect(lineage(nodes, null).size).toBe(0);
  });
});

describe("nodeAfterKey", () => {
  const { nodes } = versionForest([f("guia", null, "1"), f("sin", "guia", "2"), f("con", "sin", "3"), f("b", "guia", "4"), f("other", null, "5")]);
  const index = (id: string) => nodes.findIndex((n) => n.id === id);

  it("goes down and up in reading order, and stops at the ends", () => {
    expect(nodeAfterKey("ArrowDown", index("guia"), nodes)).toBe(index("sin"));
    expect(nodeAfterKey("ArrowDown", index("con"), nodes)).toBe(index("b"));
    expect(nodeAfterKey("ArrowUp", index("b"), nodes)).toBe(index("con"));
    expect(nodeAfterKey("ArrowUp", 0, nodes)).toBe(0);
    expect(nodeAfterKey("ArrowDown", nodes.length - 1, nodes)).toBe(nodes.length - 1);
  });

  it("goes right to the first version and left to the formula it came from", () => {
    expect(nodeAfterKey("ArrowRight", index("guia"), nodes)).toBe(index("sin"));
    expect(nodeAfterKey("ArrowRight", index("con"), nodes)).toBe(index("con"));
    expect(nodeAfterKey("ArrowLeft", index("b"), nodes)).toBe(index("guia"));
    expect(nodeAfterKey("ArrowLeft", index("other"), nodes)).toBe(index("other"));
  });

  it("jumps to the ends with Home and End, and moves nothing on other keys", () => {
    expect(nodeAfterKey("Home", 3, nodes)).toBe(0);
    expect(nodeAfterKey("End", 0, nodes)).toBe(nodes.length - 1);
    expect(nodeAfterKey("Enter", 1, nodes)).toBeNull();
    expect(nodeAfterKey("ArrowDown", 0, [])).toBeNull();
  });
});
