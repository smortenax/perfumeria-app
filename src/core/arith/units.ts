import { Ratio } from "./ratio";

/**
 * Masses are counted in whole micrograms. The bench scale weighs to 1 mg, so a
 * microgram leaves three decimals of headroom for anything typed by hand.
 */
export const UG_PER_MG = 1_000n;
export const UG_PER_G = 1_000_000n;

export type MassUnit = "mg" | "g";

/**
 * Parses a mass typed by a person into whole micrograms. What cannot be
 * written exactly in micrograms is refused, never rounded.
 */
export function parseMass(text: string, unit: MassUnit): bigint {
  const value = Ratio.fromDecimal(text);
  if (value.sign() <= 0) {
    throw new RangeError(`A mass must be greater than zero: "${text}"`);
  }
  const micrograms = value.mul(Ratio.of(unit === "mg" ? UG_PER_MG : UG_PER_G));
  if (!micrograms.isInteger()) {
    throw new RangeError(`Finer than a microgram: "${text}" ${unit}`);
  }
  return micrograms.num;
}

/**
 * Parses a final concentration typed as a percentage ("10", "0,996") into the
 * fraction of pure matter in what is poured: 0 < fraction ≤ 1.
 */
export function parsePercent(text: string): Ratio {
  const percent = Ratio.fromDecimal(text);
  if (percent.sign() <= 0 || percent.gt(Ratio.of(100))) {
    throw new RangeError(`A percentage must be above 0 and at most 100: "${text}"`);
  }
  return percent.div(Ratio.of(100));
}
