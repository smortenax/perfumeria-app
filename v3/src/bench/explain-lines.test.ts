import { describe, expect, it } from "vitest";
import { explainLines } from "./explain-lines";

describe("what a «Explain» shows (plan 8.6)", () => {
  it("keeps the lines there are, in order, once each, and splits a title written on several lines", () => {
    expect(explainLines(["Where it comes from:\nIris 2 %\n", null, undefined, false, "", "Iris 2 %", "Room: 5 mg"])).toEqual(["Where it comes from:", "Iris 2 %", "Room: 5 mg"]);
  });
  it("gives nothing to show when nothing is said", () => {
    expect(explainLines([null, "  "])).toEqual([]);
  });
});
