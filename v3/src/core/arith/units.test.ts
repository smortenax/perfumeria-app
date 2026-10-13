import { describe, expect, it } from "vitest";
import { Ratio } from "./ratio";
import { parseMass, parsePercent } from "./units";
import { formatGrams, formatMilligrams, formatPercent } from "../display";

describe("parseMass", () => {
  it("turns what is typed into whole micrograms", () => {
    expect(parseMass("619", "mg")).toBe(619_000n);
    expect(parseMass("12,5", "mg")).toBe(12_500n);
    expect(parseMass("0,001", "mg")).toBe(1n);
    expect(parseMass("8,745", "g")).toBe(8_745_000n);
  });

  it("refuses what a microgram cannot hold, instead of rounding it", () => {
    expect(() => parseMass("0,0005", "mg")).toThrow(RangeError);
    expect(() => parseMass("1,0000001", "g")).toThrow(RangeError);
  });

  it("refuses zero and negative masses", () => {
    expect(() => parseMass("0", "mg")).toThrow(RangeError);
    expect(() => parseMass("-3", "mg")).toThrow(RangeError);
  });
});

describe("parsePercent", () => {
  it("gives the fraction of pure matter", () => {
    expect(parsePercent("10").toString()).toBe("1/10");
    expect(parsePercent("0,996").toString()).toBe("249/25000");
    expect(parsePercent("100").toString()).toBe("1");
  });

  it("accepts any percentage up to 100: nothing ties it to a supplier's purity", () => {
    expect(parsePercent("50").toString()).toBe("1/2");
    expect(() => parsePercent("0")).toThrow(RangeError);
    expect(() => parsePercent("100,01")).toThrow(RangeError);
  });
});

describe("display", () => {
  it("rounds only when shown, with a decimal comma", () => {
    expect(formatGrams(Ratio.of(8_745_000))).toBe("8,745 g");
    expect(formatMilligrams(Ratio.of(619_000))).toBe("619 mg");
    expect(formatPercent(Ratio.of(619_000, 8_745_000))).toBe("7,078 %");
  });
});
