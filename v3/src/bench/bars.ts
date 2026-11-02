import { Ratio } from "../core/arith/ratio";

/**
 * The data as bar lengths (audit F-15 L2, D-0005: «data as bar lengths»), for the bench's lists. The
 * bars are a picture of the figure beside them, never instead of it: the figure stays, exact.
 */

/** A sliver for what is there but too small to see: never drawn as nothing. */
const SLIVER = 0.01;

/**
 * A line's bar in the composition, 0 to 1: its mass against the largest line's, from zero (ref-0081),
 * so the largest fills its track and the rest read against it. Zero only for a zero mass.
 */
export function barWidth(mass: Ratio, largest: Ratio): number {
  if (mass.isZero() || largest.isZero()) return 0;
  return Math.max(SLIVER, Math.min(1, Number(mass.div(largest).toFixed(6))));
}

/**
 * The lollipop of a line's IFRA (ref-0082): how much of its closest ceiling it uses, 0 to 1, the
 * ceiling being the end of the stick. At or past the ceiling, or prohibited (`used` null: present
 * and allowed none), the dot sits at the end and says «over».
 */
export function lollipopOf(used: Ratio | null): { readonly at: number; readonly over: boolean } {
  if (used === null || !used.lt(Ratio.ONE)) return { at: 1, over: true };
  return { at: Math.max(SLIVER, Number(used.toFixed(6))), over: false };
}
