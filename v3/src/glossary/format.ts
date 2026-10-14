import { Ratio } from "../core/arith/ratio";

/**
 * Numbers for people on the glossary's sheet: comma decimals and no trailing zeros. The only
 * rounding is here, at the end; a value that is not zero never shows as zero (§1.2): it takes
 * as many decimals as it needs to show its first figure.
 */
export function decimal(value: Ratio, digits = 4): string {
  let fixed = value.toFixed(digits);
  for (let d = digits + 1; !value.isZero() && !/[1-9]/.test(fixed) && d <= 12; d++) fixed = value.toFixed(d);
  const trimmed = fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed;
  return trimmed.replace(".", ",");
}

/** A fraction of a whole, as a percentage: 3/1000 → «0,3 %». */
export const percent = (fraction: Ratio, digits = 4): string => `${decimal(fraction.mul(Ratio.of(100)), digits)} %`;
