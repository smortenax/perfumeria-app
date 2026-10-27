import type { Dilution } from "../db/catalog";

/**
 * «Dilutions» as a grid (V3-79): one card per material of yours, with a chip per dilution. A dilution
 * is information, not a material: it does not run out, it is only archived. Pure, so it can be tested.
 */

export interface Card {
  readonly materialId: string;
  readonly name: string;
  readonly bottles: readonly Dilution[];
}

export function cardsOf(
  all: readonly { readonly materialId: string; readonly d: Dilution }[],
  options: { readonly archived: boolean; readonly query: string; readonly nameOf: (materialId: string) => string },
): Card[] {
  const q = options.query.trim().toLowerCase();
  const byMaterial = new Map<string, Dilution[]>();
  for (const { materialId, d } of all) {
    if (d.archivedAt && !options.archived) continue;
    const name = options.nameOf(materialId);
    if (q && !name.toLowerCase().includes(q) && !(d.label ?? "").toLowerCase().includes(q)) continue;
    byMaterial.set(materialId, [...(byMaterial.get(materialId) ?? []), d]);
  }
  return [...byMaterial]
    .map(([materialId, bottles]) => ({
      materialId,
      name: options.nameOf(materialId),
      // The strongest first; the same strength, the newest first.
      bottles: [...bottles].sort((a, b) => b.fraction.cmp(a.fraction) || (b.madeOn ?? "").localeCompare(a.madeOn ?? "")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
