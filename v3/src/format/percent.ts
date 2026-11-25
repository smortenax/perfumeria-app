import { Ratio } from "../core/arith/ratio";

/**
 * Percentages as people type them («10», «9,97», «0.5»), read in one place (V3-111, rule R3). The
 * strict reading that refuses 0 and over 100 is core/arith/units' parsePercent.
 */

/** A % as written to a fraction; null if empty or not a decimal number. */
export function percentToFraction(text: string): Ratio | null {
  if (!text.trim()) return null;
  try {
    return Ratio.fromDecimal(text).div(Ratio.of(100n));
  } catch {
    return null;
  }
}

/** The same, but only plain digits with one decimal mark («10», «9,5»): null while it is being typed. */
export function digitsPercentToFraction(text: string): Ratio | null {
  const clean = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  return Ratio.fromDecimal(clean).div(Ratio.of(100n));
}

/** Two percentages as typed are the same one, whatever their decimal mark: «0,5» and «0.5». */
export const samePercentText = (a: string, b: string): boolean => a.replace(",", ".") === b.replace(",", ".");
