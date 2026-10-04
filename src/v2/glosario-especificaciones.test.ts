import { describe, expect, it } from "vitest";
import { IFRA_FILES, v2Dataset } from "./data";
import { parseCsv } from "../data/csv.ts";
import { buildIfra, v2Key } from "./to-ifra";

/**
 * A material of the glossary has a specification to prove only if its IFRA standard has one, and nobody has proven it:
 * no row in condiciones.csv, so it is pending (D11). Never proven or assumed by being in the glossary.
 */
const data = v2Dataset();
const { details } = buildIfra(data, IFRA_FILES);
const table = (text: string) => {
  const [header = [], ...rows] = parseCsv(text.replace(/^﻿/, ""));
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
};
const specStandards = new Set(table(IFRA_FILES.estandares).filter((r) => r["especificacion"] === "sí").map((r) => r["estandar"]));
const specCas = new Set(table(IFRA_FILES.estandarCas).filter((r) => specStandards.has(r["estandar"])).map((r) => r["cas"]));
const made = new Set(data.ids.filter((e) => e.entity === "material" && e.key.startsWith("glosario-")).map((e) => e.id));

describe("glossary materials whose standard has a specification (D11)", () => {
  const withSpec = data.materials.filter((m) => made.has(m.id) && specCas.has(m.cas));

  it("there are some, and none has a row in condiciones.csv", () => {
    expect(withSpec.length).toBeGreaterThan(0);
    for (const m of withSpec) {
      expect(data.conditions.filter((c) => c.containerId === m.id), m.id).toEqual([]);
    }
  });

  it("each one carries its specification as pending, not proven and not assumed", () => {
    for (const m of withSpec) {
      const d = details.get(v2Key(m.id));
      expect(d?.specPending.length, `${m.id} ${m.name}`).toBeGreaterThan(0);
      expect(d?.conditions.filter((c) => c.state !== "pendiente" && c.state !== "nota"), m.id).toEqual([]);
    }
  });
});

describe("a standard applied by name is a noted decision (D15)", () => {
  it("fig:390 and fig:598 are members of their standards, with the decision in the note", () => {
    const members = import.meta.glob<string>("../../datos/v2/grupo-miembros.csv", { query: "?raw", import: "default", eager: true });
    const rows = table(Object.values(members)[0]);
    const decided = rows.filter((r) => r["notas"].startsWith("D15, "));
    expect(decided.length).toBeGreaterThanOrEqual(2);
    for (const r of decided) {
      expect(r["notas"], r["id_miembro"]).toMatch(/evidencia|el glosario dice/);
    }
  });
});

describe("a standard applied by the definition of its class is a noted decision, and its specification is pending (D16)", () => {
  it("the allyl esters are members of the STD 188 with the phrase and the structure in the note, and their specification pending", () => {
    const members = import.meta.glob<string>("../../datos/v2/grupo-miembros.csv", { query: "?raw", import: "default", eager: true });
    const rows = table(Object.values(members)[0]).filter((r) => r["notas"].startsWith("D16, ") && !r["notas"].includes("pinenos"));
    expect(rows.length).toBeGreaterThanOrEqual(14);
    for (const r of rows) {
      expect(r["notas"], r["id_miembro"]).toContain("Allyl esters should only be used when the level of free Allylalcohol");
      expect(r["notas"], r["id_miembro"]).toContain("es el éster del alcohol alílico");
      const material = data.materials.find((m) => m.substanceId === r["id_miembro"])!;
      expect(details.get(v2Key(material.id))?.specPending.some((t) => t.includes("188")), material.name).toBe(true);
      expect(data.conditions.filter((c) => c.containerId === material.id), material.name).toEqual([]);
    }
  });

  it("the pinenes and delta-3-carene (closed list, D16) are members of the STD 184 with the user's phrase, and their specification is pending; no other terpene is", () => {
    const members = import.meta.glob<string>("../../datos/v2/grupo-miembros.csv", { query: "?raw", import: "default", eager: true });
    const rows = table(Object.values(members)[0]).filter((r) => r["notas"].includes("Los pinenos y el delta-3-careno se tratan como de origen pináceas"));
    expect(rows.length).toBeGreaterThanOrEqual(4);
    const ref = new Map(data.groups.map((g) => [g.id, g.reference]));
    for (const r of rows) {
      expect(r["notas"], r["id_miembro"]).toContain("el usuario, 2026-10-04");
      const material = data.materials.find((m) => m.substanceId === r["id_miembro"])!;
      expect(/pinene|carene/i.test(material.name), material.name).toBe(true);
      expect(details.get(v2Key(material.id))?.specPending.some((t) => t.includes("184")), material.name).toBe(true);
    }
    // Not extended: nothing else of the STD 184 comes from the glossary.
    const of184 = data.groupMembers.filter((g) => ref.get(g.groupId) === "IFRA_STD_184").map((g) => data.materials.find((m) => m.substanceId === g.memberId || m.id === g.memberId)?.name ?? "");
    for (const name of of184.filter((n) => /dihydropinene|acetylcarene/i.test(n))) expect(name).toBe("");
  });
});
