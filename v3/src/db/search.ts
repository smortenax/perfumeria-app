import type { Catalog, CatalogMaterial, Category } from "./catalog";

/**
 * The search (plan v3, steps 5.2, 5.3 and 6.1): one box over the catalog in memory.
 *
 * It finds a material by its name, its other names (V3-6), its abbreviation (V3-37), all its CAS
 * (V3-16), its species and its INCI (V3-24), and a version also by its bottle (the product as the
 * shop names it) and by everything its common material is found by: a version is that material
 * (V3-5). As the v1 searched: every word must appear; a CAS typed with zeros more is the same CAS
 * (P52); when that finds too little, names written close to the query come after it (P38).
 *
 * It shows one row per category (V3-11, V3-13), with its materials under it: the category only
 * gathers them, and what is chosen, weighed and checked is always one material.
 */

/** A material of a row: whether the query found it or it comes with its category. */
export interface SearchMember {
  readonly material: CatalogMaterial;
  readonly matched: boolean;
}

export interface SearchRow {
  /** «cat:<id>» for a category; «mat:<id>» for a material that has none (with its versions). */
  readonly key: string;
  readonly category: Category | null;
  readonly name: string;
  /** Your own first, then the common ones; within each, the best found first. */
  readonly members: readonly SearchMember[];
}

interface Entry {
  readonly material: CatalogMaterial;
  readonly row: string;
  readonly abbreviation: string | null;
  /** Its names, as found: normalized, a hyphen as a space. */
  readonly names: readonly string[];
  readonly cas: readonly string[];
  /** Everything a word of the query may be in, normalized. */
  readonly text: string;
  /** Its names folded from the start of each word, for the tolerant search. */
  readonly folded: readonly string[];
}

export interface SearchIndex {
  readonly entries: readonly Entry[];
  readonly rows: ReadonlyMap<string, { readonly category: Category | null; readonly name: string; readonly entries: readonly Entry[] }>;
}

/** Without accents and in lower case: how the v1 compared names. */
export const normalize = (text: string): string => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** To order, a hyphen is a space: «alpha ionone» starts «alpha-Ionone». */
const loose = (text: string): string => text.replace(/[-_]+/g, " ");
const prime = (text: string): string => text.replace(/′/g, "'");

/**
 * A name folded for a tolerant search, as in the v1: no accents, spaces or signs, and the
 * spellings that differ between English and Spanish made the same (y/i, ph/f, th/t, k/c, ou/u),
 * so that «isobutilquinoleina» and «Isobutyl quinoline» meet.
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

/**
 * A CAS typed with zeros more, as some sheets write it: «0123-07-09» is 123-07-9 (P52). The last
 * part of a CAS is one check digit; it is taken only when the check holds.
 */
export function casForm(text: string): string | null {
  const match = /^\s*0*(\d{2,7})-(\d{2})-0?(\d)\s*$/.exec(text);
  if (!match) return null;
  const [, head, middle, check] = match;
  const digits = `${head}${middle}`.split("").reverse();
  const sum = digits.reduce((s, d, i) => s + Number(d) * (i + 1), 0);
  return sum % 10 === Number(check) ? `${head}-${middle}-${check}` : null;
}

/**
 * Edits between the query and the start of the text, as long as it needs (approximate prefix
 * match), or null when it takes more than `allowed`: a row's least never goes down, so it stops
 * there. Anchored at the start of a word, unlike the v1's, which looked anywhere in the name:
 * there «lemon» found Stemone and Pogostemon (proposal of the session).
 */
function nearest(query: string, text: string, allowed: number): number | null {
  let previous = Array.from({ length: text.length + 1 }, (_, j) => j);
  for (let i = 1; i <= query.length; i++) {
    const current = [i];
    for (let j = 1; j <= text.length; j++) {
      const change = previous[j - 1] + (query[i - 1] === text[j - 1] ? 0 : 1);
      current.push(Math.min(previous[j] + 1, current[j - 1] + 1, change));
    }
    if (Math.min(...current) > allowed) return null;
    previous = current;
  }
  return Math.min(...previous);
}

/** A name from the start of each of its words: «Isobutyl quinoline», «quinoline». */
const fromEachWord = (name: string): string[] => [...name.matchAll(/(?<![\p{L}\p{N}])[\p{L}\p{N}]/gu)].map((m) => name.slice(m.index));

/** The material and the ones it is a version of, nearest first (V3-5). */
function chainOf(catalog: Catalog, material: CatalogMaterial): CatalogMaterial[] {
  const chain = [material];
  for (let at = material; at.basedOnId; ) {
    const base = catalog.materials.get(at.basedOnId);
    if (!base || chain.includes(base)) break;
    chain.push(base);
    at = base;
  }
  return chain;
}

/** Built once per catalog: what each material is found by, and the row it goes in. */
export function indexCatalog(catalog: Catalog): SearchIndex {
  const entries: Entry[] = [];
  const rows = new Map<string, { category: Category | null; name: string; entries: Entry[] }>();
  for (const material of catalog.materials.values()) {
    const chain = chainOf(catalog, material);
    const root = chain[chain.length - 1];
    // A version goes in its common's category (V3-13); without one, with its common.
    const categoryId = chain.map((m) => m.categoryId).find((id) => id !== null) ?? null;
    const category = categoryId ? (catalog.categories.get(categoryId) ?? null) : null;
    const row = category ? `cat:${category.id}` : `mat:${root.id}`;
    const nameList = [...new Set(chain.flatMap((m) => [m.name, ...m.aliases, ...(m.product ? [m.product] : [])]))];
    const cas = [...new Set(chain.flatMap((m) => [...(m.cas ? [m.cas] : []), ...m.otherCas]))];
    const abbreviation = chain.map((m) => m.abbreviation).find((a) => a !== null) ?? null;
    const others = chain.flatMap((m) => [m.species, m.inci]).filter((t): t is string => t !== null);
    const entry: Entry = {
      material,
      row,
      abbreviation,
      names: nameList.map((n) => loose(normalize(n))),
      cas,
      text: normalize([...(abbreviation ? [abbreviation, prime(abbreviation)] : []), ...nameList, ...cas, ...others].join(" ")),
      folded: [...new Set(nameList.flatMap(fromEachWord).map(fold).filter((f) => f !== ""))],
    };
    entries.push(entry);
    const at = rows.get(row) ?? { category, name: category?.name ?? root.name, entries: [] };
    at.entries.push(entry);
    rows.set(row, at);
  }
  return { entries, rows };
}

/**
 * The rows the query finds, at most `limit`. Within the found: the abbreviation as typed (codes
 * tell capitals apart), then the same abbreviation, then a name or a CAS that starts with the
 * query, then the whole query as one phrase from the start of a word, then the rest; the names
 * written close to it last. A row comes where its best material does.
 */
export function search(index: SearchIndex, typedQuery: string, limit = 12): SearchRow[] {
  const query = casForm(typedQuery) ?? typedQuery;
  const words = normalize(query).split(/\s+/).filter((w) => w !== "");
  if (words.length === 0) return [];
  const head = loose(words.join(" "));
  // The prime of a mark (²′IBQ) is also found as the keyboard's apostrophe.
  const typed = prime(query.trim());
  const score = (e: Entry): number =>
    e.abbreviation !== null && prime(e.abbreviation) === typed
      ? 0
      : e.abbreviation !== null && normalize(e.abbreviation) === normalize(typed)
        ? 1
        : e.names.some((n) => n.startsWith(head)) || e.cas.some((c) => c.startsWith(head))
          ? 2
          : words.length > 1 && loose(` ${e.text}`).includes(` ${head}`)
            ? 3
            : 4;
  const found = new Map<Entry, number>();
  for (const e of index.entries) if (words.every((w) => e.text.includes(w))) found.set(e, score(e));

  const folded = fold(query);
  if (new Set([...found.keys()].map((e) => e.row)).size < limit && folded.length >= 5) {
    // About one edit every five letters: enough for «cumarina» and «coumarin».
    const allowed = Math.round(folded.length / 5);
    for (const e of index.entries) {
      if (found.has(e) || e.folded.length === 0) continue;
      const d = Math.min(...e.folded.map((n) => nearest(folded, n, allowed) ?? Number.POSITIVE_INFINITY));
      if (d <= allowed) found.set(e, 5 + d);
    }
  }

  const shortest = (list: readonly Entry[]) => Math.min(...list.map((e) => e.material.name.length));
  const ranked = [...index.rows]
    .map(([key, row]) => ({ key, row, hits: row.entries.filter((e) => found.has(e)) }))
    .filter((r) => r.hits.length > 0)
    .map((r) => ({ ...r, best: Math.min(...r.hits.map((e) => found.get(e)!)) }))
    .sort((a, b) => a.best - b.best || shortest(a.hits) - shortest(b.hits) || a.row.name.localeCompare(b.row.name) || (a.key < b.key ? -1 : 1));
  return ranked.slice(0, limit).map(({ key, row }) => ({
    key,
    category: row.category,
    name: row.name,
    members: [...row.entries]
      .sort(
        (a, b) =>
          Number(a.material.ownerId === null) - Number(b.material.ownerId === null) ||
          (found.get(a) ?? 99) - (found.get(b) ?? 99) ||
          a.material.name.localeCompare(b.material.name) ||
          (a.material.id < b.material.id ? -1 : 1),
      )
      .map((e) => ({ material: e.material, matched: found.has(e) })),
  }));
}
