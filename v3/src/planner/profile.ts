import type { Ratio } from "../core/arith/ratio";
import type { Family, Tier } from "../db/catalog";

/**
 * The aromatic profile planner (V3-98), phase 1: how the space is shared among a formula's materials
 * as the hours pass, on a blotter. Nothing here is a measure:
 *
 * - The **index** of a material is parts × impact (1–10, PerfuMate; V3-97): a relative odour value,
 *   not an intensity. Multiplying by the amount comes from Raoult's law; the impact stands in for
 *   the odour threshold, which only 8 commons have as a number.
 * - The **perceived** view raises the index to an exponent (Stevens: 0.15–0.3 in Cain 1969,
 *   Berglund 1971, Doty 1975); 0.25 by default, an assumption the user can change.
 * - Each material fades along a **shape**, stretched to its hours on a blotter (`tenacity_hours`,
 *   TGSC scale), and reaches nothing at those hours. The plateau is two exponentials: a fast part
 *   gone in the first hour and a slow one (1/3 by default) that holds (Kasting 2003 measured one or
 *   two exponentials on skin; the 1/3 is the user's description of resins).
 * - A material **competes** while it reaches 1/3 of the strongest at that moment (the strongest
 *   describes the mix: Cain 1995). Over 4, a warning: a nose identifies 3 or 4 at most (Livermore
 *   and Laing 1996). The 1/3 is a session proposal, to calibrate with the user's tastings.
 *
 * The curves are estimates in floating point: they never become a mass, and they are rounded when
 * shown. The parts stay exact until they enter the index.
 */

export const SHAPE_IDS = ["fleeting", "top", "heart", "plateau", "linear"] as const;
export type ShapeId = (typeof SHAPE_IDS)[number];

/** Anchors of each shape: [hours, level relative to the opening]. The session's, without a source, but the plateau. */
const ANCHORS: Record<Exclude<ShapeId, "plateau">, readonly (readonly [number, number])[]> = {
  /** Citrus, green leaves: very strong at first, falls within minutes. */
  fleeting: [
    [0, 1],
    [0.25, 0.45],
    [2, 0.1],
  ],
  /** Lavender, linalool: strong, falls along the first hours. */
  top: [
    [0, 1],
    [0.5, 0.7],
    [2, 0.4],
  ],
  /** Florals, spices: holds a few hours, then goes down. */
  heart: [
    [0, 1],
    [2, 0.8],
    [8, 0.5],
  ],
  /** Musks, ambery woods: almost flat, goes down very slowly. */
  linear: [
    [0, 1],
    [0.5, 0.85],
    [24, 0.6],
  ],
};

/** The plateau's slow part, by default: what is left after the first hour (the user, on resins). */
export const PLATEAU_SLOW = 1 / 3;
/** The plateau's fast part fades with this time constant, in hours: gone within the first hour. */
const PLATEAU_FAST_HOURS = 0.3;
/** The perceived view's exponent, by default (Stevens; an assumption). */
export const PERCEIVED_EXPONENT = 0.25;
/** A material competes while it reaches this fraction of the strongest (a session proposal). */
export const COMPETE_FRACTION = 1 / 3;
/** Over this many competing, the planner warns: a nose identifies 3 or 4 at most. */
export const IDENTIFY_MAX = 4;

/** Time is drawn and interpolated in log(t + 0.05 h), so the first minutes are not crushed. */
const LOG_OFFSET = 0.05;
const logTime = (t: number) => Math.log(t + LOG_OFFSET);

/**
 * The level of a shape at `t` hours, for a material that lasts `hours` on a blotter: 1 when it is
 * applied, 0 from its hours on. The anchors at or past its hours are dropped, and it falls to 0 there.
 */
export function level(shape: ShapeId, hours: number, t: number, slow = PLATEAU_SLOW): number {
  if (!(hours > 0) || t >= hours) return 0;
  if (t <= 0) return 1;
  if (shape === "plateau") {
    // A fast part and a slow one (τ = H/3, so it holds for the first hours), shifted to end at 0 at H.
    const at = (u: number) => (1 - slow) * Math.exp(-u / PLATEAU_FAST_HOURS) + slow * Math.exp((-3 * u) / hours);
    const end = at(hours);
    return Math.max(0, (at(t) - end) / (1 - end));
  }
  const points = [...ANCHORS[shape].filter(([h]) => h < hours), [hours, 0] as const];
  for (let k = 0; k < points.length - 1; k++) {
    const [a, ya] = points[k];
    const [b, yb] = points[k + 1];
    if (t <= b) return ya + ((yb - ya) * (logTime(t) - logTime(a))) / (logTime(b) - logTime(a));
  }
  return 0;
}

const RESINOUS = /resin|balsam|benzoin|labdanum|styrax|storax|tolu|opopanax|myrrh|frankincense|olibanum|peru|elemi|ambergris|castoreum|oakmoss|tonka|vanill|coumarin/i;

/**
 * The shape a material starts with, until the user picks another (a session proposal, V3-98): a resin
 * or balsam by its form or name, at the base, a plateau; otherwise by its tier; without a tier, by its
 * hours. null when nothing says.
 */
export function defaultShape(m: { readonly name: string; readonly form: string | null; readonly tier: Tier | null }, hours: number | null): ShapeId | null {
  const lowTier = m.tier === null || m.tier === "base" || m.tier === "heart_base";
  if (m.form === "resinoid" || (lowTier && RESINOUS.test(m.name))) return "plateau";
  switch (m.tier) {
    case "top":
      return "fleeting";
    case "top_heart":
      return "top";
    case "heart":
      return "heart";
    case "heart_base":
      return hours !== null && hours < 100 ? "heart" : "linear";
    case "base":
      return "linear";
  }
  if (hours === null) return null;
  return hours < 6 ? "fleeting" : hours < 24 ? "top" : hours < 100 ? "heart" : "linear";
}

/** A line of the plan: what the planner needs of a material, in parts, without grams. */
export interface PlanLine {
  readonly key: string;
  readonly name: string;
  readonly family: Family | null;
  /** Relative parts: 20 and 10 is the same as 2 and 1. */
  readonly parts: Ratio;
  /** 1–10, or null when the material has none (its strength in words is not turned into a number). */
  readonly impact: number | null;
  /** Hours on a blotter, or null. */
  readonly hours: Ratio | null;
  /** null when nothing gives it one and the user has not picked it. */
  readonly shape: ShapeId | null;
}

export type Missing = "impact" | "hours" | "shape";

export interface Profile {
  /** Every counted material, the strongest first; `share` is of the total at that moment. */
  readonly shares: readonly { readonly key: string; readonly name: string; readonly family: Family | null; readonly value: number; readonly share: number; readonly competes: boolean }[];
  /** How many reach 1/3 of the strongest. */
  readonly competing: number;
  /** More than a nose identifies at once. */
  readonly tooMany: boolean;
  /** The number of equal materials the sharing amounts to: 1 / Σ share². */
  readonly effective: number;
  /** What is left of the opening's total, 0–1; null when nothing counts. */
  readonly ofOpening: number | null;
  /** What cannot be counted: never taken as gone, never as present. */
  readonly apart: readonly { readonly key: string; readonly name: string; readonly missing: readonly Missing[] }[];
}

export interface ProfileOptions {
  /** The perceived view's exponent, or null for the index. */
  readonly perceived?: number | null;
  /** The plateau's slow part. */
  readonly slow?: number;
}

const approx = (r: Ratio) => Number(r.num) / Number(r.den);

/** The index of a line at `t` hours, before any view: parts × impact × its shape's level. null when it cannot be counted. */
export function indexAt(line: PlanLine, t: number, slow = PLATEAU_SLOW): number | null {
  if (line.impact === null || line.hours === null || line.shape === null) return null;
  return approx(line.parts) * line.impact * level(line.shape, approx(line.hours), t, slow);
}

/** The profile of a plan at `t` hours on a blotter. */
export function profileAt(lines: readonly PlanLine[], t: number, options: ProfileOptions = {}): Profile {
  const slow = options.slow ?? PLATEAU_SLOW;
  const n = options.perceived ?? null;
  const view = (x: number) => (n === null ? x : Math.pow(Math.max(x, 0), n));
  const present = lines.filter((l) => l.parts.sign() > 0);
  const apart = present
    .map((l) => ({ key: l.key, name: l.name, missing: [l.impact === null && "impact", l.hours === null && "hours", l.shape === null && "shape"].filter((m): m is Missing => m !== false) }))
    .filter((a) => a.missing.length > 0);
  const counted = present.filter((l) => !apart.some((a) => a.key === l.key));
  const values = counted.map((l) => ({ line: l, value: view(indexAt(l, t, slow)!) })).filter((v) => v.value > 0);
  const total = values.reduce((sum, v) => sum + v.value, 0);
  const opening = counted.reduce((sum, l) => sum + view(indexAt(l, 0, slow)!), 0);
  if (total === 0) return { shares: [], competing: 0, tooMany: false, effective: 0, ofOpening: opening > 0 ? 0 : null, apart };
  const lead = Math.max(...values.map((v) => v.value));
  const shares = values
    .map(({ line, value }) => ({ key: line.key, name: line.name, family: line.family, value, share: value / total, competes: value >= lead * COMPETE_FRACTION }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "es"));
  const competing = shares.filter((s) => s.competes).length;
  return {
    shares,
    competing,
    tooMany: competing > IDENTIFY_MAX,
    effective: 1 / shares.reduce((sum, s) => sum + s.share * s.share, 0),
    ofOpening: total / opening,
    apart,
  };
}

/** The moments the planner reads, one in each stretch of the tastings (V3-42): 5 min, 40 min, 4 h, 14 h and 3 days. */
export const MOMENTS: readonly number[] = [5 / 60, 40 / 60, 4, 14, 72];
