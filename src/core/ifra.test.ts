import { describe, expect, it } from "vitest";
import { Ratio } from "./arith/ratio";
import { formatPercent } from "./display";
import { f001 } from "./fixtures/f001";
import { COUMARIN, f001Ifra } from "./fixtures/ifra-f001";
import { checkIfra, type IfraData } from "./ifra";
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
