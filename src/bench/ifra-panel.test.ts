import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { COUMARIN } from "../core/fixtures/ifra-f001";
import { checkIfra, type IfraData, type IfraMaterial, type IfraSubstance } from "../core/ifra";
import type { Change, Formula, FormulaHeader } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { materialRows, readingIn, substanceRows } from "./ifra-panel";

// The IFRA panel (E4, P58): the substances and the materials in the base the switch chooses. Every
// number is worked out by hand in its comment.
//
// Coumarin's ceiling is 1,5 % (L = 0,015). The bottle is B = 1 g (10⁶ µg); the final batch,
// F = 10 g, and the work batch, W = 2 g. What a base divides by: now, F = 10⁷ µg; completed,
// B·F/W = 5·10⁶ µg. The bottle carries 20 000 µg of tonka tincture, a quarter coumarin (5 000 µg),
// 1 000 µg of coumarin and the rest neutral: S = 6 000 µg of coumarin.

const G = 1_000_000n;
const header: FormulaHeader = { name: "prueba", intention: "", container: null, workBatchUg: 2n * G, finalBatchUg: 10n * G };
const add = (id: string, material: Material, massUg: bigint): Change => ({ kind: "add", id, material, massUg, fraction: Ratio.ONE, diluent: null });
const checked = (substances: IfraMaterial["substances"]): IfraMaterial => ({ status: "checked", substances, conditions: [] });
const material = (key: string, name: string): Material => ({ key: `t:${key}`, kind: "base", name });

const BANNED: IfraSubstance = { key: "sub:prohibida", name: "Prohibida", limit: Ratio.ZERO, amendment: "51", cas: ["0-00-0"] };
const coumarin = material("cumarina", "Cumarina");
const tincture = material("tonka", "Tonka (tintura)");
const neutral = material("neutro", "Neutro");
const banned = material("prohibida", "Prohibida");

const data: IfraData = {
  substances: new Map([{ ...COUMARIN, cas: ["91-64-5"] }, BANNED].map((s) => [s.key, s])),
  materials: new Map([
    [coumarin.key, checked([{ key: COUMARIN.key, fraction: Ratio.ONE }])],
    [tincture.key, checked([{ key: COUMARIN.key, fraction: Ratio.of(1, 4) }])],
    [neutral.key, checked([])],
    [banned.key, checked([{ key: BANNED.key, fraction: Ratio.ONE }])],
  ]),
};

const bottle: Formula = {
  header,
  history: [add("t", tincture, 20_000n), add("c", coumarin, 1_000n), add("n", neutral, 979_000n)],
};

describe("The IFRA panel by substance, in the base of the switch (E4, P58)", () => {
  it("shares, use of the ceiling and room change with the base; the sources do not", () => {
    const report = checkIfra(bottle, data);
    // now: 6 000 / 10⁷ = 3/5 000 of the product; over 0,015, 1/25 of the ceiling.
    // room, pure: L·F − S = 150 000 − 6 000 = 144 000 µg.
    const [now] = substanceRows(report, "now");
    expect(now).toMatchObject({ name: "Cumarina", cas: ["91-64-5"], verdict: "within" });
    expect(now.worstShare.toString()).toBe("3/5000");
    expect(now.used?.toString()).toBe("1/25");
    expect(now.roomUg?.toString()).toBe("144000");
    // completed: 6 000 / (5·10⁶) = 3/2 500; 2/25 of the ceiling.
    // room, pure: (L·F·B − S·W) / (W − L·F) = (1,5·10¹¹ − 1,2·10¹⁰) / 1 850 000 = 2 760 000/37 µg.
    const [completed] = substanceRows(report, "completed");
    expect(completed.worstShare.toString()).toBe("3/2500");
    expect(completed.used?.toString()).toBe("2/25");
    expect(completed.roomUg?.toString()).toBe("2760000/37");
    // Where it comes from: the tincture 5 000 of 6 000, the coumarin 1 000.
    expect(completed.sources.map((s) => [s.name, s.part.toString(), s.worstShare.toString()])).toEqual([
      ["Tonka (tintura)", "5/6", "1/1000"],
      ["Cumarina", "1/6", "1/5000"],
    ]);
  });

  it("without a base, or with one the header lacks, the base of the report", () => {
    const report = checkIfra(bottle, data);
    expect(readingIn(report).base).toBe("completed");
    expect(readingIn(report, "bottle").base).toBe("completed");
    expect(readingIn(checkIfra({ ...bottle, header: { ...header, workBatchUg: null, finalBatchUg: null } }, data), "now").base).toBe("bottle");
  });

  it("a prohibited substance that is there goes first, with no share of a ceiling", () => {
    // In «now» the base is the final batch, which 1 µg more in the bottle does not move: coumarin stays at 1/25.
    const report = checkIfra({ ...bottle, history: [...bottle.history, add("p", banned, 1n)] }, data);
    const rows = substanceRows(report, "now");
    expect(rows.map((r) => [r.name, r.used?.toString() ?? null, r.verdict])).toEqual([
      ["Prohibida", null, "exceeds"],
      ["Cumarina", "1/25", "within"],
    ]);
  });
});

describe("The IFRA panel by material (E4, §5.4)", () => {
  it("what each material alone uses of every ceiling, the one that uses most first", () => {
    // now: the tincture, 5 000 / (10⁷ · 0,015) = 1/30 of the ceiling; the coumarin, 1 000 / 150 000 = 1/150.
    const rows = materialRows(checkIfra(bottle, data), "now");
    expect(rows.map((r) => [r.name, r.items.map((i) => [i.name, i.used?.toString()])])).toEqual([
      ["Tonka (tintura)", [["Cumarina", "1/30"]]],
      ["Cumarina", [["Cumarina", "1/150"]]],
    ]);
  });
});
