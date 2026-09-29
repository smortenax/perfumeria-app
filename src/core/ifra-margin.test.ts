import { describe, expect, it } from "vitest";
import { Ratio } from "./arith/ratio";
import { COUMARIN } from "./fixtures/ifra-f001";
import { checkIfra, marginOf, type IfraBase, type IfraData, type IfraMaterial, type IfraSubstance, type Margin } from "./ifra";
import type { Change, Formula, FormulaHeader } from "./model/formula";
import { DILUENTS, type Material } from "./model/material";
import { makeVector } from "./model/vector";

// The margin of a material (P57): how much more of it fits before a ceiling, in one base and
// in the worst case. Every number of the tests is worked out by hand in its comment.
//
// Common ground, in micrograms. Coumarin's ceiling is 1,5 % (L = 0,015). The final batch is
// F = 10 g and the work batch is W = 2 g, when the header has them. The bottle is B = 1 g.
//
// With «a» the coumarin in one microgram poured and S the coumarin the bottle already has:
//   now:       y ≤ (L·F − S) / a
//   bottle:    y ≤ (L·B − S) / (a − L)                 when a > L; no ceiling otherwise
//   completed: y ≤ (L·F·B − S·W) / (a·W − L·F)         when a·W > L·F; no ceiling otherwise
// with L·F = 150 000, L·B = 15 000, L·F·B = 1,5·10¹¹ and W = 2 000 000.

const G = 1_000_000n;
const header: FormulaHeader = { name: "prueba", intention: "", container: null, workBatchUg: null, finalBatchUg: null };
const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100));
const add = (id: string, material: Material, massUg: bigint): Change => ({ kind: "add", id, material, massUg, fraction: Ratio.ONE, diluent: null });
const checked = (substances: IfraMaterial["substances"], pending?: readonly string[]): IfraMaterial => ({
  status: "checked",
  substances,
  conditions: [],
  ...(pending ? { pending } : {}),
});
const material = (key: string, name: string, extra: Partial<Material> = {}): Material => ({ key: `t:${key}`, kind: "base", name, ...extra });

const BANNED: IfraSubstance = { key: "sub:prohibida", name: "Prohibida", limit: Ratio.ZERO, amendment: "51" };
const BENZOATE: IfraSubstance = { key: "sub:benzoato", name: "Benzoato de bencilo", limit: pct("4,8"), amendment: "51" };
const TWIN_A: IfraSubstance = { key: "sub:gemela-a", name: "Gemela A", limit: pct("2"), amendment: "51" };
const TWIN_B: IfraSubstance = { key: "sub:gemela-b", name: "Gemela B", limit: pct("2"), amendment: "51" };

const coumarin = material("cumarina", "Cumarina");
// A quarter of its pure matter is coumarin.
const tincture = material("tonka", "Tonka (tintura)");
// A hundredth: under the ceiling by itself, so it can only dilute the coumarin of a bottle.
const weak = material("debil", "Cumarina débil");
// Exactly the ceiling of coumarin, 1,5 %: in the bottle it neither raises nor lowers the share.
const exact = material("exacta", "Cumarina al techo");
// 7,5 %: with a work batch of 2 g and a final one of 10 g, exactly the strength that changes nothing when completed.
const strong = material("fuerte", "Cumarina al 7,5 %");
// Declared with none of it: tested, and clean.
const zero = material("cero", "Sin cumarina");
// Carries coumarin, with a load without data: it counts whole, in the worst case (§1.2).
const blind = material("ciega", "Tintura sin dato");
const neutral = material("neutro", "Neutro");
const banned = material("prohibida", "Prohibida");
const twin = material("gemela", "Gemela");
const orphan = material("huerfana", "Huérfana");
const pendingMaterial = material("pendiente", "Con pendiente");
const unchecked = material("sin-comprobar", "Sin comprobar");
const ghost = material("fantasma", "Fuera de los datos");
const provisional: Material = { key: "prov:acorde", kind: "provisional", name: "Acorde sin definir" };
const provisionalDiluent: Material = { key: "solv-prov:jojoba", kind: "provisional", name: "Jojoba", solvent: true };
const pendingDiluent = material("vehiculo", "Vehículo", { solvent: true });
const withPending = material("etiquetada", "Con constituyente pendiente");

const data: IfraData = {
  substances: new Map([COUMARIN, BANNED, BENZOATE, TWIN_A, TWIN_B].map((s) => [s.key, s])),
  materials: new Map([
    [coumarin.key, checked([{ key: COUMARIN.key, fraction: Ratio.ONE }])],
    [tincture.key, checked([{ key: COUMARIN.key, fraction: Ratio.of(1, 4) }])],
    [weak.key, checked([{ key: COUMARIN.key, fraction: Ratio.of(1, 100) }])],
    [exact.key, checked([{ key: COUMARIN.key, fraction: Ratio.of(3, 200) }])],
    [strong.key, checked([{ key: COUMARIN.key, fraction: Ratio.of(3, 40) }])],
    [zero.key, checked([{ key: COUMARIN.key, fraction: Ratio.ZERO }])],
    [blind.key, checked([{ key: COUMARIN.key, fraction: null }])],
    [neutral.key, checked([])],
    [banned.key, checked([{ key: BANNED.key, fraction: Ratio.ONE }])],
    [
      twin.key,
      checked([
        { key: TWIN_A.key, fraction: Ratio.ONE },
        { key: TWIN_B.key, fraction: Ratio.ONE },
      ]),
    ],
    // Its only substance is not among the ceilings of the data: there is nothing to press on.
    [orphan.key, checked([{ key: "sub:sin-techo", fraction: Ratio.ONE }])],
    [pendingMaterial.key, checked([{ key: COUMARIN.key, fraction: Ratio.ONE }], ["citral"])],
    [unchecked.key, { status: "unchecked", substances: [], conditions: [] }],
    // Benzyl benzoate is a diluent with a standard of its own; DPG and alcohol have none.
    [DILUENTS.bb.key, checked([{ key: BENZOATE.key, fraction: Ratio.ONE }])],
    [pendingDiluent.key, checked([], ["algo"])],
    [withPending.key, checked([], ["citral"])],
  ]),
};

const headers: Record<IfraBase, FormulaHeader> = {
  bottle: header,
  now: { ...header, finalBatchUg: 10n * G },
  completed: { ...header, workBatchUg: 2n * G, finalBatchUg: 10n * G },
};
const BASES: readonly IfraBase[] = ["now", "completed", "bottle"];

/** A 1 g bottle with 5 000 µg of coumarin: 20 000 µg of the tincture, poured pure. */
const overlapped = (h: FormulaHeader): Formula => ({ header: h, history: [add("t", tincture, 20_000n), add("n", neutral, 980_000n)] });
/** A 1 g bottle with nothing regulated in it. */
const clean = (h: FormulaHeader): Formula => ({ header: h, history: [add("n", neutral, 1_000_000n)] });
/** A 1 g bottle with 20 000 µg of coumarin: 2 % of the bottle, over the ceiling as it is. */
const twoPercent = (h: FormulaHeader): Formula => ({ header: h, history: [add("c", coumarin, 20_000n), add("n", neutral, 980_000n)] });

type Pour = Parameters<typeof marginOf>[2];
const pure = (m: Material): Pour => ({ material: m, fraction: Ratio.ONE, diluent: null });
const diluted = (m: Material, percent: string, diluent: Material): Pour => ({ material: m, fraction: pct(percent), diluent });

/** A margin as exact text: «145000 sub:cumarina», with « partial» when it may be optimistic, or its kind alone. */
function show(margin: Margin): string {
  switch (margin.kind) {
    case "unknown":
      return "unknown";
    case "unbounded":
      return margin.partial ? "unbounded partial" : "unbounded";
    case "bounded":
      return `${margin.pouredUg.toString()} ${margin.limitedBy}${margin.partial ? " partial" : ""}`;
  }
}
/** The margin in each base, each with the header that has that base. */
function margins(formula: (h: FormulaHeader) => Formula, pour: Pour): Record<IfraBase, string> {
  const each = (base: IfraBase) => show(marginOf(formula(headers[base]), data, pour, base));
  return { now: each("now"), completed: each("completed"), bottle: each("bottle") };
}
const C = COUMARIN.key;

describe("The margin of a material: how much more fits before a ceiling (P57)", () => {
  it("in a clean bottle: what the ceiling allows of the coumarin poured pure, in each base", () => {
    // S = 0, a = 1.
    // now:       L·F / 1 = 150 000
    // bottle:    L·B / (1 − L) = 15 000 / 0,985 = 3 000 000 / 197
    // completed: L·F·B / (W − L·F) = 1,5·10¹¹ / 1 850 000 = 3 000 000 / 37
    expect(margins(clean, pure(coumarin))).toEqual({
      now: `150000 ${C}`,
      bottle: `3000000/197 ${C}`,
      completed: `3000000/37 ${C}`,
    });
  });

  it("the overlap: the coumarin another material already brings takes room", () => {
    // S = 5 000 (a quarter of 20 000 µg of tincture), a = 1.
    // now:       (150 000 − 5 000) / 1 = 145 000
    // bottle:    (15 000 − 5 000) / 0,985 = 2 000 000 / 197
    // completed: (1,5·10¹¹ − 5 000 × 2 000 000) / 1 850 000 = 1,4·10¹¹ / 1 850 000 = 2 800 000 / 37
    const overlap = margins(overlapped, pure(coumarin));
    expect(overlap).toEqual({ now: `145000 ${C}`, bottle: `2000000/197 ${C}`, completed: `2800000/37 ${C}` });
    // Less than in a clean bottle, in every base.
    for (const base of BASES) {
      const free = marginOf(clean(headers[base]), data, pure(coumarin), base);
      const taken = marginOf(overlapped(headers[base]), data, pure(coumarin), base);
      expect(free.kind === "bounded" && taken.kind === "bounded" && taken.pouredUg.lt(free.pouredUg), base).toBe(true);
    }
  });

  it("does not matter which material brought the coumarin: the same material, another one, or a load without data", () => {
    const same = (h: FormulaHeader): Formula => ({ header: h, history: [add("c", coumarin, 5_000n), add("n", neutral, 995_000n)] });
    // A load without data counts whole, in the worst case: 5 000 µg of it is 5 000 µg of coumarin (§1.2).
    const unknownLoad = (h: FormulaHeader): Formula => ({ header: h, history: [add("b", blind, 5_000n), add("n", neutral, 995_000n)] });
    const expected = margins(overlapped, pure(coumarin));
    expect(margins(same, pure(coumarin))).toEqual(expected);
    expect(margins(unknownLoad, pure(coumarin))).toEqual(expected);
  });

  it("a dilution: 10 % in DPG gives another margin than pure, and alcohol is the same as DPG", () => {
    // a = 0,1: the DPG has nothing to check, it adds mass and no substances.
    // now:       145 000 / 0,1 = 1 450 000
    // bottle:    10 000 / (0,1 − 0,015) = 10 000 / 0,085 = 2 000 000 / 17
    // completed: 1,4·10¹¹ / (0,1 × 2 000 000 − 150 000) = 1,4·10¹¹ / 50 000 = 2 800 000
    const inDpg = margins(overlapped, diluted(coumarin, "10", DILUENTS.dpg));
    expect(inDpg).toEqual({ now: `1450000 ${C}`, bottle: `2000000/17 ${C}`, completed: `2800000 ${C}` });
    expect(inDpg).not.toEqual(margins(overlapped, pure(coumarin)));
    expect(margins(overlapped, diluted(coumarin, "10", DILUENTS.alcohol))).toEqual(inDpg);
  });

  it("a diluent with a standard of its own counts too, and the one that sets the margin is named", () => {
    // 10 % coumarin in benzyl benzoate (ceiling 4,8 %) in a clean bottle: a = 0,1 of coumarin, 0,9 of benzoate.
    // now:       coumarin 150 000 / 0,1 = 1 500 000; benzoate 480 000 / 0,9 = 1 600 000 / 3      → benzoate
    // bottle:    coumarin 15 000 / 0,085 = 3 000 000 / 17; benzoate 48 000 / 0,852 = 4 000 000 / 71 → benzoate
    // completed: coumarin 1,5·10¹¹ / 50 000 = 3 000 000; benzoate 4,8·10¹¹ / (0,9 × 2 000 000 − 480 000) = 4 000 000 / 11 → benzoate
    const B = BENZOATE.key;
    expect(margins(clean, diluted(coumarin, "10", DILUENTS.bb))).toEqual({
      now: `1600000/3 ${B}`,
      bottle: `4000000/71 ${B}`,
      completed: `4000000/11 ${B}`,
    });
  });

  it("a pour no stronger than the ceiling can only dilute: it sets none in the bottle or when completed", () => {
    // a = 0,01, under L = 0,015 (and a·W = 20 000, under L·F = 150 000).
    // now: 150 000 / 0,01 = 15 000 000. Bottle and completed: no ceiling.
    expect(margins(clean, pure(weak))).toEqual({ now: `15000000 ${C}`, bottle: "unbounded", completed: "unbounded" });
  });

  it("a pour exactly as strong as the ceiling changes nothing where that is the limit, and sets none there", () => {
    // Bottle: a = L = 0,015 makes the slope zero, so it sets none. now: 150 000 / 0,015 = 10 000 000.
    // Completed: a·W = 30 000, under L·F = 150 000: none either.
    expect(margins(clean, pure(exact))).toEqual({ now: `10000000 ${C}`, bottle: "unbounded", completed: "unbounded" });
    // With a = 0,075, a·W = 150 000 = L·F: completed the slope is zero, and it sets none.
    // now: 150 000 / 0,075 = 2 000 000. Bottle: 15 000 / (0,075 − 0,015) = 250 000.
    expect(margins(clean, pure(strong))).toEqual({ now: `2000000 ${C}`, bottle: `250000 ${C}`, completed: "unbounded" });
  });

  it("a formula used as a material is expanded into its vector", () => {
    // A fifth coumarin, four fifths neutral: a = 0,2, with S = 5 000.
    // now:       145 000 / 0,2 = 725 000
    // bottle:    10 000 / (0,2 − 0,015) = 10 000 / 0,185 = 2 000 000 / 37
    // completed: 1,4·10¹¹ / (0,2 × 2 000 000 − 150 000) = 1,4·10¹¹ / 250 000 = 560 000
    const accord = (parts: Array<[Material, number]>): Material => {
      const vector = makeVector(parts.map(([m, amount]) => ({ material: m, amount: Ratio.of(amount) })));
      return { key: vector.id, kind: "formula", name: "Acorde", vector };
    };
    const fifth = accord([[coumarin, 1], [neutral, 4]]);
    const expected = { now: `725000 ${C}`, bottle: `2000000/37 ${C}`, completed: `560000 ${C}` };
    expect(margins(overlapped, pure(fifth))).toEqual(expected);
    // Its solvent adds mass, not substances; and a component with a load without data counts whole.
    expect(margins(overlapped, pure(accord([[coumarin, 1], [DILUENTS.alcohol, 4]])))).toEqual(expected);
    expect(margins(overlapped, pure(accord([[blind, 1], [neutral, 4]])))).toEqual(expected);
    // Diluted to half in DPG it is 0,1 of coumarin per microgram, like 10 % coumarin.
    expect(margins(overlapped, diluted(fifth, "50", DILUENTS.dpg))).toEqual(margins(overlapped, diluted(coumarin, "10", DILUENTS.dpg)));
  });

  it("the substance that sets it is named, and the first one wins a tie", () => {
    // Two substances, each with 2 %, both at a = 1, in a clean bottle. now: 0,02 × 10 000 000 = 200 000.
    expect(margins(clean, pure(twin)).now).toBe(`200000 ${TWIN_A.key}`);
  });

  it("follows a frame of the history", () => {
    const history = overlapped(headers.now).history; // the neutral goes in second
    const frames = (base: IfraBase, upTo?: number) => show(marginOf({ header: headers[base], history: [history[1], history[0]] }, data, pure(coumarin), base, upTo));
    // With only the neutral, poured first (980 000 µg, no coumarin): S = 0, B = 980 000.
    // now:    150 000
    // bottle: L·B / 0,985 = 14 700 / 0,985 = 2 940 000 / 197
    expect(frames("now", 1)).toBe(`150000 ${C}`);
    expect(frames("bottle", 1)).toBe(`2940000/197 ${C}`);
    // With both, the margins of the overlap.
    expect(frames("now")).toBe(`145000 ${C}`);
    expect(frames("bottle")).toBe(`2000000/197 ${C}`);
    expect(frames("bottle", 2)).toBe(frames("bottle"));
  });
});

describe("The margin: what leaves nothing, or leaves everything", () => {
  it("a substance already over its ceiling leaves nothing: 0, whatever the base", () => {
    // 200 000 µg of coumarin in 1 g: over in every base.
    const heavy = (h: FormulaHeader): Formula => ({ header: h, history: [add("c", coumarin, 200_000n), add("n", neutral, 800_000n)] });
    expect(margins(heavy, pure(coumarin))).toEqual({ now: `0 ${C}`, bottle: `0 ${C}`, completed: `0 ${C}` });
  });

  it("one that is over in one base only leaves nothing in that one", () => {
    // S = 20 000: 2 % of the bottle, and 0,2 % of the 10 g of the final batch.
    // now:       (150 000 − 20 000) / 1 = 130 000
    // bottle:    over (15 000 − 20 000 < 0): 0
    // completed: (1,5·10¹¹ − 20 000 × 2 000 000) / 1 850 000 = 1,1·10¹¹ / 1 850 000 = 2 200 000 / 37
    expect(margins(twoPercent, pure(coumarin))).toEqual({ now: `130000 ${C}`, bottle: `0 ${C}`, completed: `2200000/37 ${C}` });
  });

  it("a pour that would dilute what is over leaves nothing either: it is already over", () => {
    // The weak coumarin (a = 0,01) would bring the bottle down little by little, but the margin is what
    // can be added without going over, and the bottle is over already: 0. In «now» it counts as usual
    // ((150 000 − 20 000) / 0,01 = 13 000 000); completed, the bottle is not over and its strength is
    // under the ceiling, so it sets none.
    expect(margins(twoPercent, pure(weak))).toEqual({ now: `13000000 ${C}`, bottle: `0 ${C}`, completed: "unbounded" });
  });

  it("exactly at the ceiling: nothing for a stronger pour, everything for a weaker one", () => {
    // S = 15 000 in 1 g is exactly 1,5 % of the bottle.
    const atCeiling = (h: FormulaHeader): Formula => ({ header: h, history: [add("c", coumarin, 15_000n), add("n", neutral, 985_000n)] });
    expect(margins(atCeiling, pure(coumarin)).bottle).toBe(`0 ${C}`);
    expect(margins(atCeiling, pure(weak)).bottle).toBe("unbounded");
  });

  it("a prohibited substance leaves nothing, even in an empty bottle", () => {
    const empty = (h: FormulaHeader): Formula => ({ header: h, history: [] });
    const K = BANNED.key;
    expect(margins(empty, pure(banned))).toEqual({ now: `0 ${K}`, bottle: `0 ${K}`, completed: `0 ${K}` });
    expect(margins(clean, pure(banned))).toEqual({ now: `0 ${K}`, bottle: `0 ${K}`, completed: `0 ${K}` });
    // Diluted it is still there: any amount is over a ceiling of zero.
    expect(margins(clean, diluted(banned, "1", DILUENTS.dpg)).now).toBe(`0 ${K}`);
  });

  it("a material with no substances has no margin to run out of: unbounded", () => {
    const all = { now: "unbounded", bottle: "unbounded", completed: "unbounded" };
    expect(margins(overlapped, pure(neutral))).toEqual(all);
    // A diluent of the app with nothing to check.
    expect(margins(overlapped, pure(DILUENTS.dpg))).toEqual(all);
    expect(margins(overlapped, pure(DILUENTS.alcohol))).toEqual(all);
    // A substance that is not among the ceilings of the data puts none.
    expect(margins(overlapped, pure(orphan))).toEqual(all);
    // Nor one declared with none of it.
    expect(margins(overlapped, pure(zero))).toEqual(all);
  });
});

describe("The margin: the unknown is never a number (§1.2, §5.5)", () => {
  const unknown = { now: "unknown", bottle: "unknown", completed: "unknown" };

  it("a material that cannot be checked", () => {
    expect(margins(overlapped, pure(unchecked))).toEqual(unknown);
    expect(margins(overlapped, pure(provisional))).toEqual(unknown);
    expect(margins(overlapped, pure(ghost))).toEqual(unknown);
    // A formula without its vector is not known either.
    expect(margins(overlapped, pure({ key: "vec:rota", kind: "formula", name: "Rota" }))).toEqual(unknown);
  });

  it("a diluent that cannot be checked, when there is a dilution", () => {
    expect(margins(overlapped, diluted(coumarin, "10", provisionalDiluent))).toEqual(unknown);
    expect(margins(overlapped, diluted(coumarin, "10", unchecked))).toEqual(unknown);
    expect(margins(overlapped, diluted(coumarin, "10", ghost))).toEqual(unknown);
    // Diluted, but the diluent is not said: nobody knows what the rest is.
    expect(margins(overlapped, { material: coumarin, fraction: pct("10"), diluent: null })).toEqual(unknown);
  });

  it("but a diluent counts only when there is a dilution", () => {
    expect(margins(overlapped, { material: coumarin, fraction: Ratio.ONE, diluent: provisionalDiluent })).toEqual(margins(overlapped, pure(coumarin)));
  });

  it("a component of a formula used as a material that cannot be checked", () => {
    const vector = makeVector([
      { material: coumarin, amount: Ratio.of(1) },
      { material: provisional, amount: Ratio.of(1) },
    ]);
    expect(margins(overlapped, pure({ key: vector.id, kind: "formula", name: "Acorde", vector }))).toEqual(unknown);
  });
});

describe("The margin: partial when the number could be optimistic (§5.5)", () => {
  const withUnchecked = (h: FormulaHeader): Formula => ({ header: h, history: [add("u", unchecked, 10_000n), add("n", neutral, 990_000n)] });

  it("is not partial when everything is known", () => {
    const m = marginOf(clean(headers.now), data, pure(coumarin), "now");
    expect(m.kind === "bounded" && m.partial).toBe(false);
    const u = marginOf(clean(headers.now), data, pure(neutral), "now");
    expect(u).toEqual({ kind: "unbounded", partial: false });
  });

  it("is partial when the report is: something in the bottle was never checked", () => {
    expect(margins(withUnchecked, pure(coumarin)).now).toBe(`150000 ${C} partial`);
    expect(margins(withUnchecked, pure(neutral)).now).toBe("unbounded partial");
  });

  it("is partial when the material, the diluent or a component of it has a constituent that could not be checked", () => {
    expect(margins(clean, pure(pendingMaterial)).now).toBe(`150000 ${C} partial`);
    expect(margins(clean, diluted(coumarin, "10", pendingDiluent)).now).toBe(`1500000 ${C} partial`);
    const vector = makeVector([
      { material: coumarin, amount: Ratio.of(1) },
      { material: withPending, amount: Ratio.of(4) },
    ]);
    expect(margins(clean, pure({ key: vector.id, kind: "formula", name: "Acorde", vector })).now).toBe(`750000 ${C} partial`);
    expect(margins(clean, pure(withPending)).now).toBe("unbounded partial");
  });
});

describe("The margin: the base has to exist for the header (P58)", () => {
  const formula = (h: FormulaHeader) => clean(h);
  const ask = (h: FormulaHeader, base: IfraBase) => () => marginOf(formula(h), data, pure(coumarin), base);

  it("asks for what the header has", () => {
    expect(ask(headers.bottle, "bottle")).not.toThrow();
    expect(ask(headers.now, "now")).not.toThrow();
    expect(ask(headers.completed, "now")).not.toThrow();
    expect(ask(headers.completed, "completed")).not.toThrow();
  });

  it("throws for a base the header does not have", () => {
    // «completed» needs a work batch, and a final one.
    expect(ask(headers.now, "completed")).toThrow(Error);
    expect(ask({ ...headers.now, workBatchUg: 0n }, "completed")).toThrow(Error);
    expect(ask({ ...header, workBatchUg: 2n * G }, "completed")).toThrow(Error);
    // «now» needs a final batch.
    expect(ask(headers.bottle, "now")).toThrow(Error);
    // «the bottle as it is» exists only when there is no final batch.
    expect(ask(headers.now, "bottle")).toThrow(Error);
    expect(ask(headers.completed, "bottle")).toThrow(Error);
  });

  it("throws before answering anything, even for a material that would be unknown", () => {
    expect(() => marginOf(clean(headers.now), data, pure(provisional), "completed")).toThrow(Error);
  });

  it("refuses a fraction of pure matter that is not above 0 and at most 1", () => {
    expect(() => marginOf(clean(headers.now), data, { material: coumarin, fraction: Ratio.ZERO, diluent: DILUENTS.dpg }, "now")).toThrow(RangeError);
    expect(() => marginOf(clean(headers.now), data, { material: coumarin, fraction: Ratio.of(3, 2), diluent: DILUENTS.dpg }, "now")).toThrow(RangeError);
  });
});

describe("The margin agrees with the report: what it says fits, fits; one microgram more does not", () => {
  const poured = (formula: Formula, pour: Pour, massUg: bigint): Formula => ({
    ...formula,
    history: [...formula.history, { kind: "add", id: "poured", material: pour.material, massUg, fraction: pour.fraction, diluent: pour.diluent }],
  });
  const cases: Array<[string, (h: FormulaHeader) => Formula, Pour, string[]]> = [
    ["coumarin in a clean bottle", clean, pure(coumarin), [C]],
    ["coumarin over the tincture", overlapped, pure(coumarin), [C]],
    ["coumarin at 10 % in DPG", overlapped, diluted(coumarin, "10", DILUENTS.dpg), [C]],
    ["coumarin at 10 % in benzyl benzoate", clean, diluted(coumarin, "10", DILUENTS.bb), [C, BENZOATE.key]],
    ["the weak coumarin", clean, pure(weak), [C]],
    ["a coumarin exactly at the ceiling", clean, pure(exact), [C]],
    ["a coumarin as strong as the work batch asks", clean, pure(strong), [C]],
    ["coumarin over a load without data", (h) => ({ header: h, history: [add("b", blind, 5_000n), add("n", neutral, 995_000n)] }), pure(coumarin), [C]],
    ["coumarin in a bottle at 2 %", twoPercent, pure(coumarin), [C]],
    ["the weak coumarin in a bottle at 2 %", twoPercent, pure(weak), [C]],
    ["a prohibited material", clean, pure(banned), [BANNED.key]],
    ["two substances at once", clean, pure(twin), [TWIN_A.key, TWIN_B.key]],
  ];

  for (const [name, formula, pour, carried] of cases) {
    for (const base of BASES) {
      it(`${name}, ${base}`, () => {
        const f = formula(headers[base]);
        const margin = marginOf(f, data, pour, base);
        const fits = (massUg: bigint) => {
          const reading = checkIfra(poured(f, pour, massUg), data).readings.find((r) => r.base === base);
          return carried.every((key) => {
            const verdict = reading?.checks.find((c) => c.key === key)?.verdict;
            return verdict === "within" || verdict === "bounded";
          });
        };
        if (margin.kind === "bounded") {
          const whole = margin.pouredUg.num / margin.pouredUg.den;
          if (whole > 0n) {
            expect(fits(whole), `${whole} µg`).toBe(true);
          }
          expect(fits(whole + 1n), `${whole + 1n} µg`).toBe(false);
        } else {
          expect(margin.kind).toBe("unbounded");
          expect(fits(10n ** 15n)).toBe(true);
        }
      });
    }
  }
});

describe("what still fits of a substance is the margin of that substance poured pure (P58)", () => {
  // 10 mg of coumarin in a 1 g bottle. Bottle alone: (L·B − S)/(1 − L) = (15 000 − 10 000)/0,985
  // = 1 000 000/197. With F = 10 g: now (L·F − S) = 140 000; completed with W = 2 g:
  // (L·F·B − S·W)/(W − L·F) = (1,5·10¹¹ − 2·10¹⁰)/1 850 000 = 2 600 000/37.
  const history: Change[] = [add("c", coumarin, 10_000n), add("n", neutral, 990_000n)];
  const cases: Array<[Partial<FormulaHeader>, IfraBase, string]> = [
    [{}, "bottle", "1000000/197"],
    [{ finalBatchUg: 10n * G, workBatchUg: 2n * G }, "now", "140000"],
    [{ finalBatchUg: 10n * G, workBatchUg: 2n * G }, "completed", "2600000/37"],
  ];

  it.each(cases)("%o in the %s base", (batches, base, room) => {
    const formula: Formula = { header: { ...header, ...batches }, history };
    const reading = checkIfra(formula, data).readings.find((r) => r.base === base);
    const fits = reading?.checks.find((c) => c.key === COUMARIN.key)?.roomUg;
    expect(fits?.toString()).toBe(room);
    const margin = marginOf(formula, data, { material: coumarin, fraction: Ratio.ONE, diluent: null }, base);
    expect(margin.kind === "bounded" && margin.pouredUg.eq(fits as Ratio)).toBe(true);
  });
});
