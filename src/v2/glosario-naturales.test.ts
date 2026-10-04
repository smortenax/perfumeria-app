import { describe, expect, it } from "vitest";
import annexText from "../../datos/ifra/51/naturales.csv?raw";
import { parseCsv } from "../data/csv.ts";
import { Ratio } from "../core/arith/ratio";
import { IFRA_FILES, v2Dataset } from "./data";

/**
 * The naturals of the glossary (D14): a name is one material; the annex gives its constituents, as the entry that is its own or,
 * when its CAS has several and none is its own, the worst of them for each constituent (anexo_peor).
 */
const table = (text: string) => {
  const [header = [], ...rows] = parseCsv(text.replace(/^﻿/, ""));
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
};
const altas = import.meta.glob<string>("../../docs/v2/altas/*-glosario-*.json", { query: "?raw", import: "default", eager: true });

interface Natural {
  clave: string;
  tipo: string;
  nombre: string;
  cas: string;
  otros_cas?: string[];
  especie: string;
  anexo?: { nombre: string; cas_todos: string[] };
  anexo_peor?: { nombres: string[]; cas_todos: string[] };
}
const naturals = Object.values(altas).flatMap((text) => (JSON.parse(text) as { materiales: Natural[] }).materiales.filter((m) => m.tipo === "natural"));

const data = v2Dataset();
const annex = table(annexText);
const idOf = (clave: string) => data.ids.find((e) => e.entity === "material" && e.key === clave)!.id;
const casOfSubstance = new Map(data.casAliases.filter((a) => a.relation === "principal").map((a) => [a.substanceId, a.cas]));
const entriesOf = (casList: string[], names: string[]) =>
  annex.filter((r) => names.includes(r["nombre"]) && casList.some((c) => c === r["cas_principal"] || r["otros_cas"].split(" ").includes(c)));
const dec = (text: string) => Ratio.fromDecimal(text);

describe("naturals of the glossary (D14)", () => {
  it("there are naturals of both annex cases, and a name is one material", () => {
    expect(naturals.some((m) => m.anexo_peor)).toBe(true);
    expect(naturals.some((m) => m.anexo)).toBe(true);
    const names = naturals.map((m) => m.nombre.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
    expect(new Set(names).size).toBe(names.length);
  });

  it("anexo_peor: for each constituent, the maximum of the entries of its CAS, with the annex's authority and a maximum", () => {
    for (const m of naturals.filter((x) => x.anexo_peor)) {
      const mid = idOf(m.clave);
      const entries = entriesOf(m.anexo_peor!.cas_todos, m.anexo_peor!.nombres);
      expect(entries.length, m.nombre).toBeGreaterThan(1);
      const worst = new Map<string, Ratio>();
      for (const e of entries) {
        const v = dec(e["concentracion_pct"]);
        const best = worst.get(e["cas_constituyente"]);
        if (!best || v.gt(best)) worst.set(e["cas_constituyente"], v);
      }
      const rows = data.composition.filter((r) => r.containerId === mid);
      expect(rows.length, m.nombre).toBe(worst.size);
      for (const r of rows) {
        expect(r.valueType, m.nombre).toBe("maximo");
        expect(r.authority, m.nombre).toBe("anexo-ifra");
        expect(r.typical, m.nombre).toBe("");
        const cas = casOfSubstance.get(r.componentId)!;
        expect(dec(r.max).eq(worst.get(cas)!), `${m.nombre} ${cas}`).toBe(true);
      }
    }
  });

  it("anexo (its own entry): the typical values of that entry, as the annex gives them", () => {
    for (const m of naturals.filter((x) => x.anexo)) {
      const mid = idOf(m.clave);
      const entries = entriesOf(m.anexo!.cas_todos, [m.anexo!.nombre]);
      const rows = data.composition.filter((r) => r.containerId === mid);
      expect(rows.length, m.nombre).toBe(entries.length);
      for (const r of rows) {
        expect(r.valueType, m.nombre).toBe("tipico");
        expect(r.authority, m.nombre).toBe("anexo-ifra");
        const cas = casOfSubstance.get(r.componentId)!;
        const entry = entries.find((e) => e["cas_constituyente"] === cas)!;
        expect(dec(r.typical).eq(dec(entry["concentracion_pct"])), `${m.nombre} ${cas}`).toBe(true);
      }
    }
  });

  it("a natural without an entry in the annex has an unknown coverage and no figures, never zero", () => {
    for (const m of naturals.filter((x) => !x.anexo && !x.anexo_peor)) {
      const mid = idOf(m.clave);
      expect(data.composition.filter((r) => r.containerId === mid), m.nombre).toEqual([]);
      expect(data.coverages.find((c) => c.containerId === mid)?.coverage, m.nombre).toBe("desconocida");
    }
  });

  it("the species is the annex's single one or «no lo dice»; the standards of every CAS of the name apply", () => {
    const standardsOfCas = new Map<string, string[]>();
    for (const r of table(IFRA_FILES.estandarCas)) standardsOfCas.set(r["cas"], [...(standardsOfCas.get(r["cas"]) ?? []), r["estandar"]]);
    const groupRef = new Map(data.groups.map((g) => [g.id, g.reference]));
    for (const m of naturals) {
      const material = data.materials.find((x) => x.id === idOf(m.clave))!;
      expect(material.species === "no lo dice" || material.species.length > 3, m.nombre).toBe(true);
      const casList = [m.cas, ...(m.otros_cas ?? [])].filter(Boolean);
      const mine = new Set(data.groupMembers.filter((g) => g.memberId === material.id).map((g) => groupRef.get(g.groupId)));
      for (const cas of casList) for (const std of standardsOfCas.get(cas) ?? []) expect(mine.has(std), `${m.nombre} ${cas} ${std}`).toBe(true);
    }
  });
});
