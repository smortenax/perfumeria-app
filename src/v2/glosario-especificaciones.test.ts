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
