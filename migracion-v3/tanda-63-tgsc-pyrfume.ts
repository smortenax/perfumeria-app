/**
 * Batch 63: TGSC's odour descriptors as Pyrfume publishes them (pyrfume-data/goodscents), for the
 * molecules you have whose sheet lacks something TGSC gives. The user, 2026-11-19: «usa los de pyrfume y
 * guardo yo las páginas». The hours, usual use and strength need TGSC's own page: the user saves them
 * (migracion-v3/web/tgsc/lista.md) and another batch reads them.
 *
 * Reads migracion-v3/web/tgsc/pyrfume-63.csv (pyrfume.py, by exact CAS). Adds one descriptor per molecule
 * (source TG: what TGSC lists, at the concentration it gives) unless the same text is already there, and
 * the family only where the common has none (the first word of the list the app reads, as batches 46 to
 * 62 do with «Odor Type»).
 *
 *   python3 -I migracion-v3/web/tgsc/pyrfume.py <caché> && node migracion-v3/tanda-63-tgsc-pyrfume.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable, asCells, mdCell } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const TANDA = "63";
// BASE=<commit> regenerates the batch on the data it was made on (once approved, HEAD already holds it).
const BASE = process.env.BASE ?? execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/63-tgsc-pyrfume";
const SOURCE = "migracion-v3/web/tgsc/pyrfume-63.csv";
type Rec = Record<string, Cell>;

const table = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = table("v3/datos/materials.csv");
const descriptors = table("v3/datos/material_descriptors.csv");
const reads = parseCsvRecords(readFileSync(SOURCE, "utf8")) as Record<string, string>[];
const byId = new Map(materials.rows.map((r) => [String(r.id), { ...r }]));

const newDescriptors: Rec[] = [];
const lines: string[] = [];
let families = 0;
for (const r of reads) {
  const m = byId.get(r.material_id);
  if (!m || m.owner_id) throw new Error(`${r.nombre}: no es un común`);
  if (!r.descriptores) {
    lines.push(`| ${mdCell(r.nombre)} | ${r.cas} | — | — | Pyrfume no tiene este CAS |`);
    continue;
  }
  const at = r.concentracion ? ` (at ${r.concentracion} %${r.disolvente ? ` in ${r.disolvente}` : ""})` : "";
  const text = `TGSC via Pyrfume${at}: ${r.descriptores.split(";").join(", ")}`;
  const already = descriptors.rows.some((d) => d.material_id === r.material_id && String(d.text).toLowerCase().includes(r.descriptores.split(";").join(", ").toLowerCase()));
  if (!already) newDescriptors.push({ id: uuidFor(`desc:v3:tanda${TANDA}:${r.material_id}`), material_id: r.material_id, owner_id: null, source: "TG", text });
  if (r.familia && !m.family) {
    m.family = r.familia;
    m.sources = `${m.sources ? `${m.sources} · ` : ""}family: ${r.fuente}, by batch ${TANDA} (the first word of the list the app reads)`;
    families++;
  }
  m.notes = `${m.notes ? `${m.notes}\n` : ""}Batch ${TANDA}: TGSC's descriptors via Pyrfume (${r.fuente}). Pyrfume's manifest: «see LICENSE for use restrictions; Pyrfume developers make no claims concerning copyright».`;
  lines.push(`| ${mdCell(r.nombre)} | ${r.cas} | ${mdCell(r.descriptores.split(";").join(", "))}${already ? " (ya estaba)" : ""} | ${r.familia && m.family === r.familia ? r.familia : "—"} | TGSC ${r.tgsc_id}${at} |`);
}

writeTable(join(OUT, "materials.csv"), materials.header, asCells(materials.rows.map((r) => byId.get(String(r.id))!)));
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda ${TANDA} · Los descriptores de TGSC que publica Pyrfume

*Generada por \`migracion-v3/tanda-63-tgsc-pyrfume.ts\` sobre lo común de \`${BASE}\`, desde \`${SOURCE}\`. Escribe \`v3/datos/materials.csv\` y \`material_descriptors.csv\` enteros: solo añade descriptores y llena la familia donde estaba vacía. Sin aprobar.*

**Por qué:** el usuario, 2026-11-19: «usa los de pyrfume y guardo yo las páginas». TGSC devuelve 403 a las lecturas automáticas; Pyrfume publica en GitHub los descriptores de olor de TGSC por CAS (\`pyrfume-data/goodscents\`: \`behavior.csv\` y \`stimuli.csv\`).

**Cómo:** \`migracion-v3/web/tgsc/pyrfume.py\` baja esos dos archivos (apunta su sha256), los cruza por CAS exacto con las ${reads.length} moléculas de \`migracion-v3/web/tgsc/lista.csv\` y da su lista de descriptores, con la concentración y el disolvente con que TGSC la olió. Un natural no se cruza por CAS.

**Resultado:** ${newDescriptors.length} descriptores; ${families} familia.

**Para mirar antes de aprobar:**

- **No hay horas, uso ni fuerza:** Pyrfume no los publica. Salen de las páginas de TGSC que vas a guardar (\`migracion-v3/web/tgsc/lista.md\`).
- **La familia** (solo el linolenato de metilo, que no la tenía) es la primera palabra de la lista que la app sabe leer («fruity; fatty; oily» → fruity): es una lectura de la sesión.
- **La licencia:** el manifiesto de Pyrfume dice «see LICENSE for use restrictions; Pyrfume developers make no claims concerning copyright», y ese LICENSE no está en el repositorio. Los datos son de TGSC. Para tu uso, bien; si la app se distribuye como producto, es una duda abierta (cada material lo apunta en sus notas).

| Material | CAS | Descriptores (TGSC) | Familia | Ficha |
|---|---|---|---|---|
${lines.join("\n")}
`,
  "utf8",
);
console.log(`Tanda ${TANDA}: ${newDescriptors.length} descriptores, ${families} familia.`);
