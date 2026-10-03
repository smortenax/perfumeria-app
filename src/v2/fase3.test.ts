import { describe, expect, it } from "vitest";
import { formatPercent } from "../core/display";
import { checkIfra, type IfraReport } from "../core/ifra";
import pendientes from "../../docs/v2/pendientes-F001.md?raw";
import { repositoryFor } from "../data/repositories";
import { v2Dataset } from "./data";
import { f001Keys, f001With } from "./fixtures/fase3";

// Close of phase 3 (docs/v2/comparacion-fase3.md): F-001 whole, with the v1 rows that the user chose lot by lot
// (datos/v2/v1-a-v2.csv) and with the v2. Every difference asserted here is explained in that document.
const data = v2Dataset();
const keys = f001Keys(data);
const a = checkIfra(f001With(keys.v1), repositoryFor("v1").ifraData());
const b = checkIfra(f001With(keys.v2), repositoryFor("v2").ifraData());

const check = (r: IfraReport, key: string) => r.checks.find((c) => c.substance.key === key);
const share = (r: IfraReport, key: string) => {
  const c = check(r, key);
  return c ? formatPercent(c.worstUg.div(r.finalUg)) : "—";
};
const names = (r: IfraReport) => r.checks.map((c) => c.substance.key).sort();

describe("F-001 whole, with the v1 rows the user chose and with the v2", () => {
  it("every material of F-001 is in both models, and neither says it is unchecked", () => {
    expect(Object.keys(keys.v1)).toHaveLength(24);
    expect(Object.keys(keys.v2)).toHaveLength(24);
    expect(a.unchecked).toEqual([]);
    expect(b.unchecked).toEqual([]);
  });

  it("both answer «unknown»: nothing is over a ceiling, but something is pending, so reading 1 cannot say yes", () => {
    for (const r of [a, b]) {
      expect(r.asIs).toBe("unknown");
      expect(r.partial).toBe(true);
      expect(r.checks.some((c) => c.verdict === "exceeds")).toBe(false);
      expect(formatPercent(r.maxUse)).toBe("100,000 %");
    }
  });

  it("1. the same figures for the molecules and for what the annex of IFRA gives", () => {
    for (const key of ["std:IFRA_STD_068", "std:IFRA_STD_028", "std:IFRA_STD_211", "std:IFRA_STD_208", "std:IFRA_STD_197", "std:IFRA_STD_199", "std:IFRA_STD_078", "std:IFRA_STD_069", "std:IFRA_STD_039", "std:IFRA_STD_037"]) {
      expect(share(b, key), key).toBe(share(a, key));
    }
    expect(share(a, "std:IFRA_STD_068")).toBe("4,254 %");
    expect(share(a, "std:IFRA_STD_028")).toBe("0,629 %");
    expect(share(a, "std:IFRA_STD_211")).toBe("0,271 %");
  });

  it("2. the v1 carries five standards that the v2 does not: supplier lists of lower authority than the annex", () => {
    expect(names(a).filter((k) => !names(b).includes(k))).toEqual([
      "std:IFRA_STD_010", // benzyl cinnamate: the list of another supplier of the styrax
      "std:IFRA_STD_011", // benzyl salicylate: the same
      "std:IFRA_STD_029", // dihydrocoumarin: the tonka tincture
      "std:IFRA_STD_035", // eugenol: the styrax
      "std:IFRA_STD_192", // alpha-bisabolol: a certificate of another supplier of the lavender
    ]);
    expect(names(b).filter((k) => !names(a).includes(k))).toEqual([]);
  });

  it("3. a placeholder is bounded in the v2, never within: the benzoin and the tobacco", () => {
    for (const key of ["std:IFRA_STD_008", "std:IFRA_STD_009", "std:IFRA_STD_048", "std:IFRA_STD_190", "std:IFRA_STD_191", "std:IFRA_STD_023"]) {
      expect(check(b, key)?.verdict, key).toBe("bounded");
    }
    expect(check(a, "std:IFRA_STD_023")?.verdict).toBe("within");
  });

  it("4. the coumarin: the v1 adds the tonka tincture, the lavender and the styrax; the v2 only the tobacco, bounded", () => {
    expect(check(a, "std:IFRA_STD_023")?.sources.map((s) => s.material.name).sort()).toEqual(
      ["Absoluto de Tabaco", "Haba tonka (tintura)", "Lavanda", "Resinoide Estírax"].sort(),
    );
    expect(check(b, "std:IFRA_STD_023")?.sources.map((s) => s.material.name)).toEqual(["Absoluto de Tabaco"]);
    expect(b.pending.some((p) => p.material === "Haba tonka (tintura)")).toBe(true);
  });

  it("5. what stays open: the v1, four constituents; the v2, naturals without data, partial ones and two unproven specifications", () => {
    expect(a.pending.map((p) => p.material).sort()).toEqual(["Absoluto de Tabaco", "Patchouli", "Resinoide Estírax", "Ámbar gris (tintura)"].sort());
    expect(b.pending.map((p) => p.material).sort()).toEqual(
      [
        "Absoluto de Tabaco",
        "Allyl Amyl Glycolate",
        "Cedro Atlas",
        "Haba tonka (tintura)",
        "Patchouli",
        "Resinoide Benjuí",
        "Sandalmysore Core",
        "Ámbar gris (tintura)",
      ].sort(),
    );
    // The two specifications (STD 184 and 188) are information in the v1 and pending in the v2. The PAH
    // specification of STD 078 is of the pyrolysis oil: a styrax resinoid is outside it, and nothing is pending.
    expect(b.pending.filter((p) => p.text.includes("su especificación no está acreditada")).map((p) => p.material).sort()).toEqual([
      "Allyl Amyl Glycolate",
      "Cedro Atlas",
    ]);
    expect(b.pending.some((p) => p.material === "Resinoide Estírax")).toBe(false);
  });

  it("6. the lists of other materials of the v1 are gone: the phenylhexanol's from the Polysantol, Santaliff Toco's from the Sandalmysore Core", () => {
    // The benzaldehyde of the Polysantol came from the allergen list of the phenylhexanol (errores-v1.md).
    expect(check(a, "std:IFRA_STD_007")?.sources.map((s) => s.material.name).sort()).toEqual(["Polysantol", "Resinoide Estírax"]);
    expect(check(b, "std:IFRA_STD_007")?.sources.map((s) => s.material.name)).toEqual(["Resinoide Estírax"]);
    // The Sandalmysore Core is a base with unknown composition in the v2, and brought OTNE in the v1.
    expect(check(a, "std:IFRA_STD_068")?.sources.map((s) => s.material.name).sort()).toEqual(["Iso E Super", "Sandalmysore Core"]);
    expect(check(b, "std:IFRA_STD_068")?.sources.map((s) => s.material.name)).toEqual(["Iso E Super"]);
  });

  it("7. the v1 shows information as conditions; the v2, only what IFRA obliges, and nothing is assumed here", () => {
    expect(a.conditions.length).toBeGreaterThan(5);
    expect(b.conditions).toEqual([{ material: "Resinoide Estírax", text: "una variante está prohibida (STD 078)" }]);
    expect(b.conditions.some((c) => c.assumed)).toBe(false);
  });

  it("8. the lavender: the row chosen is the oil (fig:2183); the old pointer, fig:2179, mixed three forms and said no", () => {
    expect(keys.v1["MAT-lavanda"]).toBe("fig:2183");
    const old = checkIfra(f001With({ ...keys.v1, "MAT-lavanda": "fig:2179" }), repositoryFor("v1").ifraData());
    expect(old.asIs).toBe("no");
    expect(check(old, "std:IFRA_STD_158")?.verdict).toBe("exceeds");
    expect(check(a, "std:IFRA_STD_158")).toBeUndefined();
    expect(check(b, "std:IFRA_STD_158")).toBeUndefined();
  });

  it("9. every pending of F-001 in the v2 is in docs/v2/pendientes-F001.md, with the shop to ask", () => {
    const materials = [...new Set(b.pending.map((p) => p.material))];
    expect(materials.length).toBeGreaterThan(0);
    for (const material of materials) {
      expect(pendientes, material).toContain(`**${material}**`);
    }
    const [olfatorium, maese] = [pendientes.indexOf("## Olfatorium"), pendientes.indexOf("## Maese Lab")];
    expect(olfatorium).toBeGreaterThan(0);
    expect(maese).toBeGreaterThan(olfatorium);
    for (const material of ["Cedro Atlas", "Allyl Amyl Glycolate", "Patchouli", "Absoluto de Tabaco", "Resinoide Benjuí", "Sandalmysore Core"]) {
      const at = pendientes.indexOf(`**${material}**`);
      expect(at > olfatorium && at < maese, material).toBe(true);
    }
    for (const material of ["Haba tonka (tintura)", "Ámbar gris (tintura)"]) {
      expect(pendientes.indexOf(`**${material}**`) > maese, material).toBe(true);
    }
  });
});
