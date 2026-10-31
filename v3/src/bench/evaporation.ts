import { Ratio } from "../core/arith/ratio";
import type { Part } from "../core/compose";
import type { Family } from "../db/catalog";

/**
 * What is left on the blotter as the hours pass (F5, V3-90): a material counts while its hours on a
 * blotter (neat, TGSC scale: `tenacity_hours`, V3-42) have not passed. An orientation, never a
 * measure: a material does not leave a mix as it leaves a blotter on its own, and it does not vanish
 * at once. What has no hours is said apart: never taken as gone, never as still there.
 */

/** The slider's stops, in hours: «just applied», then a log-like scale up to 600 h, the TGSC top. */
export const STOPS: readonly Ratio[] = [
  Ratio.ZERO,
  Ratio.of(1, 4),
  Ratio.of(1, 2),
  Ratio.of(1),
  Ratio.of(2),
  Ratio.of(4),
  Ratio.of(8),
  Ratio.of(12),
  Ratio.of(24),
  Ratio.of(48),
  Ratio.of(72),
  Ratio.of(120),
  Ratio.of(168),
  Ratio.of(300),
  Ratio.of(600),
];

export interface Evaporation {
  /** Aromatic materials in the formula. */
  readonly total: number;
  /** Still on the blotter, the heaviest first; `share` is of the aromatic matter as poured. */
  readonly left: readonly { readonly key: string; readonly name: string; readonly share: Ratio; readonly hours: Ratio }[];
  /** Already gone, the first to go first. */
  readonly gone: readonly { readonly key: string; readonly name: string; readonly hours: Ratio }[];
  /** Without hours, the heaviest first. */
  readonly unknown: readonly { readonly key: string; readonly name: string; readonly share: Ratio }[];
  /** What is left, of the aromatic matter as poured: only what has hours. */
  readonly leftShare: Ratio;
  /** What is left by family, each over what is left; a material without a family, its own slice (null). */
  readonly families: readonly { readonly family: Family | null; readonly share: Ratio }[];
}

/** null when there is nothing aromatic: nothing to evaporate. */
export function evaporation(parts: readonly Part[], at: Ratio, hoursOf: (key: string) => Ratio | null, familyOf: (key: string) => Family | null): Evaporation | null {
  const aromatic = parts.filter((p) => !p.material.solvent);
  const total = Ratio.sum(aromatic.map((p) => p.massUg));
  if (total.isZero()) return null;
  const left: { key: string; name: string; share: Ratio; hours: Ratio; mass: Ratio }[] = [];
  const gone: { key: string; name: string; hours: Ratio }[] = [];
  const unknown: { key: string; name: string; share: Ratio }[] = [];
  for (const p of aromatic) {
    const { key, name } = p.material;
    const hours = hoursOf(key);
    if (hours === null) unknown.push({ key, name, share: p.massUg.div(total) });
    // Still there while its hours have not passed: at exactly its hours, it is gone.
    else if (at.lt(hours)) left.push({ key, name, share: p.massUg.div(total), hours, mass: p.massUg });
    else gone.push({ key, name, hours });
  }
  const leftMass = Ratio.sum(left.map((l) => l.mass));
  const byFamily = new Map<Family | null, Ratio>();
  for (const l of left) {
    const family = familyOf(l.key);
    byFamily.set(family, (byFamily.get(family) ?? Ratio.ZERO).add(l.mass));
  }
  const families = leftMass.isZero()
    ? []
    : [...byFamily.entries()]
        .map(([family, mass]) => ({ family, share: mass.div(leftMass) }))
        .sort((a, b) => (a.family === null ? 1 : b.family === null ? -1 : b.share.cmp(a.share) || a.family.localeCompare(b.family)));
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "es");
  return {
    total: aromatic.length,
    left: left.sort((a, b) => b.share.cmp(a.share) || byName(a, b)).map(({ key, name, share, hours }) => ({ key, name, share, hours })),
    gone: gone.sort((a, b) => a.hours.cmp(b.hours) || byName(a, b)),
    unknown: unknown.sort((a, b) => b.share.cmp(a.share) || byName(a, b)),
    leftShare: leftMass.div(total),
    families,
  };
}
