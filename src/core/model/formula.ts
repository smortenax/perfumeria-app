import type { Ratio } from "../arith/ratio";
import type { Material } from "./material";

/** The container, weighed with the precision of the work (decisions §3.3). */
export interface Container {
  readonly capacityMl: Ratio | null;
  /** Unknown until weighed: never zero by default (§1.2). */
  readonly tareUg: bigint | null;
}

export interface FormulaHeader {
  readonly name: string;
  /** What the formula is for, in free text (P23). */
  readonly intention: string;
  readonly container: Container | null;
  /** Work batch: what is being formulated. */
  readonly workBatchUg: bigint | null;
  /** Final batch: the expected one, with the alcohol. IFRA is measured on it. */
  readonly finalBatchUg: bigint | null;
  /** Its place among the versions of a formula, once it has more than one (P44). */
  readonly version?: FormulaVersion;
}

/**
 * The versions of a formula (P44): each one is a whole formula of its own (§3.2); the
 * family only says they belong together, and from which one each came. Readable data,
 * not a link.
 */
export interface FormulaVersion {
  /** The same for every version of the formula. */
  readonly family: string;
  /** 1, 2, 3… in the order they were made. */
  readonly number: number;
  /** The number of the version it came from; null for the first. */
  readonly from: number | null;
}

/**
 * The second diluent of a pour made in a mixture of two (2026-10-08): the diluent and its share of
 * what was poured. The line's own diluent takes what is left after the pure matter and this one.
 */
export interface SecondDiluent {
  readonly material: Material;
  /** Share of the mass poured: above 0, and leaving some of it to the first diluent. */
  readonly fraction: Ratio;
}

/**
 * One change of the history (decisions §3.4). Each change is a frame, not a
 * moment in time; the current composition is derived from all of them.
 */
export type Change =
  /** Pours a material: its mass as weighed, the final fraction of pure matter and the diluent. */
  | {
      readonly kind: "add";
      readonly id: string;
      readonly material: Material;
      readonly massUg: bigint;
      readonly fraction: Ratio;
      readonly diluent: Material | null;
      /** With a mixture of two diluents, the second one; absent with one diluent or none. */
      readonly secondDiluent?: SecondDiluent;
    }
  /** Free editing (§3.1): a line gets a new mass. */
  | { readonly kind: "set-mass"; readonly id: string; readonly target: string; readonly massUg: bigint }
  /** Free editing (§3.1): a line goes away. */
  | { readonly kind: "remove"; readonly id: string; readonly target: string }
  /**
   * Reopening by weighing (§3.5): gross weight minus tare is what really remains.
   * The tare goes with the weighing, because a variation may move to a new vial.
   */
  | { readonly kind: "reweigh"; readonly id: string; readonly grossUg: bigint; readonly tareUg: bigint }
  /** A note marks a point of the history (§3.4). */
  | { readonly kind: "note"; readonly id: string; readonly text: string };

export interface Formula {
  readonly header: FormulaHeader;
  readonly history: readonly Change[];
}
