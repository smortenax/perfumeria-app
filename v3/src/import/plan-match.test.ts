import zaraFile from "../planner/fixtures/zara-ide-pisos-v4.plan.json?raw";
import { describe, expect, it } from "vitest";
import { type Catalog, type CatalogMaterial, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import { indexCatalog } from "../db/search";
import { planFromJson, type PlanFileLine } from "../planner/plan-json";
import { chosenLines, matchPlan, matchPlanLine } from "./plan-match";

/** Each line of an imported plan against the glossary (V3-100), with the real cases of Zara IDE v4. */

const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, strengthSource: null, impact: null, impactSource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
const m = (id: string, name: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial => ({
  ...FIELDS, id, ownerId: null, name, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra,
});
const ME = "me";
const KEPHALIS = "c8896fa6-8958-575e-bd2b-ec417fce3bd3";
const ISO_E = "e212c9e2-cd71-530c-9dff-5098c0d3fa19";
const LINALOOL = "aed7c3f9-5e0d-569c-8846-03505f675bb8";
const PRUNELLA = "32b2d283-5e18-5609-aa85-e73c813388cf";
const materials = [
  m(KEPHALIS, "Kephalis", { cas: "36306-87-3" }),
  m(ISO_E, "Iso E Super", { cas: "54464-57-2" }),
  m("my-timbersilk", "Timbersilk", { ownerId: ME, basedOnId: ISO_E, supplier: "Maese Lab" }),
  m(LINALOOL, "Linalool", { cas: "78-70-6" }),
  m("my-linalool", "Linalool", { ownerId: ME, basedOnId: LINALOOL }),
  m(PRUNELLA, "Prunella", { kind: "composition" }),
  m("galaxolide", "Galaxolide", { cas: "1222-05-5" }),
  m("my-galaxolide", "Galaxolide 50 IPM", { ownerId: ME, basedOnId: "galaxolide" }),
  m("hers", "Castoreum", { ownerId: "someone else" }),
  m("ethanol", "Ethanol", { solvent: true, cas: "64-17-5" }),
];
const catalog = { materials: new Map(materials.map((x) => [x.id, x])), have: new Set<string>(), categories: new Map(), dilutions: new Map() } as unknown as Catalog;
const index = indexCatalog(catalog);
const zara = planFromJson(zaraFile);
if (!zara.ok) throw new Error("the fixture does not read");
const lines = zara.plan.lines;
const of = (name: string) => matchPlan(lines, catalog, index, ME).find((x) => x.line.material === name)!;
const line = (l: Partial<PlanFileLine>): PlanFileLine => ({ index: 1, material: "", materialId: null, cas: null, parts: null, shape: null, group: null, problem: null, ...l });

describe("a plan's lines against the glossary", () => {
  it("the id rules: Kephalis and Prunella by id, and Linalool keeps the common one the file names", () => {
    expect([of("Kephalis").status, of("Kephalis").by, of("Kephalis").candidates[0].id]).toEqual(["found", "id", KEPHALIS]);
    expect([of("Prunella").status, of("Prunella").by]).toEqual(["found", "id"]);
    expect(of("Linalool").candidates.map((c) => c.id)).toEqual([LINALOOL]);
  });

  it("Timbersilk, without id or CAS, finds your material by its name", () => {
    expect([of("Timbersilk").status, of("Timbersilk").by, of("Timbersilk").candidates[0].id]).toEqual(["found", "name", "my-timbersilk"]);
  });

  it("an id not in the glossary falls to the CAS, and the CAS prefers your version", () => {
    expect([of("Galaxolide").status, of("Galaxolide").by, of("Galaxolide").candidates[0].id]).toEqual(["found", "cas", "my-galaxolide"]);
    const two = matchPlanLine(line({ material: "Something", cas: "54464-57-2" }), catalog, index, ME);
    expect([two.status, two.candidates.map((c) => c.id)]).toEqual(["found", ["my-timbersilk"]]);
  });

  it("what is not found is not made up, and nobody else's material or a solvent is never offered", () => {
    expect([of("Castoreum").status, of("Castoreum").candidates]).toEqual(["missing", []]);
    expect(matchPlanLine(line({ material: "Ethanol", cas: "64-17-5" }), catalog, index, ME).status).toBe("missing");
    expect(matchPlanLine(line({ material: "Castoreum", materialId: "hers" }), catalog, index, ME).status).toBe("missing");
  });

  it("a near name is only offered, a wrong line is not matched, and a material chosen twice is said", () => {
    const near = matchPlanLine(line({ material: "Kephal" }), catalog, index, ME);
    expect([near.status, near.by, near.candidates[0]?.id]).toEqual(["doubtful", "search", KEPHALIS]);
    expect(matchPlanLine(line({ material: "Kephalis", problem: "parts" }), catalog, index, ME).status).toBe("invalid");
    const twice = matchPlan([line({ index: 1, material: "Kephalis" }), line({ index: 2, material: "Kephalis" }), line({ index: 3, material: "Kephal" })], catalog, index, ME);
    expect(chosenLines(twice, new Map())).toMatchObject({ lines: [{ materialId: KEPHALIS }], repeated: [2] });
    expect(chosenLines(twice, new Map([[1, null], [3, ISO_E]])).lines.map((l) => [l.match.line.index, l.materialId])).toEqual([[2, KEPHALIS], [3, ISO_E]]);
  });
});
