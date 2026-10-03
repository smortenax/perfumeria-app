import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { formulaToJson } from "../core/io/formula-json";
import type { Formula } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { openFormula } from "./open";
import { modelVersion } from "./prefs";

const line = (material: Material, i: number) => ({
  kind: "add" as const,
  id: `a${i}`,
  material,
  massUg: parseMass("0,100", "g"),
  fraction: Ratio.ONE,
  diluent: null,
});
const formula = (...materials: Material[]): Formula => ({
  header: { name: "una fórmula", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
  history: materials.map(line),
});
const pepper: Material = { key: "fig:2622", kind: "base", name: "Pepper, black, absolute", cas: "8006-82-4" };
const bergamot: Material = { key: "fig:1197", kind: "base", name: "Bergamot oil", cas: "8007-75-8" };

describe("opening a formula of the library (Phase 5)", () => {
  it("the v2 is the model by default", () => {
    expect(modelVersion()).toBe("v2");
  });

  it("with the v2 it migrates in memory and keeps the file's text, to copy it before the first write", () => {
    const text = formulaToJson(formula(pepper, bergamot));
    const opened = openFormula(text, "C:/Fórmulas/una fórmula.json", "v2");
    expect(opened.original).toBe(text);
    expect(opened.formula.history.map((c) => (c.kind === "add" ? c.material.key : ""))).toEqual([expect.stringMatching(/^v2:P/), "fig:1197"]);
    expect(opened.migration?.notes.map((n) => n.kind)).toEqual(["migrated", "v1-only"]);
  });

  it("the migration never touches the name of the formula, so it is saved under the name it always had", () => {
    const named = formula(pepper, bergamot);
    const withName: Formula = { ...named, header: { ...named.header, name: " Zara tabaco v2 " } };
    const opened = openFormula(formulaToJson(withName), "C:/Fórmulas/Zara tabaco v2.json", "v2");
    expect(opened.migration?.changed).toBe(true);
    expect(opened.formula.header).toEqual(withName.header);
    expect(opened.path).toBe("C:/Fórmulas/Zara tabaco v2.json");
  });

  it("a formula with nothing to migrate keeps its text out of the way: nothing is copied", () => {
    const opened = openFormula(formulaToJson(formula(bergamot)), "C:/Fórmulas/x.json", "v2");
    expect(opened.original).toBeUndefined();
    expect(opened.migration?.changed).toBe(false);
  });

  it("with the v1 as the model it opens as it always did", () => {
    const opened = openFormula(formulaToJson(formula(pepper)), null, "v1");
    expect(opened.migration).toBeUndefined();
    expect(opened.formula.history[0].kind === "add" && opened.formula.history[0].material.key).toBe("fig:2622");
  });
});
