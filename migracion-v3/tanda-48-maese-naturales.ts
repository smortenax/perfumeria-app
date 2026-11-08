/**
 * Batches 48, 49 and 50 (V3-101): Maese Lab's naturals that are not yet common (essential oils; absolutes,
 * CO2 and resinoids; tinctures and extracts), as common materials with a full sheet. The user, 2026-11-06:
 * «creo que es clave tener todo el glosario de maese dentro de la app» and «lo importante es que se
 * contraste las altas de referencia […] y que en ambos casos se complete el alta».
 *
 * Same rules as batch 47 (migracion-v3/web/maese-altas/consolidar.py), for naturals: one common material
 * per identity (V3-85): species, part, process (form), treatment and chemotype. Two Maese products that
 * differ only in origin or grade are one material (the second is listed, not added). The CAS of a natural
 * is shared between species: it is kept as Maese Lab gives it, but it does not decide identity.
 * Impact only from PerfuMate when it is the same material (V3-97): for a tincture or a dilution, none.
 *
 *   python3 -I migracion-v3/web/maese-altas/consolidar.py 48 aceites-esenciales && node migracion-v3/tanda-48-maese-naturales.ts 48
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const CONFIG: Record<string, { out: string; prev: string; title: string }> = {
  "48": { out: "48-maese-aceites", prev: "47-maese-moleculas", title: "Los aceites esenciales de Maese Lab que faltaban, en lo común" },
  "49": { out: "49-maese-absolutos", prev: "48-maese-aceites", title: "Los absolutos, CO2 y resinoides de Maese Lab que faltaban, en lo común" },
  "50": { out: "50-maese-tinturas", prev: "49-maese-absolutos", title: "Las tinturas y extractos de Maese Lab que faltaban, en lo común" },
};
const TANDA = process.argv[2] ?? "";
if (!CONFIG[TANDA]) throw new Error("uso: node migracion-v3/tanda-48-maese-naturales.ts 48|49|50");
const { out: OUT_NAME, prev: PREV_NAME, title: TITLE } = CONFIG[TANDA];
const OUT = `migracion-v3/tandas/${OUT_NAME}`;
const PREV = `migracion-v3/tandas/${PREV_NAME}`;
const BASE = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const PROPOSAL = `migracion-v3/web/maese-altas/propuesta-${TANDA}.csv`;
type Rec = Record<string, Cell>;

const METHOD: [RegExp, string][] = [
  [/arrastre de vapor|destilaci[oó]n/i, "steam distillation"],
  [/presi[oó]n en fr[ií]o|prensado|expresi[oó]n/i, "cold expression"],
  [/co2|supercr[ií]tic/i, "supercritical CO2 extraction"],
  [/absoluto|solvente/i, "solvent extraction (absolute)"],
  [/resinoide/i, "solvent extraction (resinoid)"],
  [/maceraci[oó]n|inmersi[oó]n|tintura/i, "maceration in alcohol (tincture)"],
];
const fromFile = (path: string) => {
  const text = readFileSync(path, "utf8");
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = fromFile(join(PREV, "materials.csv"));
const categories = fromFile(join(PREV, "material_categories.csv"));
const descriptors = fromFile(join(PREV, "material_descriptors.csv"));
const doses = fromFile(join(PREV, "material_doses.csv"));
const proposal = parseCsvRecords(readFileSync(PROPOSAL, "utf8")) as Record<string, string>[];
const knownNames = new Set(materials.rows.filter((m) => !m.owner_id).map((m) => String(m.name).toLowerCase()));

/**
 * What tells apart two Maese products of the same species and part (session reading of Maese Lab's names
 * and INCI): variety, chemotype, fraction, processing. It goes into the identity and the name.
 */
const QUALIFIER: Record<string, string> = {
  "258": "cava / champagne", "410": "white wine", "295": "var. China", "296": "var. Egypt", "303": "var. picardii, Spain",
  "320": "lavandin extra", "321": "lavandin grosso", "325": "furocoumarin-free", "354": "red", "355": "green",
  "375": "white", "378": "black", "379": "green", "382": "white", "383": "pink", "386": "ct. camphor", "387": "ct. cineole",
  "183": "white", "184": "pink",
  "502": "var. florentina, in propanediol", "451": "fresh", "452": "roasted", "453": "dried",
  "548": "pre-ambered resin", "549": "aged resin",
  "544": "petrified resin", "545": "pre-ambered resin", "546": "pre-fossilised resin", "547": "aged resin",
  "411": "first distillation", "412": "second distillation", "413": "third distillation", "414": "complete", "415": "extra",
};
/** Same material as another product of the batch, only another grade, origin or dilution (V3-85): a specification. */
const SAME: Record<string, [string, string]> = {
  "298": ["297", "the same guaiacwood oil, sold at 50 % in DPG"],
  "389": ["388", "the same Rosa damascena flower oil; «Otto Bulgaria» and «Extra» are origin and grade"],
  "373": ["370", "the same Citrus aurantium amara leaf/twig oil; Paraguay is the origin (Maese wrote «Hojas» there and «Hoja» in 370)"],
  "440": ["437", "the same Bursera jorullense resin tincture from Mexico; «blanco» and «mexicano» name the same copal"],
  "483": ["482", "the same Liquidambar orientalis resin tincture; Indonesia and Turkey are origins"],
  "193": ["192", "the same Rosa damascena flower absolute; Bulgaria and India are origins"],
  "215": ["194", "tobacco absolute sold diluted in alcohol; the absolute is already a common"],
};
/** Names the references give badly (a house code, the bare genus): session reading of Maese Lab's title and INCI. */
const NAME_FIX: Record<string, string> = {
  "181": "Jasmine grandiflorum, absolute", "182": "Jasmine sambac, absolute", "187": "Narcissus, absolute",
  "192": "Rosa damascena (flower), absolute",
  "422": "Palmaria palmata (seaweed), tincture", "423": "Codium tomentosum (seaweed), tincture", "444": "Natural camphor, tincture",
  "500": "Mastic (resin), tincture", "506": "Natural menthol, tincture", "519": "Propolis, tincture", "531": "Hyraceum, tincture", "197": "Tuberose, absolute", "202": "Coffee, CO2 extract", "218": "Butter, CO2 extract",
};
/** Where Maese Lab's «parte» is plainly wrong (a seed for a seaweed or a stone): the part the INCI and the title say. */
const PART_FIX: Record<string, string> = {
  "422": "whole seaweed", "423": "whole seaweed", "444": "crystals", "506": "crystals", "531": "petrified excretion",
};
const named = (name: string, q: string | undefined) => {
  if (!q) return name;
  const [base, ...rest] = name.split(", ");
  return `${base.includes("(") ? base.replace(/\)$/, `, ${q})`) : `${base} (${q})`}, ${rest.join(", ")}`;
};
const maese = (p: Record<string, string>, phrase: string) => `Maese Lab, ${p.url}: «${phrase}»`;
const treatment = (t: string) => (t.match(/bergapt|furocoum|furanocum|fcf|ffc|\bfree\b|rectif|terpenel|desterpen|decolor|incolor/i) ?? [""])[0].toLowerCase();
const partKey = (t: string) => t.toLowerCase().replace(/s\b/g, "");  // «Hoja» and «Hojas» are the same part
const chemotype = (t: string) => (t.match(/\b(?:QT|CT|quimiotipo)\.?\s*([A-Za-zÁÉÍÓÚáéíóú-]+)/) ?? ["", ""])[1].toLowerCase();
const newMaterials: Rec[] = [];
const newCategories: Rec[] = [];
const newDescriptors: Rec[] = [];
const newDoses: Rec[] = [];
const skipped: string[] = [];
const lines: string[] = [];
const seen = new Map<string, string>();
for (const p of proposal) {
  if (p.ya_comun || knownNames.has(p.nombre.toLowerCase())) {
    skipped.push(`| ${p.n} | ${p.nombre} | ya es un común: ${p.ya_comun || "el mismo nombre"} |`);
    continue;
  }
  if (SAME[p.n]) {
    skipped.push(`| ${p.n} | ${p.nombre} | el mismo material que el n.º ${SAME[p.n][0]}: ${SAME[p.n][1]} (una especificación, V3-85) |`);
    continue;
  }
  if (NAME_FIX[p.n]) p.nombre = NAME_FIX[p.n];
  p.nombre = named(p.nombre, QUALIFIER[p.n]);
  if (p.forma === "dilution") {  // an absolute sold diluted is that absolute (V3-85): a specification, not a material
    const neat = seen.get([p.especie || p.nombre, partKey(p.parte), "absolute", treatment(`${p.otros_nombres} ${p.inci}`), chemotype(p.otros_nombres), QUALIFIER[p.n] ?? ""].join("|"));
    if (neat) {
      skipped.push(`| ${p.n} | ${p.nombre} | el mismo material que el n.º ${neat}, vendido diluido (una especificación, V3-85) |`);
      continue;
    }
  }
  const identity = [p.especie || p.nombre, partKey(p.parte), p.forma, treatment(`${p.otros_nombres} ${p.inci}`), chemotype(p.otros_nombres), QUALIFIER[p.n] ?? ""].join("|");
  if (seen.has(identity)) throw new Error(`${p.n} ${p.nombre}: la misma identidad que ${seen.get(identity)}; añádelo a QUALIFIER o a SAME`);
  seen.set(identity, p.n);
  const key = `maese:${p.n}`;
  const id = uuidFor(`comun:tanda${TANDA}:${key}`);
  const category = uuidFor(`cat:v3:tanda${TANDA}:${key}`);
  if (categories.rows.some((c) => c.id === category)) throw new Error(`${p.nombre}: su categoría ya existe`);
  const method = METHOD.find(([re]) => re.test(p.metodo))?.[1];
  const diluted = ["tincture", "dilution", "reduction"].includes(p.forma);
  const disputed = ["family", "tier", "tenacity_hours", "strength", "physical_state"].filter((f) => p[`${f}_disputado`] === "si");
  const others = ["family", "tier", "tenacity_hours", "strength", "physical_state", "dose"].filter((f) => p[`${f}_otras`]).map((f) => `${f}: ${p[`${f}_otras`]}`);
  const sources: string[] = [
    `Name: ${p.nombre_fuente}`,
    ...(p.especie ? [`Species: ${maese(p, `INCI: ${p.inci}`)}`] : []),
    ...(p.parte ? [`Part: ${maese(p, `Parte: ${p.parte}`)}`] : []),
    ...(p.metodo ? [`Process: ${maese(p, `Método: ${p.metodo}`)}`] : []),
    ...(p.origen ? [`Origin: ${maese(p, `Origen: ${p.origen}`)}`] : []),
    ...(p.cas ? [`CAS: ${maese(p, `Nº CAS: ${p.cas}`)}`] : []),
    ...(p.family ? [`Family: ${p.family_fuente}`] : []),
    ...(p.tier ? [`Tier: ${p.tier_fuente}`] : []),
    ...(p.physical_state ? [`State: ${p.physical_state_fuente}`] : []),
  ];
  newCategories.push({ id: category, name: p.nombre, aliases: [] });
  newMaterials.push({
    ...Object.fromEntries(materials.header.map((h) => [h, null])),
    id,
    owner_id: null,
    name: p.nombre,
    kind: "natural",
    solvent: false,
    aliases: JSON.parse(p.otros_nombres) as string[],
    cas: p.cas || null,
    other_cas: JSON.parse(p.otros_cas || "[]") as string[],
    species: p.especie || null,
    part: PART_FIX[p.n] ? `${PART_FIX[p.n]} (Maese Lab says «${p.parte}», which the INCI contradicts)` : p.parte ? `${p.parte_en} (Maese Lab: «${p.parte}»)` : null,
    process: p.metodo ? `${method ?? p.metodo.toLowerCase()} (Maese Lab: «${p.metodo}»)` : null,
    chemotype: chemotype(p.otros_nombres) || null,
    inci: p.inci || null,
    origin: p.origen ? `${p.origen} (Maese Lab)` : null,
    category_id: category,
    form: p.forma,
    family: p.family || null,
    tier: p.tier || null,
    tenacity_hours: p.tenacity_hours || null,
    tenacity_source: p.tenacity_hours ? `${p.tenacity_hours_fuente}, by batch ${TANDA}` : null,
    strength: p.strength || null,
    strength_source: p.strength ? `${p.strength_fuente}, by batch ${TANDA}` : null,
    impact: !diluted && p.impacto ? p.impacto : null,
    impact_source: !diluted && p.impacto ? `${p.impacto_fuente}, by batch ${TANDA}` : null,
    physical_state: p.physical_state || null,
    confidence: p.family && p.tenacity_hours ? "high" : p.family || p.tenacity_hours ? "medium" : "low",
    disputed_fields: disputed,
    notes: [
      `Added on 2026-11-06 (batch ${TANDA}), from Maese Lab's sheet (batch 45) and the references read on the web.`,
      ...(p.pureza ? [`Maese Lab: «${p.pureza}».`] : []),
      ...(diluted ? ["A tincture or dilution: no impact of its own (V3-97); batch 45 has the estimate from the neat material (consenso.csv)."] : []),
      ...(others.length ? [`Other references: ${others.join(" · ")}.`] : []),
      ...(p.sin_cas_bueno ? [`Not used (another species, part or CAS): ${p.sin_cas_bueno}.`] : []),
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
  const impact = !diluted && p.impacto ? p.impacto : "—";
  lines.push(`| ${p.n} | ${p.nombre} | ${p.especie ? `*${p.especie}*` : "—"} | ${p.family || "—"} | ${impact} | ${p.strength || "—"} | ${p.tenacity_hours ? `${p.tenacity_hours} h` : "—"} | ${p.tier || "—"} | ${p.dose ? pct(p.dose.split("|")[0]) : "—"} | ${disputed.join(", ")} |`);
}

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, [...asCells(materials.rows), ...newMaterials]);
writeTable(join(OUT, "material_categories.csv"), categories.header, [...asCells(categories.rows), ...newCategories]);
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);
writeTable(join(OUT, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...newDoses]);
const count = (f: string) => newMaterials.filter((m) => m[f] !== null && m[f] !== "").length;
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda ${TANDA} · ${TITLE}

*Generada por \`migracion-v3/tanda-48-maese-naturales.ts ${TANDA}\` sobre lo común de \`${BASE}\` **con las tandas 46 a ${Number(TANDA) - 1}** (se aprueba después de ellas), desde \`${PROPOSAL}\`. Escribe \`v3/datos/materials.csv\`, \`material_categories.csv\`, \`material_descriptors.csv\` y \`material_doses.csv\` enteros, con estos añadidos: lo de antes no cambia. Sin aprobar.*

**Por qué** (V3-101): el usuario, 2026-11-06: «creo que es clave tener todo el glosario de maese dentro de la app» y «lo importante es que se contraste las altas de referencia […] y que en ambos casos se complete el alta».

**Cómo:** como la tanda 47. La ficha de Maese Lab (tanda 45: especie por el INCI, parte, método, origen, CAS, pureza y perfil, citados); hasta dos páginas de referencia por producto, de la misma especie y parte (\`migracion-v3/web/maese-altas/web-${TANDA}-*.csv\`); PerfuMate en local. Una página de otra especie o parte no cuenta. Un material por identidad (V3-85): especie, parte, proceso, tratamiento y quimiotipo; dos productos que solo cambian de origen o de grado son el mismo material. El nombre, el común en inglés de la referencia o, si no lo hay, la especie y la parte.

**Resultado:** ${newMaterials.length} materiales nuevos; ${skipped.length} no entran (ya son un común, o el mismo material que otro de la tanda). Con familia ${count("family")}, impacto ${count("impact")}, fuerza en palabras ${count("strength")}, horas en tira ${count("tenacity_hours")}, nivel ${count("tier")}; ${newDoses.length} usos habituales y ${newDescriptors.length} descriptores.

**Para mirar antes de aprobar:**

- **La familia** sale de la palabra de la referencia (por \`family_palette.csv\`): es una lectura de la sesión.
- **Las tinturas y diluciones** van sin impacto (V3-97); la estimación desde el material puro está en la tanda 45 (\`consenso.csv\`).
- **Cómo se guarda la ficha de la tienda** (para el filtro por proveedor) está pendiente de tu respuesta en el hilo.

| n | Material | Especie | Familia | Impacto | Fuerza | Horas | Nivel | Uso hasta | Disputado |
|---|---|---|---|---|---|---|---|---|---|
${lines.join("\n")}

## No entran

| n | Producto | Por qué |
|---|---|---|
${skipped.join("\n")}
`,
  "utf8",
);
console.log(`Tanda ${TANDA}: ${newMaterials.length} materiales, ${newDescriptors.length} descriptores, ${newDoses.length} dosis; ${skipped.length} no entran.`);
