import { describe, expect, it } from "vitest";
import { ifraLabel } from "./ifra-label";

/** A formula's IFRA as one label (F20): what is not known is never within. */

const report = (asIs: "yes" | "no" | "unknown", extra: { partial?: boolean; bounded?: boolean; unchecked?: string[]; pending?: number } = {}) => ({
  asIs,
  partial: extra.partial ?? false,
  checks: extra.bounded ? [{ verdict: "bounded" }] : [{ verdict: "within" }],
  unchecked: extra.unchecked ?? [],
  pending: Array.from({ length: extra.pending ?? 0 }, () => ({ material: "m", text: "t" })),
}) as unknown as Parameters<typeof ifraLabel>[0];

describe("a formula's IFRA label (F20)", () => {
  it("over, partial, within at worst, within; empty with nothing aromatic", () => {
    expect(ifraLabel(report("no"), true)).toBe("exceeds");
    expect(ifraLabel(report("unknown"), true)).toBe("partial");
    expect(ifraLabel(report("yes", { bounded: true }), true)).toBe("bounded");
    expect(ifraLabel(report("yes"), true)).toBe("within");
    expect(ifraLabel(report("yes"), false)).toBe("empty");
  });
  it("a material or constituent without data is never within", () => {
    expect(ifraLabel(report("yes", { unchecked: ["Cypriol"] }), true)).toBe("partial");
    expect(ifraLabel(report("yes", { pending: 1 }), true)).toBe("partial");
    expect(ifraLabel(report("yes", { partial: true }), true)).toBe("partial");
  });
  it("over wins over unknown", () => {
    expect(ifraLabel(report("no", { unchecked: ["x"] }), true)).toBe("exceeds");
  });
});
