import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { type Catalog, type CatalogMaterial, type Component, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import type { IfraLayer, IfraStandard } from "../db/ifra-layer";
import { indexCatalog, listAll } from "../db/search";
import { toIfra } from "../db/to-ifra";
import { texts } from "../i18n/en";
import { type IfraState, keepOf, NO_FILTERS } from "./browse";
import { decimal, percent } from "./format";
import { figureSources, type Sheet, sheetOf } from "./sheet";

/**
 * Plan v3, steps 6.1 and 6.2 (V3-47): the sheet of a material as a plain data sheet, and the
 * glossary's filters, over a catalog and an IFRA layer made by hand.
 */

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100n));
const ME = "user-me";
const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, strengthSource: null, evolution: NO_EVOLUTION,
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
  inci: "COUMARIN",
  isomers: "ninguno",
  abbreviation: "Cou",
  abbreviationOrigin: "user",
  categoryId: "cat-cou",
  family: "transformed",
  color: "#aa5500",
  role: "fixative",
  tenacityHours: Ratio.of(400n),
  tenacitySource: "TGSC",
  physical: { ...NO_PHYSICAL, state: "sólido", density: Ratio.fromDecimal("0.935") },
  disputedFields: ["tenacity_hours", "strength", "isomers", "threshold"],
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
  inci: "COUMARIN",
  abbreviation: "Cou",
  abbreviationOrigin: "user",
  supplier: "Perfumiarz",
  product: "Coumarin 99 %",
  productUrl: "https://example.test/coumarin",
  notes: "Comprada en 2026.",
});
const catalog: Catalog = {
  materials: new Map([coumarin, tonka, mine].map((m) => [m.id, m])),
  categories: new Map([["cat-cou", { id: "cat-cou", name: "cumarina", aliases: [] }]]),
  have: new Set(["my-cou"]),
  dilutions: new Map([["my-cou", [{ id: "dl1", fraction: pct("10"), solvent: "DPG", madeOn: "2026-09-01", description: null, label: null, materialMassUg: null, sourceDilutionId: null, archivedAt: null, diluents: [] }]]]),
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
    expect(s.sections.map((x) => x.key)).toEqual(["identity", "smell", "physical", "composition", "ifra", "doses", "descriptors", "relations", "references"]);
  });

  it("each value; what nobody says is null, never empty or zero", () => {
    expect(row(s, "identity", "INCI").text).toBe("COUMARIN");
    expect(row(s, "physical", "Density").text).toBe("0,935 g/ml");
    expect(row(s, "identity", "Species").text).toBeNull();
    // A role in words, not its code.
    expect(row(s, "smell", "Role").text).toBe(texts.sheet.roles.fixative);
  });

  it("shows what the material is, not what the head says nor the app's own (the user, 2026-10-29)", () => {
    // Asked by the user, not a wrong result before: the colour and its codes are internal; name,
    // type, abbreviation, family, strength, note and hours are in the head; the abbreviation's
    // origin, the solvent mark and a category named as the material are the app's own.
    const labels = s.sections.flatMap((x) => x.rows.map((r) => r.label));
    const f = texts.sheet.fields;
    for (const gone of [f.name, f.kind, f.whose, f.abbreviation, f.category, f.solvent, f.family, f.color, f.tier, f.tenacity, f.strength, f.ifraUnverified]) {
      expect(labels).not.toContain(gone);
    }
    expect(labels.some((l) => /colou?r/i.test(l))).toBe(false);
  });

  it("a category that says more than the name stays", () => {
    const other: Catalog = { ...catalog, categories: new Map([["cat-cou", { id: "cat-cou", name: "Lactonas", aliases: [] }]]) };
    expect(row(sheetOf(other, layer, toIfra(other, layer), "cou"), "identity", "Category").text).toBe("Lactonas");
  });

  it("a datum in dispute says so, also when it is not known (V3-17)", () => {
    expect(row(s, "identity", "Isomers")).toMatchObject({ text: "ninguno", disputed: true });
    expect(row(s, "smell", "Threshold")).toMatchObject({ text: null, disputed: true });
    expect(row(s, "identity", "INCI").disputed).toBe(false);
  });

  it("its IFRA: its own state and its standard with the limit of category 4", () => {
    expect(s.ifra.state).toBe("ceiling");
    const table = s.sections.find((x) => x.key === "ifra")!.tables[0];
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0][0]).toBe("STD 051 Coumarin");
    expect(table.rows[0][1]).toBe("100 %");
    expect(table.rows[0][2]).toMatch(/^1,6 % of the finished product/);
  });

  it("its doses, one line each with their base; who says them, under their mark in «Sources» (V3-86)", () => {
    // One line each, not a table of eight columns (the user, 2026-10-30: legibility).
    const doses = s.sections.find((x) => x.key === "doses")!.lines!;
    expect(doses.map((x) => x.text)).toEqual(["0,5 % – 10 % of the concentrate"]);
    expect(s.sources[doses[0].marks[0] - 1]).toMatchObject({ text: "Arctander", authority: "literature", disputed: false });
  });

  it("what it goes with, one row per kind: «Blends with: chypre, lemon» (the user, 2026-10-30)", () => {
    const withRelations = material("r", {
      relations: [
        { id: "r1", kind: "combines", otherId: null, otherText: "chypre", note: null, sources: "Fraterworks" },
        { id: "r2", kind: "combines", otherId: null, otherText: "lemon", note: "fresh opening", sources: "Eden Botanicals" },
        { id: "r4", kind: "combines", otherId: null, otherText: "Chypre", note: null, sources: "Darren Alan" },
        { id: "r3", kind: "substitute", otherId: "cou", otherText: null, note: null, sources: null },
      ],
    });
    const only: Catalog = { ...catalog, materials: new Map([[withRelations.id, withRelations], [coumarin.id, coumarin]]), have: new Set(), dilutions: new Map(), evaluations: new Map(), axes: new Map() };
    const r = sheetOf(only, layer, toIfra(only, layer), "r");
    const rows = r.sections.find((x) => x.key === "relations")!.rows;
    expect(rows.map((x) => [x.label, x.value.text])).toEqual([["Blends with", "chypre, lemon"], ["Substitutes", "Cumarina"]]);
    // The note goes with its source.
    expect(r.sources[rows[0].value.items![1].marks[0] - 1]).toMatchObject({ text: "Eden Botanicals", note: "fresh opening" });
    // A name said by two sources, once, with both marks.
    expect(rows[0].value.items![0].marks.map((m) => r.sources[m - 1].text)).toEqual(["Fraterworks", "Darren Alan"]);
  });

  it("the sources, at the end in the order the sheet reads; each figure with its mark (V3-86)", () => {
    // Asked by the user (2026-10-29): the sources leave the values and the tables for one list at the end.
    expect(s.figures).toEqual({ strength: null, hours: 1 });
    expect(s.sources[0]).toMatchObject({ mark: 1, what: texts.glossary.hero.strip, text: "TGSC", disputed: true });
    expect(s.sources.map((x) => x.mark)).toEqual(s.sources.map((_, i) => i + 1));
    // What the sources disagree on, said once among them: the head's figures and the rows.
    expect(s.sources[s.sources.length - 1]).toMatchObject({ what: texts.sheet.inDispute, text: "Strength · On a blotter · Isomers · Threshold" });
    const physical = material("p", { physical: { ...NO_PHYSICAL, density: Ratio.of(1n), sources: "TGSC" }, notes: "Se buscó en TGSC." });
    const only: Catalog = { ...catalog, materials: new Map([[physical.id, physical]]), have: new Set(), dilutions: new Map(), evaluations: new Map(), axes: new Map() };
    const p = sheetOf(only, layer, toIfra(only, layer), "p");
    // One source for the physical data, on its section; a common material's notes are its research diary.
    expect(p.sources[p.sections.find((x) => x.key === "physical")!.mark! - 1]).toMatchObject({ what: "Physical", text: "TGSC" });
    expect(p.sources.find((x) => x.what === texts.sheet.researchNotes)?.text).toBe("Se buscó en TGSC.");
    expect(p.sections.some((x) => x.key === "yourNotes")).toBe(false);
  });
});

describe("the composition says how much and who says it", () => {
  it("a range, a figure unknown; and a material without one says so", () => {
    const ton = sheet("ton");
    const table = ton.sections.find((x) => x.key === "composition")!.tables[0];
    expect(table.rows).toEqual([
      ["Coumarin · 91-64-5", "20 % – 40 %"],
      ["Dihydrocoumarin · 119-84-6", "contains it, no figure"],
    ]);
    expect(table.marks!.map((mark) => ton.sources[mark - 1])).toMatchObject([
      { what: "Composition · Coumarin · 91-64-5", text: "certificado", authority: "product" },
      { what: "Composition · Dihydrocoumarin · 119-84-6", text: "certificado", authority: "product" },
    ]);
    const empty = sheet("cou").sections.find((x) => x.key === "composition")!.tables[0];
    expect([empty.rows, empty.empty]).toEqual([[], "Its record gives no composition (what IFRA's annex says goes under IFRA)."]);
  });
});

describe("your version (V3-5): the common material's record with yours over it", () => {
  const s = sheet("my-cou");

  it("says whose it is, and adds your bottle and your lab", () => {
    expect(row(s, "identity", "Whose").text).toBe("your version of «Cumarina»");
    expect(s.sections.map((x) => x.key)).toEqual(["identity", "bottle", "smell", "physical", "composition", "ifra", "doses", "descriptors", "relations", "references", "lab", "yourNotes"]);
    expect(row(s, "bottle", "Page")).toMatchObject({ text: "https://example.test/coumarin", link: "https://example.test/coumarin" });
    expect(row(s, "lab", "Axes").text).toBe("dulce · heno");
    expect(s.sections.find((x) => x.key === "lab")!.tables[0].rows).toEqual([["10 %", "DPG", "2026-09-01", ""]]);
  });

  it("inherits what it does not say, and marks what is yours", () => {
    expect(row(s, "identity", "CAS")).toMatchObject({ text: "91-64-5", yours: false });
    // The same value as its common material's is inherited, not yours.
    expect(row(s, "identity", "INCI")).toMatchObject({ text: "COUMARIN", yours: false, notes: [] });
    // Your notes are yours to read, not a source: they stay in the sheet.
    expect(row(s, "yourNotes", "Notes")).toMatchObject({ text: "Comprada en 2026.", yours: true, notes: ["yours"] });
    expect(s.sections.find((x) => x.key === "doses")!.lines).toHaveLength(1);
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
      id, name, parentId, workbenchId: "b", intention: "", notes: "", containerCapacityMl: null, containerTareUg: null, workBatchUg: null, finalBatchUg: null, markers: [], role: null, createdAt: null, updatedAt: null,
    });
    const list = [f("c", "GuiAaa con pirazinas", "b2"), f("z", "protoguidev3"), f("b2", "GuiAaa sin pirazinas", "a"), f("a", "GuiAaa"), f("g", "guia")];
    expect(byVersions(list).map((x) => x.id)).toEqual(["g", "a", "b2", "c", "z"]);
  });
});

describe("the source under each figure of the head (V3-81)", () => {
  const common = material("c", { strength: "high", strengthSource: "lab: materiales.sqlite", tenacityHours: Ratio.of(48n), tenacitySource: "TGSC" });
  it("your version's own, else its common material's; the hours with theirs", () => {
    const yours = material("y", { ownerId: ME, basedOnId: "c", strength: "medium", strengthSource: "my notebook" });
    expect(figureSources(yours, common)).toEqual({ strength: "my notebook", hours: "TGSC" });
    expect(figureSources(material("y2", { ownerId: ME, basedOnId: "c" }), common)).toEqual({ strength: "lab: materiales.sqlite", hours: "TGSC" });
  });
  it("a figure without a source has none to show", () => {
    expect(figureSources(material("b", { strength: "low" }), undefined)).toEqual({ strength: null, hours: null });
  });
});
