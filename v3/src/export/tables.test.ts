import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { type Catalog, type CatalogMaterial, type Dilution, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import { parseCsv } from "../bench/data/csv";
import { decimalOf, DILUTION_COLUMNS, dilutionsCsv, MATERIAL_COLUMNS, materialsCsv } from "./tables";

/** «Export data» (V3-80): your materials and your dilutions, as plain tables. */

const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));
const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
const m = (id: string, name: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial => ({
  ...FIELDS, id, ownerId: "me", name, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra,
});
const bottle = (id: string, p: string, extra: Partial<Dilution> = {}): Dilution => ({
  id, fraction: pct(p), solvent: null, madeOn: null, description: null, label: `at ${p} %`, materialMassUg: null, sourceDilutionId: null, archivedAt: null, diluents: [], ...extra,
});
const catalog = {
  materials: new Map(
    [
      m("lin", "Linalool", { ownerId: null, cas: "78-70-6", abbreviation: "Lin", family: "floral", tenacityHours: Ratio.of(12n), house: "BASF" }),
      m("dpg", "DPG", { ownerId: null, solvent: true }),
      m("eth", "Ethanol", { ownerId: null, solvent: true }),
      m("my", "Linalool, Maese Lab", { basedOnId: "lin", supplier: "Maese Lab", lot: "L-118", purchasedOn: "2026-10-18", status: "running_low", purity: pct("97.5") }),
      m("cac", "Cacao, \"10 %\", home", { kind: "natural", species: "Theobroma cacao" }),
      m("acc", "My accord", { kind: "frozen" }),
    ].map((x) => [x.id, x]),
  ),
  have: new Set(["my"]),
  dilutions: new Map([
    [
      "my",
      [
        bottle("d1", "10.0325", { madeOn: "2026-10-26", materialMassUg: 803_000n, diluents: [{ id: "x", diluentId: "dpg", massUg: 7_201_000n, fraction: pct("89.9675") }] }),
        bottle("d2", "50", { archivedAt: "2026-10-20", diluents: [{ id: "y", diluentId: "eth", massUg: null, fraction: pct("30") }, { id: "z", diluentId: "dpg", massUg: null, fraction: pct("20") }] }),
      ],
    ],
    ["cac", [bottle("d3", "5", { solvent: "alcohol 96º" })]],
  ]),
} as unknown as Catalog;
const rows = (text: string) => parseCsv(text).filter((r) => r.some((c) => c !== ""));
const byHeader = (text: string) => {
  const [header, ...body] = rows(text);
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
};

describe("your materials as data (V3-80)", () => {
  it("one row per material of yours, not the common ones nor the frozen formulas, with every column", () => {
    const [header, ...body] = rows(materialsCsv(catalog));
    expect(header).toEqual([...MATERIAL_COLUMNS]);
    expect(body.map((r) => r[1])).toEqual(['Cacao, "10 %", home', "Linalool, Maese Lab"]);
  });

  it("your version shows what it inherits; a gap is empty, never 0; figures with a point and their unit", () => {
    const [cacao, mine] = byHeader(materialsCsv(catalog));
    expect(mine).toMatchObject({ based_on: "Linalool", cas: "78-70-6", abbreviation: "Lin", manufacturer: "BASF", shop: "Maese Lab", lot: "L-118", purchased_on: "2026-10-18", purity_pct: "97.5", status: "running_low", i_have_it: "yes", family: "floral", tenacity_h: "12" });
    expect(cacao).toMatchObject({ species: "Theobroma cacao", cas: "", purity_pct: "", tenacity_h: "", i_have_it: "no" });
  });

  it("one row per dilution: two bottles of one material are two rows, with their diluents and what was weighed", () => {
    const [header] = rows(dilutionsCsv(catalog));
    expect(header).toEqual([...DILUTION_COLUMNS]);
    const list = byHeader(dilutionsCsv(catalog));
    expect(list.map((d) => [d.material, d.fraction_pct, d.diluents, d.material_weighed_g, d.archived])).toEqual([
      ['Cacao, "10 %", home', "5", "alcohol 96º", "", "no"],
      ["Linalool, Maese Lab", "50", "Ethanol 30; DPG 20", "", "yes"],
      ["Linalool, Maese Lab", "10.0325", "DPG 89.9675", "0.803", "no"],
    ]);
  });

  it("decimals without trailing zeros, up to six places", () => {
    expect([decimalOf(Ratio.of(1n, 3n)), decimalOf(Ratio.of(12n)), decimalOf(Ratio.fromDecimal("0.5")), decimalOf(null)]).toEqual(["0.333333", "12", "0.5", null]);
  });
});
