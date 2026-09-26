import { describe, expect, it } from "vitest";
import { Ratio } from "./arith/ratio";
import { compose, vectorOf } from "./compose";
import { formatPercent } from "./display";
import { F001_LINES, f001, f001Material } from "./fixtures/f001";
import { DILUENTS } from "./model/material";

// Reference test (plan, phase 2): F-001-v1 reproduced to the milligram,
// against the table of the lab notebook, formulas/f-001-lejia/v1.md.
describe("F-001-v1, Lejía", () => {
  const c = compose(f001());
  const partOf = (key: string) => c.parts.find((p) => p.material.key === key)?.massUg ?? Ratio.ZERO;

  it("weighs 8,745 g in total, 2,4519 g of them aromatic matter", () => {
    expect(c.totalUg.eq(Ratio.of(8_745_000))).toBe(true);
    expect(c.aromaticUg.eq(Ratio.of(2_451_900))).toBe(true);
    expect(formatPercent(c.aromaticUg.div(c.totalUg), 2)).toBe("28,04 %");
  });

  it("gives every material exactly the pure matter of the notebook", () => {
    for (const [name, labId, , , , pureGrams] of F001_LINES) {
      if (labId === "alcohol") {
        continue;
      }
      const expected = Ratio.fromDecimal(pureGrams).mul(Ratio.of(1_000_000));
      expect(partOf(f001Material(labId, name).key).eq(expected), name).toBe(true);
    }
  });

  it("gives every material the % of the bottle of the notebook, to three decimals", () => {
    for (const [name, labId, , , , , percent] of F001_LINES) {
      if (percent === null) {
        continue;
      }
      const fraction = partOf(f001Material(labId, name).key).div(c.totalUg);
      expect(formatPercent(fraction), name).toBe(`${percent} %`);
    }
  });

  it("carries 8,29 % of DPG and 63,68 % of alcohol", () => {
    expect(partOf(DILUENTS.dpg.key).eq(Ratio.of(724_600))).toBe(true);
    expect(formatPercent(partOf(DILUENTS.dpg.key).div(c.totalUg), 2)).toBe("8,29 %");
    // The notebook says 63,67 % because it rounded the alcohol to 5,568 g before
    // dividing. The exact mass is 5,5685 g: 5,060 g poured plus the alcohol of the
    // three dilutions in alcohol (0,234 + 0,1476 + 0,1269 g). Divided exactly, 63,68 %.
    expect(partOf(DILUENTS.alcohol.key).eq(Ratio.of(5_568_500))).toBe(true);
    expect(formatPercent(partOf(DILUENTS.alcohol.key).div(c.totalUg), 2)).toBe("63,68 %");
  });

  it("scaled ×3 and back to ×1/3 by reweighing, returns to the original to the microgram", () => {
    const original = f001();
    const tare = 12_345_678n;
    const scaled = {
      header: { ...original.header, container: { capacityMl: null, tareUg: tare } },
      history: [
        ...original.history,
        { kind: "reweigh" as const, id: "x3", grossUg: tare + 3n * 8_745_000n, tareUg: tare },
        { kind: "reweigh" as const, id: "back", grossUg: tare + 8_745_000n, tareUg: tare },
      ],
    };
    const before = compose(original).lines;
    const after = compose(scaled).lines;
    expect(after).toHaveLength(before.length);
    after.forEach((line, i) => expect(line.massUg.eq(before[i].massUg), line.material.name).toBe(true));
  });

  it("used as a material, keeps its proportions exact to the microgram and below", () => {
    const vector = vectorOf(f001());
    const lejia = { key: vector.id, kind: "formula" as const, name: "Lejía", vector };
    const oneGram = compose({
      header: { name: "con Lejía", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
      history: [{ kind: "add", id: "x1", material: lejia, massUg: 1_000_000n, fraction: Ratio.ONE, diluent: null }],
    });
    const aag = oneGram.parts.find((p) => p.material.key === "lab:MAT-allyl-amyl-glycolate")?.massUg;
    // 1 g of Lejía holds 1 000 000 × 2 100 / 8 745 000 µg of AAG: 240,137… µg, kept as a fraction.
    expect(aag?.eq(Ratio.of(1_000_000n * 2_100n, 8_745_000n))).toBe(true);
    expect(aag?.isInteger()).toBe(false);
    expect(oneGram.totalUg.eq(Ratio.of(1_000_000))).toBe(true);
    expect(Ratio.sum(oneGram.parts.map((p) => p.massUg)).eq(Ratio.of(1_000_000))).toBe(true);
  });
});
