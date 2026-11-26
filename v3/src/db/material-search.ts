import type { Catalog, CatalogMaterial } from "./catalog";
import { fold, normalize, type SearchEntry } from "../lib/search";
import { texts } from "../i18n/en";

/**
 * What a material is found by, made once for every search of a material (2026-11-26): the bench's add bar
 * (bench/v3-repository.ts) and the MaterialPicker of dilutions, strips and the planner read the same fields,
 * so a material that one finds, the other finds too. A version is also found by its common material's names,
 * CAS, species and INCI (V3-5), and by its bottle: the product as the shop names it.
 */
export interface SearchFields {
  readonly abbreviation: string | null;
  readonly cas: string;
  readonly aliases: readonly string[];
  readonly search: string;
  readonly folded: readonly string[];
}

export function searchFieldsOf(catalog: Catalog, m: CatalogMaterial): SearchFields {
  const base = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined;
  const pick = <T,>(get: (x: CatalogMaterial) => T | null | undefined): T | null => get(m) ?? (base ? (get(base) ?? null) : null);
  const abbreviation = pick((x) => x.abbreviation);
  const cas = pick((x) => x.cas) ?? "";
  const aliases = [...new Set([...m.aliases, ...(base?.aliases ?? [])])];
  const names = [m.name, ...aliases, ...(m.product ? [m.product] : [])];
  return {
    abbreviation,
    cas,
    aliases,
    search: normalize([abbreviation ?? "", ...names, cas, ...m.otherCas, ...(base?.otherCas ?? []), pick((x) => x.species) ?? "", pick((x) => x.inci) ?? ""].join(" ")),
    folded: names.map(fold),
  };
}

/** A row of a MaterialPicker: the material's id, its name, what tells it from another of the same name, and its search fields. */
export interface PickOption extends SearchEntry {
  readonly id: string;
  readonly name: string;
  /** The house or shop of your version, «common» for the common one: two «Hedione» are told apart. */
  readonly detail?: string;
}

/**
 * The materials a picker offers, in the order it shows them with nothing typed (by name). `keep` says which:
 * `inMyLibrary` for what you can weigh (dilutions), as «My library» in the add bar.
 */
export function pickOptionsOf(catalog: Catalog, keep: (m: CatalogMaterial) => boolean): PickOption[] {
  const options: PickOption[] = [];
  for (const m of catalog.materials.values()) {
    if (m.kind === "frozen" || !keep(m)) continue;
    const f = searchFieldsOf(catalog, m);
    const detail = m.ownerId !== null ? (m.supplier ?? m.product ?? undefined) : texts.picker.common;
    options.push({
      id: m.id,
      name: m.name,
      material: { name: m.name },
      group: m.ownerId !== null ? "own" : m.solvent ? "diluent" : "base",
      code: f.abbreviation ?? "",
      cas: f.cas,
      search: f.search,
      folded: f.folded,
      ...(detail ? { detail } : {}),
    });
  }
  return options.sort((a, b) => a.name.localeCompare(b.name, "es") || (a.group === "own" ? -1 : 0) - (b.group === "own" ? -1 : 0));
}

/**
 * What you can dilute and weigh: as «My library» in the add bar (bench/library.ts), your versions and
 * the common materials you marked «I have it»; not the diluents, which are poured, not diluted.
 */
export const inMyBench = (catalog: Catalog) => (m: CatalogMaterial): boolean => !m.solvent && (m.ownerId !== null || catalog.have.has(m.id));
