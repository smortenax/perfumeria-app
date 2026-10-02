import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { formatPercent } from "../core/display";
import { checkIfra, type IfraReport } from "../core/ifra";
import { repositoryFor } from "../data/repositories";
import { F001_V1, F001_V2, f001With, seven } from "./fixtures/comparacion";

// Reference tests of docs/v2/comparacion-fase2.md: the same weighing checked with v1 and with v2.
// Every difference asserted here is explained there; a change in them is a change in that document.
const v1 = repositoryFor("v1").ifraData();
const v2 = repositoryFor("v2").ifraData();

const check = (r: IfraReport, key: string) => r.checks.find((c) => c.substance.key === key);
const share = (r: IfraReport, key: string) => formatPercent((check(r, key)?.worstUg ?? Ratio.ZERO).div(r.finalUg));

describe("the seven materials, with v1 and with v2", () => {
  const a = checkIfra(seven("v1"), v1);
  const b = checkIfra(seven("v2"), v2);

  it("both say no: the oakmoss is 0,323 % of the perfume, over its 0,1 %", () => {
    for (const r of [a, b]) {
      expect(r.base).toBe("completed");
      expect(r.asIs).toBe("no");
      expect(check(r, "std:IFRA_STD_067")?.verdict).toBe("exceeds");
      expect(share(r, "std:IFRA_STD_067")).toBe("0,323 %");
    }
  });

  it("1. the lavender: v1 counts the worst of three forms and finds 7-methoxycoumarin; v2, the oil, has none", () => {
    expect(check(a, "std:IFRA_STD_158")?.verdict).toBe("exceeds");
    expect(share(a, "std:IFRA_STD_158")).toBe("0,387 %");
    expect(share(a, "std:IFRA_STD_023")).toBe("0,289 %");
    expect(check(b, "std:IFRA_STD_158")).toBeUndefined();
    expect(check(b, "std:IFRA_STD_023")).toBeUndefined();
    expect(share(b, "std:IFRA_STD_069")).toBe(share(a, "std:IFRA_STD_069"));
  });

  it("2. the linalool and the geraniol: v1 carries other products' declarations; v2, only the user's", () => {
    // v1: a PerfumersWorld certificate of champaca leaf oil, hung on the linalool, brings methyl eugenol.
    expect(check(a, "std:IFRA_STD_100")?.verdict).toBe("exceeds");
    expect(check(a, "std:IFRA_STD_100")?.sources.map((s) => s.material.name)).toEqual(["Linalol", "Castoreum Synthetic"]);
    expect(check(b, "std:IFRA_STD_100")?.verdict).toBe("within");
    expect(check(b, "std:IFRA_STD_100")?.sources.map((s) => s.material.name)).toEqual(["Castoreum Synthetic"]);
    expect(share(a, "std:IFRA_STD_037")).toBe("3,260 %");
    expect(share(b, "std:IFRA_STD_037")).toBe("3,249 %");
    for (const key of ["std:IFRA_STD_021", "std:IFRA_STD_022", "std:IFRA_STD_077", "std:IFRA_STD_179"]) {
      expect(check(a, key), key).toBeDefined();
      expect(check(b, key), key).toBeUndefined();
    }
  });

  it("3. reading 2: v1 is limited by the 7-methoxycoumarin, v2 by the oakmoss", () => {
    expect(formatPercent(a.maxUse)).toBe("0,517 %");
    expect(formatPercent(b.maxUse)).toBe("6,200 %");
  });

  it("4. Symrise's ceiling: v1 by CAS, v2 of its product alone, the same 0,081 % here", () => {
    expect(a.supplierChecks.map((c) => c.substance.key)).toEqual(["prov:19009-56-4"]);
    expect(b.supplierChecks.map((c) => c.substance.key)).toEqual(["tope:P00005"]);
    for (const r of [a, b]) {
      expect(r.supplierChecks[0].verdict).toBe("within");
      expect(formatPercent(r.supplierChecks[0].knownUg.div(r.finalUg))).toBe("0,081 %");
    }
  });

  it("5. what stays open: v1, the castoreum and the oakmoss's atranols; v2, the castoreum alone", () => {
    expect(a.pending.map((p) => p.material)).toEqual(["Absoluto de Castoreum 20%", "Oakmoss Absolute 50% (IPM)", "Oakmoss Absolute 50% (IPM)"]);
    expect(b.pending).toEqual([{ material: "Absoluto de Castoreum 20%", text: "Sin datos de sus constituyentes: puede llevar sustancias con techo." }]);
    expect(b.conditions).toEqual([
      { material: "Linalol", text: "especificación (STD 187)" },
      { material: "Oakmoss Absolute 50% (IPM)", text: "especificación (STD 067)" },
    ]);
    for (const r of [a, b]) {
      expect(r.partial).toBe(true);
      expect(r.unchecked).toEqual([]);
    }
  });

  it("6. the Castoreum Synthetic: the same 20 substances of its certificate in both", () => {
    const fromBase = (r: IfraReport) =>
      r.checks.filter((c) => c.sources.some((s) => s.material.name === "Castoreum Synthetic")).map((c) => c.substance.key).sort();
    expect(fromBase(a)).toHaveLength(20);
    expect(fromBase(b)).toEqual(fromBase(a));
  });
});

describe("F-001, with v1 and with v2", () => {
  const a = checkIfra(f001With(F001_V1), v1);
  const b = checkIfra(f001With(F001_V2), v2);

  it("v1 says no, and only because of the lavender counted as its worst form", () => {
    expect(a.asIs).toBe("no");
    expect(a.checks.filter((c) => c.verdict === "exceeds").map((c) => c.substance.key)).toEqual(["std:IFRA_STD_158"]);
    expect(check(a, "std:IFRA_STD_158")?.sources.map((s) => s.material.name)).toEqual(["Lavanda"]);
    expect(share(a, "std:IFRA_STD_158")).toBe("0,016 %");
  });

  it("v2 knows only the lavender, as oil: the other 23 are not in the v2 yet, so it cannot answer", () => {
    expect(b.asIs).toBe("unknown");
    expect(b.unchecked).toHaveLength(23);
    expect(b.checks.map((c) => c.substance.key)).toEqual(["std:IFRA_STD_037", "std:IFRA_STD_069", "std:IFRA_STD_039"]);
    expect(b.checks.every((c) => c.verdict === "within")).toBe(true);
  });
});
