import { describe, expect, it } from "vitest";
import type { IfraMaterial } from "../core/ifra";
import { mergedRepository, mergeIfra } from "../data/merged";
import { repositoryFor, reviewedV2 } from "../data/repositories";
import { IFRA_FILES, v2Dataset } from "./data";
import { LazyMap, viewMap } from "./lazy";
import { v2RepositoryOf } from "./repository";
import { buildIfra, v2Key } from "./to-ifra";

/**
 * Phase 6: the IFRA of a material and its provenance are worked out the first time they are asked for and kept; the start-up
 * only reads the data and what the search needs. It is a change of when, not of what: the same answers as when everything was worked
 * out at start-up (checked once against the full output of both, and by every test of the v2).
 */
describe("LazyMap", () => {
  it("makes a value the first time it is asked for, once, and knows its keys without making them", () => {
    let calls = 0;
    const map = new LazyMap(["a", "b", "c"], (key) => ({ key, n: ++calls }));
    expect(map.size).toBe(3);
    expect(map.has("b")).toBe(true);
    expect(map.has("z")).toBe(false);
    expect(map.get("z")).toBeUndefined();
    expect(map.made).toBe(0);
    const b = map.get("b");
    expect(map.get("b")).toBe(b);
    expect(calls).toBe(1);
    expect([...map.keys()]).toEqual(["a", "b", "c"]);
    expect(calls).toBe(1);
    expect([...map.values()].map((v) => v.key)).toEqual(["a", "b", "c"]);
    expect(calls).toBe(3);
  });

  it("viewMap asks its sources each time it is asked", () => {
    const source = new Map([["a", 1]]);
    const view = viewMap<number>({ get: (k) => source.get(k), has: (k) => source.has(k), keys: () => source.keys() });
    expect(view.size).toBe(1);
    source.set("b", 2);
    expect(view.get("b")).toBe(2);
    expect(view.size).toBe(2);
    expect([...view]).toEqual([["a", 1], ["b", 2]]);
  });
});

describe("the IFRA and the provenance of the v2, on demand", () => {
  const data = v2Dataset();

  it("building the repository works out no material's IFRA, and a material is worked out once", () => {
    const built = buildIfra(data, IFRA_FILES);
    const materials = built.ifra.materials as LazyMap<IfraMaterial>;
    expect(materials.made).toBe(0);
    expect(materials.size).toBeGreaterThan(data.materials.length);
    const key = v2Key(data.materials[0]!.id);
    const first = materials.get(key);
    expect(first?.status).toBe("checked");
    expect(materials.get(key)).toBe(first);
    expect(materials.made).toBe(1);
    expect(built.details.get(key)).toBe(built.details.get(key));
  });

  it("the entries carry their IFRA card, their provenance and «pura por convención» as properties made when read, and kept", () => {
    const repository = v2RepositoryOf(data, IFRA_FILES, "x");
    const entry = repository.entries.find((e) => e.code === data.materials[data.materials.length - 1]!.id)!;
    for (const field of ["provenance", "state", "standardName", "ifraNote", "pureByConvention"]) {
      expect(typeof Object.getOwnPropertyDescriptor(entry, field)?.get, field).toBe("function");
    }
    expect((repository.ifraData().materials as LazyMap<IfraMaterial>).made).toBe(0);
    const provenance = entry.provenance;
    expect(provenance).toBeDefined();
    expect(entry.provenance).toBe(provenance);
    expect(Object.getOwnPropertyDescriptor(entry, "provenance")?.get).toBeUndefined();
  });

  it("the merged repository looks at both models when asked, and a material of the v1 answers with the same object each time", () => {
    const v1 = repositoryFor("v1");
    const merged = mergeIfra(v1.ifraData(), reviewedV2().ifraData());
    const some = [...v1.ifraData().materials.keys()][0]!;
    expect(merged.materials.get(some)).toBe(merged.materials.get(some));
    expect(merged.materials.has(some)).toBe(true);
    const keys = new Set([...v1.ifraData().materials.keys(), ...reviewedV2().ifraData().materials.keys()]);
    expect(merged.materials.size).toBe(keys.size);
    void mergedRepository;
  });
});
