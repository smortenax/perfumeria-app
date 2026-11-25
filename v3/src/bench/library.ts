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
