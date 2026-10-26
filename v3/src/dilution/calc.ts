import { Ratio } from "../core/arith/ratio";

/**
 * The arithmetic of a bottle (V3-65, V3-67): what to weigh for the bottle you want, and what the
 * bottle is from what you weighed. Exact throughout; the scale's precision (1 mg) only where it is
 * weighed, and six decimals only where a figure is kept (STORED_PLACES).
 */

/** The scale weighs to the milligram (0,001 g): what the app tells you to weigh is rounded to it. */
export const SCALE_UG = 1000n;
/** A kept fraction has six decimals (0,0001 %): below what a 0,001 g scale can tell on a bottle. */
export const STORED_PLACES = 6;

/** A diluent in the plan: its material and its share of the whole bottle, or null for «the rest». */
export interface PlannedDiluent {
  readonly diluentId: string;
  readonly share: Ratio | null;
}

/** A bottle made from another: its pure matter and its diluents, as shares of it. */
export interface SourceBottle {
  readonly fraction: Ratio;
  readonly diluents: readonly { readonly diluentId: string; readonly fraction: Ratio }[];
}

export interface Plan {
  /** The material to weigh (or, from another bottle, how much of that bottle). */
  readonly materialUg: bigint;
  readonly diluents: readonly { readonly diluentId: string; readonly massUg: bigint }[];
}

const roundTo = (value: Ratio, unit: bigint): bigint => {
  // Half up, on micrograms: (2·num + den) / (2·den·unit) · unit.
  const q = (2n * value.num + value.den * unit) / (2n * value.den * unit);
  return q * unit;
};

/**
 * What to weigh for a bottle of `totalUg` with `target` of pure matter. The diluents take the rest:
 * each its share of the bottle, and the one without share (at most one: the last, «resto») what is
 * left. From another bottle, its own diluents count, and the ones you add fill up to the total.
 */
export function plan(target: Ratio, totalUg: bigint, diluents: readonly PlannedDiluent[], source?: SourceBottle): Plan {
  if (target.num <= 0n || target.cmp(Ratio.ONE) >= 0) throw new RangeError("a dilution is above 0 % and below 100 %");
  if (totalUg <= 0n) throw new RangeError("a bottle weighs above 0");
  if (diluents.length === 0) throw new Error("a dilution has at least one diluent");
  if (diluents.filter((d) => d.share === null).length > 1) throw new Error("only one diluent takes the rest");
  const total = Ratio.of(totalUg);
  if (source && target.cmp(source.fraction) >= 0) throw new RangeError("from a bottle you only dilute further");
  const head = source ? total.mul(target).div(source.fraction) : total.mul(target);
  const materialUg = roundTo(head, SCALE_UG);
  const fixed = diluents.filter((d) => d.share !== null).map((d) => ({ diluentId: d.diluentId, massUg: roundTo(total.mul(d.share!), SCALE_UG) }));
  const left = totalUg - materialUg - fixed.reduce((sum, d) => sum + d.massUg, 0n);
  const rest = diluents.find((d) => d.share === null);
  // Without «resto», the shares must fill the bottle; what rounding to the milligram leaves goes to the last one.
  const slack = SCALE_UG * BigInt(diluents.length);
  if (rest ? left < 0n : left > slack || left < -slack) throw new RangeError("the shares of the diluents do not add up to the bottle");
  const masses = diluents.map((d) => (d.share === null ? { diluentId: d.diluentId, massUg: left } : fixed.find((f) => f.diluentId === d.diluentId)!));
  if (!rest) masses[masses.length - 1] = { ...masses[masses.length - 1], massUg: masses[masses.length - 1].massUg + left };
  return { materialUg, diluents: masses.filter((d) => d.massUg > 0n) };
}

/** A plan read the other way round (V3-79): the bottle and its diluents for the material already weighed. */
export interface PlanFromMaterial extends Plan {
  readonly totalUg: bigint;
}

/**
 * What to add to `materialUg` already weighed (or, from another bottle, taken from it) to reach
 * `target` (V3-79, «material pesado»). The same rules as `plan()`: each diluent its share of the
 * bottle, the one without share the rest. The bottle is exact; each diluent, to the milligram.
 */
export function planFromMaterial(target: Ratio, materialUg: bigint, diluents: readonly PlannedDiluent[], source?: SourceBottle): PlanFromMaterial {
  if (target.num <= 0n || target.cmp(Ratio.ONE) >= 0) throw new RangeError("a dilution is above 0 % and below 100 %");
  if (materialUg <= 0n) throw new RangeError("the material weighs above 0");
  if (diluents.length === 0) throw new Error("a dilution has at least one diluent");
  if (diluents.filter((d) => d.share === null).length > 1) throw new Error("only one diluent takes the rest");
  if (source && target.cmp(source.fraction) >= 0) throw new RangeError("from a bottle you only dilute further");
  const pure = source ? Ratio.of(materialUg).mul(source.fraction) : Ratio.of(materialUg);
  const totalUg = roundTo(pure.div(target), SCALE_UG);
  const total = Ratio.of(totalUg);
  const fixed = diluents.map((d) => (d.share === null ? null : roundTo(total.mul(d.share), SCALE_UG)));
  const left = totalUg - materialUg - fixed.reduce<bigint>((sum, m) => sum + (m ?? 0n), 0n);
  const rest = diluents.some((d) => d.share === null);
  const slack = SCALE_UG * BigInt(diluents.length);
  if (rest ? left < 0n : left > slack || left < -slack) throw new RangeError("the shares of the diluents do not add up to the bottle");
  const masses = diluents.map((d, i) => ({ diluentId: d.diluentId, massUg: fixed[i] ?? left }));
  if (!rest) masses[masses.length - 1] = { ...masses[masses.length - 1], massUg: masses[masses.length - 1].massUg + left };
  return { totalUg, materialUg, diluents: masses.filter((d) => d.massUg > 0n) };
}

/** The examples in grey under the window (V3-79): what to weigh for 1 g and for 10 g of the bottle. */
export const EXAMPLE_TOTALS_UG: readonly bigint[] = [1_000_000n, 10_000_000n];

export function examples(target: Ratio, diluents: readonly PlannedDiluent[], source?: SourceBottle): { readonly totalUg: bigint; readonly plan: Plan }[] {
  return EXAMPLE_TOTALS_UG.map((totalUg) => ({ totalUg, plan: plan(target, totalUg, diluents, source) }));
}

export interface Weighed {
  /** The material weighed in, or, from another bottle, how much of that bottle. */
  readonly materialUg: bigint;
  readonly diluents: readonly { readonly diluentId: string; readonly massUg: bigint }[];
  readonly source?: SourceBottle;
}

export interface Bottle {
  readonly fraction: Ratio;
  readonly diluents: readonly { readonly diluentId: string; readonly fraction: Ratio; readonly massUg: bigint | null }[];
  readonly totalUg: bigint;
}

/** What a bottle is, exactly, from what was weighed: its pure matter and each diluent's share. */
export function bottleOf(w: Weighed): Bottle {
  if (w.materialUg <= 0n) throw new RangeError("the material weighs above 0");
  for (const d of w.diluents) if (d.massUg <= 0n) throw new RangeError("a diluent weighs above 0");
  if (new Set(w.diluents.map((d) => d.diluentId)).size !== w.diluents.length) throw new Error("a diluent is listed once");
  const totalUg = w.materialUg + w.diluents.reduce((sum, d) => sum + d.massUg, 0n);
  const total = Ratio.of(totalUg);
  const head = Ratio.of(w.materialUg);
  const pure = w.source ? head.mul(w.source.fraction) : head;
  const shares = new Map<string, { mass: Ratio; weighed: bigint | null }>();
  for (const d of w.source?.diluents ?? []) shares.set(d.diluentId, { mass: head.mul(d.fraction), weighed: null });
  for (const d of w.diluents) {
    const before = shares.get(d.diluentId);
    shares.set(d.diluentId, { mass: (before?.mass ?? Ratio.ZERO).add(Ratio.of(d.massUg)), weighed: d.massUg });
  }
  if (shares.size === 0) throw new Error("a dilution has at least one diluent");
  return {
    fraction: pure.div(total),
    diluents: [...shares].map(([diluentId, s]) => ({ diluentId, fraction: s.mass.div(total), massUg: s.weighed })),
    totalUg,
  };
}

/** A fraction to six decimals, half up (STORED_PLACES). */
export function stored(value: Ratio): Ratio {
  const scale = 10n ** BigInt(STORED_PLACES);
  const q = (2n * value.num * scale + value.den) / (2n * value.den);
  return Ratio.of(q, scale);
}

/**
 * The bottle as it is kept: every share to six decimals, adding up to exactly 1. What rounding moves
 * goes to the largest diluent, where it weighs least.
 */
export function storedBottle(b: Bottle): Bottle {
  const fraction = stored(b.fraction);
  const diluents = b.diluents.map((d) => ({ ...d, fraction: stored(d.fraction) }));
  const sum = diluents.reduce((s, d) => s.add(d.fraction), fraction);
  const largest = diluents.reduce((at, d, i) => (d.fraction.gt(diluents[at].fraction) ? i : at), 0);
  diluents[largest] = { ...diluents[largest], fraction: diluents[largest].fraction.add(Ratio.ONE.sub(sum)) };
  return { ...b, fraction, diluents };
}
