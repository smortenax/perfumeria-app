import type { Change } from "../core/model/formula";
import type { NewEvent } from "../db/formulas";

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
