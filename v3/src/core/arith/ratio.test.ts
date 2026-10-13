import { describe, expect, it } from "vitest";
import { Ratio } from "./ratio";

const r = (num: number, den = 1) => Ratio.of(num, den);

describe("Ratio", () => {
  it("normalizes sign and common factors", () => {
    expect(r(6, -4).toString()).toBe("-3/2");
    expect(r(0, 7).toString()).toBe("0");
    expect(r(10, 5).toString()).toBe("2");
  });

  it("refuses a zero denominator and unsafe numbers", () => {
    expect(() => r(1, 0)).toThrow(RangeError);
    expect(() => Ratio.of(0.1)).toThrow(RangeError);
  });

  it("adds, subtracts, multiplies and divides exactly", () => {
    expect(r(1, 3).add(r(1, 6)).toString()).toBe("1/2");
    expect(r(1, 3).sub(r(1, 2)).toString()).toBe("-1/6");
    expect(r(2, 3).mul(r(9, 4)).toString()).toBe("3/2");
    expect(r(2, 3).div(r(4, 9)).toString()).toBe("3/2");
    expect(() => r(1).div(Ratio.ZERO)).toThrow(RangeError);
  });

  it("does not drift where floating point does", () => {
    const tenth = Ratio.fromDecimal("0,1");
    expect(tenth.add(Ratio.fromDecimal("0.2")).eq(Ratio.fromDecimal("0,3"))).toBe(true);
  });

  it("parses decimals typed by hand, with comma or point", () => {
    expect(Ratio.fromDecimal("12,5").toString()).toBe("25/2");
    expect(Ratio.fromDecimal("0.996").toString()).toBe("249/250");
    expect(Ratio.fromDecimal("-3").toString()).toBe("-3");
    expect(() => Ratio.fromDecimal("1,2,3")).toThrow(SyntaxError);
    expect(() => Ratio.fromDecimal("")).toThrow(SyntaxError);
  });

  it("round-trips its canonical text", () => {
    for (const value of [r(7, 3), r(-2), Ratio.ZERO, r(123456789, 1000)]) {
      expect(Ratio.parse(value.toString()).eq(value)).toBe(true);
    }
  });

  it("rounds half to even, only when shown", () => {
    expect(r(5, 2).toFixed(0)).toBe("2");
    expect(r(7, 2).toFixed(0)).toBe("4");
    expect(r(2675, 1000).toFixed(2)).toBe("2.68");
    expect(r(2665, 1000).toFixed(2)).toBe("2.66");
    expect(r(10, 3).toFixed(3)).toBe("3.333");
    expect(r(-10, 3).toFixed(2)).toBe("-3.33");
    expect(r(-1, 1000).toFixed(2)).toBe("0.00");
    expect(r(1, 1000).toFixed(4)).toBe("0.0010");
  });

  it("scales ×3 and ×1/3 back to exactly the original", () => {
    const original = [r(619000), r(23700), r(2100), r(1234567, 7)];
    const back = original.map((v) => v.mul(r(3)).mul(r(1, 3)));
    back.forEach((v, i) => expect(v.eq(original[i])).toBe(true));
  });

  it("splits a total into equal thirds with nothing lost", () => {
    // Three 1 g entries rescaled to 10 g: each is exactly 10/3 g, and together they are 10 g.
    const parts = [r(1_000_000), r(1_000_000), r(1_000_000)];
    const factor = r(10_000_000).div(Ratio.sum(parts));
    const scaled = parts.map((p) => p.mul(factor));
    expect(scaled[0].toString()).toBe("10000000/3");
    expect(Ratio.sum(scaled).eq(r(10_000_000))).toBe(true);
  });
});
