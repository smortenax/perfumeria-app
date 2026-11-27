import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { checkIfra } from "../core/ifra";
import type { Formula } from "../core/model/formula";
import { DILUENTS } from "../core/model/material";
import { type Amount, type Authority, type Catalog, type CatalogMaterial, type Component, type MaterialFields, type MaterialKind, NO_EVOLUTION, NO_PHYSICAL } from "./catalog";
import type { IfraAnnexEntry, IfraLayer, IfraStandard } from "./ifra-layer";
import { cleanName, documentOf, toIfra } from "./to-ifra";

/**
 * V3-113 (proposal of the session, 2026-11-27): the audit of every material with one drop in 2 g. The
 * user: «que se asegure que se solapan los constituyentes de la manera adecuada que no haya problemas
 * con lo que debería dar un material de ifra y lo que da». Each case is one a real material of the
 * user's showed (its name in the case), made by hand here without a database.
 */

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100n));
const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, strengthSource: null, impact: null, impactSource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
let n = 0;
const part = (cas: string | null, name: string, amount: Amount, authority: Authority, source: string): Component => ({
  id: `c${++n}`, componentId: null, componentCas: cas, componentName: name, amount, authority, source,
});
const exact = (text: string): Amount => ({ kind: "exact", value: pct(text) });
const max = (text: string): Amount => ({ kind: "max", value: pct(text) });
const material = (id: string, kind: MaterialKind, extra: Partial<CatalogMaterial> = {}): CatalogMaterial =>
  ({ ...FIELDS, id, ownerId: null, name: id, kind, components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra });
const catalogOf = (...materials: CatalogMaterial[]): Catalog => ({
  materials: new Map(materials.map((m) => [m.id, m])), categories: new Map(), have: new Set(), dilutions: new Map(), evaluations: new Map(), axes: new Map(), dataCommit: null,
});

interface Spec { readonly code: string; readonly name: string; readonly cas: readonly string[]; readonly limit: string; readonly group?: string; readonly expressedAs?: readonly [string, string] }
function layerOf(specs: readonly Spec[], annex: readonly IfraAnnexEntry[] = []): IfraLayer {
  const standards = new Map<string, IfraStandard>();
  const byCas = new Map<string, string[]>();
  for (const s of specs) {
    standards.set(s.code, {
      code: s.code, name: s.name, amendment: "51", type: "", prohibition: false, restriction: true, specification: false, prohibitedAsSuch: false,
      groupKey: s.group ?? s.code, limitExpressedAs: s.expressedAs?.[0] ?? null, limitExpressedAsCas: s.expressedAs?.[1] ?? null, prohibitionNote: null,
      specificationNote: null, property: null, limits: new Map([["4", { kind: "max" as const, maxValue: pct(s.limit) }]]),
      substances: s.cas.map((cas) => ({ cas, subgroup: null, synonyms: [] })), variantRules: [], specExclusions: [],
    });
    for (const cas of s.cas) byCas.set(cas, [...(byCas.get(cas) ?? []), s.code]);
  }
  return { standards, byCas, annex };
}
const annexEntry = (naturalCas: string, naturalName: string, constituentCas: string, constituentName: string, concentration: string): IfraAnnexEntry => ({
  naturalCas, naturalOtherCas: [], naturalName, botanicalName: null, constituentCas, constituentName, concentration: pct(concentration), constituentStandard: null, notice: null,
});
const loads = (catalog: Catalog, layer: IfraLayer, id: string) =>
  toIfra(catalog, layer).materials.get(id)!.substances.map((s) => [s.key, s.fraction?.toString() ?? null, s.upper?.toString() ?? null]);

/** One drop, 30 mg, in a 2 g bottle with alcohol: the user's case (V3-103). */
const drop = (key: string, name: string): Formula => ({
  header: { name: "drop", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
  history: [
    { kind: "add", id: "1", material: DILUENTS.alcohol, massUg: 1_970_000n, fraction: Ratio.ONE, diluent: null },
    { kind: "add", id: "2", material: { key, kind: "base", name }, massUg: 30_000n, fraction: Ratio.ONE, diluent: null },
  ],
});

describe("a component known only by its name (V3-113)", () => {
  it("is the common molecule of that name, without the EU's annex number («Carvone III/333»)", () => {
    expect(cleanName("Limonene  III/88")).toBe("limonene");
    expect(cleanName("Estragole Natural (Methyl chavicol)")).toBe("estragole");
    const layer = layerOf([{ code: "STD_016", name: "l-Carvone", cas: ["99-49-0"], limit: "1.2" }]);
    const carvone = material("carvone", "molecule", { cas: "99-49-0", name: "Carvone" });
    const oil = material("oil", "natural", { components: [part(null, "Carvone  III/333", exact("2"), "product", "allergens.pdf")] });
    expect(loads(catalogOf(carvone, oil), layer, "oil")).toEqual([["std:STD_016", "1/50", null]]);
  });

  it("or the standard of that name when no molecule has it («Citral» of the wormwood's declaration)", () => {
    const layer = layerOf([{ code: "STD_021", name: "Citral", cas: ["5392-40-5", "141-27-5"], limit: "0.6" }]);
    const oil = material("oil", "natural", { components: [part(null, "Citral", exact("0.6"), "product", "allergens.pdf")] });
    expect(loads(catalogOf(oil), layer, "oil")).toEqual([["std:STD_021", "3/500", null]]);
  });

  it("stays a name, unknown, when two molecules go by it", () => {
    const layer = layerOf([{ code: "STD_X", name: "Something else", cas: ["1-1-1"], limit: "1" }]);
    const a = material("a", "molecule", { cas: "1-1-1", aliases: ["Pinene"] });
    const b = material("b", "molecule", { cas: "2-2-2", aliases: ["Pinene"] });
    const oil = material("oil", "natural", { components: [part(null, "Pinene", exact("2"), "product", "allergens.pdf")] });
    expect(toIfra(catalogOf(a, b, oil), layer).materials.get("oil")!.pending).toEqual(["No data on its constituents: it may contain substances with a ceiling."]);
  });
});

describe("two documents that speak of one standard say it once (V3-113)", () => {
  const thujone: Spec = { code: "STD_102", name: "Thujone", cas: ["546-80-5", "471-15-8"], limit: "1.4" };

  it("Ajenjo: the certificate's «Thujone» 60 % and the annex's beta-thujone 42 % are 60 %, not 102 %", () => {
    const layer = layerOf([thujone], [annexEntry("8008-93-3", "Wormwood oil", "471-15-8", "beta-Thujone", "42"), annexEntry("8008-93-3", "Wormwood oil", "546-80-5", "alpha-Thujone", "3")]);
    const oil = material("Wormwood oil", "natural", { cas: "8008-93-3", components: [part("546-80-5", "Thujone", exact("60"), "product", "Perfumiarz, certificado IFRA (ABS1R_IFRA51.pdf), page 1: «Thujone 0,6»")] });
    expect(loads(catalogOf(oil), layer, "Wormwood oil")).toEqual([["std:STD_102", "3/5", null]]);
  });

  it("Ambrarome: the allergens' carvone and the certificate's l-carvone, the same figure, count once", () => {
    const layer = layerOf([{ code: "STD_016", name: "l-Carvone", cas: ["99-49-0", "6485-40-1"], limit: "1.2" }]);
    const base = material("base", "composition", {
      components: [
        part("99-49-0", "Carvone", exact("0.0495"), "product", "Perfumiarz, declaración de alérgenos (I01410_ALG.pdf): «Carvone 0.0495»"),
        part("6485-40-1", "l-Carvone", exact("0.0495"), "product", "Perfumiarz, certificado IFRA (I01410_IFRA.pdf): «l-Carvone 0.0495»"),
      ],
    });
    expect(loads(catalogOf(base), layer, "base")).toEqual([["std:STD_016", "99/200000", null]]);
  });

  it("within one document, its members add up (geranial and neral of one certificate)", () => {
    const layer = layerOf([{ code: "STD_021", name: "Citral", cas: ["141-27-5", "106-26-3"], limit: "0.6" }]);
    const oil = material("oil", "natural", {
      components: [part("141-27-5", "Geranial", exact("1"), "product", "cert.pdf, page 1: «Geranial 1»"), part("106-26-3", "Neral", exact("2"), "product", "cert.pdf, page 2: «Neral 2»")],
    });
    expect(loads(catalogOf(oil), layer, "oil")).toEqual([["std:STD_021", "3/100", null]]);
    expect(documentOf("cert.pdf, page 2: «Neral 2»")).toBe("cert.pdf");
  });
});

describe("a material regulated whole carries its isomers already (V3-113)", () => {
  it("Timbersilk on Iso E Super: OTNE as itself and an OTNE isomer inside are 100 %, not 108,5 %", () => {
    const layer = layerOf([{ code: "STD_068", name: "OTNE", cas: ["54464-57-2", "54464-59-4"], limit: "20" }]);
    const arborone = material("arborone", "molecule", { cas: "54464-59-4", name: "Arborone" });
    const iso = material("iso", "molecule", { cas: "54464-57-2", components: [part(null, "Arborone (OTNE isomer)", exact("8.5"), "literature", "Fraterworks")] });
    expect(loads(catalogOf(arborone, iso), layer, "iso")).toEqual([["std:STD_068", "1", null]]);
  });
});

describe("a standard of an expressed peel oil is about that oil (V3-113)", () => {
  const bitter: Spec = { code: "STD_088", name: "Bitter orange peel oil expressed", cas: ["68916-04-1"], limit: "1.25", group: "furocumarinas" };
  const lime: Spec = { code: "STD_093", name: "Lime oil expressed", cas: ["90063-52-8"], limit: "0.7", group: "furocumarinas" };
  const layer = layerOf([bitter, lime]);

  it("Petitgrain: the leaf, distilled, is outside, though IFRA lists its CAS", () => {
    const petitgrain = material("petitgrain", "natural", { cas: "68916-04-1", part: "leaf (Maese Lab: «Hoja»)", process: "steam distillation" });
    expect(loads(catalogOf(petitgrain), layer, "petitgrain")).toEqual([]);
  });

  it("a distilled lime is outside; the expressed one and one the data do not place keep the ceiling", () => {
    const distilled = material("distilled", "natural", { cas: "90063-52-8", part: "peel", process: "steam distillation (Maese Lab: «Arrastre de Vapor»)" });
    const pressed = material("pressed", "natural", { cas: "90063-52-8", part: "peel", process: "cold expression (Maese Lab: «1º PRESION EN FRIO»)" });
    const silent = material("silent", "natural", { cas: "90063-52-8" });
    const catalog = catalogOf(distilled, pressed, silent);
    expect(loads(catalog, layer, "distilled")).toEqual([]);
    expect(loads(catalog, layer, "pressed")).toEqual([["std:furocumarinas@7/1000", "1", null]]);
    expect(loads(catalog, layer, "silent")).toEqual([["std:furocumarinas@7/1000", "1", null]]);
  });
});

describe("the bergamot without bergaptens, one drop in 2 g (V3-103)", () => {
  // The 5-MOP of STD 089, in the group of the phototoxic oils with the whole bergamot's ceiling.
  const layer = layerOf([
    { code: "STD_089", name: "Citrus oils and other furocoumarins containing essential oils", cas: ["68648-33-9"], limit: "0.0015", group: "furocumarinas", expressedAs: ["5-MOP", "484-20-8"] },
    { code: "STD_087", name: "Bergamot oil expressed", cas: ["8007-75-8"], limit: "0.4", group: "furocumarinas" },
  ]);
  const share = (catalog: Catalog) => {
    const report = checkIfra(drop("fcf", "Bergamot FCF"), toIfra(catalog, layer));
    return report.combinedChecks.map((c) => [c.verdict, c.worstShare.toString()]);
  };

  it("without a figure of its 5-MOP, it counts the whole oil: a thousand times the ceiling, unknown and never «exceeds»", () => {
    expect(share(catalogOf(material("fcf", "natural", { cas: "68648-33-9" })))).toEqual([["unknown", "1000"]]);
  });

  it("with the 0,0005 % a supplier certifies, the drop is half a percent of the ceiling, bounded", () => {
    const fcf = material("fcf", "natural", { cas: "68648-33-9", components: [part("484-20-8", "Bergaptene (5-MOP)", max("0.0005"), "literature", "Opella AB, IFRA Statement")] });
    expect(share(catalogOf(fcf))).toEqual([["bounded", "1/200"]]);
  });
});
