import { Ratio } from "../core/arith/ratio";
import { bottleOf, examples, nominalBottle, plan, planFromMaterial, storedBottle, type Plan, type PlannedDiluent, type Shares, type SourceBottle } from "./calc";

/**
 * The «New dilution» window (V3-79), without the screen: from what is written, what it shows and what
 * it can save. Four ways in one window: a bottle you already have (no weights), from the material
 * weighed, from another bottle, and from the total. Exact throughout (calc.ts).
 */

export interface WindowRow {
  readonly diluentId: string;
  /** Its share of the bottle («30»), or «» for the rest. */
  readonly share: string;
  /** What was really weighed of it («7,201»), or «». */
  readonly weighed: string;
}

export interface WindowInput {
  /** The % you aim at («10»). */
  readonly target: string;
  /** Pure, or the bottle it is made from. */
  readonly source?: SourceBottle;
  readonly rows: readonly WindowRow[];
  /** Which of the two you wrote last: the material weighed or the whole bottle. */
  readonly drive: "material" | "total" | null;
  readonly materialGrams: string;
  readonly totalGrams: string;
  /** What was really weighed of the material (or taken from the bottle), or «». */
  readonly weighedMaterial: string;
}

export type WindowProblem = "target" | "shares" | "further" | "amount" | "weights";

export interface WindowState {
  /** The examples in grey: 1 g and 10 g. */
  readonly examples: readonly { readonly totalUg: bigint; readonly plan: Plan }[];
  /** What to weigh, from the material or the total you wrote. */
  readonly plan: (Plan & { readonly totalUg: bigint }) | null;
  /** The bottle saved without weights: what you aim at. */
  readonly aimed: Shares | null;
  /** The bottle from what was really weighed, kept to six decimals. */
  readonly weighed: (Shares & { readonly totalUg: bigint }) | null;
  /** What to tell, in a word the screen puts in words. */
  readonly problem: WindowProblem | null;
}

const UG_PER_G = Ratio.of(1_000_000n);

/** Grams as written («0,800») to micrograms; null if empty, not a number or not above 0. */
export function gramsToUg(text: string): bigint | null {
  if (!text.trim()) return null;
  try {
    const ug = Ratio.fromDecimal(text).mul(UG_PER_G);
    return ug.isInteger() && ug.sign() > 0 ? ug.num : null;
  } catch {
    return null;
  }
}

/** A % as written («10», «9,97») to a fraction; null if empty or not a number. */
export function percentToFraction(text: string): Ratio | null {
  if (!text.trim()) return null;
  try {
    return Ratio.fromDecimal(text).div(Ratio.of(100n));
  } catch {
    return null;
  }
}

const problemOf = (e: unknown): WindowProblem => {
  const message = e instanceof Error ? e.message : String(e);
  if (/further/.test(message)) return "further";
  if (/above 0 % and below 100 %/.test(message)) return "target";
  return "shares";
};

export function windowState(input: WindowInput): WindowState {
  const empty = { examples: [], plan: null, aimed: null, weighed: null };
  const target = percentToFraction(input.target);
  if (!target || target.sign() <= 0 || target.cmp(Ratio.ONE) >= 0) return { ...empty, problem: "target" };
  const shares = input.rows.map((r) => (r.share.trim() ? percentToFraction(r.share) : null));
  if (input.rows.some((r, i) => r.share.trim() && !shares[i])) return { ...empty, problem: "shares" };
  const diluents: PlannedDiluent[] = input.rows.map((r, i) => ({ diluentId: r.diluentId, share: shares[i] }));

  let aimed: Shares;
  let shown: WindowState["examples"];
  try {
    aimed = storedBottle(nominalBottle(target, diluents, input.source));
    shown = examples(target, diluents, input.source);
  } catch (e) {
    return { ...empty, problem: problemOf(e) };
  }

  let planned: WindowState["plan"] = null;
  let problem: WindowProblem | null = null;
  const material = gramsToUg(input.materialGrams);
  const total = gramsToUg(input.totalGrams);
  try {
    if (input.drive === "material" && material) planned = planFromMaterial(target, material, diluents, input.source);
    else if (input.drive === "total" && total) planned = { ...plan(target, total, diluents, input.source), totalUg: total };
    else if (input.drive && (input.drive === "material" ? input.materialGrams : input.totalGrams).trim()) problem = "amount";
  } catch (e) {
    problem = problemOf(e);
  }

  // What was really weighed makes the figure (V3-67): every row and the material, all above 0.
  let weighed: WindowState["weighed"] = null;
  const anyWeighed = !!input.weighedMaterial.trim() || input.rows.some((r) => r.weighed.trim());
  if (anyWeighed) {
    const m = gramsToUg(input.weighedMaterial);
    const ds = input.rows.map((r) => ({ diluentId: r.diluentId, massUg: gramsToUg(r.weighed) }));
    if (!m || ds.some((d) => !d.massUg)) problem ??= "weights";
    else {
      try {
        weighed = storedBottle(bottleOf({ materialUg: m, diluents: ds as { diluentId: string; massUg: bigint }[], source: input.source }));
      } catch {
        problem ??= "weights";
      }
    }
  }
  return { examples: shown, plan: planned, aimed, weighed, problem };
}
