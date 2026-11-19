/**
 * Batch 60: the information line of the arrivals of 2026-11-18. The 44 common materials that batch 57
 * added half-done (the Maese Lab cinnamon tincture and 43 Perfumiarz products) get the fields they lacked.
 * The user, 2026-11-19: «Apruebo 57, 58 y 59, empieza la línea de información» and «empieza el thread
 * separado de la info».
 *
 * Reads:
 * - migracion-v3/web/info-18-nov/propuesta-60.csv (consolidar.py: what was read on the web, web-60-*.csv,
 *   with the literal phrase; the Perfumiarz page; PerfuMate). Only empty fields are filled: family,
 *   tenacity_hours, strength, impact (PerfuMate, same material only, V3-97), house, CAS; physical_state; a
 *   usual use («up to X % in the fragrance concentrate») goes to material_doses; the odour descriptions to
 *   material_descriptors. Where the references disagree, the field goes to disputed_fields.
 * - migracion-v3/web/info-18-nov/documentos.csv (extraer.py: the manufacturer's documents that Perfumiarz
 *   links, read by script). Their constituents go to material_components as literature: the document is
 *   the manufacturer's, not the bottle bought (as batches 29 and 51). Not used: a document of another
 *   product, a factory dilution's document (the common is the pure material), the material's own CAS, a
 *   scanned PDF. The certificate's category-4 ceiling is the product's and goes to your version (V3-39):
 *   it is listed, not written.
 *
 *   python3 -I migracion-v3/web/info-18-nov/consolidar.py && node migracion-v3/tanda-60-info-altas-18-nov.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const TANDA = "60";
const BASE = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/60-info-altas-18-nov";
const WEB = "migracion-v3/web/info-18-nov";
type Rec = Record<string, Cell>;

const table = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const local = (path: string) => parseCsvRecords(readFileSync(path, "utf8")) as Record<string, string>[];
const materials = table("v3/datos/materials.csv");
const doses = table("v3/datos/material_doses.csv");
const descriptors = table("v3/datos/material_descriptors.csv");
const components = table("v3/datos/material_components.csv");
const proposal = local(join(WEB, "propuesta-60.csv"));
const docs = local(join(WEB, "documentos.csv"));
const fichas = new Map(local("migracion-v3/web/perfumiarz-pedido-18-nov/fichas.csv").map((f) => [f.n, f]));
const empty = (v: Cell) => v === null || v === undefined || v === "";
const listOf = (v: Cell): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v.startsWith("[") ? (JSON.parse(v) as string[]) : []);
const byId = new Map(materials.rows.map((r) => [String(r.id), { ...r }]));
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");

// 1. The sheet: empty fields only.
const FIELDS: [string, string][] = [["family", "family"], ["tenacity_hours", "tenacity_hours"], ["strength", "strength"], ["physical_state", "physical_state"]];
const newDoses: Rec[] = [];
const newDescriptors: Rec[] = [];
const filledBy = new Map<string, string[]>();
const disputedRows: string[] = [];
let filled = 0;
const fill = (m: Rec, p: Record<string, string>, field: string, value: string, source: string, disputed: boolean, others: string, rule: string) => {
  if (!empty(m[field])) throw new Error(`${m.name}: ${field} ya tiene valor`);
  m[field] = value;
  const said = `${source}, by batch ${TANDA}`;
  if (field === "tenacity_hours") m.tenacity_source = said;
  else if (field === "strength") m.strength_source = said;
  else if (field === "impact") m.impact_source = said;
  else m.sources = `${m.sources ? `${m.sources} · ` : ""}${field}: ${said}`;
  if (disputed) {
    m.disputed_fields = [...new Set([...listOf(m.disputed_fields), field])];
    disputedRows.push(`| ${cell(String(m.name))} | ${field} | ${cell(value)} | ${cell(others)} |`);
  }
  if (others) m.notes = `${m.notes ? `${m.notes}\n` : ""}Batch ${TANDA}, ${field}: ${rule}. Other references: ${others}.`;
  filledBy.set(p.id, [...(filledBy.get(p.id) ?? []), `${field} = ${value}${disputed ? " (disputado)" : ""}`]);
  filled++;
};
for (const p of proposal) {
  const m = byId.get(p.id);
  if (!m || m.owner_id) throw new Error(`${p.nombre}: no es un común de ${BASE}`);
  for (const [field] of FIELDS) if (p[field]) fill(m, p, field, p[field], p[`${field}_fuente`], p[`${field}_disputado`] === "si", p[`${field}_otras`], p[`${field}_regla`]);
  if (p.impacto) fill(m, p, "impact", p.impacto, p.impacto_fuente, p.impacto_disputado === "si", p.impacto_otras, "PerfuMate has more than one sheet of the same material");
  if (p.casa) fill(m, p, "house", p.casa, p.casa_fuente, false, "", "");
  if (p.cas_nuevo) fill(m, p, "cas", p.cas_nuevo, p.cas_fuente, false, "", "");
  if (p.dose) {
    const [max, basis] = p.dose.split("|");
    newDoses.push({
      id: uuidFor(`dose:v3:tanda${TANDA}:${p.id}`), material_id: p.id, owner_id: null, min: null, typical: null, max, basis,
      authority: "literature", source: p.dose_fuente, disputed: p.dose_disputado === "si",
      notes: `Observed or recommended use, not an IFRA limit.${p.dose_otras ? ` Other references: ${p.dose_otras}.` : ""}`,
    });
    filledBy.set(p.id, [...(filledBy.get(p.id) ?? []), `uso hasta ${Number((Number(max) * 100).toFixed(4))} %`]);
  }
  for (const [i, [site, text]] of (JSON.parse(p.olores) as [string, string, string][]).entries())
    newDescriptors.push({ id: uuidFor(`desc:v3:tanda${TANDA}:${p.id}:${i}`), material_id: p.id, owner_id: null, source: site.startsWith("TGSC") ? "TG" : "web", text: `${site}: ${text}` });
  if (p.no_usado) m.notes = `${m.notes ? `${m.notes}\n` : ""}Batch ${TANDA}, not used (another CAS, species, process or product): ${p.no_usado}.`;
}

// 2. What the manufacturer's documents say the material contains.
const proposalByN = new Map(proposal.map((p) => [p.n, p]));
const DOC = { alergenos: "EU allergens declaration", sds: "SDS, section 3", ifra: "IFRA certificate", coa: "certificate of analysis" } as Record<string, string>;
const docOk = new Map(docs.filter((d) => d.campo === "producto").map((d) => [`${d.n}:${d.documento}`, d]));
const diluted = (n: string) => /\d\s*%/.test(fichas.get(n)?.producto ?? "");
const fraction = (v: string, unit: string) => Number((Number(v.replace(",", ".")) * (unit === "mg/kg" ? 1e-6 : 0.01)).toPrecision(6));
const newComponents: Rec[] = [];
const docNotes = new Map<string, string[]>();
const note = (n: string, t: string) => docNotes.set(n, [...new Set([...(docNotes.get(n) ?? []), t])]);
const seen = new Set<string>();
for (const d of [...docs].sort((a, b) => (a.documento === "alergenos" ? 0 : 1) - (b.documento === "alergenos" ? 0 : 1))) {
  const p = proposalByN.get(d.n);
  if (!p) continue;
  const m = byId.get(p.id)!;
  const label = `${DOC[d.documento] ?? d.documento}`;
  if (d.campo === "sin_texto") note(d.n, `${label}: the PDF has no text (scanned), not read`);
  if (d.campo === "producto" && d.estado === "no coincide" && (m.kind !== "molecule" || d.documento !== "sds"))
    note(d.n, `${label}: ${d.frase} — another product's document (or it does not say), not used`);
  if (d.campo === "tope_cat4") note(d.n, `${label}, category 4: ${d.estado || `${d.valor} %`} (the product's ceiling: it goes to your version when you have the bottle, V3-39)`);
  if (d.campo !== "componente") continue;
  const ok = docOk.get(`${d.n}:${d.documento}`);
  if (!ok || ok.estado === "no coincide") continue;
  if (diluted(d.n)) {
    note(d.n, `${label}: the document is of the factory dilution («${fichas.get(d.n)!.producto}»), not of the pure material; its figures are not used`);
    continue;
  }
  if (d.cas && d.cas === m.cas) continue;
  const key = `${p.id}:${d.cas || d.nombre.toLowerCase()}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const amount = d.tipo === "range" ? { amount_kind: "range", value: null, min: fraction(d.min, d.unidad), max: fraction(d.max, d.unidad) }
    : d.tipo === "max" ? { amount_kind: "max", value: null, min: null, max: fraction(d.max, d.unidad) }
    : { amount_kind: "exact", value: fraction(d.valor, d.unidad), min: null, max: null };
  newComponents.push({
    id: uuidFor(`component:v3:tanda${TANDA}:${key}`), material_id: p.id, component_id: null, component_cas: d.cas || null,
    component_name: d.nombre || null, ...amount, authority: "literature",
    source: `${m.house ?? "The manufacturer"}, ${label} («${d.producto_doc}»), ${d.url}, page ${d.pagina}: «${d.frase}»; the manufacturer's document linked by Perfumiarz, not the bottle bought; read by script (extraer.py); batch ${TANDA}`,
  });
}
// A component of the SDS without a name takes it from the allergens row of the same CAS, if any.
// Otherwise from the common material or the IFRA substance with that CAS.
const standardName = new Map(table("v3/datos/ifra_standards.csv").rows.map((r) => [String(r.id), String(r.name)]));
const ifraNames = new Map(table("v3/datos/ifra_substances.csv").rows.map((r) => [String(r.cas), standardName.get(String(r.standard_id)) ?? ""]));
const nameOfCas = (cas: string) =>
  docs.find((d) => d.cas === cas && d.nombre)?.nombre ??
  materials.rows.find((m) => !m.owner_id && (m.cas === cas || listOf(m.other_cas).includes(cas)))?.name ??
  ifraNames.get(cas) ?? null;
for (const c of newComponents) if (!c.component_name && c.component_cas) c.component_name = nameOfCas(String(c.component_cas)) as Cell;
for (const [n, notes] of docNotes) {
  const m = byId.get(proposalByN.get(n)!.id)!;
  m.notes = `${m.notes ? `${m.notes}\n` : ""}Batch ${TANDA}, documents: ${notes.join("; ")}.`;
}

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, asCells(materials.rows.map((r) => byId.get(String(r.id))!)));
writeTable(join(OUT, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...newDoses]);
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);
writeTable(join(OUT, "material_components.csv"), components.header, [...asCells(components.rows), ...newComponents]);

const compBy = new Map<string, number>();
for (const c of newComponents) compBy.set(String(c.material_id), (compBy.get(String(c.material_id)) ?? 0) + 1);
const still = (p: Record<string, string>) => {
  const m = byId.get(p.id)!;
  return ["family", "tenacity_hours", "strength", "impact", "house", "cas"].filter((f) => empty(m[f]) && !(f === "cas" && m.kind !== "molecule")).join(", ");
};
const lines = proposal.map((p) => `| ${p.n} | ${cell(p.nombre)} | ${cell((filledBy.get(p.id) ?? []).join("; ")) || "—"} | ${compBy.get(p.id) ?? "—"} | ${still(p) || "—"} |`);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda ${TANDA} · La línea de información de las altas del 18-nov

*Generada por \`migracion-v3/tanda-60-info-altas-18-nov.ts\` sobre lo común de \`${BASE}\` (con la tanda 57 ya aprobada), desde \`${WEB}/\`. Escribe \`v3/datos/materials.csv\`, \`material_doses.csv\`, \`material_descriptors.csv\` y \`material_components.csv\` enteros: solo llena campos vacíos y añade filas; nada que ya tuviera valor cambia. Sin aprobar.*

**Por qué:** el usuario, 2026-11-19: «Apruebo 57, 58 y 59, empieza la línea de información» y «empieza el thread separado de la info». Los 44 comunes de la tanda 57 entraron a medias (sin familia, duración, dosis, composición, descriptores ni impacto).

**Cómo:**

- **La ficha:** para cada material se leyeron hasta tres páginas de referencia (TGSC primero y una independiente: la casa, Fraterworks, Perfumer's Apprentice…; \`${WEB}/web-60-*.csv\`, con la frase literal) y PerfuMate en local. \`consolidar.py\` elige con las reglas de las tandas 46 y 47: orden de referencias y, si no coinciden, va la primera y el campo queda disputado. Una página de otro CAS, otra especie u otro proceso no cuenta. **El impacto**, solo de PerfuMate y cuando es el mismo material (V3-97): una molécula por su CAS; un natural o una base, por nombre y casa. La descripción de olor de Perfumiarz («Zapach: …», en polaco) entra como descriptor, citada.
- **La composición:** \`bajar.py\` baja los documentos del fabricante que enlaza cada página de Perfumiarz (SDS, IFRA, alérgenos, CoA; no se guardan en Git) y \`extraer.py\` lee sus cifras por script, con la página y la línea literal (\`${WEB}/documentos.csv\`). Entran como literatura (documento del fabricante, no del frasco comprado, como en las tandas 29 y 51): la app dirá «acotado», nunca «dentro». Si un alérgeno sale en la declaración y en la SDS, va la cifra de la declaración.

**Resultado:** ${filled} campos llenos; ${newDoses.length} usos habituales; ${newDescriptors.length} descriptores; ${newComponents.length} constituyentes en ${compBy.size} materiales; ${disputedRows.length} campos disputados.

**Para mirar antes de aprobar:**

- **Documentos equivocados en Perfumiarz:** el script compara el producto que nombra cada documento con el de la página. Los que no coinciden no se usan (lista abajo y en las notas de cada material).
- **Diluidos de fábrica** (2-metilpirazina 5 %, Ultravanil 80 %, Cinnamalva 50 %…): sus documentos son de la dilución, y lo común es el material puro: no se usan sus cifras.
- **Topes del fabricante (categoría 4 del certificado IFRA):** son del producto, así que van a tu versión cuando tengas el frasco (V3-39); aquí solo se apuntan en las notas. IFRA no se escribe: la app lo lee por el CAS de la capa de IFRA (V3-35).
- **La familia** sale de la palabra de la referencia («Odor Type: woody» → woody, por \`family_palette.csv\`): es una lectura de la sesión.

| n | Material | Lo que se llena | Constituyentes | Sigue vacío |
|---|---|---|---|---|
${lines.join("\n")}

## Disputados

| Material | Campo | Va | Otras referencias |
|---|---|---|---|
${disputedRows.join("\n") || "| — | | | |"}

## Documentos que no se usan

| n | Material | Qué |
|---|---|---|
${[...docNotes].flatMap(([n, ns]) => ns.filter((t) => !/category 4/.test(t)).map((t) => `| ${n} | ${cell(proposalByN.get(n)!.nombre)} | ${cell(t)} |`)).join("\n") || "| — | | |"}

## Topes de categoría 4 de los certificados (para tu versión, V3-39)

| n | Material | Tope |
|---|---|---|
${[...docNotes].flatMap(([n, ns]) => ns.filter((t) => /category 4/.test(t)).map((t) => `| ${n} | ${cell(proposalByN.get(n)!.nombre)} | ${cell(t.replace(/^IFRA certificate, category 4: /, "").replace(/ \(the product's ceiling.*$/, ""))} |`)).join("\n") || "| — | | |"}
`,
  "utf8",
);
console.log(`Tanda ${TANDA}: ${filled} campos, ${newDoses.length} dosis, ${newDescriptors.length} descriptores, ${newComponents.length} constituyentes, ${disputedRows.length} disputados.`);
