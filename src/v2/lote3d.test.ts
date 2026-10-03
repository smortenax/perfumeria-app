import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { checkIfra } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS } from "../core/model/material";
import { repositoryFor } from "../data/repositories";
import { v2Dataset } from "./data";

// A bench formula with five materials of lot 3d (Maese Lab), as the bench builds it from the v2 repository:
// 1,0 g poured, taken to a perfume at 20 % (work batch 1,0 g, final 5 g). The dilutions are those the user
// puts in the bar when weighing (D8); the model is always at 100 %.
const repository = repositoryFor("v2");
const data = v2Dataset();
const entry = (name: string) => {
  const e = repository.entries.find((x) => x.material.name === name);
  expect(e, name).toBeDefined();
  return e!;
};
const LINES: ReadonlyArray<readonly [string, string, string, keyof typeof DILUENTS | null]> = [
  ["Aceite de cade (enebro)", "0,010", "100", null],
  ["Láudano de jara", "0,100", "20", "alcohol"],
  ["Olíbano", "0,200", "100", null],
  ["Ámbar gris, tintura comercial (purificado)", "0,300", "10", "alcohol"],
  ["Esencia de trufa", "0,390", "10", "dpg"],
];
const formula: Formula = {
  header: { name: "Lote 3d", intention: "", container: null, workBatchUg: 1_000_000n, finalBatchUg: 5_000_000n },
  history: LINES.map(([name, grams, percent, diluent], i): Change => ({
    kind: "add",
    id: `d${i + 1}`,
    material: entry(name).material,
    massUg: parseMass(grams, "g"),
    fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)),
    diluent: diluent === null ? null : DILUENTS[diluent],
  })),
};

describe("a bench formula with five materials of lot 3d, checked with the v2", () => {
  const report = checkIfra(formula, repository.ifraData());
  it("finds every material in the v2: nothing is unchecked, and nothing is over a ceiling", () => {
    expect(report.unchecked).toEqual([]);
    expect(report.base).toBe("completed");
    expect(report.checks.some((c) => c.verdict === "exceeds")).toBe(false);
  });

  it("the cade: its rectification is assumed (consensus, no document): it says so, blocks nothing and leaves nothing pending for it", () => {
    expect(report.conditions).toEqual([
      {
        material: "Aceite de cade (enebro)",
        text: "una variante está prohibida (STD 119); la rectificada cumple la especificación (STD 119): supuesta, no acreditada (consenso)",
        assumed: true,
      },
    ]);
    expect(report.pending.some((p) => p.text.includes("solo permite el rectificado"))).toBe(false);
  });

  it("the naturals without data (cade, ambergris tincture) and the base (truffle) leave their constituents pending, so reading 1 is open", () => {
    expect(report.pending.map((p) => p.material).sort()).toEqual(
      ["Aceite de cade (enebro)", "Esencia de trufa", "Ámbar gris, tintura comercial (purificado)"].sort(),
    );
    expect(report.partial).toBe(true);
    expect(report.asIs).toBe("unknown");
  });

  it("the cards: the truffle is a base; the olibanum, the oil of Boswellia sacra, is a natural with the annex's constituents", () => {
    const truffle = data.materials.find((m) => m.id === data.products.find((p) => p.name === "Esencia de trufa")!.materialId)!;
    expect(truffle.type).toBe("base");
    expect(truffle.species).toBe("");
    const olibanum = data.materials.find((m) => m.id === data.products.find((p) => p.name === "Olíbano")!.materialId)!;
    expect(olibanum.type).toBe("natural");
    expect(olibanum.species).toBe("Boswellia sacra");
    expect(olibanum.chemotype).toContain("sabineno");
    expect(entry("Olíbano").state).toBe("por-constituyentes");
  });
});
