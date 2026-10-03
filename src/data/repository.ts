import type { IfraData } from "../core/ifra";
import type { MaterialDetail } from "../v2/to-ifra";
import { searchCatalog, type CatalogEntry, type ScentFamily } from "./catalog";

/** Which model of materials the bench reads: the glossary (v1) or datos/v2/ (docs/v2/). */
export type ModelVersion = "v1" | "v2";

/**
 * What the bench needs of the materials, whichever model they come from: find them, get one by
 * its key, and the IFRA data of all of them. The bench receives one; it never imports a catalog.
 */
export interface MaterialRepository {
  readonly version: ModelVersion;
  /** Every material it knows, for the add bar, which groups them by plant and maker itself. */
  readonly entries: readonly CatalogEntry[];
  search(query: string, limit?: number): CatalogEntry[];
  get(key: string): CatalogEntry | undefined;
  ifraData(): IfraData;
  readonly families: readonly ScentFamily[];
  /**
   * Only the v2: what the interface needs to explain the IFRA data, parallel to it: the condition states (D11) and which pending
   * entries are specifications to prove. Keyed by the key of the material.
   */
  readonly details?: ReadonlyMap<string, MaterialDetail>;
  /** The IFRA amendment its limits come from, and the date its data was generated. */
  readonly source: { readonly amendment: string; readonly generated: string };
}

/** A repository over a list of entries and their IFRA data: the v1 catalog, or the v2 one. */
export function repositoryOf(
  version: ModelVersion,
  catalog: {
    readonly entries: readonly CatalogEntry[];
    readonly ifra: IfraData;
    readonly details?: ReadonlyMap<string, MaterialDetail>;
    readonly families: readonly ScentFamily[];
    readonly source: { readonly amendment: string; readonly generated: string };
  },
): MaterialRepository {
  const byKey = new Map(catalog.entries.map((e) => [e.material.key, e]));
  return {
    version,
    entries: catalog.entries,
    search: (query, limit) => searchCatalog(catalog.entries, query, limit),
    get: (key) => byKey.get(key),
    ifraData: () => catalog.ifra,
    ...(catalog.details ? { details: catalog.details } : {}),
    families: catalog.families,
    source: catalog.source,
  };
}
