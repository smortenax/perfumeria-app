import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { bottleOf, plan, stored, storedBottle } from "./calc";

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
