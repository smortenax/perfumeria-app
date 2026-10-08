import { describe, expect, it } from "vitest";
import { Ratio } from "./arith/ratio";
import { compose, vectorOf } from "./compose";
import type { Change, Formula, FormulaHeader } from "./model/formula";
import { DILUENTS, type Material } from "./model/material";
import { canonicalVector, makeVector } from "./model/vector";

const G = 1_000_000n; // micrograms in a gram
const MG = 1_000n; // micrograms in a milligram

const base = (key: string): Material => ({ key: `cas:${key}`, kind: "base", name: key });
const A = base("A");
const B = base("B");
const C = base("C");
const D = base("D");
const ALCOHOL = DILUENTS.alcohol;

const header: FormulaHeader = { name: "prueba", intention: "", container: null, workBatchUg: null, finalBatchUg: null };

let seq = 0;
const add = (material: Material, massUg: bigint, percent = "100", diluent: Material | null = null): Change => ({
  kind: "add",
  id: `c${++seq}`,
  material,
  massUg,
  fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)),
  diluent,
});
const formula = (...history: Change[]): Formula => ({ header, history });
const asMaterial = (name: string, f: Formula): Material => {
  const vector = vectorOf(f);
  return { key: vector.id, kind: "formula", name, vector };
};
const massOf = (f: Formula, material: Material) =>
  compose(f).parts.find((p) => p.material.key === material.key)?.massUg ?? Ratio.ZERO;

describe("compose: the composition comes from the history", () => {
  it("T1: absolute and relative concentrations and strength", () => {
    // A 10 g pure, B 20 g at 10 % in alcohol, alcohol 70 g.
    const f = formula(add(A, 10n * G), add(B, 20n * G, "10", ALCOHOL), add(ALCOHOL, 70n * G));
    const c = compose(f);
    expect(c.totalUg.eq(Ratio.of(100n * G))).toBe(true);
    expect(c.aromaticUg.eq(Ratio.of(12n * G))).toBe(true);
    expect(massOf(f, ALCOHOL).eq(Ratio.of(88n * G))).toBe(true);
    expect(massOf(f, A).div(c.totalUg).toString()).toBe("1/10");
    expect(massOf(f, B).div(c.totalUg).toString()).toBe("1/50");
    expect(massOf(f, A).div(c.aromaticUg).toFixed(5)).toBe("0.83333");
    expect(c.aromaticUg.div(c.totalUg).toString()).toBe("3/25");
  });

  it("T6: a formula used as a material is flat and exact, even when it holds another", () => {
    const y = formula(add(B, 250n * MG), add(C, 750n * MG));
    const x = formula(add(A, 500n * MG), add(asMaterial("Y", y), 500n * MG));
    const xm = asMaterial("X", x);
    expect(xm.vector?.components.map((c) => `${c.material.name} ${c.proportion}`)).toEqual(["A 1/2", "B 1/8", "C 3/8"]);
    const f = formula(add(xm, 30n * G));
    expect(massOf(f, A).eq(Ratio.of(15n * G))).toBe(true);
    expect(massOf(f, B).eq(Ratio.of(3_750_000n))).toBe(true);
    expect(massOf(f, C).eq(Ratio.of(11_250_000n))).toBe(true);
    expect(compose(f).totalUg.eq(Ratio.of(30n * G))).toBe(true);
  });

  it("T7: a substance that arrives by two ways is added up", () => {
    const z = formula(add(A, 3n * G), add(D, 1n * G));
    const f = formula(add(A, 5n * G), add(asMaterial("Z", z), 4n * G));
    expect(massOf(f, A).eq(Ratio.of(8n * G))).toBe(true);
    expect(compose(f).parts.filter((p) => p.material.key === A.key)).toHaveLength(1);
  });

  it("edits freely: a new mass, a removed line", () => {
    const first = add(A, 10n * G);
    const second = add(B, 5n * G);
    const f = formula(
      first,
      second,
      { kind: "set-mass", id: "e1", target: first.id, massUg: 2n * G },
      { kind: "remove", id: "e2", target: second.id },
    );
    const c = compose(f);
    expect(c.lines.map((l) => l.material.name)).toEqual(["A"]);
    expect(c.totalUg.eq(Ratio.of(2n * G))).toBe(true);
  });

  it("each change is a frame: the composition can be read at any point", () => {
    const f = formula(add(A, 1n * G), { kind: "note", id: "n1", text: "evaluar" }, add(B, 1n * G));
    expect(compose(f, 1).lines).toHaveLength(1);
    expect(compose(f, 2).lines).toHaveLength(1);
    expect(compose(f).lines).toHaveLength(2);
  });

  it("reweighing scales everything to what is really left (§3.5)", () => {
    // A 10 g recipe in a vial of 20 g tare, of which 2 g were used elsewhere.
    const withTare: Formula = {
      header: { ...header, container: { capacityMl: null, tareUg: 20n * G } },
      history: [add(A, 5n * G), add(B, 5n * G), { kind: "reweigh", id: "r1", grossUg: 28n * G, tareUg: 20n * G }, add(C, 1n * G)],
    };
    const c = compose(withTare);
    expect(massOf(withTare, A).eq(Ratio.of(4n * G))).toBe(true);
    // Adding 1 g over the 8 g really left gives 1/9, not the 1/11 of the recipe.
    expect(massOf(withTare, C).div(c.totalUg).toString()).toBe("1/9");
  });

  it("refuses a gross weight that is not above its tare, and a diluted line without its diluent", () => {
    expect(() => compose(formula(add(A, G), { kind: "reweigh", id: "r", grossUg: 5n * G, tareUg: 5n * G }))).toThrow(/tare/);
    expect(() => compose(formula(add(A, G, "10")))).toThrow(/diluent/);
  });

  it("a reweighing keeps the tare it was weighed with, even when the formula moves to a new vial (§3.2)", () => {
    const weighed: Formula = {
      header: { ...header, container: { capacityMl: null, tareUg: 20n * G } },
      history: [add(A, 10n * G), { kind: "reweigh", id: "r1", grossUg: 28n * G, tareUg: 20n * G }],
    };
    const moved: Formula = { ...weighed, header: { ...weighed.header, container: { capacityMl: null, tareUg: 35n * G } } };
    expect(compose(weighed).totalUg.eq(Ratio.of(8n * G))).toBe(true);
    expect(compose(moved).totalUg.eq(Ratio.of(8n * G))).toBe(true);
  });

  it("the vector ID depends on the composition only: same parts, same ID; any edit, a new one", () => {
    const one = makeVector([
      { material: A, amount: Ratio.of(1) },
      { material: B, amount: Ratio.of(3) },
    ]);
    const same = makeVector([
      { material: B, amount: Ratio.of(30) },
      { material: A, amount: Ratio.of(10) },
    ]);
    const edited = makeVector([
      { material: B, amount: Ratio.of(31) },
      { material: A, amount: Ratio.of(10) },
    ]);
    expect(same.id).toBe(one.id);
    expect(edited.id).not.toBe(one.id);
    expect(canonicalVector(one.components)).toBe("vector/1\ncas:A\t1/4\ncas:B\t3/4");
    expect(one.id).toMatch(/^vec:[0-9a-f]{64}$/);
  });
});

describe("compose: a pour in a mixture of two diluents (2026-10-08)", () => {
  const DPG = DILUENTS.dpg;
  type Add = Extract<Change, { kind: "add" }>;
  const pour = (...args: Parameters<typeof add>): Add => add(...args) as Add;
  // A at 10 % in DPG 30 % + alcohol 60 %: the second diluent carries its share of what was poured.
  const mixed = (material: Material, massUg: bigint, percent: string, second: Material, secondPercent: string): Change => ({
    ...pour(material, massUg, percent, DPG),
    secondDiluent: { material: second, fraction: Ratio.fromDecimal(secondPercent).div(Ratio.of(100)) },
  });

  it("splits what is not pure matter between the two diluents, exactly", () => {
    const f = formula(mixed(A, 1n * G, "10", ALCOHOL, "60"));
    const c = compose(f);
    expect(massOf(f, A).eq(Ratio.of(100n * MG))).toBe(true);
    expect(massOf(f, DPG).eq(Ratio.of(300n * MG))).toBe(true);
    expect(massOf(f, ALCOHOL).eq(Ratio.of(600n * MG))).toBe(true);
    expect(c.totalUg.eq(Ratio.of(1n * G))).toBe(true);
    // Only A is aromatic matter: both diluents are solvents.
    expect(c.aromaticUg.eq(Ratio.of(100n * MG))).toBe(true);
    expect(c.lines[0].secondDiluent?.material.key).toBe(ALCOHOL.key);
  });

  it("adds each diluent to the same diluent poured by other lines, and keeps the split through a reweighing", () => {
    const f = formula(mixed(A, 1n * G, "10", ALCOHOL, "60"), add(B, 1n * G, "50", ALCOHOL), { kind: "reweigh", id: "r", grossUg: G, tareUg: 0n });
    // Before: alcohol 600 mg + 500 mg; then everything at half.
    expect(massOf(f, ALCOHOL).eq(Ratio.of(550n * MG))).toBe(true);
    expect(massOf(f, DPG).eq(Ratio.of(150n * MG))).toBe(true);
    expect(massOf(f, A).eq(Ratio.of(50n * MG))).toBe(true);
    expect(compose(f).parts.filter((p) => p.material.key === ALCOHOL.key)).toHaveLength(1);
  });

  it("a third of a mixture stays exact: no rounding in the split", () => {
    // 1 % of A, 33 % DPG, 66 % alcohol in 3 mg.
    const f = formula(mixed(A, 3n * MG, "1", ALCOHOL, "66"));
    expect(massOf(f, A).toString()).toBe("30");
    expect(massOf(f, DPG).toString()).toBe("990");
    expect(massOf(f, ALCOHOL).toString()).toBe("1980");
  });

  it("a formula used as a material can be poured in a mixture too", () => {
    const y = formula(add(B, 250n * MG), add(C, 750n * MG));
    const f = formula(mixed(asMaterial("Y", y), 1n * G, "20", ALCOHOL, "50"));
    expect(massOf(f, B).eq(Ratio.of(50n * MG))).toBe(true);
    expect(massOf(f, C).eq(Ratio.of(150n * MG))).toBe(true);
    expect(massOf(f, DPG).eq(Ratio.of(300n * MG))).toBe(true);
    expect(massOf(f, ALCOHOL).eq(Ratio.of(500n * MG))).toBe(true);
  });

  it("refuses a mixture that is not one: pure matter, no first diluent, the same diluent twice, or nothing left for one", () => {
    const second = { material: ALCOHOL, fraction: Ratio.of(1, 2) };
    expect(() => compose(formula({ ...pour(A, G), secondDiluent: second }))).toThrow(/first one/);
    expect(() => compose(formula({ ...pour(A, G, "10", DPG), secondDiluent: { material: DPG, fraction: Ratio.of(1, 2) } }))).toThrow(/same/);
    // 10 % of A and 90 % of alcohol leave nothing to the DPG.
    expect(() => compose(formula(mixed(A, G, "10", ALCOHOL, "90")))).toThrow(/leave some/);
    expect(() => compose(formula({ ...pour(A, G, "10", DPG), secondDiluent: { material: ALCOHOL, fraction: Ratio.ZERO } }))).toThrow(/above 0/);
  });
});
