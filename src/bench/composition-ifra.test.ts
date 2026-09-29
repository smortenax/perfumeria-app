import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { compose } from "../core/compose";
import { COUMARIN } from "../core/fixtures/ifra-f001";
import { checkIfra, type IfraBase, type IfraData, type IfraMaterial, type IfraSubstance } from "../core/ifra";
import type { Change, Formula, FormulaHeader } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import { describeLineIfra, detailOfLineIfra, ifraOfLines, roomText, usedText, type LineIfra } from "./composition-ifra";

// What each line of the composition carries of its IFRA ceiling (P57), in one base (P58). Every
// number of the tests is worked out by hand in its comment.
//
// Coumarin's ceiling is 1,5 % (L = 0,015). With a final batch F = 10 g (10⁷ µg) and a work
// batch W = 2 g, when the header has them. The bottle is B = 1 g (10⁶ µg) in every formula.
//   share of the ceiling = S / (base · L), with S the coumarin of the bottle, wherever it comes from
//   room, poured pure:  now: (L·F − S) / a      bottle: (L·B − S) / (a − L)
//                       completed: (L·F·B − S·W) / (a·W − L·F)

const G = 1_000_000n;
const noBatch: FormulaHeader = { name: "prueba", intention: "", container: null, workBatchUg: null, finalBatchUg: null };
const headers: Record<IfraBase, FormulaHeader> = {
  bottle: noBatch,
  now: { ...noBatch, finalBatchUg: 10n * G },
  completed: { ...noBatch, workBatchUg: 2n * G, finalBatchUg: 10n * G },
};
const add = (id: string, material: Material, massUg: bigint): Change => ({ kind: "add", id, material, massUg, fraction: Ratio.ONE, diluent: null });
const checked = (substances: IfraMaterial["substances"], pending?: readonly string[]): IfraMaterial => ({
  status: "checked",
  substances,
  conditions: [],
  ...(pending ? { pending } : {}),
});
const material = (key: string, name: string): Material => ({ key: `t:${key}`, kind: "base", name });

const BANNED: IfraSubstance = { key: "sub:prohibida", name: "Prohibida", limit: Ratio.ZERO, amendment: "51" };
const coumarin = material("cumarina", "Cumarina");
// A quarter of its pure matter is coumarin.
const tincture = material("tonka", "Tonka (tintura)");
// A hundredth: under the ceiling by itself, so poured into a bottle it can only dilute the coumarin.
const weak = material("debil", "Cumarina débil");
const neutral = material("neutro", "Neutro");
const banned = material("prohibida", "Prohibida");
const pendingMaterial = material("pendiente", "Con pendiente");
const unchecked = material("sin-comprobar", "Sin comprobar");
const provisional: Material = { key: "prov:acorde", kind: "provisional", name: "Acorde sin definir" };

const data: IfraData = {
  substances: new Map([COUMARIN, BANNED].map((s) => [s.key, s])),
  materials: new Map([
    [coumarin.key, checked([{ key: COUMARIN.key, fraction: Ratio.ONE }])],
    [tincture.key, checked([{ key: COUMARIN.key, fraction: Ratio.of(1, 4) }])],
    [weak.key, checked([{ key: COUMARIN.key, fraction: Ratio.of(1, 100) }])],
    [neutral.key, checked([])],
    [banned.key, checked([{ key: BANNED.key, fraction: Ratio.ONE }])],
    [pendingMaterial.key, checked([{ key: COUMARIN.key, fraction: Ratio.ONE }], ["citral"])],
    [unchecked.key, { status: "unchecked", substances: [], conditions: [] }],
  ]),
};

const formulaOf = (base: IfraBase, ...history: Change[]): Formula => ({ header: headers[base], history });

/** The lines of a formula, worked out as the bench does, in the base asked (or the report's). */
function linesOf(formula: Formula, base?: IfraBase, upTo?: number): ReadonlyMap<string, LineIfra> {
  const report = checkIfra(formula, data, upTo);
  return ifraOfLines(formula, data, report, compose(formula, upTo), base, upTo);
}
const viewOf = (map: ReadonlyMap<string, LineIfra>, m: Material) => describeLineIfra(map.get(m.key));

describe("The IFRA of a line: how much of its ceiling it carries, and how much more fits (P57)", () => {
  it("share and room of a material, in the base «now»", () => {
    // 20 000 µg of tincture: S = 5 000 µg of coumarin. share = 5 000 / (10⁷ · 0,015) = 1/30.
    // room, poured pure (a = 1/4): (150 000 − 5 000) / (1/4) = 580 000 µg.
    const lines = linesOf(formulaOf("now", add("t", tincture, 20_000n), add("n", neutral, 980_000n)));
    const line = lines.get(tincture.key);
    expect(line).toMatchObject({ kind: "reading", base: "now", partial: false });
    if (line?.kind === "reading") {
      expect(line.nearest?.used?.toString()).toBe("1/30");
      expect(line.nearest?.name).toBe("Cumarina");
      expect(line.margin).toMatchObject({ kind: "bounded", limitedBy: COUMARIN.key, limitedByName: "Cumarina" });
      expect(line.margin.kind === "bounded" && line.margin.pouredUg.toString()).toBe("580000");
    }
    expect(viewOf(lines, tincture)).toMatchObject({ share: "3,3 %", room: "quedan 580 mg", tone: "neutral" });
  });

  it("the share is that of the whole substance, wherever it comes from, and the room shrinks with it (§5.3)", () => {
    // Tincture 20 000 µg (5 000 of coumarin) and coumarin 10 000 µg: S = 15 000. share = 15 000 / 1,5·10⁵ = 1/10 for both.
    const lines = linesOf(formulaOf("now", add("t", tincture, 20_000n), add("c", coumarin, 10_000n), add("n", neutral, 970_000n)));
    for (const m of [tincture, coumarin]) {
      const line = lines.get(m.key);
      expect(line?.kind === "reading" && line.nearest?.used?.toString()).toBe("1/10");
    }
    // Pure coumarin (a = 1): 150 000 − 15 000 = 135 000 µg.
    expect(viewOf(lines, coumarin)).toMatchObject({ share: "10 %", room: "quedan 135 mg" });
  });

  it("the room is the base's: completed reads the work batch, and a base the header lacks falls back to the report's", () => {
    const formula = formulaOf("completed", add("t", tincture, 20_000n), add("n", neutral, 980_000n));
    // completed: base = B·F/W = 5·10⁶; share = 5 000 / (5·10⁶ · 0,015) = 1/15.
    // room: (L·F·B − S·W) / (a·W − L·F) = (1,5·10¹¹ − 1·10¹⁰) / (500 000 − 150 000) = 400 000 µg.
    const completed = linesOf(formula, "completed").get(tincture.key);
    expect(completed?.kind === "reading" && completed.nearest?.used?.toString()).toBe("1/15");
    expect(completed?.kind === "reading" && completed.margin.kind === "bounded" && completed.margin.pouredUg.toString()).toBe("400000");
    // now: base = F = 10⁷; share 1/30, room 580 000 µg.
    const now = linesOf(formula, "now").get(tincture.key);
    expect(now?.kind === "reading" && [now.base, now.nearest?.used?.toString()]).toEqual(["now", "1/30"]);
    // This header has no «bottle» base (P58): the base of the report, «completed», reads instead.
    expect(linesOf(formula, "bottle").get(tincture.key)).toEqual(linesOf(formula).get(tincture.key));
    expect(linesOf(formula).get(tincture.key)).toMatchObject({ base: "completed" });
  });

  it("over its ceiling, or with nothing left: red, and a margin of zero says so", () => {
    // The bottle as it is: 20 000 µg of coumarin in 1 g is 2 %. share = 0,02 / 0,015 = 4/3. Room: 15 000 − 20 000 < 0: nothing.
    const lines = linesOf(formulaOf("bottle", add("c", coumarin, 20_000n), add("n", neutral, 980_000n)));
    expect(viewOf(lines, coumarin)).toMatchObject({ share: "133 %", room: "sin margen", tone: "red" });
  });

  it("amber from 80 % of the ceiling, and never green at any level", () => {
    // 120 000 µg of coumarin over 10 g: 0,012 / 0,015 = 4/5. Room: 150 000 − 120 000 = 30 000 µg.
    const lines = linesOf(formulaOf("now", add("c", coumarin, 120_000n), add("n", neutral, 880_000n)));
    expect(viewOf(lines, coumarin)).toMatchObject({ share: "80 %", room: "quedan 30 mg", tone: "amber" });
    // Just under, 79 %: quiet grey. There is no tone for «fine» that could be taken for green (§1.2).
    const under = linesOf(formulaOf("now", add("c", coumarin, 118_500n), add("n", neutral, 881_500n)));
    expect(viewOf(under, coumarin)?.tone).toBe("neutral");
  });

  it("a prohibited substance that is present is prohibited: no share, red", () => {
    const lines = linesOf(formulaOf("bottle", add("b", banned, 1_000n), add("n", neutral, 999_000n)));
    expect(viewOf(lines, banned)).toMatchObject({ share: "prohibida", room: "sin margen", tone: "red" });
  });

  it("with no ceiling on the pour: «sin techo», with the share it carries", () => {
    // 100 000 µg of the weak material: S = 1 000 µg; in the bottle base a = 0,01 < L: it can only dilute. share = 0,001 / 0,015 = 2/30.
    const lines = linesOf(formulaOf("bottle", add("w", weak, 100_000n), add("n", neutral, 900_000n)));
    expect(viewOf(lines, weak)).toMatchObject({ share: "6,7 %", room: "sin techo", tone: "neutral" });
  });

  it("the figures could be optimistic: bounds, in amber, and the title says why", () => {
    // A constituent without a ceiling in the data: the same as the first test, but as bounds.
    // 10 000 µg: share = 10 000 / 1,5·10⁵ = 1/15; room = 150 000 − 10 000 = 140 000 µg.
    const pending = linesOf(formulaOf("now", add("p", pendingMaterial, 10_000n), add("n", neutral, 990_000n)));
    const view = viewOf(pending, pendingMaterial);
    expect(view).toMatchObject({ share: "≥ 6,7 %", room: "quedan ≤ 140 mg", tone: "amber" });
    expect(view?.title).toContain("optimista");
    // Another material that cannot be checked also leaves the bottle's report partial.
    const other = linesOf(formulaOf("now", add("c", coumarin, 10_000n), add("u", unchecked, 5_000n), add("n", neutral, 985_000n)));
    expect(viewOf(other, coumarin)).toMatchObject({ share: "≥ 6,7 %", tone: "amber" });
  });

  it("no data is no figure: provisional and unchecked materials say nothing, and are not zero (§1.2)", () => {
    const lines = linesOf(formulaOf("now", add("c", coumarin, 10_000n), add("u", unchecked, 5_000n), add("p", provisional, 5_000n)));
    expect(lines.get(unchecked.key)).toEqual({ kind: "unchecked" });
    expect(lines.get(provisional.key)).toEqual({ kind: "unchecked" });
    expect(viewOf(lines, unchecked)).toBeNull();
    expect(viewOf(lines, provisional)).toBeNull();
    // What is not in the data at all is unchecked too.
    const ghost = material("fantasma", "Fuera de los datos");
    expect(linesOf(formulaOf("now", add("g", ghost, 1_000n))).get(ghost.key)).toEqual({ kind: "unchecked" });
  });

  it("nothing regulated is nothing: no line, and neither is a diluent with nothing to check", () => {
    const lines = linesOf(formulaOf("now", add("n", neutral, 500_000n), add("d", DILUENTS.dpg, 400_000n), add("c", coumarin, 100_000n)));
    expect(lines.get(neutral.key)).toEqual({ kind: "none" });
    expect(lines.get(DILUENTS.dpg.key)).toEqual({ kind: "none" });
    expect(viewOf(lines, neutral)).toBeNull();
    expect(viewOf(lines, DILUENTS.dpg)).toBeNull();
  });

  it("reads the frame it is given: the same one as the report", () => {
    // At the first change only the tincture is in the bottle: S = 5 000 µg, share 1/30. With the coumarin
    // poured second, S = 15 000 µg and the share is 1/10.
    const formula = formulaOf("now", add("t", tincture, 20_000n), add("c", coumarin, 10_000n));
    const shareOf = (map: ReadonlyMap<string, LineIfra>, m: Material) => {
      const line = map.get(m.key);
      return line?.kind === "reading" ? line.nearest?.used?.toString() : undefined;
    };
    const first = linesOf(formula, undefined, 1);
    expect(first.has(coumarin.key)).toBe(false);
    expect(shareOf(first, tincture)).toBe("1/30");
    expect(shareOf(linesOf(formula), tincture)).toBe("1/10");
  });
});

describe("Saying it (P57)", () => {
  it("a share of a ceiling: whole from 10 %, a decimal below, and a trace is a trace, never a rounded zero", () => {
    expect(usedText(Ratio.of(1, 2))).toBe("50 %");
    expect(usedText(Ratio.of(1, 30))).toBe("3,3 %");
    expect(usedText(Ratio.of(1, 10))).toBe("10 %");
    expect(usedText(Ratio.of(4, 3))).toBe("133 %");
    expect(usedText(Ratio.of(1, 2_000))).toBe("< 0,1 %");
  });

  it("a room: grams from 1 g, milligrams below, and what is left but does not weigh", () => {
    expect(roomText(Ratio.of(145_000))).toBe("145 mg");
    expect(roomText(Ratio.of(2_500_000))).toBe("2,500 g");
    expect(roomText(Ratio.of(4_500))).toBe("4,5 mg");
    expect(roomText(Ratio.of(50))).toBe("< 0,1 mg");
    // An exact ratio is only rounded here, when shown.
    expect(roomText(Ratio.of(3_000_000, 37))).toBe("81 mg");
  });

  it("the detail says the closest ceiling and the room, with the substance that limits and the base", () => {
    const lines = linesOf(formulaOf("now", add("t", tincture, 20_000n), add("n", neutral, 980_000n)));
    expect(detailOfLineIfra(lines.get(tincture.key))).toEqual([
      ["Más cerca del techo", "Cumarina: 3,3 % de 1,5 %"],
      ["Margen", "quedan 580 mg puros antes del techo de Cumarina, en la base «ahora»"],
    ]);
    expect(detailOfLineIfra(lines.get(neutral.key))).toEqual([]);
    expect(detailOfLineIfra(undefined)).toEqual([]);
  });

  it("the title names the substance, its ceiling and the base", () => {
    const lines = linesOf(formulaOf("now", add("t", tincture, 20_000n), add("n", neutral, 980_000n)));
    expect(viewOf(lines, tincture)?.title).toBe(
      "Lleva el 3,3 % del techo de Cumarina (1,5 % del producto), en la base «ahora». Caben 580 mg más de este material, puro, antes del techo de Cumarina.",
    );
  });
});
