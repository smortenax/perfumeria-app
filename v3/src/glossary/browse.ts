import type { MaterialKind } from "../db/catalog";
import type { Keep } from "../db/search";
import type { IfraCardState } from "../db/to-ifra";

/**
 * The glossary's filters (plan v3, step 6.1): the kind, common or yours, what you have and the
 * IFRA state of each material (V3-25: its own, never its category's). They pick materials, not
 * rows: a category shows the ones that pass.
 */
export type IfraState = IfraCardState["state"];

export interface Filters {
  readonly kind: MaterialKind | null;
  readonly owner: "common" | "own" | null;
  readonly haveOnly: boolean;
  readonly ifra: IfraState | null;
}

export const NO_FILTERS: Filters = { kind: null, owner: null, haveOnly: false, ifra: null };

export function keepOf(filters: Filters, have: ReadonlySet<string>, ifraOf: (id: string) => IfraState): Keep {
  return (m) =>
    (filters.kind === null || m.kind === filters.kind) &&
    (filters.owner === null || (filters.owner === "own") === (m.ownerId !== null)) &&
    (!filters.haveOnly || have.has(m.id)) &&
    (filters.ifra === null || ifraOf(m.id) === filters.ifra);
}
