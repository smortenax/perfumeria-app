import { Ratio } from "../core/arith/ratio";
import { bottleOf, nominalBottle, plan, planFromDiluent, planFromMaterial, storedBottle, type PlannedDiluent, type Shares, type SourceBottle } from "./calc";
import { gramsToUg, percentToFraction } from "./window";

/**
 * «Add & weigh» (V3-96, BL-003), without the screen: one row per bottle, as the user's sheets, and what
 * each row shows and saves. The user's rules (2026-11-04), with p the % wanted, s the fraction of what
 * it is made from (1 if pure) and T the optional total:
 *
 * 1. The diluent and the % are required; the total is optional.
 * 2. With T and no weights, the scale's boxes show in grey what to put: material T·p/s, the diluents the rest by their %.
 * 3. Without T, it waits for the first weight: from the material, the diluent to add; from a diluent, the material to match.
 * 4. All weighed: the real % is m·s / (m + Σd), the real grams m + Σd.
 * 5. Nothing weighed: saved as it is, with its % (`nominalBottle`).
 * 6. With some weights but not all, it waits, and is not saved.
 * 7. Several diluents: each with its % of what is added; the blank ones share what is left.
 *
 * Exact throughout (calc.ts): micrograms in bigint and Ratio; to the milligram only what is to weigh.
 */

export interface WeighDiluent {
  readonly diluentId: string;
  /** Its % of what is added («60»), or «» to share what is left; only read with two or more. */
  readonly share: string;
  /** What the scale showed («2.440»), or «». */
  readonly weighed: string;
}

export interface WeighRow {
  readonly key: string;
  readonly materialId: string;
  /** The bottle it is made from (V3-67, «desde otro frasco»), or null for pure. */
  readonly sourceId: string | null;
  /** The % wanted («10»). */
  readonly target: string;
  /** The total wanted in grams («15»), optional. */
  readonly total: string;
  /** What the scale showed of the material (or of the source bottle), or «». */
  readonly weighed: string;
  readonly diluents: readonly WeighDiluent[];
  /** A note for the bottle, from the row's «⋯». */
  readonly note: string;
}

export type RowStatus = "weighed" | "asIs" | "waiting";
/** Why a row waits: the % to write, a weight to finish, or what it cannot be. */
export type RowNeed = "target" | "diluent" | "weights" | "shares" | "further" | "amount" | null;

export interface Segment {
  readonly part: "material" | "diluent";
  /** For a diluent, its place in the row. */
  readonly index: number;
  /** Its share of the bottle. */
  readonly share: Ratio;
  /** Weighed (drawn full) or only planned (drawn dashed). */
  readonly weighed: boolean;
}

export interface RowState {
  readonly status: RowStatus;
  readonly need: RowNeed;
  /** What to put, in grey: the material and each diluent (null where there is nothing to say yet). */
  readonly goal: { readonly materialUg: bigint | null; readonly diluents: readonly (bigint | null)[] };
  /** Each diluent's % of what is added, as it is worked out (what the blank ones show as placeholder). */
  readonly shares: readonly Ratio[];
  /** All weighed: the bottle, exactly, kept to six decimals. */
  readonly real: (Shares & { readonly totalUg: bigint }) | null;
  /** Real minus wanted, in the bottle's fraction. */
  readonly diff: Ratio | null;
  /** What it saves as when nothing is weighed. */
  readonly aimed: Shares | null;
  /** The diluents as calc.ts takes them: each with its share of the whole bottle. */
  readonly planned: readonly PlannedDiluent[] | null;
  /** The thin bar of the row: the material against the diluents. */
  readonly bar: readonly Segment[];
  /** Each diluent still to pour: its goal while it is not weighed. */
  readonly toPour: readonly (bigint | null)[];
}

const HUNDRED = Ratio.of(100n);

/**
 * Each diluent's % of what is added (rule 7): the ones typed, and the blank ones sharing what is left
 * equally. With one diluent, all of it. null when they cannot add up to 100 %.
 */
export function sharesOf(diluents: readonly WeighDiluent[]): Ratio[] | null {
  if (diluents.length === 1) return [Ratio.ONE];
  const typed = diluents.map((d) => (d.share.trim() ? percentToFraction(d.share) : null));
  if (diluents.some((d, i) => d.share.trim() && (!typed[i] || typed[i]!.sign() < 0))) return null;
  const known = typed.reduce<Ratio>((sum, x) => (x ? sum.add(x) : sum), Ratio.ZERO);
  const blanks = typed.filter((x) => x === null).length;
  const left = Ratio.ONE.sub(known);
  if (blanks === 0 ? !left.isZero() : left.sign() <= 0) return null;
  const each = blanks ? left.div(Ratio.of(BigInt(blanks))) : Ratio.ZERO;
  return typed.map((x) => x ?? each);
}

/** The diluents as calc.ts reads them: each its share of the whole bottle; the last blank, «the rest». */
function plannedOf(diluents: readonly WeighDiluent[], shares: readonly Ratio[], added: Ratio): PlannedDiluent[] {
  const lastBlank = diluents.length > 1 ? diluents.map((d) => !d.share.trim()).lastIndexOf(true) : 0;
  return diluents.map((d, i) => ({ diluentId: d.diluentId, share: i === lastBlank ? null : added.mul(shares[i]) }));
}

const goalNone = (n: number) => ({ materialUg: null, diluents: Array<bigint | null>(n).fill(null) });

export function rowState(row: WeighRow, source?: SourceBottle): RowState {
  const n = row.diluents.length;
  const empty: RowState = { status: "waiting", need: "target", goal: goalNone(n), shares: [], real: null, diff: null, aimed: null, planned: null, bar: [], toPour: Array(n).fill(null) };
  if (n === 0 || row.diluents.some((d) => !d.diluentId)) return { ...empty, need: "diluent" };
  if (new Set(row.diluents.map((d) => d.diluentId)).size !== n) return { ...empty, need: "diluent" };
  const target = percentToFraction(row.target);
  if (!target || target.sign() <= 0 || target.cmp(Ratio.ONE) >= 0) return empty;
  const s = source?.fraction ?? Ratio.ONE;
  if (target.cmp(s) >= 0) return { ...empty, need: "further" };
  const shares = sharesOf(row.diluents);
  if (!shares) return { ...empty, need: "shares" };
  // What the material takes of the bottle (p/s), and what is added to it.
  const taken = target.div(s);
  const added = Ratio.ONE.sub(taken);
  const planned = plannedOf(row.diluents, shares, added);
  const base = { shares, planned };

  const typedWeights = [row.weighed, row.total, ...row.diluents.map((d) => d.weighed)].filter((x) => x.trim());
  if (typedWeights.some((x) => gramsToUg(x) === null)) return { ...empty, ...base, need: "amount" };
  const m = gramsToUg(row.weighed);
  const ds = row.diluents.map((d) => gramsToUg(d.weighed));
  const T = gramsToUg(row.total);

  let aimed: Shares;
  try {
    aimed = storedBottle(nominalBottle(target, planned, source));
  } catch {
    return { ...empty, ...base, need: "shares" };
  }

  // What to put (rules 2 and 3): the material from the total, or from the first diluent weighed while it is
  // not weighed itself; the diluents from the material weighed, else the first diluent weighed, else the total.
  const firstD = ds.findIndex((x) => x !== null);
  let fromTotal, fromDiluent, fromMaterial;
  try {
    fromTotal = T ? plan(target, T, planned, source) : null;
    fromDiluent = firstD >= 0 ? planFromDiluent(target, row.diluents[firstD].diluentId, ds[firstD]!, planned, source) : null;
    fromMaterial = m ? planFromMaterial(target, m, planned, source) : null;
  } catch {
    return { ...empty, ...base, need: "shares" };
  }
  const massOf = (p: { readonly diluents: readonly { readonly diluentId: string; readonly massUg: bigint }[] } | null, i: number) =>
    p ? (p.diluents.find((d) => d.diluentId === row.diluents[i].diluentId)?.massUg ?? null) : null;
  const goalMaterial = fromTotal?.materialUg ?? (m === null ? (fromDiluent?.materialUg ?? null) : null);
  const by = fromMaterial ?? fromDiluent ?? fromTotal;
  const goalDiluents = row.diluents.map((_, i) => massOf(by, i));
  const goal = { materialUg: goalMaterial, diluents: goalDiluents };
  const toPour = goalDiluents.map((g, i) => (ds[i] === null ? g : null));

  // The bar: weighed parts full, planned ones dashed; by mass when there are masses, else by the shares aimed at.
  const masses = [m ?? goalMaterial, ...ds.map((d, i) => d ?? goalDiluents[i])];
  const known = masses.every((x) => x !== null && x > 0n);
  const sum = known ? masses.reduce<bigint>((a, x) => a + x!, 0n) : 0n;
  const parts = known ? masses.map((x) => Ratio.of(x!, sum)) : [taken, ...shares.map((r) => added.mul(r))];
  const weighedFlags = [m !== null, ...ds.map((d) => d !== null)];
  const bar: Segment[] = parts.map((share, i) => ({ part: i === 0 ? "material" : "diluent", index: i === 0 ? 0 : i - 1, share, weighed: weighedFlags[i] }));

  const all = m !== null && ds.every((d) => d !== null);
  const none = m === null && ds.every((d) => d === null);
  if (all) {
    let real: Shares & { totalUg: bigint };
    try {
      real = storedBottle(bottleOf({ materialUg: m, diluents: row.diluents.map((d, i) => ({ diluentId: d.diluentId, massUg: ds[i]! })), source }));
    } catch {
      return { ...empty, ...base, need: "weights" };
    }
    return { status: "weighed", need: null, goal, ...base, real, diff: real.fraction.sub(target), aimed, bar, toPour };
  }
  if (none) return { status: "asIs", need: null, goal, ...base, real: null, diff: null, aimed, bar, toPour };
  return { status: "waiting", need: "weights", goal, ...base, real: null, diff: null, aimed, bar, toPour };
}

/** «Still to pour today» (the foot of the user's sheets): what is left to pour of each diluent, added up. */
export function stillToPour(rows: readonly { readonly row: WeighRow; readonly state: RowState }[]): Map<string, bigint> {
  const by = new Map<string, bigint>();
  for (const { row, state } of rows) {
    if (state.status === "weighed") continue;
    state.toPour.forEach((ug, i) => {
      if (ug === null) return;
      const id = row.diluents[i].diluentId;
      by.set(id, (by.get(id) ?? 0n) + ug);
    });
  }
  return by;
}

/** «7 rows · 2 weighed · 3 without weights · 2 unfinished». */
export function tally(states: readonly RowState[]): { readonly rows: number; readonly weighed: number; readonly asIs: number; readonly waiting: number } {
  return {
    rows: states.length,
    weighed: states.filter((s) => s.status === "weighed").length,
    asIs: states.filter((s) => s.status === "asIs").length,
    waiting: states.filter((s) => s.status === "waiting").length,
  };
}

/** The % as the user wrote it, to name the bottle (V3-87): «at 10 %». */
export const labelOf = (target: string): string => `at ${target.trim().replace(",", ".")} %`;

/** The % in a share's placeholder: «40». */
export const shareText = (share: Ratio): string => {
  const p = share.mul(HUNDRED);
  return p.isInteger() ? p.num.toString() : p.toFixed(1);
};
