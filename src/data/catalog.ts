import { Ratio } from "../core/arith/ratio";
import type { IfraData, IfraMaterial, IfraSubstance } from "../core/ifra";
import { DILUENTS, type Material } from "../core/model/material";
import { parseCsvRecords } from "./csv";

/**
 * The catalog of the bench, read from the glossary that
 * scripts/generar_glosario.py writes into datos/glosario/ (P37): every CAS
 * IFRA knows of, and the rows of the FIG with the user's codes. IFRA comes
 * from IFRA's own files (datos/ifra/), counted in category 4 (§5.1). None of
 * the user's materials is in it (P36, P37). The family of each material and its
 * colour are the lab's own categorisation (P48), through the glossary. DPG and
 * alcohol are the diluents.
 */
export type CatalogGroup = "own" | "diluent" | "base";

/** What IFRA says of a material, as the glossary puts it (datos/glosario/LEEME.md). */
export type IfraState = "prohibido" | "con-techo" | "condicion" | "por-constituyentes" | "sin-dato" | "sin-estandar";

/**
 * A family of scent with its colour (P48): eight and a grey, «Transformado», for the
 * smells of heat, fermentation or cutting. The lab's own categorisation (pieza 11).
 */
export interface ScentFamily {
  readonly name: string;
  /** What fits in a small place: «Transf» for «Transformado». */
  readonly short: string;
  /** For a light background; the dark one waits for its test on screen. */
  readonly colour: string;
  readonly order: number;
  /** What goes into it, in words. */
  readonly covers: string;
}

/** A material's family, the second one it leans to, and how sure it is (P48). */
export interface MaterialFamily {
  readonly family: ScentFamily;
  readonly hue?: ScentFamily;
  readonly confidence: string;
}

export interface CatalogEntry {
  /** Named by its trade name when it has one (P38): that is what the user knows it by. */
  readonly material: Material;
  readonly group: CatalogGroup;
  /** The material's short code, the user's or a provisional one. */
  readonly code: string;
  /**
   * What its icon says: the trade abbreviation when there is one, the code otherwise
   * (P39). When an abbreviation names several CAS, a mark goes before it: ⁶IBQ, ²IBQ.
   */
  readonly icon: string;
  readonly iconMark?: string;
  /** The letter of its kind of natural in the icon, drawn as a glyph of its own (P40): A, O, E… */
  readonly iconType?: string;
  /** The chemical name, which always stays beside the trade name (P38). */
  readonly chemicalName: string;
  readonly tradeName?: string;
  /** The trade abbreviation: IBQ, HCA. */
  readonly tradeCode?: string;
  readonly cas: string;
  readonly state?: IfraState;
  /** The name of its IFRA standard, when it has one. */
  readonly standardName?: string;
  /** Only the rows of the FIG have one yet; the rest is a gap, never the grey family (§1.2). */
  readonly family?: MaterialFamily;
  /** Code, names, synonyms and CAS, lower case and without accents, for the search. */
  readonly search: string;
  /** The names folded for a tolerant search: «isobutilquinoleina» finds «Isobutyl quinoline». */
  readonly folded: readonly string[];
}

export interface Catalog {
  readonly entries: readonly CatalogEntry[];
  readonly ifra: IfraData;
  readonly families: readonly ScentFamily[];
  readonly counts: { readonly fig: number; readonly ifraOnly: number; readonly withFamily: number };
  readonly source: { readonly amendment: string; readonly generated: string };
}

export interface CatalogFiles {
  readonly materiales: string;
  readonly constituyentes: string;
  readonly estandares: string;
  /** The families and their colours (datos/fuente/pieza-11-paleta.csv). */
  readonly paleta: string;
  readonly procedencia: { readonly enmienda_ifra: string; readonly generado: string };
}

export const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100));
const isNumber = (text: string) => /^\d+(\.\d+)?$/.test(text);
const short = (key: string) => `STD ${key.split("_").pop()}`;

/** Conditions of the glossary that are not an obligation but a gap: they go to pending (§1.2). */
const NO_CONSTITUENT_DATA = "constituyentes: sin dato en el anexo";
const CONSTITUENT_OUT_OF_INDEX = "un constituyente del anexo no está en el índice";

/**
 * A name folded for a tolerant search: no accents, spaces or signs, and the
 * spellings that differ between English and Spanish made the same (y/i, ph/f,
 * th/t, k/c, ou/u), so that «isobutilquinoleina» and «Isobutyl quinoline» meet.
 */
export function fold(text: string): string {
  return normalize(text)
    .replace(/[^a-z0-9]/g, "")
    .replace(/ph/g, "f")
    .replace(/th/g, "t")
    .replace(/y/g, "i")
    .replace(/k/g, "c")
    .replace(/ou/g, "u")
    .replace(/(.)\1+/g, "$1");
}

/** Edits between the query and the closest stretch of the text (approximate substring match). */
function nearest(query: string, text: string): number {
  let previous = new Array<number>(text.length + 1).fill(0);
  for (let i = 1; i <= query.length; i++) {
    const current = [i];
    for (let j = 1; j <= text.length; j++) {
      const change = previous[j - 1] + (query[i - 1] === text[j - 1] ? 0 : 1);
      current.push(Math.min(previous[j] + 1, current[j - 1] + 1, change));
    }
    previous = current;
  }
  return Math.min(...previous);
}

/**
 * The diluents of the app: a code unique in the glossary, the icon (the sigla the
 * trade knows them by), CAS, and the names they are searched by.
 */
const DILUENT_DATA: ReadonlyArray<readonly [keyof typeof DILUENTS, string, string, string, string[]]> = [
  ["dpg", "DPG", "DPG", "25265-71-8", ["Dipropilenglicol", "Dipropylene glycol"]],
  ["alcohol", "EtOH", "EtOH", "64-17-5", ["Etanol", "Ethanol"]],
  ["ipm", "IPM", "IPM", "110-27-0", ["Miristato de isopropilo", "Isopropyl myristate"]],
  ["dep", "DEPd", "DEP", "84-66-2", ["Ftalato de dietilo", "Diethyl phthalate"]],
  ["tec", "TEC", "TEC", "77-93-0", ["Citrato de trietilo", "Triethyl citrate"]],
  ["triacetina", "TRI", "TRI", "102-76-1", ["Triacetina", "Triacetin"]],
  ["bb", "BBd", "BB", "120-51-4", ["Benzoato de bencilo", "Benzyl benzoate"]],
];

function diluent(material: Material, code: string, icon: string, cas: string, names: string[]): CatalogEntry {
  return {
    material,
    group: "diluent",
    code,
    icon,
    chemicalName: names[1],
    cas,
    search: normalize(`${code} ${material.name} ${names.join(" ")} ${cas}`),
    folded: [material.name, ...names].map(fold),
  };
}

export function buildCatalog(files: CatalogFiles): Catalog {
  const amendment = files.procedencia.enmienda_ifra;
  const standards = new Map(parseCsvRecords(files.estandares).map((s) => [s.estandar, s]));
  const substances = new Map<string, IfraSubstance>();

  // Category 4 of every standard: a ceiling, a prohibition in the category, or the
  // ceiling of its note for what comes from naturals. «No Restriction» adds nothing.
  for (const [key, s] of standards) {
    const cell = s.cat_4;
    const limit = isNumber(cell) ? pct(cell) : cell === "prohibido" ? Ratio.ZERO : cell === "ver-nota" ? pct(s.limite_nota) : null;
    if (limit) {
      substances.set(`std:${key}`, { key: `std:${key}`, name: s.nombre, limit, amendment });
    }
  }
  const prohibited = (key: string): string => {
    const id = `prohibido:${key}`;
    if (!substances.has(id)) {
      substances.set(id, { key: id, name: `${standards.get(key)?.nombre ?? key}, como tal`, limit: Ratio.ZERO, amendment });
    }
    return id;
  };

  // What each material carries inside, per standard: the sum within one variant of
  // the annex, and the worst variant when the material could be several.
  const inside = new Map<string, Map<string, Map<string, Ratio>>>();
  const outside = new Map<string, string[]>();
  for (const row of parseCsvRecords(files.constituyentes)) {
    if (row.estandar === "") {
      outside.set(row.material, [...(outside.get(row.material) ?? []), row.constituyente]);
      continue;
    }
    const byStandard = inside.get(row.material) ?? new Map<string, Map<string, Ratio>>();
    const byVariant = byStandard.get(row.estandar) ?? new Map<string, Ratio>();
    byVariant.set(row.variante, (byVariant.get(row.variante) ?? Ratio.ZERO).add(pct(row.concentracion_pct)));
    byStandard.set(row.estandar, byVariant);
    inside.set(row.material, byStandard);
  }

  const families = parseCsvRecords(files.paleta)
    .map((f) => ({
      name: f.familia,
      short: SHORT_NAMES[f.familia] ?? f.familia,
      colour: f.claro,
      order: Number(f.orden),
      covers: f.que_entra,
    }))
    .sort((a, b) => a.order - b.order);
  const familyNamed = new Map(families.map((f) => [f.name, f]));

  const rows = parseCsvRecords(files.materiales);
  const materials = new Map<string, IfraMaterial>();
  const entries: CatalogEntry[] = DILUENT_DATA.map(([id, code, icon, cas, names]) => diluent(DILUENTS[id], code, icon, cas, names));

  for (const m of rows) {
    const state = m.estado as IfraState;
    const own = m.estandares === "" ? [] : m.estandares.split(" ");
    const list: Array<{ key: string; fraction: Ratio | null }> = [];
    const all = m.condiciones === "" ? [] : m.condiciones.split(" · ");
    const conditions = all.filter((c) => c !== NO_CONSTITUENT_DATA && !c.startsWith(CONSTITUENT_OUT_OF_INDEX));
    const pending: string[] = [];

    if (state === "prohibido") {
      list.push(...own.map((key) => ({ key: prohibited(key), fraction: Ratio.ONE })));
    } else {
      list.push(...own.filter((key) => substances.has(`std:${key}`)).map((key) => ({ key: `std:${key}`, fraction: Ratio.ONE })));
    }
    for (const [key, byVariant] of inside.get(m.id) ?? []) {
      const worst = [...byVariant.values()].reduce((a, b) => (b.gt(a) ? b : a));
      const s = standards.get(key);
      if (substances.has(`std:${key}`)) {
        if (!list.some((x) => x.key === `std:${key}`)) {
          list.push({ key: `std:${key}`, fraction: worst });
        }
      } else if (s?.prohibicion && s.cat_4 === "") {
        pending.push(`${s.nombre}: prohibido como tal; lo que trae este natural no tiene techo en los datos (${short(key)}).`);
      }
    }
    for (const name of outside.get(m.id) ?? []) {
      pending.push(`${name}: el anexo lo da como regulado, pero no está en el índice de IFRA.`);
    }
    if (state === "sin-dato" || all.includes(NO_CONSTITUENT_DATA)) {
      pending.push("Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.");
    }
    materials.set(m.id, { status: "checked", substances: list, conditions, ...(pending.length ? { pending } : {}) });

    const standardName = m.nombre_ifra.split(" | ")[0];
    const trade = m.nombre_comercial;
    // The prime of a mark (²′IBQ) is also found as the keyboard's apostrophe.
    const marked = `${m.icono_distintivo}${m.sigla_comercial} ${m.icono_distintivo.replace(/′/g, "'")}${m.sigla_comercial}`;
    const others = m.otros_nombres_comerciales === "" ? [] : m.otros_nombres_comerciales.split(" | ");
    entries.push({
      material: { key: m.id, kind: "base", name: trade || m.nombre, ...(m.cas ? { cas: m.cas } : {}) },
      group: "base",
      code: m.codigo,
      icon: m.icono || m.codigo,
      ...(m.icono_distintivo ? { iconMark: m.icono_distintivo } : {}),
      ...(m.icono_tipo ? { iconType: m.icono_tipo } : {}),
      chemicalName: m.nombre,
      ...(trade ? { tradeName: trade } : {}),
      ...(m.sigla_comercial ? { tradeCode: m.sigla_comercial } : {}),
      cas: m.cas,
      state,
      ...(standardName && normalize(standardName) !== normalize(trade || m.nombre) ? { standardName } : {}),
      ...(familyNamed.has(m.familia)
        ? {
            family: {
              family: familyNamed.get(m.familia)!,
              ...(familyNamed.has(m.matiz) ? { hue: familyNamed.get(m.matiz)! } : {}),
              confidence: m.confianza_familia,
            },
          }
        : {}),
      search: normalize(
        `${m.codigo} ${marked} ${trade} ${m.sigla_comercial} ${others.join(" ")} ${m.nombre} ${m.cas} ${m.otros_cas} ${m.nombre_ifra} ${m.sinonimos} ${m.nombres_transparencia}`,
      ),
      folded: [trade, ...others, m.nombre, standardName].filter((n) => n !== "").map(fold),
    });
  }

  // The diluents take the IFRA of their CAS in the glossary. One that is not there is
  // not in IFRA's index, which is complete: no standard of its own (P37).
  for (const [id, , , cas] of DILUENT_DATA) {
    const row = rows.find((m) => m.cas === cas);
    const info = row ? materials.get(row.id) : undefined;
    materials.set(DILUENTS[id].key, info ?? { status: "checked", substances: [], conditions: [] });
  }

  const fig = rows.filter((m) => m.id.startsWith("fig:")).length;
  return {
    entries,
    ifra: { substances, materials },
    families,
    counts: { fig, ifraOnly: rows.length - fig, withFamily: entries.filter((e) => e.family).length },
    source: { amendment, generated: files.procedencia.generado.slice(0, 10) },
  };
}

const GROUP_ORDER: Record<CatalogGroup, number> = { own: 0, diluent: 1, base: 2 };

/** The short label the lab gives the grey family (pieza 11). */
const SHORT_NAMES: Record<string, string> = { Transformado: "Transf" };

/**
 * One search box (§4): every word must appear in the code, a name, a synonym
 * or the CAS. The diluents come first, then the base; within each, the code
 * as typed, then the names that start with the query, then the shortest. When
 * that finds too little, names written close to the query come after it: a
 * trade name and its chemical name are both valid, in either spelling (P38).
 */
export function searchCatalog(entries: readonly CatalogEntry[], query: string, limit = 12): CatalogEntry[] {
  const words = normalize(query).split(/\s+/).filter((w) => w !== "");
  if (words.length === 0) {
    return [];
  }
  const found = entries.filter((e) => words.every((w) => e.search.includes(w)));
  const head = words.join(" ");
  const starts = (e: CatalogEntry) =>
    [e.material.name, e.chemicalName, e.standardName ?? "", e.tradeCode ?? ""].some((n) => normalize(n).startsWith(head)) ||
    e.cas.startsWith(head);
  // Codes tell capitals apart («OT», «Ot»): the one typed exactly comes first.
  const typed = query.trim().replace(/′/g, "'");
  const marked = (e: CatalogEntry) => `${e.iconMark ?? ""}${e.tradeCode ?? ""}`.replace(/′/g, "'");
  const match = (e: CatalogEntry) =>
    e.code === typed || e.tradeCode === typed || marked(e) === typed
      ? 0
      : normalize(e.code) === head || normalize(marked(e)) === head
        ? 1
        : starts(e)
          ? 2
          : 3;
  const score = (e: CatalogEntry) => GROUP_ORDER[e.group] * 4 + match(e);
  const ranked = found
    .map((e, i) => ({ e, i, s: score(e) }))
    .sort((a, b) => a.s - b.s || a.e.material.name.length - b.e.material.name.length || a.i - b.i)
    .map(({ e }) => e);

  const folded = fold(query);
  if (ranked.length >= limit || folded.length < 5) {
    return ranked.slice(0, limit);
  }
  // About one edit every five letters: enough for «cumarina» and «coumarin».
  const allowed = Math.round(folded.length / 5);
  const seen = new Set(ranked);
  const close = entries
    .filter((e) => !seen.has(e))
    .map((e, i) => ({ e, i, d: Math.min(...e.folded.map((n) => nearest(folded, n))) }))
    .filter((x) => x.d <= allowed)
    .sort((a, b) => a.d - b.d || a.e.material.name.length - b.e.material.name.length || a.i - b.i)
    .map(({ e }) => e);
  return [...ranked, ...close].slice(0, limit);
}
