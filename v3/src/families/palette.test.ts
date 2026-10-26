import { describe, expect, it } from "vitest";
import { type Catalog, type CatalogMaterial, FAMILIES, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import { coloursOf, familyOf, PALETTE } from "./palette";

/** V3-38: a material's colour is its family's, light or dark, unless one is fixed; without a family, none. */

const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
const material = (id: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial => ({
  ...FIELDS, id, ownerId: null, name: id, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra,
});
const rose = material("rose", { family: "floral" });
const mine = material("mine", { ownerId: "me", basedOnId: "rose" });
const fixed = material("fixed", { ownerId: "me", basedOnId: "rose", color: "#123ABC" });
const bare = material("bare");
const catalog = { materials: new Map([rose, mine, fixed, bare].map((m) => [m.id, m])) } as unknown as Catalog;

describe("the palette of the families (V3-38)", () => {
  it("has the nine families of P48, and Gourmand once batch 22 is approved (V3-76), each with a light and a dark colour", () => {
    const expected = PALETTE.has("gourmand") ? FAMILIES : FAMILIES.filter((f) => f !== "gourmand");
    expect([...PALETTE.keys()].sort()).toEqual([...expected].sort());
    expect(PALETTE.get("floral")).toMatchObject({ name: "Floral", colourName: "rosa malva", light: "#c475aa", dark: "#975482" });
    expect(PALETTE.get("transformed")?.short).toBe("Transf");
  });

  it("a material takes its family's colours; your version, its common one's; a fixed colour wins in both themes", () => {
    expect(coloursOf(catalog, rose)).toEqual({ light: "#c475aa", dark: "#975482" });
    expect(familyOf(catalog, mine)).toBe("floral");
    expect(coloursOf(catalog, mine)).toEqual({ light: "#c475aa", dark: "#975482" });
    expect(coloursOf(catalog, fixed)).toEqual({ light: "#123abc", dark: "#123abc" });
  });

  it("without a family, no colour: neutral, never made up", () => {
    expect(coloursOf(catalog, bare)).toBeNull();
  });
});
