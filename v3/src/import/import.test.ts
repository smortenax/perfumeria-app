import { describe, expect, it } from "vitest";
import { type Catalog, type CatalogMaterial, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import { indexCatalog } from "../db/search";
import { matchSheet, targetOf } from "./match";
import { guessColumns, readSheet, rowsOf } from "./read";

/** Importing a sheet (V3-80, F19): read, its columns guessed, each row against the glossary. */

const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
const m = (id: string, name: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial => ({
  ...FIELDS, id, ownerId: null, name, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra,
});
const materials = [
  m("lin", "Linalol", { cas: "78-70-6", aliases: ["Linalool"] }),
  m("hed", "Hedione", { cas: "24851-98-7" }),
  m("hedhc", "Hedione HC", { cas: "24851-98-7" }),
  m("guai", "Guaiacol", { cas: "90-05-1" }),
  m("lab", "Láudano de jara", { kind: "natural", cas: "8016-26-0", otherCas: ["84775-64-4"] }),
  m("dpg", "DPG", { solvent: true }),
  m("myguai", "Guaiacol", { ownerId: "me", basedOnId: "guai", supplier: "Olfatorium" }),
];
const catalog = { materials: new Map(materials.map((x) => [x.id, x])), have: new Set(["myguai"]), categories: new Map(), dilutions: new Map() } as unknown as Catalog;
const index = indexCatalog(catalog);

describe("reading a sheet", () => {
  it("pasted from Excel (tabs), with a Spanish header; the shop's product is not taken for the name", () => {
    const sheet = readSheet("Nombre\tCAS\tTienda\tproducto_tienda\tNotas\nLinalol\t78-70-6\tMaese Lab\tLinalool 99%\t\nHedione\t\tPerfumiarz\t\tpara el corazón\n\t\t\t\t\n");
    const columns = guessColumns(sheet.header);
    expect(columns).toEqual({ name: 0, cas: 1, shop: 2, product: 3, note: 4 });
    expect(rowsOf(sheet, columns).map((r) => [r.line, r.name, r.shop, r.note])).toEqual([
      [2, "Linalol", "Maese Lab", ""],
      [3, "Hedione", "Perfumiarz", "para el corazón"],
    ]);
  });

  it("a Spanish Excel's .csv (semicolons) and a plain one (commas, quotes)", () => {
    expect(rowsOf(readSheet("material;cas\nGuaiacol;90-05-1\n"), { name: 0, cas: 1, shop: null, product: null, note: null })[0].cas).toBe("90-05-1");
    const sheet = readSheet('name,shop\n"Cacao, absolute",Maese Lab\n');
    expect(rowsOf(sheet, guessColumns(sheet.header))[0]).toMatchObject({ name: "Cacao, absolute", shop: "Maese Lab" });
  });
});

describe("each row against the glossary", () => {
  const rows = (lines: string) => {
    const sheet = readSheet(`name\tcas\n${lines}`);
    return matchSheet(rowsOf(sheet, guessColumns(sheet.header)), catalog, index);
  };

  it("found by its CAS, or by its name or another name, with or without accents", () => {
    const [byCas, byName, byAlias, byOtherCas] = rows("lo que sea\t78-70-6\nláudano de jara\t\nLinalool\t\nCistus\t84775-64-4");
    expect([byCas.status, byCas.by, byCas.candidates[0].id]).toEqual(["found", "cas", "lin"]);
    expect([byName.status, byName.candidates[0].id]).toEqual(["found", "lab"]);
    expect([byAlias.status, byAlias.candidates[0].id]).toEqual(["found", "lin"]);
    expect([byOtherCas.status, byOtherCas.candidates[0].id]).toEqual(["found", "lab"]);
  });

  it("doubtful when a CAS is of two (Hedione and Hedione HC) or the name is only close; missing when nothing", () => {
    const [twoByCas, close, none] = rows("Hedione?\t24851-98-7\nHedion\t\nZzzyx\t");
    expect([twoByCas.status, twoByCas.candidates.map((c) => c.id)]).toEqual(["doubtful", ["hed", "hedhc"]]);
    expect(close.status).toBe("doubtful");
    expect(close.candidates[0].id).toBe("hed");
    expect([none.status, none.candidates]).toEqual(["missing", []]);
  });

  it("a CAS the glossary does not have is not offered a close name with another CAS", () => {
    const [other] = rows("Guaiacolo\t120-72-9");
    expect([other.status, other.candidates]).toEqual(["missing", []]);
  });

  it("says when you already have it, and never offers a diluent", () => {
    const [guai, dpg] = rows("Guaiacol\t\nDPG\t");
    expect([guai.candidates[0].id, guai.alreadyYours?.id]).toEqual(["guai", "myguai"]);
    expect(dpg.status).toBe("missing");
  });

  it("«Confirm» marks your specification again instead of making a second one", () => {
    expect([targetOf("guai", catalog), targetOf("lin", catalog)]).toEqual([
      { materialId: "myguai", ownerId: "me" },
      { materialId: "lin", ownerId: null },
    ]);
  });
});
