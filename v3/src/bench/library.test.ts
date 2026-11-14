import { describe, expect, it } from "vitest";
import { inMyLibrary, maeseKeys } from "./library";

const entry = (key: string, group: "own" | "diluent" | "base") => ({ group, material: { key } }) as never;

describe("the add bar's libraries (2026-11-14)", () => {
  it("«My library» takes your versions, what you have and the diluents; not a common you do not have", () => {
    const have = new Set(["had"]);
    expect(inMyLibrary(entry("v", "own"), have)).toBe(true);
    expect(inMyLibrary(entry("had", "base"), have)).toBe(true);
    expect(inMyLibrary(entry("dpg", "diluent"), have)).toBe(true);
    expect(inMyLibrary(entry("other", "base"), have)).toBe(false);
    expect(inMyLibrary(entry("other", "base"), undefined)).toBe(false);
  });

  it("marks Maese Lab's materials by their sources, notes or supplier, and your versions of them", () => {
    const m = (id: string, extra: object = {}) => ({ id, basedOnId: null, sources: null, notes: null, supplier: null, ...extra });
    const keys = maeseKeys([
      m("cardamom-co2", { sources: "Name: Maese Lab, https://maeselab.com/cardamomo-co2/" }),
      m("celestolide", { notes: "Added on 2026-11-06 (batch 47), from Maese Lab's sheet" }),
      m("mine", { basedOnId: "cardamom-co2" }),
      m("bought", { supplier: "Maese Lab" }),
      m("hedione", { sources: "TGSC" }),
    ]);
    expect([...keys].sort()).toEqual(["bought", "cardamom-co2", "celestolide", "mine"]);
  });
});
