import { describe, expect, it } from "vitest";
import { contourOf, lookKey, NEUTRAL, NEUTRAL_COLOR, percentileScale, uniformsOf } from "./orbParams";

describe("orb params", () => {
  it("draws a material without data as neutral, never as zero intensity", () => {
    const u = uniformsOf({ families: [] });
    expect(u.colors).toEqual([NEUTRAL_COLOR, NEUTRAL_COLOR, NEUTRAL_COLOR]);
    expect(u.density).toBe(NEUTRAL.intensity);
    expect(u.glow).toBe(0);
  });

  it("orders families by share and places the colour boundaries by share", () => {
    const u = uniformsOf({ families: [{ color: "#c475aa", share: 30 }, { color: "#c3b503", share: 70 }] });
    expect(u.colors[0]).toBe("#c3b503");
    expect(u.t1).toBeCloseTo(0.7);
    expect(u.t2).toBe(2);
  });

  it("gives a pure molecule a perfect sphere and absolutes more wobble than oils", () => {
    expect(contourOf("pure")).toBe(0);
    expect(contourOf("natural", "absolute")!).toBeGreaterThan(contourOf("natural", "essential_oil")!);
    expect(contourOf(undefined)).toBeUndefined();
  });

  it("scales by rank while a scale is undecided", () => {
    const scale = percentileScale([1, 5, 5, 9]);
    expect(scale(1)).toBe(0);
    expect(scale(9)).toBe(1);
    expect(scale(5)).toBeCloseTo(0.5);
    expect(scale(undefined)).toBeUndefined();
  });

  it("shares a cache key between identical looks", () => {
    const a = { families: [{ color: "#923002", share: 1 }], intensity: 0.4 };
    expect(lookKey(a, 96)).toBe(lookKey({ ...a }, 96));
    expect(lookKey(a, 96)).not.toBe(lookKey({ ...a, intensity: 0.5 }, 96));
  });
});
