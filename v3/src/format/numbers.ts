import { Ratio } from "../core/arith/ratio";

/**
 * Numbers for people and for drawing, in one place (V3-111, rule R3). The exact figures stay as
 * Ratio and bigint (core/arith); this is where they are rounded, and only to be shown or drawn.
 * Point decimals (V3-71, the user 2026-10-30). The masses and percentages of the bench: core/display.
 */

/**
 * A Ratio with no trailing zeros, for the glossary's sheet and the dilutions. A value that is not zero
 * never shows as zero (§1.2): it takes as many decimals as it needs to show its first figure.
 */
export function decimal(value: Ratio, digits = 4): string {
  let fixed = value.toFixed(digits);
  for (let d = digits + 1; !value.isZero() && !/[1-9]/.test(fixed) && d <= 12; d++) fixed = value.toFixed(d);
  return fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed;
}

/** A fraction of a whole, as a percentage: 3/1000 → «0.3 %». */
export const percent = (fraction: Ratio, digits = 4): string => `${decimal(fraction.mul(Ratio.of(100)), digits)} %`;

/** A Ratio rounded to a fixed number of decimals, as text: 1/8 → «0.13» with 2. */
export const fixedRatio = (value: Ratio, digits: number): string => value.toFixed(digits);

/**
 * A Ratio as a plain number, to draw with (a bar's width, a slider's place): never to compute or to
 * store. Rounded to `digits` decimals first, so the number is the same on every device.
 */
export const drawn = (value: Ratio, digits = 6): number => Number(value.toFixed(digits));

/** A number that is already a measure on screen (a chart's share, a log scale), as text. */
export const fixedNumber = (value: number, digits: number): string => value.toFixed(digits);

/** A number rounded to `digits` decimals, without trailing zeros: 2.25 → 2.3, 2.0 → 2. */
export const roundedNumber = (value: number, digits: number): number => Number(value.toFixed(digits));

/** A date and time for people, in the app's one locale (V3-71). */
export const dateTime = (date: Date, options: Intl.DateTimeFormatOptions): string => date.toLocaleString("en-GB", options);
