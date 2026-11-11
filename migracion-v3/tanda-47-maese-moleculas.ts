/**
 * Batch 47 (V3-104): Maese Lab's aroma chemicals that are not yet common, as common materials with a full
 * sheet. The user, 2026-11-06: «creo que es clave tener todo el glosario de maese dentro de la app» and
 * «lo importante es que se contraste las altas de referencia […] y que en ambos casos se complete el alta».
 *
 * Reads migracion-v3/web/maese-altas/propuesta-47.csv (consolidar.py: Maese Lab's sheet from batch 45,
 * what was read on the web, and PerfuMate). Each product is one common material, by identity (V3-85),
 * in a category of its own (V3-13), as batch 38 did: name in English (TGSC or the house), Maese Lab's
 * CAS, INCI and odour profile quoted, impact from PerfuMate only when it is the same material (V3-97),
 * the rest with its source. What no reference says stays empty: unknown, not zero. A product that turns
 * out to be a common already (same CAS or name) is not added: it is listed.
 *
 *   python3 -I migracion-v3/web/maese-altas/consolidar.py 47 aroma-chemicals && node migracion-v3/tanda-47-maese-moleculas.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const TANDA = "47";
const BASE = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/47-maese-moleculas";
const PROPOSAL = `migracion-v3/web/maese-altas/propuesta-${TANDA}.csv`;
/** CAS that Maese Lab writes wrong (they fail the check digit; batch 45): the right one, and from where. */
const CAS_FIX: Record<string, [string, string]> = {
  "4940-97-3": ["101-97-3", "4940-97-3 fails the CAS check digit; TGSC and Fraterworks give 101-97-3 for ethyl phenylacetate"],
};
type Rec = Record<string, Cell>;

const table = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
/** Batch 47 goes on top of batch 46 (both rewrite materials.csv and material_doses.csv whole). */
const PREV = "migracion-v3/tandas/46-completar-comunes";
const fromFile = (path: string) => {
  const text = readFileSync(path, "utf8");
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = fromFile(join(PREV, "materials.csv"));
const categories = table("v3/datos/material_categories.csv");
const descriptors = table("v3/datos/material_descriptors.csv");
const doses = fromFile(join(PREV, "material_doses.csv"));
const proposal = parseCsvRecords(readFileSync(PROPOSAL, "utf8")) as Record<string, string>[];
const knownCas = new Set(materials.rows.filter((m) => !m.owner_id).flatMap((m) => [String(m.cas ?? ""), ...(JSON.parse(String(m.other_cas || "[]")) as string[])]).filter(Boolean));
const knownNames = new Set(materials.rows.filter((m) => !m.owner_id).map((m) => String(m.name).toLowerCase()));

const maese = (p: Record<string, string>, phrase: string) => `Maese Lab, ${p.url}: «${phrase}»`;
const newMaterials: Rec[] = [];
const newCategories: Rec[] = [];
const newDescriptors: Rec[] = [];
const newDoses: Rec[] = [];
const skipped: string[] = [];
const lines: string[] = [];
const seenCas = new Set<string>();
for (const p of proposal) {
  const [cas, casWhy] = CAS_FIX[p.cas] ?? [p.cas, ""];
  if (p.ya_comun || (cas && knownCas.has(cas)) || knownNames.has(p.nombre.toLowerCase())) {
    skipped.push(`| ${p.n} | ${p.nombre} | ${p.ya_comun || "mismo CAS o nombre que un común"} |`);
    continue;
  }
  if (cas && seenCas.has(cas)) {
    skipped.push(`| ${p.n} | ${p.nombre} | el mismo CAS que otro producto de esta tanda |`);
    continue;
  }
  if (cas) seenCas.add(cas);
  const key = `maese:${p.n}`;
  const id = uuidFor(`comun:tanda${TANDA}:${key}`);
  const category = uuidFor(cas ? `cat:v3:cas:${cas}` : `cat:v3:tanda${TANDA}:${key}`);
  if (categories.rows.some((c) => c.id === category)) throw new Error(`${p.nombre}: su categoría ya existe`);
  const composition = !cas || /\bbase\b|specialty|speciality/i.test(`${p.nombre} ${p.otros_nombres}`);
  const disputed = ["family", "tier", "tenacity_hours", "strength", "physical_state"].filter((f) => p[`${f}_disputado`] === "si");
  const sources: string[] = [
    `Name: ${p.nombre_fuente}`,
    `CAS: ${maese(p, `Nº CAS: ${p.cas}`)}${casWhy ? ` (${casWhy})` : ""}`,
    ...(p.inci ? [`INCI: ${maese(p, `INCI: ${p.inci}`)}`] : []),
    ...(p.casa ? [`House: ${p.casa_fuente}`] : []),
    ...(p.family ? [`Family: ${p.family_fuente}`] : []),
    ...(p.tier ? [`Tier: ${p.tier_fuente}`] : []),
    ...(p.physical_state ? [`State: ${p.physical_state_fuente}`] : []),
  ];
  const others = ["family", "tier", "tenacity_hours", "strength", "physical_state", "dose"]
    .filter((f) => p[`${f}_otras`])
    .map((f) => `${f}: ${p[`${f}_otras`]}`);
  newCategories.push({ id: category, name: p.nombre, aliases: [] });
  newMaterials.push({
    ...Object.fromEntries(materials.header.map((h) => [h, null])),
    id,
    owner_id: null,
    name: p.nombre,
    kind: composition ? "composition" : "molecule",
    solvent: false,
    aliases: JSON.parse(p.otros_nombres) as string[],
    cas: cas || null,
    other_cas: JSON.parse(p.otros_cas) as string[],
    inci: p.inci || null,
    category_id: category,
    house: p.casa || null,
    family: p.family || null,
    tier: p.tier || null,
    tenacity_hours: p.tenacity_hours || null,
    tenacity_source: p.tenacity_hours ? `${p.tenacity_hours_fuente}, by batch ${TANDA}` : null,
    strength: p.strength || null,
    strength_source: p.strength ? `${p.strength_fuente}, by batch ${TANDA}` : null,
    impact: p.impacto || null,
    impact_source: p.impacto ? `${p.impacto_fuente}, by batch ${TANDA}` : null,
    physical_state: p.physical_state || null,
    confidence: p.family && p.tenacity_hours ? "high" : p.family || p.tenacity_hours ? "medium" : "low",
    disputed_fields: disputed,
    notes: [
      `Added on 2026-11-06 (batch ${TANDA}), from Maese Lab's sheet (batch 45) and the references read on the web.`,
      ...(p.pureza ? [`Maese Lab: «${p.pureza}».`] : []),
      ...(others.length ? [`Other references: ${others.join(" · ")}.`] : []),
      ...(p.sin_cas_bueno ? [`Not used (the page is another CAS): ${p.sin_cas_bueno}.`] : []),
    ].join("\n"),
    sources: sources.join(" · "),
  });
  if (p.perfil_maese) newDescriptors.push({ id: uuidFor(`desc:v3:tanda${TANDA}:${key}:maese`), material_id: id, owner_id: null, source: "web", text: `Maese Lab: ${p.perfil_maese}` });
  for (const [i, [site, text]] of (JSON.parse(p.olores) as [string, string, string][]).entries())
    newDescriptors.push({ id: uuidFor(`desc:v3:tanda${TANDA}:${key}:${i}`), material_id: id, owner_id: null, source: site.startsWith("TGSC") ? "TG" : "web", text: `${site}: ${text}` });
  if (p.dose) {
    const [max, basis] = p.dose.split("|");
    newDoses.push({
      id: uuidFor(`dose:v3:tanda${TANDA}:${key}`), material_id: id, owner_id: null, min: null, typical: null, max, basis,
      authority: "literature", source: p.dose_fuente, disputed: p.dose_disputado === "si",
      notes: `Observed or recommended use, not an IFRA limit.${p.dose_otras ? ` Other references: ${p.dose_otras}.` : ""}`,
    });
  }
  const pct = (v: string) => `${Number((Number(v) * 100).toFixed(4))} %`;
  lines.push(`| ${p.n} | ${p.nombre} | ${cas || "—"} | ${p.family || "—"} | ${p.impacto || "—"} | ${p.strength || "—"} | ${p.tenacity_hours ? `${p.tenacity_hours} h` : "—"} | ${p.tier || "—"} | ${p.dose ? pct(p.dose.split("|")[0]) : "—"} | ${disputed.join(", ") || ""} |`);
}

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, [...asCells(materials.rows), ...newMaterials]);
writeTable(join(OUT, "material_categories.csv"), categories.header, [...asCells(categories.rows), ...newCategories]);
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);
writeTable(join(OUT, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...newDoses]);
const count = (f: string) => newMaterials.filter((m) => m[f] !== null && m[f] !== "").length;
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda ${TANDA} · Las moléculas de Maese Lab que faltaban, en lo común

*Generada por \`migracion-v3/tanda-47-maese-moleculas.ts\` sobre lo común de \`${BASE}\` **con la tanda 46** (se aprueba después de ella), desde \`${PROPOSAL}\`. Escribe \`v3/datos/materials.csv\`, \`material_categories.csv\`, \`material_descriptors.csv\` y \`material_doses.csv\` enteros, con estos añadidos: lo de antes no cambia. En inglés, como lo común desde la tanda 36. Sin aprobar.*

**Por qué** (V3-104): el usuario, 2026-11-06: «creo que es clave tener todo el glosario de maese dentro de la app» y «lo importante es que se contraste las altas de referencia […] y que en ambos casos se complete el alta».

**Cómo:** la ficha de Maese Lab de la tanda 45 (nombre, CAS comprobado, INCI, pureza y perfil, citados); para cada producto se leyeron hasta dos páginas de referencia (TGSC primero, y una independiente: Fraterworks, la casa, Perfumer's Apprentice…; \`migracion-v3/web/maese-altas/web-${TANDA}-*.csv\`, con la frase literal) y PerfuMate en local. Una página de otro CAS no cuenta. \`consolidar.py\` elige con las mismas reglas que la tanda 46: orden de referencias, y si no coinciden, va la primera y el campo queda disputado. El impacto, solo de PerfuMate y cuando es el mismo material (V3-97); la fuerza en palabras va aparte, en \`strength\`.

**Resultado:** ${newMaterials.length} materiales nuevos (${newMaterials.filter((m) => m.kind === "composition").length} bases o especialidades); ${skipped.length} no entran porque ya son un común. Con familia ${count("family")}, impacto ${count("impact")}, fuerza en palabras ${count("strength")}, horas en tira ${count("tenacity_hours")}, nivel ${count("tier")}, estado ${count("physical_state")}; ${newDoses.length} usos habituales y ${newDescriptors.length} descriptores.

**Para mirar antes de aprobar:**

- **La familia** sale de la palabra de la referencia («Odor Type: balsamic» → gourmand, por \`family_palette.csv\`): es una lectura de la sesión.
- **IFRA** no se escribe aquí: la app lo lee por el CAS de la capa de IFRA (V3-35).
- **Lo que Maese escribe mal:** ${Object.entries(CAS_FIX).map(([bad, [good]]) => `${bad} → ${good}`).join("; ")}.
- **Cómo se guarda la ficha de la tienda** (para el filtro por proveedor) está pendiente de tu respuesta en el hilo. Esta tanda solo da de alta el material, como la 38.

| n | Material | CAS | Familia | Impacto | Fuerza | Horas | Nivel | Uso hasta | Disputado |
|---|---|---|---|---|---|---|---|---|---|
${lines.join("\n")}

## No entran (ya son un común)

| n | Producto | Común |
|---|---|---|
${skipped.join("\n")}
`,
  "utf8",
);
console.log(`Tanda ${TANDA}: ${newMaterials.length} materiales, ${newDescriptors.length} descriptores, ${newDoses.length} dosis; ${skipped.length} ya eran comunes.`);
