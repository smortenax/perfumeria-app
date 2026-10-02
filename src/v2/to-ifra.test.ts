import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { IfraMaterial } from "../core/ifra";
import { IFRA_FILES, v2Dataset } from "./data";
import { loadDataset } from "./load";
import { ceilingKey, flatten, toIfra, v2Key } from "./to-ifra";

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
  it("Geraniol 98 %: its own standard, whole", () => {
    const m = product("Geraniol 98%");
    expect(m.substances).toHaveLength(1);
    expect(fractionOf(m, "std:IFRA_STD_037")?.eq(Ratio.ONE)).toBe(true);
    expect(m.conditions).toEqual([]);
    expect(m.pending).toBeUndefined();
    expect(ifra.substances.get("std:IFRA_STD_037")?.limit.eq(pct("4.7"))).toBe(true);
  });

  it("Linalol: no ceiling, the peroxide specification as a condition", () => {
    const m = product("Linalol");
    expect(m.substances).toEqual([]);
    expect(m.conditions).toEqual(["especificación (STD 187)"]);
    expect(m.pending).toBeUndefined();
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
  "materiales.csv": "id,tipo,nombre,id_sustancia,especie,parte,proceso,quimiotipo,cas,inci,excepciones,motivo_excepcion,notas",
  "productos.csv": "id,id_material,nombre,fabricante,codigo,tienda,url,dilucion_pct,id_diluyente,notas",
  "composicion.csv": "id_contenedor,id_componente,min,tipico,max,tipo_valor,autoridad,id_documento,notas",
  "coberturas.csv": "id_contenedor,id_documento,cobertura,notas",
} as const;

function dataset(rows: { [K in keyof typeof HEAD]?: string[] }) {
  const text = (file: string) => (file in HEAD ? [HEAD[file as keyof typeof HEAD], ...(rows[file as keyof typeof HEAD] ?? [])].join("\n") : null);
  return loadDataset(text, { missingIsEmpty: true }).dataset;
}

const LAVENDER = "M00001,natural,Lavanda,,Lavandula angustifolia,flor,destilación,,,,,,";

describe("flatten", () => {
  it("a complete certificate of the product closes the list: the annex of its material is not read", () => {
    const d = dataset({
      "materiales.csv": [LAVENDER],
      "productos.csv": ["P00001,M00001,Lavanda X,,,,,,,"],
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
      "productos.csv": ["P00001,M00001,Lavanda X,,,,,,,"],
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
      "materiales.csv": [LAVENDER, "M00002,base,Base,,,,,,,,,,"],
      "composicion.csv": ["M00002,M00001,,10,,tipico,literatura,D00001,", "M00001,S00001,,0.48,,tipico,anexo-ifra,D00001,"],
      "coberturas.csv": ["M00002,D00001,reguladas-completa,", "M00001,D00001,reguladas-completa,"],
    });
    const load = flatten(d, "M00002").loads.get("S00001");
    // A proven 0,48 % inside a placeholder 10 %: the product is not proven, and at most 0,048 %.
    expect(load?.known).toBeNull();
    expect(load?.upper.eq(pct("0.048"))).toBe(true);
  });
});
