import { Ratio as R, type Ratio } from "../core/arith/ratio";
import type { Part } from "../core/compose";
import type { Catalog, Family } from "../db/catalog";
import { familyOf, PALETTE } from "./palette";

/**
 * A formula's composition by families (F2, V3-78): the share of the aromatic matter of each family,
 * the largest first, exact. A material without a family goes in its own slice (family null), drawn
 * neutral: it is never given to another family.
 */
export interface FamilyShare {
  readonly family: Family | null;
  readonly colour: string | null;
  readonly share: Ratio;
}

export function familyShares(parts: readonly Part[], catalog: Pick<Catalog, "materials" | "categories">): FamilyShare[] {
  const aromatic = parts.filter((p) => !p.material.solvent);
  const total = R.sum(aromatic.map((p) => p.massUg));
  if (total.isZero()) return [];
  const by = new Map<Family | null, { colour: string | null; mass: Ratio }>();
  for (const p of aromatic) {
    const m = catalog.materials.get(p.material.key);
    const family = m ? familyOf(catalog as Catalog, m) : null;
    // The family's colour in the palette (V3-38), not a colour fixed for one material.
    const colour = family ? (PALETTE.get(family)?.light ?? null) : null;
    const was = by.get(family);
    by.set(family, { colour: was?.colour ?? colour, mass: (was?.mass ?? R.ZERO).add(p.massUg) });
  }
  return [...by.entries()]
    .map(([family, v]) => ({ family, colour: v.colour, share: v.mass.div(total) }))
    .sort((a, b) => (a.family === null ? 1 : b.family === null ? -1 : b.share.cmp(a.share)));
}
