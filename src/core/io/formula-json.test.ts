import { describe, expect, it } from "vitest";
import { Ratio } from "../arith/ratio";
import { compose, vectorOf } from "../compose";
import { f001 } from "../fixtures/f001";
import type { Formula } from "../model/formula";
import type { Material } from "../model/material";
import { formulaFromJson, formulaToJson } from "./formula-json";

const sameComposition = (a: Formula, b: Formula) => {
  const ca = compose(a);
  const cb = compose(b);
  expect(cb.totalUg.eq(ca.totalUg)).toBe(true);
  expect(cb.parts.map((p) => `${p.material.key} ${p.massUg}`)).toEqual(ca.parts.map((p) => `${p.material.key} ${p.massUg}`));
};

describe("formula JSON", () => {
  it("saves F-001 and reads it back with nothing lost", () => {
    const original = f001();
    const text = formulaToJson(original);
    const read = formulaFromJson(text);
    expect(read.history).toHaveLength(original.history.length);
    sameComposition(original, read);
    expect(formulaToJson(read)).toBe(text);
  });

  it("keeps the CAS of each material and the IFRA amendment it was checked with, to find them again if the glossary changes", () => {
    const hedione: Material = { key: "fig:1234", kind: "base", name: "Hedione", cas: "24851-98-7" };
    const formula: Formula = {
      header: { name: "prueba", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
      history: [{ kind: "add", id: "h", material: hedione, massUg: 1_000n, fraction: Ratio.ONE, diluent: null }],
    };
    const text = formulaToJson(formula, { ifraAmendment: "51" });
    const doc = JSON.parse(text);
    expect(doc.ifra).toEqual({ amendment: "51", category: "4" });
    expect(doc.materials["fig:1234"]).toEqual({ kind: "base", name: "Hedione", cas: "24851-98-7" });
    const read = formulaFromJson(text);
    expect(read.history[0].kind === "add" && read.history[0].material.cas).toBe("24851-98-7");
    // Without the amendment, the file is as before.
    expect(JSON.parse(formulaToJson(formula)).ifra).toBeUndefined();
  });

  it("writes one change per line, so Git sees each change", () => {
    const text = formulaToJson(f001());
    const lines = text.split("\n");
    const start = lines.indexOf('  "history": [');
    const end = lines.indexOf("  ],", start);
    expect(end - start - 1).toBe(f001().history.length);
    expect(lines[start + 2]).toContain('"material":"lab:MAT-hedione"');
  });

  it("carries a readable composition for anyone without the app", () => {
    const doc = JSON.parse(formulaToJson(f001()));
    const hedione = doc.composition.find((entry: { key: string }) => entry.key === "lab:MAT-hedione");
    expect(hedione).toEqual({ material: "Hedione", key: "lab:MAT-hedione", massUg: "619000", ofBottle: "7,078 %" });
    // Largest first: the alcohol, then the DPG carried by the dilutions.
    expect(doc.composition.slice(0, 2).map((entry: { material: string }) => entry.material)).toEqual(["Alcohol", "DPG"]);
  });

  it("keeps every variable: container, tare, batches, notes, edits and reweighing", () => {
    const a: Material = { key: "cas:A", kind: "base", name: "A" };
    const own: Material = { key: "own:tintura-1", kind: "own", name: "Mi tintura" };
    const formula: Formula = {
      header: {
        name: "Prueba",
        intention: "Todo lo que guarda",
        container: { capacityMl: Ratio.of(10), tareUg: 12_345_678n },
        workBatchUg: 10_000_000n,
        finalBatchUg: 40_000_000n,
      },
      history: [
        { kind: "add", id: "1", material: a, massUg: 3_000_000n, fraction: Ratio.ONE, diluent: null },
        { kind: "add", id: "2", material: own, massUg: 1_000_000n, fraction: Ratio.of(1, 10), diluent: a },
        { kind: "note", id: "3", text: "evaluar mañana" },
        { kind: "set-mass", id: "4", target: "1", massUg: 2_000_000n },
        { kind: "reweigh", id: "5", grossUg: 12_345_678n + 2_500_000n, tareUg: 12_345_678n },
        { kind: "remove", id: "6", target: "2" },
      ],
    };
    const read = formulaFromJson(formulaToJson(formula));
    expect(read.header).toEqual(formula.header);
    expect(read.history.map((c) => c.kind)).toEqual(["add", "add", "note", "set-mass", "reweigh", "remove"]);
    sameComposition(formula, read);
  });

  it("carries a formula used as a material with its vector, and checks its ID on reading", () => {
    const b: Material = { key: "cas:B", kind: "base", name: "B" };
    const quick: Material = { key: "prov:x", kind: "provisional", name: "Algo verde" };
    const inner: Formula = {
      header: { name: "Acorde", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
      history: [
        { kind: "add", id: "i1", material: b, massUg: 1_000_000n, fraction: Ratio.ONE, diluent: null },
        { kind: "add", id: "i2", material: quick, massUg: 2_000_000n, fraction: Ratio.ONE, diluent: null },
      ],
    };
    const vector = vectorOf(inner);
    const accord: Material = { key: vector.id, kind: "formula", name: "Acorde", vector };
    const outer: Formula = {
      header: { ...inner.header, name: "Con acorde" },
      history: [{ kind: "add", id: "o1", material: accord, massUg: 300_000n, fraction: Ratio.ONE, diluent: null }],
    };
    const text = formulaToJson(outer);
    const read = formulaFromJson(text);
    sameComposition(outer, read);
    // The provisional material travels with its definition, so it resolves anywhere.
    expect(JSON.parse(text).materials["prov:x"]).toEqual({ kind: "provisional", name: "Algo verde" });
    // A proportion changed by hand no longer matches the ID: reading refuses it.
    const tampered = text.replace('["cas:B","1/3"]', '["cas:B","1/4"]');
    expect(tampered).not.toBe(text);
    expect(() => formulaFromJson(tampered)).toThrow(/vector ID/);
  });

  it("refuses a file of another format", () => {
    expect(() => formulaFromJson('{"format":"otra-cosa/1"}')).toThrow(/format/);
  });
});
