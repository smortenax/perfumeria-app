import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { FormulaHeader } from "../core/model/formula";
import { headerChanges } from "./events";

/**
 * The header of a formula, edited in the workbench (plan 8.2): only what changed is written. In the
 * test phase, the tare, the work batch and the final batch typed one after another came back as
 * only the last: each edit wrote the whole header as it was when it was made, the others' fields
 * still empty, and undid them.
 */
const header: FormulaHeader = { name: "F", intention: "", container: null, workBatchUg: null, finalBatchUg: null };

describe("a header edit writes only what it changes", () => {
  it("three edits made on the same header, before any comes back, touch one field each", () => {
    const tare = headerChanges(header, { ...header, container: { capacityMl: null, tareUg: 25_000_000n } });
    const work = headerChanges(header, { ...header, workBatchUg: 1_000_000n });
    const final = headerChanges(header, { ...header, finalBatchUg: 10_000_000n });
    expect(tare).toEqual({ containerTareUg: 25_000_000n });
    expect(work).toEqual({ workBatchUg: 1_000_000n });
    expect(final).toEqual({ finalBatchUg: 10_000_000n });
  });

  it("the same header changes nothing; a capacity is compared by its value", () => {
    const withVial: FormulaHeader = { ...header, container: { capacityMl: Ratio.of(30n), tareUg: 25_000_000n } };
    expect(headerChanges(withVial, { ...withVial, container: { capacityMl: Ratio.of(60n, 2n), tareUg: 25_000_000n } })).toEqual({});
    expect(headerChanges(withVial, { ...withVial, container: null })).toEqual({ containerCapacityMl: null, containerTareUg: null });
    expect(headerChanges(header, { ...header, name: "G", intention: "otra" })).toEqual({ name: "G", intention: "otra" });
  });
});
