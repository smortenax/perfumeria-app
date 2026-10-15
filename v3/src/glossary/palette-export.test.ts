import { describe, expect, it } from "vitest";
import { type Catalog, type CatalogMaterial, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import { paletteMarkdown, paletteOf } from "./palette-export";

/** «Exportar paleta» (the user, 2026-10-15): your materials by the name they were registered with, and nothing more. */

const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
const m = (id: string, name: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial => ({
  ...FIELDS, id, ownerId: "me", name, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra,
});
const catalog = {
  materials: new Map(
    [
      m("c", "Hedione", { ownerId: null }),
      m("1", "Iso E Super"),
      m("2", "Hedione", { supplier: "Perfumiarz" }),
      m("3", "Hedione", { supplier: "Fraterworks" }),
      m("4", "Base ambarada casera", { kind: "provisional" }),
      m("5", "Corazón", { kind: "frozen" }),
    ].map((x) => [x.id, x]),
  ),
} as unknown as Catalog;

describe("the palette of your materials", () => {
  it("lists yours, not the common ones nor your frozen formulas, in order, two of one name by their shop", () => {
    expect(paletteOf(catalog)).toEqual(["Base ambarada casera", "Hedione (Fraterworks)", "Hedione (Perfumiarz)", "Iso E Super"]);
  });

  it("as Markdown: a title, how many and when, one line each", () => {
    expect(paletteMarkdown(["A", "B"], new Date("2026-10-15T12:00:00Z"))).toBe("# Mi paleta\n\n2 materiales · 2026-10-15\n\n- A\n- B\n");
  });
});
