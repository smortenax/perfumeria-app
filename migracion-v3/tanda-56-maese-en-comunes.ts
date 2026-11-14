/**
 * Batch 56: the commons that Maese Lab also sells say so, so the app marks them «Maese» (PR #70 marks a
 * material whose sources, notes or supplier cite Maese Lab). The user, 2026-11-14, before a workshop with
 * Maese Lab's materials: «Materiales: salen los de Maese (p. ej. Cardamom CO2, Celestolide) con la
 * etiqueta «Maese»».
 *
 * Batch 45 matched 128 Maese products to an existing common (cruce.csv, comun_id). Only those of the same
 * form count (the product of an absolute sold diluted is that absolute, V3-85); a match to another form (an
 * oil to a tincture) is not the same material and is left out. To each common, its Maese products are added
 * to `sources`, with the shop's title and page. Nothing else changes.
 *
 *   node migracion-v3/tanda-56-maese-en-comunes.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";

const BASE = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/56-maese-en-comunes";
type Rec = Record<string, Cell>;
const text = execSync(`git show ${BASE}:v3/datos/materials.csv`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const header = text.slice(0, text.indexOf("\n")).split(",");
const materials = parseCsvRecords(text) as Rec[];
const byId = new Map(materials.map((m) => [String(m.id), m]));
const cruce = parseCsvRecords(readFileSync("migracion-v3/web/maese-perfumeria/cruce.csv", "utf8")) as Record<string, string>[];

const FORM: Record<string, string> = { "aceite esencial": "essential oil", absoluto: "absolute", co2: "CO2 extract", resinoide: "resinoid", tintura: "tincture" };
const sameForm = (tipo: string, m: Rec) => {
  if (tipo === "molecula") return m.kind !== "natural";
  if (tipo === "dilucion") return m.form === "absolute" || m.form === "dilution"; // an absolute sold diluted (V3-85)
  const f = FORM[tipo];
  return !!f && (m.form === f || String(m.name).toLowerCase().includes(f.toLowerCase()));
};

const added = new Map<string, string[]>();
const left: string[] = [];
for (const c of cruce) {
  const m = c.comun_id ? byId.get(c.comun_id) : undefined;
  if (!m) continue;
  if (!sameForm(c.tipo, m)) {
    left.push(`| ${c.n} | ${c.nombre_web} (${c.tipo}) | ${m.name} (${m.form || m.kind}) |`);
    continue;
  }
  added.set(String(m.id), [...(added.get(String(m.id)) ?? []), `Maese Lab sells it: «${c.nombre_web}», ${c.url}`]);
}
const out = materials.map((m) => {
  const extra = added.get(String(m.id));
  if (!extra) return m;
  const now = String(m.sources ?? "");
  const fresh = extra.filter((e) => !now.includes(e));
  return fresh.length ? { ...m, sources: [now, ...fresh].filter(Boolean).join(" · ") } : m;
});
const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), header, asCells(out));
const changed = out.filter((m, i) => m !== materials[i]);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 56 · Los comunes que también vende Maese Lab, marcados «Maese»

*Generada por \`migracion-v3/tanda-56-maese-en-comunes.ts\` sobre lo común de \`${BASE}\`. Escribe \`v3/datos/materials.csv\` entero: solo añade a \`sources\` el producto de Maese Lab. Sin aprobar.*

**Por qué:** el usuario, 2026-11-14: «Materiales: salen los de Maese (p. ej. Cardamom CO2, Celestolide) con la etiqueta «Maese»». La tanda 45 emparejó 128 productos de Maese con un común que ya existía; esos comunes no citaban a Maese, así que no llevaban la etiqueta.

**Resultado:** ${changed.length} comunes llevan ahora su producto de Maese en las fuentes.

## Emparejados con otra forma (no entran: no son el mismo material, y faltan como altas)

| n | Producto de Maese | Común con el que se emparejó |
|---|---|---|
${left.join("\n")}
`,
  "utf8",
);
console.log(`Tanda 56: ${changed.length} comunes marcados; ${left.length} emparejados con otra forma.`);
