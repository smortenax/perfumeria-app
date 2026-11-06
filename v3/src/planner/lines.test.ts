import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { type Catalog, type CatalogMaterial, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import { againstPlan, planLinesOf } from "./lines";

const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, strengthSource: null, impact: null, impactSource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
const material = (id: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial => ({
  ...FIELDS, id, ownerId: null, name: id, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra,
});
const benzoin = material("Benzoin resinoid", { family: "gourmand", tier: "base", impact: 5, tenacityHours: Ratio.of(400) });
const mine = material("My benzoin", { ownerId: "me", basedOnId: "Benzoin resinoid" });
const bare = material("Bare", { kind: "provisional" });
const catalog = { materials: new Map([benzoin, mine, bare].map((m) => [m.id, m])) } as unknown as Catalog;
const row = (materialId: string, parts: number, shape: "heart" | null = null) => ({ id: `row-${materialId}`, materialId, parts: Ratio.of(parts), shape, position: 0 });

describe("the plan's lines with their materials (V3-98)", () => {
  it("takes impact, hours, family and the default shape, from the material it is based on too", () => {
    const [b, m] = planLinesOf(catalog, [row("Benzoin resinoid", 6), row("My benzoin", 2, "heart")]);
    expect(b).toMatchObject({ key: "Benzoin resinoid", impact: 5, family: "gourmand", shape: "plateau", picked: null, fallback: "plateau" });
    expect(b.hours?.toString()).toBe("400");
    expect(m).toMatchObject({ impact: 5, family: "gourmand", shape: "heart", picked: "heart", fallback: "plateau" });
  });

  it("knows nothing of a material without data, and keeps a line whose material is not in the copy", () => {
    expect(planLinesOf(catalog, [row("Bare", 1)])[0]).toMatchObject({ impact: null, hours: null, shape: null, family: null });
    expect(planLinesOf(catalog, [row("gone", 1)])[0]).toMatchObject({ name: "—", impact: null, shape: null });
  });
});

describe("what is weighed against the plan", () => {
  it("compares shares of the planned parts and of the aromatic matter weighed, without solvents, and adds what was not planned", () => {
    const out = againstPlan(
      [
        { key: "a", name: "A", parts: Ratio.of(3) },
        { key: "b", name: "B", parts: Ratio.of(1) },
      ],
      [
        { key: "a", name: "A", massUg: Ratio.of(600), solvent: false },
        { key: "c", name: "C", massUg: Ratio.of(400), solvent: false },
        { key: "eth", name: "Ethanol", massUg: Ratio.of(9000), solvent: true },
      ],
    );
    expect(out.map((o) => [o.key, o.planned?.toString() ?? null, o.weighed?.toString() ?? null])).toEqual([
      ["a", "3/4", "3/5"],
      ["b", "1/4", null],
      ["c", null, "2/5"],
    ]);
  });
});
