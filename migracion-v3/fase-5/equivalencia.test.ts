import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyze, VERSIONS } from "./analizar";
import { type Canon, compare, conditionToken, pendingToken } from "./comparar";
import { explain, REASONS } from "./explicar";
import { countsOf, csvOf, reportOf } from "./informe";

/**
 * Phase 5, step 5.1 (plan v3; V3-34): for each of the user's 111 lab materials, the IFRA that the v3 computes (the
 * common material and the user's version) against the one the v2 computed for its pair. It writes
 * `informe.md` and `diferencias.csv` next to this file. Every difference is listed with its reason, or as
 * «sin explicar»: this test never fixes a difference and does not fail because of one.
 *
 *   npx vitest run --config migracion-v3/fase-5/vitest.config.ts
 */
const FOLDER = import.meta.dirname;

describe("the engine's IFRA of the v3 against the v2's, for each of the user's materials", () => {
  it("writes the report and the list of differences", async () => {
    const a = await analyze();
    const names = a.standardNames;
    const report = reportOf(a, names);
    const csv = csvOf(a, names);
    // The same bytes when run again in the same process; the files are only written from the first.
    const again = await analyze();
    expect(reportOf(again, again.standardNames)).toBe(report);
    expect(csvOf(again, again.standardNames)).toBe(csv);
    writeFileSync(join(FOLDER, "informe.md"), report, "utf8");
    writeFileSync(join(FOLDER, "diferencias.csv"), csv, "utf8");

    const c = countsOf(a);
    expect(a.results).toHaveLength(111);
    expect(c.paired + c.unpaired).toBe(111);
    for (const v of VERSIONS) {
      expect(c.status[v].igual + c.status[v].esperada + c.status[v]["sin-explicar"]).toBe(c.paired);
    }
    // Every difference has a reason that is written down; none is dropped by the reading.
    for (const r of a.results) {
      for (const v of VERSIONS) {
        for (const d of [...(r.diffs[v] ?? []), ...(r.cardDiffs[v] ? [r.cardDiffs[v]!] : [])]) expect(REASONS[d.reason], `${r.pair.labId} ${d.what}`).toBeDefined();
      }
    }
  });
});

describe("the reading that makes both adapters comparable", () => {
  const canon = (extra: Partial<Canon> = {}): Canon => ({
    status: "checked",
    entries: new Map([["std:IFRA_STD_023", { fraction: "1/100", upper: null, limit: "1/200", combined: null }]]),
    conditions: new Set<string>(),
    assumed: new Set<string>(),
    pending: new Set<string>(),
    ...extra,
  });

  it("equal readings have no difference, and any change in a figure, a bound or a note shows", () => {
    expect(compare(canon(), canon())).toEqual([]);
    const other = new Map([["std:IFRA_STD_023", { fraction: null, upper: "1/100", limit: "1/200", combined: null }]]);
    expect(compare(canon(), canon({ entries: other }))).toEqual([{ where: "sustancia", what: "std:IFRA_STD_023", v2: "1/100", v3: "≤ 1/100" }]);
    expect(compare(canon(), canon({ pending: new Set(["sin-datos"]) }))).toEqual([{ where: "pendiente", what: "sin-datos", v2: "—", v3: "sí" }]);
    expect(compare(canon(), canon({ status: "unchecked" }))[0]).toMatchObject({ where: "estado" });
  });

  it("the v2's and the v3's words for the same note give the same token", () => {
    expect(pendingToken("Linalool: su especificación no está acreditada (STD 187).")).toBe("espec:IFRA_STD_187");
    expect(pendingToken("Linalool: Oxidation products…: no está acreditado (IFRA_STD_187).")).toBe("espec:IFRA_STD_187");
    expect(pendingToken("Aceite: IFRA prohíbe el crudo y solo permite el rectificado, y no está acreditado que este material lo sea (STD 119).")).toBe("espec:IFRA_STD_119");
    expect(pendingToken("Isoforona: prohibido como tal; lo que trae este material no tiene techo en los datos (STD 154).")).toBe("prohibido-sin-techo:IFRA_STD_154");
    expect(pendingToken("Isoforona: prohibido como tal; lo que trae este material no tiene techo en los datos (IFRA_STD_154).")).toBe("prohibido-sin-techo:IFRA_STD_154");
    expect(pendingToken("Aceite: …: no está acreditado (IFRA_STD_097 · variante).")).toBe("variante:IFRA_STD_097");
    expect(pendingToken("Sin datos de sus constituyentes: puede llevar sustancias con techo.")).toBe("sin-datos");
    expect(pendingToken("algo que ningún adaptador dice")).toBe("otro:algo que ningún adaptador dice");
    expect(conditionToken("especificación (STD 067)", false)).toBe("cond-probada:IFRA_STD_067");
    expect(conditionToken("Limit content (IFRA_STD_119): supuesta, no acreditada", true)).toBe("cond-supuesta:IFRA_STD_119");
    expect(conditionToken("una variante está prohibida (STD 078)", false)).toBe("nota-variante:IFRA_STD_078");
  });
});

describe("the reasons that none of the user's materials needs still work", () => {
  // A pair made by hand, so that V3-23, V3-27, V3-28 and V3-30 are shown to recognise their cases: zero hits in the real data is not a detector that cannot fire.
  const standard = (code: string, extra: Record<string, unknown> = {}) => ({ code, name: code, substances: [{ cas: "1-1-1", subgroup: null, synonyms: [] }], variantRules: [], limitExpressedAs: null, limitExpressedAsCas: null, prohibitedAsSuch: false, ...extra });
  const layer = {
    standards: new Map([
      ["IFRA_STD_001", standard("IFRA_STD_001")],
      ["IFRA_STD_154", standard("IFRA_STD_154", { prohibitedAsSuch: true })],
      ["IFRA_STD_089", standard("IFRA_STD_089", { limitExpressedAs: "5-MOP", limitExpressedAsCas: "484-20-8" })],
    ]),
    byCas: new Map(),
    annex: [],
  };
  const context = (annex: object, v2Annex: Array<{ note: string }>) =>
    ({
      pair: {}, v2Material: { type: "natural", origin: "", name: "x" }, v3: { kind: "natural", species: null, process: null }, cas: ["1-1-1"],
      annex, v2Annex, v2Standards: new Set<string>(), layer, hasV3Components: false,
    }) as never;
  const entry = { constituentStandard: "IFRA_STD_001" };
  const annex = (own: string | undefined, onlyEntry = false) => ({ entries: [entry], entryNames: ["A", "B"], candidates: own ? [own] : [], own, onlyEntry });
  const diff = (where: "sustancia" | "pendiente", what: string, v2: string, v3: string) => ({ where, what, v2, v3 });
  const reasonOf = (pairContext: never, d: ReturnType<typeof diff>) => explain({ pairContext, v3Canon: {} as never, stages: [], diffs: [d] })[0].reason;

  it("V3-23: the v2 took the most of the entries of its CAS and the v3 takes its own entry", () => {
    expect(reasonOf(context(annex("A"), [{ note: "el máximo de las 2 entradas del anexo para 1-1-1 (D14): A, B" }]), diff("sustancia", "std:IFRA_STD_001", "1/100", "1/200"))).toBe("V3-23");
  });
  it("V3-28: the v2 took the most of the entries of its CAS and the v3 has no entry of its own, so it borrows", () => {
    expect(reasonOf(context(annex(undefined), [{ note: "el máximo de las 2 entradas del anexo para 1-1-1 (D14): A, B" }]), diff("sustancia", "std:IFRA_STD_001", "1/100", "≤ 1/100"))).toBe("V3-28");
  });
  it("two entries answer to the material's names and the v3 takes another than the v2: unexplained", () => {
    expect(reasonOf(context(annex("B"), [{ note: "A (Latin name)" }]), diff("sustancia", "std:IFRA_STD_001", "1/100", "1/200"))).toBe("sin-explicar");
  });
  it("V3-30: a substance that IFRA prohibits as such and limits in the naturals", () => {
    expect(reasonOf(context(annex(undefined), []), diff("pendiente", "prohibido-sin-techo:IFRA_STD_154", "sí", "—"))).toBe("V3-30");
  });
  it("V3-27: a limit expressed as a constituent that the v3 carries as an unknown component", () => {
    const withCas = context(annex(undefined), []);
    expect(reasonOf(withCas, diff("pendiente", "limite-constituyente:IFRA_STD_089", "sí", "—"))).toBe("V3-27");
  });
});
