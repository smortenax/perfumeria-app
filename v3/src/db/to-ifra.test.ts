import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { checkIfra } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import {
  type Amount,
  type Authority,
  type Catalog,
  type CatalogMaterial,
  type Component,
  type MaterialFields,
  type MaterialKind,
  NO_EVOLUTION,
  NO_PHYSICAL,
  type Regulation,
} from "./catalog";
import type { IfraAnnexEntry, IfraLayer, IfraStandard, IfraVariantRule } from "./ifra-layer";
import { effective, ifraCard, NO_DATA, toIfra } from "./to-ifra";

/**
 * Plan v3, steps 3.3 and 4.3: from a catalog and an IFRA layer made by hand, without a database,
 * the IfraData expected. IFRA lives in its layer (V3-35): a material says its CAS, species and
 * process, and its IFRA comes from there. Each case says the rule it checks; they are the cases
 * of step 3.3, now read from the layer, and those of the layer's own rules.
 */

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100n));
const ME = "user-me";

const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};

let n = 0;
const component = (componentId: string, amount: Amount, authority: Authority = "product"): Component => ({
  id: `c${++n}`, componentId, componentCas: null, componentName: null, amount, authority, source: "prueba",
});
/** A component that is not a material of the glossary: a substance by its CAS and name (V3-36). */
const substance = (cas: string, name: string, amount: Amount, authority: Authority = "product"): Component => ({
  id: `c${++n}`, componentId: null, componentCas: cas, componentName: name, amount, authority, source: "certificado",
});
const exact = (text: string): Amount => ({ kind: "exact", value: pct(text) });
const max = (text: string): Amount => ({ kind: "max", value: pct(text) });

function material(id: string, kind: MaterialKind, extra: Partial<CatalogMaterial> = {}): CatalogMaterial {
  return { ...FIELDS, id, ownerId: null, name: id, kind, components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra };
}

const catalogOf = (...materials: CatalogMaterial[]): Catalog => ({
  materials: new Map(materials.map((m) => [m.id, m])),
  categories: new Map(),
  have: new Set(),
  dilutions: new Map(),
  evaluations: new Map(),
  axes: new Map(),
  dataCommit: null,
});

/** A standard of the layer, as IFRA's files would give it. */
interface Spec {
  readonly code: string;
  readonly cas: readonly string[];
  /** Its limit in category 4, in %. */
  readonly limit?: string;
  readonly otherLimits?: Readonly<Record<string, string>>;
  readonly group?: string;
  readonly prohibition?: boolean;
  readonly asSuch?: boolean;
  readonly specification?: string;
  readonly prohibitionNote?: string;
  readonly variantRules?: readonly IfraVariantRule[];
  readonly expressedAs?: readonly [string, string];
  readonly excluded?: readonly string[];
}

function layerOf(specs: readonly Spec[], annex: readonly IfraAnnexEntry[] = []): IfraLayer {
  const standards = new Map<string, IfraStandard>();
  const byCas = new Map<string, string[]>();
  for (const s of specs) {
    const limits = new Map(Object.entries({ ...(s.limit ? { "4": s.limit } : {}), ...s.otherLimits }).map(([category, value]) => [category, { kind: "max" as const, maxValue: pct(value) }]));
    standards.set(s.code, {
      code: s.code, name: s.code, amendment: "51", type: "", prohibition: s.prohibition ?? false, restriction: limits.size > 0,
      specification: s.specification !== undefined, prohibitedAsSuch: s.asSuch ?? false, groupKey: s.group ?? s.code,
      limitExpressedAs: s.expressedAs?.[0] ?? null, limitExpressedAsCas: s.expressedAs?.[1] ?? null, prohibitionNote: s.prohibitionNote ?? null,
      specificationNote: s.specification ?? null, property: null, limits,
      substances: s.cas.map((cas) => ({ cas, subgroup: null, synonyms: [] })), variantRules: s.variantRules ?? [],
      specExclusions: (s.excluded ?? []).map((process) => ({ process, note: "prueba" })),
    });
    for (const cas of s.cas) byCas.set(cas, [...(byCas.get(cas) ?? []), s.code]);
  }
  return { standards, byCas, annex };
}

const entry = (naturalCas: string, naturalName: string, constituentCas: string, constituentName: string, concentration: string): IfraAnnexEntry => ({
  naturalCas, naturalOtherCas: [], naturalName, botanicalName: null, constituentCas, constituentName, concentration: pct(concentration),
  constituentStandard: null, notice: null,
});

const substancesOf = (catalog: Catalog, layer: IfraLayer, id: string) =>
  toIfra(catalog, layer).materials.get(id)!.substances.map((s) => [s.key, s.fraction?.toString() ?? null, s.upper?.toString() ?? null]);

describe("the composition is opened, and where it stops depends on the kind (§3.4)", () => {
  const layer = layerOf([{ code: "STD_COU", cas: ["91-64-5"], limit: "1.5" }]);
  const coumarin = material("coumarin", "molecule", { cas: "91-64-5" });
  const tonka = material("tonka", "natural", { components: [component("coumarin", exact("25"))] });
  const base = material("base", "composition", { components: [component("tonka", exact("40"))] });
  const blind = material("blind", "natural");
  const plain = material("plain", "molecule");
  const catalog = catalogOf(coumarin, tonka, base, blind, plain);

  it("a molecule IFRA regulates by its CAS is itself: its substance at 1", () => {
    expect(substancesOf(catalog, layer, "coumarin")).toEqual([["std:STD_COU", "1", null]]);
    expect(toIfra(catalog, layer).substances.get("std:STD_COU")).toMatchObject({ name: "coumarin", amendment: "IFRA 51, STD_COU: STD_COU", cas: ["91-64-5"] });
    expect(toIfra(catalog, layer).substances.get("std:STD_COU")!.limit.eq(pct("1.5"))).toBe(true);
  });

  it("a natural carries its components' share, and a base the share of a share", () => {
    expect(substancesOf(catalog, layer, "tonka")).toEqual([["std:STD_COU", "1/4", null]]);
    expect(substancesOf(catalog, layer, "base")).toEqual([["std:STD_COU", "1/10", null]]);
  });

  it("a natural without components is unknown: pending, never free; a molecule without components is just itself", () => {
    expect(toIfra(catalog, layer).materials.get("blind")).toEqual({ status: "checked", substances: [], conditions: [], pending: [NO_DATA] });
    expect(toIfra(catalog, layer).materials.get("plain")).toEqual({ status: "checked", substances: [], conditions: [] });
  });

  it("a provisional material is unchecked: only a name (§1.4)", () => {
    expect(toIfra(catalogOf(material("x", "provisional", { ownerId: ME })), layer).materials.get("x")!.status).toBe("unchecked");
  });

  it("without IFRA's layer nothing is limited: an empty layer invents no ceiling", () => {
    expect(substancesOf(catalog, layerOf([]), "tonka")).toEqual([]);
  });
});

describe("what is not proven is never known (V3-7, §5.3)", () => {
  const layer = layerOf([{ code: "STD_EUG", cas: ["97-53-0"], limit: "0.5" }]);
  const eugenol = material("eugenol", "molecule", { cas: "97-53-0" });
  it("literature or consensus counts its maximum in the worst case; «unknown» counts the whole container", () => {
    const oil = material("oil", "natural", { components: [component("eugenol", max("4"), "literature")] });
    const absolute = material("absolute", "natural", { components: [component("eugenol", { kind: "unknown" }, "consensus")] });
    const ranged = material("ranged", "natural", { components: [component("eugenol", { kind: "range", min: pct("1"), max: pct("3") })] });
    const catalog = catalogOf(eugenol, oil, absolute, ranged);
    expect(substancesOf(catalog, layer, "oil")).toEqual([["std:STD_EUG", null, "1/25"]]);
    expect(substancesOf(catalog, layer, "absolute")).toEqual([["std:STD_EUG", null, "1"]]);
    expect(substancesOf(catalog, layer, "ranged")).toEqual([["std:STD_EUG", "3/100", null]]);
  });
});

describe("the groups of a standard (§4.5)", () => {
  it("members with one ceiling add up against it, under one substance", () => {
    const layer = layerOf([{ code: "STD_CIT", cas: ["141-27-5", "106-26-3"], limit: "0.6" }]);
    const geranial = material("geranial", "molecule", { cas: "141-27-5" });
    const neral = material("neral", "molecule", { cas: "106-26-3" });
    const lemongrass = material("lemongrass", "natural", { components: [component("geranial", exact("40")), component("neral", exact("30"))] });
    const catalog = catalogOf(geranial, neral, lemongrass);
    expect(substancesOf(catalog, layer, "lemongrass")).toEqual([["std:STD_CIT", "7/10", null]]);
    expect(toIfra(catalog, layer).substances.get("std:STD_CIT")).toMatchObject({ name: "geranial / neral" });
    expect(toIfra(catalog, layer).substances.get("std:STD_CIT")!.combined).toBeUndefined();
  });

  it("members with different ceilings are a combined group: each its own, their shares summed", () => {
    const layer = layerOf([
      { code: "STD_BERG", cas: ["8007-75-8"], limit: "0.4", group: "furocumarinas" },
      { code: "STD_LEMON", cas: ["8008-56-8"], limit: "2", group: "furocumarinas" },
    ]);
    const catalog = catalogOf(material("bergamot", "natural", { cas: "8007-75-8" }), material("lemon", "natural", { cas: "8008-56-8" }));
    const data = toIfra(catalog, layer);
    expect(substancesOf(catalog, layer, "bergamot")).toEqual([["std:furocumarinas@1/250", "1", null]]);
    expect(data.substances.get("std:furocumarinas@1/250")!.combined).toBe("furocumarinas");
    expect(data.substances.get("std:furocumarinas@1/50")!.combined).toBe("furocumarinas");
  });

  it("only category 4 counts", () => {
    const layer = layerOf([
      { code: "STD_A", cas: ["1-1-1"], otherLimits: { "5A": "1" } },
      { code: "STD_B", cas: ["1-1-1"], limit: "2" },
    ]);
    expect(substancesOf(catalogOf(material("m", "molecule", { cas: "1-1-1" })), layer, "m")).toEqual([["std:STD_B", "1", null]]);
  });
});

describe("prohibitions, requirements and a manufacturer's ceiling (V3-25, V3-30, P62)", () => {
  const claim = (group: string, authority: Authority, requirement = "rectificado"): Regulation => ({
    id: `r${++n}`, regime: "ifra", category: null, kind: "requirement", maxValue: null, groupKey: group, requirement, authority, source: "documento",
  });

  it("a prohibition with nothing else prohibits the material as such; carried inside, it is pending", () => {
    const layer = layerOf([{ code: "STD_MUSK", cas: ["81-14-1"], prohibition: true }]);
    const musk = material("musk", "molecule", { cas: "81-14-1" });
    const blend = material("blend", "composition", { components: [component("musk", exact("1"))] });
    const catalog = catalogOf(musk, blend);
    const data = toIfra(catalog, layer);
    expect(data.materials.get("musk")!.substances).toEqual([{ key: "prohibido:STD_MUSK", fraction: Ratio.ONE }]);
    expect(data.substances.get("prohibido:STD_MUSK")!.limit.isZero()).toBe(true);
    expect(data.materials.get("blend")!.pending?.[0]).toContain("prohibited as such");
    expect(ifraCard(catalog, layer, "musk")).toEqual({ state: "prohibited" });
  });

  it("V3-30: prohibited as such, with a ceiling: alone, prohibited; inside a natural (by the annex), against the ceiling; put straight into a mixture, pending", () => {
    const layer = layerOf(
      [{ code: "STD_154", cas: ["78-59-1"], limit: "0.0013", prohibition: true, asSuch: true }],
      [entry("8016-26-0", "Cistus oil", "78-59-1", "Isophorone", "0.01")],
    );
    const isophorone = material("isophorone", "molecule", { cas: "78-59-1" });
    const cistus = material("cistus", "natural", { cas: "8016-26-0", aliases: ["Cistus oil"] });
    const accord = material("accord", "composition", { components: [component("cistus", exact("10"))] });
    const blend = material("blend", "composition", { components: [component("isophorone", exact("1"))] });
    const catalog = catalogOf(isophorone, cistus, accord, blend);
    const data = toIfra(catalog, layer);
    expect(ifraCard(catalog, layer, "isophorone")).toEqual({ state: "prohibited" });
    expect(data.materials.get("isophorone")!.substances).toContainEqual({ key: "prohibido:STD_154", fraction: Ratio.ONE });
    expect(substancesOf(catalog, layer, "cistus")).toEqual([["std:STD_154", "1/10000", null]]);
    expect(data.materials.get("cistus")!.pending).toBeUndefined();
    expect(substancesOf(catalog, layer, "accord")).toEqual([["std:STD_154", "1/100000", null]]);
    expect(data.materials.get("accord")!.pending).toBeUndefined();
    expect(data.materials.get("blend")!.pending?.[0]).toContain("prohibited as such");
  });

  it("the cade: only IFRA's requirement is pending; a consensus assumes it; a product's document accredits it", () => {
    const layer = layerOf([{ code: "STD_119", cas: ["8013-10-3"], prohibition: true, specification: "rectificado" }]);
    const cade = material("cade", "natural", { cas: "8013-10-3" });
    const mine = material("mine", "natural", { ownerId: ME, basedOnId: "cade", regulations: [claim("STD_119", "consensus")] });
    const proven = material("proven", "natural", { ownerId: ME, basedOnId: "cade", regulations: [claim("STD_119", "product")] });
    const catalog = catalogOf(cade, mine, proven);
    const data = toIfra(catalog, layer);
    expect(data.materials.get("cade")!.pending).toEqual([NO_DATA, "cade: rectificado: not proven (STD_119)."]);
    expect(data.materials.get("mine")!.assumed).toEqual(["rectificado (STD_119): assumed, not proven"]);
    expect(data.materials.get("proven")!.conditions).toEqual(["rectificado (STD_119)"]);
    // V3-25: never «prohibited» for the rectified; its own state, with its condition.
    expect(ifraCard(catalog, layer, "cade")).toEqual({ state: "requirement", requirement: "pending", what: "rectificado" });
    expect(ifraCard(catalog, layer, "mine")).toEqual({ state: "requirement", requirement: "assumed", what: "rectificado" });
    expect(ifraCard(catalog, layer, "proven")).toEqual({ state: "requirement", requirement: "accredited", what: "rectificado" });
  });

  it("V3-25: a ceiling with a requirement shows the requirement too; of several standards, the least proven", () => {
    const layer = layerOf([
      { code: "STD_097", cas: ["91722-29-1"], limit: "0.01", specification: "rectificado" },
      { code: "STD_A", cas: ["2-2-2"], limit: "1", specification: "rectificado" },
      { code: "STD_B", cas: ["2-2-2"], specification: "no es el crudo" },
      { code: "STD_C", cas: ["3-3-3"], limit: "1" },
    ]);
    const minuta = material("minuta", "natural", { cas: "91722-29-1" });
    const both = material("both", "natural", { cas: "2-2-2", regulations: [claim("STD_A", "product")] });
    const plain = material("plain", "natural", { cas: "3-3-3" });
    const catalog = catalogOf(minuta, both, plain);
    expect(ifraCard(catalog, layer, "minuta")).toEqual({ state: "ceiling", requirement: "pending", what: "rectificado" });
    expect(ifraCard(catalog, layer, "both")).toEqual({ state: "ceiling", requirement: "pending", what: "no es el crudo" });
    expect(ifraCard(catalog, layer, "plain")).toEqual({ state: "ceiling" });
  });

  it("a specification is not about a process IFRA's standard excludes (the resinoid of STD 078)", () => {
    const layer = layerOf([{ code: "STD_078", cas: ["8046-19-3"], limit: "0.6", specification: "HAP del aceite pirogenado", excluded: ["resinoide"] }]);
    const resinoid = material("resinoid", "natural", { cas: "8046-19-3", process: "resinoide (extracción con disolvente)" });
    const oil = material("oil", "natural", { cas: "8046-19-3", process: "aceite esencial; pirogenado" });
    const catalog = catalogOf(resinoid, oil);
    expect(ifraCard(catalog, layer, "resinoid")).toEqual({ state: "ceiling" });
    expect(ifraCard(catalog, layer, "oil")).toEqual({ state: "ceiling", requirement: "pending", what: "HAP del aceite pirogenado" });
  });

  it("a manufacturer's ceiling is its product's, reported apart", () => {
    const ambrinol = material("ambrinol", "molecule", {
      supplier: "Symrise",
      regulations: [{ id: "t", regime: "manufacturer", category: "4", kind: "max", maxValue: pct("0.0082"), groupKey: null, requirement: null, authority: "product", source: "certificado" }],
    });
    const data = toIfra(catalogOf(ambrinol), layerOf([]));
    expect(data.materials.get("ambrinol")!.substances).toEqual([{ key: "tope:ambrinol", fraction: Ratio.ONE }]);
    expect(data.substances.get("tope:ambrinol")).toMatchObject({ supplier: "Symrise", name: "ambrinol (cap from Symrise)" });
  });
});

describe("a standard that prohibits a variant (V3-31)", () => {
  const layer = layerOf([
    {
      code: "STD_097", cas: ["8016-84-0"], limit: "0.01", prohibition: true, specification: "terthiophene ≤ 0,35 %",
      prohibitionNote: "Tagetes erecta should not be used",
      variantRules: [
        { field: "species", match: "contains", pattern: "erecta", variant: "prohibited" },
        { field: "species", match: "contains", pattern: "minuta", variant: "permitted" },
      ],
    },
  ]);
  const erecta = material("erecta", "natural", { cas: "8016-84-0", species: "Tagetes erecta L." });
  const minuta = material("minuta", "natural", { cas: "8016-84-0", species: "Tagetes minuta" });
  const unknown = material("unknown", "natural", { cas: "8016-84-0" });
  const catalog = catalogOf(erecta, minuta, unknown);

  it("the prohibited variant is prohibited, with no ceiling nor specification", () => {
    expect(ifraCard(catalog, layer, "erecta")).toEqual({ state: "prohibited" });
    expect(toIfra(catalog, layer).materials.get("erecta")!.substances).toEqual([{ key: "prohibido:STD_097", fraction: Ratio.ONE }]);
  });

  it("the permitted one keeps its ceiling and its specification", () => {
    expect(ifraCard(catalog, layer, "minuta")).toEqual({ state: "ceiling", requirement: "pending", what: "terthiophene ≤ 0,35 %" });
  });

  it("one the data do not place keeps its ceiling and, apart, «not the prohibited variant», pending", () => {
    const data = toIfra(catalog, layer).materials.get("unknown")!;
    expect(data.pending).toContain("unknown: Not the prohibited variant: «Tagetes erecta should not be used»: not proven (STD_097 · variant).");
    expect(data.substances).toEqual([{ key: "std:STD_097", fraction: Ratio.ONE }]);
  });
});

describe("a limit expressed as a constituent (V3-27: STD 089, 5-MOP)", () => {
  const layer = layerOf([
    { code: "STD_089", cas: ["8007-75-8"], limit: "0.0015", group: "furocumarinas", expressedAs: ["5-MOP", "484-20-8"] },
  ]);

  it("the member carries the constituent, how much not known: counted at worst against the constituent's limit", () => {
    const catalog = catalogOf(material("bergamot", "natural", { cas: "8007-75-8" }));
    expect(substancesOf(catalog, layer, "bergamot")).toEqual([["std:furocumarinas", null, "1"]]);
    expect(toIfra(catalog, layer).substances.get("std:furocumarinas")).toMatchObject({ name: "5-MOP", cas: ["484-20-8"] });
  });

  it("the certificate of your bottle gives its figure, and rules (V3-39)", () => {
    const bergamot = material("bergamot", "natural", { cas: "8007-75-8" });
    const mine = material("my-bergamot", "natural", { ownerId: ME, basedOnId: "bergamot", components: [substance("484-20-8", "5-MOP", exact("0.001"))] });
    expect(substancesOf(catalogOf(bergamot, mine), layer, "my-bergamot")).toEqual([["std:furocumarinas", "1/100000", null]]);
  });
});

describe("what IFRA's annex says a natural brings (V3-23, V3-28, V3-39)", () => {
  const specs = [{ code: "STD_CIT", cas: ["5392-40-5"], limit: "0.6" }];
  const annex = [entry("8008-56-8", "Lemon oil, expressed", "5392-40-5", "Citral", "3"), entry("8008-56-8", "Lemon oil, distilled", "5392-40-5", "Citral", "4")];
  const layer = layerOf(specs, annex);

  it("a natural with its own entry takes it, as IFRA's: known", () => {
    const lemon = material("lemon", "natural", { cas: "8008-56-8", aliases: ["Lemon oil, expressed"] });
    expect(substancesOf(catalogOf(lemon), layer, "lemon")).toEqual([["std:STD_CIT", "3/100", null]]);
  });

  it("without one, the most any entry with its CAS gives, as literature: never known (V3-28)", () => {
    const lemon = material("lemon", "natural", { cas: "8008-56-8" });
    expect(substancesOf(catalogOf(lemon), layer, "lemon")).toEqual([["std:STD_CIT", null, "1/25"]]);
  });

  it("IFRA gives some naturals only other CAS (the ylang-ylang absolute): they are found by them", () => {
    const onlyOther: IfraAnnexEntry = { ...entry("", "Ylang-ylang absolute", "5392-40-5", "Citral", "0.5"), naturalCas: null, naturalOtherCas: ["83863-30-3"] };
    const ylang = material("ylang", "natural", { cas: "83863-30-3", aliases: ["Ylang-ylang absolute"] });
    expect(substancesOf(catalogOf(ylang), layerOf(specs, [onlyOther]), "ylang")).toEqual([["std:STD_CIT", "1/200", null]]);
  });

  it("of two entries with its names, the first of its names wins, not the annex's order (V3-23)", () => {
    const two = layerOf(specs, [entry("8008-31-9", "Tangerine oil", "5392-40-5", "Citral", "1"), entry("8008-31-9", "Mandarin oil", "5392-40-5", "Citral", "2")]);
    const mandarin = material("mandarin", "natural", { cas: "8008-31-9", aliases: ["Mandarin oil", "Tangerine oil"] });
    expect(substancesOf(catalogOf(mandarin), two, "mandarin")).toEqual([["std:STD_CIT", "1/50", null]]);
  });

  it("an annex name's brackets say no variant: «Vetiver oil (all origins)» is the entry of a «Vetiver oil»", () => {
    const vetiver = layerOf(specs, [entry("8016-96-4", "Vetiver oil (all origins)", "5392-40-5", "Citral", "1")]);
    const mine = material("vetiver", "natural", { cas: "8016-96-4", aliases: ["Vetiver Oil"] });
    expect(substancesOf(catalogOf(mine), vetiver, "vetiver")).toEqual([["std:STD_CIT", "1/100", null]]);
  });

  it("the only entry with its CAS is not its own if it does not carry its name: borrowed, as literature (V3-28)", () => {
    const one = layerOf(specs, [entry("90028-06-1", "Tonka Bean absolute", "5392-40-5", "Citral", "3")]);
    const tincture = material("tincture", "natural", { cas: "90028-06-1" });
    expect(substancesOf(catalogOf(tincture), one, "tincture")).toEqual([["std:STD_CIT", null, "3/100"]]);
  });

  it("the certificate of your bottle rules over the annex for that constituent; the rest of the annex stays", () => {
    const common = material("lemon", "natural", { cas: "8008-56-8", aliases: ["Lemon oil, expressed"] });
    const mine = material("my-lemon", "natural", { ownerId: ME, basedOnId: "lemon", components: [substance("5392-40-5", "Citral", exact("2.5"))] });
    expect(substancesOf(catalogOf(common, mine), layer, "my-lemon")).toEqual([["std:STD_CIT", "1/40", null]]);
    expect(substancesOf(catalogOf(common, mine), layer, "lemon")).toEqual([["std:STD_CIT", "3/100", null]]);
  });
});

describe("the user's version of a common material (V3-5)", () => {
  const layer = layerOf(
    [
      { code: "STD_154", cas: ["78-59-1"], limit: "0.0013" },
      { code: "STD_BZ", cas: ["100-52-7"], limit: "1" },
    ],
    [entry("8016-26-0", "Labdanum", "78-59-1", "Isophorone", "0.2"), entry("8016-26-0", "Labdanum", "100-52-7", "Benzaldehyde", "0.9")],
  );
  const benzaldehyde = material("benzaldehyde", "molecule", { cas: "100-52-7" });
  const common = material("labdanum", "natural", { cas: "8016-26-0" });
  const mine = material("my-labdanum", "natural", {
    ownerId: ME,
    basedOnId: "labdanum",
    components: [component("benzaldehyde", exact("0.004"))],
    regulations: [{ id: "t", regime: "manufacturer", category: null, kind: "max", maxValue: pct("20"), groupKey: null, requirement: null, authority: "product", source: "certificado" }],
  });
  const catalog = catalogOf(benzaldehyde, common, mine);

  it("inherits what the common one is and its composition; its own certificate rules each component it gives", () => {
    expect(effective(catalog, "my-labdanum").components.map((c) => [c.componentId, c.authority])).toEqual([["benzaldehyde", "product"]]);
    expect(substancesOf(catalog, layer, "my-labdanum")).toEqual(
      expect.arrayContaining([
        ["std:STD_BZ", "1/25000", null],
        ["std:STD_154", "1/500", null],
        ["tope:my-labdanum", "1", null],
      ]),
    );
  });

  it("and the common one does not change", () => {
    expect(substancesOf(catalog, layer, "labdanum")).toEqual(
      expect.arrayContaining([
        ["std:STD_154", "1/500", null],
        ["std:STD_BZ", "9/1000", null],
      ]),
    );
  });
});

describe("a component that is a substance, not a material of the glossary (V3-36)", () => {
  it("known only by a name, without a CAS («Sin identificar», V3-29), it leaves the check pending, never free", () => {
    const isolate = material("isolate", "molecule", { cas: "91-64-5", components: [{ ...substance("", "Sin identificar", { kind: "unknown" }, "consensus"), componentCas: null }] });
    const data = toIfra(catalogOf(isolate), layerOf([{ code: "STD_COU", cas: ["91-64-5"], limit: "1.5" }]));
    expect(data.materials.get("isolate")!.pending).toEqual([NO_DATA]);
  });

  it("counts against its standard by its CAS, with its name", () => {
    const layer = layerOf([{ code: "STD_LIN", cas: ["78-70-6"], limit: "2" }]);
    const base = material("base", "composition", { ownerId: ME, components: [substance("78-70-6", "Linalool", exact("30"))] });
    const data = toIfra(catalogOf(base), layer);
    expect(substancesOf(catalogOf(base), layer, "base")).toEqual([["std:STD_LIN", "3/10", null]]);
    expect(data.substances.get("std:STD_LIN")).toMatchObject({ name: "Linalool", cas: ["78-70-6"] });
  });
});

describe("the engine reads it (end to end, without a database)", () => {
  it("1 g of a bottle with 300 mg of a natural at 25 % coumarin: 7,5 % coumarin, over its 1,5 %", () => {
    const layer = layerOf([{ code: "STD_COU", cas: ["91-64-5"], limit: "1.5" }]);
    const coumarin = material("coumarin", "molecule", { cas: "91-64-5" });
    const tonka = material("tonka", "natural", { components: [component("coumarin", exact("25"))] });
    const data = toIfra(catalogOf(coumarin, tonka), layer);
    const tonkaMaterial: Material = { key: "tonka", kind: "base", name: "Tonka" };
    const add = (id: string, m: Material, massUg: bigint): Change => ({ kind: "add", id, material: m, massUg, fraction: Ratio.ONE, diluent: null });
    const formula: Formula = {
      header: { name: "prueba", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
      history: [add("t", tonkaMaterial, 300_000n), add("a", DILUENTS.alcohol, 700_000n)],
    };
    const report = checkIfra(formula, data);
    expect(report.checks[0].substance.key).toBe("std:STD_COU");
    expect(report.checks[0].knownUg.toString()).toBe("75000");
    expect(report.checks[0].verdict).toBe("exceeds");
  });
});
