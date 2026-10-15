/**
 * Batch 12 (V3-54): gaps of the glossary's improvement sheet (V3-46) filled from the web, one
 * material at a time. The search is in migracion-v3/web/huecos-*.csv (each row with its URL, the
 * sentence that backs it, the kind of source and its confidence); what enters is only what
 * migracion-v3/respuestas/huecos-web.csv lists, with the user's answer or the session's proposal.
 * A filled column is never overwritten: a value lands only where the approved data is empty.
 * Writes the whole common tables, as approved (v3/datos/), with these changes.
 *
 *   node migracion-v3/tanda-12-huecos-web.ts
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/12-huecos-web";
const WEB = "migracion-v3/web";
const ANSWERS = "migracion-v3/respuestas/huecos-web.csv";
type Rec = Record<string, Cell>;
const read = (path: string) => {
  const text = readFileSync(path, "utf8");
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = read("v3/datos/materials.csv");
const descriptors = read("v3/datos/material_descriptors.csv");
const found = readdirSync(WEB).filter((f) => /^huecos-.*\.csv$/.test(f)).sort().flatMap((f) => parseCsvRecords(readFileSync(join(WEB, f), "utf8")).map((r) => ({ ...r, archivo: f })));
const answers = parseCsvRecords(readFileSync(ANSWERS, "utf8"));

const FAMILIES = ["citrus", "green", "ozonic", "floral", "fruity", "spicy", "woody", "animal", "transformed"];
const STRENGTHS = ["low", "medium", "high", "very_high"];
const COLUMN: Record<string, string> = { familia: "family", tenacidad_horas: "tenacity_hours", intensidad: "strength", estado_fisico: "physical_state" };
const SOURCE_KIND: Record<string, string> = { TGSC: "TGSC", fabricante: "fabricante", tienda: "tienda", otra: "otra" };

const common = materials.rows.filter((m) => m.owner_id === "" || m.owner_id === null);
const byPrefix = (id: string) => {
  const hits = common.filter((m) => String(m.id).startsWith(id));
  if (hits.length !== 1) throw new Error(`${id}: ${hits.length} materiales comunes con ese id`);
  return hits[0];
};
const empty = (v: Cell) => v === null || v === "";

type Applied = { material: string; campo: string; valor: string; url: string; frase: string; fuente: string; confianza: string; respuesta: string };
const applied: Applied[] = [];
const chosen = new Set<object>();
const newDescriptors: Rec[] = [];
for (const a of answers) {
  const m = byPrefix(a.id);
  const rows = found.filter((r) => r.material_id.startsWith(a.id) && r.campo === a.campo && r.valor !== "");
  const row = rows.find((r) => r.valor === a.valor) ?? rows[0];
  if (!row) throw new Error(`${a.id} ${a.campo}: la búsqueda no tiene ninguna fila con valor`);
  chosen.add(row);
  const url = row.url;
  const kind = SOURCE_KIND[row.fuente_tipo];
  if (!url || !kind) throw new Error(`${a.id} ${a.campo}: sin URL o sin tipo de fuente`);
  const cite = `web (V3-54, ${kind}): ${url}`;
  if (a.campo === "descriptores") {
    const text = `${kind} (${url}): ${a.valor}`;
    newDescriptors.push({ id: uuidFor(`desc:v3:web:${m.id}:${text}`), material_id: m.id, owner_id: null, source: kind === "TGSC" ? "TG" : "web", text });
  } else {
    const column = COLUMN[a.campo];
    if (!column) throw new Error(`${a.id}: campo desconocido «${a.campo}»`);
    if (!empty(m[column])) throw new Error(`${m.name}: ${column} ya tiene «${m[column]}»; esta tanda solo rellena huecos`);
    if (column === "family" && !FAMILIES.includes(a.valor)) throw new Error(`${m.name}: familia «${a.valor}»`);
    if (column === "strength" && !STRENGTHS.includes(a.valor)) throw new Error(`${m.name}: intensidad «${a.valor}»`);
    if (column === "tenacity_hours") {
      if (!/^\d+(\.\d+)?$/.test(a.valor) || Number(a.valor) <= 0) throw new Error(`${m.name}: tenacidad «${a.valor}»`);
      if ((m.disputed_fields as unknown as string).includes("tenacity_hours")) throw new Error(`${m.name}: la tenacidad está en disputa`);
      m.tenacity_source = `${cite}; horas en tira, material puro (escala TGSC)`;
    }
    m[column] = a.valor;
  }
  m.sources = `${m.sources}; ${a.campo}: ${cite}`;
  applied.push({ material: String(m.name), campo: a.campo, valor: a.valor, url, frase: row.frase, fuente: kind, confianza: row.confianza, respuesta: a.respuesta });
}

// What the search found and does not enter: every row that no answer chose.
const left = found.filter((r) => !chosen.has(r));

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, asCells(materials.rows));
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);

const md = (t: string) => t.replace(/\|/g, "\\|").replace(/\n/g, " ");
const FIELD: Record<string, string> = { familia: "familia", tenacidad_horas: "tenacidad (h)", intensidad: "intensidad", descriptores: "descriptores", estado_fisico: "estado físico", dosis: "dosis", especie: "especie" };
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 12 · Huecos del glosario, desde la web

*Generada por \`migracion-v3/tanda-12-huecos-web.ts\` (V3-54), desde la búsqueda en \`migracion-v3/web/\` (${found.length} filas) y lo que entra según \`migracion-v3/respuestas/huecos-web.csv\`. Escribe las tablas enteras de lo común, como están aprobadas, con estos cambios. Solo rellena campos vacíos: si uno ya tiene dato, la tanda se para.*

## Lo que entra (${applied.length})

| Material | Campo | Valor | Fuente | Frase | Por qué |
|---|---|---|---|---|---|
${applied.map((a) => `| ${md(a.material)} | ${FIELD[a.campo]} | ${md(a.valor)} | [${a.fuente}](${a.url}) · ${a.confianza} | ${md(a.frase)} | ${md(a.respuesta)} |`).join("\n")}

Cada valor cita su URL en \`sources\` del material; la tenacidad, también en \`tenacity_source\`. El color de la familia sale de la paleta (V3-38). Los descriptores entran como una fila más «por fuente», sin tocar las que había.

## Lo que se buscó y no entra (${left.length})

| Material | Campo | Encontrado | Fuente | Por qué no |
|---|---|---|---|---|
${left.map((r) => `| ${md(r.material)} | ${FIELD[r.campo] ?? r.campo} | ${md(r.valor || "—")} | ${r.url ? `[${r.fuente_tipo}](${r.url})` : r.fuente_tipo} · ${r.confianza} | ${md(r.notas)} |`).join("\n")}
`,
  "utf8",
);
console.log(`Tanda 12: ${applied.length} datos entran, ${newDescriptors.length} filas de descriptores; ${left.length} filas de la búsqueda no entran. ${OUT}/informe.md`);
