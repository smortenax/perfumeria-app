import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { rowState, sharesOf, stillToPour, tally, type WeighRow } from "./weigh";

const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));
const g = (grams: string) => BigInt(Ratio.fromDecimal(grams).mul(Ratio.of(1_000_000n)).toFixed(0));
const row = (over: Partial<WeighRow> = {}): WeighRow => ({
  key: "r",
  materialId: "iso",
  sourceId: null,
  target: "20",
  total: "",
  weighed: "",
  diluents: [{ diluentId: "eth", share: "", weighed: "" }],
  note: "",
  ...over,
});

describe("«Add & weigh», one row (V3-96, the user's rules of 2026-11-04)", () => {
  it("rule 1: the % and the diluent are required; without them the row waits and says which", () => {
    expect(rowState(row({ target: "" }))).toMatchObject({ status: "waiting", need: "target" });
    expect(rowState(row({ diluents: [{ diluentId: "", share: "", weighed: "" }] }))).toMatchObject({ status: "waiting", need: "diluent" });
  });

  it("rule 2: with a total and no weights, what to put in grey (20 % of 15 g: 3 g and 12 g), and it saves as it is", () => {
    const s = rowState(row({ total: "15" }));
    expect(s.status).toBe("asIs");
    expect(s.goal).toEqual({ materialUg: g("3"), diluents: [g("12")] });
    expect(s.toPour).toEqual([g("12")]);
  });

  it("rule 3, from the material: 0.937 g of Javanol for a 10 % asks 8.433 g of ethanol, and waits", () => {
    const s = rowState(row({ target: "10", weighed: "0.937" }));
    expect(s).toMatchObject({ status: "waiting", need: "weights" });
    expect(s.goal).toEqual({ materialUg: null, diluents: [g("8.433")] });
  });

  it("rule 3, from the diluent: 13.6 g of ethanol for a 10 % asks 1.511 g of Habanolide", () => {
    const s = rowState(row({ target: "10", diluents: [{ diluentId: "eth", share: "", weighed: "13.600" }] }));
    expect(s.status).toBe("waiting");
    expect(s.goal.materialUg).toBe(g("1.511"));
  });

  it("rule 4: all weighed, the real % and grams; the difference with what was wanted", () => {
    const s = rowState(row({ total: "15", weighed: "3.000", diluents: [{ diluentId: "eth", share: "", weighed: "12.208" }] }));
    expect(s.status).toBe("weighed");
    expect(s.real!.totalUg).toBe(g("15.208"));
    expect(s.real!.fraction.toFixed(4)).toBe("0.1973"); // 3 / 15.208
    expect(s.diff!.sign()).toBe(-1);
    // The goal stays to be seen after writing (P-UX-04).
    expect(s.goal).toEqual({ materialUg: g("3"), diluents: [g("12")] });
  });

  it("rule 5: nothing weighed, the bottle as it is, at its %", () => {
    const s = rowState(row({ target: "10" }));
    expect(s.status).toBe("asIs");
    expect(s.aimed!.fraction.eq(pct("10"))).toBe(true);
    expect(s.aimed!.diluents).toEqual([{ diluentId: "eth", fraction: pct("90"), massUg: null }]);
  });

  it("rule 6: a weight that is not one (0, letters, a tenth of a milligram) is said, not taken as nothing", () => {
    expect(rowState(row({ weighed: "abc" })).need).toBe("amount");
    expect(rowState(row({ weighed: "0" })).need).toBe("amount");
  });

  it("rule 7: two diluents, 60 % DPG and the rest ethanol of what is added to a 40 % of 10 g: 4, 3.6 and 2.4 g", () => {
    const two = [
      { diluentId: "dpg", share: "60", weighed: "" },
      { diluentId: "eth", share: "", weighed: "" },
    ];
    const s = rowState(row({ target: "40", total: "10", diluents: two }));
    expect(s.shares.map((x) => x.toFixed(2))).toEqual(["0.60", "0.40"]);
    expect(s.goal).toEqual({ materialUg: g("4"), diluents: [g("3.6"), g("2.4")] });
    // Weighed, it comes out at what each weighed.
    const w = rowState(row({ target: "40", total: "10", weighed: "4.000", diluents: [{ ...two[0], weighed: "3.600" }, { ...two[1], weighed: "2.400" }] }));
    expect(w.real!.fraction.eq(pct("40"))).toBe(true);
  });

  it("rule 7: the blank ones share what is left equally; shares that cannot add up are said", () => {
    expect(sharesOf([{ diluentId: "a", share: "50", weighed: "" }, { diluentId: "b", share: "", weighed: "" }, { diluentId: "c", share: "", weighed: "" }])!.map((x) => x.toFixed(2))).toEqual(["0.50", "0.25", "0.25"]);
    expect(sharesOf([{ diluentId: "a", share: "60", weighed: "" }, { diluentId: "b", share: "60", weighed: "" }])).toBeNull();
    expect(rowState(row({ diluents: [{ diluentId: "a", share: "70", weighed: "" }, { diluentId: "b", share: "20", weighed: "" }] })).need).toBe("shares");
  });

  it("from another bottle (s = 50 %): a 10 % of 10 g takes 2 g of that bottle, and only dilutes further", () => {
    const source = { fraction: pct("50"), diluents: [{ diluentId: "eth", fraction: pct("50") }] };
    const s = rowState(row({ target: "10", total: "10", sourceId: "b50" }), source);
    expect(s.goal).toEqual({ materialUg: g("2"), diluents: [g("8")] });
    expect(rowState(row({ target: "50", sourceId: "b50" }), source).need).toBe("further");
  });

  it("the bar: the material against the diluents, planned parts dashed and weighed ones full", () => {
    const planned = rowState(row({ target: "20" }));
    expect(planned.bar.map((b) => [b.part, b.share.toFixed(2), b.weighed])).toEqual([
      ["material", "0.20", false],
      ["diluent", "0.80", false],
    ]);
    const half = rowState(row({ target: "10", weighed: "1.000" }));
    expect(half.bar.map((b) => b.weighed)).toEqual([true, false]);
  });
});

describe("the foot of «Add & weigh»", () => {
  it("still to pour, by diluent, from the rows not yet weighed; and the tally", () => {
    const rows = [
      row({ key: "a", total: "15" }), // 12 g of ethanol to pour
      row({ key: "b", target: "10", weighed: "0.937" }), // 8.433 g of ethanol
      row({ key: "c", target: "10", total: "10", diluents: [{ diluentId: "dpg", share: "", weighed: "" }] }), // 9 g of DPG
      row({ key: "d", total: "15", weighed: "3", diluents: [{ diluentId: "eth", share: "", weighed: "12" }] }), // weighed: nothing
    ].map((r) => ({ row: r, state: rowState(r) }));
    expect(stillToPour(rows)).toEqual(
      new Map([
        ["eth", g("20.433")],
        ["dpg", g("9")],
      ]),
    );
    expect(tally(rows.map((r) => r.state))).toEqual({ rows: 4, weighed: 1, asIs: 2, waiting: 1 });
  });
});
