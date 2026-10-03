import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { formatPercent } from "../core/display";
import { checkIfra } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS } from "../core/model/material";
import { repositoryFor } from "../data/repositories";

// A bench formula with five naturals of lot 3c (Olfatorium), as the bench builds it from the v2
// repository: 1,9 g poured, taken to a perfume at 20 % (work batch 1,9 g, final 9,5 g). The
// dilutions are those the user puts in the bar when weighing (D8); the model is always at 100 %.
const repository = repositoryFor("v2");
const entry = (name: string) => {
  const e = repository.entries.find((x) => x.material.name === name);
  expect(e, name).toBeDefined();
  return e!;
};
const LINES: ReadonlyArray<readonly [string, string, string, keyof typeof DILUENTS | null]> = [
  ["Limón", "0,600", "100", null],
  ["Bergamota sin bergaptenos", "0,300", "100", null],
  ["Cedro Atlas", "0,500", "100", null],
  ["Absoluto de Tabaco", "0,400", "10", "dpg"],
  ["Salvia Officinalis", "0,100", "100", null],
];
const formula: Formula = {
  header: { name: "Lote 3c", intention: "", container: null, workBatchUg: 1_900_000n, finalBatchUg: 9_500_000n },
  history: LINES.map(([name, grams, percent, diluent], i): Change => ({
    kind: "add",
    id: `c${i + 1}`,
    material: entry(name).material,
    massUg: parseMass(grams, "g"),
    fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)),
    diluent: diluent === null ? null : DILUENTS[diluent],
  })),
};

describe("a bench formula with five naturals of lot 3c, checked with the v2", () => {
  const report = checkIfra(formula, repository.ifraData());
  const share = (key: string) => {
    const c = report.checks.find((x) => x.substance.key === key);
    return c ? `${c.verdict} ${formatPercent(c.worstUg.div(report.finalUg))}` : "—";
  };
  it("finds every material in the v2, and the lemon is ruled by its own standard (092): over its 2 %", () => {
    expect(report.unchecked).toEqual([]);
    expect(report.base).toBe("completed");
    expect(share("std:IFRA_STD_092")).toBe("exceeds 6,316 %"); // 0,6 g of 9,5 g
    expect(report.asIs).toBe("no");
    expect(formatPercent(report.maxUse)).toBe("6,333 %"); // 2 % × 1,9 g / 0,6 g
    // The lemon has a standard of its own, so its 5-MOP is not pending.
    expect(report.pending.filter((p) => p.material === "Limón")).toEqual([]);
  });

  it("the citral adds the lemon (annex) and the FCF bergamot (a placeholder of another supplier): bounded, not within (D2)", () => {
    const citral = report.checks.find((x) => x.substance.key === "std:IFRA_STD_021")!;
    expect(citral.verdict).toBe("bounded");
    expect(citral.unknownFrom).toEqual(["Bergamota sin bergaptenos"]);
    expect(formatPercent(citral.knownUg.div(report.finalUg))).toBe("0,221 %"); // the lemon: 3,5 % of 0,6 g
    expect(share("std:IFRA_STD_021")).toBe("bounded 0,249 %"); // plus 0,8698 % of 0,3 g at most
  });

  it("the coumarin of the tobacco comes only from another supplier's certificate: bounded", () => {
    expect(share("std:IFRA_STD_023")).toBe("bounded 0,001 %");
  });

  it("the FCF bergamot is not a member of the 089 (no standard of its own, no typical level, no documented 5-MOP): no 5-MOP is pending", () => {
    // The certificate of another supplier names no 5-MOP: it only brings the citral, limonene and linalool.
    const text = report.pending.filter((p) => p.material === "Bergamota sin bergaptenos").map((p) => p.text);
    expect(text).toEqual(["Su composición es parcial: puede llevar otras sustancias con techo."]);
    expect(report.partial).toBe(true);
  });

  it("the Atlas cedar carries the peroxide specification of the family 184", () => {
    expect(report.conditions).toEqual([{ material: "Cedro Atlas", text: "especificación (STD 184)" }]);
  });

  it("the cards say what IFRA says: ceiling, condition, or constituents", () => {
    expect(entry("Limón").state).toBe("con-techo");
    expect(entry("Cedro Atlas").state).toBe("condicion");
    expect(entry("Cedro Atlas").ifraNote).toContain("peroxides");
    expect(entry("Bergamota sin bergaptenos").state).toBe("por-constituyentes");
    // Its only regulated constituent comes from a placeholder, but it is a constituent: «por constituyentes».
    expect(entry("Absoluto de Tabaco").state).toBe("por-constituyentes");
  });
});
