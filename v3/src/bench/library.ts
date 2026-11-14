import type { CatalogEntry } from "./data/catalog";

/**
 * Which library the add bar's search looks in (the user, 2026-11-14: the button «debería alternar entre la
 * librería general incluso de las cosas que no tengo y la librería propia»): «all», the whole catalogue,
 * what you do not have too, to write a formula down without the material; «mine», your own library.
 */
export const LIBRARIES = ["all", "mine"] as const;
export type Library = (typeof LIBRARIES)[number];

/** Your library: your versions and your materials, what you marked «I have it», and the diluents to pour with. */
export function inMyLibrary(e: Pick<CatalogEntry, "group" | "material">, have: ReadonlySet<string> | undefined): boolean {
  return e.group === "own" || e.group === "diluent" || !!have?.has(e.material.key);
}

/**
 * The materials from Maese Lab's catalogue (2026-11-14), by what their data says: a common whose sources or
 * notes cite Maese Lab, or one of yours bought there; your version of such a common too.
 */
export function maeseKeys(
  materials: Iterable<{ readonly id: string; readonly basedOnId: string | null; readonly sources: string | null; readonly notes: string | null; readonly supplier: string | null }>,
): Set<string> {
  const list = [...materials];
  const says = (m: (typeof list)[number]) => /maese/i.test(`${m.sources ?? ""} ${m.notes ?? ""} ${m.supplier ?? ""}`);
  const direct = new Set(list.filter(says).map((m) => m.id));
  return new Set(list.filter((m) => direct.has(m.id) || (m.basedOnId !== null && direct.has(m.basedOnId))).map((m) => m.id));
}
