import { describe, expect, it } from "vitest";
import { longRequirement } from "./ifra-explain";

describe("a long pending text, shortened (F-13)", () => {
  it("leaves a short text as it is", () => {
    expect(longRequirement("terthiophene ≤ 0,35 %: unknown")).toBeNull();
  });

  it("splits a long one into what is unknown and the standard's words", () => {
    const standard = "Oils and extracts of this plant may only be used when the level of the substance in the material is known and kept under the limit set in the annex, by the supplier's documents";
    expect(longRequirement(`${standard}: how much of it the product contains.`)).toEqual({ unknown: "how much of it the product contains", standard });
  });
});
