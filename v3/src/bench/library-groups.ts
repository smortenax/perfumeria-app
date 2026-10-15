import type { FormulaVersion } from "../core/model/formula";

/**
 * The versions of the library (P44): «versión nueva o fórmula nueva», named on their
 * own and grouped. A version is a whole formula; the family only puts them together.
 */

/** A formula of the library, as the gallery sees it without opening it. */
export interface LibraryEntry {
  readonly path: string;
  /** The formula's name, from inside the file. */
  readonly title: string;
  readonly modified: Date;
  readonly version?: FormulaVersion;
}

/** The versions of one formula, the last made first; a formula without versions is a group of one. */
export interface LibraryGroup {
  readonly key: string;
  readonly versions: readonly LibraryEntry[];
  /** When any of them last changed. */
  readonly modified: Date;
}

/** A version's name: the formula's, without a number it may carry, and the new one. «Lejía v2» gives «Lejía v3». */
export function versionName(name: string, number: number): string {
  const base = name.trim().replace(/\s+v\d+$/i, "");
  return `${base} v${number}`;
}

/** The next number of a family, over every version the library has of it. */
export function nextVersionNumber(entries: readonly LibraryEntry[], family: string, known: number): number {
  const numbers = entries.filter((e) => e.version?.family === family).map((e) => e.version!.number);
  return Math.max(known, ...numbers) + 1;
}

/** The library, one entry per formula with its versions inside; the one changed last first. */
export function groupLibrary(entries: readonly LibraryEntry[]): LibraryGroup[] {
  const groups = new Map<string, LibraryEntry[]>();
  for (const entry of entries) {
    const key = entry.version ? `family:${entry.version.family}` : `file:${entry.path}`;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return [...groups]
    .map(([key, list]) => ({
      key,
      versions: [...list].sort((a, b) => (b.version?.number ?? 0) - (a.version?.number ?? 0)),
      modified: new Date(Math.max(...list.map((e) => e.modified.getTime()))),
    }))
    .sort((a, b) => b.modified.getTime() - a.modified.getTime());
}
