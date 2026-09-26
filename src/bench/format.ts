import { Ratio } from "../core/arith/ratio";
import { formatDecimal, formatGrams, formatMilligrams, formatPercent } from "../core/display";
import { texts } from "../i18n/es";

const ONE_MG = Ratio.of(1_000);
const TEN_MG = Ratio.of(10_000);
const ONE_G = Ratio.of(1_000_000);

/** A mass to read: grams from 1 g up, milligrams below, with one decimal under 10 mg. */
export function massText(micrograms: Ratio): string {
  if (!micrograms.lt(ONE_G)) {
    return formatGrams(micrograms, 3);
  }
  return formatMilligrams(micrograms, micrograms.lt(TEN_MG) ? 1 : 0);
}

/** A fraction as a percent without trailing zeros: 1/10 is "10 %", 1/200 is "0,5 %". */
export function dilutionText(fraction: Ratio): string {
  const text = formatDecimal(fraction.mul(Ratio.of(100)), 3).replace(/,?0+$/, "");
  return `${text} %`;
}

/**
 * A part's share of the bottle (§1.1: % of the bottle, of pure matter). Traces
 * under 1 mg go in ppm, and the exact figure is kept for the tooltip (Banco v2, §7).
 */
export function shareText(part: Ratio, total: Ratio): { text: string; exact: string } {
  const fraction = total.isZero() ? Ratio.ZERO : part.div(total);
  const exact = formatPercent(fraction, 6);
  if (part.lt(ONE_MG)) {
    return { text: `${formatDecimal(fraction.mul(Ratio.of(1_000_000)), 0)} ${texts.composition.ppm}`, exact };
  }
  return { text: formatPercent(fraction, 3), exact };
}

/** Weighing warnings of the Banco v2 (§7), for a 1 mg scale: under 20 mg shows its error, under 5 mg is unweighable. */
export function weighingWarning(massUg: bigint): { kind: "unweighable" | "error"; text: string } | null {
  if (massUg < 5_000n) {
    return { kind: "unweighable", text: texts.history.unweighable };
  }
  if (massUg < 20_000n) {
    return { kind: "error", text: texts.history.weighError(formatPercent(Ratio.of(1_000n, massUg), 0)) };
  }
  return null;
}

/** The letters of a material's piece in the dock: initials of up to three words, or the first three letters. */
export function initials(name: string): string {
  const words = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w !== "");
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0].toUpperCase())
      .join("");
  }
  const word = words[0] ?? "?";
  return word[0].toUpperCase() + word.slice(1, 3);
}
