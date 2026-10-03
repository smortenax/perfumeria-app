import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { checkIfra } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS } from "../core/model/material";
import { repositoryFor } from "../data/repositories";
import { v2Dataset } from "./data";

// A bench formula with five materials of lot 4a (Perfumiarz), as the bench builds it from the v2 repository:
// 1,0 g poured, taken to a perfume at 20 % (work batch 1,0 g, final 5 g). The dilutions are those the user
// puts in the bar when weighing (D8); the model is always at 100 %.
const repository = repositoryFor("v2");
const data = v2Dataset();
const entry = (name: string) => {
  const e = repository.entries.find((x) => x.material.name === name);
  expect(e, name).toBeDefined();
  return e!;
};
const LINES: ReadonlyArray<readonly [string, string, string, keyof typeof DILUENTS | null]> = [
  ["Black Agar 296985", "0,050", "100", null],
  ["Tolu Balsam Resinoide", "0,030", "10", "dpg"],
  ["Habanolide", "0,200", "50", "dpg"],
  ["Eucalyptol Natural", "0,100", "100", null],
  ["Black Pepper Absolute", "0,020", "10", "dpg"],
];
const formula: Formula = {
  header: { name: "Lote 4a", intention: "", container: null, workBatchUg: 1_000_000n, finalBatchUg: 5_000_000n },
  history: LINES.map(([name, grams, percent, diluent], i): Change => ({
    kind: "add",
    id: `d${i + 1}`,
    material: entry(name).material,
    massUg: parseMass(grams, "g"),
    fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)),
    diluent: diluent === null ? null : DILUENTS[diluent],
  })),
};

describe("a bench formula with five materials of lot 4a, checked with the v2", () => {
  const report = checkIfra(formula, repository.ifraData());
  const productOf = (name: string) => data.products.find((p) => p.name === name)!;
  const materialOf = (name: string) => data.materials.find((m) => m.id === productOf(name).materialId)!;

  it("finds every material in the v2: nothing is unchecked, and nothing is over a ceiling", () => {
    expect(report.unchecked).toEqual([]);
    expect(report.base).toBe("completed");
    expect(report.checks.some((c) => c.verdict === "exceeds")).toBe(false);
  });

  it("only the pepper, which has no certificate, leaves something pending: its constituents", () => {
    // The certificates of Firmenich, Symrise and the rest list every restricted substance (reguladas-completa): what
    // they do not list is not there. That closes even the impurities of the natural isolate (eucalyptol).
    expect(report.pending).toEqual([
      { material: "Black Pepper Absolute", text: "Sin datos de sus constituyentes: puede llevar sustancias con techo." },
    ]);
    expect(report.conditions).toEqual([]);
    expect(report.partial).toBe(true);
    expect(report.asIs).toBe("unknown");
  });

  it("the certificates are linked: four of the five, each with its coverage and its category 4 cap in pure matter (D4)", () => {
    const covered = (name: string) => data.coverages.some((c) => c.containerId === productOf(name).id && c.coverage === "reguladas-completa");
    const cap4 = (name: string) => data.ceilings.find((c) => c.productId === productOf(name).id && c.category === "4")?.maxPct;
    for (const name of ["Black Agar 296985", "Tolu Balsam Resinoide", "Habanolide", "Eucalyptol Natural"]) {
      expect(covered(name), name).toBe(true);
    }
    expect(covered("Black Pepper Absolute")).toBe(false);
    expect([cap4("Black Agar 296985"), cap4("Tolu Balsam Resinoide"), cap4("Habanolide"), cap4("Eucalyptol Natural")]).toEqual([
      "9.6296",
      "4.1",
      "48",
      "1.6",
    ]);
  });

  it("the cards: two bases, the pepper as a natural with the form the user gave, the isolate and the unknown-origin molecule", () => {
    expect(materialOf("Black Agar 296985").type).toBe("base");
    expect(materialOf("Tolu Balsam Resinoide").type).toBe("base");
    const pepper = materialOf("Black Pepper Absolute");
    expect([pepper.type, pepper.species, pepper.part, pepper.process]).toEqual(["natural", "Piper nigrum", "fruto", "absoluto"]);
    expect(materialOf("Eucalyptol Natural").origin).toBe("aislado-natural");
    expect(materialOf("Habanolide").origin).toBe("desconocido");
  });
});
