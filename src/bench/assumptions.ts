import { Ratio } from "../core/arith/ratio";
import type { Formula } from "../core/model/formula";
import type { CatalogEntry, Weighing } from "../data/catalog";

/**
 * What the bar assumed for the lines of the formula (D12), said again where the IFRA is read: a line poured at the
 * concentration the product proposed, when that concentration was a range (the maximum went in) or the product as it is
 * bought. A line the user poured at another concentration assumes nothing.
 */
export interface Assumption {
  readonly material: string;
  readonly text: string;
}

/**
 * What the bar proposes for a material the user picks (D12): what the product says it is weighed at, only when he has not
 * chosen a dilution for it yet (his last one wins) and it is not a solvent.
 */
export function proposedWeighing(entry: CatalogEntry | undefined, solvent: boolean | undefined, hasLast: boolean): Weighing | undefined {
  return hasLast || solvent ? undefined : entry?.weighing;
}

export function assumptionsOf(formula: Formula, entryOf: (key: string) => CatalogEntry | undefined): Assumption[] {
  const found = new Map<string, Assumption>();
  for (const change of formula.history) {
    if (change.kind !== "add") {
      continue;
    }
    const weighing = entryOf(change.material.key)?.weighing;
    if (!weighing || found.has(change.material.key)) {
      continue;
    }
    if (change.fraction.eq(Ratio.fromDecimal(weighing.percent).div(Ratio.of(100)))) {
      found.set(change.material.key, { material: change.material.name, text: `pesado al ${weighing.percent.replace(".", ",")} %: ${weighing.why}.` });
    }
  }
  return [...found.values()];
}
