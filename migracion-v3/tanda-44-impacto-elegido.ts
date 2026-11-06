/**
 * Batch 44 (V3-97): the six commons batch 43 left without impact, because several PerfuMate entries
 * matched them with different impacts. Each takes the impact of the entry that is the same product or
 * the same part of the plant, named here by its PerfuMate name, as it comes (V3-82). Session proposal,
 * 2026-11-06, for the user to approve.
 *
 *   node migracion-v3/tanda-44-impacto-elegido.ts
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";

const BASE = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/44-impacto-elegido";
const DB = "migracion-v3/perfumate/perfumate.sqlite3";
type Rec = Record<string, Cell>;

/** Common material id → the PerfuMate entry that is it, and why the others are not. */
const CHOSEN: Record<string, { entry: string; why: string }> = {
  "d8e3c147-0e14-5acc-9b5d-00530d0aae5b": { entry: "Coriander Leaf Essential Oil", why: "el cilantro es la hoja; la semilla es el coriandro" },
  "99cbb5b1-4ef4-5255-9c75-5e89d8a32279": { entry: "Exaltolide", why: "Exaltolide Total es Exaltolide; Macrolide es otro producto" },
  "14edcb90-06fd-51e0-9194-56778ab5abc7": { entry: "Frankincense Essential Oil", why: "es el aceite esencial; Olibanum Coeur MD es un producto refinado" },
  "3a4efae9-c9e4-501f-a7d2-6a39fa2b801e": { entry: "Juniper Berry Pure Jungle Essence", why: "es la baya; Juniper Wood Oil es la madera" },
  "70233a8d-4d59-5eb7-9a2f-ea7540d20032": { entry: "Sandal Mysore Core", why: "es el mismo producto; Hindinol es otro" },
  "c6123c69-30e9-56db-b0ae-abe74150427f": { entry: "Shangralide", why: "es el mismo producto; Shangralide Oliffac 0712 es una variante" },
};

const text = execSync(`git show ${BASE}:v3/datos/materials.csv`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const header = text.slice(0, text.indexOf("\n")).split(",");
if (!header.includes("impact")) throw new Error("materials.csv no tiene impact: falta la tanda 43");
const materials = parseCsvRecords(text) as Rec[];
const sha256 = createHash("sha256").update(readFileSync(DB)).digest("hex");
const db = new DatabaseSync(DB, { readOnly: true });
const entryOf = (name: string) => {
  const rows = db.prepare("SELECT name, source_url, impact FROM materials WHERE name = ? AND impact IS NOT NULL").all(name) as Record<string, unknown>[];
  if (rows.length !== 1) throw new Error(`PerfuMate: ${rows.length} entradas llamadas «${name}»`);
  return { name: String(rows[0].name), url: String(rows[0].source_url), impact: Number(rows[0].impact) };
};

const done: string[] = [];
const out = materials.map((r) => {
  const chosen = CHOSEN[String(r.id)];
  if (!chosen) return r;
  if (r.impact !== null && r.impact !== "" && r.impact !== undefined) throw new Error(`${r.name} ya tiene impacto`);
  const e = entryOf(chosen.entry);
  done.push(`| ${r.name} | ${e.name} | ${e.impact} | ${chosen.why} |`);
  return { ...r, impact: e.impact, impact_source: `PerfuMate, ${e.url}: «impact ${e.impact}» (la entrada «${e.name}»: ${chosen.why}; ${DB}, sha256 ${sha256.slice(0, 12)}), por la tanda 44` };
});
if (done.length !== Object.keys(CHOSEN).length) throw new Error(`solo ${done.length} de ${Object.keys(CHOSEN).length}`);
const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), header, asCells(out));
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 44 · El impacto de los seis con varias entradas

*Generada por \`migracion-v3/tanda-44-impacto-elegido.ts\` sobre \`v3/datos/materials.csv\` (commit \`${BASE}\`, con la tanda 43). Lee \`${DB}\` (sha256 \`${sha256}\`). Cambia solo \`impact\` e \`impact_source\` de seis comunes. Propuesta de la sesión, 2026-11-06.*

La tanda 43 los dejó sin impacto porque varias entradas de PerfuMate encajaban con cifras distintas. Cada uno toma la de su mismo producto o su misma parte de la planta, tal cual (V3-82).

| Común | Entrada de PerfuMate | Impacto | Por qué esa |
|---|---|---|---|
${done.join("\n")}
`,
  "utf8",
);
console.log(`Tanda 44: ${done.length} impactos. ${OUT}/informe.md`);
