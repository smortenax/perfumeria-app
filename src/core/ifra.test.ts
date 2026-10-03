import { describe, expect, it } from "vitest";
import { Ratio } from "./arith/ratio";
import { formatPercent } from "./display";
import { f001 } from "./fixtures/f001";
import { COUMARIN, f001Ifra } from "./fixtures/ifra-f001";
import { checkIfra, marginOf, type IfraData, type IfraSubstance } from "./ifra";
import type { Change, Formula, FormulaHeader } from "./model/formula";
import { DILUENTS, type Material } from "./model/material";

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

describe("IFRA on F-001-v1", () => {
  const report = checkIfra(f001(), f001Ifra());
  const check = (name: string) => report.checks.find((c) => c.substance.name === name);

  it("keeps every known ceiling, with the % of the notebook", () => {
    expect(check("Polysantol")?.verdict).toBe("within");
    expect(formatPercent(check("Polysantol")?.knownUg.div(report.finalUg) ?? Ratio.ZERO)).toBe("0,271 %");
    for (const name of ["Iso E Super", "Cashmeran", "Mayol", "Resinoide estírax"]) {
      expect(check(name)?.verdict, name).toBe("within");
    }
  });

  it("bounds the coumarin of the tonka tincture: not even all of it would reach 1,5 %", () => {
    const coumarin = check("Cumarina");
    expect(coumarin?.verdict).toBe("bounded");
    expect(coumarin?.knownUg.isZero()).toBe(true);
    expect(formatPercent(coumarin?.worstUg.div(report.finalUg) ?? Ratio.ZERO)).toBe("0,188 %");
    expect(coumarin?.unknownFrom).toEqual(["Haba tonka (tintura)"]);
  });

  it("answers the two readings only for what is known: the ambergris tincture was never checked", () => {
    expect(report.unchecked).toEqual(["Ámbar gris (tintura)"]);
    expect(report.asIs).toBe("unknown");
    expect(report.maxUse.eq(Ratio.ONE)).toBe(true);
    expect(report.partial).toBe(true);
    expect(report.finalAssumed).toBe(true);
  });

  it("lists what is not a percentage as conditions", () => {
    // Named as in the notebook's table.
    expect(report.conditions.map((c) => c.material)).toEqual(["Lavanda", "Resinoide Estírax"]);
  });
});

describe("IFRA: the unknown is never green (§1.2)", () => {
  const coumarinBottle: Material = { key: "lab:MAT-cumarina-natural", kind: "base", name: "Cumarina natural" };
  const tonka: Material = { key: "lab:MAT-haba-tonka-tintura", kind: "base", name: "Haba tonka (tintura)" };
  const data: IfraData = {
    substances: new Map([[COUMARIN.key, COUMARIN]]),
    materials: new Map([
      [coumarinBottle.key, { status: "checked", substances: [{ key: COUMARIN.key, fraction: Ratio.ONE }], conditions: [] }],
      [tonka.key, { status: "checked", substances: [{ key: COUMARIN.key, fraction: null }], conditions: [] }],
    ]),
  };

  it("coumarin from the bottle plus the tincture without data: a warning, never within", () => {
    // 1,35 % known from the bottle; the tincture could bring up to 0,5 % more.
    const formula: Formula = {
      header,
      history: [
        add("a", coumarinBottle, 150n * MG, "9", DILUENTS.alcohol),
        add("b", tonka, 50n * MG, "10", DILUENTS.alcohol),
        add("c", DILUENTS.alcohol, 800n * MG),
      ],
    };
    const report = checkIfra(formula, data);
    const coumarin = report.checks[0];
    expect(formatPercent(coumarin.knownUg.div(report.finalUg))).toBe("1,350 %");
    expect(formatPercent(coumarin.worstUg.div(report.finalUg))).toBe("1,850 %");
    expect(coumarin.verdict).toBe("unknown");
    expect(report.asIs).toBe("unknown");
    // Reading 2 is the worst case; hover gives the range up to what the known alone would allow (P31).
    expect(formatPercent(report.maxUse, 2)).toBe("81,08 %");
    expect(report.maxUseKnown.eq(Ratio.ONE)).toBe(true);
  });

  it("a bounded load is proven, not guessed: reading 1 can say yes, and reading 2 counts it at its worst (P31)", () => {
    // 300 mg of tincture at 10 %: up to 30 mg of coumarin in a 1 g concentrate, made into 4 g of perfume.
    const formula: Formula = {
      header: { ...header, finalBatchUg: 4n * G },
      history: [add("t", tonka, 300n * MG, "10", DILUENTS.alcohol), add("a", DILUENTS.alcohol, 700n * MG)],
    };
    const report = checkIfra(formula, data);
    const coumarin = report.checks[0];
    expect(coumarin.knownUg.isZero()).toBe(true);
    expect(formatPercent(coumarin.worstUg.div(report.finalUg), 2)).toBe("0,75 %");
    expect(coumarin.verdict).toBe("bounded");
    expect(coumarin.unknownFrom).toEqual(["Haba tonka (tintura)"]);
    expect(report.asIs).toBe("yes");
    // At its worst the concentrate is 3 % coumarin: it fits into a perfume up to half of it.
    expect(report.maxUse.toString()).toBe("1/2");
    expect(report.partial).toBe(false);
    // Hover: between 50 % and 100 %, depending on how much coumarin the tincture really carries.
    expect(report.maxUseKnown.eq(Ratio.ONE)).toBe(true);
  });

  it("a constituent whose ceiling is not in the data keeps both readings open", () => {
    // A lemon oil: its own ceiling (2 %, phototoxicity) is known; its citral's is not.
    const lemon: Material = { key: "lab:MAT-limon", kind: "own", name: "Limón" };
    const lemonData: IfraData = {
      substances: new Map([["lab:MAT-limon", { key: "lab:MAT-limon", name: "Limón", limit: pct("2"), amendment: "51" }]]),
      materials: new Map([
        [lemon.key, { status: "checked", substances: [{ key: "lab:MAT-limon", fraction: Ratio.ONE }], conditions: [], pending: ["citral"] }],
      ]),
    };
    const report = checkIfra({ header, history: [add("l", lemon, 10n * MG), add("a", DILUENTS.alcohol, 990n * MG)] }, lemonData);
    expect(report.checks[0].verdict).toBe("within");
    expect(report.pending).toEqual([{ material: "Limón", text: "citral" }]);
    expect(report.asIs).toBe("unknown");
    expect(report.partial).toBe(true);
  });

  it("a provisional material is not checked, and says so", () => {
    const quick: Material = { key: "prov:1", kind: "provisional", name: "Acorde sin definir" };
    const report = checkIfra({ header, history: [add("a", quick, 1n * G)] }, data);
    expect(report.unchecked).toEqual(["Acorde sin definir"]);
    expect(report.asIs).toBe("unknown");
  });
});

describe("IFRA on the final batch (T9 of the background docs)", () => {
  it("8 % of a concentrate made into a perfume at 20 % is 1,6 %: within a 2 % ceiling, usable up to 25 %", () => {
    const x: Material = { key: "cas:X", kind: "base", name: "X" };
    const filler: Material = { key: "cas:Y", kind: "base", name: "Y" };
    const data: IfraData = {
      substances: new Map([["cas:X", { key: "cas:X", name: "X", limit: pct("2"), amendment: "51" }]]),
      materials: new Map([
        ["cas:X", { status: "checked", substances: [{ key: "cas:X", fraction: Ratio.ONE }], conditions: [] }],
        ["cas:Y", { status: "checked", substances: [], conditions: [] }],
      ]),
    };
    const formula: Formula = {
      header: { ...header, finalBatchUg: 500n * G },
      history: [add("x", x, 8n * G), add("y", filler, 92n * G)],
    };
    const report = checkIfra(formula, data);
    expect(formatPercent(report.checks[0].knownUg.div(report.finalUg), 1)).toBe("1,6 %");
    expect(report.checks[0].verdict).toBe("within");
    expect(report.asIs).toBe("yes");
    expect(report.maxUse.toString()).toBe("1/4");
    expect(report.finalAssumed).toBe(false);
  });

  it("over the ceiling in the final batch is a plain no", () => {
    const x: Material = { key: "cas:X", kind: "base", name: "X" };
    const data: IfraData = {
      substances: new Map([["cas:X", { key: "cas:X", name: "X", limit: pct("2"), amendment: "51" }]]),
      materials: new Map([["cas:X", { status: "checked", substances: [{ key: "cas:X", fraction: Ratio.ONE }], conditions: [] }]]),
    };
    const report = checkIfra({ header, history: [add("x", x, 3n * G), add("a", DILUENTS.alcohol, 97n * G)] }, data);
    expect(report.checks[0].verdict).toBe("exceeds");
    expect(report.asIs).toBe("no");
    expect(formatPercent(report.maxUse, 2)).toBe("66,67 %");
    // Nothing unknown: the range closes on one number.
    expect(report.maxUseKnown.eq(report.maxUse)).toBe(true);
  });
});

describe("IFRA after reweighing (P57): what is lost goes out in proportion", () => {
  const coumarin: Material = { key: "t:cumarina", kind: "base", name: "Cumarina" };
  const neutral: Material = { key: "t:neutro", kind: "base", name: "Neutro" };
  const data: IfraData = {
    substances: new Map([[COUMARIN.key, COUMARIN]]),
    materials: new Map([
      [coumarin.key, { status: "checked", substances: [{ key: COUMARIN.key, fraction: Ratio.ONE }], conditions: [] }],
      [neutral.key, { status: "checked", substances: [], conditions: [] }],
    ]),
  };
  const poured: Change[] = [add("c", coumarin, 100n * MG), add("n", neutral, 900n * MG)];
  // Half of the gram is spilled: the scale finds 0,5 g over a 20 g tare.
  const spilled: Change[] = [...poured, { kind: "reweigh", id: "r", grossUg: 20n * G + 500n * MG, tareUg: 20n * G }];
  const share = (f: Formula) => {
    const r = checkIfra(f, data);
    return [formatPercent(r.checks[0].worstUg.div(r.finalUg)), formatPercent(r.maxUse)];
  };

  it("with a work batch, both readings stay: the first one is the batch once completed", () => {
    const planned = { ...header, workBatchUg: 1n * G, finalBatchUg: 10n * G };
    expect(share({ header: planned, history: poured })).toEqual(["1,000 %", "15,000 %"]);
    expect(share({ header: planned, history: spilled })).toEqual(["1,000 %", "15,000 %"]);
  });

  it("without a work batch, the first reading is what is in the bottle now, taken to the final batch", () => {
    const onlyFinal = { ...header, finalBatchUg: 10n * G };
    expect(share({ header: onlyFinal, history: poured })).toEqual(["1,000 %", "15,000 %"]);
    expect(share({ header: onlyFinal, history: spilled })).toEqual(["0,500 %", "15,000 %"]);
  });
});

describe("IFRA: a placeholder is bounded by its maximum, never within (D2 of the v2)", () => {
  // A natural whose coumarin comes only from the literature: not proven, at most `upper` of it.
  const natural = (upper: string): IfraData => ({
    substances: new Map([[COUMARIN.key, COUMARIN]]),
    materials: new Map([
      ["t:natural", { status: "checked", substances: [{ key: COUMARIN.key, fraction: null, upper: pct(upper) }], conditions: [] }],
    ]),
  });
  const material: Material = { key: "t:natural", kind: "base", name: "Natural" };
  const formula: Formula = { header, history: [add("n", material, 1n * G)] };

  it("a maximum under the ceiling is bounded: proven, reading 1 says yes, but it is not within", () => {
    const report = checkIfra(formula, natural("1"));
    expect(report.checks[0].verdict).toBe("bounded");
    expect(report.checks[0].knownUg.isZero()).toBe(true);
    expect(report.checks[0].worstUg.eq(Ratio.of(10_000n))).toBe(true);
    expect(report.checks[0].unknownFrom).toEqual(["Natural"]);
    expect(report.asIs).toBe("yes");
  });

  it("a maximum over the ceiling cannot be checked", () => {
    const report = checkIfra(formula, natural("2"));
    expect(report.checks[0].verdict).toBe("unknown");
    expect(report.asIs).toBe("unknown");
    // Reading 2 takes the maximum, not the whole material: 1,5 % / 2 % of the perfume.
    expect(report.maxUse.eq(pct("75"))).toBe(true);
  });

  it("a maximum of 0 % is still bounded, never within", () => {
    expect(checkIfra(formula, natural("0")).checks[0].verdict).toBe("bounded");
  });

  it("without a maximum the worst case is the whole material, as before", () => {
    const data: IfraData = {
      substances: new Map([[COUMARIN.key, COUMARIN]]),
      materials: new Map([["t:natural", { status: "checked", substances: [{ key: COUMARIN.key, fraction: null }], conditions: [] }]]),
    };
    expect(checkIfra(formula, data).checks[0].worstUg.eq(Ratio.of(G))).toBe(true);
  });

  it("the margin of a pour counts the maximum too", () => {
    const empty: Formula = { header, history: [] };
    // In the bottle base the bottle grows with the pour: at 2 % of coumarin, over the 1,5 % ceiling,
    // the empty bottle has no room for it; at 1 % the pour can only dilute, so it sets no ceiling.
    const margin = marginOf(empty, natural("2"), { material, fraction: Ratio.ONE, diluent: null }, "bottle");
    expect(margin.kind).toBe("bounded");
    const free = marginOf(empty, natural("1"), { material, fraction: Ratio.ONE, diluent: null }, "bottle");
    expect(free.kind).toBe("unbounded");
  });
});

describe("IFRA: substances summed against their ceilings (STD 089 and the phototoxic oils)", () => {
  // Two oils whose standards add up: each one's share of the product over its own ceiling.
  const oilA: Material = { key: "t:oil-a", kind: "base", name: "Aceite A" };
  const oilB: Material = { key: "t:oil-b", kind: "base", name: "Aceite B" };
  const neutral: Material = { key: "t:neutro", kind: "base", name: "Neutro" };
  const ceilings = (combined: boolean): IfraData["substances"] =>
    new Map<string, IfraSubstance>([
      ["s:a", { key: "s:a", name: "A", limit: pct("2"), amendment: "51", ...(combined ? { combined: "foto" } : {}) }],
      ["s:b", { key: "s:b", name: "B", limit: pct("0,4"), amendment: "51", ...(combined ? { combined: "foto" } : {}) }],
    ]);
  const data = (combined = true, upperB?: string): IfraData => ({
    substances: ceilings(combined),
    materials: new Map([
      [oilA.key, { status: "checked", substances: [{ key: "s:a", fraction: Ratio.ONE }], conditions: [] }],
      [
        oilB.key,
        {
          status: "checked",
          substances: [upperB ? { key: "s:b", fraction: null, upper: pct(upperB) } : { key: "s:b", fraction: Ratio.ONE }],
          conditions: [],
        },
      ],
      [neutral.key, { status: "checked", substances: [], conditions: [] }],
    ]),
  });
  /** A bottle of exactly 1 g, with the mass of each oil in micrograms. */
  const bottle = (a: bigint, b: bigint): Formula => ({
    header,
    history: [add("a", oilA, a), ...(b > 0n ? [add("b", oilB, b)] : []), add("n", neutral, 1_000_000n - a - b)],
  });

  it("(a) two oils at 60 % of their ceilings are each within, but together at 120 %: it exceeds, and reading 1 says no", () => {
    const report = checkIfra(bottle(12_000n, 2_400n), data());
    expect(report.checks.map((c) => c.verdict)).toEqual(["within", "within"]);
    const group = report.combinedChecks[0];
    expect(group.group).toBe("foto");
    expect([...group.keys].sort()).toEqual(["s:a", "s:b"]);
    expect(group.worstShare.eq(pct("120"))).toBe(true);
    expect(group.verdict).toBe("exceeds");
    expect(report.asIs).toBe("no");
    // Reading 2: 1 / 1,2 of what is poured.
    expect(formatPercent(group.maxUse)).toBe("83,333 %");
    expect(formatPercent(report.maxUse)).toBe("83,333 %");
  });

  it("(b) at 40 % + 40 % the group is within at 80 %, and could take 125 % of this", () => {
    const report = checkIfra(bottle(8_000n, 1_600n), data());
    const group = report.combinedChecks[0];
    expect(group.verdict).toBe("within");
    expect(group.worstShare.eq(pct("80"))).toBe(true);
    expect(formatPercent(group.maxUse)).toBe("125,000 %");
    expect(report.asIs).toBe("yes");
  });

  it("(c) a load bounded by its maximum (D2) leaves the group bounded; one that could pass 1 leaves it unknown", () => {
    const bounded = checkIfra(bottle(12_000n, 2_400n), data(true, "20"));
    // 60 % known of A, and at most 20 % of 2 400 µg of B: 0,048 % of the product, 12 % of its ceiling.
    expect(bounded.combinedChecks[0].knownShare.eq(pct("60"))).toBe(true);
    expect(bounded.combinedChecks[0].worstShare.eq(pct("72"))).toBe(true);
    expect(bounded.combinedChecks[0].verdict).toBe("bounded");
    expect(bounded.asIs).toBe("yes");
    const unknown = checkIfra(bottle(12_000n, 24_000n), data(true, "50"));
    expect(unknown.combinedChecks[0].verdict).toBe("unknown");
    expect(unknown.asIs).toBe("unknown");
  });

  it("(d) one oil alone: the group says what its ceiling says", () => {
    const report = checkIfra(bottle(12_000n, 0n), data());
    const group = report.combinedChecks[0];
    expect(group.worstShare.eq(pct("60"))).toBe(true);
    expect(group.verdict).toBe(report.checks[0].verdict);
    expect(group.maxUse.eq(report.checks[0].maxUse)).toBe(true);
  });

  it("(e) with no group, no report changes: the substances are judged alone, as always", () => {
    const report = checkIfra(bottle(12_000n, 2_400n), data(false));
    expect(report.combinedChecks).toEqual([]);
    expect(report.readings[0].combined).toEqual([]);
    expect(report.asIs).toBe("yes");
  });

  describe("(f) the margin of a pour counts the group", () => {
    const pourB = { material: oilB, fraction: Ratio.ONE, diluent: null };
    const room = (formula: Formula, ifra: IfraData, base: "now" | "bottle" | "completed") => {
      const margin = marginOf(formula, ifra, pourB, base);
      expect(margin.kind).toBe("bounded");
      return margin.kind === "bounded" ? margin.pouredUg : Ratio.ZERO;
    };
    // Oil A is already in the bottle at 60 % of its ceiling.
    it("now: the final batch of 10 g leaves 16 mg of B with A in the bottle, against 40 mg alone", () => {
      const header2 = { ...header, finalBatchUg: 10_000_000n };
      const formula: Formula = { header: header2, history: [add("a", oilA, 120_000n)] };
      expect(room(formula, data(), "now").eq(Ratio.of(16_000))).toBe(true);
      expect(room(formula, data(false), "now").eq(Ratio.of(40_000))).toBe(true);
    });
    it("bottle: 400 000 / 249 µg with A in the bottle, against 1 000 000 / 249 alone", () => {
      const formula: Formula = { header, history: [add("a", oilA, 12_000n), add("n", neutral, 988_000n)] };
      expect(room(formula, data(), "bottle").eq(Ratio.of(400_000n, 249n))).toBe(true);
      expect(room(formula, data(false), "bottle").eq(Ratio.of(1_000_000n, 249n))).toBe(true);
    });
    it("completed: 117 500 / 3 µg with A in the bottle, against 125 000 / 3 alone", () => {
      const header3 = { ...header, workBatchUg: 1_000_000n, finalBatchUg: 10_000_000n };
      const formula: Formula = { header: header3, history: [add("a", oilA, 12_000n), add("n", neutral, 988_000n)] };
      expect(room(formula, data(), "completed").eq(Ratio.of(117_500n, 3n))).toBe(true);
      expect(room(formula, data(false), "completed").eq(Ratio.of(125_000n, 3n))).toBe(true);
    });
  });
});

describe("IFRA: a condition that is assumed, not proven", () => {
  const cade: Material = { key: "t:cade", kind: "base", name: "Cade" };
  const text = "una variante está prohibida (STD 119); la rectificada cumple la especificación (STD 119): supuesta, no acreditada (consenso)";
  const data = (assumed: boolean): IfraData => ({
    substances: new Map(),
    materials: new Map([[cade.key, { status: "checked", substances: [], conditions: [text, "especificación (STD 1)"], ...(assumed ? { assumed: [text] } : {}) }]]),
  });
  const formula: Formula = { header, history: [add("c", cade, 1n * G)] };

  it("(d) the report says which conditions are assumed, and does not block nor leave the report partial", () => {
    const report = checkIfra(formula, data(true));
    expect(report.conditions).toEqual([
      { material: "Cade", text, assumed: true },
      { material: "Cade", text: "especificación (STD 1)" },
    ]);
    expect(report.partial).toBe(false);
    expect(report.asIs).toBe("yes");
    // Marked or not, the verdicts are the same.
    const plain = checkIfra(formula, data(false));
    expect(plain.asIs).toBe(report.asIs);
    expect(plain.partial).toBe(report.partial);
    expect(plain.conditions.every((c) => c.assumed === undefined)).toBe(true);
  });
});
