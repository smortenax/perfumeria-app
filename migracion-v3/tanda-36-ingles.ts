/**
 * Batch 36 (V3-71): the common data, in English. The user, 2026-10-30, to «¿Preparo la tanda que
 * pasa al inglés los datos comunes, con los decimales en punto?»: «Sí, todo».
 *
 * Step 3 of migracion-v3/ingles/LEEME.md. Reads the texts that step 1 sent (ingles/textos/) and their
 * translation (ingles/traducido/), checks each one (every quotation, URL and number of the Spanish
 * is still there) and writes the common tables as v3/datos/ has them at BASE with each prose cell
 * in English. Nothing else changes, with three consequences that keep the app as it was:
 *
 * - a material or category whose name changes keeps its Spanish name among its other names
 *   (aliases), so that search still finds it;
 * - IFRA's variant rules and the specification's exclusion read the process in words (V3-31): each
 *   Spanish pattern gains its English one («resinoide», «resinoid»), and the Spanish stays for your
 *   own materials, which are not translated;
 * - what IFRA says of each common material is checked to be the same before and after: the variant
 *   and the exclusion of every standard it is in, and its own entry in the naturals' annex.
 *
 * Your account is not touched (V3-71: your names and notes are yours). Also writes
 * migracion-v3/ingles/traduccion.csv, every text with its English, for review.
 *
 *   node migracion-v3/tanda-36-ingles.ts
 */
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";
import { BASE, COLUMNS, DIR, OTHER_COLUMNS, keyOf, show, texts, toTranslate } from "./ingles/extraer.ts";

const OUT = "migracion-v3/tandas/36-ingles";
const DECISION = "V3-71; el usuario, 2026-10-30: «Sí, todo»";
type Rec = Record<string, string>;

// ------------------------------------------------------------ the translation and its checks
const blocks = (text: string) =>
  text
    .split(/^@@ /m)
    .slice(1)
    .map((part) => {
      const nl = part.indexOf("\n");
      return { head: (nl < 0 ? part : part.slice(0, nl)).trimEnd(), body: nl < 0 ? "" : part.slice(nl + 1).replace(/\s+$/, "") };
    });
const files = (folder: string) => readdirSync(join(DIR, folder)).filter((f) => /^\d+\.txt$/.test(f)).sort();

const all = new Map([...texts(), ...texts(OTHER_COLUMNS)].map(([text, where]) => [text, where]));
const byKey = new Map([...all.keys()].map((text) => [keyOf(text), text]));
const sent = new Map<string, string>();
for (const file of files("textos")) {
  for (const b of blocks(readFileSync(join(DIR, "textos", file), "utf8"))) {
    const key = b.head.split(" · ")[0];
    const text = byKey.get(key);
    if (text === undefined || text.replace(/\s+$/, "") !== b.body) throw new Error(`textos/${file}: ${key} no es un texto de BASE; vuelve a correr extraer.ts`);
    sent.set(key, text);
  }
}
const expected = [...all.keys()].filter(toTranslate).map(keyOf);
if (expected.some((k) => !sent.has(k)) || sent.size !== expected.length) throw new Error("textos/ no es lo que da extraer.ts con BASE; vuelve a correr extraer.ts");

const QUOTE = /«[^«»]*»|“[^“”]*”|"[^"\n]*"/g;
const URL = /https?:\/\/[^\s«»"“”)]+/g;
const urls = (t: string) => (t.match(URL) ?? []).map((u) => u.replace(/[.,;:]+$/, ""));
const digits = (t: string) => (t.match(/\d+/g) ?? []).sort().join(" ");
const outsideQuotes = (t: string) => t.replace(QUOTE, "«»");
const SPANISH_LEFT = /[áéíóúñ¿¡]|\b(de|del|la|las|los|el|con|sin|para|que|por|según|una|muy|pero|también|desde|hasta|entre|sobre|aceite|hojas?|corteza|fuente|ficha|tanda|buscador|confianza)\b/i;
const DECIMAL_COMMA = /\d,\d+\s?(%|°|mmHg|Pa\b|ppm|ppb|kg\b|g\b|mg\b|ml\b|h\b)/;

const english = new Map<string, string>();
const problems: string[] = [];
const spanishLeft: { key: string; en: string }[] = [];
const decimalComma: { key: string; en: string }[] = [];
/** English runs a little shorter than Spanish; much shorter, and something may have been dropped. */
const shorter: { key: string; es: number; en: number }[] = [];
const seen = new Set<string>();
for (const file of files("traducido")) {
  for (const b of blocks(readFileSync(join(DIR, "traducido", file), "utf8"))) {
    const same = / =$/.test(b.head);
    const key = b.head.replace(/ =$/, "");
    const es = sent.get(key);
    if (es === undefined) {
      problems.push(`traducido/${file}: ${key} no es un texto enviado`);
      continue;
    }
    if (seen.has(key)) problems.push(`traducido/${file}: ${key} está dos veces`);
    seen.add(key);
    if (same) {
      if (b.body) problems.push(`${key}: lleva «=» y texto`);
      continue;
    }
    const en = b.body;
    if (!en) {
      problems.push(`${key}: sin texto`);
      continue;
    }
    for (const q of es.match(QUOTE) ?? []) if (!en.includes(q)) problems.push(`${key}: falta la cita ${q.slice(0, 80)}`);
    for (const u of urls(es)) if (!en.includes(u)) problems.push(`${key}: falta la URL ${u}`);
    if (digits(es) !== digits(en)) problems.push(`${key}: los números no son los mismos («${digits(es)}» frente a «${digits(en)}»)`);
    if (SPANISH_LEFT.test(outsideQuotes(en))) spanishLeft.push({ key, en });
    if (DECIMAL_COMMA.test(outsideQuotes(en))) decimalComma.push({ key, en });
    if (es.length > 200 && en.length < 0.7 * es.length) shorter.push({ key, es: es.length, en: en.length });
    if (en !== es) english.set(es, en);
  }
}
for (const key of sent.keys()) if (!seen.has(key)) problems.push(`${key}: sin traducir (${(sent.get(key) ?? "").slice(0, 60)})`);
if (problems.length > 0) {
  console.error(`Tanda 36: ${problems.length} problemas en la traducción; no se escribe nada.\n${problems.join("\n")}`);
  process.exit(1);
}

// ------------------------------------------------------------ the tables
const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const table = (name: string) => {
  const text = show(`v3/datos/${name}.csv`);
  return { text, header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const base = Object.fromEntries([...Object.keys(COLUMNS), ...Object.keys(OTHER_COLUMNS), "ifra_standards", "ifra_variant_rules"].map((t) => [t, table(t)]));

// The writer gives back the same bytes for a table it does not change: checked before trusting it.
const scratch = mkdtempSync(join(tmpdir(), "tanda-36-"));
for (const [name, t] of Object.entries(base)) {
  writeTable(join(scratch, `${name}.csv`), t.header, t.rows);
  if (readFileSync(join(scratch, `${name}.csv`), "utf8") !== t.text) throw new Error(`${name}.csv: el escritor no devuelve los mismos bytes`);
}

const changed = new Map<string, number>();
const renamed: { table: string; from: string; to: string }[] = [];
const out: Record<string, Rec[]> = {};
for (const [name, columns] of Object.entries({ ...COLUMNS, ...OTHER_COLUMNS })) {
  out[name] = base[name].rows.map((row) => {
    if (row.owner_id) return row;
    const next = { ...row };
    for (const column of columns) {
      const en = row[column] ? english.get(row[column]) : undefined;
      if (en === undefined) continue;
      next[column] = en;
      changed.set(`${name}.${column}`, (changed.get(`${name}.${column}`) ?? 0) + 1);
    }
    if ((name === "materials" || name === "material_categories") && next.name !== row.name) {
      const aliases = JSON.parse(row.aliases || "[]") as string[];
      if (!aliases.some((a) => fold(a) === fold(row.name))) next.aliases = JSON.stringify([...aliases, row.name]);
      renamed.push({ table: name, from: row.name, to: next.name });
    }
    return next;
  });
}
for (const name of ["materials", "material_categories"]) {
  const names = out[name].filter((r) => !r.owner_id).map((r) => fold(r.name));
  const twice = names.filter((n, i) => names.indexOf(n) !== i);
  if (twice.length > 0) throw new Error(`${name}: dos con el mismo nombre en inglés: ${twice.join(", ")}`);
}

// ------------------------------------------------------------ IFRA reads the process in words (V3-31)
/** Each Spanish pattern and its English. With «starts», a Spanish process starts with «aceite esencial»; an English one, with «essential oil». */
const ENGLISH_PATTERN: Readonly<Record<string, readonly string[]>> = {
  absoluto: ["absolute"],
  extracto: ["extract"],
  destilad: ["distill"],
  aceite: ["oil"],
  resinoide: ["resinoid"],
  rectificado: ["rectified"],
};
const STARTS_TOO: Readonly<Record<string, readonly string[]>> = { aceite: ["essential oil"] };
const codeOf = new Map(base.ifra_standards.rows.map((s) => [s.id, s.code]));
const rules = base.ifra_variant_rules.rows;
const newRules: Rec[] = [];
for (const r of rules.filter((x) => x.field === "process")) {
  const patterns = ENGLISH_PATTERN[r.pattern];
  if (!patterns) throw new Error(`Regla de variante con un patrón sin inglés: «${r.pattern}»`);
  for (const pattern of [...patterns, ...(r.match === "starts" ? (STARTS_TOO[r.pattern] ?? []) : [])]) {
    newRules.push({ id: uuidFor(`ifra:rule:${codeOf.get(r.standard_id)}:${r.field}:${r.match}:${pattern}`), standard_id: r.standard_id, field: r.field, match: r.match, pattern, variant: r.variant });
  }
}
const exclusions = base.ifra_spec_exclusions.rows;
const newExclusions: Rec[] = [];
for (const x of exclusions) {
  const patterns = ENGLISH_PATTERN[x.process];
  if (!patterns) throw new Error(`Exclusión con un proceso sin inglés: «${x.process}»`);
  const note = out.ifra_spec_exclusions.find((y) => y.id === x.id)!.note;
  for (const process of patterns) {
    newExclusions.push({ id: uuidFor(`ifra:excl:${codeOf.get(x.standard_id)}:${process}`), standard_id: x.standard_id, process, note: `${note} English form of «${x.process}», batch 36.` });
  }
}
const allRules = [...rules, ...newRules];
const allExclusions = [...out.ifra_spec_exclusions, ...newExclusions];
if (new Set(allRules.map((r) => r.id)).size !== allRules.length || new Set(allExclusions.map((x) => x.id)).size !== allExclusions.length) throw new Error("Un id de IFRA repetido");

// What IFRA says of each common material, before and after: the same, or nothing is written.
const variants = (ruleRows: Rec[], standardId: string, m: Rec) =>
  [...new Set(ruleRows.filter((r) => r.standard_id === standardId).filter((r) => {
    const value = fold((r.field === "species" ? m.species : m.process) ?? "");
    const pattern = fold(r.pattern);
    return value !== "" && (r.match === "starts" ? value.startsWith(pattern) : value.includes(pattern));
  }).map((r) => r.variant))].sort().join("+") || "unknown";
const excluded = (rows: Rec[], standardId: string, m: Rec) => rows.some((x) => x.standard_id === standardId && fold(m.process ?? "").includes(fold(x.process)));
const substances = base.ifra_substances.rows;
const annex = base.ifra_annex.rows;
const isName = (entry: string, name: string) => fold(name) === fold(entry) || fold(name) === fold(entry.replace(/\s*\([^)]*\)\s*$/, ""));
const ownEntry = (m: Rec, cas: Set<string>) => {
  const names = [...new Set(annex.filter((e) => (e.natural_cas && cas.has(e.natural_cas)) || (JSON.parse(e.natural_other_cas || "[]") as string[]).some((c) => cas.has(c))).map((e) => e.natural_name))];
  if (names.length === 0) return null;
  return [m.name, ...(JSON.parse(m.aliases || "[]") as string[])].map((n) => names.find((e) => isName(e, n))).find((e) => e !== undefined) ?? "(prestada)";
};
const watched = new Set([...rules.map((r) => r.standard_id), ...exclusions.map((x) => x.standard_id)]);
const ifraChanges: string[] = [];
let ifraChecked = 0;
let annexChecked = 0;
const afterById = new Map(out.materials.map((m) => [m.id, m]));
for (const before of base.materials.rows.filter((m) => !m.owner_id)) {
  const after = afterById.get(before.id)!;
  const cas = new Set([before.cas, ...(JSON.parse(before.other_cas || "[]") as string[])].filter((c) => c));
  const standards = new Set([
    ...substances.filter((s) => cas.has(s.cas)).map((s) => s.standard_id),
    ...base.ifra_standards.rows.filter((s) => s.limit_expressed_as_cas && cas.has(s.limit_expressed_as_cas)).map((s) => s.id),
  ]);
  for (const id of [...standards].filter((s) => watched.has(s))) {
    ifraChecked++;
    const v0 = variants(rules, id, before);
    const v1 = variants(allRules, id, after);
    if (v0 !== v1) ifraChanges.push(`${before.name}, ${codeOf.get(id)}: variante ${v0} → ${v1}`);
    const x0 = excluded(exclusions, id, before);
    const x1 = excluded(allExclusions, id, after);
    if (x0 !== x1) ifraChanges.push(`${before.name}, ${codeOf.get(id)}: exclusión ${x0} → ${x1}`);
  }
  const own0 = ownEntry(before, cas);
  if (own0 !== null) {
    annexChecked++;
    const own1 = ownEntry(after, cas);
    if (own0 !== own1) ifraChanges.push(`${before.name}: entrada del anexo «${own0}» → «${own1}»`);
  }
}
if (ifraChanges.length > 0) {
  console.error(`Tanda 36: IFRA cambiaría en ${ifraChanges.length} casos; no se escribe nada.\n${ifraChanges.join("\n")}`);
  process.exit(1);
}

// ------------------------------------------------------------ write
const asCells = (rows: Rec[]) => rows as Array<Record<string, Cell>>;
const written: string[] = [];
for (const [name, rows] of Object.entries(out)) {
  const rowsOut = name === "ifra_spec_exclusions" ? allExclusions : rows;
  if (rowsOut.every((r, i) => JSON.stringify(r) === JSON.stringify(base[name].rows[i])) && rowsOut.length === base[name].rows.length) continue;
  writeTable(join(OUT, `${name}.csv`), base[name].header, asCells(rowsOut));
  written.push(name);
}
writeTable(join(OUT, "ifra_variant_rules.csv"), base.ifra_variant_rules.header, asCells(allRules));
written.push("ifra_variant_rules");

const csvQuote = (t: string) => (/[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t);
writeFileSync(
  join(DIR, "traduccion.csv"),
  ["clave,columnas,es,en", ...[...sent.entries()].map(([key, es]) => [key, [...all.get(es)!].join(" "), es, english.get(es) ?? es].map(csvQuote).join(","))].join("\n") + "\n",
  "utf8",
);

const total = [...changed.values()].reduce((a, b) => a + b, 0);
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");
const materialsRenamed = renamed.filter((r) => r.table === "materials").sort((a, b) => a.from.localeCompare(b.from, "es"));
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 36 · Lo común, en inglés

*Generada por \`migracion-v3/tanda-36-ingles.ts\` sobre lo común como está en \`v3/datos/\` (commit \`${BASE}\`). La decisión es ${DECISION}. Cómo se hizo y con qué reglas: \`migracion-v3/ingles/LEEME.md\`.*

**Qué es.** Cada texto en prosa de lo común (nombres, descripciones, notas y fuentes) pasa al inglés, con los decimales en punto. Las citas de los documentos («…») se quedan como están, en su idioma. ${sent.size} textos distintos se mandaron a traducir; ${english.size} cambian y ${sent.size - english.size} ya estaban en inglés. En total cambian ${total} celdas. Cada texto con su traducción, para revisarlo: \`migracion-v3/ingles/traduccion.csv\`.

**Comprobado en cada texto:** que siguen todas sus citas, todas sus URL y los mismos números.

| Tabla y columna | Celdas que cambian |
|---|---|
${[...changed.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `| \`${k}\` | ${n} |`).join("\n")}

## Lo que no cambia

- **Tu cuenta**: tus materiales, tus versiones, tus notas y tus nombres siguen como los escribiste (V3-71).
- **Los otros nombres** de cada material (sus alias), en todos sus idiomas: el buscador los sigue encontrando. **El nombre en español de un material o una categoría que cambia de nombre pasa a sus otros nombres**, así que buscar «${materialsRenamed[0]?.from ?? "bergamota"}» sigue llevando a ${materialsRenamed[0]?.to ?? "su material"}.
- Los ids, los CAS, los INCI, las abreviaturas, las cifras, las familias, los perfumes y casas de las referencias, y los códigos de fuente (TG, web, FIG).

## IFRA, igual que antes

Tres reglas de IFRA leen el proceso con palabras (V3-31): la variante de Bálsamo del Perú, Estírax y Verbena, y la exclusión de la especificación del Estírax para el resinoide. Cada palabra en español gana la suya en inglés, y la española se queda para tus materiales, que siguen en español: ${newRules.length} reglas nuevas (\`ifra_variant_rules.csv\`) y ${newExclusions.length} exclusión nueva (\`ifra_spec_exclusions.csv\`).

| En español | En inglés |
|---|---|
${Object.entries(ENGLISH_PATTERN).map(([es, en]) => `| ${es} | ${[...en, ...(STARTS_TOO[es] ?? []).map((s) => `${s} (al principio)`)].join(", ")} |`).join("\n")}

**Comprobado:** para cada común, en cada estándar con variante o exclusión en el que está (${ifraChecked} casos), la variante y la exclusión son las mismas antes y después; y su entrada del anexo de naturales (${annexChecked} comunes con entrada por su CAS) es la misma.

## Los nombres que cambian (${materialsRenamed.length} materiales)

| Antes | Ahora |
|---|---|
${materialsRenamed.map((r) => `| ${cell(r.from)} | ${cell(r.to)} |`).join("\n")}

Las categorías del buscador, igual que su material (${renamed.filter((r) => r.table === "material_categories").length}).

## Para mirar

${spanishLeft.length === 0 ? "Ningún texto traducido conserva, fuera de las citas, una palabra que parezca española." : `${spanishLeft.length} textos traducidos conservan, fuera de las citas, algo que parece español (a veces es un nombre propio, como Hermès o Perú):\n\n${spanishLeft.slice(0, 40).map((x) => `- \`${x.key}\`: ${cell(x.en).slice(0, 160)}`).join("\n")}${spanishLeft.length > 40 ? `\n- … y ${spanishLeft.length - 40} más.` : ""}`}

${decimalComma.length === 0 ? "Ningún número con coma decimal fuera de las citas." : `${decimalComma.length} textos conservan, fuera de las citas, algo que parece una coma decimal:\n\n${decimalComma.map((x) => `- \`${x.key}\`: ${cell(x.en).slice(0, 160)}`).join("\n")}`}

${shorter.length === 0 ? "Ningún texto largo queda mucho más corto en inglés (menos del 70 %)." : `${shorter.length} textos largos quedan mucho más cortos en inglés (menos del 70 %), revisados uno a uno:\n\n${shorter.map((x) => `- \`${x.key}\`: ${x.es} → ${x.en} caracteres`).join("\n")}`}

Tablas que escribe: ${written.map((w) => `\`${w}.csv\``).join(", ")}.
`,
  "utf8",
);
console.log(
  `Tanda 36: ${english.size} textos cambian (${total} celdas); ${materialsRenamed.length} materiales cambian de nombre; ${newRules.length} reglas y ${newExclusions.length} exclusiones de IFRA en inglés; ` +
    `IFRA igual en ${ifraChecked} estándares de comunes y ${annexChecked} entradas del anexo. Para mirar: ${spanishLeft.length} con algo de español, ${decimalComma.length} con coma decimal, ${shorter.length} mucho más cortos. ${OUT}/informe.md`,
);
