import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { type Catalog, type CatalogMaterial, type Component, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import type { IfraLayer, IfraStandard } from "../db/ifra-layer";
import { indexCatalog, listAll } from "../db/search";
import { toIfra } from "../db/to-ifra";
import { type IfraState, keepOf, NO_FILTERS } from "./browse";
import { decimal, percent } from "./format";
import { type Sheet, sheetOf } from "./sheet";

/**
 * Plan v3, steps 6.1 and 6.2 (V3-47): the sheet of a material as a plain data sheet, and the
 * glossary's filters, over a catalog and an IFRA layer made by hand.
 */

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100n));
const ME = "user-me";
const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
const material = (id: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial => ({
  ...FIELDS, id, ownerId: null, name: id, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra,
});
const component = (componentCas: string, componentName: string, amount: Component["amount"]): Component => ({
  id: `c-${componentCas}`, componentId: null, componentCas, componentName, amount, authority: "product", source: "certificado",
});

function standard(code: string, name: string, cas: string, limit: string): IfraStandard {
  return {
    code, name, amendment: "51", type: "", prohibition: false, restriction: true, specification: false, prohibitedAsSuch: false, groupKey: code,
    limitExpressedAs: null, limitExpressedAsCas: null, prohibitionNote: null, specificationNote: null, property: null,
    limits: new Map([["4", { kind: "max" as const, maxValue: pct(limit) }]]), substances: [{ cas, subgroup: null, synonyms: [] }],
    variantRules: [], specExclusions: [],
  };
}
const layer: IfraLayer = {
  standards: new Map([["IFRA_STD_051", standard("IFRA_STD_051", "Coumarin", "91-64-5", "1.6")]]),
  byCas: new Map([["91-64-5", ["IFRA_STD_051"]]]),
  annex: [],
};

const coumarin = material("cou", {
  name: "Cumarina",
  cas: "91-64-5",
  abbreviation: "Cou",
  abbreviationOrigin: "user",
  family: "transformed",
  tenacityHours: Ratio.of(400n),
  tenacitySource: "TGSC",
  physical: { ...NO_PHYSICAL, state: "sólido", density: Ratio.fromDecimal("0.935") },
  disputedFields: ["tenacity_hours", "strength"],
  doses: [{ id: "d1", min: pct("0.5"), typical: null, max: pct("10"), basis: "concentrate", authority: "literature", source: "Arctander", disputed: false, notes: null }],
});
const tonka = material("ton", {
  name: "Tonka",
  kind: "natural",
  components: [
    component("91-64-5", "Coumarin", { kind: "range", min: pct("20"), max: pct("40") }),
    component("119-84-6", "Dihydrocoumarin", { kind: "unknown" }),
  ],
});
const mine = material("my-cou", {
  name: "Cumarina",
  ownerId: ME,
  basedOnId: "cou",
  abbreviation: "Cou",
  abbreviationOrigin: "user",
  supplier: "Perfumiarz",
  product: "Coumarin 99 %",
  productUrl: "https://example.test/coumarin",
  notes: "Comprada en 2026.",
});
const catalog: Catalog = {
  materials: new Map([coumarin, tonka, mine].map((m) => [m.id, m])),
  categories: new Map(),
  have: new Set(["my-cou"]),
  dilutions: new Map([["my-cou", [{ id: "dl1", fraction: pct("10"), solvent: "DPG", madeOn: "2026-09-01", description: null }]]]),
  evaluations: new Map([["my-cou", { id: "e1", status: "catado", smellingTip: null, reading: "heno dulce", sheet: null }]]),
  axes: new Map([["my-cou", ["dulce", "heno"]]]),
  dataCommit: null,
};
const ifra = toIfra(catalog, layer);
const sheet = (id: string) => sheetOf(catalog, layer, ifra, id);
const row = (s: Sheet, section: string, label: string) => s.sections.find((x) => x.key === section)!.rows.find((r) => r.label === label)!.value;

describe("numbers for people", () => {
  it("comma decimals, no trailing zeros, and a small value never shows as zero (§1.2)", () => {
    expect(percent(pct("0.3"))).toBe("0,3 %");
    expect(percent(pct("1.6"))).toBe("1,6 %");
    // Rounded to its first figure: 0,0000082 % shows as 0,00001 %, not as 0.
    expect(percent(pct("0.0000082"))).toBe("0,00001 %");
    expect(decimal(Ratio.of(400n), 1)).toBe("400");
  });
});

describe("the sheet of a common material (6.2)", () => {
  const s = sheet("cou");

  it("its sections, in order, the same for every material", () => {
    expect(s.sections.map((x) => x.key)).toEqual(["identity", "smell", "physical", "composition", "ifra", "doses", "descriptors", "relations", "references", "notes"]);
  });

  it("each value with its notes; what nobody says is null, never empty or zero", () => {
    expect(row(s, "identity", "Abreviatura")).toMatchObject({ text: "Cou", notes: ["tuya"] });
    expect(row(s, "smell", "Tenacidad")).toMatchObject({ text: "400 h en papel, puro", notes: ["según TGSC"] });
    expect(row(s, "physical", "Densidad").text).toBe("0,935 g/ml");
    expect(row(s, "identity", "INCI").text).toBeNull();
    expect(row(s, "smell", "Familia").text).toBe("Transformado");
  });

  it("a datum in dispute says so, also when it is not known (V3-17)", () => {
    expect(row(s, "smell", "Tenacidad").disputed).toBe(true);
    expect(row(s, "smell", "Intensidad")).toMatchObject({ text: null, disputed: true });
    expect(row(s, "smell", "Nivel").disputed).toBe(false);
  });

  it("its IFRA: its own state and its standard with the limit of category 4", () => {
    expect(s.ifra.state).toBe("ceiling");
    const table = s.sections.find((x) => x.key === "ifra")!.tables[0];
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0][0]).toBe("STD 051 Coumarin");
    expect(table.rows[0][1]).toBe("100 %");
    expect(table.rows[0][2]).toMatch(/^1,6 % del producto terminado/);
  });

  it("its doses, with their base and authority", () => {
    expect(s.sections.find((x) => x.key === "doses")!.tables[0].rows).toEqual([["0,5 %", "—", "10 %", "% del concentrado", "literatura", "", "", "Arctander"]]);
  });
});

describe("the composition says how much and who says it", () => {
  it("a range, a figure unknown; and a material without one says so", () => {
    const table = sheet("ton").sections.find((x) => x.key === "composition")!.tables[0];
    expect(table.rows).toEqual([
      ["Coumarin · 91-64-5", "20 % – 40 %", "producto", "certificado"],
      ["Dihydrocoumarin · 119-84-6", "lo lleva, sin cifra", "producto", "certificado"],
    ]);
    const empty = sheet("cou").sections.find((x) => x.key === "composition")!.tables[0];
    expect([empty.rows, empty.empty]).toEqual([[], "Su registro no da composición (lo que dice el anexo de IFRA va en IFRA)."]);
  });
});

describe("your version (V3-5): the common material's record with yours over it", () => {
  const s = sheet("my-cou");

  it("says whose it is, and adds your bottle and your lab", () => {
    expect(row(s, "identity", "De quién").text).toBe("tu versión de «Cumarina»");
    expect(s.sections.map((x) => x.key)).toEqual(["identity", "bottle", "smell", "physical", "composition", "ifra", "doses", "descriptors", "relations", "references", "lab", "notes"]);
    expect(row(s, "bottle", "Página")).toMatchObject({ text: "https://example.test/coumarin", link: "https://example.test/coumarin" });
    expect(row(s, "lab", "Ejes").text).toBe("dulce · heno");
    expect(s.sections.find((x) => x.key === "lab")!.tables[0].rows).toEqual([["10 %", "DPG", "2026-09-01", ""]]);
  });

  it("inherits what it does not say, and marks what is yours", () => {
    expect(row(s, "identity", "CAS")).toMatchObject({ text: "91-64-5", yours: false });
    // The same value as its common material's is inherited, not yours.
    expect(row(s, "identity", "Abreviatura")).toMatchObject({ text: "Cou", yours: false, notes: ["tuya"] });
    expect(row(s, "notes", "Notas")).toMatchObject({ text: "Comprada en 2026.", yours: true, notes: ["tuyo"] });
    expect(s.sections.find((x) => x.key === "doses")!.tables[0].rows).toHaveLength(1);
    expect(s.ifra.state).toBe("ceiling");
  });
});

describe("the glossary's filters (6.1) pick materials, and a row shows the ones that pass", () => {
  const index = indexCatalog(catalog);
  const states = (id: string): IfraState => (id === "ton" ? "by-constituents" : "ceiling");
  const ids = (filters: Partial<typeof NO_FILTERS>) =>
    listAll(index, 50, keepOf({ ...NO_FILTERS, ...filters }, catalog.have, states)).flatMap((r) => r.members.map((m) => m.material.id));

  it("by kind, by whose, by what you have and by IFRA state", () => {
    expect(ids({})).toEqual(["my-cou", "cou", "ton"]);
    expect(ids({ kind: "natural" })).toEqual(["ton"]);
    expect(ids({ owner: "own" })).toEqual(["my-cou"]);
    expect(ids({ owner: "common" })).toEqual(["cou", "ton"]);
    expect(ids({ haveOnly: true })).toEqual(["my-cou"]);
    expect(ids({ ifra: "by-constituents" })).toEqual(["ton"]);
  });
});

describe("a workbench's formulas with their versions together (8.1)", () => {
  it("each mother, then the versions that come from it, along the chain", async () => {
    const { byVersions } = await import("./Glossary");
    const f = (id: string, name: string, parentId: string | null = null) => ({
      id, name, parentId, workbenchId: "b", intention: "", containerCapacityMl: null, containerTareUg: null, workBatchUg: null, finalBatchUg: null, markers: [], role: null, createdAt: null,
    });
    const list = [f("c", "GuiAaa con pirazinas", "b2"), f("z", "protoguidev3"), f("b2", "GuiAaa sin pirazinas", "a"), f("a", "GuiAaa"), f("g", "guia")];
    expect(byVersions(list).map((x) => x.id)).toEqual(["g", "a", "b2", "c", "z"]);
  });
});
