import { Ratio } from "../core/arith/ratio";
import { UG_PER_G } from "../core/arith/units";

/**
 * Masses as people type and read them in grams, in one place (V3-111, rule R3). Masses are whole
 * micrograms (core/arith/units); the bench's own readings are core/display's formatGrams.
 */

/** Grams as the scale shows them: 1 030 000 µg → «1.030». */
export const gramsText = (ug: bigint): string => Ratio.of(ug, UG_PER_G).toFixed(3);

/** Grams as written («0,800») to micrograms; null if empty, not a number, finer than a microgram or not above 0. */
export function gramsToUg(text: string): bigint | null {
  if (!text.trim()) return null;
  try {
    const ug = Ratio.fromDecimal(text).mul(Ratio.of(UG_PER_G));
    return ug.isInteger() && ug.sign() > 0 ? ug.num : null;
  } catch {
    return null;
  }
}

/** «1,03» or «1.03» → micrograms, to the milligram (three decimals at most); null while it is not a weight. */
export function scaleGramsToUg(text: string): bigint | null {
  const clean = text.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(clean)) return null;
  const ug = Ratio.fromDecimal(clean).mul(Ratio.of(UG_PER_G));
  return ug.num / ug.den;
}
