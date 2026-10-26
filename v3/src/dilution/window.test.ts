import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { gramsToUg, windowState, type WindowInput } from "./window";

const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));
const g = (grams: string) => gramsToUg(grams)!;
const base: WindowInput = { target: "10", rows: [{ diluentId: "dpg", share: "", weighed: "" }], drive: null, materialGrams: "", totalGrams: "", weighedMaterial: "" };

describe("the «New dilution» window (V3-79)", () => {
  it("1. a bottle you already have: material, %, diluent, and it can be saved without weights", () => {
    const s = windowState(base);
    expect(s.problem).toBeNull();
    expect(s.aimed!.fraction.eq(pct("10"))).toBe(true);
    expect(s.aimed!.diluents.map((d) => d.fraction.toString())).toEqual([pct("90").toString()]);
    expect(s.weighed).toBeNull();
    expect(s.examples.map((e) => [e.totalUg, e.plan.materialUg, e.plan.diluents[0].massUg])).toEqual([
      [g("1"), g("0.1"), g("0.9")],
      [g("10"), g("1"), g("9")],
    ]);
  });

  it("2. from the material weighed: 0,800 g at 10 % asks for 7,200 g of DPG, an 8 g bottle", () => {
    const s = windowState({ ...base, drive: "material", materialGrams: "0,800", totalGrams: "25" });
    expect(s.plan).toEqual({ totalUg: g("8"), materialUg: g("0.8"), diluents: [{ diluentId: "dpg", massUg: g("7.2") }] });
  });

  it("3. from a bottle you have: from the 10 % to a 1 %, its DPG counts", () => {
    const source = { fraction: pct("10"), diluents: [{ diluentId: "dpg", fraction: pct("90") }] };
    const s = windowState({ ...base, target: "1", source, drive: "material", materialGrams: "0,5" });
    expect(s.plan).toEqual({ totalUg: g("5"), materialUg: g("0.5"), diluents: [{ diluentId: "dpg", massUg: g("4.5") }] });
    expect(s.aimed!.diluents[0].fraction.eq(pct("99"))).toBe(true);
    expect(windowState({ ...base, target: "20", source }).problem).toBe("further");
  });

  it("4. from the total: 8 g at 10 % is 0,800 g and 7,200 g; the last one written leads", () => {
    const s = windowState({ ...base, drive: "total", totalGrams: "8", materialGrams: "3" });
    expect(s.plan).toEqual({ totalUg: g("8"), materialUg: g("0.8"), diluents: [{ diluentId: "dpg", massUg: g("7.2") }] });
  });

  it("what was really weighed makes the figure: 0,803 g and 7,201 g is 10,03 %", () => {
    const s = windowState({ ...base, weighedMaterial: "0,803", rows: [{ diluentId: "dpg", share: "", weighed: "7,201" }] });
    expect(s.weighed!.fraction.eq(pct("10.0325"))).toBe(true);
    expect(s.weighed!.totalUg).toBe(g("8.004"));
    expect(s.problem).toBeNull();
  });

  it("says what is wrong: no target, shares that do not fit, an amount or a weight that is not one", () => {
    expect(windowState({ ...base, target: "" }).problem).toBe("target");
    expect(windowState({ ...base, target: "100" }).problem).toBe("target");
    expect(windowState({ ...base, target: "50", rows: [{ diluentId: "eth", share: "60", weighed: "" }, { diluentId: "dpg", share: "", weighed: "" }] }).problem).toBe("shares");
    expect(windowState({ ...base, drive: "total", totalGrams: "ocho" }).problem).toBe("amount");
    expect(windowState({ ...base, weighedMaterial: "0,8" }).problem).toBe("weights");
    expect(windowState({ ...base, weighedMaterial: "0,8" }).aimed).not.toBeNull();
  });
});
