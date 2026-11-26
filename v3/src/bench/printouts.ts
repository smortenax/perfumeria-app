import { compose } from "../core/compose";
import type { Formula } from "../core/model/formula";
import type { Ratio } from "../core/arith/ratio";
import { ownConcentration, recipe, type Recipe } from "../lib/recipe";

/**
 * What the formula's printouts take from it (moved out of Bench.tsx, 2026-11-26): the weighing sheet of
 * «Print or save as PDF» and the test label.
 */

/** The weighing sheet of the final batch, when the formula has one and its own concentration. */
export function weighingOf(formula: Formula): Recipe | null {
  const own = ownConcentration(formula.header.workBatchUg, formula.header.finalBatchUg);
  if (!own || !formula.header.finalBatchUg) return null;
  try {
    return recipe(compose(formula), formula.header.finalBatchUg, own);
  } catch {
    return null;
  }
}

/**
 * A test bottle of the formula: its name, the final batch (or, without one, what was poured, to the
 * microgram) and the concentrate's share of the final batch.
 */
export function trialOf(formula: Formula): { name: string; massUg: bigint | null; concentration: Ratio | null } {
  const poured = compose(formula).totalUg;
  return {
    name: formula.header.name,
    massUg: formula.header.finalBatchUg ?? (poured.isZero() ? null : poured.num / poured.den),
    concentration: ownConcentration(formula.header.workBatchUg, formula.header.finalBatchUg),
  };
}
