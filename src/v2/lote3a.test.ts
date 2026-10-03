import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { formatPercent } from "../core/display";
import { checkIfra } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS } from "../core/model/material";
import { repositoryFor } from "../data/repositories";

// A bench formula with five molecules of lot 3a (Maese Lab), as the bench builds it from the v2
// repository: an accord of 0,8 g taken to a perfume at 20 % (work batch 0,8 g, final 4 g).
// The dilutions are the ones the user puts in the bar when weighing (D8): the Cashmeran at 50 % in DPG
// and the IBQ at 40 % in DPG; the model itself is always at 100 %.
const repository = repositoryFor("v2");
const entry = (name: string) => {
  const e = repository.entries.find((x) => x.material.name === name);
  expect(e, name).toBeDefined();
  return e!;
};
const LINES: ReadonlyArray<readonly [string, string, string, keyof typeof DILUENTS | null]> = [
  ["Cumarina natural", "0,030", "100", null],
  ["Eugenol 98%", "0,040", "100", null],
  ["Metil ionona gamma", "0,300", "100", null],
  ["Cashmeran", "0,380", "50", "dpg"],
  ["Isobutilquinoleína (IBQ)", "0,050", "40", "dpg"],
];
const formula: Formula = {
  header: { name: "Lote 3a", intention: "", container: null, workBatchUg: 800_000n, finalBatchUg: 4_000_000n },
  history: LINES.map(([name, grams, percent, diluent], i): Change => ({
    kind: "add",
    id: `a${i + 1}`,
    material: entry(name).material,
    massUg: parseMass(grams, "g"),
    fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)),
    diluent: diluent === null ? null : DILUENTS[diluent],
  })),
};

describe("a bench formula with five molecules of lot 3a, checked with the v2", () => {
  const report = checkIfra(formula, repository.ifraData());
  const share = (key: string) => {
    const c = report.checks.find((x) => x.substance.key === key);
    return c ? `${c.verdict} ${formatPercent(c.worstUg.div(report.finalUg))}` : "—";
  };

  it("finds every material in the v2: nothing is unchecked", () => {
    expect(report.unchecked).toEqual([]);
    expect(report.base).toBe("completed");
  });

  it("sums each standard on the final batch", () => {
    expect(share("std:IFRA_STD_023")).toBe("within 0,750 %"); // coumarin, ≤ 1,5 %
    expect(share("std:IFRA_STD_035")).toBe("within 1,000 %"); // eugenol, ≤ 2,5 %
    expect(share("std:IFRA_STD_063")).toBe("within 7,500 %"); // methyl ionone, its own standard
    // The Cashmeran, 0,19 g pure in 0,8 g, is 4,75 % of the perfume: over its 3,8 %.
    expect(share("std:IFRA_STD_028")).toBe("exceeds 4,750 %");
  });

  it("reading 1 is no, and reading 2 is set by the Cashmeran: 3,8 % / 23,75 % of the accord", () => {
    expect(report.asIs).toBe("no");
    expect(formatPercent(report.maxUse)).toBe("16,000 %");
  });

  it("the two natural isolates, coumarin and eugenol (of clove), leave their impurities pending (D7)", () => {
    const text = "Impurezas sin declarar: es un aislado natural y su producto no tiene documentos.";
    const impurities = report.pending.filter((p) => p.text.startsWith("Impurezas"));
    expect([...impurities].sort((x, y) => x.material.localeCompare(y.material))).toEqual([
      { material: "Cumarina natural", text },
      { material: "Eugenol 98%", text },
    ]);
    expect(report.partial).toBe(true);
  });

  it("the vanillin, of unknown origin and without documents, is pure by convention on its card (D7)", () => {
    expect(entry("Vainillina").pureByConvention).toBe(true);
    expect(entry("Cumarina natural").pureByConvention).toBeUndefined();
  });
});
