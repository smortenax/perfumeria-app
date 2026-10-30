import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { nominalPercent, shortName } from "./grid";

const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));

describe("a bottle's strength as you know it (2026-10-30)", () => {
  it("what was weighed, to the nearest whole number, when no percentage was given", () => {
    expect(nominalPercent(pct("9.94"), null)).toBe("10 %");
    expect(nominalPercent(pct("7.81"), null)).toBe("8 %");
    expect(nominalPercent(pct("1.04"), null)).toBe("1 %");
    expect(nominalPercent(pct("46.92"), null)).toBe("47 %");
    expect(nominalPercent(pct("0.98"), null)).toBe("1 %");
  });
  it("below half a percent, to its first figure: never zero", () => {
    expect(nominalPercent(pct("0.1"), null)).toBe("0.1 %");
    expect(nominalPercent(pct("0.0098"), null)).toBe("0.01 %");
  });
  it("the percentage you gave it, when it is close to what was weighed", () => {
    expect(nominalPercent(pct("2.48"), "at 2.5 %")).toBe("2.5 %");
    expect(nominalPercent(pct("9.9981"), "al 10 %")).toBe("10 %");
    expect(nominalPercent(pct("0.0101"), "at 0,01 %")).toBe("0.01 %");
  });
  it("what was weighed, when the name says something else", () => {
    expect(nominalPercent(pct("7.81"), "al 10 %")).toBe("8 %");
  });
  it("a diluent by its short name", () => {
    expect(shortName({ name: "DPG (dipropylene glycol)", abbreviation: null })).toBe("DPG");
    expect(shortName({ name: "Ethanol", abbreviation: null })).toBe("Ethanol");
    expect(shortName({ name: "Isopropyl myristate", abbreviation: "IPM" })).toBe("IPM");
  });
});
