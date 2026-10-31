import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { Part } from "../core/compose";
import type { Family } from "../db/catalog";
import { confidenceOf, formulaSummary } from "./summary";

/** The formula summed up (F6, V3-89): exact shares of the aromatic matter, and the confidence they earn. */

const part = (key: string, mg: number, solvent = false): Part => ({ material: { key, name: key.toUpperCase(), solvent } as Part["material"], massUg: Ratio.of(mg * 1000) });
const FAMILY: Record<string, Family> = { iris: "floral", cedar: "woody", birch: "woody", bergamot: "citrus" };
const TIER: Record<string, string> = { iris: "heart", cedar: "base", birch: "heart_base", bergamot: "top" };
const familyOf = (key: string) => FAMILY[key] ?? null;
const tierOf = (key: string) => TIER[key];

describe("the formula summed up (F6)", () => {
  it("gives each family and note its exact share of the aromatic matter, the diluents apart", () => {
    const s = formulaSummary([part("iris", 200), part("cedar", 500), part("bergamot", 300), part("dpg", 1000, true)], familyOf, tierOf)!;
    expect(s.families.map((f) => [f.family, f.share.toFixed(2)])).toEqual([["woody", "0.50"], ["citrus", "0.30"], ["floral", "0.20"]]);
    expect([s.notes.top, s.notes.heart, s.notes.base].map((r) => r.toFixed(2))).toEqual(["0.30", "0.20", "0.50"]);
    expect(s.lead).toBe("base");
    expect(s.confidence).toBe("high");
    expect(s.missing).toEqual([]);
  });

  it("never gives what a material does not say to another family or note: it names it, heaviest first", () => {
    const s = formulaSummary([part("iris", 300), part("mystery", 100), part("cedar", 200), part("fondo", 400), part("fondo", 0)], familyOf, tierOf)!;
    expect(s.coverage.family.eq(Ratio.of(1, 2))).toBe(true);
    expect(s.notes.heart.add(s.notes.base).eq(Ratio.of(1, 2))).toBe(true);
    expect(s.missing.map((m) => [m.name, m.share.toFixed(2), m.lacks])).toEqual([
      ["FONDO", "0.40", ["family", "note"]],
      ["MYSTERY", "0.10", ["family", "note"]],
    ]);
    expect(s.confidence).toBe("low");
  });

  it("names no lead on less than half the matter, nor on a tie", () => {
    expect(formulaSummary([part("iris", 100), part("fondo", 900)], familyOf, tierOf)!.lead).toBeNull();
    expect(formulaSummary([part("iris", 100), part("cedar", 100)], familyOf, tierOf)!.lead).toBeNull();
  });

  it("keeps three families and says how many there are", () => {
    const s = formulaSummary([part("iris", 1), part("cedar", 2), part("bergamot", 3), part("musk", 4)], (k) => (k === "musk" ? "animal" : familyOf(k)), tierOf)!;
    expect(s.families.map((f) => f.family)).toEqual(["animal", "citrus", "woody"]);
    expect(s.familyCount).toBe(4);
  });

  it("the confidence follows the weaker of the two coverages: high from 90 %, medium from 60 %", () => {
    expect(confidenceOf(Ratio.of(9, 10))).toBe("high");
    expect(confidenceOf(Ratio.of(89, 100))).toBe("medium");
    expect(confidenceOf(Ratio.of(6, 10))).toBe("medium");
    expect(confidenceOf(Ratio.of(59, 100))).toBe("low");
    // Every family known, a third of the notes: low.
    expect(formulaSummary([part("iris", 1), part("cedar", 1), part("bergamot", 1)], familyOf, (k) => (k === "iris" ? "heart" : null))!.confidence).toBe("low");
  });

  it("has nothing to sum up with nothing aromatic", () => {
    expect(formulaSummary([], familyOf, tierOf)).toBeNull();
    expect(formulaSummary([part("dpg", 1000, true)], familyOf, tierOf)).toBeNull();
  });
});
