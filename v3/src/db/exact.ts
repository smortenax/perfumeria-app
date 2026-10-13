import { Ratio } from "../core/arith/ratio";

/**
 * Exact numbers between the copy and the core (V3-9, plan step 3.1). The copy keeps
 * Postgres' `numeric` and `bigint` as text; these turn that text into `Ratio` and `bigint`
 * and back, never through a JavaScript number.
 */

/** A `numeric` as Postgres writes it ("0.05", "12", "-3.5"): null stays null, never zero. */
export function ratioFromNumeric(text: string | null | undefined): Ratio | null {
  if (text === null || text === undefined) {
    return null;
  }
  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    throw new SyntaxError(`Not a numeric: "${text}"`);
  }
  return Ratio.fromDecimal(text);
}

/**
 * A `Ratio` as an exact `numeric`. Only a fraction whose denominator has no factor but 2 and
 * 5 has an exact decimal; any other (1/3) throws, because rounding it here would hide it.
 */
export function numericFromRatio(value: Ratio): string {
  let den = value.den;
  let twos = 0;
  let fives = 0;
  while (den % 2n === 0n) {
    den /= 2n;
    twos++;
  }
  while (den % 5n === 0n) {
    den /= 5n;
    fives++;
  }
  if (den !== 1n) {
    throw new RangeError(`${value} has no exact decimal`);
  }
  const places = Math.max(twos, fives);
  if (places === 0) {
    return value.num.toString();
  }
  const scaled = (value.num * 10n ** BigInt(places)) / value.den;
  const sign = scaled < 0n ? "-" : "";
  const digits = (scaled < 0n ? -scaled : scaled).toString().padStart(places + 1, "0");
  const decimals = digits.slice(-places).replace(/0+$/, "");
  return `${sign}${digits.slice(0, -places)}${decimals ? `.${decimals}` : ""}`;
}

/** A `bigint` column, as the copy keeps it: text of digits. */
export function bigintFromText(text: string | null | undefined): bigint | null {
  if (text === null || text === undefined) {
    return null;
  }
  if (!/^-?\d+$/.test(text)) {
    throw new SyntaxError(`Not an integer: "${text}"`);
  }
  return BigInt(text);
}
