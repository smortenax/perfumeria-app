/**
 * Batch 46 (V3-104): the common materials that went in with a «quick» sheet get the fields they lacked.
 * The user, 2026-11-06: «lo importante es que se contraste las altas de referencia y se mire que falta
 * para estos materiales y para otros que se quedaron con una "alta rapida" y no estan completos y que
 * en ambos casos se complete el alta».
 *
 * Reads migracion-v3/web/completar-comunes/propuesta.csv (written by consolidar.py from what was read
 * on the web, web-*.csv, and from PerfuMate, huecos.csv). Only empty fields are filled: family, tier,
 * tenacity_hours (with tenacity_source), strength (with strength_source) and physical_state; a usual use
 * («up to X % in the fragrance concentrate») goes to material_doses. Where the references disagree, the
 * field goes to disputed_fields. What no reference says stays empty: unknown, not zero.
 *
 *   python3 -I migracion-v3/web/completar-comunes/consolidar.py && node migracion-v3/tanda-46-completar-comunes.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/46-completar-comunes";
const PROPOSAL = "migracion-v3/web/completar-comunes/propuesta.csv";
type Rec = Record<string, Cell>;

const table = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = table("v3/datos/materials.csv");
const doses = table("v3/datos/material_doses.csv");
const proposal = parseCsvRecords(readFileSync(PROPOSAL, "utf8")) as Record<string, string>[];
const empty = (v: Cell) => v === null || v === undefined || v === "";
const listOf = (v: Cell): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v.startsWith("[") ? (JSON.parse(v) as string[]) : []);

const byId = new Map(materials.rows.map((r) => [String(r.id), { ...r }]));
const newDoses: Rec[] = [];
const report = new Map<string, string[]>();
const left = new Map<string, string[]>();
let filled = 0;
for (const p of proposal) {
  const m = byId.get(p.id);
  if (!m || m.owner_id) throw new Error(`${p.nombre}: no es un común de ${BASE}`);
  if (!p.valor) {
    left.set(p.nombre, [...(left.get(p.nombre) ?? []), p.campo]);
    continue;
  }
  const said = `${p.fuente}, by batch 46`;
  if (p.campo === "dose") {
    const [max, basis] = p.valor.split("|");
    newDoses.push({
      id: uuidFor(`dose:v3:tanda46:${p.id}`), material_id: p.id, owner_id: null, min: null, typical: null, max, basis,
      authority: "literature", source: p.fuente, disputed: p.disputado === "si",
      notes: `Observed or recommended use, not an IFRA limit.${p.otras ? ` Other references: ${p.otras}.` : ""}`,
    });
  } else {
    if (!empty(m[p.campo])) throw new Error(`${p.nombre}: ${p.campo} ya tiene valor`);
    m[p.campo] = p.valor;
    if (p.campo === "tenacity_hours") m.tenacity_source = said;
    if (p.campo === "strength") m.strength_source = said;
    if (p.campo !== "tenacity_hours" && p.campo !== "strength") m.sources = `${m.sources ? `${m.sources} · ` : ""}${p.campo}: ${said}`;
  }
  if (p.disputado === "si") m.disputed_fields = [...new Set([...listOf(m.disputed_fields), p.campo === "dose" ? "dose" : p.campo])];
  if (p.otras) m.notes = `${m.notes ? `${m.notes}\n` : ""}Batch 46, ${p.campo}: ${p.regla}. Other references: ${p.otras}.`;
  report.set(p.nombre, [...(report.get(p.nombre) ?? []), `${p.campo} = ${p.valor.replace("|", " ")}${p.disputado === "si" ? " (disputado)" : ""}`]);
  filled++;
}

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, asCells(materials.rows.map((r) => byId.get(String(r.id))!)));
writeTable(join(OUT, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...newDoses]);
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");
const disputed = proposal.filter((p) => p.disputado === "si");
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 46 · Completar los comunes que entraron a medias

*Generada por \`migracion-v3/tanda-46-completar-comunes.ts\` sobre lo común de \`${BASE}\`, desde \`${PROPOSAL}\`. Escribe \`v3/datos/materials.csv\` y \`material_doses.csv\` enteros: solo llena campos vacíos; nada que ya tuviera valor cambia. Sin aprobar.*

**Por qué** (V3-104): el usuario, 2026-11-06: «lo importante es que se contraste las altas de referencia y se mire que falta para estos materiales y para otros que se quedaron con una "alta rapida" y no estan completos y que en ambos casos se complete el alta».

**Cómo:** \`migracion-v3/web/completar-comunes/huecos.py\` lista los ${new Set(proposal.map((p) => p.id)).size} comunes con algún hueco (familia, nivel, horas en tira, fuerza, estado físico, uso). Para cada uno se leyeron en la web hasta tres páginas de referencia (\`web-*.csv\`, con la frase literal) y se miró PerfuMate en local. \`consolidar.py\` normaliza al vocabulario de la app y elige por este orden: TGSC, la casa, Fraterworks, Perfumer's Apprentice, ScenTree, Scentspiracy, PerfumersWorld, Premiere Peau, PerfuMate. Premiere Peau copia a menudo las cifras de TGSC: cuando coinciden, no cuenta como segunda referencia. Lo que habla de otro producto (el aceite puro para una tintura, el producto diluido) no se usa.

**Resultado:** ${filled} campos llenos (${newDoses.length} usos habituales); ${disputed.length} disputados (las referencias no coinciden: va la primera y el campo queda marcado); ${proposal.length - filled} siguen vacíos porque ninguna referencia los dice.

**Para mirar antes de aprobar:**

- **La familia** sale de la palabra de la referencia («Odor Type: balsamic» → gourmand, por \`family_palette.csv\`): es una lectura de la sesión.
- **La fuerza** en palabras va en \`strength\` (cuatro niveles), no en el impacto (V3-97).
- **Las horas** que una referencia da como «más de» (> 7 días, > 90 h) entran como esa cifra; días, semanas y meses, pasados a horas (un mes, 720 h). Dos cifras de horas que no se separan más de un 25 % cuentan como la misma.
- **Cuatro sin buscar en la web** (Rose Crystals, Synthetic castoreum, Tonka bean tincture y Veramoss, solo les faltan las horas): se acabó el cupo de lecturas; los dos que PerfuMate tiene llevan su cifra.

## Disputados

| Material | Campo | Va | Otras referencias |
|---|---|---|---|
${disputed.map((p) => `| ${p.nombre} | ${p.campo} | ${cell(p.valor)} | ${cell(p.otras)} |`).join("\n")}

## Lo que se llena

| Material | Campos |
|---|---|
${[...report].map(([n, f]) => `| ${n} | ${cell(f.join("; "))} |`).join("\n")}

## Lo que sigue vacío

| Material | Campos |
|---|---|
${[...left].map(([n, f]) => `| ${n} | ${f.join(", ")} |`).join("\n")}
`,
  "utf8",
);
console.log(`Tanda 46: ${filled} campos, ${newDoses.length} dosis, ${disputed.length} disputados, ${proposal.length - filled} vacíos.`);
