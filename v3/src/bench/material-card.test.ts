import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { compose, vectorOf } from "../core/compose";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import { carriedOf, usagePosition } from "./material-card";

const G = 1_000_000n; // micrograms in a gram

const base = (key: string): Material => ({ key: `cas:${key}`, kind: "base", name: key });
const A = base("A");
const B = base("B");
const C = base("C");
const ALCOHOL = DILUENTS.alcohol;

let seq = 0;
const add = (material: Material, massUg: bigint, percent = "100", diluent: Material | null = null): Change => ({
  kind: "add",
  id: `c${++seq}`,
  material,
  massUg,
  fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)),
  diluent,
});
const formula = (...history: Change[]): Formula => ({
  header: { name: "prueba", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
  history,
});
const asMaterial = (name: string, f: Formula): Material => {
  const vector = vectorOf(f);
  return { key: vector.id, kind: "formula", name, vector };
};
const grams = (n: bigint) => Ratio.of(n * G);

describe("what the formula holds of a material (P57)", () => {
  // A 10 g pure, B 20 g at 10 % in alcohol: 12 g of aromatic matter in 30 g.
  const f = formula(add(A, 10n * G), add(B, 20n * G, "10", ALCOHOL));
  const c = compose(f);

  it("its pure matter, and its share of the aromatic matter as the composition counts it", () => {
    const a = carriedOf(c, A);
    expect(a.pureUg.eq(grams(10n))).toBe(true);
    expect(a.countedUg.eq(grams(10n))).toBe(true);
    expect([a.base, a.baseUg.eq(grams(12n))]).toEqual(["aromatic", true]);
    // Diluted: only the pure matter of the 20 g, not the diluent.
    expect(carriedOf(c, B).pureUg.eq(grams(2n))).toBe(true);
  });

  it("a solvent is counted on the bottle, never on the aromatic matter", () => {
    const alcohol = carriedOf(c, ALCOHOL);
    expect(alcohol.pureUg.eq(grams(18n))).toBe(true);
    expect([alcohol.base, alcohol.baseUg.eq(grams(30n))]).toEqual(["bottle", true]);
  });

  it("what the formula does not carry is a zero, and so is any material of an empty one", () => {
    expect(carriedOf(c, C).pureUg.isZero()).toBe(true);
    expect(carriedOf(c, C).countedUg.isZero()).toBe(true);
    expect(carriedOf(null, A).pureUg.isZero()).toBe(true);
    expect(carriedOf(compose(formula()), A).baseUg.isZero()).toBe(true);
  });

  it("follows the composition: adding more of it changes what it carries", () => {
    const more = compose(formula(add(A, 10n * G), add(B, 20n * G, "10", ALCOHOL), add(A, 2n * G)));
    expect(carriedOf(more, A).pureUg.eq(grams(12n))).toBe(true);
    expect(carriedOf(more, A).baseUg.eq(grams(14n))).toBe(true);
  });

  it("a formula used as a material is read from its lines, since the composition holds its components (§10.3)", () => {
    // Z is half B, half alcohol: poured 2 g, it carries 2 g of pure matter, of which 1 g is aromatic.
    const z = asMaterial("Z", formula(add(B, 1n * G), add(ALCOHOL, 1n * G)));
    const withZ = compose(formula(add(A, 1n * G), add(z, 2n * G)));
    const carried = carriedOf(withZ, z);
    expect(carried.pureUg.eq(grams(2n))).toBe(true);
    expect(carried.countedUg.eq(grams(1n))).toBe(true);
    // Its base is the aromatic matter: A and the B inside Z.
    expect([carried.base, carried.baseUg.eq(grams(2n))]).toEqual(["aromatic", true]);
    expect(carriedOf(compose(formula(add(A, 1n * G))), z).pureUg.isZero()).toBe(true);
  });
});

describe("the strip of the usual use, on a log scale from 0,001 % to 100 % (P57)", () => {
  const at = (percent: string) => usagePosition(Ratio.fromDecimal(percent).div(Ratio.of(100)));

  it("puts each decade on its tick, a fifth of the strip apart", () => {
    expect(at("0.001")).toBeCloseTo(0, 9);
    expect(at("0.01")).toBeCloseTo(0.2, 9);
    expect(at("0.1")).toBeCloseTo(0.4, 9);
    expect(at("1")).toBeCloseTo(0.6, 9);
    expect(at("10")).toBeCloseTo(0.8, 9);
    expect(at("100")).toBeCloseTo(1, 9);
  });

  it("holds what lies outside to the edge", () => {
    expect(at("0.00001")).toBe(0);
    expect(usagePosition(Ratio.of(1, 1_000_000_000_000))).toBe(0);
    expect(usagePosition(Ratio.of(2))).toBe(1);
  });

  it("places nothing for a zero, which a log scale has no place for", () => {
    expect(usagePosition(Ratio.ZERO)).toBeNull();
  });
});
