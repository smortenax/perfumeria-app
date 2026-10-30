import { Ratio } from "../core/arith/ratio";
import type { Dilution } from "../db/catalog";
import { decimal } from "../glossary/format";

/**
 * «Dilutions» as a grid (V3-79): one card per material of yours, with a chip per dilution. A dilution
 * is information, not a material: it does not run out, it is only archived. Pure, so it can be tested.
 */

export interface Card {
  readonly materialId: string;
  readonly name: string;
  readonly bottles: readonly Dilution[];
}

export function cardsOf(
  all: readonly { readonly materialId: string; readonly d: Dilution }[],
  options: { readonly archived: boolean; readonly query: string; readonly nameOf: (materialId: string) => string },
): Card[] {
  const q = options.query.trim().toLowerCase();
  const byMaterial = new Map<string, Dilution[]>();
  for (const { materialId, d } of all) {
    if (d.archivedAt && !options.archived) continue;
    const name = options.nameOf(materialId);
    if (q && !name.toLowerCase().includes(q) && !(d.label ?? "").toLowerCase().includes(q)) continue;
    byMaterial.set(materialId, [...(byMaterial.get(materialId) ?? []), d]);
  }
  return [...byMaterial]
    .map(([materialId, bottles]) => ({
      materialId,
      name: options.nameOf(materialId),
      // The strongest first; the same strength, the newest first.
      bottles: [...bottles].sort((a, b) => b.fraction.cmp(a.fraction) || (b.madeOn ?? "").localeCompare(a.madeOn ?? "")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/**
 * The strength a bottle is known by (the user, 2026-10-30: «se registrará lo que ponga el usuario»):
 * the percentage you gave it when you made it («at 2.5 %») if it is close to what was weighed; if
 * not, or if you gave none, what was weighed rounded to the nearest whole number («9.94 %» → «10 %»).
 * Below half a percent, to its first figure («0.098 %» → «0.1 %»): never zero (§1.2). The exact
 * figure stays in the bottle and in every calculation; this is only how it reads.
 */
export function nominalPercent(fraction: Ratio, label: string | null): string {
  const real = Number(decimal(fraction.mul(Ratio.of(100)), 6));
  const given = label?.match(/(\d+(?:[.,]\d+)?)\s*%/)?.[1];
  const typed = given === undefined ? NaN : Number(given.replace(",", "."));
  const close = real >= 1 ? Math.max(0.5, real * 0.1) : real * 0.2;
  if (typed > 0 && Math.abs(typed - real) <= close) return `${typed} %`;
  if (real >= 0.5) return `${Math.round(real)} %`;
  return `${Number(real.toPrecision(1))} %`;
}

/** A diluent by its short name: its abbreviation, or its name without what goes in brackets («DPG (dipropylene glycol)» → «DPG»). */
export function shortName(m: { readonly name: string; readonly abbreviation: string | null } | undefined): string {
  if (!m) return "—";
  return m.abbreviation?.trim() || m.name.replace(/\s*\([^)]*\)\s*$/, "") || m.name;
}
