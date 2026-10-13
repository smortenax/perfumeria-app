/**
 * A percentage of the v2 («0.2», «12.5», «100») as the exact fraction the v3 keeps («0.002»,
 * «0.125», «1»): the decimal point moves two places, never through a float.
 */
export function pctToFraction(text: string): string {
  const t = text.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) throw new Error(`No es un porcentaje: «${text}»`);
  const [int, frac = ""] = t.split(".");
  const digits = (int + frac).replace(/^0+/, "") || "0";
  const scale = frac.length + 2;
  const padded = digits.padStart(scale + 1, "0");
  const whole = padded.slice(0, -scale).replace(/^0+(?=\d)/, "");
  const decimals = padded.slice(-scale).replace(/0+$/, "");
  return decimals ? `${whole}.${decimals}` : whole;
}
