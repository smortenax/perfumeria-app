import { describe, expect, it } from "vitest";
import type { Family } from "../db/catalog";
import { bandOfHours, facetFamiliesOf, familyStems, keepsTraits, NO_TRAIT_FILTERS, sortByTraits, type Traits } from "./traits";

/** What Materials filters and sorts by (V3-94): family with its facets, strength and duration. */

// The palette's «covers», as in datos/family_palette.csv.
const PALETTE = new Map<Family, { covers: string }>([
  ["citrus", { covers: "citrus" }],
  ["green", { covers: "green, herbal, aromatic, camphoraceous, minty" }],
  ["floral", { covers: "floral, honey, powdery" }],
  ["woody", { covers: "woods, earthy, smoky, tobacco" }],
  ["animal", { covers: "animalic, musk, leather, amber" }],
  ["transformed", { covers: "roasted (pyrazines), acidic, sulphurous: smells of heat, fermentation or cutting" }],
  ["gourmand", { covers: "vanilla, caramel, balsamic, creamy, sugary" }],
]);
const stems = familyStems(PALETTE);

describe("the families a material's facets name (V3-94)", () => {
  it("finds them by the words each family covers, its own family apart", () => {
    // Operanide, woody: «amber, woody, creamy, powdery, mossy, soft gourmand».
    expect(facetFamiliesOf("amber, woody, creamy, powdery, mossy, soft gourmand", "woody", stems)).toEqual(["floral", "animal", "gourmand"]);
    // Synthetic castoreum, animal: «castoreum, animal skin, leather, smoky-phenolic, birch tar».
    expect(facetFamiliesOf("castoreum, animal skin, leather, smoky-phenolic, birch tar", "animal", stems)).toEqual(["woody"]);
  });

  it("reads only what comes before a colon in what a family covers, and nothing from an empty facet", () => {
    expect(stems.get("transformed")).not.toContain("heat");
    expect(facetFamiliesOf(null, null, stems)).toEqual([]);
  });
});

const traits = (family: Family | null, strength: number | null, hours: number | null, facetFamilies: Family[] = []): Traits => ({ family, facetFamilies, strength, hours });

describe("the filters by family, strength and duration (V3-94)", () => {
  it("keeps any of the families chosen, and with facets on, those that only name one", () => {
    const f = { ...NO_TRAIT_FILTERS, families: ["floral", "fruity"] as Family[] };
    expect(keepsTraits(f, traits("floral", 1, 10))).toBe(true);
    expect(keepsTraits(f, traits("woody", 1, 10, ["floral"]))).toBe(false);
    expect(keepsTraits({ ...f, facets: true }, traits("woody", 1, 10, ["floral"]))).toBe(true);
  });

  it("keeps a strength or a duration within its range, ends included; without data only when asked", () => {
    const strong = { ...NO_TRAIT_FILTERS, strength: { from: 1, to: 3 } };
    expect(keepsTraits(strong, traits(null, 1, null))).toBe(true);
    expect(keepsTraits(strong, traits(null, 0, null))).toBe(false);
    expect(keepsTraits(strong, traits(null, null, null))).toBe(false);
    expect(keepsTraits({ ...strong, strengthNoData: true }, traits(null, null, null))).toBe(true);
    const base = { ...NO_TRAIT_FILTERS, duration: { from: 2, to: 3 } };
    expect(keepsTraits(base, traits(null, null, 48))).toBe(true);
    expect(keepsTraits(base, traits(null, null, 4))).toBe(false);
  });

  it("puts hours in named bands: under 2 h top, to 24 h heart, to 7 days base, beyond fixative", () => {
    expect([0.5, 2, 23.9, 24, 167, 168, 600].map(bandOfHours)).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });

  it("sorts by family in the palette's order, by strength and hours the most first; no data last, ties by name", () => {
    const list = [
      { name: "B", t: traits("woody", 2, 400) },
      { name: "A", t: traits("floral", null, 10) },
      { name: "C", t: traits(null, 3, null) },
      { name: "D", t: traits("floral", 2, 400) },
    ];
    const order: Family[] = ["citrus", "floral", "woody"];
    const names = (sort: "name" | "family" | "strength" | "duration") => sortByTraits(list, sort, (m) => m.t, order).map((m) => m.name);
    expect(names("name")).toEqual(["A", "B", "C", "D"]);
    expect(names("family")).toEqual(["A", "D", "B", "C"]);
    expect(names("strength")).toEqual(["C", "B", "D", "A"]);
    expect(names("duration")).toEqual(["B", "D", "A", "C"]);
  });
});

describe("choosing a range with presses (V3-94)", () => {
  it("one press a step, a second outside grows the range to it, one inside goes back to that step", async () => {
    const { pressStep } = await import("./traits");
    expect(pressStep(null, 1)).toEqual({ from: 1, to: 1 });
    expect(pressStep({ from: 1, to: 1 }, 3)).toEqual({ from: 1, to: 3 });
    expect(pressStep({ from: 1, to: 3 }, 0)).toEqual({ from: 0, to: 3 });
    expect(pressStep({ from: 0, to: 3 }, 2)).toEqual({ from: 2, to: 2 });
  });
});
