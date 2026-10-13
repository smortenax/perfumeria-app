import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { checkIfra } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import type { Amount, Authority, Catalog, CatalogMaterial, Component, MaterialFields, MaterialKind, Regulation } from "./catalog";
import { effective, ifraCard, NO_DATA, toIfra } from "./to-ifra";

/**
 * Plan v3, step 3.3: from a catalog made by hand, without a database, the IfraData expected.
 * Each case says the rule it checks; the equivalence with the v2's data is phase 5's.
 */

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100n));
const ME = "user-me";

const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null, purity: null, house: null, code: null,
  odorTarget: null, synthesis: null, isomers: null, family: null, familyDetail: null, facets: null, tier: null, evolution: null,
  tenacity: null, strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null,
  sources: null, confidence: null, disputedFields: [],
};

let n = 0;
const component = (componentId: string, amount: Amount, authority: Authority = "ifra"): Component => ({
  id: `c${++n}`, componentId, amount, authority, source: "prueba",
});
const exact = (text: string): Amount => ({ kind: "exact", value: pct(text) });
const max = (text: string): Amount => ({ kind: "max", value: pct(text) });
const ceiling = (group: string | null, limit: string, extra: Partial<Regulation> = {}): Regulation => ({
  id: `r${++n}`, regime: "ifra", category: "4", kind: "max", maxValue: pct(limit), groupKey: group, requirement: null,
  authority: "ifra", source: "IFRA 51", ...extra,
});

function material(id: string, kind: MaterialKind, extra: Partial<CatalogMaterial> = {}): CatalogMaterial {
  return { ...FIELDS, id, ownerId: null, name: id, kind, components: [], regulations: [], doses: [], ...extra };
}

const catalogOf = (...materials: CatalogMaterial[]): Catalog => ({
  materials: new Map(materials.map((m) => [m.id, m])),
  categories: new Map(),
  have: new Set(),
  dataCommit: null,
});

const substancesOf = (catalog: Catalog, id: string) =>
  toIfra(catalog).materials.get(id)!.substances.map((s) => [s.key, s.fraction?.toString() ?? null, s.upper?.toString() ?? null]);

describe("the composition is opened, and where it stops depends on the kind (§3.4)", () => {
  const coumarin = material("coumarin", "molecule", { cas: "91-64-5", regulations: [ceiling("STD_COU", "1.5")] });
  const tonka = material("tonka", "natural", { components: [component("coumarin", exact("25"))] });
  const base = material("base", "composition", { components: [component("tonka", exact("40"), "product")] });
  const blind = material("blind", "natural");
  const plain = material("plain", "molecule");
  const catalog = catalogOf(coumarin, tonka, base, blind, plain);

  it("a regulated molecule is itself: its substance at 1", () => {
    expect(substancesOf(catalog, "coumarin")).toEqual([["std:STD_COU", "1", null]]);
    expect(toIfra(catalog).substances.get("std:STD_COU")).toMatchObject({ name: "coumarin", amendment: "IFRA 51", cas: ["91-64-5"] });
    expect(toIfra(catalog).substances.get("std:STD_COU")!.limit.eq(pct("1.5"))).toBe(true);
  });

  it("a natural carries its components' share, and a base the share of a share", () => {
    expect(substancesOf(catalog, "tonka")).toEqual([["std:STD_COU", "1/4", null]]);
    expect(substancesOf(catalog, "base")).toEqual([["std:STD_COU", "1/10", null]]);
  });

  it("a natural without components is unknown: pending, never free; a molecule without components is just itself", () => {
    expect(toIfra(catalog).materials.get("blind")).toEqual({ status: "checked", substances: [], conditions: [], pending: [NO_DATA] });
    expect(toIfra(catalog).materials.get("plain")).toEqual({ status: "checked", substances: [], conditions: [] });
  });

  it("a provisional material is unchecked: only a name (§1.4)", () => {
    expect(toIfra(catalogOf(material("x", "provisional", { ownerId: ME }))).materials.get("x")!.status).toBe("unchecked");
  });
});

describe("what is not proven is never known (V3-7, §5.3)", () => {
  const eugenol = material("eugenol", "molecule", { regulations: [ceiling("STD_EUG", "0.5")] });
  it("literature or consensus counts its maximum in the worst case; «unknown» counts the whole container", () => {
    const oil = material("oil", "natural", { components: [component("eugenol", max("4"), "literature")] });
    const absolute = material("absolute", "natural", { components: [component("eugenol", { kind: "unknown" }, "consensus")] });
    const ranged = material("ranged", "natural", { components: [component("eugenol", { kind: "range", min: pct("1"), max: pct("3") }, "product")] });
    const catalog = catalogOf(eugenol, oil, absolute, ranged);
    expect(substancesOf(catalog, "oil")).toEqual([["std:STD_EUG", null, "1/25"]]);
    expect(substancesOf(catalog, "absolute")).toEqual([["std:STD_EUG", null, "1"]]);
    expect(substancesOf(catalog, "ranged")).toEqual([["std:STD_EUG", "3/100", null]]);
  });
});

describe("the groups of a standard (§4.5)", () => {
  it("members with one ceiling add up against it, under one substance", () => {
    const geranial = material("geranial", "molecule", { regulations: [ceiling("STD_CIT", "0.6")] });
    const neral = material("neral", "molecule", { regulations: [ceiling("STD_CIT", "0.6")] });
    const lemongrass = material("lemongrass", "natural", { components: [component("geranial", exact("40")), component("neral", exact("30"))] });
    const catalog = catalogOf(geranial, neral, lemongrass);
    expect(substancesOf(catalog, "lemongrass")).toEqual([["std:STD_CIT", "7/10", null]]);
    expect(toIfra(catalog).substances.get("std:STD_CIT")).toMatchObject({ name: "geranial / neral" });
    expect(toIfra(catalog).substances.get("std:STD_CIT")!.combined).toBeUndefined();
  });

  it("members with different ceilings are a combined group: each its own, their shares summed", () => {
    const bergamot = material("bergamot", "natural", { regulations: [ceiling("STD_089", "0.4")] });
    const lemon = material("lemon", "natural", { regulations: [ceiling("STD_089", "2")] });
    const catalog = catalogOf(bergamot, lemon);
    const data = toIfra(catalog);
    expect(substancesOf(catalog, "bergamot")).toEqual([["std:STD_089@1/250", "1", null]]);
    expect(data.substances.get("std:STD_089@1/250")!.combined).toBe("STD_089");
    expect(data.substances.get("std:STD_089@1/50")!.combined).toBe("STD_089");
  });

  it("only category 4 counts, or a regulation for every category", () => {
    const m = material("m", "molecule", { regulations: [ceiling("STD_A", "1", { category: "5A" }), ceiling("STD_B", "2", { category: null })] });
    expect(substancesOf(catalogOf(m), "m")).toEqual([["std:STD_B", "1", null]]);
  });
});

describe("prohibitions, requirements and a manufacturer's ceiling (V3-25, P62)", () => {
  const prohibited = (group: string): Regulation => ({ ...ceiling(group, "0"), kind: "prohibited", maxValue: null });
  const requirement = (group: string, authority: Authority): Regulation => ({
    ...ceiling(group, "0"), kind: "requirement", maxValue: null, requirement: "rectificado", authority,
  });

  it("a prohibition with nothing else prohibits the material as such; carried inside, it is pending", () => {
    const musk = material("musk", "molecule", { regulations: [prohibited("STD_MUSK")] });
    const blend = material("blend", "composition", { components: [component("musk", exact("1"), "product")] });
    const data = toIfra(catalogOf(musk, blend));
    expect(data.materials.get("musk")!.substances).toEqual([{ key: "prohibido:STD_MUSK", fraction: Ratio.ONE }]);
    expect(data.substances.get("prohibido:STD_MUSK")!.limit.isZero()).toBe(true);
    expect(data.materials.get("blend")!.pending?.[0]).toContain("prohibido como tal");
    expect(ifraCard(catalogOf(musk, blend), "musk")).toEqual({ state: "prohibited" });
  });

  it("the cade: only IFRA's requirement is pending; a consensus assumes it; a product's document accredits it", () => {
    const cade = material("cade", "natural", { components: [], regulations: [prohibited("STD_119"), requirement("STD_119", "ifra")] });
    const mine = material("mine", "natural", { ownerId: ME, basedOnId: "cade", regulations: [requirement("STD_119", "consensus")] });
    const proven = material("proven", "natural", { ownerId: ME, basedOnId: "cade", regulations: [requirement("STD_119", "product")] });
    const catalog = catalogOf(cade, mine, proven);
    const data = toIfra(catalog);
    expect(data.materials.get("cade")!.pending).toEqual([NO_DATA, "cade: rectificado: no está acreditado (STD_119)."]);
    expect(data.materials.get("mine")!.assumed).toEqual(["rectificado (STD_119): supuesta, no acreditada"]);
    expect(data.materials.get("proven")!.conditions).toEqual(["rectificado (STD_119)"]);
    // V3-25: never «prohibited» for the rectified; its own state, with its condition.
    expect(ifraCard(catalog, "cade")).toEqual({ state: "requirement", requirement: "pending", what: "rectificado" });
    expect(ifraCard(catalog, "mine")).toEqual({ state: "requirement", requirement: "assumed", what: "rectificado" });
    expect(ifraCard(catalog, "proven")).toEqual({ state: "requirement", requirement: "accredited", what: "rectificado" });
  });

  it("a manufacturer's ceiling is its product's, reported apart", () => {
    const ambrinol = material("ambrinol", "molecule", {
      supplier: "Symrise",
      regulations: [{ ...ceiling(null, "0.0082"), regime: "manufacturer", authority: "product" }],
    });
    const data = toIfra(catalogOf(ambrinol));
    expect(data.materials.get("ambrinol")!.substances).toEqual([{ key: "tope:ambrinol", fraction: Ratio.ONE }]);
    expect(data.substances.get("tope:ambrinol")).toMatchObject({ supplier: "Symrise", name: "ambrinol (tope de Symrise)" });
  });
});

describe("the user's version of a common material (V3-5)", () => {
  const isophorone = material("isophorone", "molecule", { regulations: [ceiling("STD_154", "0.0013")] });
  const benzaldehyde = material("benzaldehyde", "molecule", { regulations: [ceiling("STD_BZ", "1")] });
  const common = material("labdanum", "natural", {
    components: [component("isophorone", max("0.2")), component("benzaldehyde", max("0.9"))],
  });
  const mine = material("my-labdanum", "natural", {
    ownerId: ME,
    basedOnId: "labdanum",
    components: [component("benzaldehyde", exact("0.004"), "product")],
    regulations: [{ ...ceiling(null, "20"), regime: "manufacturer", authority: "product" }],
  });
  const catalog = catalogOf(isophorone, benzaldehyde, common, mine);

  it("inherits the common one's composition; its own certificate rules each component it gives, by authority", () => {
    expect(effective(catalog, "my-labdanum").components.map((c) => [c.componentId, c.authority])).toEqual([
      ["benzaldehyde", "product"],
      ["isophorone", "ifra"],
    ]);
    expect(substancesOf(catalog, "my-labdanum")).toEqual(
      expect.arrayContaining([
        ["std:STD_BZ", "1/25000", null],
        ["std:STD_154", "1/500", null],
        ["tope:my-labdanum", "1", null],
      ]),
    );
  });

  it("and the common one does not change", () => {
    expect(substancesOf(catalog, "labdanum")).toEqual([
      ["std:STD_154", "1/500", null],
      ["std:STD_BZ", "9/1000", null],
    ]);
  });
});

describe("the engine reads it (end to end, without a database)", () => {
  it("1 g of a bottle with 300 mg of a natural at 25 % coumarin: 7,5 % coumarin, over its 1,5 %", () => {
    const coumarin = material("coumarin", "molecule", { regulations: [ceiling("STD_COU", "1.5")] });
    const tonka = material("tonka", "natural", { components: [component("coumarin", exact("25"))] });
    const data = toIfra(catalogOf(coumarin, tonka));
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
