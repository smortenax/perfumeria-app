import type { Change, FormulaHeader } from "../core/model/formula";
import type { FormulaHeaderChanges, NewEvent } from "../db/formulas";

/** A change of the engine as the event the v3 keeps (plan 8.2): by the materials' ids in the v3. */
export function eventOf(c: Change, idOf: (key: string) => string): NewEvent {
  switch (c.kind) {
    case "add":
      return {
        kind: "add",
        materialId: idOf(c.material.key),
        massUg: c.massUg,
        fraction: c.fraction,
        diluentId: c.diluent ? idOf(c.diluent.key) : null,
        ...(c.secondDiluent ? { secondDiluent: { materialId: idOf(c.secondDiluent.material.key), fraction: c.secondDiluent.fraction } } : {}),
      };
    case "set-mass":
      return { kind: "set_mass", target: c.target, massUg: c.massUg };
    case "remove":
      return { kind: "remove", target: c.target };
    case "reweigh":
      return { kind: "reweigh", grossUg: c.grossUg, tareUg: c.tareUg };
    case "note":
      return { kind: "note", text: c.text };
  }
}

/** What a header edit changes, field by field: only that is written (the rest may be stale). */
export function headerChanges(before: FormulaHeader, after: FormulaHeader): FormulaHeaderChanges {
  const changes: { -readonly [K in keyof FormulaHeaderChanges]: FormulaHeaderChanges[K] } = {};
  if (after.name !== before.name) changes.name = after.name;
  if (after.intention !== before.intention) changes.intention = after.intention;
  const capacity = (h: FormulaHeader) => h.container?.capacityMl ?? null;
  const [c0, c1] = [capacity(before), capacity(after)];
  if (!(c0 === null ? c1 === null : c1 !== null && c0.eq(c1))) changes.containerCapacityMl = c1;
  const tare = (h: FormulaHeader) => h.container?.tareUg ?? null;
  if (tare(after) !== tare(before)) changes.containerTareUg = tare(after);
  if (after.workBatchUg !== before.workBatchUg) changes.workBatchUg = after.workBatchUg;
  if (after.finalBatchUg !== before.finalBatchUg) changes.finalBatchUg = after.finalBatchUg;
  return changes;
}
