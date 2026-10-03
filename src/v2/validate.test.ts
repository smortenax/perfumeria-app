import { describe, expect, it } from "vitest";
import { loadDataset } from "./load";
import type { Issue } from "./model";
import { isValidCas, validate } from "./validate";

// One folder per rule under fixtures/, each with a case that passes and one that fails.
// A fixture brings only the files it needs; the rest count as empty.
const files = import.meta.glob<string>("./fixtures/**/*.csv", { query: "?raw", import: "default", eager: true });

const refs = { ifraStandards: new Set(["IFRA_STD_005"]), v1Ids: new Set(["fig:1"]) };

function run(rule: string, kase: "pasa" | "falla"): Issue[] {
  const prefix = `./fixtures/${rule}/${kase}/`;
  const { dataset, issues } = loadDataset((file) => files[prefix + file] ?? null, { missingIsEmpty: true });
  return [...issues, ...validate(dataset, refs)];
}

const RULES: Array<[string, Issue["severity"]]> = [
  ["cas", "error"],
  ["ids", "error"],
  ["huerfanos", "error"],
  ["valores", "error"],
  ["suma", "error"],
  ["ciclos", "error"],
  ["naturales", "error"],
  ["procedencia", "error"],
  ["natural", "error"],
  ["coherencia", "error"],
  ["cobertura", "error"],
  ["v1", "error"],
  ["origen", "error"],
  ["origen-desconocido", "aviso"],
  ["condiciones", "error"],
  ["exclusiones", "error"],
  ["concentraciones", "error"],
  ["duplicado", "aviso"],
];

describe("v2 validator, one fixture per rule", () => {
  for (const [rule, severity] of RULES) {
    it(`${rule}: the passing case has no issues`, () => {
      expect(run(rule, "pasa")).toEqual([]);
    });
    it(`${rule}: the failing case reports it as ${severity}`, () => {
      const issues = run(rule, "falla");
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.every((i) => i.rule === rule && i.severity === severity)).toBe(true);
    });
  }
});

describe("origen-desconocido with a certificate (D7)", () => {
  // The warning is for a molecule of unknown origin that no product of its own certifies in full: a certificate with
  // coverage «reguladas-completa» already says what the impurities are, a partial one does not.
  it("does not warn when a product of the material has a reguladas-completa certificate", () => {
    expect(run("origen-desconocido-certificado", "pasa")).toEqual([]);
  });
  it("warns when its certificate covers only part", () => {
    const issues = run("origen-desconocido-certificado", "falla");
    expect(issues.map((i) => [i.rule, i.severity])).toEqual([["origen-desconocido", "aviso"]]);
  });
});

describe("the user's confirmation of a v1 link (D13)", () => {
  it("a provisional key is linked by his confirmation, with date and reason, to a product of that material", () => {
    expect(run("v1-confirmacion", "pasa")).toEqual([]);
  });
  it("without confirmation, or with a product of another material, it is an error", () => {
    const issues = run("v1-confirmacion", "falla");
    expect(issues.map((i) => [i.rule, i.severity]).every(([r, s]) => r === "v1" && s === "error")).toBe(true);
    expect(issues.length).toBe(2);
  });
});

describe("isValidCas", () => {
  it("checks the format and the check digit", () => {
    expect(isValidCas("78-70-6")).toBe(true);
    expect(isValidCas("89957-98-2")).toBe(true);
    expect(isValidCas("7732-18-5")).toBe(true);
    expect(isValidCas("78-70-7")).toBe(false);
    expect(isValidCas("78706")).toBe(false);
  });
});

describe("loadDataset", () => {
  it("reports a missing file and a wrong header", () => {
    const { issues } = loadDataset((file) => (file === "sustancias.csv" ? "id,nombre\n" : null));
    expect(issues.some((i) => i.file === "registro-ids.csv" && i.message.startsWith("Falta"))).toBe(true);
    expect(issues.some((i) => i.file === "sustancias.csv" && i.message.startsWith("Cabecera"))).toBe(true);
    expect(issues.every((i) => i.rule === "esquema")).toBe(true);
  });
});
