import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { formatPercent } from "../core/display";
import { checkIfra } from "../core/ifra";
import type { Change, FormulaHeader } from "../core/model/formula";
import { DILUENTS } from "../core/model/material";
import { searchCatalog } from "./catalog";
import { catalog } from "./provisional";

const find = (test: (e: (typeof catalog.entries)[number]) => boolean) => {
  const found = catalog.entries.find(test);
  if (!found) {
    throw new Error("No such material in the glossary");
  }
  return found.material;
};
const byCas = (cas: string) => find((e) => e.cas === cas);
const byName = (name: string) => find((e) => e.material.name === name);
const ifraOf = (key: string) => catalog.ifra.materials.get(key);
const fractionOf = (key: string, substance: string) => ifraOf(key)?.substances.find((s) => s.key === substance)?.fraction;
const header: FormulaHeader = { name: "prueba", intention: "", container: null, workBatchUg: null, finalBatchUg: null };
const MG = 1_000n;

describe("the catalog, from the glossary and IFRA's own files (P37)", () => {
  it("has the FIG with the user's codes, what only IFRA has, the two diluents, and nothing of the lab", () => {
    const count = (group: string) => catalog.entries.filter((e) => e.group === group).length;
    expect(count("base")).toBe(3370);
    expect(catalog.counts).toEqual({ fig: 3119, ifraOnly: 251 });
    expect(count("diluent")).toBe(2);
    expect(count("own")).toBe(0);
    expect(catalog.entries.some((e) => e.material.key.startsWith("lab:"))).toBe(false);
    expect(catalog.source.amendment).toBe("51");
    expect(new Set(catalog.entries.map((e) => e.code)).size).toBe(catalog.entries.length);
  });

  it("gives a material with a standard its category 4 ceiling, by standard", () => {
    const otne = byCas("54464-57-2");
    expect(ifraOf(otne.key)?.substances).toEqual([{ key: "std:IFRA_STD_068", fraction: Ratio.ONE }]);
    expect(catalog.ifra.substances.get("std:IFRA_STD_068")?.limit.eq(Ratio.of(20, 100))).toBe(true);
    expect(catalog.ifra.substances.get("std:IFRA_STD_023")?.limit.eq(Ratio.of(15, 1000))).toBe(true);
    // Not in the index, which is complete: checked, and free.
    expect(ifraOf(byCas("24851-98-7").key)).toEqual({ status: "checked", substances: [], conditions: [] });
  });

  it("reads what a natural carries from IFRA's annex, and counts the worst variant when it could be several", () => {
    const expressed = byName("Lemon oil, expressed");
    expect(fractionOf(expressed.key, "std:IFRA_STD_092")?.eq(Ratio.ONE)).toBe(true);
    expect(fractionOf(expressed.key, "std:IFRA_STD_021")?.eq(Ratio.of(35, 1000))).toBe(true);
    expect(ifraOf(expressed.key)?.pending).toBeUndefined();
    // «Lemon oil» may be the expressed one, the essence or the distilled: the expressed has the most citral.
    expect(fractionOf(byName("Lemon oil").key, "std:IFRA_STD_021")?.eq(Ratio.of(35, 1000))).toBe(true);
    const atlas = byName("Cedarwood oil, Atlas");
    expect(fractionOf(atlas.key, "std:IFRA_STD_197")?.eq(Ratio.of(15, 1000))).toBe(true);
    expect(fractionOf(atlas.key, "std:IFRA_STD_199")?.eq(Ratio.of(6, 1000))).toBe(true);
  });

  it("never takes a natural with no data on what it carries as free (§1.2)", () => {
    const unknown = catalog.entries.find((e) => e.state === "sin-dato");
    expect(unknown).toBeDefined();
    expect(ifraOf(unknown!.material.key)?.pending?.length).toBeGreaterThan(0);
    const report = checkIfra({ header, history: [{ kind: "add", id: "n", material: unknown!.material, massUg: 10n * MG, fraction: Ratio.ONE, diluent: null }] }, catalog.ifra);
    expect(report.asIs).toBe("unknown");
  });

  it("keeps specifications as conditions, and a prohibited material over any ceiling", () => {
    expect(ifraOf(byName("Cade oil, rectified").key)?.conditions).toContain("especificación (STD 119)");
    const benzene = byCas("71-43-2");
    const report = checkIfra({ header, history: [{ kind: "add", id: "b", material: benzene, massUg: 1n, fraction: Ratio.ONE, diluent: null }] }, catalog.ifra);
    expect(report.asIs).toBe("no");
    expect(report.maxUse.isZero()).toBe(true);
  });

  it("adds each substance up wherever it comes from", () => {
    const coumarin = byCas("91-64-5");
    const otne = byCas("54464-57-2");
    const history: Change[] = [
      { kind: "add", id: "c", material: coumarin, massUg: 150n * MG, fraction: Ratio.of(9, 100), diluent: DILUENTS.alcohol },
      { kind: "add", id: "o", material: otne, massUg: 372n * MG, fraction: Ratio.ONE, diluent: null },
      { kind: "add", id: "a", material: DILUENTS.alcohol, massUg: 478n * MG, fraction: Ratio.ONE, diluent: null },
    ];
    const report = checkIfra({ header, history }, catalog.ifra);
    expect(report.checks.find((c) => c.substance.key === "std:IFRA_STD_023")?.verdict).toBe("within");
    expect(report.checks.find((c) => c.substance.key === "std:IFRA_STD_068")?.verdict).toBe("exceeds");
    expect(report.asIs).toBe("no");
    expect(formatPercent(report.maxUse, 2)).toBe("53,76 %");

    // The coumarin of a lavender adds to the coumarin itself.
    const lavender = byName("Lavender absolute");
    const withLavender = checkIfra({ header, history: [...history, { kind: "add", id: "l", material: lavender, massUg: 100n * MG, fraction: Ratio.ONE, diluent: null }] }, catalog.ifra);
    const before = report.checks.find((c) => c.substance.key === "std:IFRA_STD_023")!.knownUg;
    const after = withLavender.checks.find((c) => c.substance.key === "std:IFRA_STD_023")!.knownUg;
    expect(after.gt(before)).toBe(true);
  });

  it("names a material by its trade name, keeps the chemical one beside it, and finds both (P38, P39)", () => {
    const hedione = catalog.entries.find((e) => e.cas === "24851-98-7")!;
    expect(hedione.material.name).toBe("Hedione");
    expect(hedione.chemicalName).toBe("Methyl dihydrojasmonate");
    expect(searchCatalog(catalog.entries, "hedione")[0].cas).toBe("24851-98-7");
    expect(searchCatalog(catalog.entries, "methyl dihydrojasmonate")[0].cas).toBe("24851-98-7");
    // «IBQ» names three CAS in the market: the icon tells them apart, with a prime
    // where the chemical names give the same mark.
    const ibq = searchCatalog(catalog.entries, "IBQ").slice(0, 3);
    expect(ibq.map((e) => `${e.iconMark}${e.icon}`).sort()).toEqual(["2IBQ", "2′IBQ", "6IBQ"]);
    expect(searchCatalog(catalog.entries, "6IBQ")[0].cas).toBe("65442-31-1");
    expect(searchCatalog(catalog.entries, "2'IBQ")[0].cas).toBe("1333-58-0");
    expect(searchCatalog(catalog.entries, "isobutilquinoleina").slice(0, 3).map((e) => e.cas)).toContain("65442-31-1");
  });

  it("finds by code, CAS, name, IFRA's name and its synonyms", () => {
    expect(searchCatalog(catalog.entries, "54464-57-2")[0].cas).toBe("54464-57-2");
    expect(searchCatalog(catalog.entries, "iso e super")[0].cas).toBe("54464-57-2");
    expect(searchCatalog(catalog.entries, "OT")[0].cas).toBe("54464-57-2");
    expect(searchCatalog(catalog.entries, "coumarin")[0].cas).toBe("91-64-5");
    expect(searchCatalog(catalog.entries, "dpg")[0].material.key).toBe("solv:dpg");
  });
});
