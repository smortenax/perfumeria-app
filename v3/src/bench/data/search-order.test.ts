import { describe, expect, it } from "vitest";
import type { Material } from "../../core/model/material";
import { type CatalogEntry, type CatalogGroup, fold, normalize, searchCatalog } from "./catalog";

const entry = (name: string, group: CatalogGroup, extra: Partial<CatalogEntry> = {}): CatalogEntry => ({
  material: { key: `k:${name}:${group}`, kind: "base", name } as Material,
  group,
  code: name.slice(0, 3).toUpperCase(),
  icon: name.slice(0, 3),
  chemicalName: "",
  cas: "",
  search: normalize(`${name} ${extra.chemicalName ?? ""}`),
  folded: [fold(name)],
  ...extra,
});

describe("the order of the search (F-04)", () => {
  it("puts the exact name first, whoever's it is", () => {
    const mine = entry("Coumarin accord", "own");
    const common = entry("Coumarin", "base");
    expect(searchCatalog([mine, common], "coumarin").map((e) => e.material.name)).toEqual(["Coumarin", "Coumarin accord"]);
  });

  it("puts a material with data before a namesake without it", () => {
    const empty = entry("Iso E Super", "own", { state: "sin-dato" });
    const common = entry("Iso E Super", "base", { state: "con-techo" });
    expect(searchCatalog([empty, common], "iso e super")).toEqual([common, empty]);
  });

  it("still puts yours first when the match is as good", () => {
    const mine = entry("Hedione", "own");
    const common = entry("Hedione", "base");
    expect(searchCatalog([common, mine], "hedione")).toEqual([mine, common]);
  });
});
