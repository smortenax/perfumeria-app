import { Ratio } from "../../src/core/arith/ratio.ts";

/**
 * How the report writes what the engine counts. Every figure stays exact («a/b»); the percentage next to it is
 * only for reading, and is written exactly when it has an exact decimal.
 */

/** A fraction of something, as a percentage with a comma: «1/10000» → «0,01 %». */
export function percent(fraction: string): string {
  const value = Ratio.parse(fraction).mul(Ratio.of(100));
  let den = value.den;
  let places = 0;
  for (const p of [2n, 5n]) {
    let n = 0;
    while (den % p === 0n) {
      den /= p;
      n++;
    }
    places = Math.max(places, n);
  }
  const exact = den === 1n;
  const text = value.toFixed(exact ? places : 6).replace(".", ",");
  return `${exact ? "" : "≈ "}${text} %`;
}

/** «1/10000», «≤ 1/200», «sin cota» or «—», with the percentage beside the fraction. */
export function load(text: string): string {
  const bound = text.startsWith("≤ ");
  const body = bound ? text.slice(2) : text;
  return /^\d+(\/\d+)?$/.test(body) ? `${bound ? "≤ " : ""}${body} (${percent(body)})` : text;
}

/** A cell of the CSV (RFC 4180). */
export const cell = (text: string): string => (/[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);

/** A cell of a Markdown table: no bars, no line breaks. */
export const md = (text: string): string => text.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
