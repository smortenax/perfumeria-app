import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { gramsText, gramsToUg, scaleGramsToUg } from "./mass";
import { decimal, drawn, fixedNumber, fixedRatio, percent, roundedNumber } from "./numbers";
import { digitsPercentToFraction, percentToFraction, samePercentText } from "./percent";

describe("format/: the one place where numbers are read and rounded (V3-111, R3)", () => {
  it("reads percentages as people type them", () => {
    expect(percentToFraction("10")?.eq(Ratio.of(1n, 10n))).toBe(true);
    expect(percentToFraction("9,97")?.eq(Ratio.of(997n, 10000n))).toBe(true);
    expect(percentToFraction("")).toBeNull();
    expect(percentToFraction("abc")).toBeNull();
    expect(digitsPercentToFraction("9,5")?.eq(Ratio.of(95n, 1000n))).toBe(true);
    expect(digitsPercentToFraction("9,")).toBeNull();
    expect(samePercentText("0,5", "0.5")).toBe(true);
  });
  it("reads and shows grams in whole micrograms", () => {
    expect(gramsToUg("0,800")).toBe(800_000n);
    expect(gramsToUg("0")).toBeNull();
    expect(gramsToUg("0.0000001")).toBeNull();
    expect(scaleGramsToUg("1,03")).toBe(1_030_000n);
    expect(scaleGramsToUg("1.0301")).toBeNull();
    expect(gramsText(1_030_000n)).toBe("1.030");
  });
  it("rounds only to show or to draw", () => {
    expect(decimal(Ratio.of(1n, 8n))).toBe("0.125");
    expect(decimal(Ratio.of(1n, 1_000_000n))).toBe("0.000001");
    expect(percent(Ratio.of(3n, 1000n))).toBe("0.3 %");
    expect(fixedRatio(Ratio.of(2n, 3n), 2)).toBe("0.67");
    expect(drawn(Ratio.of(1n, 3n), 4)).toBe(0.3333);
    expect(fixedNumber(12.345, 1)).toBe("12.3");
    expect(roundedNumber(2, 1)).toBe(2);
  });
});
