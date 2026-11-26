import { Ratio } from "../core/arith/ratio";
import { UG_PER_G, UG_PER_MG } from "../core/arith/units";

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

/**
 * Milligrams, for weighing a batch of dilutions without dots and zeros (the user, 2026-11-26: «que el
 * peso base este en mg asi me ahorro bastantes puntos y ceros»): 1 030 000 µg → «1030»; below a
 * milligram, the decimals it needs («0.5»).
 */
export const mgText = (ug: bigint): string => {
  const whole = ug / UG_PER_MG;
  const rest = (ug < 0n ? -ug : ug) % UG_PER_MG;
  if (rest === 0n) return whole.toString();
  const sign = ug < 0n && whole === 0n ? "-" : "";
  return `${sign}${whole}.${rest.toString().padStart(3, "0").replace(/0+$/, "")}`;
};

/** Milligrams as written («1030», «0,5») to micrograms; null if empty, not a number, finer than a microgram or not above 0. */
export function mgToUg(text: string): bigint | null {
  if (!text.trim()) return null;
  try {
    const ug = Ratio.fromDecimal(text).mul(Ratio.of(UG_PER_MG));
    return ug.isInteger() && ug.sign() > 0 ? ug.num : null;
  } catch {
    return null;
  }
}

/** Grams as a sheet writes them («1.03») to milligrams to type («1030»); what is not a weight stays as it is. */
export const gramsToMgText = (text: string): string => {
  const ug = gramsToUg(text);
  return ug === null ? text : mgText(ug);
};
