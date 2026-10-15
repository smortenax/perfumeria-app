import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { compose } from "../core/compose";
import type { Change, Formula } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { undoOf } from "./undo";

/** Plan v3, step 8.2: undoing adds the opposite event, and composing it gives back what was before. */

const lin: Material = { key: "lin", kind: "base", name: "Linalool" };
const dpg: Material = { key: "dpg", kind: "base", name: "DPG", solvent: true };
const header = { name: "F", intention: "", container: { capacityMl: null, tareUg: 1_000_000n }, workBatchUg: null, finalBatchUg: null };
const formula = (...history: Change[]): Formula => ({ header, history });
const pour: Change = { kind: "add", id: "a1", material: lin, massUg: 1000n, fraction: Ratio.of(1n, 10n), diluent: dpg };
/** The change an undo adds, as the engine reads it once written. */
const applied = (f: Formula, id: string): Formula => {
  const u = undoOf(f);
  if (!("event" in u)) throw new Error(u.refused);
  const e = u.event;
  const change: Change =
    e.kind === "add"
      ? { kind: "add", id, material: e.materialId === "lin" ? lin : dpg, massUg: e.massUg, fraction: e.fraction, diluent: e.diluentId === "dpg" ? dpg : null }
      : e.kind === "set_mass"
        ? { kind: "set-mass", id, target: e.target, massUg: e.massUg }
        : e.kind === "remove"
          ? { kind: "remove", id, target: e.target }
          : (() => {
              throw new Error(e.kind);
            })();
  return formula(...f.history, change);
};
const parts = (f: Formula) => compose(f).parts.map((p) => [p.material.key, p.massUg.toString()]);

describe("undo adds the opposite of the last change (8.2)", () => {
  it("a pour is taken away", () => {
    expect(parts(applied(formula(pour), "u1"))).toEqual([]);
  });

  it("a new mass goes back to the one before", () => {
    const f = formula(pour, { kind: "set-mass", id: "s1", target: "a1", massUg: 3000n });
    expect(parts(applied(f, "u1"))).toEqual(parts(formula(pour)));
  });

  it("a line taken away is poured again as it was", () => {
    const f = formula(pour, { kind: "remove", id: "r1", target: "a1" });
    expect(parts(applied(f, "u1"))).toEqual(parts(formula(pour)));
  });

  it("undoing the undo works again: it is one more change", () => {
    const once = applied(formula(pour, { kind: "remove", id: "r1", target: "a1" }), "u1");
    expect(parts(applied(once, "u2"))).toEqual([]);
  });

  it("a reweighing, a note, a fraction of a microgram and an empty history are refused, and say why", () => {
    expect(undoOf(formula())).toEqual({ refused: "empty" });
    expect(undoOf(formula(pour, { kind: "note", id: "n", text: "x" }))).toEqual({ refused: "note" });
    const reweighed = formula(pour, { kind: "reweigh", id: "w", grossUg: 1_000_700n, tareUg: 1_000_000n });
    expect(undoOf(reweighed)).toEqual({ refused: "reweigh" });
    expect(undoOf(formula(...reweighed.history, { kind: "remove", id: "r", target: "a1" }))).toMatchObject({ event: { kind: "add" } });
    expect(undoOf(formula(pour, { kind: "add", id: "a2", material: lin, massUg: 3n, fraction: Ratio.ONE, diluent: null }, { kind: "reweigh", id: "w", grossUg: 1_000_001n, tareUg: 1_000_000n }, { kind: "remove", id: "r", target: "a1" }))).toEqual({ refused: "inexact" });
  });
});
