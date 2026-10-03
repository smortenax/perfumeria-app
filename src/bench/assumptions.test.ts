import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import type { Formula } from "../core/model/formula";
import { DILUENTS } from "../core/model/material";
import { repositoryFor } from "../data/repositories";
import { assumptionsOf, proposedWeighing } from "./assumptions";

const repository = repositoryFor("v2");
const entry = (name: string) => repository.entries.find((e) => e.material.name === name)!;
const pour = (name: string, percent: string): Formula => ({
  header: { name: "t", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
  history: [
    { kind: "add", id: "a1", material: entry(name).material, massUg: parseMass("0,100", "g"), fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)), diluent: DILUENTS.dpg },
  ],
});

describe("the bar follows D12 when a product says what it is weighed at", () => {
  it("a range goes with its maximum: the Aldambre, 25-50 % in DPG, at 50 %", () => {
    const w = entry("Aldambre").weighing!;
    expect(w).toMatchObject({ percent: "50", diluent: "dpg", range: ["25", "50"] });
    expect(w.why).toContain("el máximo");
  });

  it("a certificate of the product as it is bought is 100 % of that product: the pepper", () => {
    const w = entry("Black Pepper Absolute").weighing!;
    expect(w).toMatchObject({ percent: "100", diluent: "" });
    expect(w.why).toContain("100 % del producto");
    expect(w.source).toMatch(/^certificado D\d+/);
  });

  it("a diluted product of the shop takes the shop's figure, with its page as the source", () => {
    const w = entry("Geosmin 1% in DPG").weighing!;
    expect(w).toMatchObject({ percent: "1", diluent: "dpg" });
    expect(w.source).toBe("tienda: https://perfumiarz.com/products/geosmin-1-dpg");
  });

  it("a product without a row proposes nothing, and what the user chose last wins", () => {
    expect(entry("Hedione").weighing).toBeUndefined();
    expect(proposedWeighing(entry("Aldambre"), undefined, true)).toBeUndefined();
    expect(proposedWeighing(entry("Aldambre"), undefined, false)?.percent).toBe("50");
    expect(proposedWeighing(entry("Aldambre"), true, false)).toBeUndefined();
  });

  it("says what it assumed where the IFRA is read: a line at the proposed concentration, not at another", () => {
    const entryOf = (key: string) => repository.get(key);
    expect(assumptionsOf(pour("Aldambre", "50"), entryOf)).toEqual([{ material: "Aldambre", text: expect.stringContaining("pesado al 50 %: la tienda da 25–50 %") }]);
    expect(assumptionsOf(pour("Aldambre", "30"), entryOf)).toEqual([]);
    expect(assumptionsOf(pour("Hedione", "10"), entryOf)).toEqual([]);
  });

  it("every concentration row is of a product the v2 has, once each", () => {
    const rows = repository.entries.filter((e) => e.weighing).length;
    expect(rows).toBe(10);
  });
});
