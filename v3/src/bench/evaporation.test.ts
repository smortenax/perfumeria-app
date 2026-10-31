import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { Part } from "../core/compose";
import type { Family } from "../db/catalog";
import { evaporation, STOPS } from "./evaporation";

/** What is left on the blotter (F5, V3-90): by hours on a blotter, an orientation. */

const part = (key: string, mg: number, solvent = false): Part => ({ material: { key, name: key, solvent } as Part["material"], massUg: Ratio.of(mg * 1000) });
const HOURS: Record<string, number> = { bergamot: 1, lavender: 1.5, iris: 48, cedar: 300 };
const FAMILY: Record<string, Family> = { bergamot: "citrus", lavender: "green", iris: "floral" };
const hoursOf = (key: string) => (key in HOURS ? Ratio.fromDecimal(String(HOURS[key])) : null);
const familyOf = (key: string) => FAMILY[key] ?? null;
const formula = [part("bergamot", 200), part("lavender", 100), part("iris", 300), part("cedar", 300), part("fondo", 100), part("dpg", 500, true)];

describe("what is left on the blotter (F5)", () => {
  it("just applied, everything with hours is there; what has none is said apart, never taken as there", () => {
    const e = evaporation(formula, STOPS[0], hoursOf, familyOf)!;
    expect(e.total).toBe(5);
    expect(e.left.map((l) => l.key)).toEqual(["cedar", "iris", "bergamot", "lavender"]);
    expect(e.unknown.map((u) => [u.key, u.share.toFixed(2)])).toEqual([["fondo", "0.10"]]);
    expect(e.leftShare.toFixed(2)).toBe("0.90");
  });

  it("at 2 h the top notes are gone, the first to go first, and the families are read over what is left", () => {
    const e = evaporation(formula, Ratio.of(2), hoursOf, familyOf)!;
    expect(e.gone.map((g) => g.key)).toEqual(["bergamot", "lavender"]);
    expect(e.left.map((l) => l.key)).toEqual(["cedar", "iris"]);
    expect(e.leftShare.eq(Ratio.of(6, 10))).toBe(true);
    // Iris 300 mg of 600 left: floral half; cedar has no family, its own slice, last.
    expect(e.families.map((f) => [f.family, f.share.toFixed(2)])).toEqual([["floral", "0.50"], [null, "0.50"]]);
  });

  it("at exactly its hours a material is gone", () => {
    expect(evaporation(formula, Ratio.of(48), hoursOf, familyOf)!.gone.map((g) => g.key)).toContain("iris");
  });

  it("at the end, only what has no hours is unsaid: nothing is left, no family is drawn", () => {
    const e = evaporation(formula, STOPS[STOPS.length - 1], hoursOf, familyOf)!;
    expect(e.left).toEqual([]);
    expect(e.leftShare.isZero()).toBe(true);
    expect(e.families).toEqual([]);
    expect(e.unknown.length).toBe(1);
  });

  it("has nothing to evaporate with nothing aromatic, and its stops grow from just applied to 600 h", () => {
    expect(evaporation([part("dpg", 1, true)], STOPS[0], hoursOf, familyOf)).toBeNull();
    expect(STOPS.every((s, i) => i === 0 || STOPS[i - 1].lt(s))).toBe(true);
    expect(STOPS[STOPS.length - 1].eq(Ratio.of(600))).toBe(true);
  });
});

describe("a time on the slider, to read (F5)", () => {
  it("just applied, minutes, hours and days beside them from two days", async () => {
    const { timeText } = await import("./EvaporationCard");
    expect([Ratio.ZERO, Ratio.of(1, 4), Ratio.of(3, 2), Ratio.of(24), Ratio.of(72), Ratio.of(300), Ratio.of(600)].map((h) => timeText(h))).toEqual([
      "Just applied",
      "15 min",
      "1.5 h",
      "24 h",
      "72 h (3 days)",
      "300 h (12.5 days)",
      "600 h (25 days)",
    ]);
    expect(timeText(Ratio.of(48), true)).toBe("48 h");
  });
});
