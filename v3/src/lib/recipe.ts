import { Ratio } from "../core/arith/ratio";
import type { Composition, Line } from "../core/compose";

/**
 * «Usar la fórmula» (V3-59): the exact recipe for what you need. With the formula's own proportions,
 * how much to weigh of each line for a final product of so many grams, at the formula's concentration
 * (as it is, 1:1) or at another one; the rest is alcohol. Weights to the scale's milligram; what
 * rounding moves goes to the alcohol, so the recipe adds up to what you asked for.
 */

/** The scale weighs to the milligram (V3-59: «a la precisión de la báscula»). */
export const SCALE_UG = 1000n;

export interface RecipeLine {
  readonly line: Line;
  /** What to weigh of it, as it was poured (its dilution included). */
  readonly massUg: bigint;
}

export interface Recipe {
  readonly lines: readonly RecipeLine[];
  /** The concentrate: the lines together. */
  readonly concentrateUg: bigint;
  /** The alcohol that completes the final product. */
  readonly alcoholUg: bigint;
  readonly totalUg: bigint;
  /** The share of concentrate in the final product it makes. */
  readonly concentration: Ratio;
}

const round = (value: Ratio): bigint => ((2n * value.num + value.den * SCALE_UG) / (2n * value.den * SCALE_UG)) * SCALE_UG;

/**
 * The formula's own concentration (§3.3): its work batch over its final batch; 1 (no alcohol) when
 * either is unknown, which is said, never guessed.
 */
export function ownConcentration(workBatchUg: bigint | null, finalBatchUg: bigint | null): Ratio | null {
  if (!workBatchUg || !finalBatchUg || finalBatchUg < workBatchUg) return null;
  return Ratio.of(workBatchUg, finalBatchUg);
}

/** The recipe for `totalUg` of final product with `concentration` of concentrate (0 < c ≤ 1). */
export function recipe(composition: Composition, totalUg: bigint, concentration: Ratio): Recipe {
  if (composition.totalUg.isZero()) throw new Error("the formula is empty");
  if (totalUg <= 0n) throw new RangeError("a recipe weighs above 0");
  if (concentration.sign() <= 0 || concentration.gt(Ratio.ONE)) throw new RangeError("a concentration is above 0 % and at most 100 %");
  const concentrate = Ratio.of(totalUg).mul(concentration);
  const factor = concentrate.div(composition.totalUg);
  const lines = composition.lines.map((line) => ({ line, massUg: round(line.massUg.mul(factor)) }));
  const concentrateUg = lines.reduce((s, l) => s + l.massUg, 0n);
  const alcoholUg = totalUg - concentrateUg;
  if (alcoholUg < 0n) throw new RangeError("rounding left no room: ask for a little more");
  return { lines, concentrateUg, alcoholUg, totalUg, concentration };
}

export type MaxUseWarning = { readonly kind: "over"; readonly maxUse: Ratio } | { readonly kind: "partial"; readonly maxUse: Ratio } | null;

/**
 * Above the formula's own concentration, the IFRA warning (V3-59): over its maximum use in a finished
 * perfume, or, with IFRA data incomplete, «partial», never «fine» (§1.2).
 */
export function maxUseWarning(concentration: Ratio, report: { readonly maxUse: Ratio; readonly partial: boolean } | null): MaxUseWarning {
  if (!report) return null;
  if (report.partial) return { kind: "partial", maxUse: report.maxUse };
  return concentration.gt(report.maxUse) ? { kind: "over", maxUse: report.maxUse } : null;
}
