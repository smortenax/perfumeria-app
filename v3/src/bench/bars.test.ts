import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { barWidth, lollipopOf } from "./bars";

describe("the data as bar lengths (audit F-15 L2)", () => {
  it("draws a line against the largest, from zero; a trace as a sliver, never as nothing", () => {
    expect(barWidth(Ratio.of(300), Ratio.of(300))).toBe(1);
    expect(barWidth(Ratio.of(75), Ratio.of(300))).toBe(0.25);
    expect(barWidth(Ratio.of(1), Ratio.of(1_000_000))).toBe(0.01);
    expect(barWidth(Ratio.ZERO, Ratio.of(300))).toBe(0);
  });

  it("puts the IFRA dot at what the line uses of its ceiling; at or past it, or prohibited, at the end and over", () => {
    expect(lollipopOf(Ratio.of(1, 2))).toEqual({ at: 0.5, over: false });
    expect(lollipopOf(Ratio.ONE)).toEqual({ at: 1, over: true });
    expect(lollipopOf(Ratio.of(3, 2))).toEqual({ at: 1, over: true });
    expect(lollipopOf(null)).toEqual({ at: 1, over: true });
    expect(lollipopOf(Ratio.of(1, 100_000)).at).toBe(0.01);
  });
});
