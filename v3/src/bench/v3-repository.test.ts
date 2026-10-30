import { describe, expect, it } from "vitest";
import { type Catalog, type CatalogMaterial, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import type { GlossaryData } from "../glossary/useGlossary";
import { parseCsvRecords } from "./data/csv";
import { makerIndex } from "./data/plants";
import { DILUENT_NAMES, repositoryOfV3, v3IdOf } from "./v3-repository";

/** Plan v3, step 8.2: the workbench's bar over the v3's catalog. Each case says the rule it checks. */

const ME = "user-me";
const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, strengthSource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
function material(id: string, name: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial {
  return { ...FIELDS, id, ownerId: null, name, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra };
}
const catalogOf = (materials: CatalogMaterial[]): Catalog => ({
  materials: new Map(materials.map((m) => [m.id, m])),
  categories: new Map(),
  have: new Set(),
  dilutions: new Map(),
  evaluations: new Map(),
  axes: new Map(),
  dataCommit: null,
});
const dataOf = (materials: CatalogMaterial[]) => ({ catalog: catalogOf(materials), ifraStates: new Map(), ifra: undefined }) as unknown as GlossaryData;

const hedione = material("hed", "Hedione", { cas: "24851-98-7", abbreviation: "MDJ" });
const myHedione = material("my-hed", "Hedione", { ownerId: ME, basedOnId: "hed", supplier: "Perfumiarz" });
const myLinalool = material("my-lin", "Linalool", { ownerId: ME, basedOnId: "lin" });
const linalool = material("lin", "Linalool", { cas: "78-70-6" });
const dpg = material("dpg-id", "DPG (dipropilenglicol)", { solvent: true });
const ethanol = material("eth-id", "Etanol", { solvent: true });
const accord = material("acc", "Corazón", { ownerId: ME, kind: "frozen", source: { formulaId: "f1", eventId: "e1" } });

describe("the v3's catalog in the bar (8.2)", () => {
  it("your version of a common is one row with it, yours as a maker's product, by its supplier or as «your version» (P62)", () => {
    const repository = repositoryOfV3(dataOf([hedione, myHedione, linalool, myLinalool]));
    const makers = makerIndex(repository.entries);
    expect(makers.get("hed")?.map((e) => e.material.key)).toEqual(["hed", "my-hed"]);
    expect(makers.get("hed")?.[1].maker?.name).toBe("Perfumiarz");
    expect(makers.get("lin")?.[1].maker?.name).toBe("your version");
    // Inherited from its common: what the version does not say.
    expect(repository.get("my-hed")?.code).toBe("MDJ");
    expect(repository.get("my-hed")?.cas).toBe("24851-98-7");
  });

  it("a frozen formula is not an entry: the bench pours it with its vector, built for the ones its bench may use (V3-19, V3-49)", () => {
    expect(repositoryOfV3(dataOf([hedione, accord])).entries.map((e) => e.material.key)).toEqual(["hed"]);
  });

  it("the bar's diluents are the common ones; one the v3 does not have is said, not guessed", () => {
    const idOf = v3IdOf({ catalog: catalogOf([dpg, ethanol, hedione]) });
    expect(idOf("solv:dpg")).toBe("dpg-id");
    expect(idOf("solv:alcohol")).toBe("eth-id");
    expect(idOf("hed")).toBe("hed");
    expect(() => idOf("solv:tec")).toThrow(/not one/);
  });

  it("each diluent of the bar is one common diluent of the data as it is, in English since batch 36 (V3-71)", () => {
    const files = import.meta.glob("../../datos/materials.csv", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const rows = parseCsvRecords(Object.values(files)[0] ?? "").filter((r) => !r.owner_id && r.solvent === "true");
    const idOf = v3IdOf({ catalog: catalogOf(rows.map((r) => material(r.id, r.name, { solvent: true }))) });
    for (const key of Object.keys(DILUENT_NAMES)) expect(rows.find((r) => r.id === idOf(key))?.name, key).toBeTruthy();
    // The Spanish names of before still work: a copy loaded before batch 36 has them.
    const old = v3IdOf({ catalog: catalogOf([material("e", "Etanol", { solvent: true }), material("t", "Triacetina", { solvent: true }), material("b", "Benzoato de bencilo", { solvent: true })]) });
    expect(["solv:alcohol", "solv:triacetina", "solv:bb"].map(old)).toEqual(["e", "t", "b"]);
  });
});
