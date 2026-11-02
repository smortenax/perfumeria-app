import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { compose } from "../core/compose";
import { f001 } from "../core/fixtures/f001";
import { headFigures } from "./figures";

describe("the bench's four figures (audit F-15 L2)", () => {
  it("reads the aromatic share of the bottle and the aromatic materials from the composition", () => {
    const comp = compose(f001());
    const f = headFigures(comp);
    expect(f.aromaticShare!.eq(comp.aromaticUg.div(comp.totalUg))).toBe(true);
    expect(f.materials).toBe(comp.parts.filter((p) => !p.material.solvent).length);
  });

  it("with nothing in the bottle there is no share to say, never 0 %", () => {
    expect(headFigures(null)).toEqual({ aromaticShare: null, materials: 0 });
    expect(headFigures({ lines: [], parts: [], totalUg: Ratio.ZERO, aromaticUg: Ratio.ZERO })).toEqual({ aromaticShare: null, materials: 0 });
  });
});
