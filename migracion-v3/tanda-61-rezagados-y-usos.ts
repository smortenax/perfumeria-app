/**
 * Batch 61 (2026-11-19), common: the rezagados (the materials you have whose common sheet still lacked a
 * field) and the usual use of the commons of batches 57 and 60. The user, 2026-11-19: «si sigue con la 2 y
 * acepta las dosis de otras referencias» (V3-105).
 *
 * From migracion-v3/web/info-61/: what the readers copied from each page (web-61-*.csv, and the doses
 * batch 60 had read), checked by consolidar.py against the page kept in cache/ (a phrase that is not in
 * the page does not go in). It fills only empty fields and adds rows; nothing that had a value changes.
 * It rewrites materials.csv, material_doses.csv and material_descriptors.csv whole.
 *
 *   python3 -I migracion-v3/web/info-61/consolidar.py && node migracion-v3/tanda-61-rezagados-y-usos.ts
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const TANDA = "61";
const BASE = process.env.BASE ?? execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/61-rezagados-y-usos";
const WEB = "migracion-v3/web/info-61";
type Rec = Record<string, Cell>;

const table = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const local = (path: string) => parseCsvRecords(readFileSync(path, "utf8")) as Record<string, string>[];
const materials = table("v3/datos/materials.csv");
const doses = table("v3/datos/material_doses.csv");
const descriptors = table("v3/datos/material_descriptors.csv");
const proposal = local(join(WEB, "propuesta-61.csv"));
const usos = local(join(WEB, "dosis-61.csv"));
const unused = local(join(WEB, "no-usado-61.csv"));
const empty = (v: Cell) => v === null || v === undefined || v === "";
const listOf = (v: Cell): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v.startsWith("[") ? (JSON.parse(v) as string[]) : []);
const byId = new Map(materials.rows.map((r) => [String(r.id), r]));
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");
const pct = (v: string) => `${Number((Number(v) * 100).toPrecision(6))} %`;

const filledBy = new Map<string, string[]>();
const disputedRows: string[] = [];
let filled = 0;
const note = (m: Rec, text: string) => (m.notes = `${m.notes ? `${m.notes}\n` : ""}${text}`);
const fill = (m: Rec, field: string, value: string, source: string, disputed: boolean, others: string) => {
  if (!empty(m[field])) throw new Error(`${m.name}: ${field} ya tiene valor`);
  m[field] = value;
  const said = `${source}, by batch ${TANDA}`;
  if (field === "tenacity_hours") m.tenacity_source = said;
  else if (field === "strength") m.strength_source = said;
  else m.sources = `${m.sources ? `${m.sources} · ` : ""}${field}: ${said}`;
  if (disputed) {
    m.disputed_fields = [...new Set([...listOf(m.disputed_fields), field])];
    disputedRows.push(`| ${cell(String(m.name))} | ${field} | ${cell(value)} | ${cell(others || "otra referencia da otro valor")} |`);
  }
  if (others) note(m, `Batch ${TANDA}, ${field}: other references: ${others}.`);
  filledBy.set(String(m.id), [...(filledBy.get(String(m.id)) ?? []), `${field} = ${value}${disputed ? " (disputado)" : ""}`]);
  filled++;
};

const newDescriptors: Rec[] = [];
for (const p of proposal) {
  const m = byId.get(p.id);
  if (!m || m.owner_id) throw new Error(`${p.nombre}: no es un común de ${BASE}`);
  for (const field of ["family", "tenacity_hours", "strength", "house", "cas", "species"])
    if (p[field]) fill(m, field, p[field], p[`${field}_fuente`], p[`${field}_disputado`] === "si", p[`${field}_otras`] ?? "");
  for (const [i, [site, text]] of (JSON.parse(p.olores || "[]") as [string, string, string][]).entries())
    newDescriptors.push({ id: uuidFor(`desc:v3:tanda${TANDA}:${p.id}:${i}`), material_id: p.id, owner_id: null, source: "web", text: `${site}: ${text}` });
  const notUsed = unused.filter((u) => u.n === p.n);
  if (notUsed.length) note(m, `Batch ${TANDA}, read and not used: ${notUsed.map((u) => `${u.campo} «${u.valor}» (${u.motivo})`).join("; ")}.`);
}

// The usual use (V3-105): one row per reference, as literature; never an IFRA limit.
const newDoses: Rec[] = usos.map((d, i) => {
  if (!byId.has(d.id)) throw new Error(`${d.nombre}: no es un común`);
  const range = [d.min && `from ${pct(d.min)}`, d.typical && `typical ${pct(d.typical)}`, d.max && `up to ${pct(d.max)}`].filter(Boolean).join(", ");
  filledBy.set(d.id, [...(filledBy.get(d.id) ?? []), `uso ${range} (${d.basis})`]);
  return {
    id: uuidFor(`dose:v3:tanda${TANDA}:${d.id}:${i}`),
    material_id: d.id,
    owner_id: null,
    min: d.min || null,
    typical: d.typical || null,
    max: d.max || null,
    basis: d.basis,
    authority: "literature",
    source: d.fuente,
    disputed: false,
    notes: `Observed or recommended use, not an IFRA limit (V3-105: a reference other than TGSC).${d.typical && !d.min && !d.max ? " A median of use in the formulas the reference analysed, not a maximum." : ""}${d.nota ? ` Reader's note: ${d.nota}.` : ""}`,
  };
});

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
mkdirSync(OUT, { recursive: true });
writeTable(join(OUT, "materials.csv"), materials.header, asCells(materials.rows));
writeTable(join(OUT, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...newDoses]);
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);

const lines = proposal.map((p) => `| ${p.n} | ${cell(p.nombre)} | ${p.buscar} | ${cell((filledBy.get(p.id) ?? []).join("; ")) || "—"} |`);
const _extra = [...new Set(usos.filter((d) => !proposal.some((p) => p.id === d.id)).map((d) => d.id))].map((id) => `| ${cell(String(byId.get(id)?.name))} | ${cell((filledBy.get(id) ?? []).join("; "))} |`);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 61 · Los rezagados y el uso habitual de las altas del 18-nov

*Generada por \`migracion-v3/tanda-61-rezagados-y-usos.ts\` sobre lo común de \`${BASE}\`, desde \`${WEB}/\`. Reescribe \`materials.csv\`, \`material_doses.csv\` y \`material_descriptors.csv\` enteros: solo llena campos vacíos y añade filas; nada que ya tuviera valor cambia. Sin aprobar.*

**Por qué:** el usuario, 2026-11-19: «si sigue con la 2 y acepta las dosis de otras referencias» (V3-105).

**Cómo:** lectores Sonnet de uno en uno, por lotes de 10, leyendo cada página con \`pagina.py\` (la página se guarda y se lee su texto, no un resumen). **\`consolidar.py\` comprueba que cada frase citada está en la página guardada:** la que no está no entra (lista en \`no-usado-61.csv\` y en las notas). Familia, horas y fuerza, con las reglas de las tandas 46 y 60 (orden de referencias; si no coinciden, va la primera y el campo queda disputado). El uso, por V3-105: una fila por referencia (como mucho tres), con su base si la frase la dice; un rango da mínimo y máximo, una mediana de Fraterworks da el típico. El uso de un material diluido o de otra tintura no cuenta.

**Resultado:** ${filled} campos llenos en ${proposal.filter((p) => filledBy.has(p.id)).length} de ${proposal.length} materiales; ${newDoses.length} usos habituales en ${new Set(newDoses.map((d) => d.material_id)).size} materiales; ${newDescriptors.length} descriptores; ${disputedRows.length} campos disputados; ${unused.length} lecturas no usadas.

**Lo que no se buscó** (no aplica): el CAS de las bases (son mezclas) y la casa de las moléculas genéricas compradas en Maese Lab u Olfatorium, que no la nombran (bencilo, linalol, aldehídos…).

## Para mirar antes de aprobar

- **Casi todo lo que faltaba de los rezagados sigue faltando.** Para los de Harrison Joseph (4-propilfenol, Thialdine, Narcisse Oxyacetate…), las tinturas de Maese, la miel, la trufa y las bases de Perfumiarz no hay ninguna página que lo diga: Harrison Joseph solo da CAS y olor, y TGSC, la referencia que más dice, bloquea las lecturas (403). Queda «no lo dice».
- **Acetato de bornilo, hasta 9 % en el concentrado:** es la frase de recomendación de uso de TGSC («usage levels up to: 9.0000 % in the fragrance concentrate»), copiada por Perflavory; el lector creyó que era un tope de IFRA. Es la frase que la tanda 46 ya aceptaba como uso.
- **Rose Crystals:** 400 h (Fraterworks) frente a 300 h (PerfumersWorld): va la primera, disputado. Fraterworks nombra a VENTOS como proveedor, no como fabricante: la casa no se llena.
- **Cumin Nitrile, casa Synarome:** de un distribuidor indio («Make: Synarome»); Perflavory lo lista también con Givaudan como proveedor.
- **No entran:** los usos de la dilución (Levistamel 25 %, furfuril mercaptano 1 %, Ultravanil 80 %, Matcha Ketone 5 %), del Hercolyn D (no DW), del yuzu (su página no dice que sea destilado), de la tintura de canela al 25 % de Fraterworks y del Ambrettolide para el Scentolide; y las pautas de dilución («diluir al 5 % o 1 %»). Lista completa en \`no-usado-61.csv\`.

## Material por material

| n | Material | Se buscaba | Lo que se llena |
|---|---|---|---|
${lines.join("\n")}

## Disputados

| Material | Campo | Va | Otras |
|---|---|---|---|
${disputedRows.join("\n") || "| — | — | — | — |"}
`,
  "utf8",
);
console.log(`Tanda 61: ${filled} campos, ${newDoses.length} usos, ${newDescriptors.length} descriptores, ${disputedRows.length} disputados.`);
