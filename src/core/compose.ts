import { Ratio } from "./arith/ratio";
import type { Formula, SecondDiluent } from "./model/formula";
import type { Material } from "./model/material";
import { makeVector, type Vector } from "./model/vector";

/** A line of the formula as it stands after replaying the history. */
export interface Line {
  /** The ID of the change that poured it. */
  readonly id: string;
  readonly material: Material;
  /** Exact: whole micrograms when weighed, a fraction after reweighing. */
  readonly massUg: Ratio;
  /** Final fraction of pure matter in what was poured. */
  readonly fraction: Ratio;
  readonly diluent: Material | null;
  /** With a mixture of two diluents, the second one and its share of what was poured. */
  readonly secondDiluent?: SecondDiluent;
}

/** How much of one substance is in the bottle. */
export interface Part {
  readonly material: Material;
  readonly massUg: Ratio;
}

export interface Composition {
  /** The current lines, in the order they were poured. */
  readonly lines: readonly Line[];
  /** What is in the bottle, one entry per substance, largest first; solvents included. */
  readonly parts: readonly Part[];
  /** Everything in the bottle. */
  readonly totalUg: Ratio;
  /** Pure matter that is not a solvent. */
  readonly aromaticUg: Ratio;
}

/**
 * Replays the history up to a frame (all of it by default) and returns the
 * lines as they stand. There is a single source of truth: the history (§3.4).
 */
export function replay(formula: Formula, upTo = formula.history.length): Line[] {
  const lines = new Map<string, Line>();
  for (const change of formula.history.slice(0, upTo)) {
    switch (change.kind) {
      case "add": {
        checkAdd(change.material, change.fraction, change.diluent, change.massUg, change.secondDiluent);
        lines.set(change.id, {
          id: change.id,
          material: change.material,
          massUg: Ratio.of(change.massUg),
          fraction: change.fraction,
          diluent: change.diluent,
          ...(change.secondDiluent ? { secondDiluent: change.secondDiluent } : {}),
        });
        break;
      }
      case "set-mass": {
        const line = lines.get(change.target);
        if (!line) {
          throw new Error(`Change ${change.id} edits a line that does not exist: ${change.target}`);
        }
        if (change.massUg <= 0n) {
          throw new RangeError(`Change ${change.id}: a mass must be greater than zero`);
        }
        lines.set(line.id, { ...line, massUg: Ratio.of(change.massUg) });
        break;
      }
      case "remove": {
        if (!lines.delete(change.target)) {
          throw new Error(`Change ${change.id} removes a line that does not exist: ${change.target}`);
        }
        break;
      }
      case "reweigh": {
        // The tare it was weighed with, not today's: a variation in a new vial keeps
        // the reweighings of the old one right (§3.2).
        const remaining = Ratio.of(change.grossUg - change.tareUg);
        if (remaining.sign() <= 0) {
          throw new RangeError(`Change ${change.id}: the gross weight is not above the tare`);
        }
        const current = Ratio.sum([...lines.values()].map((line) => line.massUg));
        if (current.isZero()) {
          throw new Error(`Change ${change.id}: there is nothing to reweigh`);
        }
        // Everything is scaled alike: true for what leaves the vial by use, not for
        // what evaporates, which takes the alcohol and the top notes first (§3.5).
        const factor = remaining.div(current);
        for (const line of [...lines.values()]) {
          lines.set(line.id, { ...line, massUg: line.massUg.mul(factor) });
        }
        break;
      }
      case "note":
        break;
    }
  }
  return [...lines.values()];
}

/** Splits one line into the substances it brings: pure matter and diluent (or the two of a mixture). */
export function breakdown(line: Line): Part[] {
  const pure = line.massUg.mul(line.fraction);
  const parts: Part[] = [];
  if (line.material.kind === "formula") {
    const vector = line.material.vector;
    if (!vector) {
      throw new Error(`"${line.material.name}" is a formula without its vector`);
    }
    for (const component of vector.components) {
      parts.push({ material: component.material, massUg: pure.mul(component.proportion) });
    }
  } else {
    parts.push({ material: line.material, massUg: pure });
  }
  const diluted = line.massUg.sub(pure);
  if (!diluted.isZero()) {
    // checkAdd guarantees a diluent whenever the fraction is below 1, and a share of it beside a second one.
    const second = line.secondDiluent ? line.massUg.mul(line.secondDiluent.fraction) : Ratio.ZERO;
    parts.push({ material: line.diluent as Material, massUg: diluted.sub(second) });
    if (line.secondDiluent) {
      parts.push({ material: line.secondDiluent.material, massUg: second });
    }
  }
  return parts;
}

/** The composition at a frame of the history (all of it by default). */
export function compose(formula: Formula, upTo?: number): Composition {
  const lines = replay(formula, upTo);
  const byKey = new Map<string, Part>();
  for (const part of lines.flatMap(breakdown)) {
    const previous = byKey.get(part.material.key);
    byKey.set(part.material.key, previous ? { ...previous, massUg: previous.massUg.add(part.massUg) } : part);
  }
  const parts = [...byKey.values()].sort((a, b) => b.massUg.cmp(a.massUg));
  const totalUg = Ratio.sum(lines.map((line) => line.massUg));
  const aromaticUg = Ratio.sum(parts.filter((p) => !p.material.solvent).map((p) => p.massUg));
  return { lines, parts, totalUg, aromaticUg };
}

/** Freezes the current composition as a material (§2.4, §3.6): exact, flat, diluents included. */
export function vectorOf(formula: Formula): Vector {
  const { parts } = compose(formula);
  return makeVector(parts.map((part) => ({ material: part.material, amount: part.massUg })));
}

function checkAdd(material: Material, fraction: Ratio, diluent: Material | null, massUg: bigint, second?: SecondDiluent): void {
  if (massUg <= 0n) {
    throw new RangeError(`"${material.name}": a mass must be greater than zero`);
  }
  if (fraction.sign() <= 0 || fraction.gt(Ratio.ONE)) {
    throw new RangeError(`"${material.name}": the fraction of pure matter must be above 0 and at most 1`);
  }
  if (fraction.lt(Ratio.ONE) && !diluent) {
    // An unknown diluent cannot silently vanish (§1.2): the add bar always carries one.
    throw new Error(`"${material.name}" is diluted but has no diluent`);
  }
  if (second) {
    if (!diluent || !fraction.lt(Ratio.ONE)) {
      throw new Error(`"${material.name}": a second diluent needs a first one`);
    }
    if (second.material.key === diluent.key) {
      throw new Error(`"${material.name}": the two diluents of a mixture are the same`);
    }
    if (second.fraction.sign() <= 0 || !fraction.add(second.fraction).lt(Ratio.ONE)) {
      // Each of the two must be there: a mixture where one gets nothing is a pour with one diluent.
      throw new RangeError(`"${material.name}": the second diluent must take above 0 and leave some to the first`);
    }
  }
}
