import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { compose } from "../core/compose";
import { f001 } from "../core/fixtures/f001";
import { byNote } from "./notes";

/** The composition by notes (F3): the F-001 grouped adds up to what it is ungrouped. */

const comp = compose(f001());
const aromatic = comp.parts.filter((p) => !p.material.solvent);
// Tiers given to some of its materials; the rest have none.
const TIERS: Record<string, string> = { "MAT-lavanda": "top", "MAT-hedione": "top_heart", "MAT-florosa": "heart", "MAT-iso-e-super": "heart_base", "MAT-patchouli": "base", "MAT-cedro-atlas": "base" };

describe("the composition by notes (F3)", () => {
  const groups = byNote(aromatic, (key) => TIERS[key.replace(/^lab:/, "")], comp.aromaticUg);
  it("the in-between tiers read as heart; what has no tier, apart", () => {
    expect(groups.map((g) => [g.note, g.parts.length])).toEqual([["top", 1], ["heart", 3], ["base", 2], ["unknown", aromatic.length - 6]]);
  });
  it("the groups add up exactly to the aromatic matter, and their shares to 1", () => {
    expect(Ratio.sum(groups.map((g) => g.massUg)).eq(comp.aromaticUg)).toBe(true);
    expect(Ratio.sum(groups.map((g) => g.share!)).eq(Ratio.ONE)).toBe(true);
    expect(groups[0].share!.eq(groups[0].massUg.div(comp.aromaticUg))).toBe(true);
  });
  it("a zero base gives no share, never a zero", () => {
    expect(byNote(aromatic.slice(0, 1), () => "top", Ratio.ZERO)[0].share).toBeNull();
  });
});
