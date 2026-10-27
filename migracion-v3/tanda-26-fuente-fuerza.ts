/**
 * Batch 26 (V3-81): where each common material's strength comes from. The user, 2026-10-27, asked
 * what «ficha falta impacto y horas» meant: «Faltaba la fuente». The strength gains its column,
 * strength_source, filled here with the batch that brought each value and what that batch cites:
 *
 * - batch 14 (fichas de los nuevos): the TGSC page and sentence of migracion-v3/web/fichas-13.csv;
 * - batch 12 (huecos desde la web): the «intensidad: …» part of the material's own `sources`;
 * - batch 7 (the lab's materials): the lab's library, materials.strength, at the commit batch 7 read.
 *
 * Who brought it is read from the approved tables of each batch, in order: the first that has the
 * value as it is today. A strength no batch explains is left without a source and listed. Made from
 * the common data as v3/datos/ has it at BASE, so that redoing it gives the same tables.
 *
 *   node migracion-v3/tanda-26-fuente-fuerza.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";

const BASE = "2d856d7";
const OUT = "migracion-v3/tandas/26-fuente-fuerza";
const DECISION = "V3-81 (el usuario, 2026-10-27: «Faltaba la fuente»)";
/** The lab commit batch 7 read (its informe.md: «commit `c0e81e3` del laboratorio, sin cambios locales»). */
const LAB_COMMIT = "c0e81e3";
type Rec = Record<string, Cell>;
const show = (path: string) => execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const text = show("v3/datos/materials.csv");
const header = text.slice(0, text.indexOf("\n")).split(",");
if (header.includes("strength_source")) throw new Error("materials.csv ya tiene strength_source");
const materials = parseCsvRecords(text) as Rec[];
const batch = (name: string) => new Map((parseCsvRecords(show(`migracion-v3/tandas/${name}/materials.csv`)) as Rec[]).map((r) => [String(r.id), r]));
const b7 = batch("7-materiales");
const b12 = batch("12-huecos-web");
const fichas = parseCsvRecords(readFileSync("migracion-v3/web/fichas-13.csv", "utf8")).filter((r) => r.campo === "strength");

type Why = "lab" | "web12" | "web14" | "none";
const found: { name: string; strength: string; why: Why; source: string | null }[] = [];
const sourceOf = (r: Rec): { why: Why; source: string | null } => {
  const strength = String(r.strength);
  const id = String(r.id);
  if (b7.get(id)?.strength === strength) return { why: "lab", source: `lab: biblioteca/materiales.sqlite, materials.strength (commit ${LAB_COMMIT}), por la tanda 7` };
  if (b12.get(id)?.strength === strength) {
    const part = /intensidad: (web[^;]*)/.exec(String(r.sources ?? ""))?.[1];
    if (part) return { why: "web12", source: `${part.trim()}, por la tanda 12` };
  }
  const ficha = fichas.find((f) => f.material === r.name && f.valor === strength);
  if (ficha) return { why: "web14", source: `web: TGSC, ${ficha.url}: «${ficha.frase}», por la tanda 14` };
  return { why: "none", source: null };
};
const newMaterials = materials.map((r) => {
  if (!r.strength) return { ...r, strength_source: null };
  const s = sourceOf(r);
  found.push({ name: String(r.name), strength: String(r.strength), ...s });
  return { ...r, strength_source: s.source };
});
const newHeader = header.flatMap((c) => (c === "strength" ? [c, "strength_source"] : [c]));
const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), newHeader, asCells(newMaterials));

const count = (w: Why) => found.filter((f) => f.why === w).length;
const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, "es");
const cell = (t: string) => t.replace(/\|/g, "/");
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 26 · La fuente de la fuerza

*Generada por \`migracion-v3/tanda-26-fuente-fuerza.ts\` sobre lo común como está en \`v3/datos/\` (commit \`${BASE}\`). La decisión es ${DECISION}. Escribe \`v3/datos/materials.csv\` con la columna nueva \`strength_source\`, junto a \`strength\`; no cambia ningún otro valor.*

**Qué es.** Cada común con fuerza (${found.length} de ${materials.length}) gana la fuente de esa cifra: la tanda que la trajo y lo que esa tanda cita. La ficha la enseña bajo la fuerza; sin fuente, «no lo dice».

| De dónde | Cuántos |
|---|---|
| El laboratorio (tanda 7: \`biblioteca/materiales.sqlite\`, \`materials.strength\`, commit \`${LAB_COMMIT}\`) | ${count("lab")} |
| La web, por la tanda 12 (\`respuestas/huecos-web.csv\`, la parte «intensidad» de sus fuentes) | ${count("web12")} |
| La web, por la tanda 14 (\`web/fichas-13.csv\`: la página de TGSC y su frase) | ${count("web14")} |
| Sin encontrar (quedan sin fuente) | ${count("none")} |

## Los que vienen de la web

| Material | Fuerza | Fuente |
|---|---|---|
${found.filter((f) => f.why === "web12" || f.why === "web14").sort(byName).map((f) => `| ${f.name} | ${f.strength} | ${cell(f.source!)} |`).join("\n")}

## Sin encontrar

${count("none") === 0 ? "Ninguno." : found.filter((f) => f.why === "none").sort(byName).map((f) => `- ${f.name} (${f.strength})`).join("\n")}

Tus versiones no cambian: heredan la fuente del común junto con su fuerza.
`,
  "utf8",
);
console.log(`Tanda 26: ${found.length} fuerzas; laboratorio ${count("lab")}, web 12 ${count("web12")}, web 14 ${count("web14")}, sin encontrar ${count("none")}. ${OUT}/informe.md`);
