/**
 * Batch 27 (2026-10-27): the key information still missing for the arrivals of 2026-10-26, as the
 * task docs-v3/tareas/2026-10-27-info-altas.md asks: usual use and constituents, each with its page
 * and its sentence. The user: «completa la información clave que falta de los botes del 2026-10-26».
 *
 * What it reads:
 * - migracion-v3/web/info-altas-26-oct/verificado.csv: the pages the session read again itself, with
 *   the usage figures as the page gives them (percent of the concentrate) and «entra» or
 *   «conflicto». Only a page marked «entra» gives a dose; a «conflicto» is listed, never written over
 *   what batch 23 has (the user decides).
 * - parte-1..4.csv in the same folder (the web search, one subagent each): only their constituents
 *   with a CAS and a figure, and only from a page of verificado.csv marked «entra». The rest
 *   (identity, IFRA hints, documents, what was not found) goes to the task, not to the data.
 * - the lab's IFRA 51 certificate of Auranone by Perfumer's Apprentice (perfumeria-lab, master,
 *   materias-primas/_datos/certificados-ifra/), read with pdftotext: its constituents with an IFRA
 *   limit. It is another supplier's product, so it is literature, not the user's lot.
 *
 * Nothing about IFRA's limits is written: those come only from IFRA's files (P37), by CAS.
 * Writes the two common tables as approved at BASE, with these added; nothing already there changes.
 *
 *   node migracion-v3/tanda-27-info-altas.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

// The common data as main had it on 2026-10-27 (0114379; datos last changed by batch 26, 2799b2d).
const BASE = "0114379";
const OUT = "migracion-v3/tandas/27-info-altas";
const WEB = "migracion-v3/web/info-altas-26-oct";
const LAB = "/home/user/perfumeria-lab";
const LAB_PDF = "materias-primas/_datos/certificados-ifra/auranone-perfumers-apprentice-ifra51-2024-02-23.pdf";
type Rec = Record<string, Cell>;

const read = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = read("v3/datos/materials.csv");
const doses = read("v3/datos/material_doses.csv");
const components = read("v3/datos/material_components.csv");
const local = (file: string) => parseCsvRecords(readFileSync(join(WEB, file), "utf8"));

// Each «MAT-…» of the search, as the common material it is: batch 23's by its key, the four that
// were already common by their name.
const BY_NAME: Record<string, string> = { "MAT-polysantol": "Polysantol", "MAT-sandalmysore-core": "Sandalmysore Core", "MAT-ajenjo": "Ajenjo, aceite esencial", "MAT-auranone": "Auranone" };
const common = materials.rows.filter((m) => !m.owner_id);
const idOf = (key: string): string => {
  const name = BY_NAME[key];
  const found = name ? common.find((m) => m.name === name) : common.find((m) => m.id === uuidFor(`comun:tanda23:${key}`));
  if (!found) throw new Error(`${key}: no está en lo común de ${BASE}`);
  return String(found.id);
};
const nameOf = (id: string) => String(common.find((m) => m.id === id)?.name ?? id);

/** «0.06» (percent) → «0.0006» (a fraction, exact as text). */
const fraction = (percent: string): string | null => {
  const p = percent.trim();
  if (!/^\d+(\.\d+)?$/.test(p)) return null;
  const [int, dec = ""] = p.split(".");
  const digits = (int + dec).replace(/^0+/, "") || "0";
  const scale = dec.length + 2;
  const padded = digits.padStart(scale + 1, "0");
  const out = `${padded.slice(0, padded.length - scale)}.${padded.slice(padded.length - scale)}`.replace(/0+$/, "").replace(/\.$/, "");
  return out.replace(/^0+(?=\d)/, "") || "0";
};

// 1. Doses, from the pages the session read again.
const verified = local("verificado.csv");
const conflicts: { material: string; url: string; now: string; found: string; note: string }[] = [];
const newDoses: Rec[] = [];
for (const v of verified) {
  const id = idOf(v.material_id);
  const found = `mín. ${v.uso_min || "tr."} %, mediana ${v.uso_tipico} %, máx. ${v.uso_max} %`;
  if (v.estado === "conflicto") {
    const was = doses.rows.filter((d) => d.material_id === id).map((d) => `${d.min || "—"} / ${d.typical || "—"} / ${d.max || "—"} (${String(d.source).slice(0, 60)})`);
    conflicts.push({ material: nameOf(id), url: v.url, now: was.join("; "), found, note: v.nota });
    continue;
  }
  if (v.estado !== "entra") throw new Error(`${v.url}: estado «${v.estado}»`);
  if (doses.rows.some((d) => d.material_id === id && String(d.source).includes(v.url))) continue;
  newDoses.push({
    id: uuidFor(`dose:v3:tanda27:${id}:${v.url}`),
    material_id: id,
    owner_id: null,
    min: v.uso_min ? fraction(v.uso_min) : null,
    typical: fraction(v.uso_tipico),
    max: fraction(v.uso_max),
    basis: "concentrate",
    authority: "literature",
    source: `web: Fraterworks, ${v.url}: «${v.frase}»`,
    disputed: false,
    notes: `${v.nota} · confianza: media · releído por la sesión el 2026-10-27`,
  });
}

// 2. Constituents from the verified pages: those with a CAS and a figure.
const entra = new Set(verified.filter((v) => v.estado === "entra").map((v) => v.url));
const parts = [1, 2, 3, 4].flatMap((n) => local(`parte-${n}.csv`));
const newComponents: Rec[] = [];
const amountOf = (text: string): Rec | null => {
  const range = /^([\d.]+)\s*\(([\d.]+)\s*-\s*([\d.]+)\)\s*%$/.exec(text.trim());
  if (range) return { amount_kind: "range", value: null, min: fraction(range[2]), max: fraction(range[3]) };
  const exact = /^([\d.]+)\s*%$/.exec(text.trim());
  return exact ? { amount_kind: "exact", value: fraction(exact[1]), min: null, max: null } : null;
};
const addComponent = (id: string, cas: string, name: string, amount: Rec, source: string) => {
  if (components.rows.some((c) => c.material_id === id && (c.component_cas === cas || c.component_name === name))) return;
  newComponents.push({ id: uuidFor(`comp:v3:tanda27:${id}:${cas}:${source}`), material_id: id, component_id: null, component_cas: cas, component_name: name, ...amount, authority: "literature", source });
};
for (const p of parts) {
  if (!["constituyente", "alergeno"].includes(p.campo) || !entra.has(p.url) || !/^\d{2,7}-\d{2}-\d$/.test(p.cas.trim())) continue;
  const amount = amountOf(p.cantidad);
  if (!amount) continue;
  const table = p.url.includes("myrrh") ? "What Myrrh gum is made of" : p.url.includes("galbanum") ? "What Galbanum is made of" : "What Opoponax is made of";
  addComponent(idOf(p.material_id), p.cas.trim(), p.valor.trim(), amount, `web: Fraterworks, ${p.url}: tabla «${table}» (análisis publicados, no el lote comprado)`);
}

// 3. Auranone: the constituents with an IFRA limit in Perfumer's Apprentice's certificate.
const labCommit = execSync(`git -C ${LAB} rev-parse --short origin/master`, { encoding: "utf8" }).trim();
const pdf = execSync(`git -C ${LAB} show origin/master:${LAB_PDF}`, { maxBuffer: 16 * 1024 * 1024 });
const text = execSync("pdftotext -layout - -", { input: pdf, encoding: "utf8" });
const auranone = idOf("MAT-auranone");
const certificateRows = [...text.matchAll(/^\s*(\S.*?\S)\s{2,}(\d{2,7}-\d{2}-\d)[^\n]*?\s([\d.]+)%\s*$/gm)];
if (certificateRows.length !== 3) throw new Error(`certificado de Auranone: ${certificateRows.length} filas, se esperaban 3`);
for (const [, name, cas, percent] of certificateRows) {
  addComponent(
    auranone,
    cas,
    name.trim(),
    { amount_kind: "exact", value: fraction(percent), min: null, max: null },
    `laboratorio, ${LAB_PDF} (commit ${labCommit}), página 2: certificado IFRA 51 de Perfumer's Apprentice, 2024-02-23 («Materials with an IFRA limit»); de otro proveedor, no del bote de Perfumiarz`,
  );
}

const componentHeader = components.header.includes("component_cas") ? components.header : [...components.header.slice(0, 3), "component_cas", "component_name", ...components.header.slice(3)];
const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "material_doses.csv"), doses.header, asCells([...doses.rows, ...newDoses]));
writeTable(join(OUT, "material_components.csv"), componentHeader, asCells([...components.rows, ...newComponents]));

const byMaterial = new Map<string, { doses: number; components: number }>();
for (const d of newDoses) byMaterial.set(String(d.material_id), { doses: (byMaterial.get(String(d.material_id))?.doses ?? 0) + 1, components: byMaterial.get(String(d.material_id))?.components ?? 0 });
for (const c of newComponents) byMaterial.set(String(c.material_id), { doses: byMaterial.get(String(c.material_id))?.doses ?? 0, components: (byMaterial.get(String(c.material_id))?.components ?? 0) + 1 });
const cell = (t: string) => t.replace(/\|/g, "/");
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 27 · La información clave de los botes del 2026-10-26

*Generada por \`migracion-v3/tanda-27-info-altas.ts\` sobre lo común de \`main\` (commit \`${BASE}\`), con la búsqueda en \`${WEB}/\` y el certificado de Auranone del laboratorio (commit \`${labCommit}\`). Escribe \`v3/datos/material_doses.csv\` y \`v3/datos/material_components.csv\` enteros, con lo nuevo añadido: no cambia ni borra nada de lo que hay. Sin aprobar.*

**Qué entra:** ${newDoses.length} dosis de uso (de páginas que la sesión releyó) y ${newComponents.length} constituyentes con su CAS y su cifra (composiciones publicadas que recoge Fraterworks y el certificado de otro proveedor de Auranone: literatura, no el lote comprado). Ninguna cifra de IFRA: esas salen solo de los archivos de IFRA, por el CAS. Lo demás de la búsqueda (identidad, pistas de IFRA de las tiendas, documentos, lo que no se encontró) está en la tarea \`docs-v3/tareas/2026-10-27-info-altas.md\`.

| Material | Dosis nuevas | Constituyentes nuevos |
|---|---|---|
${[...byMaterial.entries()].map(([id, n]) => ({ name: nameOf(id), ...n })).sort((a, b) => a.name.localeCompare(b.name, "es")).map((r) => `| ${r.name} | ${r.doses} | ${r.components} |`).join("\n")}

## Conflictos (los decides tú; no se escriben)

${conflicts.map((c) => `- **${c.material}**: ahora ${cell(c.now)}; ${c.url} da hoy ${c.found}. ${cell(c.note)}.`).join("\n")}

## Dosis nuevas

| Material | Mín. | Típico | Máx. | Fuente |
|---|---|---|---|---|
${newDoses.map((d) => `| ${nameOf(String(d.material_id))} | ${d.min ?? "—"} | ${d.typical ?? "—"} | ${d.max ?? "—"} | ${cell(String(d.source))} |`).join("\n")}

Las cifras son fracciones del concentrado (0.006 = 0,6 %).

## Constituyentes nuevos

| Material | Constituyente | CAS | Cantidad |
|---|---|---|---|
${newComponents.map((c) => `| ${nameOf(String(c.material_id))} | ${c.component_name} | ${c.component_cas} | ${c.amount_kind === "range" ? `${c.min}–${c.max}` : c.value} |`).join("\n")}
`,
  "utf8",
);
console.log(`Tanda 27: ${newDoses.length} dosis, ${newComponents.length} constituyentes, ${conflicts.length} conflictos. ${OUT}/informe.md`);
