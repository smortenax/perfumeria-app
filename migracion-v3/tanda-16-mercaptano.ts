/**
 * Batch 16 (2026-10-15): the Phenylethyl Mercaptan, which batch 13 left out because it had not
 * arrived. The user: «un matiz mercaptan si ha llegado se habia traspapelado de ahi la confusion».
 * Into the common data as batch 13 did (its name without the % it is bought at, its CAS cited, a
 * category of its own) and with its information table as batch 14 did (migracion-v3/web/fichas-16.csv:
 * The Good Scents Company, each value with its sentence; family, its detail, facets, tier and role
 * are the session's proposals). TGSC says «not for fragrance use»: no dose. Made from the common
 * data as batch 15 left it (76672ac), so that redoing it gives the same tables.
 *
 *   node migracion-v3/tanda-16-mercaptano.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = "76672ac";
const OUT = "migracion-v3/tandas/16-mercaptano";
const FOUND = "migracion-v3/web/fichas-16.csv";
type Rec = Record<string, Cell>;
const read = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = read("v3/datos/materials.csv");
const categories = read("v3/datos/material_categories.csv");
const descriptors = read("v3/datos/material_descriptors.csv");
const found = parseCsvRecords(readFileSync(FOUND, "utf8"));

const NAME = "Phenylethyl Mercaptan";
const CAS = "4410-99-5";
if (materials.rows.some((r) => r.cas === CAS)) throw new Error(`El CAS ${CAS} ya lo tiene un material común`);
const category = uuidFor(`cat:v3:cas:${CAS}`);
const m: Rec = Object.fromEntries(materials.header.map((c) => [c, null]));
Object.assign(m, {
  id: uuidFor("comun:tanda13:phenylethyl-mercaptan"),
  name: NAME,
  kind: "molecule",
  solvent: false,
  aliases: ["2-Phenylethanethiol", "Phenethyl mercaptan", "2-Phenethyl mercaptan", "Phenylethyl Mercaptan 0.1%"],
  cas: CAS,
  other_cas: [],
  category_id: category,
  disputed_fields: [],
  sources:
    "web: Spectrum Chemical, https://www.spectrumchemical.com/cas/4410-99-5 (2-Phenylethanethiol), y TCI P1715; consultado 2026-10-15 · web: The Good Scents Company (tanda 16)",
  confidence: "high",
  notes: "Alta del 2026-10-15 (tanda 16; no entró en la 13 porque se había traspapelado). Ficha de The Good Scents Company.",
});

const COLUMNS = new Set(["physical_state", "appearance", "density", "vapor_pressure", "solubility", "formula", "molecular_weight", "handling", "family", "family_detail", "facets", "tier", "role"]);
const ENUMS: Record<string, readonly string[]> = {
  family: ["citrus", "green", "ozonic", "floral", "fruity", "spicy", "woody", "animal", "transformed"],
  tier: ["top", "top_heart", "heart", "heart_base", "base"],
  role: ["modifier", "structure", "fixative", "trace", "bridge", "booster"],
};
const newDescriptors: Rec[] = [];
for (const r of found) {
  if (r.material !== NAME || !r.url || !r.frase) throw new Error(`${r.material} ${r.campo}: fila incompleta`);
  if (COLUMNS.has(r.campo)) {
    if (ENUMS[r.campo] && !ENUMS[r.campo].includes(r.valor)) throw new Error(`${r.campo}: «${r.valor}» no es un valor admitido`);
    m[r.campo] = r.valor;
    if (["physical_state", "appearance", "density", "vapor_pressure", "solubility", "formula", "molecular_weight"].includes(r.campo)) m.physical_sources = `web: TGSC, ${r.url}`;
  } else if (r.campo === "descriptor") {
    newDescriptors.push({ id: uuidFor(`desc:v3:tanda16:${m.id}:${r.valor}`), material_id: m.id, owner_id: null, source: "TG", text: r.valor });
  } else {
    throw new Error(`campo desconocido «${r.campo}»`);
  }
}

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, [...asCells(materials.rows), m]);
writeTable(join(OUT, "material_categories.csv"), categories.header, [...asCells(categories.rows), { id: category, name: NAME, aliases: [] }]);
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);
const cell = (t: string) => t.replace(/\|/g, "/");
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 16 · Phenylethyl Mercaptan, en lo común y con su ficha

*Generada por \`migracion-v3/tanda-16-mercaptano.ts\` (2026-10-15). El usuario: «un matiz mercaptan si ha llegado se habia traspapelado de ahi la confusion». Como la tanda 13 (alta) y la 14 (ficha), sobre lo común como lo dejó la tanda 15.*

- **CAS 4410-99-5** (2-feniletanotiol): Spectrum Chemical y TCI P1715, consultados el 2026-10-15. IFRA: sin estándar por su CAS.
- **Ficha:** ${found[0].url}. **TGSC: «not for fragrance use»**: es un aromatizante, como la tialdina; no lleva dosis.

| Campo | Valor | De dónde |
|---|---|---|
${found.map((r) => `| ${r.campo} | ${cell(r.valor)} | ${r.origen === "TGSC" ? `«${cell(r.frase)}»` : `propuesta de la sesión, por «${cell(r.frase)}»`} |`).join("\n")}
`,
  "utf8",
);
console.log(`Tanda 16: ${materials.rows.length} + 1 materiales comunes, ${newDescriptors.length} descriptores. ${OUT}/informe.md`);
