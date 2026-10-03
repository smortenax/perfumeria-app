import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { checkIfra } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS } from "../core/model/material";
import { repositoryFor } from "../data/repositories";
import { v2Dataset } from "./data";

// A bench formula with five materials of lot 4b (Perfumiarz), as the bench builds it from the v2 repository:
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
  ["Auranone", "0,100", "100", null],
  ["Benzoin Siam Resinoid (IFF)", "0,300", "50", "dpg"],
  ["Helional", "0,050", "100", null],
  ["Aldambre", "0,450", "50", "dpg"],
  ["Calone (powder)", "0,100", "10", "dpg"],
];
const formula: Formula = {
  header: { name: "Lote 4b", intention: "", container: null, workBatchUg: 1_000_000n, finalBatchUg: 5_000_000n },
  history: LINES.map(([name, grams, percent, diluent], i): Change => ({
    kind: "add",
    id: `d${i + 1}`,
    material: entry(name).material,
    massUg: parseMass(grams, "g"),
    fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)),
    diluent: diluent === null ? null : DILUENTS[diluent],
  })),
};

describe("a bench formula with five materials of lot 4b, checked with the v2", () => {
  const report = checkIfra(formula, repository.ifraData());
  const productOf = (name: string) => data.products.find((p) => p.name === name)!;
  const materialOf = (name: string) => data.materials.find((m) => m.id === productOf(name).materialId)!;

  it("finds every material in the v2: nothing is unchecked, and nothing is over a ceiling", () => {
    expect(report.unchecked).toEqual([]);
    expect(report.base).toBe("completed");
    expect(report.checks.some((c) => c.verdict === "exceeds")).toBe(false);
  });

  it("the helional is checked by its standard (059, no specification: nothing pending); the benzoin's constituents are only bounded", () => {
    const verdict = (name: string) => report.checks.find((c) => c.substance.name.startsWith(name))?.verdict;
    expect(verdict("alpha-Methyl-1,3-benzodioxole-5-propionaldehyde")).toBe("within");
    expect(verdict("Benzyl benzoate")).toBe("bounded");
    expect(report.conditions).toEqual([]);
  });

  it("the base without documents and the benzoin with a placeholder of another supplier leave their constituents pending", () => {
    expect([...report.pending].sort((x, y) => x.material.localeCompare(y.material))).toEqual([
      { material: "Auranone", text: "Sin datos de sus constituyentes: puede llevar sustancias con techo." },
      { material: "Benzoin Siam Resinoid (IFF)", text: "Su composición es parcial: puede llevar otras sustancias con techo." },
    ]);
    expect(report.partial).toBe(true);
  });

  it("the cards: the base, the benzoin as in lot 3c, and the molecules of unknown origin; no SDS range entered as data", () => {
    expect(materialOf("Auranone").type).toBe("base");
    const benzoin = materialOf("Benzoin Siam Resinoid (IFF)");
    expect([benzoin.type, benzoin.species, benzoin.part, benzoin.process]).toEqual([
      "natural",
      "Styrax tonkinensis (Siam)",
      "resina",
      "resinoide (extracción con disolvente)",
    ]);
    for (const name of ["Helional", "Aldambre", "Calone (powder)"]) {
      expect(materialOf(name).origin, name).toBe("desconocido");
      // The SDS of the material itself (Helional ≥50, Calone 99-100) or of its dilution (Aldambre 25-50 % in DPG) is not
      // composition (D8): no row of these products is a range, and none has a certificate of its own.
      expect(data.composition.filter((c) => c.containerId === productOf(name).id), name).toEqual([]);
    }
    expect(data.composition.some((c) => c.valueType === "rango" && ["Auranone", "Helional", "Aldambre", "Calone (powder)"].some((n) => c.containerId === productOf(n).id))).toBe(false);
  });
});
