import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { formatGrams } from "../core/display";
import { weighSummary } from "./format";

describe("the bottle and its grams in one line, on a phone (audit F-06 L2)", () => {
  it("says what the bottle holds and its tare", () => {
    expect(weighSummary(Ratio.of(5_130_000), 12_000_000n)).toBe(`${formatGrams(Ratio.of(5_130_000), 3)} in the bottle · tare ${formatGrams(Ratio.of(12_000_000), 3)}`);
  });

  it("says when the bottle was not weighed, never a tare of zero", () => {
    expect(weighSummary(Ratio.ZERO, null)).toBe(`${formatGrams(Ratio.ZERO, 3)} in the bottle · bottle not weighed`);
  });
});
