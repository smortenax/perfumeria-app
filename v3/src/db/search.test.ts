import { describe, expect, it } from "vitest";
import { type Catalog, type CatalogMaterial, type Category, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "./catalog";
import { casForm, fold, indexCatalog, search } from "./search";

/**
 * Plan v3, steps 5.2 and 5.3, over a catalog made by hand: what the search finds a material by
 * (V3-6, V3-16, V3-24, V3-37), and that it shows one row per category with its materials under it
 * (V3-11, V3-13). Each case says the rule it checks.
 */

const ME = "user-me";
const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};

function material(id: string, name: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial {
  return { ...FIELDS, id, ownerId: null, name, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra };
}
const category = (id: string, name: string): Category => ({ id, name, aliases: [] });

const catalogOf = (materials: CatalogMaterial[], categories: Category[] = []): Catalog => ({
  materials: new Map(materials.map((m) => [m.id, m])),
  categories: new Map(categories.map((c) => [c.id, c])),
  have: new Set(),
  dilutions: new Map(),
  evaluations: new Map(),
  axes: new Map(),
  dataCommit: null,
});

const hedione = material("hed", "Hedione", { aliases: ["Methyl dihydrojasmonate"], cas: "24851-98-7", abbreviation: "MDJ", categoryId: "cat-hed" });
const hedioneHc = material("hed-hc", "Hedione HC", { cas: "24851-98-7", categoryId: "cat-hed", house: "Firmenich" });
const myHedione = material("my-hed", "Hedione", { ownerId: ME, basedOnId: "hed", categoryId: "cat-hed", supplier: "Perfumiarz", product: "HEDIONE FIRMENICH" });
const cedar = material("ced", "Cedro chino, aceite esencial", {
  kind: "natural", cas: "1159574-01-2", otherCas: ["85085-29-6"], species: "Cupressus funebris Endl.", inci: "Cupressus Funebris Wood Oil",
});
const coumarin = material("cou", "Coumarin", { cas: "91-64-5", abbreviation: "Cou" });
const ot = material("ot", "Orange terpenes", { abbreviation: "OT" });
const ot2 = material("ot2", "Octanal", { abbreviation: "Ot" });
const ibq = material("ibq", "Isobutyl quinoline", { abbreviation: "²′IBQ" });

const catalog = catalogOf([hedione, hedioneHc, myHedione, cedar, coumarin, ot, ot2, ibq], [category("cat-hed", "Hedione")]);
const index = indexCatalog(catalog);
const keys = (query: string) => search(index, query).map((r) => r.key);

describe("what the search finds a material by", () => {
  it("its name, its other names and its abbreviation (V3-6, V3-37)", () => {
    expect(keys("hedione")).toEqual(["cat:cat-hed"]);
    expect(keys("dihydrojasmonate")).toEqual(["cat:cat-hed"]);
    expect(keys("MDJ")).toEqual(["cat:cat-hed"]);
  });

  it("all its CAS, also typed with zeros more (V3-16, P52)", () => {
    expect(keys("1159574-01-2")).toEqual(["mat:ced"]);
    expect(keys("85085-29-6")).toEqual(["mat:ced"]);
    expect(casForm("0091-64-05")).toBe("91-64-5");
    expect(keys("0091-64-05")).toEqual(["mat:cou"]);
  });

  it("its species and its INCI (V3-24): the Chinese cedar by «funebris» and by its label", () => {
    expect(keys("funebris")).toEqual(["mat:ced"]);
    expect(keys("Cupressus Funebris Wood Oil")).toEqual(["mat:ced"]);
  });

  it("a version, also by its bottle and by what its common material is found by (V3-5)", () => {
    const by = (query: string) => search(index, query)[0].members.filter((m) => m.matched).map((m) => m.material.id);
    expect(by("HEDIONE FIRMENICH")).toEqual(["my-hed"]);
    expect(by("MDJ")).toEqual(["my-hed", "hed"]);
    expect(by("24851-98-7")).toEqual(["my-hed", "hed", "hed-hc"]);
  });

  it("names written close to the query, after the found (P38)", () => {
    expect(keys("cumarina")).toEqual(["mat:cou"]);
    expect(keys("isobutilquinoleina")).toEqual(["mat:ibq"]);
    expect(fold("Isobutyl quinoline")).toBe("isobutilquinoline");
  });

  it("close from the start of a word, not anywhere in it: «lemon» does not bring Stemone (proposal of the session)", () => {
    const lemons = indexCatalog(catalogOf([material("lem", "Limón", { aliases: ["Lemon oil"] }), material("ste", "Stemone"), material("pat", "Patchouli", { aliases: ["Pogostemon cablin oil"] })]));
    expect(search(lemons, "lemmon").map((r) => r.key)).toEqual(["mat:lem"]);
    expect(search(lemons, "limon").map((r) => r.key)).toEqual(["mat:lem"]);
  });

  it("every word must appear, and nothing for an empty box", () => {
    expect(keys("hedione cedro")).toEqual([]);
    expect(keys("   ")).toEqual([]);
  });
});

describe("the order", () => {
  it("the abbreviation as typed first: codes tell capitals apart", () => {
    expect(keys("Ot")).toEqual(["mat:ot2", "mat:ot"]);
    expect(keys("OT")).toEqual(["mat:ot", "mat:ot2"]);
  });

  it("the keyboard's apostrophe finds a primed mark", () => {
    expect(keys("²'IBQ")).toEqual(["mat:ibq"]);
  });

  it("at most as many rows as asked", () => {
    expect(search(index, "e", 2)).toHaveLength(2);
  });
});

describe("one row per category (V3-11, V3-13)", () => {
  it("the category once, with all its materials under it: yours first", () => {
    const rows = search(index, "hedione");
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Hedione");
    expect(rows[0].members.map((m) => m.material.id)).toEqual(["my-hed", "hed", "hed-hc"]);
  });

  it("a material the query did not find comes with its category, marked so", () => {
    const rows = search(index, "Firmenich HEDIONE");
    expect(rows[0].members.map((m) => [m.material.id, m.matched])).toEqual([["my-hed", true], ["hed", false], ["hed-hc", false]]);
  });

  it("a version of a material without a category goes with it, in its row", () => {
    const lone = material("lone", "Ambermor");
    const mine = material("my-lone", "Ambermor", { ownerId: ME, basedOnId: "lone", supplier: "Maese Lab" });
    const rows = search(indexCatalog(catalogOf([lone, mine])), "ambermor");
    expect(rows.map((r) => [r.key, r.members.map((m) => m.material.id)])).toEqual([["mat:lone", ["my-lone", "lone"]]]);
  });
});
