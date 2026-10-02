import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { IfraMaterial } from "../core/ifra";
import { IFRA_FILES, v2Dataset } from "./data";
import { loadDataset } from "./load";
import { ceilingKey, flatten, ifraCards, toIfra, v2Key } from "./to-ifra";

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100));
const data = v2Dataset();
const ifra = toIfra(data, IFRA_FILES);
const NO_DATA = "Sin datos de sus constituyentes: puede llevar sustancias con techo.";

/** The product of the seven called by its name, from datos/v2/productos.csv. */
function product(name: string): IfraMaterial {
  const p = data.products.find((x) => x.name === name);
  expect(p, name).toBeDefined();
  return ifra.materials.get(v2Key(p!.id)) as IfraMaterial;
}
const fractionOf = (m: IfraMaterial, key: string) => m.substances.find((s) => s.key === key)?.fraction;

describe("the seven materials of phase 2, through the adapter", () => {
  it("Geraniol 98 %: its own standard, whole; a natural isolate without documents, so its impurities are pending (D7)", () => {
    const m = product("Geraniol 98%");
    expect(m.substances).toHaveLength(1);
    expect(fractionOf(m, "std:IFRA_STD_037")?.eq(Ratio.ONE)).toBe(true);
    expect(m.conditions).toEqual([]);
    expect(m.pending).toEqual(["Impurezas sin declarar: es un aislado natural y su producto no tiene documentos."]);
    expect(ifra.substances.get("std:IFRA_STD_037")?.limit.eq(pct("4.7"))).toBe(true);
  });

  it("Linalol: no ceiling, the peroxide specification as a condition; pure by convention (D7)", () => {
    const m = product("Linalol");
    expect(m.substances).toEqual([]);
    expect(m.conditions).toEqual(["especificación (STD 187)"]);
    expect(m.pending).toBeUndefined();
    const p = data.products.find((x) => x.name === "Linalol")!;
    expect(flatten(data, p.id).pureByConvention).toBe(true);
    // A molecule with a certificate is documented, not pure by convention.
    expect(flatten(data, data.products.find((x) => x.name === "Aldehyde C11 MOA")!.id).pureByConvention).toBe(false);
  });

  it("Lavanda: the essential oil of the annex, and nothing of the absolute", () => {
    const m = product("Lavanda");
    expect(fractionOf(m, "std:IFRA_STD_037")?.eq(pct("0.48"))).toBe(true);
    expect(fractionOf(m, "std:IFRA_STD_069")?.eq(pct("1.04"))).toBe(true);
    expect(fractionOf(m, "std:IFRA_STD_039")?.eq(pct("0.01"))).toBe(true);
    expect(fractionOf(m, "std:IFRA_STD_023")).toBeUndefined();
    expect(m.pending).toBeUndefined();
  });

  it("Absoluto de Castoreum: no data, so pending, never free", () => {
    const m = product("Absoluto de Castoreum 20%");
    expect(m.status).toBe("checked");
    expect(m.substances).toEqual([]);
    expect(m.pending).toEqual([NO_DATA]);
  });

  it("Aldehyde C11 MOA: its certificate's impurity, and Symrise's ceiling as a substance of the product alone (D4)", () => {
    const p = data.products.find((x) => x.name === "Aldehyde C11 MOA")!;
    const m = product("Aldehyde C11 MOA");
    expect(fractionOf(m, "std:IFRA_STD_040")?.eq(pct("0.0046"))).toBe(true);
    expect(fractionOf(m, ceilingKey(p.id))?.eq(Ratio.ONE)).toBe(true);
    const cap = ifra.substances.get(ceilingKey(p.id));
    expect(cap?.limit.eq(pct("2.5"))).toBe(true);
    expect(cap?.supplier).toBe("Symrise");
    // The material of the same CAS, without Symrise's product, does not carry it.
    expect(fractionOf(ifra.materials.get(v2Key(p.materialId))!, ceilingKey(p.id))).toBeUndefined();
    expect(m.pending).toBeUndefined();
  });

  it("Oakmoss Absolute (IFF): limited as itself by STD 067, its certificate complete; the atranols have no standard", () => {
    const p = data.products.find((x) => x.name === "Oakmoss Absolute 50% (IPM)")!;
    const m = product("Oakmoss Absolute 50% (IPM)");
    expect(m.substances).toEqual([{ key: "std:IFRA_STD_067", fraction: Ratio.ONE }]);
    expect(m.conditions).toEqual(["especificación (STD 067)"]);
    expect(m.pending).toBeUndefined();
    // The material alone has no certificate: limited as itself, and its constituents unknown.
    expect(ifra.materials.get(v2Key(p.materialId))?.pending).toEqual([NO_DATA]);
  });

  it("Castoreum Synthetic: a base with no CAS, its section 2.2 as its composition", () => {
    const m = product("Castoreum Synthetic");
    expect(m.substances).toHaveLength(20);
    expect(fractionOf(m, "std:IFRA_STD_197")?.eq(pct("0.1635"))).toBe(true);
    expect(fractionOf(m, "std:IFRA_STD_098")?.eq(pct("0.0004"))).toBe(true);
    expect(m.pending).toBeUndefined();
    // «No Restriction» in category 4 is not a ceiling.
    const p = data.products.find((x) => x.name === "Castoreum Synthetic")!;
    expect(ifra.substances.has(ceilingKey(p.id))).toBe(false);
  });

  it("the diluents take the IFRA of their CAS: benzyl benzoate has a standard, DPG none", () => {
    expect(ifra.materials.get("solv:dpg")).toEqual({ status: "checked", substances: [], conditions: [] });
    expect(ifra.materials.get("solv:bb")?.substances.map((s) => s.key)).toEqual(["std:IFRA_STD_009"]);
  });
});

// Small datasets for what the seven do not exercise: authority, coverage and placeholders.
const HEAD = {
  "registro-ids.csv": "id,entidad,clave,alta,estado,notas",
  "materiales.csv": "id,tipo,nombre,id_sustancia,especie,parte,proceso,quimiotipo,cas,inci,origen,excepciones,motivo_excepcion,notas",
  "productos.csv": "id,id_material,nombre,fabricante,codigo,tienda,url,notas",
  "composicion.csv": "id_contenedor,id_componente,min,tipico,max,tipo_valor,autoridad,id_documento,notas",
  "coberturas.csv": "id_contenedor,id_documento,cobertura,notas",
  "grupos.csv": "id,tipo,referencia,nombre,notas",
  "grupo-miembros.csv": "id_grupo,id_miembro,subgrupo,notas",
  "impurezas-conocidas.csv": "id_sustancia,id_documento,notas",
} as const;

function dataset(rows: { [K in keyof typeof HEAD]?: string[] }) {
  const text = (file: string) => (file in HEAD ? [HEAD[file as keyof typeof HEAD], ...(rows[file as keyof typeof HEAD] ?? [])].join("\n") : null);
  return loadDataset(text, { missingIsEmpty: true }).dataset;
}

const LAVENDER = "M00001,natural,Lavanda,,Lavandula angustifolia,flor,destilación,,,,,,,";

describe("flatten", () => {
  it("a complete certificate of the product closes the list: the annex of its material is not read", () => {
    const d = dataset({
      "materiales.csv": [LAVENDER],
      "productos.csv": ["P00001,M00001,Lavanda X,,,,,"],
      "composicion.csv": ["P00001,S00001,,0.2,,tipico,producto,D00002,", "M00001,S00001,,0.48,,tipico,anexo-ifra,D00001,", "M00001,S00002,,1.04,,tipico,anexo-ifra,D00001,"],
      "coberturas.csv": ["P00001,D00002,reguladas-completa,", "M00001,D00001,reguladas-completa,"],
    });
    const f = flatten(d, "P00001");
    expect([...f.loads.keys()]).toEqual(["S00001"]);
    expect(f.loads.get("S00001")?.known?.eq(pct("0.2"))).toBe(true);
    expect(f.pending).toEqual([]);
  });

  it("a partial certificate wins where it speaks, and the annex fills the rest", () => {
    const d = dataset({
      "materiales.csv": [LAVENDER],
      "productos.csv": ["P00001,M00001,Lavanda X,,,,,"],
      "composicion.csv": ["P00001,S00001,,0.2,,tipico,producto,D00002,", "M00001,S00001,,0.48,,tipico,anexo-ifra,D00001,", "M00001,S00002,,1.04,,tipico,anexo-ifra,D00001,"],
      "coberturas.csv": ["P00001,D00002,solo-alergenos,", "M00001,D00001,reguladas-completa,"],
    });
    const f = flatten(d, "P00001");
    expect(f.loads.get("S00001")?.known?.eq(pct("0.2"))).toBe(true);
    expect(f.loads.get("S00002")?.known?.eq(pct("1.04"))).toBe(true);
    expect(f.pending).toEqual([]);
  });

  it("a list that nothing closes leaves the material pending", () => {
    const d = dataset({
      "materiales.csv": [LAVENDER],
      "composicion.csv": ["M00001,S00001,,0.48,,tipico,anexo-ifra,D00001,"],
      "coberturas.csv": ["M00001,D00001,parcial,"],
    });
    expect(flatten(d, "M00001").pending).toEqual(["Su composición es parcial: puede llevar otras sustancias con techo."]);
  });

  it("a placeholder is never known: its maximum is the most it can be (D2)", () => {
    const d = dataset({
      "materiales.csv": [LAVENDER],
      "composicion.csv": ["M00001,S00001,,0.3,0.9,tipico,literatura,D00001,", "M00001,S00002,,0.5,,tipico,consenso,D00001,"],
      "coberturas.csv": ["M00001,D00001,reguladas-completa,"],
    });
    const f = flatten(d, "M00001");
    expect(f.loads.get("S00001")?.known).toBeNull();
    expect(f.loads.get("S00001")?.upper.eq(pct("0.9"))).toBe(true);
    // Without a maximum, its figure is the bound, still not known.
    expect(f.loads.get("S00002")?.known).toBeNull();
    expect(f.loads.get("S00002")?.upper.eq(pct("0.5"))).toBe(true);
  });

  it("a material inside another is flattened, its loads scaled", () => {
    const d = dataset({
      "materiales.csv": [LAVENDER, "M00002,base,Base,,,,,,,,,,,"],
      "composicion.csv": ["M00002,M00001,,10,,tipico,literatura,D00001,", "M00001,S00001,,0.48,,tipico,anexo-ifra,D00001,"],
      "coberturas.csv": ["M00002,D00001,reguladas-completa,", "M00001,D00001,reguladas-completa,"],
    });
    const load = flatten(d, "M00002").loads.get("S00001");
    // A proven 0,48 % inside a placeholder 10 %: the product is not proven, and at most 0,048 %.
    expect(load?.known).toBeNull();
    expect(load?.upper.eq(pct("0.048"))).toBe(true);
  });
});

describe("toIfra with a placeholder (D2)", () => {
  it("passes its maximum to the engine as the bound of an unknown load", () => {
    const d = dataset({
      "materiales.csv": [LAVENDER],
      "composicion.csv": ["M00001,S00001,,0.3,0.9,tipico,literatura,D00001,"],
      "coberturas.csv": ["M00001,D00001,reguladas-completa,"],
      "grupos.csv": ["G00001,estandar-ifra,IFRA_STD_023,Coumarin,"],
      "grupo-miembros.csv": ["G00001,S00001,,"],
    });
    const m = toIfra(d, IFRA_FILES).materials.get(v2Key("M00001"));
    expect(m?.substances).toHaveLength(1);
    expect(m?.substances[0].key).toBe("std:IFRA_STD_023");
    expect(m?.substances[0].fraction).toBeNull();
    expect(m?.substances[0].upper?.eq(pct("0.9"))).toBe(true);
  });
});

describe("D7: a molecule without documents", () => {
  const MOLECULE = (origin: string) => `M00001,sustancia,Geraniol,S00001,,,,,106-24-1,,${origin},,,`;

  it("synthetic or of unknown origin, it is its substance pure by convention, and leaves nothing pending", () => {
    for (const origin of ["sintetico", "desconocido"]) {
      const f = flatten(dataset({ "materiales.csv": [MOLECULE(origin)] }), "M00001");
      expect(f.pureByConvention, origin).toBe(true);
      expect(f.pending, origin).toEqual([]);
      expect(f.loads.get("S00001")?.known?.eq(Ratio.ONE), origin).toBe(true);
    }
  });

  it("a natural isolate leaves its impurities pending", () => {
    const f = flatten(dataset({ "materiales.csv": [MOLECULE("aislado-natural")] }), "M00001");
    expect(f.pureByConvention).toBe(false);
    expect(f.pending).toEqual(["Impurezas sin declarar: es un aislado natural y su producto no tiene documentos."]);
  });

  it("one on the list of known regulated impurities leaves them pending, whatever its origin", () => {
    const f = flatten(dataset({ "materiales.csv": [MOLECULE("sintetico")], "impurezas-conocidas.csv": ["S00001,D00001,"] }), "M00001");
    expect(f.pureByConvention).toBe(false);
    expect(f.pending).toEqual(["Impurezas sin declarar: se le conocen impurezas reguladas y su producto no tiene documentos."]);
  });
});

describe("the standards that go by family (STD 188, allyl esters)", () => {
  const aag = data.products.find((x) => x.name === "Allyl Amyl Glycolate")!;

  it("the Allyl Amyl Glycolate is a member of the group as a material, though the index does not list its CAS", () => {
    const group = data.groups.find((g) => g.reference === "IFRA_STD_188")!;
    const members = data.groupMembers.filter((gm) => gm.groupId === group.id).map((gm) => gm.memberId);
    // The only allyl ester of the v2 (the other 39 materials were reviewed by name): nothing else is in the group.
    expect(members).toEqual([aag.materialId]);
    expect(IFRA_FILES.estandarCas.includes("IFRA_STD_188,")).toBe(false);
  });

  it("its IFRA data carries the specification, and no percentage", () => {
    const m = ifra.materials.get(v2Key(aag.id))!;
    expect(m.substances).toEqual([]);
    expect(m.conditions).toEqual(["especificación (STD 188)"]);
    expect(m.pending).toBeUndefined();
  });

  it("its card says «condición» and shows IFRA's specification: free allyl alcohol under 0,1 %", () => {
    const card = ifraCards(data, IFRA_FILES).get(v2Key(aag.id))!;
    expect(card.state).toBe("condicion");
    expect(card.standardName).toBe("Allyl esters");
    expect(card.note).toContain("STD 188");
    expect(card.note).toContain("free Allylalcohol");
  });
});

describe("Sandalmysore Core, a base with unknown coverage (the user's notebook)", () => {
  it("is a base, with a «desconocida» coverage, and leaves its constituents pending", () => {
    const m = data.materials.find((x) => x.name.startsWith("2-Methyl-4-(2,2,3-trimethyl-3-cyclopenten-1-yl)-2-buten-1-ol"))!;
    expect(m.type).toBe("base");
    expect(m.origin).toBe("");
    expect(data.coverages.find((c) => c.containerId === m.id)?.coverage).toBe("desconocida");
    const product = data.products.find((p) => p.materialId === m.id)!;
    expect(ifra.materials.get(v2Key(product.id))?.pending).toEqual([NO_DATA]);
  });
});

describe("a standard of a family whose limit is expressed as a constituent (STD 089, citrus oils)", () => {
  it("a citrus oil in the group leaves the 5-MOP pending, and is not counted whole against the limit", () => {
    const d = dataset({
      "materiales.csv": ["M00001,natural,Lemon oil,,Citrus limon,cáscara,expresión,,,,,,,"],
      "coberturas.csv": ["M00001,,desconocida,"],
      "grupos.csv": ["G00001,estandar-ifra,IFRA_STD_089,Citrus oils,"],
      "grupo-miembros.csv": ["G00001,M00001,,"],
    });
    const m = toIfra(d, IFRA_FILES).materials.get(v2Key("M00001"))!;
    expect(m.substances).toEqual([]);
    expect([...(m.pending ?? [])].sort()).toEqual([
      "Citrus oils and other furocoumarins containing essential oils: el límite es de 5-MOP en el producto y no se sabe cuánto lleva este material (STD 089).",
      "Sin datos de sus constituyentes: puede llevar sustancias con techo.",
    ].sort());
  });
});
