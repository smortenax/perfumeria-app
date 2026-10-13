import { Ratio } from "../arith/ratio";
import { sha256Hex } from "../hash/sha256";
import type { Material } from "./material";

/**
 * A formula frozen as a material (decisions §2.4): the exact proportion of each
 * component, diluents included, flattened down to materials that are not
 * formulas. Only this travels when a formula is used inside another one: no
 * history, no tare, no batches, no notes.
 */
export interface VectorComponent {
  readonly material: Material;
  readonly proportion: Ratio;
}

export interface Vector {
  /** Derived from the components: identical compositions share it, any edit changes it. */
  readonly id: string;
  /** Sorted by key; the proportions add up to exactly 1. */
  readonly components: readonly VectorComponent[];
}

const FORMAT = "vector/1";

/**
 * Builds a vector from amounts in any unit: merges repeated materials,
 * turns amounts into exact proportions, sorts by key and computes the ID.
 */
export function makeVector(amounts: Iterable<{ material: Material; amount: Ratio }>): Vector {
  const byKey = new Map<string, { material: Material; amount: Ratio }>();
  for (const { material, amount } of amounts) {
    if (material.kind === "formula") {
      throw new Error(`A vector is flat: expand "${material.name}" before building it`);
    }
    if (amount.sign() < 0) {
      throw new RangeError(`Negative amount for "${material.name}"`);
    }
    if (amount.isZero()) {
      continue;
    }
    const previous = byKey.get(material.key);
    byKey.set(material.key, { material, amount: previous ? previous.amount.add(amount) : amount });
  }
  const total = Ratio.sum([...byKey.values()].map((entry) => entry.amount));
  if (total.isZero()) {
    throw new RangeError("An empty vector has no proportions");
  }
  const components = [...byKey.values()]
    .map((entry) => ({ material: entry.material, proportion: entry.amount.div(total) }))
    .sort((a, b) => compareKeys(a.material.key, b.material.key));
  return { id: vectorId(components), components };
}

/** The exact text the ID is computed from: one line per component. */
export function canonicalVector(components: readonly VectorComponent[]): string {
  return [FORMAT, ...components.map((c) => `${c.material.key}\t${c.proportion.toString()}`)].join("\n");
}

export function vectorId(components: readonly VectorComponent[]): string {
  return `vec:${sha256Hex(canonicalVector(components))}`;
}

function compareKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
