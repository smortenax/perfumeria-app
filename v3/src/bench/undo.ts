import { replay } from "../core/compose";
import type { Formula } from "../core/model/formula";
import type { NewEvent } from "../db/formulas";

/**
 * Undo in the v3 (plan 8.2): a history is only added to, so undoing adds the opposite of the last
 * change. A pour is taken away; a new mass goes back to the one before; a line taken away is poured
 * again as it was. A reweighing and a note have no exact opposite, and a mass that a reweighing left
 * as a fraction of a microgram cannot be poured back exactly: those are refused, and said so.
 */
export type Undo = { readonly event: NewEvent } | { readonly refused: "empty" | "reweigh" | "note" | "inexact" | "missing" };

export function undoOf(formula: Formula): Undo {
  const n = formula.history.length;
  const last = formula.history[n - 1];
  if (!last) return { refused: "empty" };
  switch (last.kind) {
    case "add":
      return { event: { kind: "remove", target: last.id } };
    case "reweigh":
      return { refused: "reweigh" };
    case "note":
      return { refused: "note" };
    case "set-mass":
    case "remove": {
      const before = replay(formula, n - 1).find((line) => line.id === last.target);
      if (!before) return { refused: "missing" };
      if (!before.massUg.isInteger()) return { refused: "inexact" };
      const massUg = before.massUg.num / before.massUg.den;
      if (last.kind === "set-mass") return { event: { kind: "set_mass", target: last.target, massUg } };
      return {
        event: {
          kind: "add",
          materialId: before.material.key,
          massUg,
          fraction: before.fraction,
          diluentId: before.diluent?.key ?? null,
          ...(before.secondDiluent ? { secondDiluent: { materialId: before.secondDiluent.material.key, fraction: before.secondDiluent.fraction } } : {}),
        },
      };
    }
  }
}
