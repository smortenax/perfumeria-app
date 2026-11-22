/**
 * Batch 64 (2026-11-22), common: the data of the 55 products of the Perfumiarz order of 2026-11-19, ready
 * before it arrives. The user, 2026-11-22: «Busca el último pedido de perfumiarz el que aún no está dado de
 * alta que tiene entre los componentes whool absolute y resina de Oman. Puesto que ya llegará dentro de poco
 * lo que quiero es que se prepare ya todos los datos para los materiales … como siempre primero ifra se mira
 * cuáles lo tienen público en perfumiarz y el resto de outsourscean y luego tienes que ir añadiendo todo el
 * resto de detalles como intensidad duración en tira... a los estándares de materiales de la app como siempre».
 *
 * From migracion-v3/web/info-64/ (consolidar.py): TGSC read by script (tgsc.py; it answers again), and the
 * documents of the same product published elsewhere when Perfumiarz does not publish its IFRA certificate
 * (ifra-fuera.csv, documentos.py). It fills only empty fields and adds rows; nothing that had a value
 * changes. Where TGSC gives another value, the field is marked disputed and the other value goes in the notes.
 *
 *   python3 -I migracion-v3/web/info-64/consolidar.py && node migracion-v3/tanda-64-pedido-19-nov.ts
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const TANDA = "64";
const BASE = process.env.BASE ?? execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/64-pedido-19-nov";
const WEB = "migracion-v3/web/info-64";
type Rec = Record<string, Cell>;

const table = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const local = (path: string) => (existsSync(path) ? (parseCsvRecords(readFileSync(path, "utf8")) as Record<string, string>[]) : []);
const materials = table("v3/datos/materials.csv");
const doses = table("v3/datos/material_doses.csv");
const descriptors = table("v3/datos/material_descriptors.csv");
const components = table("v3/datos/material_components.csv");
const lista = local(join(WEB, "lista.csv"));
const proposal = local(join(WEB, "propuesta-64.csv"));
const usos = local(join(WEB, "dosis-64.csv"));
const phys = local(join(WEB, "fisico-64.csv"));
const odors = local(join(WEB, "olores-64.csv"));
const differ = local(join(WEB, "distintos-64.csv"));
const unused = local(join(WEB, "no-usado-64.csv"));
const docs = local(join(WEB, "documentos-64.csv"));
const fuera = local(join(WEB, "ifra-fuera.csv"));
const empty = (v: Cell) => v === null || v === undefined || v === "";
const listOf = (v: Cell): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v.startsWith("[") ? (JSON.parse(v) as string[]) : []);
const byId = new Map(materials.rows.map((r) => [String(r.id), r]));
const byN = new Map(lista.map((x) => [x.n, x]));
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");
const pct = (v: string) => `${Number((Number(v) * 100).toPrecision(6))} %`;
const said = (source: string) => `${source}, by batch ${TANDA}`;
const filledBy = new Map<string, string[]>();
const tell = (id: string, t: string) => filledBy.set(id, [...(filledBy.get(id) ?? []), t]);
const note = (m: Rec, text: string) => (m.notes = `${m.notes ? `${m.notes}\n` : ""}${text}`);
const common = (id: string) => {
  const m = byId.get(id);
  if (!m || m.owner_id) throw new Error(`${id}: no es un común de ${BASE}`);
  return m;
};
let filled = 0;

// 1. Family, strength, hours: only where empty.
for (const p of proposal) {
  const m = common(p.id);
  for (const field of ["family", "strength", "tenacity_hours"]) {
    if (!p[field]) continue;
    if (!empty(m[field])) throw new Error(`${m.name}: ${field} ya tiene valor`);
    m[field] = p[field];
    if (field === "tenacity_hours") m.tenacity_source = said(p[`${field}_fuente`]);
    else if (field === "strength") m.strength_source = said(p[`${field}_fuente`]);
    else m.sources = `${m.sources ? `${m.sources} · ` : ""}family: ${said(p[`${field}_fuente`])}`;
    tell(p.id, `${field} = ${p[field]}`);
    filled++;
  }
}
// Where TGSC says otherwise than what the sheet has: the value stays, the field is disputed.
const disputedRows: string[] = [];
for (const d of differ) {
  const m = common(byN.get(d.n)!.material_id);
  m.disputed_fields = [...new Set([...listOf(m.disputed_fields), d.campo])];
  note(m, `Batch ${TANDA}, ${d.campo}: TGSC gives «${d.tgsc}» (${d.fuente_tgsc}); the sheet keeps «${d.tiene}».`);
  disputedRows.push(`| ${cell(String(m.name))} | ${d.campo} | ${d.tiene} | TGSC: ${d.tgsc} |`);
}

// 2. Physical data, only where empty.
const PHYS = ["appearance", "density", "molecular_weight", "formula", "vapor_pressure", "melting_point_c", "solubility"];
for (const p of phys) {
  const m = common(p.id);
  const got = PHYS.filter((f) => p[f]);
  for (const f of got) {
    if (!empty(m[f])) throw new Error(`${m.name}: ${f} ya tiene valor`);
    m[f] = p[f];
  }
  if (got.length) {
    m.physical_sources = `${m.physical_sources ? `${m.physical_sources} · ` : ""}${got.join(", ")}: ${said(p.fuente)}`;
    tell(p.id, `físicos (${got.join(", ")})`);
    filled += got.length;
  }
}

// 3. Usual use (V3-105) and odour.
const newDoses: Rec[] = usos.map((d, i) => {
  common(d.id);
  tell(d.id, `uso hasta ${pct(d.max)} (${d.basis})`);
  return {
    id: uuidFor(`dose:v3:tanda${TANDA}:${d.id}:${i}`), material_id: d.id, owner_id: null, min: null, typical: null, max: d.max,
    basis: d.basis, authority: "literature", source: d.fuente, disputed: false,
    notes: "TGSC's recommendation of use, not an IFRA limit (V3-105).",
  };
});
const newDescriptors: Rec[] = odors.map((o) => {
  common(o.id);
  return { id: uuidFor(`desc:v3:tanda${TANDA}:${o.id}`), material_id: o.id, owner_id: null, source: "TG", text: `TGSC: ${o.texto}` };
});
for (const o of odors) tell(o.id, "olor de TGSC");

// 4. The documents from elsewhere: constituents (literature) and the category 4 ceiling (for your version, V3-39).
const DOC = { alergenos: "EU allergens declaration", sds: "SDS, section 3", ifra: "IFRA certificate" } as Record<string, string>;
const docOk = new Map(docs.filter((d) => d.campo === "producto").map((d) => [`${d.n}:${d.url}`, d]));
const fraction = (v: string, unit: string) => Number((Number(v.replace(",", ".")) * (unit === "mg/kg" ? 1e-6 : 0.01)).toPrecision(6));
const newComponents: Rec[] = [];
const ceilings: string[] = [];
const docNotes = new Map<string, string[]>();
const dnote = (id: string, t: string) => docNotes.set(id, [...new Set([...(docNotes.get(id) ?? []), t])]);
const seen = new Set(components.rows.map((c) => `${c.material_id}:${c.component_cas || String(c.component_name ?? "").toLowerCase()}`));
for (const d of [...docs].sort((a, b) => (a.documento === "alergenos" ? 0 : 1) - (b.documento === "alergenos" ? 0 : 1))) {
  const x = byN.get(d.n);
  if (!x) continue;
  const m = common(x.material_id);
  const label = `${DOC[d.documento] ?? d.documento} by ${d.emisor || "?"} («${d.producto_doc}»), ${d.url}`;
  const ok = docOk.get(`${d.n}:${d.url}`);
  if (d.campo === "sin_texto") dnote(x.material_id, `${label}: the PDF has no text (scanned), not read`);
  if (d.campo === "producto" && d.estado === "no coincide") dnote(x.material_id, `${label}: ${d.frase} — not the same product, not used`);
  if (!ok || ok.estado === "no coincide") continue;
  if (d.campo === "tope_cat4") {
    const v = d.estado || `${d.valor} %`;
    dnote(x.material_id, `${label}, category 4: ${v} (the product's ceiling: it goes to your version when you have the bottle, V3-39)`);
    ceilings.push(`| ${d.n} | ${cell(String(m.name))} | ${v} | ${cell(d.emisor)} |`);
  }
  if (d.campo !== "componente" || m.kind === "molecule" || /\d\s*%/.test(d.producto_doc)) continue;
  if (d.cas && d.cas === m.cas) continue;
  const key = `${m.id}:${d.cas || d.nombre.toLowerCase()}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const amount = d.tipo === "range" ? { amount_kind: "range", value: null, min: fraction(d.min, d.unidad), max: fraction(d.max, d.unidad) }
    : d.tipo === "max" ? { amount_kind: "max", value: fraction(d.max, d.unidad), min: null, max: null }
    : { amount_kind: "exact", value: fraction(d.valor, d.unidad), min: null, max: null };
  newComponents.push({
    id: uuidFor(`component:v3:tanda${TANDA}:${key}`), material_id: m.id, component_id: null, component_cas: d.cas || null,
    component_name: d.nombre || null, ...amount, authority: "literature",
    source: `${label}, page ${d.pagina}: «${d.frase}»; a public document of the same product, not of the bottle bought; read by script (documentos.py); batch ${TANDA}`,
  });
}
const standardName = new Map(table("v3/datos/ifra_standards.csv").rows.map((r) => [String(r.id), String(r.name)]));
const ifraNames = new Map(table("v3/datos/ifra_substances.csv").rows.map((r) => [String(r.cas), standardName.get(String(r.standard_id)) ?? ""]));
for (const c of newComponents) {
  if (c.component_name || !c.component_cas) continue;
  const cas = String(c.component_cas);
  c.component_name = (docs.find((d) => d.cas === cas && d.nombre)?.nombre ??
    materials.rows.find((m) => !m.owner_id && (m.cas === cas || listOf(m.other_cas).includes(cas)))?.name ?? ifraNames.get(cas) ?? null) as Cell;
}
const unnamed = newComponents.filter((c) => !String(c.component_name ?? "").trim());
if (unnamed.length) throw new Error(`Constituyentes sin nombre: ${unnamed.map((c) => c.component_cas).join(", ")}`);
for (const c of newComponents) tell(String(c.material_id), "constituyente");
for (const [id, notes] of docNotes) note(byId.get(id)!, `Batch ${TANDA}, documents from elsewhere: ${notes.join("; ")}.`);
for (const u of unused) note(common(byN.get(u.n)!.material_id), `Batch ${TANDA}, TGSC read and not used: ${u.campo} «${u.valor}» (${u.motivo}).`);

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
mkdirSync(OUT, { recursive: true });
writeTable(join(OUT, "materials.csv"), materials.header, asCells(materials.rows));
writeTable(join(OUT, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...newDoses]);
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);
writeTable(join(OUT, "material_components.csv"), components.header, [...asCells(components.rows), ...newComponents]);

// The report.
const compCount = new Map<string, number>();
for (const c of components.rows) if (!c.owner_id) compCount.set(String(c.material_id), (compCount.get(String(c.material_id)) ?? 0) + 1);
for (const c of newComponents) compCount.set(String(c.material_id), (compCount.get(String(c.material_id)) ?? 0) + 1);
const ifraLines = lista.map((x) => {
  const f = fuera.filter((r) => r.n === x.n && r.url);
  const outside = f.length ? f.map((r) => `${r.tipo} de ${cell(r.emisor || "?")}`).join("; ") : x.ifra_perfumiarz ? "—" : "no encontrado";
  const basis = x.tipo === "molecule" ? x.base_ifra : `${x.base_ifra.replace("constituyentes", "").replace(/^ \+ /, "") || ""}${compCount.get(x.material_id) ? `${x.base_ifra.includes("anexo") || x.base_ifra.includes("CAS en") ? " + " : ""}${compCount.get(x.material_id)} constituyentes` : ""}` || "nada";
  return `| ${x.n} | ${cell(x.producto)} | ${x.ifra_perfumiarz ? "sí" : "no"} | ${outside} | ${basis} |`;
});
const lines = lista.map((x) => `| ${x.n} | ${cell(x.nombre)} | ${x.buscar || "—"} | ${cell((filledBy.get(x.material_id) ?? []).join("; ")) || "—"} |`);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 64 · El pedido de Perfumiarz del 19-nov, preparado antes de que llegue

*Generada por \`migracion-v3/tanda-64-pedido-19-nov.ts\` sobre lo común de \`${BASE}\`, desde \`${WEB}/\`. Reescribe \`materials.csv\`, \`material_doses.csv\`, \`material_descriptors.csv\` y \`material_components.csv\` enteros: solo llena campos vacíos y añade filas; nada que ya tuviera valor cambia. Sin aprobar.*

**Por qué:** el usuario, 2026-11-22: «Busca el último pedido de perfumiarz el que aún no está dado de alta que tiene entre los componentes whool absolute y resina de Oman. Puesto que ya llegará dentro de poco lo que quiero es que se prepare ya todos los datos para los materiales…». Es el pedido del 19-nov (laboratorio, rama \`claude/perfumes-navidad\`, \`operaciones/compras/2026-11-19-pedido-perfumiarz.md\`: 55 artículos, «Pendiente de llegar y de dar de alta»). Su «resina de Omán» es el **Olibanum Oil (Oman)** de Biolandes, el aceite esencial (el pedido no lleva resina ni resinoide). Lo común de los 55 ya entró en las tandas 57 y 60 a 63; esta tanda completa lo que faltaba. **Tus frascos (la cuenta) no entran aquí:** se dan de alta cuando lleguen, con su lote, y ahí van los topes de categoría 4 (V3-39).

**Cómo:**
- **IFRA, primero.** Qué certificado publica Perfumiarz en la página de cada producto (tanda 60, \`fichas.csv\`); para los que no, un lector Sonnet buscó el certificado IFRA, la declaración de alérgenos o la SDS **del mismo producto** en otra web (\`ifra-fuera.csv\`), y \`documentos.py\` los bajó y leyó por script con las reglas de la tanda 60. Sus constituyentes entran como literatura (documento público, no de tu frasco: la app dirá «acotado», nunca «dentro»); de una molécula no se toman (su IFRA sale de su CAS, V3-35). Un documento de la dilución de fábrica no da cifras.
- **TGSC vuelve a responder** (2026-11-22; daba 403 en las tandas 60 a 62). \`tgsc.py\` lee la ficha de cada molécula por script (el id, de Pyrfume por CAS exacto; la ficha tiene que dar ese CAS) y la de los naturales que el lector comprobó (especie y forma). Tipo de olor → familia, «Odor Strength» → fuerza, «Substantivity … at 100.00 %» → horas en tira, «usage levels up to … in the fragrance concentrate» → uso (V3-105), aspecto, densidad, solubilidad, peso molecular, fórmula, presión de vapor; y la descripción de olor. \`consolidar.py\` comprueba que cada frase está en la página guardada.
- **La intensidad (impacto, V3-97)** solo sale de PerfuMate (tanda 44 y 60): no hay más impactos que leer. Los que faltan siguen sin impacto.

**Resultado:** ${filled} campos llenos; ${newDoses.length} usos; ${newDescriptors.length} descriptores; ${newComponents.length} constituyentes; ${disputedRows.length} campos disputados (TGSC dice otra cosa que la ficha); ${unused.length} lecturas no usadas.

## IFRA, producto por producto

«Base IFRA» es por dónde llega la app a IFRA: el CAS de la molécula (V3-35; «sin estándar» = IFRA no lo restringe), el anexo de IFRA para el natural (por su CAS) o sus constituyentes.

| n | Producto | Certificado en Perfumiarz | De fuera | Base IFRA |
|---|---|---|---|---|
${ifraLines.join("\n")}

## Topes de categoría 4 de los documentos de fuera (para tu versión, V3-39)

| n | Material | Tope | Emisor |
|---|---|---|---|
${ceilings.join("\n") || "| — | — | — | — |"}

## Disputados (TGSC frente a lo que ya había; el valor no cambia)

| Material | Campo | Se queda | Otra |
|---|---|---|---|
${disputedRows.join("\n") || "| — | — | — | — |"}

## Material por material

| n | Material | Faltaba | Lo que se llena |
|---|---|---|---|
${lines.join("\n")}
`,
  "utf8",
);
console.log(`Tanda ${TANDA}: ${filled} campos, ${newDoses.length} usos, ${newDescriptors.length} descriptores, ${newComponents.length} constituyentes, ${disputedRows.length} disputados.`);
