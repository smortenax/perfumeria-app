/**
 * Batch 43 (V3-97): the strength goes back to PerfuMate's impact, 1 to 10. The user, 2026-11-06:
 * «Creo que fue un error simplificar la escala del 1 al 10 de perfúmate y que tenerla en 4 eslabones
 * es objetivamente peor para la app habría que devolverlo a los valores de 10 puntos a mi parecer».
 *
 * Each common material gains `impact` (1–10) and `impact_source`, next to `strength`, from the
 * PerfuMate scrape batch 21 read (migracion-v3/perfumate/perfumate.sqlite3, `materials.impact`), as it
 * comes: never converted, never corrected (V3-82). A material is matched by its CAS (or one of its
 * other CAS), and only when no CAS matches, by its name or an alias equal to a PerfuMate name or
 * synonym. When several entries share the CAS with different impacts, the one whose own name is the
 * material's name decides, else one named like it (name, alias or synonym); if none or several still differ, it is left without impact and
 * listed. The four-level `strength` does not change: it stays for what has no impact.
 *
 *   node migracion-v3/tanda-43-impacto.ts
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";

const BASE = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/43-impacto";
const DB = "migracion-v3/perfumate/perfumate.sqlite3";
const DECISION = "V3-97 (el usuario, 2026-11-06: «habría que devolverlo a los valores de 10 puntos»)";
type Rec = Record<string, Cell>;

const text = execSync(`git show ${BASE}:v3/datos/materials.csv`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const header = text.slice(0, text.indexOf("\n")).split(",");
if (header.includes("impact")) throw new Error("materials.csv ya tiene impact");
const materials = parseCsvRecords(text) as Rec[];

interface Entry { readonly name: string; readonly url: string; readonly impact: number; readonly cas: readonly string[]; readonly names: readonly string[] }
const sha256 = createHash("sha256").update(readFileSync(DB)).digest("hex");
const db = new DatabaseSync(DB, { readOnly: true });
const CAS = /\d{2,7}-\d\d-\d/g;
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
const entries: Entry[] = (db.prepare("SELECT name, source_url, impact, cas, synonyms_json FROM materials WHERE impact IS NOT NULL").all() as Record<string, unknown>[]).map((r) => ({
  name: String(r.name),
  url: String(r.source_url),
  impact: Number(r.impact),
  cas: String(r.cas ?? "").match(CAS) ?? [],
  names: [String(r.name), ...(JSON.parse(String(r.synonyms_json ?? "[]")) as string[])].map(norm),
}));
const listOf = (v: Cell): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v.startsWith("[") ? (JSON.parse(v) as string[]) : v ? [String(v)] : []);

type How = "cas" | "name" | "conflict" | "none" | "solvent";
const found: { name: string; how: How; impact: number | null; strength: string; matches: string }[] = [];
const newMaterials = materials.map((r) => {
  if (r.owner_id) return { ...r, impact: null, impact_source: null };
  const name = String(r.name);
  if (r.solvent === "true" || r.solvent === true) {
    found.push({ name, how: "solvent", impact: null, strength: String(r.strength ?? ""), matches: "" });
    return { ...r, impact: null, impact_source: null };
  }
  const cases = [String(r.cas ?? ""), ...listOf(r.other_cas)].filter(Boolean);
  const names = [name, ...listOf(r.aliases)].map(norm);
  let how: How = "cas";
  let hits = entries.filter((e) => e.cas.some((c) => cases.includes(c)));
  if (hits.length === 0) {
    how = "name";
    hits = entries.filter((e) => e.names.some((n) => names.includes(n)));
  }
  // Several entries share a CAS (Ambroxan, Ambrox DL…): the one named like the material decides.
  // First the entry whose own name is the material's own name; then any name, alias or synonym.
  if (how === "cas" && new Set(hits.map((e) => e.impact)).size > 1) {
    const same = hits.filter((e) => norm(e.name) === norm(name));
    const named = hits.filter((e) => e.names.some((n) => names.includes(n)));
    if (same.length > 0) hits = same;
    else if (named.length > 0) hits = named;
  }
  const impacts = [...new Set(hits.map((e) => e.impact))];
  if (hits.length === 0) how = "none";
  else if (impacts.length > 1) how = "conflict";
  const matches = hits.map((e) => `${e.name} (${e.impact})`).join("; ");
  found.push({ name, how, impact: how === "cas" || how === "name" ? impacts[0] : null, strength: String(r.strength ?? ""), matches });
  if (how !== "cas" && how !== "name") return { ...r, impact: null, impact_source: null };
  const e = hits[0];
  const by = how === "cas" ? "por CAS" : "por nombre";
  return { ...r, impact: e.impact, impact_source: `PerfuMate, ${e.url}: «impact ${e.impact}» (${by}; ${DB}, sha256 ${sha256.slice(0, 12)}), por la tanda 43` };
});
const newHeader = header.flatMap((c) => (c === "strength_source" ? [c, "impact", "impact_source"] : [c]));
const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), newHeader, asCells(newMaterials));

const count = (h: How) => found.filter((f) => f.how === h).length;
const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, "es");
const cell = (t: string) => t.replace(/\|/g, "/");
const withImpact = found.filter((f) => f.impact !== null);
const crossTab = ["low", "medium", "high", "very_high", ""].map((s) => {
  const v = withImpact.filter((f) => f.strength === s).map((f) => f.impact!).sort((a, b) => a - b);
  return { s: s || "sin fuerza", n: v.length, min: v[0], max: v[v.length - 1], median: v.length ? v[Math.floor((v.length - 1) / 2)] : undefined };
});
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 43 · El impacto de 1 a 10

*Generada por \`migracion-v3/tanda-43-impacto.ts\` sobre lo común como está en \`v3/datos/\` (commit \`${BASE}\`). La decisión es ${DECISION}. Escribe \`v3/datos/materials.csv\` con dos columnas nuevas, \`impact\` e \`impact_source\`, junto a la fuerza; no cambia ningún otro valor. Lee \`${DB}\` (sha256 \`${sha256}\`), el mismo que leyó la tanda 21.*

**Qué es.** Cada común gana el impacto que le da PerfuMate, tal cual (V3-82), con la página de donde sale. Lo enseña la ficha como su fuerza, de 1 a 10; los que no tienen impacto siguen enseñando su fuerza en palabras, sin convertirla.

| Cómo | Cuántos |
|---|---|
| Por CAS | ${count("cas")} |
| Por nombre (ningún CAS coincide) | ${count("name")} |
| Varias entradas con impactos distintos (quedan sin impacto) | ${count("conflict")} |
| No está en PerfuMate | ${count("none")} |
| Disolventes (no llevan impacto) | ${count("solvent")} |

## El impacto frente a la fuerza de 4 niveles

| Fuerza | Con impacto | Mediana | Mínimo | Máximo |
|---|---|---|---|---|
${crossTab.map((c) => `| ${c.s} | ${c.n} | ${c.median ?? "—"} | ${c.min ?? "—"} | ${c.max ?? "—"} |`).join("\n")}

## Por nombre (revísalos)

${found.filter((f) => f.how === "name").sort(byName).map((f) => `- ${f.name} → ${cell(f.matches)}`).join("\n") || "Ninguno."}

## Con impactos distintos (quedan sin impacto)

${found.filter((f) => f.how === "conflict").sort(byName).map((f) => `- ${f.name}: ${cell(f.matches)}`).join("\n") || "Ninguno."}

## Sin impacto

${found.filter((f) => f.how === "none").sort(byName).map((f) => `- ${f.name}${f.strength ? ` (fuerza ${f.strength})` : ""}`).join("\n") || "Ninguno."}

Tus versiones no cambian: heredan el impacto del común.
`,
  "utf8",
);
console.log(`Tanda 43: ${withImpact.length} con impacto (CAS ${count("cas")}, nombre ${count("name")}); con impactos distintos ${count("conflict")}, sin impacto ${count("none")}, disolventes ${count("solvent")}. ${OUT}/informe.md`);
