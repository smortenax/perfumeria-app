import { Ratio } from "./arith/ratio";
import { compose, type Composition } from "./compose";
import type { Formula, FormulaHeader } from "./model/formula";
import type { Material } from "./model/material";

/** A regulated substance and its category 4 ceiling (decisions §5.1). */
export interface IfraSubstance {
  readonly key: string;
  readonly name: string;
  /** Fraction of the finished product. */
  readonly limit: Ratio;
  /** The amendment goes with the number: a ceiling without its version expires silently. */
  readonly amendment: string;
}

/** What the reference data knows about one material, in IFRA terms. */
export interface IfraMaterial {
  /**
   * "checked": looked up in the standards, even if it has none of its own.
   * "unchecked": not looked up yet; that is unknown, not free (§5.2).
   */
  readonly status: "checked" | "unchecked";
  /**
   * The regulated substances inside, as a fraction of the material's pure
   * matter. A material regulated as itself lists its own substance with 1.
   * A null fraction is a load without data (§1.2): it never counts as zero.
   */
  readonly substances: ReadonlyArray<{ readonly key: string; readonly fraction: Ratio | null }>;
  /** Obligations that are not a percentage: a certificate, a specification (§5.5). */
  readonly conditions: readonly string[];
  /**
   * Regulated constituents whose ceiling is not in the data yet, such as the
   * citral of a lemon oil: the check of this material is incomplete, never free (§1.2).
   */
  readonly pending?: readonly string[];
}

export interface IfraData {
  readonly substances: ReadonlyMap<string, IfraSubstance>;
  readonly materials: ReadonlyMap<string, IfraMaterial>;
}

/**
 * - within: what is known stays under the ceiling, and nothing is unknown;
 * - bounded: a load is unknown, but not even the worst case reaches the ceiling.
 *   It is proven, so reading 1 can say yes, but it is never shown as within (§5.5, P31);
 * - unknown: an unknown load could take it over the ceiling; it cannot be checked;
 * - exceeds: what is known is already over the ceiling.
 */
export type Verdict = "within" | "bounded" | "unknown" | "exceeds";

/**
 * The base reading 1 is given in (§5.4, P58): what each substance is divided by to be a
 * share of the product.
 * - bottle: the header has no final batch, so the bottle as it is is the product;
 * - now: what is in the bottle, taken to the final batch;
 * - completed: the whole work batch, taken to the final batch (P51). It needs a work batch.
 */
export type IfraBase = "now" | "completed" | "bottle";

export interface SubstanceCheck {
  readonly substance: IfraSubstance;
  /** From loads with data. */
  readonly knownUg: Ratio;
  /** Adding the whole pure matter of every material whose load is unknown. */
  readonly worstUg: Ratio;
  /** The materials whose load of this substance is unknown. */
  readonly unknownFrom: readonly string[];
  /**
   * What each material brings of this substance (§5.3, §10.3): `knownUg` with the data,
   * `worstUg` in the worst case. One entry per material, the largest in the worst case first;
   * they add up to the `knownUg` and the `worstUg` of the substance.
   */
  readonly sources: ReadonlyArray<{ readonly material: Material; readonly knownUg: Ratio; readonly worstUg: Ratio }>;
  /** Against the final batch, in the base of the report (`IfraReport.base`); the other bases are in `IfraReport.readings`. */
  readonly verdict: Verdict;
  /** Largest fraction of a perfume this formula can make up, for this substance, in the worst case. */
  readonly maxUse: Ratio;
  /** The same counting only the loads with data: the other end of the range shown on hover, never the result (P31). */
  readonly maxUseKnown: Ratio;
}

/** Reading 1 in one base (P58): the same substances, judged against what that base divides them by. */
export interface BaseReading {
  readonly base: IfraBase;
  /** What each substance is divided by to be a share of the product in this base. */
  readonly finalUg: Ratio;
  /** Reading 1 in this base. */
  readonly asIs: "yes" | "no" | "unknown";
  /**
   * One per substance, in the order of `IfraReport.checks`. `roomUg` is what still fits of the
   * substance, in micrograms and in the worst case: the most of it that could be poured pure
   * before it reaches its ceiling. It is exact: in the bottle and completed bases the product
   * grows with what is poured, so it is not `limit × finalUg − worstUg` there (P58). Zero when
   * it is already at or over; null when not even the pure substance could reach its ceiling.
   */
  readonly checks: ReadonlyArray<{ readonly key: string; readonly verdict: Verdict; readonly roomUg: Ratio | null }>;
}

export interface IfraReport {
  /**
   * What each substance in the bottle is divided by to be a share of the product, in the base
   * of the report (`base`): the bottle's content brought to the final batch as the work batch
   * is (§3.3, P13). A substance's share of the product is its mass over this.
   */
  readonly finalUg: Ratio;
  /** The final batch as the header gives it, or the bottle when it gives none: what the panel names. */
  readonly finalBatchUg: Ratio;
  /** The header has no final batch, so the bottle as it is was taken as the product. */
  readonly finalAssumed: boolean;
  /**
   * The base of `finalUg`, of `asIs` and of the verdicts in `checks`, the fields of always:
   * "bottle" without a final batch, "completed" with a final and a work batch, and "now" with
   * a final batch alone (P58).
   */
  readonly base: IfraBase;
  /**
   * Reading 1 in every base the header allows, always all of them (P58): ["bottle"] without a
   * final batch, ["now", "completed"] with a final and a work batch, ["now"] with a final batch
   * alone. The one named in `base` is the last.
   */
  readonly readings: readonly BaseReading[];
  readonly checks: readonly SubstanceCheck[];
  /** Materials with no IFRA data: not checked, and never taken as free (§5.2, §5.5). */
  readonly unchecked: readonly string[];
  readonly conditions: ReadonlyArray<{ readonly material: string; readonly text: string }>;
  /** Constituents that could not be checked: like an unchecked material, they keep both readings open. */
  readonly pending: ReadonlyArray<{ readonly material: string; readonly text: string }>;
  /** Reading 1: can it be used as it is, at its final batch? In the base of the report. */
  readonly asIs: "yes" | "no" | "unknown";
  /** Reading 2: up to what fraction of a perfume it can be used; 1 means no ceiling below 100 %. */
  readonly maxUse: Ratio;
  /** Reading 2 counting only what is known: with maxUse, the range shown on hover (P31). */
  readonly maxUseKnown: Ratio;
  /** Reading 2 holds only for what is known: some material or constituent could not be checked. */
  readonly partial: boolean;
}

/**
 * Checks a formula against IFRA, adding up each substance wherever it comes
 * from (§5.3), on the final batch (§5.4), with the unknown always in sight (§5.5).
 */
export function checkIfra(formula: Formula, data: IfraData, upTo?: number): IfraReport {
  const composition = compose(formula, upTo);
  const bottleUg = composition.totalUg;
  const finalAssumed = formula.header.finalBatchUg === null;
  const finalBatchUg = finalAssumed ? bottleUg : Ratio.of(formula.header.finalBatchUg as bigint);
  const { tallies, unchecked, conditions, pending, partial } = accumulate(composition, data);

  // Every base the header allows is worked out, always (P58). The fields of always are those
  // of the last one, the fullest reading the header gives: that is what they always meant.
  const substances = [...tallies.values()];
  const readings = basesOf(formula.header).map((base) => readingOf(base, formula.header, bottleUg, substances, partial));
  const main = readings[readings.length - 1];

  const checks: SubstanceCheck[] = substances.map((tally, i) => {
    const { substance, knownUg, worstUg } = tally;
    const maxUse = worstUg.isZero() ? Ratio.ONE : substance.limit.mul(composition.totalUg).div(worstUg);
    const maxUseKnown = knownUg.isZero() ? Ratio.ONE : substance.limit.mul(composition.totalUg).div(knownUg);
    return { ...tally, verdict: main.checks[i].verdict, maxUse, maxUseKnown };
  });

  const maxUse = checks.reduce((min, c) => (c.maxUse.lt(min) ? c.maxUse : min), Ratio.ONE);
  const maxUseKnown = checks.reduce((min, c) => (c.maxUseKnown.lt(min) ? c.maxUseKnown : min), Ratio.ONE);
  return {
    finalUg: main.finalUg,
    finalBatchUg,
    finalAssumed,
    base: main.base,
    readings,
    checks,
    unchecked,
    conditions,
    pending,
    asIs: main.asIs,
    maxUse,
    maxUseKnown,
    partial,
  };
}

/**
 * - unknown: never a number (§1.2);
 * - unbounded: no substance the pour carries puts a ceiling on it;
 * - bounded: this many micrograms of the solution fit, and `limitedBy` is the key of the
 *   substance that sets it. In a tie the first wins: in the order the material lists its
 *   substances, then the diluent's. Zero is a margin: something is already at or over a ceiling.
 */
export type Margin =
  | { readonly kind: "unknown" }
  | { readonly kind: "unbounded"; readonly partial: boolean }
  | { readonly kind: "bounded"; readonly pouredUg: Ratio; readonly limitedBy: string; readonly partial: boolean };

/**
 * What one material can still take (P57): the largest mass that can be poured of it, exact and
 * in micrograms, that keeps every substance the pour carries under its ceiling, in the given
 * base and in the worst case (§5.5). The mass is that of the solution as it is poured:
 * `fraction` of pure matter and the rest diluent. What is already in the bottle counts wherever
 * it comes from, so a material that adds to a substance another one already loads has less
 * room (§5.3).
 *
 * - `unknown`, never a number (§1.2), when the material, or the diluent of a dilution, has no
 *   IFRA data (provisional, not in the data, or unchecked), or when a component of a formula
 *   used as a material has none. A diluent of the app with nothing to check adds no substances
 *   but it does add mass.
 * - A formula used as a material is expanded into its vector (§2.4, §3.6).
 * - `partial` is true when the number could be optimistic: the report is partial, or the
 *   material, the diluent or a component has constituents that could not be checked.
 *
 * Asking for a base the header does not have (P58) throws: "completed" needs a work batch,
 * "now" and "completed" a final batch, and "bottle" exists only without one.
 */
export function marginOf(
  formula: Formula,
  data: IfraData,
  pour: { readonly material: Material; readonly fraction: Ratio; readonly diluent: Material | null },
  base: IfraBase,
  upTo?: number,
): Margin {
  const header = formula.header;
  const available = basesOf(header);
  if (!available.includes(base)) {
    throw new Error(`The header has no "${base}" base (P58): it has ${available.map((b) => `"${b}"`).join(" and ")}`);
  }
  const { material, fraction, diluent } = pour;
  if (fraction.sign() <= 0 || fraction.gt(Ratio.ONE)) {
    throw new RangeError(`"${material.name}": the fraction of pure matter must be above 0 and at most 1`);
  }

  // What each unit of mass poured is made of: the pure matter (or, for a formula, its
  // components in their proportion) and the diluent.
  const made: Array<{ readonly material: Material; readonly weight: Ratio }> = [];
  if (material.kind === "formula") {
    if (!material.vector) {
      return { kind: "unknown" };
    }
    for (const component of material.vector.components) {
      made.push({ material: component.material, weight: fraction.mul(component.proportion) });
    }
  } else {
    made.push({ material, weight: fraction });
  }
  if (fraction.lt(Ratio.ONE)) {
    if (!diluent) {
      // A diluent nobody knows cannot silently vanish (§1.2).
      return { kind: "unknown" };
    }
    made.push({ material: diluent, weight: Ratio.ONE.sub(fraction) });
  }

  // a: how much of each substance there is in one unit of mass poured, in the worst case.
  const per = new Map<string, Ratio>();
  let pouredPending = false;
  for (const { material: part, weight } of made) {
    const info = lookup(part, data);
    if (info === "skip") {
      continue;
    }
    if (info === "unchecked") {
      return { kind: "unknown" };
    }
    pouredPending = pouredPending || (info.pending ?? []).length > 0;
    for (const { key, fraction: inside } of info.substances) {
      if (data.substances.has(key)) {
        per.set(key, (per.get(key) ?? Ratio.ZERO).add(weight.mul(inside ?? Ratio.ONE)));
      }
    }
  }

  const composition = compose(formula, upTo);
  const { tallies, partial: reportPartial } = accumulate(composition, data);
  const partial = reportPartial || pouredPending;
  // Only the bases the header has use the batches; the check above keeps the others out.
  const batches = batchesOf(header, composition.totalUg);

  let least: { readonly ug: Ratio; readonly key: string } | null = null;
  for (const [key, a] of per) {
    if (a.sign() <= 0) {
      continue;
    }
    const limit = (data.substances.get(key) as IfraSubstance).limit;
    const held = tallies.get(key)?.worstUg ?? Ratio.ZERO;
    const room = roomFor(base, a, held, limit, batches);
    if (room !== null && (least === null || room.lt(least.ug))) {
      least = { ug: room, key };
    }
  }
  return least === null ? { kind: "unbounded", partial } : { kind: "bounded", pouredUg: least.ug, limitedBy: least.key, partial };
}

/**
 * The largest mass y that one substance leaves of a pour, or null when it puts no ceiling. Let a
 * be the substance in one unit of mass poured, S what the bottle holds of it (worst case), L its
 * ceiling, B the bottle, F the final batch and W the work batch. The bottle grows with the pour:
 * it becomes B + y.
 * - now:       (S + a·y) / F ≤ L            ⇒  y ≤ (L·F − S) / a
 * - bottle:    (S + a·y) / (B + y) ≤ L      ⇒  y·(a − L) ≤ L·B − S
 * - completed: (S + a·y)·W ≤ L·F·(B + y)    ⇒  y·(a·W − L·F) ≤ L·F·B − S·W
 * A substance already over its ceiling leaves nothing, even when the pour would dilute it.
 */
function roomFor(
  base: IfraBase,
  a: Ratio,
  held: Ratio,
  limit: Ratio,
  batches: { readonly bottleUg: Ratio; readonly finalUg: Ratio; readonly workUg: Ratio },
): Ratio | null {
  const { bottleUg: B, finalUg: F, workUg: W } = batches;
  if (base === "now") {
    const room = limit.mul(F).sub(held);
    return room.sign() <= 0 ? Ratio.ZERO : room.div(a);
  }
  const room = base === "bottle" ? limit.mul(B).sub(held) : limit.mul(F).mul(B).sub(held.mul(W));
  if (room.sign() < 0) {
    return Ratio.ZERO;
  }
  const slope = base === "bottle" ? a.sub(limit) : a.mul(W).sub(limit.mul(F));
  // A pour no stronger than the ceiling can only dilute: it never sets one.
  return slope.sign() <= 0 ? null : room.div(slope);
}

/**
 * The bases the header allows, in order (P58). The last is the fullest reading, the one the
 * fields of always of the report are about.
 */
function basesOf(header: FormulaHeader): readonly IfraBase[] {
  if (header.finalBatchUg === null) {
    return ["bottle"];
  }
  return header.workBatchUg !== null && header.workBatchUg > 0n ? ["now", "completed"] : ["now"];
}

function finalUgOf(base: IfraBase, header: FormulaHeader, bottleUg: Ratio): Ratio {
  if (base === "bottle") {
    return bottleUg;
  }
  const final = Ratio.of(header.finalBatchUg as bigint);
  if (base === "now") {
    return final;
  }
  // The concentrate goes into the product as the work batch goes into the final batch
  // (§3.3, P13). What is in the bottle stands for the whole work batch, even while part of
  // it is still to be poured: what is missing is not taken as blank (P51).
  return bottleUg.isZero() ? final : bottleUg.mul(final).div(Ratio.of(header.workBatchUg as bigint));
}

/** The batches the room of a pour is worked out with; a base the header does not have never reads them. */
function batchesOf(header: FormulaHeader, bottleUg: Ratio): { readonly bottleUg: Ratio; readonly finalUg: Ratio; readonly workUg: Ratio } {
  return {
    bottleUg,
    finalUg: header.finalBatchUg === null ? Ratio.ZERO : Ratio.of(header.finalBatchUg),
    workUg: header.workBatchUg === null ? Ratio.ZERO : Ratio.of(header.workBatchUg),
  };
}

function readingOf(base: IfraBase, header: FormulaHeader, bottleUg: Ratio, tallies: readonly Tally[], partial: boolean): BaseReading {
  const finalUg = finalUgOf(base, header, bottleUg);
  const batches = batchesOf(header, bottleUg);
  const checks = tallies.map(({ substance, knownUg, worstUg }) => ({
    key: substance.key,
    verdict: judge(knownUg, worstUg, finalUg, substance.limit),
    // The substance itself, poured pure: the room of a pour whose every unit is that substance.
    roomUg: roomFor(base, Ratio.ONE, worstUg, substance.limit, batches),
  }));
  const verdicts = checks.map((c) => c.verdict);
  const asIs = verdicts.includes("exceeds") ? "no" : verdicts.includes("unknown") || partial ? "unknown" : "yes";
  return { base, finalUg, asIs, checks };
}

function judge(knownUg: Ratio, worstUg: Ratio, finalUg: Ratio, limit: Ratio): Verdict {
  if (knownUg.div(finalUg).gt(limit)) {
    return "exceeds";
  }
  if (worstUg.eq(knownUg)) {
    return "within";
  }
  return worstUg.div(finalUg).gt(limit) ? "unknown" : "bounded";
}

/** What a substance adds up to in the bottle, and where it comes from: it does not depend on the base. */
interface Tally {
  readonly substance: IfraSubstance;
  readonly knownUg: Ratio;
  readonly worstUg: Ratio;
  readonly unknownFrom: readonly string[];
  readonly sources: SubstanceCheck["sources"];
}

/**
 * How a material takes part in the check (§5.2, §5.5):
 * - "skip": a diluent of the app with nothing to check (DPG, alcohol) is not aromatic matter,
 *   and is left out; one with a standard (benzyl benzoate) counts like any material;
 * - "unchecked": no IFRA data, or not looked up yet: unknown, and never free;
 * - otherwise, what the data knows about it.
 */
function lookup(material: Material, data: IfraData): "skip" | "unchecked" | IfraMaterial {
  if (material.solvent && material.kind === "base" && !data.materials.has(material.key)) {
    return "skip";
  }
  const info = material.kind === "provisional" ? undefined : data.materials.get(material.key);
  return !info || info.status === "unchecked" ? "unchecked" : info;
}

/**
 * Adds up each substance over the bottle, wherever it comes from (§5.3): what is known and the
 * worst case, and the share of each material in both. The substances come in the order they
 * first show up in the bottle.
 */
function accumulate(composition: Composition, data: IfraData) {
  const bySubstance = new Map<string, { sources: Map<string, SubstanceCheck["sources"][number]>; unknownFrom: string[] }>();
  const unchecked: string[] = [];
  const conditions: Array<{ material: string; text: string }> = [];
  const pending: Array<{ material: string; text: string }> = [];

  for (const part of composition.parts) {
    const material = part.material;
    const info = lookup(material, data);
    if (info === "skip") {
      continue;
    }
    if (info === "unchecked") {
      unchecked.push(material.name);
      continue;
    }
    for (const text of info.conditions) {
      conditions.push({ material: material.name, text });
    }
    for (const text of info.pending ?? []) {
      pending.push({ material: material.name, text });
    }
    for (const { key, fraction } of info.substances) {
      if (!data.substances.has(key)) {
        continue;
      }
      const certain = fraction ? part.massUg.mul(fraction) : Ratio.ZERO;
      const possible = fraction ? certain : part.massUg;
      const found = bySubstance.get(key) ?? { sources: new Map<string, SubstanceCheck["sources"][number]>(), unknownFrom: [] };
      bySubstance.set(key, found);
      // A material shows once per substance, even if it lists it twice.
      const before = found.sources.get(material.key);
      found.sources.set(
        material.key,
        before ? { material: before.material, knownUg: before.knownUg.add(certain), worstUg: before.worstUg.add(possible) } : { material, knownUg: certain, worstUg: possible },
      );
      if (!fraction) {
        found.unknownFrom.push(material.name);
      }
    }
  }

  const tallies = new Map<string, Tally>();
  for (const [key, { sources: bySource, unknownFrom }] of bySubstance) {
    // Largest in the worst case first; a tie keeps the order of the bottle, largest mass first.
    const sources = [...bySource.values()].sort((a, b) => b.worstUg.cmp(a.worstUg));
    tallies.set(key, {
      substance: data.substances.get(key) as IfraSubstance,
      knownUg: Ratio.sum(sources.map((s) => s.knownUg)),
      worstUg: Ratio.sum(sources.map((s) => s.worstUg)),
      unknownFrom,
      sources,
    });
  }
  const partial = unchecked.length > 0 || pending.length > 0;
  return { tallies, unchecked, conditions, pending, partial };
}
