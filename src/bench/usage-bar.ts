import { Ratio } from "../core/arith/ratio";
import { compose, type Composition } from "../core/compose";
import { checkIfra, marginOf, type IfraBase, type IfraData, type IfraReport, type IfraSubstance } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import type { Material } from "../core/model/material";
import type { UsageData } from "../data/catalog";
import { carriedOf, type Carried } from "./material-card";
import { readingIn } from "./ifra-panel";

/**
 * The numbers behind the bar of the usual use (P57, P58, P59) and behind the IFRA of what is being
 * typed: pure, exact, in `Ratio`. Only the drawing of a share on the strip (`usagePosition`) is a
 * float. Every share on the strip is a share of the aromatic matter of the bottle (§1.1).
 *
 * Notation, all in micrograms: for one material, `m` is its pure mass in the formula (for a
 * formula used as a material, the mass of that formula, solvents of its vector included), `C` what
 * the bottle carries of it now, `q` the aromatic part of a unit of it (1 for an ordinary material,
 * the sum of the non-solvent proportions of its vector for a formula, 0 for a solvent), `a_s` how
 * much of the substance `s` a unit of it holds in the worst case (a load without data counts 1,
 * §1.2), `L_s` the ceiling of `s`, and, for the bottle: `B` its total, `A` its aromatic matter,
 * `Ca` the aromatic matter of the material in it, `F` the final batch and `W` the work batch.
 */

/**
 * The band of the usual use (E6, P59): a share of the aromatic matter, with its sources. `recommendation`
 * is true when a single source gives it, not a consensus of several. `ceiling` is the use ceiling:
 * the most anyone reports, which is not an IFRA ceiling, with the source it comes from.
 */
export interface UsageBand {
  readonly min?: Ratio;
  /** Undefined when only the use ceiling is known: no band is drawn, only its mark. */
  readonly max?: Ratio;
  readonly fuente: string;
  readonly recommendation?: boolean;
  readonly ceiling?: { readonly value: Ratio; readonly fuente: string | undefined };
}

/** The band of a catalog entry, or undefined when its usual use is a gap (§1.2). */
export function bandOf(usage: UsageData | undefined): UsageBand | undefined {
  return usage
    ? {
        ...(usage.min ? { min: usage.min } : {}),
        ...(usage.max ? { max: usage.max } : {}),
        fuente: usage.sources,
        recommendation: usage.consensus === "recomendacion",
        ...(usage.ceiling ? { ceiling: { value: usage.ceiling, fuente: usage.ceilingSource } } : {}),
      }
    : undefined;
}

/**
 * The red flag of P60: the usual use reaches past the IFRA ceiling of the material alone, in the
 * base and the batches of this formula. IFRA rules (P37); the band is a guide, so the card says
 * it in red and the figure is looked at closely. False when either side is unknown (§1.2).
 */
export function bandOverIfra(band: UsageBand | undefined, ifra: MaterialIfra | null): boolean {
  const share = ifra?.status === "ok" ? ifra.solo?.share : null;
  return band?.max !== undefined && share !== null && share !== undefined && band.max.gt(share);
}

/** What one unit of mass of a material is made of, in IFRA terms. `unknown` is never a number (§1.2). */
type Unit =
  | { readonly kind: "unknown" }
  | {
      readonly kind: "known";
      /** `a_s` by substance key, in the order the material lists them (a tie is won by the first, as in `marginOf`). */
      readonly per: ReadonlyMap<string, Ratio>;
      readonly aromatic: Ratio;
      /** A constituent of the material could not be checked: its figures can be optimistic. */
      readonly pending: boolean;
    };

/**
 * The same expansion `marginOf` makes of a pour of fraction 1 (§2.4, §3.6): the pure matter, or the
 * components of a formula in their proportion. A diluent of the app with nothing to check adds no
 * substances; a material with no IFRA data makes the whole unknown.
 */
export function unitOf(material: Material, data: IfraData): Unit {
  const made: Array<{ readonly material: Material; readonly weight: Ratio }> = [];
  if (material.kind === "formula") {
    if (!material.vector) {
      return { kind: "unknown" };
    }
    for (const c of material.vector.components) {
      made.push({ material: c.material, weight: c.proportion });
    }
  } else {
    made.push({ material, weight: Ratio.ONE });
  }
  const per = new Map<string, Ratio>();
  let aromatic = Ratio.ZERO;
  let pending = false;
  for (const { material: part, weight } of made) {
    if (!part.solvent) {
      aromatic = aromatic.add(weight);
    }
    if (part.solvent && part.kind === "base" && !data.materials.has(part.key)) {
      continue; // a diluent with nothing to check
    }
    const info = part.kind === "provisional" ? undefined : data.materials.get(part.key);
    if (!info || info.status === "unchecked") {
      return { kind: "unknown" };
    }
    pending = pending || (info.pending ?? []).length > 0;
    for (const { key, fraction } of info.substances) {
      if (data.substances.has(key)) {
        per.set(key, (per.get(key) ?? Ratio.ZERO).add(weight.mul(fraction ?? Ratio.ONE)));
      }
    }
  }
  return { kind: "known", per, aromatic, pending };
}

/**
 * The most of the material, in total, that its own substances allow, when nothing else counts
 * (P59): the largest `m` with `a·m` under the ceiling in the base. The divisor of the product is
 * `F` ("now"), the bottle `B_o + m` ("bottle") or that bottle brought to the final batch,
 * `(B_o + m)·F/W` ("completed"), with `B_o = B − C` what the bottle holds without the material.
 * Solving `a·m ≤ L·P` for `m`:
 * - now:       m ≤ L·F / a
 * - bottle:    m·(a − L) ≤ L·B_o                ⇒ m ≤ L·B_o / (a − L)      when a > L
 * - completed: m·(a·W − L·F) ≤ L·F·B_o          ⇒ m ≤ L·F·B_o / (a·W − L·F)  when a·W > L·F
 * Where the slope is not positive the substance never sets a ceiling (null). They are the
 * equations of `marginOf` with nothing held (S = 0) and the bottle without the material.
 */
function soloCeiling(
  base: IfraBase,
  a: Ratio,
  limit: Ratio,
  batches: { readonly bottleWithoutUg: Ratio; readonly finalUg: Ratio; readonly workUg: Ratio },
): Ratio | null {
  const { bottleWithoutUg: Bo, finalUg: F, workUg: W } = batches;
  if (base === "now") {
    return limit.mul(F).div(a);
  }
  const slope = base === "bottle" ? a.sub(limit) : a.mul(W).sub(limit.mul(F));
  if (slope.sign() <= 0) {
    return null;
  }
  return (base === "bottle" ? limit.mul(Bo) : limit.mul(F).mul(Bo)).div(slope);
}

/** One ceiling of the bar: how much of the material, and what that is of the aromatic matter. */
export interface Cap {
  /** Total pure mass of the material at the ceiling (µg): for the aggregate, what it carries plus its margin. */
  readonly totalUg: Ratio;
  /** Share of the aromatic matter at that mass; null when the bottle would hold no aromatic matter at all. */
  readonly share: Ratio | null;
  readonly limitedBy: string;
}

/**
 * The IFRA of one material, as the card draws it:
 * - unknown: it cannot be checked; never a figure, never green (§1.2);
 * - ok: `marginUg` is the aggregate margin of the material poured pure (null: no ceiling), `solo`
 *   and `aggregate` are the two marks of the strip (null: no ceiling; for a solvent, both are).
 * `partial` says the figures could be optimistic (§1.2): the mark goes amber.
 */
export type MaterialIfra =
  | { readonly status: "unknown" }
  | {
      readonly status: "ok";
      readonly base: IfraBase;
      readonly partial: boolean;
      readonly marginUg: Ratio | null;
      readonly marginLimitedBy: string | null;
      readonly solo: Cap | null;
      readonly aggregate: Cap | null;
    };

/**
 * The share of the aromatic matter the material is when it weighs `totalUg` and the rest of the
 * bottle stays as it is: the aromatic matter moves by `q·(m − C)`, so
 * share = (Ca + q·(m − C)) / (A + q·(m − C)). Null when there would be no aromatic matter.
 */
export function shareAt(totalUg: Ratio, aromaticPerUnit: Ratio, carried: Carried, aromaticUg: Ratio): Ratio | null {
  const delta = aromaticPerUnit.mul(totalUg.sub(carried.pureUg));
  const whole = aromaticUg.add(delta);
  return whole.sign() <= 0 ? null : carried.countedUg.add(delta).div(whole);
}

/**
 * The two ceilings of a material and its margin (P57, P59), in one base (P58):
 * - solo: `soloCeiling` over every substance it carries, the lowest wins; it leaves out what the
 *   other materials add to the same substances;
 * - aggregate: `marginOf` of the material poured pure: it counts what the bottle already holds of
 *   the substance wherever it comes from (§5.3). Its total is `C + y` for the margin `y`.
 * Both are turned into a share of the aromatic matter with `shareAt`. The aggregate never lies
 * above the solo one, but for a material already over its ceiling, which has a margin of zero.
 * A solvent has no share of the aromatic matter: no marks, only the margin.
 */
export function ifraOfMaterial(
  formula: Formula,
  data: IfraData,
  composition: Composition,
  report: IfraReport,
  material: Material,
  upTo?: number,
  chosen?: IfraBase,
): MaterialIfra {
  // The base of the panel's switch (E4), or the report's when the header lacks it.
  const base = readingIn(report, chosen).base;
  const margin = marginOf(formula, data, { material, fraction: Ratio.ONE, diluent: null }, base, upTo);
  const unit = unitOf(material, data);
  if (margin.kind === "unknown" || unit.kind === "unknown") {
    return { status: "unknown" };
  }
  const carried = carriedOf(composition, material);
  const header = formula.header;
  const batches = {
    bottleWithoutUg: composition.totalUg.sub(carried.pureUg),
    finalUg: header.finalBatchUg === null ? Ratio.ZERO : Ratio.of(header.finalBatchUg),
    workUg: header.workBatchUg === null ? Ratio.ZERO : Ratio.of(header.workBatchUg),
  };
  const marks = !material.solvent;

  let solo: Cap | null = null;
  if (marks) {
    let least: { totalUg: Ratio; key: string } | null = null;
    for (const [key, a] of unit.per) {
      if (a.sign() <= 0) {
        continue;
      }
      const limit = (data.substances.get(key) as IfraSubstance).limit;
      const ceiling = soloCeiling(base, a, limit, batches);
      if (ceiling !== null && (least === null || ceiling.lt(least.totalUg))) {
        least = { totalUg: ceiling, key };
      }
    }
    if (least) {
      solo = { totalUg: least.totalUg, share: shareAt(least.totalUg, unit.aromatic, carried, composition.aromaticUg), limitedBy: least.key };
    }
  }
  let aggregate: Cap | null = null;
  if (marks && margin.kind === "bounded") {
    const totalUg = carried.pureUg.add(margin.pouredUg);
    aggregate = { totalUg, share: shareAt(totalUg, unit.aromatic, carried, composition.aromaticUg), limitedBy: margin.limitedBy };
  }
  return {
    status: "ok",
    base,
    partial: margin.partial || report.partial || unit.pending,
    marginUg: margin.kind === "bounded" ? margin.pouredUg : null,
    marginLimitedBy: margin.kind === "bounded" ? margin.limitedBy : null,
    solo,
    aggregate,
  };
}

/** What is being typed in the add bar, read: the same fields as an `add` change (P57). */
export interface Pour {
  readonly material: Material;
  readonly massUg: bigint;
  readonly fraction: Ratio;
  readonly diluent: Material | null;
}

/** What adding the pour would do: where it leaves the material on the strip, and which ceilings it breaks. */
export interface Preview {
  /** Share of the aromatic matter the material would be after adding it; null when it is not aromatic matter. */
  readonly share: Ratio | null;
  /** Substances that are within their ceiling now and would pass it (verdict «exceeds» in the base). */
  readonly breaks: readonly { readonly key: string; readonly name: string }[];
  /** Substances already over their ceiling that the pour would load even more. */
  readonly worsens: readonly { readonly key: string; readonly name: string }[];
}

/**
 * IFRA while typing (P57): checks the formula plus the pour, as `checkIfra` does, and compares it
 * with the formula as it stands, in the base of the panel's switch or else of the report (P58, E4). Nothing is added to the formula:
 * the pour is a hypothetical last change. A substance breaks the ceiling when it is «exceeds» after
 * and was not before; it worsens when it was already «exceeds» and the worst case of it grows.
 * `before` is the report of the formula as it stands, which the bench already has.
 */
export function previewPour(formula: Formula, data: IfraData, before: IfraReport, pour: Pour, chosen?: IfraBase): Preview {
  const base = readingIn(before, chosen).base;
  const change: Change = { kind: "add", id: "preview", material: pour.material, massUg: pour.massUg, fraction: pour.fraction, diluent: pour.diluent };
  const after: Formula = { header: formula.header, history: [...formula.history, change] };
  const report = checkIfra(after, data);
  const verdictOf = (r: IfraReport, key: string) => r.readings.find((x) => x.base === base)?.checks.find((c) => c.key === key)?.verdict;
  const breaks: Array<{ key: string; name: string }> = [];
  const worsens: Array<{ key: string; name: string }> = [];
  for (const check of report.checks) {
    if (verdictOf(report, check.substance.key) !== "exceeds") {
      continue;
    }
    const was = before.checks.find((c) => c.substance.key === check.substance.key);
    const item = { key: check.substance.key, name: check.substance.name };
    if (verdictOf(before, check.substance.key) !== "exceeds") {
      breaks.push(item);
    } else if (was && check.worstUg.gt(was.worstUg)) {
      worsens.push(item);
    }
  }
  const composition = compose(after);
  const carried = carriedOf(composition, pour.material);
  const share =
    pour.material.solvent || carried.baseUg.isZero() || carried.base !== "aromatic" ? null : carried.countedUg.div(carried.baseUg);
  return { share, breaks, worsens };
}

/**
 * A stable text for a pour, to know whether the draft changed without comparing objects: what is
 * recomputed is only what this text changes.
 */
export function pourKey(pour: Pour | null): string {
  return pour ? `${pour.material.key}|${pour.massUg}|${pour.fraction.toString()}|${pour.diluent?.key ?? ""}` : "";
}
