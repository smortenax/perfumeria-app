import type { FormulaRecord } from "../db/formulas";

/**
 * The list of formulas (F1, V3-78): what a row says before opening it, and its order. Pure, from
 * the formulas and their steps as the copy has them.
 */

export interface EventRow {
  readonly id: string;
  readonly formulaId: string | null;
  readonly kind: string | null;
  readonly materialId: string | null;
  readonly target: string | null;
  readonly createdAt: string | null;
}

export interface Preview {
  /** The materials it carries now (a removed pour does not count). */
  readonly materials: number;
  /** Its last change: a step, or its header, whichever is later; null when nothing says. */
  readonly lastChange: string | null;
}

const later = (a: string | null, b: string | null) => (a === null ? b : b === null ? a : a > b ? a : b);

export function previewsOf(formulas: readonly FormulaRecord[], events: readonly EventRow[]): Map<string, Preview> {
  const removed = new Set(events.filter((e) => e.kind === "remove" && e.target).map((e) => e.target));
  const materials = new Map<string, Set<string>>();
  const last = new Map<string, string | null>();
  for (const e of events) {
    if (!e.formulaId) continue;
    last.set(e.formulaId, later(last.get(e.formulaId) ?? null, e.createdAt));
    if (e.kind === "add" && e.materialId && !removed.has(e.id)) {
      const set = materials.get(e.formulaId) ?? new Set<string>();
      set.add(e.materialId);
      materials.set(e.formulaId, set);
    }
  }
  return new Map(
    formulas.map((f) => [f.id, { materials: materials.get(f.id)?.size ?? 0, lastChange: later(later(f.createdAt, f.updatedAt), last.get(f.id) ?? null) }]),
  );
}

export const SORTS = ["versions", "name", "changed"] as const;
export type Sort = (typeof SORTS)[number];

/**
 * In the order chosen: «versions» leaves them as they come (each mother with its versions); by name;
 * or the last changed first (one with no date, last). Favorites always go first, in that same order.
 */
export function sortFormulas(list: readonly FormulaRecord[], sort: Sort, previews: ReadonlyMap<string, Preview>): FormulaRecord[] {
  const ordered =
    sort === "name"
      ? [...list].sort((a, b) => a.name.localeCompare(b.name, "es"))
      : sort === "changed"
        ? [...list].sort((a, b) => (previews.get(b.id)?.lastChange ?? "").localeCompare(previews.get(a.id)?.lastChange ?? ""))
        : [...list];
  const favorite = (f: FormulaRecord) => f.markers.includes("favorite");
  return [...ordered.filter(favorite), ...ordered.filter((f) => !favorite(f))];
}
