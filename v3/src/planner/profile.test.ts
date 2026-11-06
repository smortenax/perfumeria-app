import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { Tier } from "../db/catalog";
import { COMPETE_FRACTION, defaultShape, indexAt, level, type PlanLine, profileAt, SHAPE_IDS } from "./profile";

const line = (key: string, parts: number, impact: number | null, hours: number | null, shape: PlanLine["shape"] = "heart"): PlanLine => ({
  key,
  name: key,
  family: null,
  parts: Ratio.of(parts),
  impact,
  hours: hours === null ? null : Ratio.of(hours),
  shape,
});

describe("the shapes (V3-98)", () => {
  it("start at 1, fall, and reach 0 at the material's hours", () => {
    for (const shape of SHAPE_IDS) {
      expect(level(shape, 400, 0)).toBe(1);
      expect(level(shape, 400, 400)).toBe(0);
      expect(level(shape, 400, 1000)).toBe(0);
      let previous = 1;
      for (const t of [0.1, 0.5, 1, 4, 10, 48, 200, 399]) {
        const now = level(shape, 400, t);
        expect(now).toBeLessThanOrEqual(previous + 1e-12);
        expect(now).toBeGreaterThanOrEqual(0);
        previous = now;
      }
    }
  });

  it("the plateau falls to about 1/3 within the hour and holds it until about 10 h, as the user describes resins", () => {
    expect(level("plateau", 400, 1)).toBeCloseTo(0.34, 2);
    expect(level("plateau", 400, 10)).toBeGreaterThan(0.28);
    expect(level("plateau", 400, 10)).toBeLessThan(level("plateau", 400, 1));
    // The slow part is editable.
    expect(level("plateau", 400, 1, 0.5)).toBeGreaterThan(level("plateau", 400, 1));
  });

  it("a material with a short life drops the anchors past its hours", () => {
    expect(level("linear", 4, 2)).toBeGreaterThan(0);
    expect(level("linear", 4, 4)).toBe(0);
  });

  it("a material without hours has no curve", () => {
    expect(level("heart", 0, 1)).toBe(0);
  });
});

describe("the default shape (a session proposal)", () => {
  const m = (name: string, tier: Tier | null, form: string | null = null) => ({ name, tier, form });
  it("a resin or balsam at the base is a plateau; the rest goes by tier, and without one, by hours", () => {
    expect(defaultShape(m("Benzoin resinoid", "base"), 400)).toBe("plateau");
    expect(defaultShape(m("Something", null, "resinoid"), null)).toBe("plateau");
    expect(defaultShape(m("Lemon", "top"), 4)).toBe("fleeting");
    expect(defaultShape(m("Linalool", "top_heart"), 12)).toBe("top");
    expect(defaultShape(m("Hedione", "heart"), 72)).toBe("heart");
    expect(defaultShape(m("Iso E Super", "heart_base"), 172)).toBe("linear");
    expect(defaultShape(m("Something", "heart_base"), 48)).toBe("heart");
    expect(defaultShape(m("Galaxolide", "base"), 400)).toBe("linear");
    expect(defaultShape(m("Something", null), 3)).toBe("fleeting");
    expect(defaultShape(m("Something", null), null)).toBeNull();
  });
});

describe("the profile of a plan", () => {
  it("weighs each material by parts × impact, and the parts are relative", () => {
    const a = profileAt([line("a", 20, 2, 400, "linear"), line("b", 10, 8, 400, "linear")], 0);
    expect(a.shares.map((s) => [s.key, s.share])).toEqual([
      ["b", 80 / 120],
      ["a", 40 / 120],
    ]);
    const b = profileAt([line("a", 2, 2, 400, "linear"), line("b", 1, 8, 400, "linear")], 0);
    expect(b.shares.map((s) => s.share)).toEqual(a.shares.map((s) => s.share));
    expect(indexAt(line("a", 20, 2, 400), 0)).toBe(40);
  });

  it("counts as competing who reaches 1/3 of the strongest, and warns over 4", () => {
    const p = profileAt([line("lead", 30, 1, 400), line("third", 10, 1, 400), line("less", 9, 1, 400)], 0);
    expect(COMPETE_FRACTION).toBe(1 / 3);
    expect(p.shares.filter((s) => s.competes).map((s) => s.key)).toEqual(["lead", "third"]);
    expect(p.competing).toBe(2);
    expect(p.tooMany).toBe(false);
    const five = profileAt(["a", "b", "c", "d", "e"].map((k) => line(k, 1, 5, 400)), 0);
    expect(five.competing).toBe(5);
    expect(five.tooMany).toBe(true);
    expect(five.effective).toBeCloseTo(5, 10);
  });

  it("the perceived view compresses the differences, so more compete", () => {
    const lines = [line("lead", 30, 1, 400), line("small", 1, 1, 400)];
    expect(profileAt(lines, 0).competing).toBe(1);
    const perceived = profileAt(lines, 0, { perceived: 0.25 });
    expect(perceived.competing).toBe(2);
    expect(perceived.shares[0].value).toBeCloseTo(Math.pow(30, 0.25), 12);
  });

  it("as the hours pass the volatile leave: what is gone is not counted, and the total falls", () => {
    const lines = [line("citrus", 10, 6, 4, "fleeting"), line("musk", 10, 3, 400, "linear")];
    const opening = profileAt(lines, 0);
    expect(opening.shares[0].key).toBe("citrus");
    expect(opening.ofOpening).toBe(1);
    const later = profileAt(lines, 24);
    expect(later.shares.map((s) => s.key)).toEqual(["musk"]);
    expect(later.ofOpening!).toBeLessThan(1);
    expect(profileAt(lines, 600)).toMatchObject({ shares: [], competing: 0, ofOpening: 0 });
  });

  it("says apart what it cannot count, never as zero nor as present", () => {
    const p = profileAt([line("ok", 10, 5, 400), line("noImpact", 10, null, 400), line("noHours", 10, 5, null), line("noShape", 10, 5, 400, null), line("none", 0, null, null)], 0);
    expect(p.shares.map((s) => s.key)).toEqual(["ok"]);
    expect(p.shares[0].share).toBe(1);
    expect(p.apart).toEqual([
      { key: "noImpact", name: "noImpact", missing: ["impact"] },
      { key: "noHours", name: "noHours", missing: ["hours"] },
      { key: "noShape", name: "noShape", missing: ["shape"] },
    ]);
    expect(profileAt([line("x", 1, null, null)], 0)).toMatchObject({ shares: [], ofOpening: null });
  });
});
