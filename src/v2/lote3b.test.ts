import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { formatPercent } from "../core/display";
import { checkIfra } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS } from "../core/model/material";
import { repositoryFor } from "../data/repositories";

// A bench formula with five molecules of lot 3b (Olfatorium), as the bench builds it from the v2
// repository: 2,4 g poured, taken to a perfume at 20 % (work batch 2,4 g, final 12 g). The
// dilutions are those the user puts in the bar when weighing (D8); the model is always at 100 %.
const repository = repositoryFor("v2");
const entry = (name: string) => {
  const e = repository.entries.find((x) => x.material.name === name);
  expect(e, name).toBeDefined();
  return e!;
};
const LINES: ReadonlyArray<readonly [string, string, string, keyof typeof DILUENTS | null]> = [
  ["Iso E Super", "0,800", "100", null],
  ["Galaxolide", "0,600", "50", "dpg"],
  ["Polysantol", "0,500", "10", "dpg"],
  ["Hedione", "0,300", "100", null],
  ["Ethylene Brassylate", "0,200", "50", "dpg"],
];
const formula: Formula = {
  header: { name: "Lote 3b", intention: "", container: null, workBatchUg: 2_400_000n, finalBatchUg: 12_000_000n },
  history: LINES.map(([name, grams, percent, diluent], i): Change => ({
    kind: "add",
    id: `b${i + 1}`,
    material: entry(name).material,
    massUg: parseMass(grams, "g"),
    fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)),
    diluent: diluent === null ? null : DILUENTS[diluent],
  })),
};

describe("a bench formula with five molecules of lot 3b, checked with the v2", () => {
  const report = checkIfra(formula, repository.ifraData());
  const share = (key: string) => {
    const c = report.checks.find((x) => x.substance.key === key);
    return c ? `${c.verdict} ${formatPercent(c.worstUg.div(report.finalUg))}` : "—";
  };

  it("finds every material in the v2: nothing is unchecked, and nothing is pending (all synthetic)", () => {
    expect(report.unchecked).toEqual([]);
    expect(report.pending).toEqual([]);
    expect(report.base).toBe("completed");
  });

  it("sums the standards of the molecules that have one, on the final batch", () => {
    expect(share("std:IFRA_STD_068")).toBe("within 6,667 %"); // OTNE of the Iso E Super: 0,8 g of 12 g, ≤ 20 %
    expect(share("std:IFRA_STD_211")).toBe("within 0,417 %"); // Polysantol: 0,05 g of 12 g, ≤ 1,1 %
    // The Hedione, the Galaxolide and the Ethylene Brassylate have no standard of their own.
    expect(report.checks.map((c) => c.substance.key).sort()).toEqual(["std:IFRA_STD_068", "std:IFRA_STD_211"]);
  });

  it("answers both readings: yes, and up to 52,8 % of a perfume, which the Polysantol sets (1,1 % × 2,4 g / 0,05 g)", () => {
    expect(report.asIs).toBe("yes");
    expect(formatPercent(report.maxUse)).toBe("52,800 %");
    expect(report.partial).toBe(false);
  });

  it("the molecules without documents are pure by convention on their card (D7)", () => {
    for (const [name] of LINES) {
      expect(entry(name).pureByConvention, name).toBe(true);
    }
  });
});
