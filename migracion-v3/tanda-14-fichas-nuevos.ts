/**
 * Batch 14 (2026-10-15): the information table of the materials batch 13 brought, so that all of
 * yours have one. The user: «estaria bien que a estos nuevos se les busque tambien tabla para que
 * todos mis materiales esten con tabla de info … obviamente menos el laudano». The search is in
 * migracion-v3/web/fichas-13.csv: each value with the page of The Good Scents Company it comes from
 * and the sentence that backs it, quoted; `origen` says whether the value is the page's (TGSC) or a
 * reading of it by the session (family, its detail, facets, tier and role: proposals, as in batch 12).
 * A filled column is never overwritten: a value lands only where the approved data is empty. The
 * usage level is TGSC's recommendation for the fragrance concentrate: a dose, never an IFRA limit.
 * Writes the whole common tables, as approved (v3/datos/), with these changes.
 *
 *   node migracion-v3/tanda-14-fichas-nuevos.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/14-fichas-nuevos";
const FOUND = "migracion-v3/web/fichas-13.csv";
type Rec = Record<string, Cell>;
const read = (path: string) => {
  const text = readFileSync(path, "utf8");
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = read("v3/datos/materials.csv");
const descriptors = read("v3/datos/material_descriptors.csv");
const doses = read("v3/datos/material_doses.csv");
const found = parseCsvRecords(readFileSync(FOUND, "utf8"));

const COLUMNS = new Set([
  "physical_state", "appearance", "density", "melting_point_c", "vapor_pressure", "solubility", "formula", "molecular_weight",
  "strength", "tenacity_hours", "handling", "blend_effect", "stability", "species", "family", "family_detail", "facets", "tier", "role",
]);
const ENUMS: Record<string, readonly string[]> = {
  family: ["citrus", "green", "ozonic", "floral", "fruity", "spicy", "woody", "animal", "transformed"],
  strength: ["low", "medium", "high", "very_high"],
  tier: ["top", "top_heart", "heart", "heart_base", "base"],
  role: ["modifier", "structure", "fixative", "trace", "bridge", "booster"],
};
const NUMERIC = new Set(["density", "melting_point_c", "molecular_weight", "tenacity_hours"]);
const empty = (v: Cell) => v === null || v === "" || v === "[]";
const asList = (v: Cell): string[] => (typeof v === "string" && v.startsWith("[") ? (JSON.parse(v) as string[]) : Array.isArray(v) ? (v as string[]) : []);

// Only the materials of batch 13, by their name in the common data.
const common = materials.rows.filter((m) => empty(m.owner_id));
const byName = (name: string) => {
  const hits = common.filter((m) => m.name === name && String(m.notes ?? "").includes("tanda 13"));
  if (hits.length !== 1) throw new Error(`«${name}»: ${hits.length} materiales de la tanda 13 con ese nombre`);
  return hits[0];
};

type Line = { material: string; campo: string; valor: string; origen: string; url: string; frase: string; entra: boolean };
const report: Line[] = [];
const newDescriptors: Rec[] = [];
const newDoses: Rec[] = [];
const touched = new Set<Rec>();
for (const r of found) {
  const m = byName(r.material);
  const line: Line = { material: r.material, campo: r.campo, valor: r.valor, origen: r.origen, url: r.url, frase: r.frase, entra: true };
  report.push(line);
  if (!r.url || !r.frase) throw new Error(`${r.material} ${r.campo}: sin URL o sin frase`);
  const proposal = r.origen !== "TGSC";
  if (COLUMNS.has(r.campo)) {
    if (ENUMS[r.campo] && !ENUMS[r.campo].includes(r.valor)) throw new Error(`${r.material} ${r.campo}: «${r.valor}» no es un valor admitido`);
    if (NUMERIC.has(r.campo) && !/^-?\d+(\.\d+)?$/.test(r.valor)) throw new Error(`${r.material} ${r.campo}: «${r.valor}» no es un número`);
    if (!empty(m[r.campo])) {
      line.entra = false;
      continue;
    }
    m[r.campo] = r.valor;
    if (r.campo === "tenacity_hours") m.tenacity_source = `web: TGSC, ${r.url}: «${r.frase}»`;
    if (["density", "melting_point_c", "vapor_pressure", "solubility", "formula", "molecular_weight", "appearance", "physical_state"].includes(r.campo)) {
      m.physical_sources = `web: TGSC, ${r.url}`;
    }
    touched.add(m);
  } else if (r.campo === "descriptor") {
    newDescriptors.push({ id: uuidFor(`desc:v3:tanda14:${m.id}:${r.valor}`), material_id: m.id, owner_id: null, source: "TG", text: r.valor });
    touched.add(m);
  } else if (r.campo === "dose_max") {
    newDoses.push({
      id: uuidFor(`dose:v3:tanda14:${m.id}:${r.valor}`),
      material_id: m.id,
      owner_id: null,
      min: null,
      typical: null,
      max: r.valor,
      basis: "concentrate",
      authority: "literature",
      source: `web: TGSC, ${r.url}`,
      disputed: false,
      notes: `TGSC: «Recommendation for usage levels up to: ${r.frase}» Es una recomendación de uso, no un límite de IFRA.`,
    });
    touched.add(m);
  } else if (r.campo === "notes") {
    m.notes = `${String(m.notes ?? "")} ${r.valor}`.trim();
  } else if (r.campo === "disputed") {
    m.disputed_fields = [...new Set([...asList(m.disputed_fields), r.valor])];
  } else {
    throw new Error(`${r.material}: campo desconocido «${r.campo}»`);
  }
  if (proposal) line.origen = "propuesta de la sesión";
}
for (const m of touched) {
  m.sources = [String(m.sources ?? ""), "web: The Good Scents Company (tanda 14)"].filter((s) => s).join(" · ");
  m.notes = String(m.notes ?? "").replace("La ficha está por completar (V3-46).", "Ficha de la tanda 14, de The Good Scents Company.");
}

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, asCells(materials.rows));
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);
writeTable(join(OUT, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...newDoses]);

const names = [...new Set(report.map((l) => l.material))];
const LABEL: Record<string, string> = {
  physical_state: "Estado", appearance: "Aspecto", density: "Densidad", melting_point_c: "Punto de fusión (°C)", vapor_pressure: "Presión de vapor",
  solubility: "Solubilidad", formula: "Fórmula", molecular_weight: "Peso molecular", strength: "Intensidad", tenacity_hours: "Tenacidad (h)",
  handling: "Manejo", blend_effect: "En la mezcla", stability: "Conservación", species: "Especie", family: "Familia", family_detail: "Matiz",
  facets: "Facetas", tier: "Nivel", role: "Papel", descriptor: "Descriptor", dose_max: "Dosis máx. (fracción del concentrado)", notes: "Nota", disputed: "En disputa",
};
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 14 · La tabla de información de los materiales de la tanda 13

*Generada por \`migracion-v3/tanda-14-fichas-nuevos.ts\` (2026-10-15), desde \`migracion-v3/web/fichas-13.csv\`: una ficha de The Good Scents Company por material, con su frase literal. El usuario: «estaria bien que a estos nuevos se les busque tambien tabla para que todos mis materiales esten con tabla de info». El Láudano de jara no entra (solo cambia el origen y la dilución).*

Entran ${newDescriptors.length} descriptores, ${newDoses.length} dosis y los campos de ${touched.size} materiales; un campo ya relleno no se toca. **Lo marcado «propuesta de la sesión» (familia, matiz, facetas, nivel y papel) es mi lectura de la ficha, para que lo corrijas antes de aprobar.** La dosis es la recomendación de uso de TGSC en el concentrado, no un límite de IFRA.

**Para mirar:** la tialdina, según TGSC, «not for fragrance use» (es un aromatizante de carne asada); el linolenato de metilo no tiene olor, dosis ni tenacidad en TGSC y queda sin lo olfativo; la Rose Crystals tiene el punto de fusión en disputa (TGSC 188–191 °C, otra fuente 86–89 °C).

${names
  .map(
    (n) => `## ${n}

${report.find((l) => l.material === n)!.url}

| Campo | Valor | De dónde |
|---|---|---|
${report
  .filter((l) => l.material === n)
  .map((l) => `| ${LABEL[l.campo] ?? l.campo} | ${cell(l.valor)}${l.entra ? "" : " *(ya relleno: no entra)*"} | ${l.origen === "TGSC" ? `«${cell(l.frase)}»` : `propuesta de la sesión, por «${cell(l.frase)}»`} |`)
  .join("\n")}
`,
  )
  .join("\n")}`,
  "utf8",
);
console.log(`Tanda 14: ${touched.size} materiales con ficha, ${newDescriptors.length} descriptores, ${newDoses.length} dosis. ${OUT}/informe.md`);
