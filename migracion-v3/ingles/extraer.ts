/**
 * The common data, in English (V3-71; the user, 2026-10-30, to «¿Preparo la tanda que pasa al
 * inglés los datos comunes, con los decimales en punto?»: «Sí, todo»). Step 1 of 3: the texts.
 *
 * Reads the common tables as v3/datos/ has them at BASE and writes each distinct text of the
 * columns that are prose (names, descriptions, notes, sources) once, in chunks of about 40,000
 * characters, to migracion-v3/ingles/textos/NN.txt. Step 2 translates each chunk to
 * migracion-v3/ingles/traducido/NN.txt (a subagent, with the rules of LEEME.md); step 3,
 * migracion-v3/tanda-36-ingles.ts, checks the translation and writes the tables.
 *
 * Left out, as they are: ids, enums, numbers, CAS, INCI, abbreviations, the other names (aliases,
 * which keep every language so that search finds them), the perfumes and houses of the references,
 * the short source codes (TG, web, FIG) and the texts longer than 40 characters that are plainly
 * English already (no Spanish word or accent, and an English one).
 *
 * Each chunk is a list of blocks: a line «@@ <key> · <table.column, …>» and the text, to the next
 * «@@ ». The key is the first 10 hex digits of the text's SHA-1. Same input, same bytes.
 *
 *   node migracion-v3/ingles/extraer.ts
 */
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../../src/data/csv.ts";

export const BASE = "87e0daa";
export const DIR = "migracion-v3/ingles";
const CHUNK = 40_000;

/** The prose columns of each common table, in the order the chunks take them. */
export const COLUMNS: Readonly<Record<string, readonly string[]>> = {
  materials: [
    "name", "family_detail", "facets", "form", "part", "origin", "physical_state", "appearance", "house", "code", "species",
    "process", "chemotype", "odor_target", "cost", "stains", "threshold", "vapor_pressure", "solubility", "stability",
    "incompatibilities", "diffusion", "blend_effect", "recommended_dilution", "handling", "isomers", "tenacity_source",
    "strength_source", "physical_sources", "sources", "notes",
  ],
  material_categories: ["name"],
  material_relations: ["other_text", "note"],
  material_components: ["component_name", "source"],
  material_descriptors: ["text"],
  material_doses: ["notes", "source"],
  material_references: ["note", "sources"],
};
/**
 * The few prose cells of the other common tables: the session's notes in IFRA's layer (IFRA's own
 * text is English already) and the words of the families' palette (V3-38). They go in a last chunk
 * of their own.
 */
export const OTHER_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  ifra_substances: ["subgroup"],
  ifra_annex: ["notice"],
  ifra_spec_exclusions: ["note"],
  family_palette: ["name", "short", "colour_name", "covers", "source"],
};
/** Which column a text belongs to first, for the order of the chunks: the short names first, the long notes last. */
const ORDER = [
  "materials.name", "material_categories.name", "material_relations.other_text", "material_components.component_name",
  "materials.family_detail", "materials.facets", "material_descriptors.text", "materials.form", "materials.part",
  "materials.origin", "materials.physical_state", "materials.appearance", "materials.house", "materials.code",
  "materials.species", "materials.process", "materials.chemotype", "materials.odor_target", "materials.cost",
  "materials.stains", "materials.threshold", "materials.vapor_pressure", "materials.solubility", "materials.stability",
  "materials.incompatibilities", "materials.diffusion", "materials.blend_effect", "materials.recommended_dilution",
  "material_doses.notes", "material_doses.source", "material_relations.note", "material_references.note",
  "material_references.sources", "material_components.source", "materials.handling", "materials.isomers",
  "materials.tenacity_source", "materials.strength_source", "materials.physical_sources", "materials.sources", "materials.notes",
  "family_palette.name", "family_palette.short", "family_palette.colour_name", "family_palette.covers", "family_palette.source",
  "ifra_substances.subgroup", "ifra_annex.notice", "ifra_spec_exclusions.note",
];

const SPANISH =
  /[áéíóúñ¿¡ÁÉÍÓÚÑ]|\b(de|la|el|los|las|con|sin|para|que|en|y|por|una|un|del|se|no|lo|es|al|sobre|muy|entre|como|pero|o|su|sus|dice|da|hay|tiene|cuando|desde|hasta|fuente|nota|notas|fresco|fresca|verde|dulce|ficha|horas|tira|tanda|confianza|alta|media|baja|aceite|esencial|madera|hoja|hojas|flor|flores|corteza|semilla|fruto|piel|resina|goma|dato|datos|buscador|fabricante|proveedor|naranja|rosa|vainilla|almizcle|cuero|tabaco|incienso|musgo|roble|cedro|bergamota|lavanda|geranio|salvia|menta|canela|clavo|pimienta|cardamomo|miel|cera|laboratorio)\b/i;
const ENGLISH = /\b(the|and|of|with|for|is|in|on|to|from|by|at|it|as|be|are|this|that|odor|odour|notes?|sweet|fresh|woody|green)\b/i;
/** Plainly English already: long, no Spanish word or accent, and an English one. */
export const plainlyEnglish = (text: string) => text.length > 40 && !SPANISH.test(text) && ENGLISH.test(text);
/** The short source codes of descriptors, relations and references: kept as they are. */
const CODES = new Set(["TG", "web", "FIG", "Fi", "Mo", "repo", "lab: repo web TG"]);

export const keyOf = (text: string) => createHash("sha1").update(text, "utf8").digest("hex").slice(0, 10);
export const show = (path: string) => execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/** Every distinct prose text of the given tables, with the columns it appears in. */
export function texts(tables: Readonly<Record<string, readonly string[]>> = COLUMNS): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  for (const [table, columns] of Object.entries(tables)) {
    for (const row of parseCsvRecords(show(`v3/datos/${table}.csv`))) {
      if (row.owner_id) continue;
      for (const column of columns) {
        const value = row[column];
        if (!value) continue;
        if (!found.has(value)) found.set(value, new Set());
        found.get(value)!.add(`${table}.${column}`);
      }
    }
  }
  return found;
}

/** The texts that go to the translation: not a code, not plainly English. */
export const toTranslate = (text: string) => !CODES.has(text) && !plainlyEnglish(text);

if (import.meta.url === `file://${process.argv[1]}`) {
  const found = texts();
  const other = texts(OTHER_COLUMNS);
  const unitsOf = (map: Map<string, Set<string>>) =>
    [...map.entries()]
      .filter(([text]) => toTranslate(text))
      .map(([text, columns]) => {
        const where = [...columns].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
        return { key: keyOf(text), text, where, rank: ORDER.indexOf(where[0]) };
      })
      .sort((a, b) => a.rank - b.rank || a.text.localeCompare(b.text, "es") || a.key.localeCompare(b.key));
  const units = unitsOf(found);
  const last = unitsOf(new Map([...other].filter(([text]) => !found.has(text))));
  const all = [...units, ...last];
  if (new Set(all.map((u) => u.key)).size !== all.length) throw new Error("Dos textos con la misma clave");
  if (all.some((u) => /^@@ /m.test(u.text))) throw new Error("Un texto tiene una línea que empieza por «@@ »");

  rmSync(join(DIR, "textos"), { recursive: true, force: true });
  mkdirSync(join(DIR, "textos"), { recursive: true });
  const blockOf = (u: (typeof all)[number]) => `@@ ${u.key} · ${u.where.join(", ")}\n${u.text}\n`;
  const chunks: string[][] = [[]];
  let size = 0;
  for (const u of units) {
    const block = blockOf(u);
    if (size > 0 && size + block.length > CHUNK) {
      chunks.push([]);
      size = 0;
    }
    chunks.at(-1)!.push(block);
    size += block.length;
  }
  chunks.push(last.map(blockOf));
  chunks.forEach((blocks, i) => writeFileSync(join(DIR, "textos", `${String(i + 1).padStart(2, "0")}.txt`), blocks.join(""), "utf8"));
  const skipped = [...found.keys(), ...other.keys()].filter((t) => !toTranslate(t));
  console.log(
    `${found.size + other.size} textos distintos; ${all.length} a traducir (${all.reduce((n, u) => n + u.text.length, 0)} caracteres) en ${chunks.length} trozos; ` +
      `${skipped.length} se quedan como están (códigos o ya en inglés).`,
  );
}
