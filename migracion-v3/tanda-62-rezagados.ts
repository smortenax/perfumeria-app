/**
 * Batch 62: the stragglers. Materials you already have with gaps (migracion-v3/fichas-incompletas/), the
 * nine with most gaps that are filled in the common material (family, house, CAS, usual use, tenacity,
 * strength, descriptors). The bandeja del laboratorio, 2026-11-18: «listar todas las fichas incompletas de
 * los materiales que el usuario ya tiene»; the user, 2026-11-19: «empieza la línea de información».
 * Product and documents are your bottle's: they do not come from the web.
 *
 * Reads migracion-v3/web/rezagados/propuesta-62.csv (consolidar.py with the rules of batches 46, 47 and
 * 60, from web-61-*.csv and PerfuMate). Only empty fields of the common material are filled.
 *
 *   node migracion-v3/web/rezagados/lista.ts 9 && python3 -I migracion-v3/web/info-18-nov/consolidar.py 62 migracion-v3/web/rezagados && node migracion-v3/tanda-62-rezagados.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const TANDA = "62";
// BASE=<commit> regenerates the batch on the data it was made on (once approved, HEAD already holds it).
const BASE = process.env.BASE ?? execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/62-rezagados";
const WEB = "migracion-v3/web/rezagados";
type Rec = Record<string, Cell>;

const table = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = table("v3/datos/materials.csv");
const doses = table("v3/datos/material_doses.csv");
const descriptors = table("v3/datos/material_descriptors.csv");
const proposal = parseCsvRecords(readFileSync(join(WEB, "propuesta-62.csv"), "utf8")) as Record<string, string>[];
const lista = new Map((parseCsvRecords(readFileSync(join(WEB, "lista.csv"), "utf8")) as Record<string, string>[]).map((r) => [r.id, r]));
const empty = (v: Cell) => v === null || v === undefined || v === "";
const listOf = (v: Cell): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v.startsWith("[") ? (JSON.parse(v) as string[]) : []);
const byId = new Map(materials.rows.map((r) => [String(r.id), { ...r }]));
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");

const newDoses: Rec[] = [];
const newDescriptors: Rec[] = [];
const filledBy = new Map<string, string[]>();
const disputedRows: string[] = [];
let filled = 0;
const fill = (m: Rec, id: string, field: string, value: string, source: string, disputed: boolean, others: string, rule: string) => {
  if (!empty(m[field])) return;
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
  filledBy.set(id, [...(filledBy.get(id) ?? []), `${field} = ${value}${disputed ? " (disputado)" : ""}`]);
  filled++;
};
for (const p of proposal) {
  const m = byId.get(p.id);
  if (!m || m.owner_id) throw new Error(`${p.nombre}: no es un común`);
  for (const f of ["family", "tier", "tenacity_hours", "strength", "physical_state"]) if (p[f]) fill(m, p.id, f, p[f], p[`${f}_fuente`], p[`${f}_disputado`] === "si", p[`${f}_otras`], p[`${f}_regla`]);
  if (p.impacto) fill(m, p.id, "impact", p.impacto, p.impacto_fuente, p.impacto_disputado === "si", p.impacto_otras, "PerfuMate has more than one sheet of the same material");
  // The house of a straggler: only from its user's shop (that is the bottle bought), never another shop's product.
  const shop = (lista.get(p.id)?.proveedor ?? "").replace(/\s*\(.*\)$/, "").toLowerCase();
  if (p.casa && shop && p.casa_fuente.toLowerCase().startsWith(shop)) fill(m, p.id, "house", p.casa, p.casa_fuente, false, "", "");
  else if (p.casa) m.notes = `${m.notes ? `${m.notes}\n` : ""}Batch ${TANDA}, house not used (another shop's product, not your bottle from ${lista.get(p.id)?.proveedor}): ${p.casa_fuente}.`;
  if (p.cas_nuevo && m.kind === "molecule") fill(m, p.id, "cas", p.cas_nuevo, p.cas_fuente, false, "", "");
  for (const [field, what] of [["casa_conflicto", "house"], ["cas_conflicto", "cas"]] as const) {
    if (!p[field]) continue;
    m.disputed_fields = [...new Set([...listOf(m.disputed_fields), what])];
    m.notes = `${m.notes ? `${m.notes}\n` : ""}Batch ${TANDA}, ${what} in dispute: ${p[field]}.`;
    disputedRows.push(`| ${cell(String(m.name))} | ${what} | ${cell(String(m[what]))} (se queda) | ${cell(p[field])} |`);
  }
  if (p.dose && !doses.rows.some((d) => d.material_id === p.id)) {
    const [max, basis] = p.dose.split("|");
    newDoses.push({
      id: uuidFor(`dose:v3:tanda${TANDA}:${p.id}`), material_id: p.id, owner_id: null, min: null, typical: null, max, basis,
      authority: "literature", source: p.dose_fuente, disputed: p.dose_disputado === "si",
      notes: `Observed or recommended use, not an IFRA limit.${p.dose_otras ? ` Other references: ${p.dose_otras}.` : ""}`,
    });
    filledBy.set(p.id, [...(filledBy.get(p.id) ?? []), `uso hasta ${Number((Number(max) * 100).toFixed(4))} %`]);
  }
  for (const [i, [site, text]] of (JSON.parse(p.olores) as [string, string, string][]).entries())
    if (!descriptors.rows.some((d) => d.material_id === p.id && String(d.text).split(":").slice(1).join(":").trim().toLowerCase() === text.trim().toLowerCase()))
      newDescriptors.push({ id: uuidFor(`desc:v3:tanda${TANDA}:${p.id}:${i}`), material_id: p.id, owner_id: null, source: "web", text: `${site}: ${text}` });
  if (p.no_usado) m.notes = `${m.notes ? `${m.notes}\n` : ""}Batch ${TANDA}, not used (another CAS, species, process or product, or not literal): ${p.no_usado}.`;
}

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, asCells(materials.rows.map((r) => byId.get(String(r.id))!)));
writeTable(join(OUT, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...newDoses]);
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);
const lines = proposal.map((p) => `| ${cell(p.nombre)} | ${cell(lista.get(p.id)?.faltan ?? "")} | ${cell((filledBy.get(p.id) ?? []).join("; ")) || "—"} |`);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda ${TANDA} · Los rezagados: los materiales que tienes con más huecos

*Generada por \`migracion-v3/tanda-62-rezagados.ts\` sobre lo común de \`${BASE}\` (con las tandas 60 y 61 ya aprobadas), desde \`${WEB}/\`. Escribe \`v3/datos/materials.csv\`, \`material_doses.csv\` y \`material_descriptors.csv\` enteros: solo llena campos vacíos del material común y añade filas. Sin aprobar.*

**Por qué:** bandeja del laboratorio, 2026-11-18: «listar todas las fichas incompletas de los materiales que el usuario ya tiene»; el usuario, 2026-11-19: «empieza la línea de información».

**Cómo:** \`${WEB}/lista.ts\` toma de \`migracion-v3/fichas-incompletas/\` los ${proposal.length} con más huecos que se llenan en lo común (familia, fabricante, CAS, uso, duración, fuerza, descriptores). **El producto y los documentos son de tu frasco:** no salen de la web y siguen vacíos. Lectura web y reglas, las de la tanda 60 (TGSC no responde; un subagente Sonnet; \`consolidar.py\`): frase literal, una página de otro CAS u otra forma no cuenta (el aceite no vale para una tintura), disputados si no coinciden, impacto solo de PerfuMate y del mismo material (V3-97).

**Resultado:** ${filled} campos llenos; ${newDoses.length} usos habituales; ${newDescriptors.length} descriptores; ${disputedRows.length} disputados.

**Por qué es la 62:** esta lectura se aprobó como «tanda 61» (el usuario, 2026-11-19: «Apruebo la 61, fusiona y publica»), pero otra sesión ya había fusionado su propia tanda 61 (\`61-rezagados-y-usos\`, PR #80, que leyó 32 rezagados). Rehecha sobre ese \`main\`, solo llena lo que la otra dejó vacío y no repite sus descriptores.

**Para mirar antes de aprobar:**

- **Por qué se llena tan poco:** de estos 18, casi nadie publica ficha. Para los de Harrison Joseph solo hay páginas de Parchem (un distribuidor, sin casa, horas ni dosis); las tinturas y esencias de Maese Lab solo tienen la página de Maese (nivel y olor). TGSC, que daría horas y usos, devuelve 403 a las lecturas automáticas. Lo que queda vacío sigue en \`migracion-v3/fichas-incompletas/\`.
- **El cardamomo villoso (*Amomum villosum*):** el primer lector tomó la tintura de cardamomo negro de Maese por la tuya; el usuario, 2026-11-19: «tambien tienen cardamomo villoso tienen blanco verde villoso y negro». Su página (\`maeselab.com/cardamomo-villoso-semilla-perfumeria/\`) confirma la especie («Amomum Villosum Seed Extract», semilla, Java, 96°), pero no da olor, uso ni duración.
- **El fabricante** solo se toma de la ficha de la tienda donde compraste el frasco (3,4-xilenol, Perfumiarz → Sigma Aldrich). El KAO del aldehído hexilcinámico es el producto de Perfumiarz y tu frasco es de Maese Lab: no se usa.
- **Las horas de otra tintura** (ámbar gris 2 % y ambreta 20 % de Fraterworks) no valen para las de Maese Lab, de concentración desconocida: no se usan. El cypriol de Fraterworks es la misma especie (*Cyperus scariosus*) con otro CAS (91771-62-9): sus horas entran y el CAS queda en disputa.

| Material | Le faltaba | Lo que se llena |
|---|---|---|
${lines.join("\n")}

## Disputados

| Material | Campo | Va | Otras referencias |
|---|---|---|---|
${disputedRows.join("\n") || "| — | | | |"}
`,
  "utf8",
);
console.log(`Tanda ${TANDA}: ${filled} campos, ${newDoses.length} dosis, ${newDescriptors.length} descriptores, ${disputedRows.length} disputados.`);
