import { describe, expect, it } from "vitest";
import { fold, normalize, searchCatalog, type CatalogEntry } from "./catalog";

/** A base entry as the glossary gives it, with its trade name over the chemical one (P38). */
function entry(code: string, chemicalName: string, cas: string, tradeName?: string, tradeCode?: string): CatalogEntry {
  const names = [tradeName, chemicalName].filter((n): n is string => n !== undefined);
  return {
    material: { key: `fig:${code}`, kind: "base", name: tradeName ?? chemicalName },
    group: "base",
    code,
    chemicalName,
    ...(tradeName ? { tradeName } : {}),
    ...(tradeCode ? { tradeCode } : {}),
    cas,
    search: normalize(`${code} ${tradeName ?? ""} ${tradeCode ?? ""} ${chemicalName} ${cas}`),
    folded: names.map(fold),
  };
}

const entries = [
  entry("BQ", "6-sec-Butylquinoline", "65442-31-1", "Isobutyl quinoline", "IBQ"),
  entry("MD8", "Methyl dihydrojasmonate", "24851-98-7", "Hedione"),
  entry("Cu", "Coumarin", "91-64-5"),
  entry("Qu", "Quinoline", "91-22-5"),
];

describe("the search, with trade names over chemical ones (P38)", () => {
  it("folds the spellings that English and Spanish write differently", () => {
    expect(fold("Isobutyl quinoline")).toBe("isobutilquinoline");
    expect(fold("Phenylethyl alcohol")).toBe(fold("fenilethil alcohol"));
  });

  it("finds a material by its trade name, its trade abbreviation and its chemical name", () => {
    expect(searchCatalog(entries, "hedione")[0].cas).toBe("24851-98-7");
    expect(searchCatalog(entries, "methyl dihydrojasmonate")[0].cas).toBe("24851-98-7");
    expect(searchCatalog(entries, "IBQ")[0].cas).toBe("65442-31-1");
    expect(searchCatalog(entries, "sec-butylquinoline")[0].cas).toBe("65442-31-1");
  });

  it("finds it as a Spanish speaker writes it, after what matches exactly", () => {
    expect(searchCatalog(entries, "isobutilquinoleina")[0].cas).toBe("65442-31-1");
    expect(searchCatalog(entries, "cumarina")[0].cas).toBe("91-64-5");
    // Both match as typed: the name that starts so comes first.
    expect(searchCatalog(entries, "quinoline").map((e) => e.cas)).toEqual(["91-22-5", "65442-31-1"]);
  });

  it("does not stretch a short query into anything", () => {
    expect(searchCatalog(entries, "zzz")).toEqual([]);
  });
});
