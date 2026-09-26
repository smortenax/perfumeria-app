import { Ratio } from "./arith/ratio";
import { compose } from "./compose";
import type { Formula } from "./model/formula";

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

export interface SubstanceCheck {
  readonly substance: IfraSubstance;
  /** From loads with data. */
  readonly knownUg: Ratio;
  /** Adding the whole pure matter of every material whose load is unknown. */
  readonly worstUg: Ratio;
  /** The materials whose load of this substance is unknown. */
  readonly unknownFrom: readonly string[];
  /** Against the final batch. */
  readonly verdict: Verdict;
  /** Largest fraction of a perfume this formula can make up, for this substance, in the worst case. */
  readonly maxUse: Ratio;
}

export interface IfraReport {
  /** What IFRA is measured on: the final batch (§3.3, §5.4). */
  readonly finalUg: Ratio;
  /** The header has no final batch, so the bottle as it is was taken as the product. */
  readonly finalAssumed: boolean;
  readonly checks: readonly SubstanceCheck[];
  /** Materials with no IFRA data: not checked, and never taken as free (§5.2, §5.5). */
  readonly unchecked: readonly string[];
  readonly conditions: ReadonlyArray<{ readonly material: string; readonly text: string }>;
  /** Reading 1: can it be used as it is, at its final batch? */
  readonly asIs: "yes" | "no" | "unknown";
  /** Reading 2: up to what fraction of a perfume it can be used; 1 means no ceiling below 100 %. */
  readonly maxUse: Ratio;
  /** Reading 2 holds only for what is known: some material could not be checked. */
  readonly partial: boolean;
}

/**
 * Checks a formula against IFRA, adding up each substance wherever it comes
 * from (§5.3), on the final batch (§5.4), with the unknown always in sight (§5.5).
 */
export function checkIfra(formula: Formula, data: IfraData, upTo?: number): IfraReport {
  const composition = compose(formula, upTo);
  const finalAssumed = formula.header.finalBatchUg === null;
  const finalUg = finalAssumed ? composition.totalUg : Ratio.of(formula.header.finalBatchUg as bigint);

  const known = new Map<string, Ratio>();
  const worst = new Map<string, Ratio>();
  const unknownFrom = new Map<string, string[]>();
  const unchecked: string[] = [];
  const conditions: Array<{ material: string; text: string }> = [];

  for (const part of composition.parts) {
    const material = part.material;
    if (material.solvent && material.kind === "base") {
      continue;
    }
    const info = material.kind === "provisional" ? undefined : data.materials.get(material.key);
    if (!info || info.status === "unchecked") {
      unchecked.push(material.name);
      continue;
    }
    for (const text of info.conditions) {
      conditions.push({ material: material.name, text });
    }
    for (const { key, fraction } of info.substances) {
      if (!data.substances.has(key)) {
        continue;
      }
      const certain = fraction ? part.massUg.mul(fraction) : Ratio.ZERO;
      const possible = fraction ? certain : part.massUg;
      known.set(key, (known.get(key) ?? Ratio.ZERO).add(certain));
      worst.set(key, (worst.get(key) ?? Ratio.ZERO).add(possible));
      if (!fraction) {
        unknownFrom.set(key, [...(unknownFrom.get(key) ?? []), material.name]);
      }
    }
  }

  const checks: SubstanceCheck[] = [...worst.keys()].map((key) => {
    const substance = data.substances.get(key) as IfraSubstance;
    const knownUg = known.get(key) ?? Ratio.ZERO;
    const worstUg = worst.get(key) ?? Ratio.ZERO;
    const verdict = judge(knownUg, worstUg, finalUg, substance.limit);
    const maxUse = worstUg.isZero() ? Ratio.ONE : substance.limit.mul(composition.totalUg).div(worstUg);
    return { substance, knownUg, worstUg, unknownFrom: unknownFrom.get(key) ?? [], verdict, maxUse };
  });

  const asIs = checks.some((c) => c.verdict === "exceeds")
    ? "no"
    : checks.some((c) => c.verdict === "unknown") || unchecked.length > 0
      ? "unknown"
      : "yes";
  const maxUse = checks.reduce((min, c) => (c.maxUse.lt(min) ? c.maxUse : min), Ratio.ONE);
  return { finalUg, finalAssumed, checks, unchecked, conditions, asIs, maxUse, partial: unchecked.length > 0 };
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
