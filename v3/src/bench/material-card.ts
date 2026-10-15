import { Ratio } from "../core/arith/ratio";
import { breakdown, type Composition } from "../core/compose";
import type { Material } from "../core/model/material";

/**
 * What the formula holds of the material shown in its card (P57): its pure matter and
 * the share of it that counts on its base, which is always named (§1.1).
 */
export interface Carried {
  /** The pure matter of the material in the bottle, as the composition counts it. */
  readonly pureUg: Ratio;
  /** The part of it that counts on the base below: for a formula used as a material, its aromatic matter. */
  readonly countedUg: Ratio;
  /** What the share is a share of: the aromatic matter, as the composition; the whole bottle for a solvent. */
  readonly base: "aromatic" | "bottle";
  readonly baseUg: Ratio;
}

/**
 * How much of a material the composition holds now, wherever it came from: poured itself, or
 * inside a formula used as a material (§10.3). A material the formula does not carry is a
 * known zero, not a gap.
 */
export function carriedOf(composition: Composition | null, material: Material): Carried {
  const base = material.solvent ? "bottle" : "aromatic";
  if (!composition) {
    return { pureUg: Ratio.ZERO, countedUg: Ratio.ZERO, base, baseUg: Ratio.ZERO };
  }
  if (material.kind === "formula") {
    // A formula used as a material is frozen as its vector (§2.4): the composition holds its
    // components and never its own key, so what it carries is read from the lines that poured it.
    const own = composition.lines.filter((line) => line.material.key === material.key);
    return {
      pureUg: Ratio.sum(own.map((line) => line.massUg.mul(line.fraction))),
      countedUg: Ratio.sum(own.flatMap(breakdown).filter((part) => !part.material.solvent).map((part) => part.massUg)),
      base: "aromatic",
      baseUg: composition.aromaticUg,
    };
  }
  const pureUg = composition.parts.find((part) => part.material.key === material.key)?.massUg ?? Ratio.ZERO;
  return { pureUg, countedUg: pureUg, base, baseUg: base === "bottle" ? composition.totalUg : composition.aromaticUg };
}

/**
 * The strip of the usual use runs from 0,001 % to 100 % on a log scale (P57, P59): between a
 * trace and a bulk material there are four orders of magnitude, and on a linear scale the
 * traces would not show. Five decades, so its six ticks sit every fifth of the strip.
 */
const LOG_MIN = -5;
const LOG_MAX = 0;
export const USAGE_DECADES = LOG_MAX - LOG_MIN;

/**
 * Where a share of the aromatic matter falls on the strip: 0 at 0,001 %, 1 at 100 %; what lies
 * outside is held to the edge. Null when there is nothing to place, because a zero has no
 * place on a log scale. It is a position to draw, not a quantity.
 */
export function usagePosition(share: Ratio): number | null {
  if (share.sign() <= 0) {
    return null;
  }
  const value = Number(share.toFixed(9));
  if (value <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, (Math.log10(value) - LOG_MIN) / (LOG_MAX - LOG_MIN)));
}
