import { Ratio } from "../core/arith/ratio";
import type { IfraData, IfraMaterial, IfraSubstance } from "../core/ifra";
import { DILUENTS, type Material } from "../core/model/material";
import { parseCsvRecords } from "./csv";

/**
 * The catalog of the bench, read from the glossary that
 * scripts/generar_glosario.py writes into datos/glosario/ (P37): every CAS
 * IFRA knows of, and the rows of the FIG with the user's codes. IFRA comes
 * from IFRA's own files (datos/ifra/), counted in category 4 (§5.1). Nothing
 * comes from the lab, and none of the user's materials is in it (P36, P37).
 * DPG and alcohol are the diluents.
 */
export type CatalogGroup = "own" | "diluent" | "base";

/** What IFRA says of a material, as the glossary puts it (datos/glosario/LEEME.md). */
export type IfraState = "prohibido" | "con-techo" | "condicion" | "por-constituyentes" | "sin-dato" | "sin-estandar";

export interface CatalogEntry {
  readonly material: Material;
  readonly group: CatalogGroup;
  /** The material's short code, the user's or a provisional one. */
  readonly code: string;
  readonly cas: string;
  readonly state?: IfraState;
  /** The name of its IFRA standard, when it has one. */
  readonly standardName?: string;
  /** Code, names, synonyms and CAS, lower case and without accents, for the search. */
  readonly search: string;
}

export interface Catalog {
  readonly entries: readonly CatalogEntry[];
  readonly ifra: IfraData;
  readonly counts: { readonly fig: number; readonly ifraOnly: number };
  readonly source: { readonly amendment: string; readonly generated: string };
}

export interface CatalogFiles {
  readonly materiales: string;
  readonly constituyentes: string;
  readonly estandares: string;
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

  const rows = parseCsvRecords(files.materiales);
  const materials = new Map<string, IfraMaterial>();
  const entries: CatalogEntry[] = [
    { material: DILUENTS.dpg, group: "diluent", code: "DPG", cas: "25265-71-8", search: "dpg dipropilenglicol dipropylene glycol 25265-71-8" },
    { material: DILUENTS.alcohol, group: "diluent", code: "EtOH", cas: "64-17-5", search: "alcohol etanol ethanol 64-17-5" },
  ];

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
    entries.push({
      material: { key: m.id, kind: "base", name: m.nombre },
      group: "base",
      code: m.codigo,
      cas: m.cas,
      state,
      ...(standardName && normalize(standardName) !== normalize(m.nombre) ? { standardName } : {}),
      search: normalize(`${m.codigo} ${m.nombre} ${m.cas} ${m.otros_cas} ${m.nombre_ifra} ${m.sinonimos}`),
    });
  }

  const fig = rows.filter((m) => m.id.startsWith("fig:")).length;
  return {
    entries,
    ifra: { substances, materials },
    counts: { fig, ifraOnly: rows.length - fig },
    source: { amendment, generated: files.procedencia.generado.slice(0, 10) },
  };
}

const GROUP_ORDER: Record<CatalogGroup, number> = { own: 0, diluent: 1, base: 2 };

/**
 * One search box (§4): every word must appear in the code, a name, a synonym
 * or the CAS. The diluents come first, then the base; within each, the code
 * as typed, then the names that start with the query, then the shortest.
 */
export function searchCatalog(entries: readonly CatalogEntry[], query: string, limit = 12): CatalogEntry[] {
  const words = normalize(query).split(/\s+/).filter((w) => w !== "");
  if (words.length === 0) {
    return [];
  }
  const found = entries.filter((e) => words.every((w) => e.search.includes(w)));
  const head = words.join(" ");
  // Codes tell capitals apart («OT», «Ot»): the one typed exactly comes first.
  const match = (e: CatalogEntry) =>
    e.code === query.trim()
      ? 0
      : normalize(e.code) === head
        ? 1
        : normalize(e.material.name).startsWith(head) || normalize(e.standardName ?? "").startsWith(head) || e.cas.startsWith(head)
          ? 2
          : 3;
  const score = (e: CatalogEntry) => GROUP_ORDER[e.group] * 4 + match(e);
  return found
    .map((e, i) => ({ e, i, s: score(e) }))
    .sort((a, b) => a.s - b.s || a.e.material.name.length - b.e.material.name.length || a.i - b.i)
    .slice(0, limit)
    .map(({ e }) => e);
}
