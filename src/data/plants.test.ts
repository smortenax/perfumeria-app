import { describe, expect, it } from "vitest";
import { formLabel, plantName, variantsOf } from "./plants";
import { catalog } from "./provisional";

describe("the forms of a natural, folded by plant in the search (P54)", () => {
  it("reads the variant of each name: what is left once the plant and the form are taken out", () => {
    const names = ["Lavender", "Lavender absolute", "Lavender oil", "Lavender oil (low coumarin)", "Lavender oil, rectified", "Lavender oil (Lavandula angustifolia, Lavandula officinalis)"];
    expect(variantsOf(names)).toEqual(["", "", "", "bajo en cumarina", "rectificado", ""]);
    expect(plantName(names, ["", "absolute", "oil", "oil", "oil", "oil"])).toBe("Lavender");
  });

  it("names a plant with no plain entry by the words all its names share", () => {
    // Lavandin's entries with no form are cultivars: the row is «Lavandin», not «Lavandin abrialis».
    expect(plantName(["Lavandin abrialis", "Lavandin grosso", "Lavandin oil"], ["", "", "oil"])).toBe("Lavandin");
    expect(plantName(["Lavandin oil", "Lavandin grosso absolute", "Lavandin abrialis oil"], ["oil", "absolute", "oil"])).toBe("Lavandin");
    expect(variantsOf(["Lavandin oil", "Lavandin grosso absolute", "Lavandin abrialis oil"])).toEqual(["", "grosso", "abrialis"]);
  });

  it("gives every natural of a shared CAS its plant and form in the catalog, and none to a lone one", () => {
    const lavender = catalog.entries.filter((e) => e.plant?.key === "plant:8000-28-0");
    expect(lavender.map((e) => e.plant?.form).sort()).toEqual(["", "absolute", "concrete", "extract", "oil", "oil", "oil", "oil", "oil"].sort());
    expect(new Set(lavender.map((e) => e.plant?.name))).toEqual(new Set(["Lavender"]));
    // Spike lavender is another species, with its own CAS: a row of its own.
    expect(catalog.entries.find((e) => e.cas === "8016-78-2")?.plant).toBeUndefined();
    // A molecule never has a plant.
    expect(catalog.entries.find((e) => e.cas === "91-64-5")?.plant).toBeUndefined();
    expect(formLabel("absolute")).toBe("absoluto");
  });
});
