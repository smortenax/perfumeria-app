import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { buildIfraLayer, type IfraRows } from "./ifra-layer";

/**
 * Plan v3, step 4.2 (V3-35): IFRA's layer from its rows, as the copy keeps them (exact numbers
 * as text, lists as lists): each standard with its limits by category, the CAS it regulates and
 * its rules; which standards regulate each CAS; and the annex, exact.
 */

const stamps = { createdAt: null, updatedAt: null };
const standard = (id: string, code: string, extra: Partial<IfraRows["standards"][number]> = {}): IfraRows["standards"][number] => ({
  id, code, name: code, amendment: "51", type: "RESTRICTION", prohibition: false, restriction: true, specification: false,
  prohibitedAsSuch: false, groupKey: code, limitExpressedAs: null, limitExpressedAsCas: null, prohibitionNote: null,
  restrictionNote: null, specificationNote: null, limitNote: null, phototoxicityNote: null, property: null, scopeNote: null,
  contributions: null, contributionsNote: null, ...stamps, ...extra,
});

const rows: IfraRows = {
  standards: [
    standard("s154", "IFRA_STD_154", { prohibition: true, prohibitedAsSuch: true, prohibitionNote: "as such should not be used" }),
    standard("s097", "IFRA_STD_097", { prohibition: true, specification: true }),
    standard("s089", "IFRA_STD_089", { groupKey: "furocumarinas", limitExpressedAs: "5-MOP", limitExpressedAsCas: "484-20-8" }),
  ],
  limits: [
    { id: "l1", standardId: "s154", category: "4", kind: "max", maxValue: "0.000013", ...stamps },
    { id: "l2", standardId: "s154", category: "1", kind: "prohibited", maxValue: null, ...stamps },
    { id: "l3", standardId: "s089", category: "4", kind: "max", maxValue: "0.00015", ...stamps },
  ],
  substances: [
    { id: "x1", standardId: "s154", cas: "78-59-1", subgroup: null, synonyms: ["Isoforona"], ...stamps },
    { id: "x2", standardId: "s097", cas: "8016-84-0", subgroup: "Prohibition of Tagetes erecta", synonyms: [], ...stamps },
    { id: "x3", standardId: "s089", cas: "8016-84-0", subgroup: null, synonyms: [], ...stamps },
  ],
  annex: [
    {
      id: "a1", amendment: "51", naturalCas: "8016-26-0", naturalOtherCas: ["89997-74-0"], naturalName: "Cistus oil", botanicalName: "Cistus ladaniferus",
      isoCategory: null, rifmId: null, constituentCas: "78-59-1", constituentName: "Isophorone", concentration: "0.0001",
      constituentStandard: "IFRA_STD_154", notice: null, ...stamps,
    },
  ],
  variantRules: [{ id: "r1", standardId: "s097", field: "species", match: "contains", pattern: "erecta", variant: "prohibited", ...stamps }],
  specExclusions: [],
};

describe("IFRA's layer from its rows (V3-35)", () => {
  const layer = buildIfraLayer(rows);

  it("each standard keeps its limits by category, exact, and its prohibitions", () => {
    const isophorone = layer.standards.get("IFRA_STD_154")!;
    expect(isophorone.limits.get("4")).toEqual({ kind: "max", maxValue: Ratio.fromDecimal("0.000013") });
    expect(isophorone.limits.get("1")).toEqual({ kind: "prohibited", maxValue: null });
    expect(isophorone.prohibitedAsSuch).toBe(true);
  });

  it("a CAS knows its standards, even when there are several", () => {
    expect(layer.byCas.get("78-59-1")).toEqual(["IFRA_STD_154"]);
    expect(layer.byCas.get("8016-84-0")).toEqual(["IFRA_STD_097", "IFRA_STD_089"]);
  });

  it("the rules of V3-31 and the constituent of V3-27 travel with their standard", () => {
    expect(layer.standards.get("IFRA_STD_097")!.variantRules).toEqual([{ field: "species", match: "contains", pattern: "erecta", variant: "prohibited" }]);
    expect(layer.standards.get("IFRA_STD_089")).toMatchObject({ groupKey: "furocumarinas", limitExpressedAs: "5-MOP", limitExpressedAsCas: "484-20-8" });
  });

  it("the annex is exact, and keeps the natural's other CAS", () => {
    expect(layer.annex[0]).toMatchObject({ naturalCas: "8016-26-0", naturalOtherCas: ["89997-74-0"], concentration: Ratio.fromDecimal("0.0001") });
  });

  it("an empty copy is an empty layer: no standard, never an invented limit", () => {
    const empty = buildIfraLayer({ standards: [], limits: [], substances: [], annex: [], variantRules: [], specExclusions: [] });
    expect(empty.standards.size).toBe(0);
    expect(empty.byCas.size).toBe(0);
  });

  it("a ceiling without its figure is an error, not a zero", () => {
    expect(() => buildIfraLayer({ ...rows, limits: [{ id: "l9", standardId: "s154", category: "4", kind: "max", maxValue: null, ...stamps }] })).toThrow();
  });
});
