import { Ratio } from "../core/arith/ratio";
import { formatDecimal } from "../core/display";
import type { IfraData, IfraMaterial, IfraSubstance } from "../core/ifra";
import { DILUENTS, type Material } from "../core/model/material";
import { parseCsvRecords } from "./csv";

/**
 * The provisional catalog of the test bench, read from what
 * scripts/importar_datos.py brought from the lab into datos/fuente/. Phase 3
 * replaces it with the versioned data package (plan, D3). Meanwhile:
 * - the lab's materials are the user's own (P35), with their IFRA data;
 * - the FIG glossary is the base, not yet checked against IFRA, so it is
 *   "sin comprobar" (§5.2);
 * - DPG and alcohol are the diluents.
 * No description of the user (floor, family, strength in words) is read (P35).
 */
export type CatalogGroup = "own" | "diluent" | "base";

export interface CatalogEntry {
  readonly material: Material;
  readonly group: CatalogGroup;
  readonly cas: string;
  /** Name and CAS, lower case and without accents, for the search. */
  readonly search: string;
}

export interface Catalog {
  readonly entries: readonly CatalogEntry[];
  readonly ifra: IfraData;
  readonly source: { readonly commit: string; readonly date: string };
}

export interface CatalogFiles {
  readonly inventario: string;
  readonly ifraCat4: string;
  readonly glosarioFig: string;
  readonly procedencia: { readonly commit: string; readonly fecha_commit: string };
}

/** Substances that more than one material can carry: they are added up wherever they come from (§5.3). */
const SHARED: Record<string, string> = { cumarina: "Cumarina", eugenol: "Eugenol", geraniol: "Geraniol" };

export const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function buildCatalog(files: CatalogFiles): Catalog {
  const inventory = parseCsvRecords(files.inventario);
  const ifraRows = parseCsvRecords(files.ifraCat4);
  const fig = parseCsvRecords(files.glosarioFig);

  const casById = new Map<string, string>();
  for (const row of ifraRows) {
    if (!casById.has(row.id)) {
      casById.set(row.id, row.cas);
    }
  }

  const entry = (material: Material, group: CatalogGroup, cas: string): CatalogEntry => ({
    material,
    group,
    cas,
    search: normalize(`${material.name} ${cas}`),
  });

  const entries: CatalogEntry[] = [
    ...inventory.map((row) =>
      entry({ key: `lab:${row.id}`, kind: "own", name: row.nombre }, "own", casById.get(row.id) ?? ""),
    ),
    entry(DILUENTS.dpg, "diluent", "25265-71-8"),
    entry(DILUENTS.alcohol, "diluent", "64-17-5"),
    ...fig.map((row, i) => entry({ key: `fig:${i + 1}`, kind: "base", name: row.nombre }, "base", row.cas)),
  ];

  const names = new Map(inventory.map((row) => [row.id, row.nombre]));
  return {
    entries,
    ifra: buildIfra(ifraRows, names),
    source: { commit: files.procedencia.commit.slice(0, 7), date: files.procedencia.fecha_commit.slice(0, 10) },
  };
}

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100));

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

function buildIfra(rows: ReadonlyArray<Record<string, string>>, names: ReadonlyMap<string, string>): IfraData {
  const byId = new Map<string, Array<Record<string, string>>>();
  for (const row of rows) {
    byId.set(row.id, [...(byId.get(row.id) ?? []), row]);
  }

  const substances = new Map<string, IfraSubstance>();
  const materials = new Map<string, IfraMaterial>();
  const sharedUse: Array<{ key: string; material: string; word: string }> = [];

  for (const [id, group] of byId) {
    const first = group[0];
    const key = `lab:${id}`;
    const name = names.get(id) ?? first.material;
    const tipo = normalize(first.tipo);
    const constituents = splitConstituents(first.constituyentes_regulados);
    const words = constituents.map(firstWord);

    // "sin verificar": never looked up. "no evaluable" with nothing known inside: the same.
    if (tipo.startsWith("sin verificar") || (tipo.startsWith("no evaluable") && !words.some((w) => w in SHARED))) {
      materials.set(key, { status: "unchecked", substances: [], conditions: [] });
      continue;
    }

    const own: Array<{ key: string; fraction: Ratio | null }> = [];
    const conditions: string[] = [];
    const pending: string[] = [];

    // A ceiling of its own. Two rows for one material are two possible bottles: the strictest rules.
    const limited = group
      .filter((row) => row.cat4_pct_producto_terminado !== "" && /restriccion/.test(normalize(row.tipo)))
      .sort((a, b) => pct(a.cat4_pct_producto_terminado).cmp(pct(b.cat4_pct_producto_terminado)));
    let regulatedAs: string | null = null;
    if (limited.length > 0) {
      const strictest = limited[0];
      const limit = pct(strictest.cat4_pct_producto_terminado);
      regulatedAs = words.length === 1 && words[0] in SHARED ? words[0] : null;
      const substanceKey = regulatedAs ? `sub:${regulatedAs}` : key;
      substances.set(substanceKey, {
        key: substanceKey,
        name: regulatedAs ? SHARED[regulatedAs] : name,
        limit,
        amendment: strictest.enmienda,
      });
      own.push({ key: substanceKey, fraction: Ratio.ONE });
      if (limited.length > 1) {
        const options = limited.map((row) => `${formatDecimal(pct(row.cat4_pct_producto_terminado).mul(Ratio.of(100)), 2)} % (CAS ${row.cas})`);
        conditions.push(`Hay dos techos, según cuál sea el frasco: ${options.join(" o ")}. Se toma el más estricto hasta confirmarlo.`);
      }
    }

    const specification = /especificacion|prohibicion/.test(tipo);
    if (specification && first.condicion !== "") {
      conditions.push(first.condicion);
    }

    for (const [i, word] of words.entries()) {
      if (word === regulatedAs) {
        continue;
      }
      if (word in SHARED) {
        own.push({ key: `sub:${word}`, fraction: null });
        sharedUse.push({ key, material: name, word });
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

    materials.set(key, { status: "checked", substances: own, conditions, ...(pending.length ? { pending } : {}) });
  }

  // A shared substance nobody gave a ceiling for cannot be checked: pending, not free.
  for (const use of sharedUse) {
    const substanceKey = `sub:${use.word}`;
    if (!substances.has(substanceKey)) {
      const info = materials.get(use.key) as IfraMaterial;
      materials.set(use.key, {
        ...info,
        substances: info.substances.filter((s) => s.key !== substanceKey),
        pending: [...(info.pending ?? []), `${SHARED[use.word]}: tiene techo IFRA, pero no está en los datos.`],
      });
    }
  }

  return { substances, materials };
}

const GROUP_ORDER: Record<CatalogGroup, number> = { own: 0, diluent: 1, base: 2 };

/**
 * One search box (§4): every word must appear in the name or the CAS. The user's
 * own materials come first, then the diluents, then the base; within each, the
 * names that start with the query.
 */
export function searchCatalog(entries: readonly CatalogEntry[], query: string, limit = 12): CatalogEntry[] {
  const words = normalize(query).split(/\s+/).filter((w) => w !== "");
  if (words.length === 0) {
    return [];
  }
  const found = entries.filter((e) => words.every((w) => e.search.includes(w)));
  const head = words.join(" ");
  const score = (e: CatalogEntry) => GROUP_ORDER[e.group] * 2 + (e.search.startsWith(head) ? 0 : 1);
  return found
    .map((e, i) => ({ e, i, s: score(e) }))
    .sort((a, b) => a.s - b.s || a.e.material.name.length - b.e.material.name.length || a.i - b.i)
    .slice(0, limit)
    .map(({ e }) => e);
}
