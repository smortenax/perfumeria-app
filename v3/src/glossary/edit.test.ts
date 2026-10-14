import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { type CatalogMaterial, type MaterialFields, NO_EVOLUTION, NO_PHYSICAL } from "../db/catalog";
import { changesOf, EDIT_SECTIONS, formOf, FormError, numberOf } from "./edit";

/**
 * Plan v3, step 6.3: the editor's form of one of your materials, read back into its record. A
 * number is exact, an empty field is unknown, and what cannot be read says so in Spanish.
 */

const FIELDS: MaterialFields = {
  solvent: false, aliases: [], cas: null, otherCas: [], species: null, part: null, process: null, chemotype: null, inci: null,
  origin: null, abbreviation: null, abbreviationOrigin: null, categoryId: null, form: null, basedOnId: null, grade: null, supplier: null,
  product: null, productUrl: null, purity: null, house: null, code: null, odorTarget: null, synthesis: null, isomers: null, family: null,
  color: null, familyDetail: null, facets: null, tier: null, tenacityHours: null, tenacitySource: null, evolution: NO_EVOLUTION,
  strength: null, threshold: null, diffusion: null, blendEffect: null, role: null, recommendedDilution: null, cost: null, handling: null,
  physical: NO_PHYSICAL, notes: null, sources: null, confidence: null, disputedFields: [], ifraUnverified: null,
};
const mine: CatalogMaterial = {
  ...FIELDS, id: "m", ownerId: "me", name: "Mi base", kind: "composition", components: [], regulations: [], doses: [], descriptors: [],
  relations: [], references: [], aliases: ["MB"], purity: Ratio.of(49n, 50n), abbreviation: "MBa", abbreviationOrigin: "generated",
  physical: { ...NO_PHYSICAL, density: Ratio.fromDecimal("0.935") },
};

describe("the editor's form (6.3)", () => {
  it("shows the record as text: a list one per line, a purity in %, a number with a comma", () => {
    const form = formOf(mine);
    expect(form.aliases).toBe("MB");
    expect(form.purity).toBe("98");
    expect(form["physical.density"]).toBe("0,935");
    expect(form.family).toBe("");
  });

  it("reads it back the same, exact, and an untouched form changes nothing", () => {
    const changes = changesOf(formOf(mine), mine);
    expect(changes.name).toBe("Mi base");
    expect(changes.aliases).toEqual(["MB"]);
    expect(changes.purity!.eq(Ratio.of(49n, 50n))).toBe(true);
    expect(changes.physical!.density!.eq(Ratio.fromDecimal("0.935"))).toBe(true);
    expect(changes.family).toBeNull();
    expect(changes.abbreviationOrigin).toBe("generated");
    expect(changes.evolution).toEqual([null, null, null, null, null]);
  });

  it("an empty field is unknown, never zero (§1.2); an abbreviation you type is yours (V3-37)", () => {
    const changes = changesOf({ ...formOf(mine), purity: "", "physical.density": " ", abbreviation: "MyB", "evolution.1": "2" }, mine);
    expect(changes.purity).toBeNull();
    expect(changes.physical!.density).toBeNull();
    expect(changes.abbreviationOrigin).toBe("user");
    expect(changes.evolution).toEqual([null, 2, null, null, null]);
  });

  it("what cannot be read is refused, in Spanish", () => {
    expect(() => changesOf({ ...formOf(mine), name: "  " }, mine)).toThrow(FormError);
    expect(() => changesOf({ ...formOf(mine), cas: "91645" }, mine)).toThrow("no es un CAS");
    expect(() => changesOf({ ...formOf(mine), otherCas: "91-64-5\nfoo" }, mine)).toThrow("«foo» no es un CAS");
    expect(() => changesOf({ ...formOf(mine), tenacityHours: "mucho" }, mine)).toThrow("«mucho» no es un número");
    expect(() => changesOf({ ...formOf(mine), color: "red" }, mine)).toThrow("no es un color");
    expect(numberOf("1,5")!.eq(Ratio.fromDecimal("1.5"))).toBe(true);
  });

  it("every field of the record the sheet shows can be edited, once", () => {
    const keys = EDIT_SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("physical.vaporPressure");
    expect(keys).toContain("tenacitySource");
  });
});
