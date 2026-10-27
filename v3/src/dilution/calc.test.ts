import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { bottleOf, examples, nominalBottle, plan, planFromMaterial, stored, storedBottle } from "./calc";

const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));
const g = (grams: string) => BigInt(Ratio.fromDecimal(grams).mul(Ratio.of(1_000_000n)).toFixed(0));

describe("what to weigh (V3-67, the calculator)", () => {
  it("10 % of 10 g in DPG: 1 g of material and 9 g of DPG", () => {
    expect(plan(pct("10"), g("10"), [{ diluentId: "dpg", share: null }])).toEqual({ materialUg: g("1"), diluents: [{ diluentId: "dpg", massUg: g("9") }] });
  });

  it("the user's example: 50 %, 30 % of ethanol and the rest DPG", () => {
    const p = plan(pct("50"), g("20"), [{ diluentId: "eth", share: pct("30") }, { diluentId: "dpg", share: null }]);
    expect(p).toEqual({ materialUg: g("10"), diluents: [{ diluentId: "eth", massUg: g("6") }, { diluentId: "dpg", massUg: g("4") }] });
  });

  it("three diluents, as many as it takes", () => {
    const p = plan(pct("10"), g("10"), [{ diluentId: "eth", share: pct("30") }, { diluentId: "ipm", share: pct("20") }, { diluentId: "dpg", share: null }]);
    expect(p.diluents.map((d) => d.massUg)).toEqual([g("3"), g("2"), g("4")]);
  });

  it("rounds to the milligram of the scale", () => {
    expect(plan(pct("3"), g("7"), [{ diluentId: "dpg", share: null }]).materialUg).toBe(g("0.21"));
    expect(plan(pct("1"), g("3.3333"), [{ diluentId: "dpg", share: null }]).materialUg).toBe(g("0.033"));
  });

  it("from the 50 % bottle, a 10 % of 10 g: 2 g of that bottle and 8 g more", () => {
    const source = { fraction: pct("50"), diluents: [{ diluentId: "dpg", fraction: pct("50") }] };
    expect(plan(pct("10"), g("10"), [{ diluentId: "dpg", share: null }], source)).toEqual({ materialUg: g("2"), diluents: [{ diluentId: "dpg", massUg: g("8") }] });
    expect(() => plan(pct("60"), g("10"), [{ diluentId: "dpg", share: null }], source)).toThrow(/further/);
  });

  it("refuses what cannot be: 0 % or 100 %, no diluent, shares above the bottle", () => {
    expect(() => plan(pct("100"), g("10"), [{ diluentId: "dpg", share: null }])).toThrow();
    expect(() => plan(pct("10"), g("10"), [])).toThrow();
    expect(() => plan(pct("50"), g("10"), [{ diluentId: "eth", share: pct("80") }, { diluentId: "dpg", share: null }])).toThrow(/add up/);
  });
});

describe("the window's other ways round (V3-79)", () => {
  const dpg = [{ diluentId: "dpg", share: null }];

  it("the user's example: 0,800 g of material at 10 % in DPG asks for 7,200 g of DPG, an 8 g bottle", () => {
    expect(planFromMaterial(pct("10"), g("0.8"), dpg)).toEqual({ totalUg: g("8"), materialUg: g("0.8"), diluents: [{ diluentId: "dpg", massUg: g("7.2") }] });
  });

  it("from the total: 8 g at 10 % is 0,800 g and 7,200 g, the same bottle", () => {
    expect(plan(pct("10"), g("8"), dpg)).toEqual({ materialUg: g("0.8"), diluents: [{ diluentId: "dpg", massUg: g("7.2") }] });
  });

  it("from a 10 % bottle to a 1 %: 0,500 g taken from it asks for 4,500 g more", () => {
    const source = { fraction: pct("10"), diluents: [{ diluentId: "dpg", fraction: pct("90") }] };
    const p = planFromMaterial(pct("1"), g("0.5"), dpg, source);
    expect(p).toEqual({ totalUg: g("5"), materialUg: g("0.5"), diluents: [{ diluentId: "dpg", massUg: g("4.5") }] });
    expect(bottleOf({ materialUg: p.materialUg, diluents: p.diluents, source }).fraction.eq(pct("1"))).toBe(true);
    expect(() => planFromMaterial(pct("20"), g("1"), dpg, source)).toThrow(/further/);
  });

  it("two diluents: 30 % of ethanol and the rest DPG fill the bottle to the milligram", () => {
    const p = planFromMaterial(pct("10"), g("0.803"), [{ diluentId: "eth", share: pct("30") }, { diluentId: "dpg", share: null }]);
    expect(p.totalUg).toBe(g("8.03"));
    expect(p.diluents).toEqual([{ diluentId: "eth", massUg: g("2.409") }, { diluentId: "dpg", massUg: g("4.818") }]);
    expect(p.materialUg + p.diluents.reduce((s, d) => s + d.massUg, 0n)).toBe(p.totalUg);
  });

  it("a total that is not a whole milligram rounds to the scale, and the bottle still adds up", () => {
    const p = planFromMaterial(pct("3"), g("0.1"), dpg);
    expect(p.totalUg).toBe(g("3.333"));
    expect(p.materialUg + p.diluents[0].massUg).toBe(p.totalUg);
  });

  it("the examples in grey: 1 g and 10 g of a 10 % in DPG", () => {
    expect(examples(pct("10"), dpg).map((e) => [e.totalUg, e.plan.materialUg, e.plan.diluents[0].massUg])).toEqual([
      [g("1"), g("0.1"), g("0.9")],
      [g("10"), g("1"), g("9")],
    ]);
  });

  it("refuses what cannot be: no material, 0 % or 100 %, no diluent", () => {
    expect(() => planFromMaterial(pct("10"), 0n, dpg)).toThrow();
    expect(() => planFromMaterial(pct("100"), g("1"), dpg)).toThrow();
    expect(() => planFromMaterial(pct("10"), g("1"), [])).toThrow();
  });
});

describe("what a bottle is, from what was weighed (V3-67)", () => {
  it("aimed at 10 %, weighed 1,030 g in 9,000 g: 10,269 %… exactly, kept as 10,2692 %", () => {
    const b = bottleOf({ materialUg: g("1.030"), diluents: [{ diluentId: "dpg", massUg: g("9") }] });
    expect(b.fraction.eq(Ratio.of(1030n, 10030n))).toBe(true);
    expect(stored(b.fraction).eq(pct("10.2692"))).toBe(true);
    const kept = storedBottle(b);
    expect(kept.fraction.add(kept.diluents[0].fraction).eq(Ratio.ONE)).toBe(true);
  });

  it("from another bottle, its diluents count: 2 g of a 50 % in DPG and 8 g of DPG is 10 % in DPG", () => {
    const source = { fraction: pct("50"), diluents: [{ diluentId: "dpg", fraction: pct("50") }] };
    const b = bottleOf({ materialUg: g("2"), diluents: [{ diluentId: "dpg", massUg: g("8") }], source });
    expect(b.fraction.eq(pct("10"))).toBe(true);
    expect(b.diluents).toEqual([{ diluentId: "dpg", fraction: pct("90"), massUg: g("8") }]);
  });

  it("three diluents kept to six decimals still add up to 1", () => {
    const b = storedBottle(bottleOf({ materialUg: g("1"), diluents: [{ diluentId: "a", massUg: g("1") }, { diluentId: "b", massUg: g("1") }, { diluentId: "c", massUg: g("0.001") }] }));
    expect(b.diluents.reduce((s, d) => s.add(d.fraction), b.fraction).eq(Ratio.ONE)).toBe(true);
  });
});

describe("a bottle saved without weights (V3-79)", () => {
  const dpg = [{ diluentId: "dpg", share: null }];

  it("10 % in DPG is 10 % and 90 %, with no masses", () => {
    expect(nominalBottle(pct("10"), dpg)).toEqual({ fraction: pct("10"), diluents: [{ diluentId: "dpg", fraction: pct("90"), massUg: null }] });
  });

  it("50 %, 30 % of ethanol and the rest DPG: 50 / 30 / 20", () => {
    const b = nominalBottle(pct("50"), [{ diluentId: "eth", share: pct("30") }, { diluentId: "dpg", share: null }]);
    expect(b.diluents.map((d) => [d.diluentId, d.fraction.toString()])).toEqual([
      ["eth", pct("30").toString()],
      ["dpg", pct("20").toString()],
    ]);
  });

  it("from a 10 % in DPG to a 1 %: 1 % and 99 % of DPG, the bottle's own DPG included", () => {
    const source = { fraction: pct("10"), diluents: [{ diluentId: "dpg", fraction: pct("90") }] };
    const b = nominalBottle(pct("1"), dpg, source);
    expect(b.fraction.eq(pct("1"))).toBe(true);
    expect(b.diluents.length).toBe(1);
    expect(b.diluents[0].fraction.eq(pct("99"))).toBe(true);
  });

  it("from a 50 % in ethanol to a 10 % with DPG: 10 % ethanol from the bottle and 80 % DPG", () => {
    const source = { fraction: pct("50"), diluents: [{ diluentId: "eth", fraction: pct("50") }] };
    const b = nominalBottle(pct("10"), dpg, source);
    expect(b.diluents.map((d) => [d.diluentId, d.fraction.toString()])).toEqual([
      ["eth", pct("10").toString()],
      ["dpg", pct("80").toString()],
    ]);
  });

  it("refuses shares that do not fit, a diluent twice, and diluting up from a bottle", () => {
    expect(() => nominalBottle(pct("50"), [{ diluentId: "eth", share: pct("50") }, { diluentId: "dpg", share: null }])).toThrow(/add up/);
    expect(() => nominalBottle(pct("50"), [{ diluentId: "eth", share: pct("40") }])).toThrow(/add up/);
    expect(() => nominalBottle(pct("10"), [{ diluentId: "dpg", share: pct("10") }, { diluentId: "dpg", share: null }])).toThrow(/once/);
    expect(() => nominalBottle(pct("20"), dpg, { fraction: pct("10"), diluents: [] })).toThrow(/further/);
  });

  it("kept to six decimals, it still adds up to 1", () => {
    const b = storedBottle(nominalBottle(Ratio.of(1n, 3n), [{ diluentId: "eth", share: Ratio.of(1n, 7n) }, { diluentId: "dpg", share: null }]));
    expect(b.diluents.reduce((s, d) => s.add(d.fraction), b.fraction).eq(Ratio.ONE)).toBe(true);
  });
});
