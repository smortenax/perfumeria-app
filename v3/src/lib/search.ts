/**
 * The search of a material by typing, one for the whole app (2026-11-26; the user: «el buscador de diluciones
 * no funciona igual ni se basa en la lista de la misma manera que el buscar materiales en la formulacion»).
 * The bench's add bar and every MaterialPicker (dilutions, strips, planner) rank with `searchCatalog`, over
 * entries whose `search` and `folded` are made the same way (db/material-search.ts). Pure: no React, no data.
 */

/** Whose a material is, for the order: yours, a diluent, the common base. */
export type SearchGroup = "own" | "diluent" | "base";

/** What the search reads of a material: its names, codes and CAS, folded once when the list is made. */
export interface SearchEntry {
  readonly material: { readonly name: string };
  readonly group: SearchGroup;
  /** The material's short code: the abbreviation, or empty. */
  readonly code: string;
  readonly iconMark?: string;
  readonly tradeCode?: string;
  readonly chemicalName?: string;
  readonly standardName?: string;
  readonly cas: string;
  /** A material with no IFRA data («sin-dato») goes after one that has it, within the same match. */
  readonly state?: string;
  /** Code, names, synonyms and CAS, lower case and without accents. */
  readonly search: string;
  /** The names folded for a tolerant search: «isobutilquinoleina» finds «Isobutyl quinoline». */
  readonly folded: readonly string[];
}

/** Without accents and in lower case. */
export const normalize = (text: string): string => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

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

const GROUP_ORDER: Record<SearchGroup, number> = { own: 0, diluent: 1, base: 2 };

/**
 * A CAS typed with zeros of more, as some sheets write it: «0123-07-09» is 123-07-9 (P52).
 * The last part of a CAS is one check digit; it is taken only when the check holds.
 */
export function casForm(text: string): string | null {
  const match = /^\s*0*(\d{2,7})-(\d{2})-0?(\d)\s*$/.exec(text);
  if (!match) {
    return null;
  }
  const [, head, middle, check] = match;
  const digits = `${head}${middle}`.split("").reverse();
  const sum = digits.reduce((s, d, i) => s + Number(d) * (i + 1), 0);
  return sum % 10 === Number(check) ? `${head}-${middle}-${check}` : null;
}

/**
 * One search box (§4): every word must appear in the code, a name, a synonym
 * or the CAS. How well the name matches comes first (the exact name, then the
 * code as typed and the names that start with the query, then the name holding
 * it as a phrase); within each, a material with data before one without, then
 * yours, the diluents and the base, then the shortest. When
 * that finds too little, names written close to the query come after it: a
 * trade name and its chemical name are both valid, in either spelling (P38).
 */
export function searchCatalog<E extends SearchEntry>(entries: readonly E[], typedQuery: string, limit = 12): E[] {
  const query = casForm(typedQuery) ?? typedQuery;
  const words = normalize(query).split(/\s+/).filter((w) => w !== "");
  if (words.length === 0) {
    return [];
  }
  const found = entries.filter((e) => words.every((w) => e.search.includes(w)));
  const head = words.join(" ");
  // To order, a hyphen is a space: «alpha ionone» starts «alpha-Ionone».
  const loose = (text: string) => text.replace(/[-_]+/g, " ");
  const looseHead = loose(head);
  // The names are read one at a time, in this order, and only while none has matched: the standard's name of a v2 entry is worked out the
  // first time it is read (Phase 6), and a one-letter query would otherwise read it for every entry that contains the letter.
  const starts = (e: E) => {
    const named = (read: () => string | undefined) => loose(normalize(read() ?? "")).startsWith(looseHead);
    return named(() => e.material.name) || named(() => e.chemicalName) || named(() => e.standardName) || named(() => e.tradeCode) || e.cas.startsWith(head);
  };
  // Codes tell capitals apart («OT», «Ot»): the one typed exactly comes first.
  const typed = query.trim().replace(/′/g, "'");
  const marked = (e: E) => `${e.iconMark ?? ""}${e.tradeCode ?? ""}`.replace(/′/g, "'");
  // The whole query as one name («phenylethyl alcohol») goes before its words scattered
  // over several (Gardenol has «sec-Phenylethyl acetate» and «…alcohol, acetate»), and
  // from the start of a word: «p-methylphenylethyl alcohol» is another molecule.
  const phrase = (e: E) => words.length > 1 && loose(` ${e.search}`).includes(` ${looseHead}`);
  const match = (e: E) =>
    e.code === typed || e.tradeCode === typed || marked(e) === typed
      ? 0
      : normalize(e.code) === head || normalize(marked(e)) === head
        ? 1
        : starts(e)
          ? 2
          : phrase(e)
            ? 3
            : 4;
  // How well the name matches comes before whose it is (F-04, picked 2026-11-02): «Coumarin» typed finds the common Coumarin before one
  // of yours that only has the word in its notes. Within the same match, a material with no data goes after one that has it.
  const nameHas = (e: E) => loose(` ${normalize(e.material.name)}`).includes(` ${looseHead}`);
  const exactName = (e: E) => loose(normalize(e.material.name)) === looseHead;
  const score = (e: E) => {
    const m = match(e);
    const quality = exactName(e) ? 0 : m <= 2 ? 1 : nameHas(e) ? 2 : m === 3 ? 3 : 4;
    return quality * 20 + (e.state === "sin-dato" ? 10 : 0) + GROUP_ORDER[e.group] * 3 + Math.min(m, 2);
  };
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
