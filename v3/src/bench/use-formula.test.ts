import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { compose } from "../core/compose";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import { maxUseWarning, ownConcentration, recipe } from "./use-formula";

const G = 1_000_000n;
const MG = 1_000n;
const A: Material = { key: "cas:A", kind: "base", name: "A" };
const B: Material = { key: "cas:B", kind: "base", name: "B" };
const add = (id: string, material: Material, massUg: bigint, fraction = Ratio.ONE, diluent: Material | null = null): Change => ({ kind: "add", id, material, massUg, fraction, diluent });
const formula = (...history: Change[]): Formula => ({ header: { name: "f", intention: "", container: null, workBatchUg: null, finalBatchUg: null }, history });
const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));

describe("«Usar la fórmula» (V3-59)", () => {
  // 600 mg of A pure and 400 mg of B at 10 % in DPG: 1 g of concentrate.
  const c = compose(formula(add("a", A, 600n * MG), add("b", B, 400n * MG, pct("10"), DILUENTS.dpg)));

  it("as it is (1:1): 20 g at the formula's 35 % is 7 g of concentrate, in its proportions, and 13 g of alcohol", () => {
    const own = ownConcentration(350n * MG, 1n * G)!;
    expect(own.eq(pct("35"))).toBe(true);
    const r = recipe(c, 20n * G, own);
    expect(r.lines.map((l) => l.massUg)).toEqual([4_200n * MG, 2_800n * MG]);
    expect([r.concentrateUg, r.alcoholUg, r.totalUg]).toEqual([7n * G, 13n * G, 20n * G]);
  });

  it("with a requirement: the same 20 g at 25 % takes less concentrate and more alcohol", () => {
    const r = recipe(c, 20n * G, pct("25"));
    expect([r.concentrateUg, r.alcoholUg]).toEqual([5n * G, 15n * G]);
  });

  it("weighs to the milligram, and what rounding moves goes to the alcohol: it adds up to what you asked", () => {
    const r = recipe(c, 10_001n * MG, pct("33"));
    expect(r.lines.every((l) => l.massUg % MG === 0n)).toBe(true);
    expect(r.concentrateUg + r.alcoholUg).toBe(10_001n * MG);
  });

  it("without the batches the concentration is not known, never guessed; an empty formula or 0 % is refused", () => {
    expect(ownConcentration(null, 1n * G)).toBeNull();
    expect(() => recipe(compose(formula()), G, pct("20"))).toThrow(/empty/);
    expect(() => recipe(c, G, Ratio.ZERO)).toThrow();
  });

  it("warns above IFRA's maximum use, and with IFRA incomplete says «partial», never «fine»", () => {
    expect(maxUseWarning(pct("25"), { maxUse: pct("30"), partial: false })).toBeNull();
    expect(maxUseWarning(pct("35"), { maxUse: pct("30"), partial: false })).toEqual({ kind: "over", maxUse: pct("30") });
    expect(maxUseWarning(pct("5"), { maxUse: pct("30"), partial: true })?.kind).toBe("partial");
  });
});
