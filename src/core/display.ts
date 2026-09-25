import { Ratio } from "./arith/ratio";
import { UG_PER_G, UG_PER_MG } from "./arith/units";

// Formatting for people, in Spanish: comma as the decimal separator.
// This is the only place where numbers are rounded.

export function formatDecimal(value: Ratio, digits: number): string {
  return value.toFixed(digits).replace(".", ",");
}

/** A fraction of a whole, shown as a percentage: 1/4 → "25,000 %". */
export function formatPercent(fraction: Ratio, digits = 3): string {
  return `${formatDecimal(fraction.mul(Ratio.of(100)), digits)} %`;
}

/** A mass in micrograms, shown in grams: 8 745 000 µg → "8,745 g". */
export function formatGrams(micrograms: Ratio, digits = 3): string {
  return `${formatDecimal(micrograms.div(Ratio.of(UG_PER_G)), digits)} g`;
}

/** A mass in micrograms, shown in milligrams: 619 000 µg → "619 mg". */
export function formatMilligrams(micrograms: Ratio, digits = 0): string {
  return `${formatDecimal(micrograms.div(Ratio.of(UG_PER_MG)), digits)} mg`;
}
