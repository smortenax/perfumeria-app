import { describe, expect, it } from "vitest";
import { type Catalog, type CatalogMaterial, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../../db/catalog";
import { Ratio } from "../../core/arith/ratio";
import { orbLookOf, orbScalesOf } from "./fromCatalog";

/** The orb from today's glossary fields: what is known shows, what is not stays neutral (never zero). */

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
const hedione = material("hedione", { family: "floral", strength: "medium", tier: "heart", tenacityHours: Ratio.of(400) });
const strong = material("strong", { family: "woody", strength: "very_high", tier: "base" });
const absolute = material("absolute", { kind: "natural", form: "absoluto", family: "animal" });
const oil = material("oil", { kind: "natural", form: "aceite esencial", family: "citrus", tier: "top" });
const bare = material("bare", { kind: "provisional" });
const mine = material("mine", { ownerId: "me", basedOnId: "hedione", kind: "molecule" });
const catalog = { materials: new Map([hedione, strong, absolute, oil, bare, mine].map((m) => [m.id, m])) } as unknown as Catalog;
const scales = orbScalesOf(catalog);
const look = (m: CatalogMaterial) => orbLookOf(catalog, m, scales);

describe("the orb from the glossary's fields", () => {
  it("takes the family's colour, the strength by rank, the tier as note and the tenacity", () => {
    expect(look(hedione)).toEqual({ families: [{ color: "#c475aa", share: 1 }], intensity: 0, contour: 0, note: "heart", durationHours: 400 });
    expect(look(strong).intensity).toBe(1);
    expect(look(strong).note).toBe("base");
  });

  it("gives a molecule a sphere, an absolute more wobble than an oil", () => {
    expect(look(hedione).contour).toBe(0);
    expect(look(absolute).contour!).toBeGreaterThan(look(oil).contour!);
  });

  it("leaves what is unknown undefined, so it draws neutral: no family, no strength, no diffusion, no luminosity", () => {
    expect(look(bare)).toEqual({ families: [] });
    expect(look(hedione).diffusion).toBeUndefined();
    expect(look(hedione).luminosity).toBeUndefined();
  });

  it("your version takes what it does not say from the material it is based on", () => {
    expect(look(mine)).toEqual(look(hedione));
  });
});
