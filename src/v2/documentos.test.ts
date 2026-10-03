import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { v2Dataset } from "./data";
import { flatten } from "./to-ifra";

// The documents of another supplier that the lots 3a and 3b discarded were reopened with the D9: the
// lists of the amylcinnamaldehyde and of the Safraleine are of the same material (placeholders); the
// ones of the Polysantol and of the Sandalmysore Core are of other materials (errores-v1.md).
const data = v2Dataset();
const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100));
const productNamed = (name: string) => data.products.find((p) => p.name === name)!;
const substanceOf = (cas: string) => data.casAliases.find((a) => a.cas === cas)!.substanceId;

describe("the documents of another supplier, reopened with the D9", () => {
  it("the Kalpsutra list is the amylcinnamaldehyde's: four maxima as placeholders, the molecule still pure by convention", () => {
    const f = flatten(data, productNamed("Aldehído alfa-amil cinámico").id);
    expect(f.pureByConvention).toBe(true);
    expect(f.pending).toEqual([]);
    for (const [cas, max] of [["100-52-7", "0.05"], ["100-51-6", "0.2"], ["101-86-0", "0.5"], ["101-85-9", "0.5"]] as const) {
      const load = f.loads.get(substanceOf(cas));
      // A placeholder is never known (D2): its maximum is the most it can be.
      expect(load?.known, cas).toBeNull();
      expect(load?.upper.eq(pct(max)), cas).toBe(true);
    }
  });

  it("the Safraleine list: only the benzyl alcohol, at most 0,007 %", () => {
    const f = flatten(data, productNamed("Safraleine").id);
    expect(f.pureByConvention).toBe(true);
    expect([...f.loads.values()].filter((l) => l.known === null)).toHaveLength(1);
    expect(f.loads.get(substanceOf("100-51-6"))?.upper.eq(pct("0.007"))).toBe(true);
  });

  it("the lists of the Polysantol and the Sandalmysore Core are of other materials: nothing of them comes in", () => {
    for (const name of ["Polysantol", "Sandalmysore Core"]) {
      const material = data.materials.find((m) => m.id === productNamed(name).materialId)!;
      expect(data.composition.filter((c) => c.containerId === material.id), name).toEqual([]);
    }
  });

  it("every placeholder row has a reviewed document and the authority of the literature", () => {
    const rows = data.composition.filter((c) => c.authority === "literatura");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(data.documents.find((d) => d.id === row.documentId)?.reviewStatus).toBe("revisado");
      expect(row.containerId.startsWith("M")).toBe(true);
    }
  });
});
