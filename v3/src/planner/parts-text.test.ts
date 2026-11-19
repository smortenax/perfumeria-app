import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { dropsOf, partsText, stepDrops } from "./parts-text";

describe("drops in the planner", () => {
  it("takes only whole drops", () => {
    expect(dropsOf("3")).toBe(3);
    expect(dropsOf(" 0 ")).toBe(0);
    expect(dropsOf("2.5")).toBeNull();
    expect(dropsOf("-1")).toBeNull();
    expect(dropsOf("")).toBeNull();
  });
  it("steps to the next whole drop, never below none", () => {
    expect(stepDrops(Ratio.fromDecimal("2"), 1)).toBe(3);
    expect(stepDrops(Ratio.fromDecimal("2"), -1)).toBe(1);
    expect(stepDrops(Ratio.fromDecimal("2.5"), 1)).toBe(3);
    expect(stepDrops(Ratio.fromDecimal("2.5"), -1)).toBe(2);
    expect(stepDrops(Ratio.ZERO, -1)).toBe(0);
  });
  it("writes parts without trailing zeros", () => {
    expect(partsText(Ratio.fromDecimal("18"))).toBe("18");
    expect(partsText(Ratio.fromDecimal("0.5"))).toBe("0.5");
  });
});
