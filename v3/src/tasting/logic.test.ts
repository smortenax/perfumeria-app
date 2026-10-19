import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { Catalog, CatalogMaterial, Dilution } from "../db/catalog";
import type { TastingMoment, TastingStrip } from "../db/tastings";
import { blockState, buildQueue, changedBlocks, countdown, dueMoments, legacyTasted, nextWaiting, tenacity } from "./logic";

const APPLIED = "2026-10-18T10:00:00.000Z";
const at = (minutes: number) => new Date(Date.parse(APPLIED) + minutes * 60_000).toISOString();

function moment(partial: Partial<TastingMoment> & Pick<TastingMoment, "moment">): TastingMoment {
  return {
    id: partial.moment,
    stripId: "s",
    at: APPLIED,
    text: null, intensity: null, texture: null, temperature: null, shape: null, color: null, brightness: null, thingOrPlace: null, thingOrPlaceText: null,
    ownField: null, complexity: null, complexityNote: null, puff: null, revisedImage: null, metaphor: null, notes: null, nearDetectable: null,
    farDetectable: null, reviewed: [], families: [], battery: new Map(), curve: new Map(),
    ...partial,
  };
}

describe("the timers of a strip (V3-63)", () => {
  it("a tab is done once written, due once its minute has come, waiting before", () => {
    const due = dueMoments({ appliedAt: APPLIED }, ["t0"], ["t0", "t5", "t30"], Date.parse(at(6)));
    expect(due.map((d) => [d.moment, d.state])).toEqual([["t0", "done"], ["t5", "due"], ["t30", "waiting"]]);
    expect(nextWaiting(due)?.moment).toBe("t30");
    expect(countdown(nextWaiting(due)!.dueAt - Date.parse(at(6)))).toBe("24:00");
  });

  it("counts down in minutes, hours or days", () => {
    expect(countdown(299_000)).toBe("4:59");
    expect(countdown(3_900_000)).toBe("1 h 05");
    expect(countdown(3 * 86_400_000)).toBe("3 d");
    expect(countdown(-5)).toBe("0:00");
  });
});

describe("what a block of a tab says (the log's rule)", () => {
  it("written is data; reviewed and empty is «the same»; untouched is no data, never «no»", () => {
    const m = moment({ moment: "t30", text: "más dulce", reviewed: ["curve", "description"] });
    expect(blockState(m, "description")).toBe("data");
    expect(blockState(m, "curve")).toBe("same");
    expect(blockState(m, "battery")).toBe("none");
    expect(blockState(undefined, "battery")).toBe("none");
    expect(blockState(moment({ moment: "t5", battery: new Map([["soapy", "nr"]]) }), "battery")).toBe("none");
  });

  it("comparing two times shows only the blocks that changed", () => {
    const t5 = moment({ moment: "t5", intensity: 4, curve: new Map([[1, "high"]]), text: "floral" });
    const t30 = moment({ moment: "t30", intensity: 3, curve: new Map([[1, "high"]]), reviewed: ["description"] });
    expect(changedBlocks(t5, t30, ["description", "intensity", "curve"])).toEqual(["intensity"]);
  });
});

describe("the tenacity, in hours, from the tabs (V3-42, V3-62)", () => {
  const strip: Pick<TastingStrip, "appliedAt"> = { appliedAt: APPLIED };
  it("is the last tab still noticed close up; «at least» while none says no", () => {
    const ms = [moment({ moment: "t5", at: at(5), nearDetectable: true }), moment({ moment: "h24", at: at(1440), nearDetectable: true })];
    expect(tenacity(strip, ms)).toEqual({ hours: Ratio.of(24n), atLeast: true });
  });

  it("stops at the last yes when a later tab says no", () => {
    const ms = [moment({ moment: "t60", at: at(90), nearDetectable: true }), moment({ moment: "h24", at: at(1440), nearDetectable: false })];
    expect(tenacity(strip, ms)).toEqual({ hours: Ratio.of(3n, 2n), atLeast: false });
  });

  it("is unknown when no tab answered, never zero", () => {
    expect(tenacity(strip, [moment({ moment: "t5" })])).toBeNull();
  });
});

describe("the queue (V3-63)", () => {
  const mat = (id: string, name: string) => ({ id, name }) as CatalogMaterial;
  const dil = (id: string, pct: number, solvent: string | null, madeOn: string | null): Dilution => ({
    id, fraction: Ratio.of(BigInt(pct), 100n), solvent, madeOn, description: null,
  });
  const catalog = {
    materials: new Map([["a", mat("a", "Vetiver")], ["b", mat("b", "Benjuí")], ["c", mat("c", "Galaxolide")], ["d", mat("d", "Ámbar")], ["e", mat("e", "Iso E")]]),
    have: new Set(["a", "b", "c", "d", "e", "gone"]),
    dilutions: new Map([
      ["a", [dil("a1", 10, "DPG", "2026-08-01")]],
      ["b", [dil("b0", 50, "alcohol", "2026-07-01"), dil("b1", 10, "dpg", "2026-08-02")]],
      ["c", [dil("c1", 10, "DPG", null)]],
    ]),
    evaluations: new Map([["d", { id: "x", status: "catado (serie parcial)", smellingTip: null, reading: null, sheet: null }]]),
  } as unknown as Catalog;

  it("what you have and have not tasted, by dilution and solvent, the marked first", () => {
    const closedStrip = { materialId: "c", closedAt: at(2000) } as TastingStrip;
    const q = buildQueue(catalog, { strips: [closedStrip], marks: new Map([["e", "pedido 2026-10-18"]]) });
    expect(q.tasted).toBe(2); // c, closed in the app; d, the lab's sheet
    expect(q.pending).toBe(3);
    expect(q.marked.map((i) => i.name)).toEqual(["Iso E"]);
    // b's newest dilution is 10 % in dpg: with a, whatever the case of the solvent.
    expect(q.groups.map((g) => g.items.map((i) => i.materialId))).toEqual([["b", "a"], ["e"]]);
    expect(q.groups[1].key).toBeNull();
  });

  it("the lab's sheet counts as tasted only when it says so", () => {
    expect(legacyTasted("catado")).toBe(true);
    expect(legacyTasted("catado (serie parcial)")).toBe(true);
    expect(legacyTasted("sin catar")).toBe(false);
    expect(legacyTasted(null)).toBe(false);
  });
});
