import type { Catalog, CatalogMaterial } from "../db/catalog";
import { casForm, normalize, search, type SearchIndex } from "../db/search";
import type { ImportRow } from "./read";

/**
 * Each row of an imported sheet against the glossary (V3-80, F19): found, doubtful (with its best
 * candidates) or not there. Pure; the list is reviewed and nothing is written until you confirm.
 */

export type MatchStatus = "found" | "doubtful" | "missing";

export interface Match {
  readonly row: ImportRow;
  readonly status: MatchStatus;
  /** Common materials (or yours, if it is only yours), best first; the first is the proposal. */
  readonly candidates: readonly CatalogMaterial[];
  /** How it was found, said in words by the screen. */
  readonly by: "cas" | "name" | "search" | null;
  /** A specification of yours of that material that you already have, if any. */
  readonly alreadyYours: CatalogMaterial | null;
}

/** The material a specification of yours stands for: the common one it is based on, or itself. */
const baseOf = (m: CatalogMaterial) => m.basedOnId ?? m.id;

export function matchRow(row: ImportRow, catalog: Catalog, index: SearchIndex): Match {
  const all = [...catalog.materials.values()].filter((m) => !m.solvent && m.kind !== "frozen");
  // Prefer the common one; yours only when the glossary has none.
  const prefer = (list: CatalogMaterial[]) => {
    const common = list.filter((m) => m.ownerId === null);
    return common.length > 0 ? common : list;
  };
  const yoursOf = (m: CatalogMaterial) =>
    [...catalog.materials.values()].find((x) => x.ownerId !== null && x.kind !== "frozen" && baseOf(x) === m.id && catalog.have.has(x.id)) ??
    (m.ownerId !== null && catalog.have.has(m.id) ? m : null);
  const done = (status: MatchStatus, candidates: CatalogMaterial[], by: Match["by"]): Match => ({
    row,
    status,
    candidates,
    by,
    alreadyYours: candidates[0] ? yoursOf(candidates[0]) : null,
  });

  const cas = casForm(row.cas);
  if (cas) {
    const byCas = prefer(all.filter((m) => m.cas === cas || m.otherCas.includes(cas)));
    if (byCas.length === 1) return done("found", byCas, "cas");
    if (byCas.length > 1) return done("doubtful", byCas.slice(0, 3), "cas");
  }
  const name = normalize(row.name || row.product).trim();
  if (name) {
    const byName = prefer(all.filter((m) => normalize(m.name) === name || m.aliases.some((a) => normalize(a) === name)));
    if (byName.length === 1) return done("found", byName, "name");
    if (byName.length > 1) return done("doubtful", byName.slice(0, 3), "name");
    const near = search(index, row.name || row.product, 5)
      .flatMap((r) => r.members.map((m) => m.material))
      .filter((m) => !m.solvent && m.kind !== "frozen")
      // A row with a valid CAS is not offered a similar name that has another CAS: Indol (120-72-9) is not Cashmeran.
      .filter((m) => {
        const own = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined;
        const its = [m.cas, ...m.otherCas, own?.cas, ...(own?.otherCas ?? [])].filter((c) => c);
        return !cas || its.length === 0 || its.includes(cas);
      });
    const unique = prefer([...new Map(near.map((m) => [m.id, m])).values()]).slice(0, 3);
    if (unique.length > 0) return done("doubtful", unique, "search");
  }
  return done("missing", [], null);
}

export function matchSheet(rows: readonly ImportRow[], catalog: Catalog, index: SearchIndex): Match[] {
  return rows.map((r) => matchRow(r, catalog, index));
}

/**
 * What «Confirm» does with a material chosen for a row: a specification of yours that you already
 * have is only marked again; one of yours, likewise; a common one becomes a new specification.
 */
export function targetOf(materialId: string, catalog: Catalog): { materialId: string; ownerId: string | null } {
  const m = catalog.materials.get(materialId);
  if (!m || m.ownerId !== null) return { materialId, ownerId: m?.ownerId ?? null };
  const yours = [...catalog.materials.values()].find((x) => x.ownerId !== null && x.kind !== "frozen" && x.basedOnId === m.id && catalog.have.has(x.id));
  return yours ? { materialId: yours.id, ownerId: yours.ownerId } : { materialId, ownerId: null };
}
