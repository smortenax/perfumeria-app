import { describe, expect, it } from "vitest";
import { v2Dataset } from "../v2/data";
import { mergedRepository, mergeIfra } from "./merged";
import { repositoryFor } from "./repositories";

const data = v2Dataset();
const v1 = repositoryFor("v1");
const v2 = repositoryFor("v2");
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
