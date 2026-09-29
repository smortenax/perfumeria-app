import { describe, expect, it } from "vitest";
import { Ratio } from "./arith/ratio";
import { COUMARIN } from "./fixtures/ifra-f001";
import { checkIfra, type IfraBase, type IfraData, type IfraMaterial, type IfraReport, type IfraSubstance } from "./ifra";
import type { Change, Formula, FormulaHeader } from "./model/formula";
import { DILUENTS, type Material } from "./model/material";
import { makeVector } from "./model/vector";

const MG = 1_000n;
const G = 1_000_000n;
const header: FormulaHeader = { name: "prueba", intention: "", container: null, workBatchUg: null, finalBatchUg: null };
const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100));
const add = (id: string, material: Material, massUg: bigint, percent = "100", diluent: Material | null = null): Change => ({
  kind: "add",
  id,
  material,
  massUg,
  fraction: pct(percent),
  diluent,
});
const checked = (substances: IfraMaterial["substances"]): IfraMaterial => ({ status: "checked", substances, conditions: [] });

const coumarin: Material = { key: "t:cumarina", kind: "base", name: "Cumarina" };
// A quarter of its pure matter is coumarin.
const tincture: Material = { key: "t:tonka", kind: "base", name: "Tonka (tintura)" };
// Carries coumarin, with a load without data (§1.2).
const blind: Material = { key: "t:ciega", kind: "base", name: "Tintura sin dato" };
// Lists coumarin twice.
const twice: Material = { key: "t:doble", kind: "base", name: "Doble" };
const other: Material = { key: "t:otra", kind: "base", name: "Otra" };
// Carries the other substance, with a load without data.
const blindOther: Material = { key: "t:ciega-otra", kind: "base", name: "Otra sin dato" };
const neutral: Material = { key: "t:neutro", kind: "base", name: "Neutro" };
const OTHER: IfraSubstance = { key: "sub:otra", name: "Otra", limit: pct("2"), amendment: "51" };

const data: IfraData = {
  substances: new Map([
    [COUMARIN.key, COUMARIN],
    [OTHER.key, OTHER],
  ]),
  materials: new Map([
    [coumarin.key, checked([{ key: COUMARIN.key, fraction: Ratio.ONE }])],
    [tincture.key, checked([{ key: COUMARIN.key, fraction: Ratio.of(1, 4) }])],
    [blind.key, checked([{ key: COUMARIN.key, fraction: null }])],
    [
      twice.key,
      checked([
        { key: COUMARIN.key, fraction: Ratio.of(1, 10) },
        { key: COUMARIN.key, fraction: Ratio.of(1, 5) },
      ]),
    ],
    [other.key, checked([{ key: OTHER.key, fraction: Ratio.ONE }])],
    [blindOther.key, checked([{ key: OTHER.key, fraction: null }])],
    [neutral.key, checked([])],
  ]),
};

const summary = (report: IfraReport) =>
  report.checks[0].sources.map((s) => [s.material.name, s.knownUg.toString(), s.worstUg.toString()]);

describe("IFRA: where each substance comes from (§5.3, §10.3)", () => {
  it("a bottle of coumarin and a tincture with a known fraction: each brings its share, the largest first", () => {
    // Poured tincture first, so that the order is the amount and not the pouring.
    const formula: Formula = {
      header,
      history: [
        add("t", tincture, 100n * MG, "10", DILUENTS.alcohol), // 10 mg of pure matter, a quarter of it coumarin: 2 500 µg
        add("c", coumarin, 150n * MG, "9", DILUENTS.alcohol), // 13,5 mg of pure coumarin: 13 500 µg
        add("a", DILUENTS.alcohol, 750n * MG),
      ],
    };
    const report = checkIfra(formula, data);
    expect(summary(report)).toEqual([
      ["Cumarina", "13500", "13500"],
      ["Tonka (tintura)", "2500", "2500"],
    ]);
    // They add up to what the substance has: 16 000 µg, the 1,6 % of a 1 g bottle.
    expect(report.checks[0].knownUg.toString()).toBe("16000");
    expect(report.checks[0].worstUg.toString()).toBe("16000");
  });

  it("a load without data brings nothing known and everything in the worst case, and is sorted by that", () => {
    const formula: Formula = {
      header,
      history: [
        add("t", tincture, 100n * MG, "10", DILUENTS.alcohol), // 2 500 µg
        add("b", blind, 50n * MG, "10", DILUENTS.alcohol), // 5 mg of pure matter: up to 5 000 µg, none known
        add("c", coumarin, 150n * MG, "9", DILUENTS.alcohol), // 13 500 µg
        add("a", DILUENTS.alcohol, 700n * MG),
      ],
    };
    const report = checkIfra(formula, data);
    expect(summary(report)).toEqual([
      ["Cumarina", "13500", "13500"],
      ["Tintura sin dato", "0", "5000"],
      ["Tonka (tintura)", "2500", "2500"],
    ]);
    // Known: 13 500 + 0 + 2 500. Worst case: 13 500 + 5 000 + 2 500.
    expect(report.checks[0].knownUg.toString()).toBe("16000");
    expect(report.checks[0].worstUg.toString()).toBe("21000");
    expect(report.checks[0].unknownFrom).toEqual(["Tintura sin dato"]);
  });

  it("a material shows once per substance: poured in two lines, or listing the substance twice", () => {
    const formula: Formula = {
      header,
      history: [
        add("c1", coumarin, 100n * MG),
        add("d", twice, 100n * MG), // (1/10 + 1/5) of 100 mg: 30 mg
        add("c2", coumarin, 50n * MG),
      ],
    };
    const report = checkIfra(formula, data);
    expect(summary(report)).toEqual([
      ["Cumarina", "150000", "150000"],
      ["Doble", "30000", "30000"],
    ]);
  });

  it("a formula used as a material gives its components as sources, not itself", () => {
    const vector = makeVector([
      { material: coumarin, amount: Ratio.of(1) },
      { material: neutral, amount: Ratio.of(4) },
    ]);
    const accord: Material = { key: vector.id, kind: "formula", name: "Acorde", vector };
    // A fifth of 100 mg is coumarin.
    const report = checkIfra({ header, history: [add("x", accord, 100n * MG)] }, data);
    expect(summary(report)).toEqual([["Cumarina", "20000", "20000"]]);
  });

  it("keeps the sources apart for each substance", () => {
    const formula: Formula = { header, history: [add("c", coumarin, 10n * MG), add("o", other, 50n * MG)] };
    const report = checkIfra(formula, data);
    const namesOf = (key: string) => report.checks.find((c) => c.substance.key === key)?.sources.map((s) => s.material.name);
    expect(namesOf(COUMARIN.key)).toEqual(["Cumarina"]);
    expect(namesOf(OTHER.key)).toEqual(["Otra"]);
  });
});

describe("IFRA: the bases of reading 1 (P58)", () => {
  // 100 mg of coumarin and 900 mg of neutral; then half of the gram is spilled: the scale
  // finds 0,5 g over a 20 g tare. The bottle holds 500 000 µg, of them 50 000 µg of coumarin.
  const spilled: Change[] = [
    add("c", coumarin, 100n * MG),
    add("n", neutral, 900n * MG),
    { kind: "reweigh", id: "r", grossUg: 20n * G + 500n * MG, tareUg: 20n * G },
  ];
  const report = (batches: Partial<FormulaHeader>, history: Change[] = spilled) => checkIfra({ header: { ...header, ...batches }, history }, data);
  const names = (r: IfraReport) => r.readings.map((x) => x.base);

  it("has the bottle as it is without a final batch, whatever the work batch", () => {
    expect(names(report({}))).toEqual(["bottle"]);
    expect(names(report({ workBatchUg: 1n * G }))).toEqual(["bottle"]);
    expect(report({ workBatchUg: 1n * G }).base).toBe("bottle");
  });

  it("has «now» with a final batch, and «completed» too with a work batch", () => {
    const withFinal = report({ finalBatchUg: 10n * G });
    expect(names(withFinal)).toEqual(["now"]);
    expect(withFinal.base).toBe("now");
    // A work batch of zero is no work batch.
    expect(names(report({ finalBatchUg: 10n * G, workBatchUg: 0n }))).toEqual(["now"]);
    const withBoth = report({ finalBatchUg: 10n * G, workBatchUg: 1n * G });
    expect(names(withBoth)).toEqual(["now", "completed"]);
    expect(withBoth.base).toBe("completed");
  });

  it("keeps the fields of always as the base they always meant, with the values of always", () => {
    // What the report gave before the bases: no final batch, the bottle; a final batch alone, that
    // batch; final and work batch, the bottle taken to the final batch as the work batch is (P51).
    // Coumarin is 50 000 µg: 10 % of the bottle, 0,5 % of 10 g, 1 % of 5 g.
    const cases: Array<[string, Partial<FormulaHeader>, IfraBase, string, string, string]> = [
      ["no final batch", {}, "bottle", "500000", "exceeds", "no"],
      ["no final batch, with a work batch", { workBatchUg: 1n * G }, "bottle", "500000", "exceeds", "no"],
      ["a final batch alone", { finalBatchUg: 10n * G }, "now", "10000000", "within", "yes"],
      ["a final batch and a work batch of zero", { finalBatchUg: 10n * G, workBatchUg: 0n }, "now", "10000000", "within", "yes"],
      ["a final batch and a work batch", { finalBatchUg: 10n * G, workBatchUg: 1n * G }, "completed", "5000000", "within", "yes"],
    ];
    for (const [name, batches, base, finalUg, verdict, asIs] of cases) {
      const r = report(batches);
      expect(r.base, name).toBe(base);
      expect(r.finalUg.toString(), name).toBe(finalUg);
      expect(r.checks[0].verdict, name).toBe(verdict);
      expect(r.asIs, name).toBe(asIs);
      // And they are the reading of that base.
      const reading = r.readings.find((x) => x.base === base);
      expect(reading?.finalUg.eq(r.finalUg), name).toBe(true);
      expect(reading?.asIs, name).toBe(r.asIs);
      expect(reading?.checks.map((c) => c.verdict), name).toEqual(r.checks.map((c) => c.verdict));
    }
  });

  it("gives each base its own verdict and what still fits of each substance, in the worst case", () => {
    // 100 mg of coumarin in a 1 g bottle, made into 10 g of final batch out of a work batch of 2 g.
    const history: Change[] = [add("c", coumarin, 100n * MG), add("n", neutral, 900n * MG)];
    const both = report({ finalBatchUg: 10n * G, workBatchUg: 2n * G }, history);
    const [now, completed] = both.readings;
    // Now: 100 000 µg over 10 g is 1 %, under 1,5 %. Room: 0,015 × 10 000 000 − 100 000.
    expect(now.finalUg.toString()).toBe("10000000");
    expect(now.checks).toEqual([{ key: COUMARIN.key, verdict: "within", roomUg: Ratio.of(50_000n) }]);
    expect(now.asIs).toBe("yes");
    // Completed: the gram stands for 2 g, brought to 10 g it is 5 g: 100 000 µg is 2 %, over
    // 1,5 %. There is no room left, and it does not go below zero.
    expect(completed.finalUg.toString()).toBe("5000000");
    expect(completed.checks).toEqual([{ key: COUMARIN.key, verdict: "exceeds", roomUg: Ratio.ZERO }]);
    expect(completed.asIs).toBe("no");
    // The fields of always are those of the last one.
    expect(both.asIs).toBe("no");
  });

  it("a load without data is bounded in one base and unknown in the other", () => {
    const history: Change[] = [add("b", blind, 100n * MG), add("n", neutral, 900n * MG)];
    const [now, completed] = report({ finalBatchUg: 10n * G, workBatchUg: 2n * G }, history).readings;
    // At worst 100 000 µg: 1 % of 10 g, and it stays under 1,5 %: proven, not guessed (P31).
    expect(now.checks).toEqual([{ key: COUMARIN.key, verdict: "bounded", roomUg: Ratio.of(50_000n) }]);
    expect(now.asIs).toBe("yes");
    // At worst 2 % of 5 g, and none of it is known: it cannot be checked.
    expect(completed.checks).toEqual([{ key: COUMARIN.key, verdict: "unknown", roomUg: Ratio.ZERO }]);
    expect(completed.asIs).toBe("unknown");
  });

  it("a substance over its ceiling makes it a «no» in that base, even if another cannot be checked", () => {
    // In the 1 g bottle, 50 000 µg of coumarin is 5 %: over 1,5 %. The other substance is at worst
    // 100 000 µg, 10 %, over its 2 % with none of it known: it cannot be checked.
    const history: Change[] = [add("c", coumarin, 50n * MG), add("b", blindOther, 100n * MG), add("n", neutral, 850n * MG)];
    const r = report({}, history);
    expect(r.checks.map((c) => [c.substance.key, c.verdict]).sort()).toEqual([
      [COUMARIN.key, "exceeds"],
      [OTHER.key, "unknown"],
    ]);
    expect(r.readings[0].asIs).toBe("no");
    expect(r.asIs).toBe("no");
    // Over 4 g the coumarin is 1,25 %, within, and the other is at worst 2,5 %, over 2 %: now nothing
    // exceeds, and what cannot be checked leaves it unknown.
    const now = report({ finalBatchUg: 4n * G }, history);
    expect(now.checks.map((c) => [c.substance.key, c.verdict]).sort()).toEqual([
      [COUMARIN.key, "within"],
      [OTHER.key, "unknown"],
    ]);
    expect(now.asIs).toBe("unknown");
  });

  it("keeps the substances of every base in the order of the report, each with its own room", () => {
    // 10 000 µg of coumarin and 50 000 µg of the other substance (2 %) in a 1 g bottle.
    const history: Change[] = [add("c", coumarin, 10n * MG), add("o", other, 50n * MG), add("n", neutral, 940n * MG)];
    const r = report({ finalBatchUg: 10n * G, workBatchUg: 2n * G }, history);
    const keys = r.checks.map((c) => c.substance.key);
    expect(new Set(keys)).toEqual(new Set([COUMARIN.key, OTHER.key]));
    const room = (base: IfraBase) => Object.fromEntries((r.readings.find((x) => x.base === base)?.checks ?? []).map((c) => [c.key, c.roomUg?.toString()]));
    for (const reading of r.readings) {
      expect(reading.checks.map((c) => c.key)).toEqual(keys);
    }
    // Now, over 10 g: coumarin 0,015 × 10 000 000 − 10 000; the other 0,02 × 10 000 000 − 50 000.
    expect(room("now")).toEqual({ [COUMARIN.key]: "140000", [OTHER.key]: "150000" });
    // Completed: pouring the substance pure also grows the 1 g bottle that stands for the 2 g
    // work batch, so y·(W − L·F) ≤ L·F·B − S·W. Coumarin: (0,015·10⁷·10⁶ − 10⁴·2·10⁶) /
    // (2·10⁶ − 0,015·10⁷) = 2 600 000/37, about 70 270. The other: (0,02·10⁷·10⁶ − 5·10⁴·2·10⁶) /
    // (2·10⁶ − 0,02·10⁷) = 500 000/9, about 55 556. Until 2026-09-29 it said 65 000 and 50 000,
    // holding the product at 5 g while the pour grows it: it fell 8 % and 11 % short.
    expect(room("completed")).toEqual({ [COUMARIN.key]: "2600000/37", [OTHER.key]: "500000/9" });
  });

  it("with an empty bottle nothing fails: no substances, no checks, in any base", () => {
    const cases: Array<[Partial<FormulaHeader>, string[]]> = [
      [{}, ["0"]],
      [{ finalBatchUg: 10n * G }, ["10000000"]],
      // Nothing to bring to the final batch: it stays as it is.
      [{ finalBatchUg: 10n * G, workBatchUg: 2n * G }, ["10000000", "10000000"]],
    ];
    for (const [batches, finals] of cases) {
      for (const history of [[], [add("a", DILUENTS.alcohol, 1n * G)]]) {
        const r = report(batches, history);
        expect(r.checks).toEqual([]);
        expect(r.readings.length).toBe(finals.length);
        expect(r.readings.every((x) => x.checks.length === 0 && x.asIs === "yes")).toBe(true);
        if (history.length === 0) {
          expect(r.readings.map((x) => x.finalUg.toString())).toEqual(finals);
        }
      }
    }
  });
});

describe("IFRA: reading 1 and reading 2 agree at the exact border, in every base (P51, P58)", () => {
  // A 1 g bottle: k µg of coumarin, the rest neutral. Coumarin's ceiling, 1,5 %, is 15 000 µg of it.
  const bottleOf = (kUg: bigint, batches: Partial<FormulaHeader>): Formula => ({
    header: { ...header, ...batches },
    history: [add("c", coumarin, kUg), add("n", neutral, G - kUg)],
  });
  const says = (r: IfraReport, base: IfraBase) => r.readings.find((x) => x.base === base)?.asIs;
  const reaches = (r: IfraReport, needed: Ratio) => !r.maxUse.lt(needed);

  it("completed: yes if, and only if, the second reading reaches the work batch over the final batch", () => {
    // [work g, final g]. The border is 15 000 µg × final / work.
    for (const [w, f] of [[1n, 1n], [2n, 10n], [5n, 10n], [1n, 10n], [3n, 4n], [1n, 2n]] as const) {
      const border = (15_000n * f) / w;
      expect((border * w) / f, "the border is whole").toBe(15_000n);
      for (const k of [border - 1n, border, border + 1n]) {
        const r = checkIfra(bottleOf(k, { workBatchUg: w * G, finalBatchUg: f * G }), data);
        expect(says(r, "completed"), `work ${w}, final ${f}, k ${k}`).toBe(k <= border ? "yes" : "no");
        expect(says(r, "completed") === "yes", `work ${w}, final ${f}, k ${k}`).toBe(reaches(r, Ratio.of(w, f)));
      }
    }
  });

  it("completed with a work batch equal to the final batch: yes only if it can be used at 100 %", () => {
    for (const k of [14_999n, 15_000n, 15_001n]) {
      const r = checkIfra(bottleOf(k, { workBatchUg: 5n * G, finalBatchUg: 5n * G }), data);
      expect(says(r, "completed") === "yes").toBe(reaches(r, Ratio.ONE));
      expect(says(r, "completed")).toBe(k <= 15_000n ? "yes" : "no");
    }
  });

  it("now: yes if, and only if, the second reading reaches the bottle over the final batch", () => {
    for (const f of [1n, 2n, 5n, 10n, 20n]) {
      // The bottle is 1 g. k over the final batch is under 1,5 % up to 15 000 µg × final.
      const border = 15_000n * f;
      for (const k of [border - 1n, border, border + 1n]) {
        const r = checkIfra(bottleOf(k, { finalBatchUg: f * G }), data);
        expect(says(r, "now"), `final ${f}, k ${k}`).toBe(k <= border ? "yes" : "no");
        expect(says(r, "now") === "yes", `final ${f}, k ${k}`).toBe(reaches(r, Ratio.of(G, f * G)));
      }
    }
  });

  it("bottle: yes if, and only if, the second reading reaches 100 %", () => {
    for (const k of [14_999n, 15_000n, 15_001n]) {
      const r = checkIfra(bottleOf(k, {}), data);
      expect(says(r, "bottle"), `k ${k}`).toBe(k <= 15_000n ? "yes" : "no");
      expect(says(r, "bottle") === "yes", `k ${k}`).toBe(reaches(r, Ratio.ONE));
    }
  });

  it("with a final and a work batch, «now» can say yes where «completed» says no", () => {
    // Work 2 g, final 10 g: «now» holds up to 150 000 µg, «completed» only up to 75 000 µg.
    const r = checkIfra(bottleOf(75_001n, { workBatchUg: 2n * G, finalBatchUg: 10n * G }), data);
    expect(says(r, "now")).toBe("yes");
    expect(says(r, "completed")).toBe("no");
    expect(r.asIs).toBe("no");
  });
});
