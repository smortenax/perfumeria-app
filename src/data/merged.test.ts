import { describe, expect, it } from "vitest";
import { v2Dataset } from "../v2/data";
import { mergedRepository, mergeIfra } from "./merged";
import { repositoryFor, reviewedV2 } from "./repositories";

const data = v2Dataset();
const v1 = repositoryFor("v1");
const v2 = reviewedV2();
const merged = mergedRepository(v1, v2, data);

describe("the v1 and the v2 in one repository", () => {
  it("offers every material of the v2, and of the v1 only what the v2 does not have, marked as unreviewed", () => {
    const keys = merged.entries.map((e) => e.material.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(v2.entries.every((e) => keys.includes(e.material.key))).toBe(true);
    const linked = new Set(data.v1Links.map((l) => l.v1Id));
    expect(merged.entries.some((e) => linked.has(e.material.key))).toBe(false);
    const onlyV1 = merged.entries.filter((e) => e.unreviewed);
    expect(onlyV1.length).toBeGreaterThan(3000);
    expect(onlyV1.every((e) => e.material.key.includes(":") && !e.material.key.startsWith("v2:") && e.group !== "diluent")).toBe(true);
  });

  it("a row of the v1 that the v2 has still resolves by its key, for a formula that has not migrated", () => {
    expect(merged.get("fig:2480")?.material.name).toBeDefined();
    expect(merged.get("fig:2480")?.unreviewed).toBeUndefined();
    expect(merged.get("v2:P00062")?.material.name).toBe("Black Pepper Absolute");
  });

  it("its IFRA carries both: a material only of the v1 is checked as before, one of the v2 as the v2", () => {
    const data2 = merged.ifraData();
    expect(data2.materials.get("fig:1197")?.status).toBe("checked");
    expect(data2.materials.get("v2:P00062")?.status).toBe("checked");
    expect(data2.materials.size).toBe(v1.ifraData().materials.size + v2.ifraData().materials.size - [...v2.ifraData().materials.keys()].filter((k) => v1.ifraData().materials.has(k)).length);
  });

  it("a standard that both models know is the same in both, so that a substance carried by two materials is one for the sum", () => {
    const a = v1.ifraData().substances;
    const b = v2.ifraData().substances;
    for (const [key, s] of b) {
      const other = a.get(key);
      if (other && !s.supplier) {
        expect([key, other.limit.toString(), other.name]).toEqual([key, s.limit.toString(), s.name]);
      }
    }
    expect(mergeIfra(v1.ifraData(), v2.ifraData()).substances.size).toBeGreaterThanOrEqual(Math.max(a.size, b.size));
  });
});

describe("a phototoxic oil of the v1 enters the group of STD 089 by one route (D10)", () => {
  const ifra = merged.ifraData();
  const ownStandards = (keys: readonly string[]) => keys.filter((k) => /^std:IFRA_STD_(086|087|088|090|091|092|093|096)$/.test(k));

  it("every oil standard sums in the group, whichever model built it, and so does the 5-MOP", () => {
    for (const [key, s] of ifra.substances) {
      if (/^std:IFRA_STD_(086|087|088|090|091|092|093|096|089)$/.test(key)) {
        expect(s.combined, key).toBe("furocumarinas");
      }
    }
  });

  it("no material carries both its own standard and a listed 5-MOP: never two ways in", () => {
    for (const [key, m] of ifra.materials) {
      const keys = m.substances.map((s) => s.key);
      expect(ownStandards(keys).length > 0 && keys.includes("std:IFRA_STD_089"), key).toBe(false);
    }
  });

  it("the v1 bergamot is in the group once, by its identity", () => {
    const keys = ifra.materials.get("fig:1197")!.substances.map((s) => s.key);
    expect(keys.filter((k) => k === "std:IFRA_STD_087")).toHaveLength(1);
    expect(keys).not.toContain("std:IFRA_STD_089");
  });

  it("a material of the v1 that did list its 5-MOP would count by it alone", () => {
    const v1Data = v1.ifraData();
    const sample = { ...v1Data.materials.get("fig:1197")!, substances: [...v1Data.materials.get("fig:1197")!.substances, { key: "std:IFRA_STD_089", fraction: null }] };
    const both = mergeIfra({ substances: v1Data.substances, materials: new Map([["fig:1197", sample]]) }, { substances: new Map(), materials: new Map() });
    expect(both.materials.get("fig:1197")!.substances.map((s) => s.key)).not.toContain("std:IFRA_STD_087");
    expect(both.materials.get("fig:1197")!.substances.map((s) => s.key)).toContain("std:IFRA_STD_089");
  });
});
