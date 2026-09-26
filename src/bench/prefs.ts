/**
 * What the app remembers of each material, and only that (§4, P25, P26): the
 * last dilution used and up to two favourites. They are the user's data per
 * material, not part of any formula.
 *
 * Provisional: kept in the browser's storage, which the user can lose by
 * clearing it. The finished bench keeps them in a file of its own (§6).
 */
export type DiluentId = "dpg" | "alcohol";

export interface Dilution {
  /** As typed, with a decimal comma or point: "10", "0,5". */
  readonly percent: string;
  readonly diluent: DiluentId;
}

export interface MaterialPrefs {
  readonly favorites: readonly Dilution[];
  readonly last?: Dilution;
}

const KEY = "perfumeria.prefs.v1";
const RECENT_KEY = "perfumeria.recent.v1";

function readAll(): Record<string, MaterialPrefs> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, MaterialPrefs>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable: the preference lasts until the app closes.
  }
}

export const prefsOf = (materialKey: string): MaterialPrefs => readAll()[materialKey] ?? { favorites: [] };

export const sameDilution = (a: Dilution, b: Dilution): boolean =>
  a.percent.replace(",", ".") === b.percent.replace(",", ".") && a.diluent === b.diluent;

export function rememberLast(materialKey: string, dilution: Dilution): void {
  const all = readAll();
  all[materialKey] = { ...(all[materialKey] ?? { favorites: [] }), last: dilution };
  writeAll(all);
}

/** Adds the dilution as a favourite, or takes it away if it already is one. Two at most: a third pushes out the oldest. */
export function toggleFavorite(materialKey: string, dilution: Dilution): MaterialPrefs {
  const all = readAll();
  const current = all[materialKey] ?? { favorites: [] };
  const exists = current.favorites.some((f) => sameDilution(f, dilution));
  const favorites = exists
    ? current.favorites.filter((f) => !sameDilution(f, dilution))
    : [...current.favorites, dilution].slice(-2);
  all[materialKey] = { ...current, favorites };
  writeAll(all);
  return all[materialKey];
}

/** The percent options, in order: favourites, the last one used, then the base 10 % and 1 % (P25, P26). */
export function percentOptions(prefs: MaterialPrefs): string[] {
  const all = [...prefs.favorites.map((f) => f.percent), prefs.last?.percent, "10", "1"];
  return unique(all.filter((p): p is string => p !== undefined));
}

/** The diluent options, in order: favourites, the last one used, then DPG and alcohol. */
export function diluentOptions(prefs: MaterialPrefs): DiluentId[] {
  const all = [...prefs.favorites.map((f) => f.diluent), prefs.last?.diluent, "dpg", "alcohol"];
  return unique(all.filter((d): d is DiluentId => d !== undefined));
}

function unique<T>(items: readonly T[]): T[] {
  return items.filter((item, i) => items.findIndex((other) => String(other).replace(",", ".") === String(item).replace(",", ".")) === i);
}

export function recentKeys(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function pushRecent(materialKey: string): string[] {
  const keys = [materialKey, ...recentKeys().filter((k) => k !== materialKey)].slice(0, 12);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(keys));
  } catch {
    // Storage unavailable: nothing to remember.
  }
  return keys;
}
