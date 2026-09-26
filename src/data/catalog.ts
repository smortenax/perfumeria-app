import { Ratio } from "../core/arith/ratio";
import type { IfraData, IfraMaterial, IfraSubstance } from "../core/ifra";
import { DILUENTS, type Material } from "../core/model/material";
import { parseCsvRecords } from "./csv";

/**
 * The provisional catalog of the test bench, read from what
 * scripts/importar_datos.py brought into datos/fuente/. Phase 3 replaces it
 * with the versioned data package (plan, D3). Meanwhile (P36):
 * - the materials are the rows of the FIG glossary, standing in for IFRA's
 *   full list (the Transparency List) until the lab brings it;
 * - IFRA is read by CAS from what the lab transcribed of the standards
 *   (ifra-cat4.csv): only IFRA's own data, never the notes about a bottle or a
 *   supplier. A CAS that is not there is unchecked (§5.2);
 * - DPG and alcohol are the diluents.
 * None of the user's materials or descriptions is read (P35, P36).
 */
export type CatalogGroup = "own" | "diluent" | "base";

export interface CatalogEntry {
  readonly material: Material;
  readonly group: CatalogGroup;
  readonly cas: string;
  /** The name IFRA gives the substance in its standard, when it has one: "Iso E Super (OTNE)". */
  readonly standardName?: string;
  /** Names and CAS, lower case and without accents, for the search. */
  readonly search: string;
}

export interface Catalog {
  readonly entries: readonly CatalogEntry[];
  readonly ifra: IfraData;
  /** How many CAS of the base have IFRA data. */
  readonly checkedCas: number;
  readonly source: { readonly commit: string; readonly date: string };
}

export interface CatalogFiles {
  readonly ifraCat4: string;
  readonly glosarioFig: string;
  readonly procedencia: { readonly commit: string; readonly fecha_commit: string };
}

/** Substances regulated by a standard of their own that other materials can carry (§5.3). */
const SHARED_CAS: Record<string, string> = { cumarina: "91-64-5", eugenol: "97-53-0", geraniol: "106-24-1" };

export const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

interface CasIfra {
  readonly standardName: string;
  readonly material: IfraMaterial;
}

export function buildCatalog(files: CatalogFiles): Catalog {
  const fig = parseCsvRecords(files.glosarioFig);
  const { byCas, substances } = ifraByCas(parseCsvRecords(files.ifraCat4));

  const entry = (material: Material, group: CatalogGroup, cas: string, standardName?: string): CatalogEntry => ({
    material,
    group,
    cas,
    ...(standardName ? { standardName } : {}),
    search: normalize(`${material.name} ${standardName ?? ""} ${cas}`),
  });

  const entries: CatalogEntry[] = [
    entry(DILUENTS.dpg, "diluent", "25265-71-8"),
    entry(DILUENTS.alcohol, "diluent", "64-17-5"),
    ...fig.map((row, i) =>
      entry({ key: `fig:${i + 1}`, kind: "base", name: row.nombre }, "base", row.cas, byCas.get(row.cas)?.standardName || undefined),
    ),
  ];

  const materials = new Map<string, IfraMaterial>();
  for (const e of entries) {
    const info = e.group === "base" ? byCas.get(e.cas) : undefined;
    if (info) {
      materials.set(e.material.key, info.material);
    }
  }

  return {
    entries,
    ifra: { substances, materials },
    checkedCas: new Set(entries.filter((e) => materials.has(e.material.key)).map((e) => e.cas)).size,
    source: { commit: files.procedencia.commit.slice(0, 7), date: files.procedencia.fecha_commit.slice(0, 10) },
  };
}

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100));

const splitCas = (text: string): string[] =>
  text
    .split(/[/·]/)
    .map((c) => c.trim())
    .filter((c) => /^\d{2,7}-\d{2}-\d$/.test(c));

/** Splits «a (x · y) · b» at the dots outside parentheses. */
function splitConstituents(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const c of text) {
    depth += c === "(" ? 1 : c === ")" ? -1 : 0;
    if (c === "·" && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  parts.push(current.trim());
  return parts.filter((part) => part !== "");
}

const firstWord = (text: string): string => normalize(text).split(/[\s(]/)[0];

function ifraByCas(rows: ReadonlyArray<Record<string, string>>): {
  byCas: Map<string, CasIfra>;
  substances: Map<string, IfraSubstance>;
} {
  const byCas = new Map<string, CasIfra>();
  const substances = new Map<string, IfraSubstance>();

  for (const row of rows) {
    const tipo = normalize(row.tipo);
    // Never looked up, or nothing to look up: the CAS stays unchecked.
    if (tipo.startsWith("sin verificar") || tipo.startsWith("no evaluable")) {
      continue;
    }
    const constituents = splitConstituents(row.constituyentes_regulados);
    const words = constituents.map(firstWord);
    const specification = /especificacion|prohibicion/.test(tipo);

    for (const cas of splitCas(row.cas)) {
      const previous = byCas.get(cas)?.material;
      const own = [...(previous?.substances ?? [])];
      const conditions = [...(previous?.conditions ?? [])];
      const pending = [...(previous?.pending ?? [])];

      if (row.cat4_pct_producto_terminado !== "" && /restriccion/.test(tipo)) {
        const key = `cas:${cas}`;
        const limit = pct(row.cat4_pct_producto_terminado);
        const existing = substances.get(key);
        if (!existing || limit.lt(existing.limit)) {
          substances.set(key, { key, name: row.nombre_en_estandar || cas, limit, amendment: row.enmienda });
        }
        if (!own.some((s) => s.key === key)) {
          own.push({ key, fraction: Ratio.ONE });
        }
      }
      if (specification && row.condicion !== "" && !conditions.includes(row.condicion)) {
        conditions.push(row.condicion);
      }
      for (const [i, word] of words.entries()) {
        const sharedCas = SHARED_CAS[word];
        if (sharedCas === cas) {
          continue; // regulated as itself, already counted
        }
        if (sharedCas) {
          own.push({ key: `cas:${sharedCas}`, fraction: null });
        } else if (word === "linalol") {
          if (!specification) {
            conditions.push("Lleva linalol: especificación de IFRA (peróxidos), sin tope en %.");
          }
        } else if (word === "hap") {
          conditions.push("HAP ≤ 1 ppb, acumulativo: con certificado del proveedor.");
        } else {
          // Citral, thujone…: a ceiling exists, but it is not in the data. Never free (§1.2).
          pending.push(`${constituents[i]}: tiene techo IFRA, pero no está en los datos.`);
        }
      }

      byCas.set(cas, {
        standardName: row.nombre_en_estandar,
        material: { status: "checked", substances: own, conditions, ...(pending.length ? { pending } : {}) },
      });
    }
  }

  // A shared substance nobody gave a ceiling for cannot be checked: pending, not free.
  for (const [cas, info] of byCas) {
    const missing = info.material.substances.filter((s) => !substances.has(s.key));
    if (missing.length > 0) {
      byCas.set(cas, {
        ...info,
        material: {
          ...info.material,
          substances: info.material.substances.filter((s) => substances.has(s.key)),
          pending: [...(info.material.pending ?? []), ...missing.map((s) => `${s.key}: tiene techo IFRA, pero no está en los datos.`)],
        },
      });
    }
  }

  return { byCas, substances };
}

const GROUP_ORDER: Record<CatalogGroup, number> = { own: 0, diluent: 1, base: 2 };

/**
 * One search box (§4): every word must appear in a name or the CAS. The
 * diluents come first, then the base; within each, the names that start with
 * the query, then the shortest.
 */
export function searchCatalog(entries: readonly CatalogEntry[], query: string, limit = 12): CatalogEntry[] {
  const words = normalize(query).split(/\s+/).filter((w) => w !== "");
  if (words.length === 0) {
    return [];
  }
  const found = entries.filter((e) => words.every((w) => e.search.includes(w)));
  const head = words.join(" ");
  const starts = (e: CatalogEntry) =>
    normalize(e.material.name).startsWith(head) || normalize(e.standardName ?? "").startsWith(head) || e.cas.startsWith(head);
  const score = (e: CatalogEntry) => GROUP_ORDER[e.group] * 2 + (starts(e) ? 0 : 1);
  return found
    .map((e, i) => ({ e, i, s: score(e) }))
    .sort((a, b) => a.s - b.s || a.e.material.name.length - b.e.material.name.length || a.i - b.i)
    .slice(0, limit)
    .map(({ e }) => e);
}
