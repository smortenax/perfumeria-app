import type { Ratio } from "../core/arith/ratio";
import { formatDecimal } from "../core/display";

/** Parts as written: «18», «0.5», never «0.500». */
export const partsText = (parts: Ratio) =>
  formatDecimal(parts, parts.isInteger() ? 0 : 3)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");

/**
 * Drops as typed (bandeja del laboratorio, 2026-11-18: «ajustar en tiempo real el número de gotas
 * (entero) de cada uno»): a whole number, 0 or more; anything else is not a count of drops.
 */
export function dropsOf(text: string): number | null {
  const t = text.trim();
  return /^\d{1,6}$/.test(t) ? Number(t) : null;
}

/** One drop more or less, to the next whole drop: 2.5 goes to 3 or 2, never below 0. */
export function stepDrops(parts: Ratio, by: 1 | -1): number {
  const at = Number(parts.num) / Number(parts.den);
  const next = by > 0 ? Math.floor(at) + 1 : Math.ceil(at) - 1;
  return Math.max(0, next);
}
