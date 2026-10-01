import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { compose, vectorOf } from "../core/compose";
import { COUMARIN } from "../core/fixtures/ifra-f001";
import { checkIfra, type IfraBase, type IfraData, type IfraMaterial, type IfraSubstance } from "../core/ifra";
import type { Change, Formula, FormulaHeader } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import { bandOverIfra, ifraOfMaterial, pourKey, previewPour, unitOf, type MaterialIfra } from "./usage-bar";

// The bar of the usual use and IFRA while typing (P57, P58, P59). Every number is worked out by
// hand in its comment. Coumarin's ceiling is L = 0,015. The final batch is F = 10 g (10⁷ µg) and
// the work batch W = 2 g (2·10⁶ µg), when the header has them; L·F = 150 000.
//
// For a material with `a` of coumarin per microgram, total mass m, carried C, and the bottle
// without it B_o, the ceilings of the material alone are:
//   now:       m ≤ L·F / a
//   bottle:    m ≤ L·B_o / (a − L)
//   completed: m ≤ L·F·B_o / (a·W − L·F)
// and the share of the aromatic matter is (Ca + q·(m − C)) / (A + q·(m − C)).

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
const tincture = material("tonka", "Tonka (tintura)"); // a quarter is coumarin
const weak = material("debil", "Cumarina débil"); // a hundredth: under the ceiling by itself
const blind = material("ciega", "Tintura sin dato"); // coumarin with a load without data: counts whole
const neutral = material("neutro", "Neutro");
const banned = material("prohibida", "Prohibida");
const pendingMaterial = material("pendiente", "Con pendiente");
const unchecked = material("sin-comprobar", "Sin comprobar");

const data: IfraData = {
  substances: new Map([COUMARIN, BANNED].map((s) => [s.key, s])),
  materials: new Map([
    [coumarin.key, checked([{ key: COUMARIN.key, fraction: Ratio.ONE }])],
    [tincture.key, checked([{ key: COUMARIN.key, fraction: Ratio.of(1, 4) }])],
    [weak.key, checked([{ key: COUMARIN.key, fraction: Ratio.of(1, 100) }])],
    [blind.key, checked([{ key: COUMARIN.key, fraction: null }])],
    [neutral.key, checked([])],
    [banned.key, checked([{ key: BANNED.key, fraction: Ratio.ONE }])],
    [pendingMaterial.key, checked([{ key: COUMARIN.key, fraction: Ratio.ONE }], ["citral"])],
    [unchecked.key, { status: "unchecked", substances: [], conditions: [] }],
  ]),
};

const formulaOf = (base: IfraBase, ...history: Change[]): Formula => ({ header: headers[base], history });
function read(formula: Formula, m: Material) {
  const report = checkIfra(formula, data);
  return ifraOfMaterial(formula, data, compose(formula), report, m);
}
const okOf = (formula: Formula, m: Material) => {
  const r = read(formula, m);
  if (r.status !== "ok") {
    throw new Error("unknown");
  }
  return r;
};

describe("the two ceilings of a material on the strip (P59)", () => {
  // Tincture 20 000 µg (S = 5 000 of coumarin), coumarin 10 000 µg (S = 10 000), neutral 970 000 µg.
  // B = A = 10⁶ µg: all of it is aromatic matter.
  const now = formulaOf("now", add("t", tincture, 20_000n), add("c", coumarin, 10_000n), add("n", neutral, 970_000n));

  it("now, tincture: alone m ≤ 150 000 / (1/4) = 600 000; with the coumarin, y = (150 000 − 15 000)/(1/4) = 540 000", () => {
    const r = okOf(now, tincture);
    expect(r.base).toBe("now");
    // solo: share = 600 000 / (10⁶ + 580 000) = 30/79
    expect(r.solo?.totalUg.toString()).toBe("600000");
    expect(r.solo?.share?.toString()).toBe("30/79");
    // aggregate: total 20 000 + 540 000 = 560 000, share = 560 000 / (10⁶ + 540 000) = 4/11
    expect(r.marginUg?.toString()).toBe("540000");
    expect(r.aggregate?.totalUg.toString()).toBe("560000");
    expect(r.aggregate?.share?.toString()).toBe("4/11");
    expect(r.solo?.limitedBy).toBe(COUMARIN.key);
    expect(r.partial).toBe(false);
  });

  it("now, coumarin: alone 150 000 (share 150 000 / 1 140 000 = 5/38); with the tincture y = 135 000 (145 000 / 1 135 000 = 29/227)", () => {
    const r = okOf(now, coumarin);
    expect(r.solo?.share?.toString()).toBe("5/38");
    expect(r.marginUg?.toString()).toBe("135000");
    expect(r.aggregate?.share?.toString()).toBe("29/227");
  });

  it("bottle: m·(a − L) ≤ L·B_o. Tincture 1 000 + neutral 47 000: B_o = 47 000, m ≤ 705 / (47/200) = 3 000, share 3 000 / 50 000 = 3/50", () => {
    // Nothing else loads coumarin, so the aggregate is the same: y = (720 − 250)/(47/200) = 2 000 and 1 000 + 2 000 = 3 000.
    const r = okOf(formulaOf("bottle", add("t", tincture, 1_000n), add("n", neutral, 47_000n)), tincture);
    expect(r.base).toBe("bottle");
    expect(r.solo?.totalUg.toString()).toBe("3000");
    expect(r.solo?.share?.toString()).toBe("3/50");
    expect(r.aggregate?.totalUg.toString()).toBe("3000");
    expect(r.aggregate?.share?.toString()).toBe("3/50");
  });

  it("bottle: a material weaker than the ceiling (a = 1/100 <= L) only dilutes: no solo ceiling, no marks", () => {
    const r = okOf(formulaOf("bottle", add("w", weak, 1_000n), add("n", neutral, 47_000n)), weak);
    expect(r.solo).toBeNull();
    expect(r.aggregate).toBeNull();
    expect(r.marginUg).toBeNull();
  });

  it("completed: m·(a·W − L·F) ≤ L·F·B_o. Tincture 10 000 + neutral 70 000: m ≤ 150 000·70 000 / 350 000 = 30 000, share 30 000 / 100 000 = 3/10", () => {
    // Aggregate: y = (L·F·B − S·W)/(a·W − L·F) = (1,2·10¹⁰ − 5·10⁹)/350 000 = 20 000; 10 000 + 20 000 = 30 000.
    const r = okOf(formulaOf("completed", add("t", tincture, 10_000n), add("n", neutral, 70_000n)), tincture);
    expect(r.base).toBe("completed");
    expect(r.solo?.totalUg.toString()).toBe("30000");
    expect(r.solo?.share?.toString()).toBe("3/10");
    expect(r.aggregate?.totalUg.toString()).toBe("30000");
    expect(r.aggregate?.share?.toString()).toBe("3/10");
  });

  it("a material that is not in the bottle: carried zero, and the share is what it would be next to the rest", () => {
    // Neutral 990 000 alone, now: coumarin m ≤ 150 000, share 150 000 / (990 000 + 150 000) = 5/38.
    const r = okOf(formulaOf("now", add("n", neutral, 990_000n)), coumarin);
    expect(r.solo?.share?.toString()).toBe("5/38");
    expect(r.aggregate?.share?.toString()).toBe("5/38");
    expect(r.marginUg?.toString()).toBe("150000");
  });

  it("a formula used as a material: a = 1/2 of coumarin, q = 1/2 aromatic (the rest is alcohol)", () => {
    const alcohol: Material = { key: DILUENTS.alcohol.key, kind: "base", name: "Alcohol", solvent: true };
    const accord: Formula = { header: noBatch, history: [add("a", coumarin, G), add("b", alcohol, G)] };
    const vector = vectorOf(accord);
    const accordMaterial: Material = { key: vector.id, kind: "formula", name: "Acorde", vector };
    const unit = unitOf(accordMaterial, data);
    expect(unit.kind === "known" && unit.aromatic.toString()).toBe("1/2");
    // Accord 10 000 µg (5 000 of coumarin) + neutral 990 000, now. A = 995 000 and Ca = 5 000.
    // Alone: m ≤ 150 000 / (1/2) = 300 000; the aromatic matter moves by q·(300 000 − 10 000) = 145 000:
    // share = (5 000 + 145 000) / (995 000 + 145 000) = 150 000 / 1 140 000 = 5/38.
    const f = formulaOf("now", add("a", accordMaterial, 10_000n), add("n", neutral, 990_000n));
    const r = okOf(f, accordMaterial);
    expect(r.solo?.totalUg.toString()).toBe("300000");
    expect(r.solo?.share?.toString()).toBe("5/38");
  });

  it("a load without data counts whole (worst case, §1.2): the ceiling is that of a = 1, and it is not partial", () => {
    const r = okOf(formulaOf("now", add("n", neutral, 990_000n)), blind);
    expect(r.solo?.totalUg.toString()).toBe("150000");
    expect(r.partial).toBe(false);
  });

  it("no ceiling: nothing regulated, or a diluent with nothing to check; unknown when it cannot be checked", () => {
    const f = formulaOf("now", add("n", neutral, 990_000n));
    expect(okOf(f, neutral)).toMatchObject({ solo: null, aggregate: null, marginUg: null });
    expect(okOf(f, DILUENTS.alcohol)).toMatchObject({ solo: null, aggregate: null, marginUg: null });
    expect(read(f, unchecked)).toEqual({ status: "unknown" });
    expect(read(f, { key: "prov:x", kind: "provisional", name: "X" })).toEqual({ status: "unknown" });
  });

  it("a prohibited substance (L = 0): both ceilings are zero, the share is zero, and the margin is zero", () => {
    const r = okOf(formulaOf("now", add("n", neutral, 990_000n)), banned);
    expect(r.solo?.totalUg.isZero()).toBe(true);
    expect(r.solo?.share?.isZero()).toBe(true);
    expect(r.marginUg?.isZero()).toBe(true);
  });

  it("a constituent that could not be checked makes the marks partial (amber)", () => {
    expect(okOf(formulaOf("now", add("n", neutral, 990_000n)), pendingMaterial).partial).toBe(true);
  });

  it("an aggregate of zero where the material is weaker than the ceiling but the bottle is already over it", () => {
    // Bottle base: coumarin 20 000 of 1 000 000 is 2 %, over 1,5 %; the weak material can only dilute, but nothing fits.
    const f = formulaOf("bottle", add("c", coumarin, 20_000n), add("n", neutral, 980_000n));
    const r = okOf(f, weak);
    expect(r.solo).toBeNull();
    expect(r.marginUg?.isZero()).toBe(true);
    expect(r.aggregate?.totalUg.isZero()).toBe(true);
  });
});

describe("IFRA while typing (P57): what adding the pour would do", () => {
  const pour = (m: Material, massUg: bigint) => ({ material: m, massUg, fraction: Ratio.ONE, diluent: null });
  // Coumarin 140 000 µg and neutral 860 000, now: S = 140 000 of 150 000 allowed.
  const f = formulaOf("now", add("c", coumarin, 140_000n), add("n", neutral, 860_000n));
  const before = checkIfra(f, data);

  it("up to the ceiling breaks nothing: 150 000 is not over, 160 000 is", () => {
    // 10 000 more: S = 150 000, 150 000 / 10⁷ = 0,015 = L, not above it.
    expect(previewPour(f, data, before, pour(coumarin, 10_000n)).breaks).toEqual([]);
    // 20 000 more: S = 160 000, 1,6 %.
    const over = previewPour(f, data, before, pour(coumarin, 20_000n));
    expect(over.breaks.map((b) => b.name)).toEqual(["Cumarina"]);
    expect(over.worsens).toEqual([]);
    // The share of the aromatic matter after: 160 000 / 1 020 000 = 8/51.
    expect(over.share?.toString()).toBe("8/51");
  });

  it("a material that adds nothing regulated breaks nothing, and the formula is left as it was", () => {
    expect(previewPour(f, data, before, pour(neutral, 50_000n))).toMatchObject({ breaks: [], worsens: [] });
    expect(f.history).toHaveLength(2);
  });

  it("a substance already over its ceiling is not a new break: it worsens when the pour loads it more", () => {
    const over = formulaOf("now", add("c", coumarin, 160_000n), add("n", neutral, 840_000n));
    const report = checkIfra(over, data);
    const p = previewPour(over, data, report, pour(coumarin, 10_000n));
    expect(p.breaks).toEqual([]);
    expect(p.worsens.map((b) => b.name)).toEqual(["Cumarina"]);
    expect(previewPour(over, data, report, pour(neutral, 10_000n)).worsens).toEqual([]);
  });

  it("a diluted pour counts only its pure matter: 40 000 µg at 50 % is 20 000 of coumarin", () => {
    const p = previewPour(f, data, before, { material: coumarin, massUg: 40_000n, fraction: Ratio.of(1, 2), diluent: DILUENTS.alcohol });
    expect(p.breaks.map((b) => b.name)).toEqual(["Cumarina"]);
  });

  it("the key of a pour changes with anything that changes the result", () => {
    const a = pour(coumarin, 10_000n);
    expect(pourKey(a)).toBe(pourKey(pour(coumarin, 10_000n)));
    expect(pourKey(a)).not.toBe(pourKey(pour(coumarin, 10_001n)));
    expect(pourKey(a)).not.toBe(pourKey({ ...a, fraction: Ratio.of(1, 2), diluent: DILUENTS.alcohol }));
    expect(pourKey(null)).toBe("");
  });
});

describe("the red flag of P60: the usual use past the IFRA ceiling of the material alone", () => {
  const pct = (n: number) => Ratio.of(n, 100);
  const ok = (share: Ratio | null): MaterialIfra => ({
    status: "ok",
    base: "bottle",
    partial: false,
    marginUg: null,
    marginLimitedBy: null,
    solo: { totalUg: Ratio.ONE, share, limitedBy: COUMARIN.key },
    aggregate: null,
  });

  it("flags a band whose top goes past the ceiling, and not one that stays under or on it", () => {
    // Coumarin alone at 1,5 % of the aromatic matter: a usual use up to 5 % goes past it; up to 1,5 %, not.
    expect(bandOverIfra({ max: pct(5), fuente: "prueba" }, ok(Ratio.of(3, 200)))).toBe(true);
    expect(bandOverIfra({ max: Ratio.of(3, 200), fuente: "prueba" }, ok(Ratio.of(3, 200)))).toBe(false);
  });

  it("never flags with something unknown (§1.2): no band, no IFRA data, or no ceiling", () => {
    expect(bandOverIfra(undefined, ok(Ratio.of(3, 200)))).toBe(false);
    expect(bandOverIfra({ max: pct(5), fuente: "prueba" }, { status: "unknown" })).toBe(false);
    expect(bandOverIfra({ max: pct(5), fuente: "prueba" }, ok(null))).toBe(false);
    expect(bandOverIfra({ max: pct(5), fuente: "prueba" }, null)).toBe(false);
  });
});
