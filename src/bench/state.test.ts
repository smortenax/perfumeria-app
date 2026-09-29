import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { Formula } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import { renameMaterials } from "./state";

const bacdanol: Material = { key: "fig:412", kind: "base", name: "Bacdanol", cas: "28219-61-6" };
const add = (id: string, material: Material) => ({ kind: "add" as const, id, material, massUg: 1_000n, fraction: Ratio.ONE, diluent: null });
const formula: Formula = {
  header: { name: "Zara", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
  history: [add("a", bacdanol), add("b", DILUENTS.dpg), { kind: "note", id: "n", text: "huele" }],
};

describe("the user's name for a material (P56)", () => {
  it("names the material as on the bottle, and keeps its key, so IFRA does not change", () => {
    const renamed = renameMaterials(formula, (key) => (key === "fig:412" ? "Dartanol" : undefined));
    const first = renamed.history[0];
    expect(first.kind === "add" && [first.material.key, first.material.name, first.material.cas]).toEqual(["fig:412", "Dartanol", "28219-61-6"]);
    expect(renamed.history[1]).toBe(formula.history[1]);
  });

  it("leaves the formula untouched when no name changes, so nothing is left to save", () => {
    expect(renameMaterials(formula, () => undefined)).toBe(formula);
    expect(renameMaterials(formula, (key) => (key === "fig:412" ? "Bacdanol" : undefined))).toBe(formula);
  });
});
