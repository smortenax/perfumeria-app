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
  it("has the FIG with the user's codes, what only IFRA has (its standards, its annex and its Transparency List), the diluents of the app, and none of the lab's materials", () => {
    const count = (group: string) => catalog.entries.filter((e) => e.group === group).length;
    // 4317 since P48: 19 rows of the FIG that the lab counts as naturals were taken for
    // molecules, and three of them are the only natural of a CAS the Transparency List
    // also lists, so its entry joins them instead of standing apart. 4325 since P55: eight
    // molecules that only the shops where the user buys know (Trimofix, Tuberolide…).
    // The count did not err before; the glossary gained a source.
    expect(count("base")).toBe(4325);
    // Since P48 the counts also say how many have a family: all of the FIG.
    expect(catalog.counts).toEqual({ fig: 3119, ifraOnly: 1206, withFamily: 3119 });
    // DPG and alcohol, and the other diluents of the menu (§4): IPM, DEP, TEC, triacetin, benzyl benzoate.
    expect(count("diluent")).toBe(7);
    expect(count("own")).toBe(0);
    expect(catalog.entries.some((e) => e.material.key.startsWith("lab:"))).toBe(false);
    expect(catalog.source.amendment).toBe("51");
    expect(new Set(catalog.entries.map((e) => e.code)).size).toBe(catalog.entries.length);
  });

  it("keeps a Transparency List name whole where IFRA's web gave it as a JSON list, cut at every comma", () => {
    expect(catalog.entries.some((e) => e.material.name.startsWith('["'))).toBe(false);
    const lavender = byName("Lavender oil (Lavandula angustifolia, Lavandula angustifolia angustifolia, Lavandula officinalis)");
    expect(lavender.key).toBe("tl:lavender-oil-lavandula-angustifolia-lavandula-angustifolia-a");
    // The myrrh resinoid of the FIG keeps IFRA's whole name to be found by it.
    const found = searchCatalog(catalog.entries, "Commiphora erthyraea").map((e) => e.material.key);
    expect(found).toContain(byName("Myrrh resinoid").key);
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

  it("takes as naturals the rows the lab counts as such, so a gum or a balsam is never free (P48, §1.2)", () => {
    for (const cas of ["9000-45-7", "8024-03-1", "8013-97-6"]) {
      const entry = catalog.entries.find((e) => e.cas === cas && e.material.key.startsWith("fig:"))!;
      expect(entry.state).toBe("sin-dato");
      expect(ifraOf(entry.material.key)?.pending?.length).toBeGreaterThan(0);
    }
  });

  it("never takes a natural with no data on what it carries as free (§1.2)", () => {
    const unknown = catalog.entries.find((e) => e.state === "sin-dato");
    expect(unknown).toBeDefined();
    expect(ifraOf(unknown!.material.key)?.pending?.length).toBeGreaterThan(0);
    const report = checkIfra({ header, history: [{ kind: "add", id: "n", material: unknown!.material, massUg: 10n * MG, fraction: Ratio.ONE, diluent: null }] }, catalog.ifra);
    expect(report.asIs).toBe("unknown");
  });

  it("puts in the scope of a standard the same molecule under another CAS or stereochemistry, but not another compound", () => {
    // alpha-Amyl trans-cinnamaldehyde is not listed by IFRA, and is the amyl cinnamal of its standard.
    const trans = byCas("78605-96-6");
    expect(ifraOf(trans.key)?.substances).toEqual([{ key: "std:IFRA_STD_005", fraction: Ratio.ONE }]);
    expect(ifraOf(trans.key)?.conditions.some((c) => c.startsWith("en el alcance del STD 005"))).toBe(true);
    // Nerol is the Z isomer of geraniol, a compound of its own: the geraniol standard does not reach it.
    expect(ifraOf(byCas("106-25-2").key)?.substances.some((s) => s.key === "std:IFRA_STD_037")).toBe(false);
  });

  it("measures the first reading at the concentration the work batch will have in the final batch, so the two readings agree (P51)", () => {
    // The user's test: 16 mg of neral in 2.451 g, with a work batch and a final batch of 20 g.
    // Neral is citral, 0.6 % in category 4: at 100 % the bottle carries 0.653 %.
    const neral = byCas("106-26-3");
    const history: Change[] = [
      { kind: "add", id: "n", material: neral, massUg: 16n * MG, fraction: Ratio.ONE, diluent: null },
      { kind: "add", id: "d", material: DILUENTS.dpg, massUg: 2_435n * MG, fraction: Ratio.ONE, diluent: null },
    ];
    const batches = (workG: bigint, finalG: bigint): FormulaHeader => ({ ...header, workBatchUg: workG * 1_000_000n, finalBatchUg: finalG * 1_000_000n });
    const same = checkIfra({ header: batches(20n, 20n), history }, catalog.ifra);
    expect(formatPercent(same.maxUse, 2)).toBe("91,91 %");
    // Before, the 17.5 g still to pour counted as blank, and it said «sí».
    expect(same.asIs).toBe("no");
    // Half of the final batch: 50 % is under 91.91 %, so it passes.
    expect(checkIfra({ header: batches(10n, 20n), history }, catalog.ifra).asIs).toBe("yes");
    // It passes exactly when the second reading reaches the concentration.
    for (const [work, final] of [[20n, 20n], [19n, 20n], [18n, 20n], [5n, 20n]] as const) {
      const report = checkIfra({ header: batches(work, final), history }, catalog.ifra);
      expect(report.asIs === "yes").toBe(!report.maxUse.lt(Ratio.of(work, final)));
    }
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

  it("checks a diluent against IFRA when it has a standard, and leaves out the ones with nothing to check", () => {
    const coumarin = byCas("91-64-5");
    const inBB: Change[] = [{ kind: "add", id: "c", material: coumarin, massUg: 100n * MG, fraction: Ratio.of(1, 10), diluent: DILUENTS.bb }];
    const report = checkIfra({ header, history: inBB }, catalog.ifra);
    // 90 mg of benzyl benzoate in 100 mg: 90 % of the bottle, over its 4.8 % of category 4.
    expect(report.checks.find((c) => c.substance.key === "std:IFRA_STD_009")?.verdict).toBe("exceeds");
    const inDPG = checkIfra({ header, history: [{ ...inBB[0], diluent: DILUENTS.dpg }] as Change[] }, catalog.ifra);
    expect(inDPG.unchecked).toEqual([]);
    expect(inDPG.checks.map((c) => c.substance.key)).toEqual(["std:IFRA_STD_023"]);
    // A provisional diluent has no data: never free (§1.2).
    const own = { key: "solv-prov:aceite-de-jojoba", kind: "provisional" as const, name: "Aceite de jojoba", solvent: true };
    const inOwn = checkIfra({ header, history: [{ ...inBB[0], diluent: own }] as Change[] }, catalog.ifra);
    expect(inOwn.unchecked).toEqual(["Aceite de jojoba"]);
    expect(inOwn.partial).toBe(true);
  });

  it("gives each row of the FIG its family and colour, and leaves the rest as a gap, not the grey family (P48)", () => {
    expect(catalog.families.map((f) => f.name)).toEqual([
      "Cítrico", "Verde", "Ozónico", "Floral", "Frutal", "Especiado", "Amaderado", "Animal", "Transformado",
    ]);
    expect(catalog.families.find((f) => f.name === "Transformado")?.short).toBe("Transf");
    expect(catalog.counts.withFamily).toBe(3119);
    const entry = (cas: string) => catalog.entries.find((e) => e.cas === cas && e.group === "base")!;
    expect(entry("24851-98-7").family?.family.name).toBe("Floral");
    const isoESuper = entry("54464-57-2").family!;
    expect([isoESuper.family.name, isoESuper.hue?.name, isoESuper.confidence]).toEqual(["Amaderado", "Floral", "alta"]);
    expect(entry("541-91-3").family?.family.colour).toBe("#d22c50");
    // Only in IFRA: no family yet.
    expect(catalog.entries.filter((e) => e.group === "base" && !e.material.key.startsWith("fig:")).every((e) => !e.family)).toBe(true);
    expect(catalog.entries.filter((e) => e.group === "diluent").every((e) => !e.family)).toBe(true);
  });

  it("finds the materials of F-001 by the name the bench uses, through PubChem's usual names and the trade names", () => {
    // Two of F-001 that did not come out (plan, review of 2026-09-27).
    expect(searchCatalog(catalog.entries, "diphenyl oxide")[0].cas).toBe("101-84-8");
    expect(searchCatalog(catalog.entries, "allyl amyl glycolate")[0].cas).toBe("67634-00-8");
    // Its trade abbreviation is the icon; the user's code still finds it.
    const aag = searchCatalog(catalog.entries, "AAG")[0];
    expect([aag.cas, aag.icon]).toEqual(["67634-00-8", "AAG"]);
    expect(searchCatalog(catalog.entries, "ALM")[0].cas).toBe("67634-00-8");
    expect(searchCatalog(catalog.entries, "phenylethyl alcohol")[0].cas).toBe("60-12-8");
    expect(searchCatalog(catalog.entries, "beta-PEA")[0].cas).toBe("60-12-8");
    // The functional test (P52): p-ethylphenol by the CAS with zeros of more, and by its
    // short chemical name. Neither came out, and both became provisional materials.
    expect(searchCatalog(catalog.entries, "0123-07-09")[0].cas).toBe("123-07-9");
    expect(searchCatalog(catalog.entries, "4-ethylphenol")[0].cas).toBe("123-07-9");
    // A hyphen is a space when ordering: «alpha ionone» is the alpha-ionone, not the irone.
    expect(searchCatalog(catalog.entries, "alpha ionone")[0].cas).toBe("127-41-3");
    // By the names the shops sell them by (P55): Maese Lab's thyme joins the annex's
    // Spanish marjoram by the species of its INCI; Olfatorium's Ambroxan, by its CAS.
    expect(searchCatalog(catalog.entries, "tomillo mastichina")[0].cas).toBe("8016-33-9");
    expect(searchCatalog(catalog.entries, "ambroxan kao")[0].cas).toBe("6790-58-5");
  });

  it("finds by code, CAS, name, IFRA's name and its synonyms", () => {
    expect(searchCatalog(catalog.entries, "54464-57-2")[0].cas).toBe("54464-57-2");
    expect(searchCatalog(catalog.entries, "iso e super")[0].cas).toBe("54464-57-2");
    expect(searchCatalog(catalog.entries, "OT")[0].cas).toBe("54464-57-2");
    expect(searchCatalog(catalog.entries, "coumarin")[0].cas).toBe("91-64-5");
    expect(searchCatalog(catalog.entries, "dpg")[0].material.key).toBe("solv:dpg");
  });
});
