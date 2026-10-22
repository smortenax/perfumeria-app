/**
 * What a material orb shows, and how a material's data becomes it.
 * Prototype for Perfumería v3 (owner's feedback of 2026-10-22). Nothing here is a vault rule.
 * Copied with the rest of this folder from the design vault's kit (designVault,
 * 00-inbox/research/kit/material-orb, 2026-10-22): v3 keeps its own copy and imports nothing from the vault.
 *
 * Every value is 0..1 or undefined. Undefined means "no data" and draws neutral:
 * unknown never counts as zero.
 */

export type Note = "top" | "heart" | "base";
export type MaterialType = "pure" | "natural" | "blend";

export interface OrbFamily {
  /** CSS hex colour of the family, from the owner's palette (V3-38) or the user's pinned colour. */
  color: string;
  /** Share of the family, any positive number; normalised when drawn. */
  share: number;
}

export interface OrbLook {
  /** Up to three are drawn, largest first. Empty = neutral grey. */
  families: readonly OrbFamily[];
  /** Colour density: weak = milky and translucent, strong = dense. */
  intensity?: number;
  /** Glow that spreads into the frame. */
  diffusion?: number;
  /** Light from inside the orb (radiant, clean materials). */
  luminosity?: number;
  /** How much the edge wobbles: 0 = perfect sphere (pure molecule). */
  contour?: number;
  note?: Note;
  /** Hours on a strip; only the animated orb uses it (slower when longer). */
  durationHours?: number;
}

/** Defaults for missing values: a neutral middle, no glow, no inner light. */
export const NEUTRAL = { intensity: 0.5, diffusion: 0, luminosity: 0, contour: 0.3, weight: 0.45 } as const;
export const NEUTRAL_COLOR = "#8a8a8a";

/** Contour from the V3-70 material type and, for naturals, the process. */
export function contourOf(type: MaterialType | undefined, process?: string): number | undefined {
  if (type === "pure") return 0;
  if (type === "blend") return 0.6;
  if (type === "natural") {
    const p = (process ?? "").toLowerCase();
    return /absolute|resinoid|concrete|resin|balsam|tincture/.test(p) ? 0.8 : 0.5;
  }
  return undefined;
}

export function noteWeight(note: Note | undefined): number {
  return note === "top" ? 0 : note === "base" ? 1 : note === "heart" ? 0.45 : NEUTRAL.weight;
}

/**
 * Turns a raw number into 0..1 by its rank among all known values of that attribute.
 * Use it for potency and diffusion while their scales are undecided ("escala de potencia" is open).
 */
export function percentileScale(values: readonly number[]): (value: number | undefined) => number | undefined {
  const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  return (value) => {
    if (value === undefined || !Number.isFinite(value) || sorted.length === 0) return undefined;
    if (sorted.length === 1) return 0.5;
    let below = 0;
    while (below < sorted.length && sorted[below] < value) below++;
    let equal = 0;
    while (below + equal < sorted.length && sorted[below + equal] === value) equal++;
    return (below + Math.max(equal - 1, 0) / 2) / (sorted.length - 1);
  };
}

/** Linear 0..10 scale to 0..1 (for an owner-set value such as luminosity). */
export function tenScale(value: number | undefined): number | undefined {
  return value === undefined || !Number.isFinite(value) ? undefined : Math.min(1, Math.max(0, value / 10));
}

/** The values the shader takes, after defaults. */
export interface OrbUniforms {
  colors: [string, string, string];
  /** Where colour 2 and colour 3 start on the 0..1 field (2 = never). */
  t1: number;
  t2: number;
  density: number;
  glow: number;
  light: number;
  contour: number;
  weight: number;
  /** Animation speed factor for the live orb. */
  speed: number;
}

export function uniformsOf(look: OrbLook): OrbUniforms {
  const fams = look.families.filter((f) => f.share > 0).slice().sort((a, b) => b.share - a.share).slice(0, 3);
  const total = fams.reduce((s, f) => s + f.share, 0) || 1;
  const colors = fams.map((f) => f.color);
  while (colors.length < 3) colors.push(colors[colors.length - 1] ?? NEUTRAL_COLOR);
  return {
    colors: colors as [string, string, string],
    t1: fams.length > 1 ? fams[0].share / total : 2,
    t2: fams.length > 2 ? (fams[0].share + fams[1].share) / total : 2,
    density: look.intensity ?? NEUTRAL.intensity,
    glow: look.diffusion ?? NEUTRAL.diffusion,
    light: look.luminosity ?? NEUTRAL.luminosity,
    contour: look.contour ?? NEUTRAL.contour,
    weight: noteWeight(look.note),
    speed: 0.9 / (1 + Math.log2(1 + (look.durationHours ?? 24)) / 2.2),
  };
}

/** A stable key for a look at a pixel size: identical looks share one cached still. */
export function lookKey(look: OrbLook, px: number): string {
  const u = uniformsOf(look);
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return [px, ...u.colors, r(u.t1), r(u.t2), r(u.density), r(u.glow), r(u.light), r(u.contour), r(u.weight)].join("|");
}
