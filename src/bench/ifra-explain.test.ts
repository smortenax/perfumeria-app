import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { checkIfra } from "../core/ifra";
import type { Change, Formula } from "../core/model/formula";
import { repositoryFor } from "../data/repositories";
import { groupRows, specificationKeys, splitPending, whyOf } from "./ifra-explain";

const repository = repositoryFor("v2");
const specifications = specificationKeys(repository.details, (key) => repository.get(key)?.material.name);
const material = (name: string) => {
  const e = repository.entries.find((x) => x.material.name === name);
  expect(e, name).toBeDefined();
  return e!.material;
};
/** A formula of pure materials: grams, with the final batch the sum so that a gram is a share of it. */
function formulaOf(...lines: ReadonlyArray<readonly [string, string]>): Formula {
  return {
    header: { name: "t", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
    history: lines.map(
      ([name, grams], i): Change => ({ kind: "add", id: `a${i}`, material: material(name), massUg: parseMass(grams, "g"), fraction: Ratio.ONE, diluent: null }),
    ),
  };
}
const report = (f: Formula) => checkIfra(f, repository.ifraData());

describe("explaining a «no se sabe»: by quantities and by specifications", () => {
  it("separates what is not known by quantity from the specifications to prove, as the adapter made them", () => {
    const r = report(formulaOf(["Linalol", "0,100"], ["Patchouli", "0,100"], ["Cedro Atlas", "0,100"]));
    const split = splitPending(r, specifications);
    expect(split.specifications.map((p) => p.material).sort()).toEqual(["Cedro Atlas", "Linalol"]);
    expect(split.quantities.map((p) => p.material)).toEqual(["Patchouli"]);
    expect(split.specifications.length + split.quantities.length).toBe(r.pending.length);
  });

  it("every pending of the v2 data is one kind or the other: nothing is lost", () => {
    const names = repository.entries.filter((e) => e.group === "base").map((e) => e.material.name);
    const f = formulaOf(...names.map((n) => [n, "0,001"] as const));
    const r = report(f);
    const split = splitPending(r, specifications);
    expect(split.quantities.length + split.specifications.length).toBe(r.pending.length);
    expect(split.specifications.length).toBeGreaterThan(0);
    expect(split.quantities.length).toBeGreaterThan(0);
  });

  it("the explanation of an unknown counts the three causes apart", () => {
    const r = report(formulaOf(["Linalol", "0,100"], ["Patchouli", "0,100"]));
    const why = whyOf(r, specifications);
    expect(why.exceeds).toEqual([]);
    expect(why.pending.specifications).toHaveLength(1);
    expect(why.pending.quantities).toHaveLength(1);
  });
});

describe("explaining a «no»", () => {
  it("names the substance over its ceiling and the materials that bring it", () => {
    const r = report(formulaOf(["Helional", "1,000"]));
    const why = whyOf(r, specifications);
    expect(r.readings[r.readings.length - 1].asIs).toBe("no");
    expect(why.exceeds.map((row) => row.name)).toEqual(["alpha-Methyl-1,3-benzodioxole-5-propionaldehyde (MMDHCA)"]);
    expect(why.exceeds[0].sources.map((s) => s.name)).toEqual(["Helional"]);
  });
});

describe("the group of phototoxics (STD 089)", () => {
  it("shows its members and the sum of their quotients, which is what the engine judges", () => {
    const r = report(formulaOf(["Bergamota sin bergaptenos", "0,100"], ["Limón", "0,100"], ["Mandarina", "0,100"]));
    const groups = groupRows(r);
    expect(groups).toHaveLength(1);
    expect(groups[0].group).toBe("furocumarinas");
    expect(groups[0].members.length).toBeGreaterThan(0);
    const sum = Ratio.sum(groups[0].members.map((m) => m.worstQuotient));
    expect(groups[0].worstSum.eq(sum)).toBe(true);
    // The group's share in the report is the same sum: the panel says what the engine counted.
    expect(r.combinedChecks[0].worstShare.eq(groups[0].worstSum)).toBe(true);
  });
});
