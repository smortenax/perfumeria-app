import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { checkIfra, type IfraData } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import { pouredText } from "./format";
import { knownMix, mixOf, percentOptions, diluentOptions, sameDilution, singleFavorites, type Dilution } from "./prefs";
import { pourKey } from "./usage-bar";

// A pour in a mixture of two diluents (2026-10-08), as the bench shows it, remembers it and checks it.

const G = 1_000_000n;
const iso: Material = { key: "t:iso", kind: "base", name: "Iso E Super" };
const tenth = Ratio.of(1, 10);

describe("the text of a pour in a mixture", () => {
  it("says the share of each diluent, the first one as what is left", () => {
    const text = pouredText(Ratio.of(G), tenth, "DPG", { material: DILUENTS.alcohol, fraction: Ratio.of(3, 5) });
    expect(text).toBe("1,000 g al 10 % en DPG 30 % + Alcohol 60 %");
  });

  it("with one diluent, or none, it is as before", () => {
    expect(pouredText(Ratio.of(G), tenth, "DPG")).toBe("1,000 g al 10 % en DPG");
    expect(pouredText(Ratio.of(G), Ratio.ONE, undefined)).toBe("1,000 g, puro");
  });
});

describe("the dilutions remembered with a mixture", () => {
  const single: Dilution = { percent: "10", diluent: "dpg" };
  const mixed: Dilution = { percent: "10", diluent: "dpg", mix: { percent: "30", diluent: "alcohol" } };

  it("a mixture is not the dilution with its first diluent alone, nor another mixture", () => {
    expect(sameDilution(mixed, { ...mixed, mix: { percent: "30", diluent: "alcohol" } })).toBe(true);
    expect(sameDilution(mixed, single)).toBe(false);
    expect(sameDilution(single, mixed)).toBe(false);
    expect(sameDilution(mixed, { ...mixed, mix: { percent: "40", diluent: "alcohol" } })).toBe(false);
    expect(sameDilution(mixed, { ...mixed, mix: { percent: "30", diluent: "ipm" } })).toBe(false);
    expect(sameDilution({ percent: "0,5", diluent: "dpg", mix: { percent: "0,5", diluent: "ipm" } }, { percent: "0.5", diluent: "dpg", mix: { percent: "0.5", diluent: "ipm" } })).toBe(true);
  });

  it("the switch starts from the last mixture, or else from the newest favourite one", () => {
    const older: Dilution = { percent: "5", diluent: "dpg", mix: { percent: "45", diluent: "ipm" } };
    expect(mixOf({ favorites: [], last: mixed })).toBe(mixed);
    expect(mixOf({ favorites: [older, mixed], last: single })).toBe(mixed);
    expect(mixOf({ favorites: [older, single], last: single })).toBe(older);
    expect(mixOf({ favorites: [single], last: single })).toBeNull();
    expect(mixOf({ favorites: [] })).toBeNull();
  });

  it("a mixture whose diluent is no longer known is not offered", () => {
    expect(knownMix({ percent: "10", diluent: "dpg", mix: { percent: "30", diluent: "prov:ya-no-esta" } })).toBeNull();
    expect(knownMix(single)).toBeNull();
    expect(knownMix(mixed)).toBe(mixed);
  });

  it("a favourite mixture is not an option of the cells of one diluent", () => {
    const prefs = { favorites: [{ percent: "3", diluent: "ipm", mix: { percent: "50", diluent: "dpg" } }, { percent: "20", diluent: "tec" }] };
    expect(singleFavorites(prefs).map((f) => f.percent)).toEqual(["20"]);
    expect(percentOptions(prefs)).toEqual(["20", "10", "50"]);
    expect(diluentOptions(prefs)).toEqual(["tec", "dpg", "alcohol"]);
  });
});

describe("IFRA and the draft with a mixture", () => {
  const provisional: Material = { key: "solv-prov:agua", kind: "provisional", name: "Agua", solvent: true };
  const pour = { material: iso, massUg: G, fraction: tenth, diluent: DILUENTS.dpg };

  it("the key of the draft changes with the second diluent and its share", () => {
    const mixed = { ...pour, secondDiluent: { material: DILUENTS.alcohol, fraction: Ratio.of(3, 5) } };
    expect(pourKey(mixed)).not.toBe(pourKey(pour));
    expect(pourKey(mixed)).not.toBe(pourKey({ ...mixed, secondDiluent: { material: DILUENTS.alcohol, fraction: Ratio.of(1, 2) } }));
    expect(pourKey(mixed)).not.toBe(pourKey({ ...mixed, secondDiluent: { material: DILUENTS.ipm, fraction: Ratio.of(3, 5) } }));
    expect(pourKey(mixed)).toBe(pourKey({ ...mixed }));
  });

  it("a second diluent without IFRA data is unchecked, never left out (§1.2)", () => {
    const data: IfraData = { substances: new Map(), materials: new Map([[iso.key, { status: "checked", substances: [], conditions: [] }]]) };
    const change: Change = { kind: "add", id: "m", ...pour, secondDiluent: { material: provisional, fraction: Ratio.of(3, 5) } };
    const formula: Formula = { header: { name: "mezcla", intention: "", container: null, workBatchUg: null, finalBatchUg: null }, history: [change] };
    const report = checkIfra(formula, data);
    expect(report.unchecked).toEqual(["Agua"]);
    // With the app's diluents only, nothing is unchecked: DPG and alcohol have nothing to check.
    const known = checkIfra({ ...formula, history: [{ ...change, secondDiluent: { material: DILUENTS.alcohol, fraction: Ratio.of(3, 5) } }] }, data);
    expect(known.unchecked).toEqual([]);
  });
});
