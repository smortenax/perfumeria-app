import { describe, expect, it } from "vitest";
import { type Catalog, type CatalogMaterial, type Category, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "./catalog";
import { inMyBench, pickOptionsOf } from "./material-search";
import { searchCatalog } from "../lib/search";

/**
 * The search of every MaterialPicker (2026-11-26; the user: «el buscador de diluciones … no funciona igual ni se basa en la
 * lista de la misma manera que el buscar materiales en la formulacion»): the same list as «My library» and the same ranking
 * as the add bar. Before, the dilutions matched the name only, letter for letter: «ylang» missed «Ylang-ylang», «hedione
 * perfumiarz» and a CAS found nothing.
 */

const ME = "user-me";
const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, strengthSource: null, impact: null, impactSource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};

function material(id: string, name: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial {
  return { ...FIELDS, id, ownerId: null, name, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra };
}

const catalogOf = (materials: CatalogMaterial[], categories: Category[] = [], have: string[] = []): Catalog => ({
  materials: new Map(materials.map((m) => [m.id, m])),
  categories: new Map(categories.map((c) => [c.id, c])),
  have: new Set(have),
  dilutions: new Map(),
  evaluations: new Map(),
  axes: new Map(),
  dataCommit: null,
});

const hedione = material("hed", "Hedione", { aliases: ["Methyl dihydrojasmonate"], cas: "24851-98-7", abbreviation: "MDJ" });
const myHedione = material("my-hed", "Hedione", { ownerId: ME, basedOnId: "hed", supplier: "Perfumiarz", product: "HEDIONE FIRMENICH" });
const ylang = material("yl", "Ylang-ylang extra, aceite esencial", { kind: "natural", species: "Cananga odorata" });
const myYlang = material("my-yl", "Ylang-ylang extra", { ownerId: ME, basedOnId: "yl", supplier: "Perfumiarz" });
const iso = material("iso", "Isobutyl quinoline", { abbreviation: "IBQ", cas: "65442-31-1" });
const coumarin = material("cou", "Coumarin", { cas: "91-64-5" });
const dpg = material("dpg", "Dipropylene glycol", { solvent: true });

const catalog = catalogOf([hedione, myHedione, ylang, myYlang, iso, coumarin, dpg], [], ["cou"]);
const options = pickOptionsOf(catalog, inMyBench(catalog));
const ids = (query: string) => searchCatalog(options, query, 30).map((o) => o.id);

describe("the list of the dilutions: «My library»", () => {
  it("your versions and the common you marked «I have it»; no diluents, no common you do not have", () => {
    expect(options.map((o) => o.id).sort()).toEqual(["cou", "my-hed", "my-yl"]);
  });
  it("by name, each with what tells it apart", () => {
    expect(options.map((o) => [o.name, o.detail])).toEqual([
      ["Coumarin", "common"],
      ["Hedione", "Perfumiarz"],
      ["Ylang-ylang extra", "Perfumiarz"],
    ]);
  });
});

describe("the search of the dilutions is the add bar's", () => {
  it("the words in any order, with or without hyphens and accents", () => {
    expect(ids("ylang")).toEqual(["my-yl"]);
    expect(ids("extra ylang")).toEqual(["my-yl"]);
    expect(ids("ylang ylang")).toEqual(["my-yl"]);
    expect(ids("COUMARIN")).toEqual(["cou"]);
  });
  it("by the bottle and by the common material's names, abbreviation, CAS and species (V3-5)", () => {
    expect(ids("firmenich")).toEqual(["my-hed"]);
    expect(ids("dihydrojasmonate")).toEqual(["my-hed"]);
    expect(ids("MDJ")).toEqual(["my-hed"]);
    expect(ids("24851-98-7")).toEqual(["my-hed"]);
    expect(ids("024851-98-07")).toEqual(["my-hed"]);
    expect(ids("cananga")).toEqual(["my-yl"]);
  });
  it("a name written close to it, as in the add bar (P38)", () => {
    expect(ids("cumarina")).toEqual(["cou"]);
    expect(ids("hedion")).toEqual(["my-hed"]);
  });
});
