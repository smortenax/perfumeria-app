import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { type Catalog, type CatalogMaterial, type Dilution, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import { bareName, matchDilutionPlan, readDilutionPlan, weighRowsOf, withChoice } from "./plan-import";
import { bottleCheck, describeRow, groupsOf, rowState, type WeighRow } from "./weigh";

/** «Import planned dilutions» (the user's inbox, 2026-11-25), with names of the Perfumiarz order of 19-nov. */

const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, lot: null, purchasedOn: null, originRegion: null, status: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, strengthSource: null, impact: null, impactSource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
const m = (id: string, name: string, extra: Partial<CatalogMaterial> = {}): CatalogMaterial => ({
  ...FIELDS, id, ownerId: "me", name, kind: "molecule", components: [], regulations: [], doses: [], descriptors: [], relations: [], references: [], ...extra,
});
const bottle = (id: string, pct: string, diluentId: string): Dilution => {
  const fraction = Ratio.fromDecimal(pct).div(Ratio.of(100n));
  return {
    id, fraction, solvent: null, madeOn: "2026-11-23", description: null, label: `de fábrica, al ${pct} %`, materialMassUg: null, sourceDilutionId: null, archivedAt: null,
    diluents: [{ id: `${id}-d`, diluentId, massUg: null, fraction: Ratio.ONE.sub(fraction) }],
  };
};
const materials = [
  m("wool", "Wool Absolute"),
  m("olibanum", "Olibanum Oil (Oman)", { product: "Olibanum Oil (Oman) - Boswellia sacra" }),
  m("cocoa", "Cocoa Thiazole 10% (IPM)"),
  m("matcha", "Matcha Ketone 5% (TEC)"),
  m("twin-a", "Ylang Ylang Extra"),
  m("twin-b", "Ylang Ylang Extra"),
  m("hers", "Castoreum", { ownerId: "someone else" }),
  m("ambroxan", "Ambroxan® (powder)"),
  m("hydroxy", "Hydroxyambran 50% (IPM)"),
  m("thujopsene", "Thujopsene natural"),
  m("dpg", "DPG (dipropylene glycol)", { ownerId: null, solvent: true, abbreviation: "Dipr", aliases: ["Dipropylene glycol"] }),
  m("ipm", "IPM (isopropyl myristate)", { ownerId: null, solvent: true, abbreviation: "IsM" }),
  m("eth", "Ethanol", { ownerId: null, solvent: true, aliases: ["Alcohol", "Perfumer's alcohol"] }),
];
const catalog = {
  materials: new Map(materials.map((x) => [x.id, x])),
  have: new Set<string>(),
  categories: new Map(),
  dilutions: new Map([
    ["cocoa", [bottle("cocoa-10", "10", "ipm")]],
    ["hydroxy", [bottle("hydroxy-50", "50", "ipm")]],
  ]),
} as unknown as Catalog;

const HEADER = "material,fraction_pct,from_pct,bottle_ml,batch_g,material_g,diluent,diluent_g,typical_use_pct,typical_use_source,ifra_cat4,note";
const FILE = [
  HEADER,
  "Wool Absolute,10,100,30,20,2.000,DPG,18.000,0.5,TGSC,,",
  'Olibanum Oil (Oman) - Boswellia sacra,20,100,15,10,2.000,Ethanol,8.000,,,,"fresh, citrus"',
  "Cocoa Thiazole 10% (IPM),1,10,15,10,1.000,IPM,9.000,,,,",
  "Matcha Ketone 5% (TEC),1,5,15,10,2.000,TEC,8.000,,,,",
  "Ylang Ylang Extra,10,100,15,10,1,DPG,9,,,,",
  "Castoreum,10,100,15,10,1,DPG,9,,,,",
].join("\n");

const read = readDilutionPlan(FILE);
if (!read.ok) throw new Error("the fixture does not read");
const matches = matchDilutionPlan(read.rows, catalog, "me");
const of = (name: string) => matches.find((x) => x.planned.material === name)!;
let n = 0;
const key = () => `k${n++}`;

describe("reading the planned table", () => {
  it("reads every row with its line, and the quoted note", () => {
    expect(read.rows).toHaveLength(6);
    expect(read.rows[1]).toMatchObject({ line: 3, material: "Olibanum Oil (Oman) - Boswellia sacra", fractionPct: "20", bottleMl: "15", batchG: "10", note: "fresh, citrus" });
  });

  it("refuses a table without its columns, and says which", () => {
    expect(readDilutionPlan("name,pct\nWool,10")).toEqual({ ok: false, missing: ["material", "fraction_pct", "diluent"] });
  });

  it("reads it pasted from a sheet, with tabs and decimal commas", () => {
    const tabbed = readDilutionPlan(`${HEADER.replace(/,/g, "\t")}\nWool Absolute\t2,5\t100\t30\t20\t\tDPG\t\t\t\t\t`);
    expect(tabbed.ok && tabbed.rows[0]).toMatchObject({ material: "Wool Absolute", fractionPct: "2.5", diluent: "DPG" });
  });
});

describe("each row against your materials", () => {
  it("finds the material by its name or its shop product name, and the diluent by its short name or another name", () => {
    expect([of("Wool Absolute").materialId, of("Wool Absolute").diluentId, of("Wool Absolute").problems]).toEqual(["wool", "dpg", []]);
    expect([of("Olibanum Oil (Oman) - Boswellia sacra").materialId, of("Olibanum Oil (Oman) - Boswellia sacra").diluentId]).toEqual(["olibanum", "eth"]);
  });

  it("from_pct under 100: weighed from your factory bottle at that exact %", () => {
    expect([of("Cocoa Thiazole 10% (IPM)").sourceId, of("Cocoa Thiazole 10% (IPM)").problems]).toEqual(["cocoa-10", []]);
  });

  it("says what is missing and guesses nothing: no bottle at 5 %, no diluent TEC, two materials with one name, not yours", () => {
    expect(of("Matcha Ketone 5% (TEC)").problems).toEqual(["diluent", "source"]);
    expect(of("Ylang Ylang Extra")).toMatchObject({ materialId: null, candidates: ["twin-a", "twin-b"], problems: ["materialTwice"] });
    expect(of("Castoreum").problems).toEqual(["material"]);
  });

  it("a material or diluent picked by hand clears its problem", () => {
    expect(withChoice(catalog, of("Ylang Ylang Extra"), { materialId: "twin-b" })).toMatchObject({ materialId: "twin-b", problems: [] });
    expect(withChoice(catalog, of("Matcha Ketone 5% (TEC)"), { diluentId: "eth" }).problems).toEqual(["source"]);
  });
});

describe("the lab's names, with maker or strength (the real table of 2026-11-25)", () => {
  const plan = readDilutionPlan([HEADER, "Ambroxan (Kao),5,100,20,15,0.750,ethanol,14.250,,,,", "Hydroxyambran (Ventos),10,50,20,15,3.000,ethanol,12.000,,,,", "Thujopsene,5,100,10,8,0.400,ethanol,7.600,,,,"].join("\n"));
  const found = plan.ok ? matchDilutionPlan(plan.rows, catalog, "me") : [];

  it("a name without maker or strength", () => {
    expect(["Wool Absolute (Biolandes)", "Hydroxyambran 50% (IPM)", "Meta Cresol 10 % (DPG)", "Ambroxan® (powder)"].map(bareName)).toEqual([
      bareName("Wool Absolute"),
      bareName("Hydroxyambran"),
      bareName("Meta Cresol"),
      bareName("Ambroxan"),
    ]);
  });

  it("finds them by a similar name, says so, and takes the factory bottle at from_pct", () => {
    expect(found.map((x) => [x.materialId, x.by, x.sourceId, x.problems])).toEqual([
      ["ambroxan", "similar", null, []],
      ["hydroxy", "similar", "hydroxy-50", []],
      ["thujopsene", "similar", null, []],
    ]);
    expect(of("Wool Absolute").by).toBe("name");
  });
});

describe("the rows to weigh", () => {
  const rows = weighRowsOf(matches.filter((x) => x.problems.length === 0), key);

  it("only the rows ready, by bottle size (15 ml before 30 ml), as in the file inside each size", () => {
    expect(rows.map((r) => [r.materialId, r.bottleMl])).toEqual([
      ["olibanum", "15"],
      ["cocoa", "15"],
      ["wool", "30"],
    ]);
    expect(groupsOf(rows).map((g) => [g.ml, g.keys.length])).toEqual([
      ["15", 2],
      ["30", 1],
    ]);
  });

  it("the % and the grams wanted are written, and the scale's grey figures match the plan's", () => {
    const wool = rows.find((r) => r.materialId === "wool")!;
    expect([wool.target, wool.total, wool.tare, wool.gross]).toEqual(["10", "20", "", ""]);
    const s = rowState(wool);
    expect([s.status, s.goal.materialUg, s.goal.diluents[0]]).toEqual(["waiting", 2_000_000n, 18_000_000n]);
    // A planned bottle is still to make: unweighed, it waits; it never saves «as it is».
    expect(s.need).toBe("weights");
  });

  it("from the factory bottle at 10 %, 1 % of 10 g asks 1 g of the bottle and 9 g of IPM", () => {
    const cocoa = rows.find((r) => r.materialId === "cocoa")!;
    const b = catalog.dilutions.get("cocoa")![0];
    const s = rowState(cocoa, { fraction: b.fraction, diluents: b.diluents.map((d) => ({ diluentId: d.diluentId, fraction: d.fraction })) });
    expect([cocoa.sourceId, s.goal.materialUg, s.goal.diluents[0]]).toEqual(["cocoa-10", 1_000_000n, 9_000_000n]);
  });
});

describe("the bottle's own weights", () => {
  const row = (over: Partial<WeighRow>): WeighRow => ({ key: "r", materialId: "wool", sourceId: null, target: "10", total: "20", weighed: "2.004", diluents: [{ diluentId: "dpg", share: "", weighed: "18.010" }], note: "", ...over });

  it("full minus tare minus what went in: 0 when it adds up, the grams off when not", () => {
    expect(bottleCheck(row({ tare: "12.000", gross: "32.014" })).offUg).toBe(0n);
    expect(bottleCheck(row({ tare: "12.000", gross: "32.000" })).offUg).toBe(-14_000n);
    expect(bottleCheck(row({ tare: "12.000", gross: "" })).offUg).toBeNull();
  });

  it("are kept in the bottle's note, with the day, to reweigh it later", () => {
    expect(describeRow(row({ bottleMl: "30", tare: "12.000", gross: "32.014", note: "batch 1" }), "2026-11-25")).toBe("batch 1\nBottle 30 ml · tare 12.000 g · full 32.014 g on 2026-11-25");
    expect(describeRow(row({}), "2026-11-25")).toBe("");
  });
});

describe("a table with what is already weighed (the user, 2026-11-25: «agregar automaticamente lo que ya se ha pesado o hacerlo mixto»)", () => {
  const H = `${HEADER},material_weighed_g,diluent_weighed_g,tare_g,full_g`;
  const plan = readDilutionPlan(
    [
      H,
      "Wool Absolute,10,100,20,15,1.500,DPG,13.500,,,,,1.503,13.512,11.200,26.215", // weighed
      "Olibanum Oil (Oman) - Boswellia sacra,10,100,20,15,1.500,Ethanol,13.500,,,,,1.498,,,", // half: the diluent is still to pour
      "Cocoa Thiazole 10% (IPM),1,10,20,15,1.500,IPM,13.500,,,,,,,,", // nothing yet
    ].join("\n"),
  );
  const rows = plan.ok ? weighRowsOf(matchDilutionPlan(plan.rows, catalog, "me"), key) : [];
  const state = (id: string) => rowState(rows.find((r) => r.materialId === id)!);

  it("a row weighed in the sheet comes in weighed, with its real %, its tare and full weight", () => {
    const s = state("wool");
    expect(s.status).toBe("weighed");
    expect(s.real!.totalUg).toBe(15_015_000n);
    expect(bottleCheck(rows.find((r) => r.materialId === "wool")!)).toEqual({ tareUg: 11_200_000n, grossUg: 26_215_000n, offUg: 0n });
  });

  it("mixed: a half-weighed row asks for what is left, from the real material; an empty one waits", () => {
    const s = state("olibanum");
    expect([s.status, s.goal.diluents[0]]).toEqual(["waiting", 13_482_000n]);
    expect(state("cocoa").status).toBe("waiting");
  });
});

describe("the lab's sheet pasted from Excel (2026-11-25)", () => {
  const pasted = [
    "Diluciones de la tanda · pedido de Perfumiarz del 19-nov",
    "Cómo se usa:",
    "Material\tFrasco\tDiluyente\t% del material de partida\t% objetivo\tTotal objetivo (g)\tMaterial a pesar (g)\tMaterial real (g)\tDiluyente a añadir (g)\tDiluyente real (g)\tTotal real (g)\t% exacto\tDiferencia con el objetivo\tNotas",
    "Wool Absolute (Biolandes)\t20 ml\tAlcohol 96º\t100,0%\t10,0%\t15,000\t1,500\t\t\t\t\t\t\tpasta: alcohol en frío, agitando",
    "Hydroxyambran (Ventos)\t20 ml\tAlcohol 96º\t50,0%\t10,0%\t15,000\t3,000\t\t\t\t\t\t\t",
    "\t\t\t\t\t\t\t\t\t\t\t\t\t",
    "Alcohol 96º\t\t\t\t\t\t\t\t\t\t\t\t\t",
  ].join("\n");
  const plan = readDilutionPlan(pasted);
  const found = plan.ok ? matchDilutionPlan(plan.rows, catalog, "me") : [];

  it("finds the Spanish header below the title, reads «20 ml» and «10,0%», and stops at the blank row", () => {
    expect(plan.ok && plan.rows.map((r) => [r.line, r.material, r.bottleMl, r.fromPct, r.fractionPct, r.batchG, r.materialG, r.note])).toEqual([
      [4, "Wool Absolute (Biolandes)", "20", "100.0", "10.0", "15.000", "1.500", "pasta: alcohol en frío, agitando"],
      [5, "Hydroxyambran (Ventos)", "20", "50.0", "10.0", "15.000", "3.000", ""],
    ]);
  });

  it("«Alcohol 96º» is the ethanol", () => {
    expect(found.map((x) => [x.materialId, x.diluentId, x.sourceId, x.problems])).toEqual([
      ["wool", "eth", null, []],
      ["hydroxy", "eth", "hydroxy-50", []],
    ]);
  });
});

describe("the factory diluent (the user, 2026-11-25: «que se tenga en cuenta el diluyente en el que viene»)", () => {
  const H = "material,fraction_pct,from_pct,from_diluent,bottle_ml,diluent";
  const plan = readDilutionPlan([H, "Hydroxyambran (Ventos),10,50,IPM,20,ethanol", "Hydroxyambran (Ventos),10,50,DPG,20,ethanol", "Hydroxyambran (Ventos),10,50,Unobtainium,20,ethanol", "Cocoa Thiazole 10% (IPM),1,100,,10,ethanol", "Wool Absolute,1,,,10,ethanol"].join("\n"));
  const found = plan.ok ? matchDilutionPlan(plan.rows, catalog, "me") : [];

  it("picks your factory bottle in the diluent the sheet names, and says when yours is in another", () => {
    expect(found.slice(0, 3).map((x) => [x.sourceId, x.fromDiluentId, x.problems])).toEqual([
      ["hydroxy-50", "ipm", []],
      [null, "dpg", ["sourceDiluent"]],
      ["hydroxy-50", null, ["fromDiluent"]],
    ]);
  });

  it("a row said pure of a material that came made points at its factory bottle, without stopping it", () => {
    expect([found[3].factoryHint, found[3].problems]).toEqual(["cocoa-10", []]);
    expect(found[4].factoryHint).toBeNull();
  });

  it("the Spanish header «Diluyente de fábrica»", () => {
    const es = readDilutionPlan("Material\tDiluyente\t% objetivo\t% del material de partida\tDiluyente de fábrica\nHydroxyambran (Ventos)\tAlcohol 96º\t10,0%\t50,0%\tIPM");
    expect(es.ok && es.rows[0]).toMatchObject({ fromPct: "50.0", fromDiluent: "IPM" });
  });
});
