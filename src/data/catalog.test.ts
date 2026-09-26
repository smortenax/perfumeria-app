import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { formatPercent } from "../core/display";
import { checkIfra } from "../core/ifra";
import type { Change, FormulaHeader } from "../core/model/formula";
import { DILUENTS } from "../core/model/material";
import { searchCatalog } from "./catalog";
import { catalog } from "./provisional";

const byCas = (cas: string) => catalog.entries.filter((e) => e.cas === cas);
const first = (cas: string) => {
  const found = byCas(cas)[0];
  if (!found) {
    throw new Error(`No material with CAS ${cas}`);
  }
  return found.material;
};
const ifraOf = (cas: string) => catalog.ifra.materials.get(first(cas).key);
const header: FormulaHeader = { name: "prueba", intention: "", container: null, workBatchUg: null, finalBatchUg: null };
const MG = 1_000n;

describe("the provisional catalog, from datos/fuente/", () => {
  it("has the rows of the FIG as the base and the two diluents, and none of the user's materials (P36)", () => {
    const count = (group: string) => catalog.entries.filter((e) => e.group === group).length;
    expect(count("base")).toBe(3119);
    expect(count("diluent")).toBe(2);
    expect(count("own")).toBe(0);
    expect(catalog.entries.some((e) => e.material.key.startsWith("lab:"))).toBe(false);
    expect(catalog.source.commit).toBe("9949c5f");
  });

  it("reads IFRA by CAS: the ceiling, with the name IFRA gives it", () => {
    expect(ifraOf("54464-57-2")?.substances).toEqual([{ key: "cas:54464-57-2", fraction: Ratio.ONE }]);
    const otne = catalog.ifra.substances.get("cas:54464-57-2");
    expect(otne?.name).toBe("Iso E Super (OTNE)");
    expect(otne?.limit.eq(Ratio.of(20, 100))).toBe(true);
    expect(catalog.ifra.substances.get("cas:91-64-5")?.limit.eq(Ratio.of(15, 1000))).toBe(true);
    // Looked up in the index, with no standard of its own: checked, and free.
    expect(ifraOf("24851-98-7")).toEqual({ status: "checked", substances: [], conditions: [] });
  });

  it("keeps a constituent whose ceiling is not in the data as pending, and the conditions as conditions", () => {
    expect(ifraOf("8008-56-8")?.pending?.[0]).toMatch(/^citral/);
    expect(ifraOf("8013-10-3")?.conditions.some((c) => c.startsWith("HAP"))).toBe(true);
  });

  it("leaves unchecked every CAS the lab never transcribed (§5.2)", () => {
    expect(catalog.ifra.materials.has(first("4221-98-1").key)).toBe(false);
    expect(catalog.checkedCas).toBeGreaterThan(40);
  });

  it("adds each substance up wherever it comes from, and never takes the unchecked as free", () => {
    const coumarin = first("91-64-5");
    const otne = first("54464-57-2");
    const unchecked = first("4221-98-1");
    const history: Change[] = [
      { kind: "add", id: "c", material: coumarin, massUg: 150n * MG, fraction: Ratio.of(9, 100), diluent: DILUENTS.alcohol },
      { kind: "add", id: "o", material: otne, massUg: 372n * MG, fraction: Ratio.ONE, diluent: null },
      { kind: "add", id: "a", material: DILUENTS.alcohol, massUg: 478n * MG, fraction: Ratio.ONE, diluent: null },
    ];
    const report = checkIfra({ header, history }, catalog.ifra);
    expect(report.checks.find((c) => c.substance.key === "cas:91-64-5")?.verdict).toBe("within");
    expect(report.checks.find((c) => c.substance.key === "cas:54464-57-2")?.verdict).toBe("exceeds");
    expect(report.asIs).toBe("no");
    expect(formatPercent(report.maxUse, 2)).toBe("53,76 %");

    const withUnchecked = checkIfra({ header, history: [...history, { kind: "add", id: "u", material: unchecked, massUg: 10n * MG, fraction: Ratio.ONE, diluent: null }] }, catalog.ifra);
    expect(withUnchecked.unchecked).toEqual([unchecked.name]);
  });

  it("finds by CAS, by the name in the glossary and by the name of the IFRA standard", () => {
    expect(searchCatalog(catalog.entries, "54464-57-2")[0].cas).toBe("54464-57-2");
    expect(searchCatalog(catalog.entries, "iso e super")[0].cas).toBe("54464-57-2");
    expect(searchCatalog(catalog.entries, "coumarin")[0].cas).toBe("91-64-5");
    expect(searchCatalog(catalog.entries, "dpg")[0].material.key).toBe("solv:dpg");
  });
});
