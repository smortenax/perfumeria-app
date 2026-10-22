import { describe, expect, it } from "vitest";
import { contrastRatio, mix, readableOn } from "./contrast";
import { PALETTE, textColourOf } from "./palette";

/** Audit F-01: a family's letters read at 4.5:1 and keep the family's hue. */

const hueOf = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d < 0.08) return null;
  const h = max === r ? (g - b) / d : max === g ? 2 + (b - r) / d : 4 + (r - g) / d;
  return ((h * 60) + 360) % 360;
};

describe("family colours as text (audit F-01)", () => {
  it("contrast matches WCAG's figures", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
  });

  it("every family colour, light and dark, reads at 4.5:1 on the paper and on the tint of a material you have", () => {
    for (const f of PALETTE.values()) {
      for (const colour of [f.light, f.dark]) {
        const text = textColourOf(colour);
        expect(contrastRatio(text, "#ffffff"), `${f.family} ${colour} → ${text}`).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(text, mix(colour, 0.18, "#ffffff")), `${f.family} ${colour} → ${text}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("the letters keep the family's hue, within a few degrees", () => {
    for (const f of PALETTE.values()) {
      const [a, b] = [hueOf(f.light), hueOf(textColourOf(f.light))];
      if (a === null || b === null) continue;
      const gap = Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
      expect(gap, `${f.family} ${f.light} → ${textColourOf(f.light)}`).toBeLessThan(12);
    }
  });

  it("a colour that already reads stays as it is; any fixed colour comes out readable", () => {
    expect(readableOn("#1d1d1b", ["#ffffff"])).toBe("#1d1d1b");
    for (const c of ["#ffff00", "#00ffff", "#ffffff", "#2db9f3", "#c3b503"]) {
      expect(contrastRatio(readableOn(c, ["#ffffff"]), "#ffffff")).toBeGreaterThanOrEqual(4.5);
    }
  });
});
