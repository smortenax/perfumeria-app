import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { bigintFromText, numericFromRatio, ratioFromNumeric } from "./exact";

describe("numeric ↔ Ratio, never through a float", () => {
  it("reads what Postgres writes, past the precision of a JavaScript number", () => {
    expect(ratioFromNumeric("0.000000000000000000000000000001")).toEqual(Ratio.of(1n, 10n ** 30n));
    expect(ratioFromNumeric("0.123456789012345678901234567891")?.toString()).toBe("123456789012345678901234567891/1000000000000000000000000000000");
    expect(ratioFromNumeric("12")).toEqual(Ratio.of(12n));
    expect(ratioFromNumeric("-3.5")).toEqual(Ratio.of(-7n, 2n));
  });

  it("an unknown stays unknown, never zero", () => {
    expect(ratioFromNumeric(null)).toBeNull();
    expect(ratioFromNumeric(undefined)).toBeNull();
  });

  it("refuses what is not Postgres' numeric", () => {
    expect(() => ratioFromNumeric("0,5")).toThrow(SyntaxError);
    expect(() => ratioFromNumeric("1e-3")).toThrow(SyntaxError);
    expect(() => ratioFromNumeric("")).toThrow(SyntaxError);
  });

  it("writes an exact decimal, and back to the same Ratio", () => {
    for (const text of ["0.000000000000000000000000000001", "0.05", "12", "-3.5", "0", "0.125", "1"]) {
      expect(numericFromRatio(ratioFromNumeric(text)!)).toBe(text);
    }
    expect(numericFromRatio(Ratio.of(1n, 8n))).toBe("0.125");
    expect(numericFromRatio(Ratio.of(3n, 20n))).toBe("0.15");
  });

  it("refuses a fraction with no exact decimal instead of rounding it", () => {
    expect(() => numericFromRatio(Ratio.of(1n, 3n))).toThrow(RangeError);
  });
});

describe("bigint columns, as text", () => {
  it("keeps a mass past 2^53 micrograms", () => {
    expect(bigintFromText("9007199254740993")).toBe(9007199254740993n);
    expect(bigintFromText(null)).toBeNull();
    expect(() => bigintFromText("9.0e15")).toThrow(SyntaxError);
  });
});
