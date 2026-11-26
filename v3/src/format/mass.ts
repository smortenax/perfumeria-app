import { Ratio } from "../core/arith/ratio";
import { type MassUnit, UG_PER_G, UG_PER_MG } from "../core/arith/units";

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

/**
 * A mass in either unit of the scale, exact (2026-11-26, ui/MassInput.tsx): 1 030 000 µg → «1030» mg or «1.03» g;
 * below the unit, the decimals it needs and no more, never rounded.
 */
export function massText(ug: bigint, unit: MassUnit): string {
  if (unit === "mg") return mgText(ug);
  const whole = ug / UG_PER_G;
  const rest = (ug < 0n ? -ug : ug) % UG_PER_G;
  if (rest === 0n) return whole.toString();
  const sign = ug < 0n && whole === 0n ? "-" : "";
  return `${sign}${whole}.${rest.toString().padStart(6, "0").replace(/0+$/, "")}`;
}

/** A mass as written in `unit` («1030» mg, «1,03» g) to micrograms; null if empty, not a number, finer than a microgram or not above 0. */
export const massToUg = (text: string, unit: MassUnit): bigint | null => (unit === "mg" ? mgToUg(text) : gramsToUg(text));

/** The same mass written in another unit: «1030» mg is «1.03» g. What is not a mass yet («1,», «») stays as it is. */
export function convertMassText(text: string, from: MassUnit, to: MassUnit): string {
  if (from === to) return text;
  const ug = massToUg(text, from);
  return ug === null ? text : massText(ug, to);
}
