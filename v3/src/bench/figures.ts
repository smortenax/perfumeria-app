import { Ratio } from "../core/arith/ratio";
import type { Composition } from "../core/compose";

/**
 * What the bench's four big figures read from the composition (audit F-15 L2, V3-93): the share of the
 * bottle that is aromatic matter and how many aromatic materials it holds. null when there is nothing in
 * the bottle: then the figure says «—», never 0 %.
 */
export function headFigures(composition: Composition | null): { readonly aromaticShare: Ratio | null; readonly materials: number } {
  if (!composition || composition.totalUg.isZero()) return { aromaticShare: null, materials: 0 };
  return {
    aromaticShare: composition.aromaticUg.div(composition.totalUg),
    materials: composition.parts.filter((p) => !p.material.solvent).length,
  };
}
