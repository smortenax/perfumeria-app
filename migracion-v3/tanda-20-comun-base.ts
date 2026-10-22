/**
 * Batch 20 of the migration: the base of the new materials' system (V3-70; docs-v3/sistema-materiales.md).
 * Writes migracion-v3/tandas/20-comun-base/, one CSV per table of the `common` schema, for the
 * user to review (V3-21). Nothing here is new information: it reshapes what is already approved.
 *
 *   · The fixed vocabularies of the design (isomeric form, text type, relation type, treatments)
 *     and the attributes' catalogue, as the radiografía of 2026-10-22 lists them.
 *   · No families: each source brings its own, as it gives them (V3-71).
 *   · IFRA's 51st amendment as the v3 already has it (v3/datos/ifra_*.csv, batch 6, approved
 *     2026-10-14), by amendment and category, and every CAS it names as a substance.
 *
 *   node migracion-v3/tanda-20-comun-base.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Cell, writeTable } from "./lib/csv.ts";
import { attributeId, batchId, sourceId, substanceId, vocabId } from "./lib/comun.ts";
import { uuidFor } from "./lib/ids.ts";
import { parseCsv } from "../v3/scripts/csv.ts";

const OUT = "migracion-v3/tandas/20-comun-base";
const CODE = "20-comun-base";
const BATCH = batchId(CODE);
const CAS = /^[0-9]{2,7}-[0-9]{2}-[0-9]$/;

type Row = Record<string, Cell>;
const read = (file: string): Record<string, string>[] => {
  const [header, ...rows] = parseCsv(readFileSync(join("v3/datos", file), "utf8")).filter((r) => r.length > 1);
  return rows.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])));
};
const notes: string[] = [];

// ---------------------------------------------------------------- sources and batch
const SOURCE_IFRA = sourceId("ifra");
const SOURCE_USER = sourceId("user");
const sources: Row[] = [
  { id: SOURCE_IFRA, name: "IFRA, 51st Amendment", url: "https://ifrafragrance.org/standards/library", kind: "regulation", consulted_on: null, notes: "IFRA's files in datos/ifra/51/ (P37), already processed in batch 6 of the v3." },
  { id: SOURCE_USER, name: "The user", url: null, kind: "own", consulted_on: null, notes: "The user's decisions and data." },
];
const batches: Row[] = [
  { id: BATCH, code: CODE, script: "migracion-v3/tanda-20-comun-base.ts", source_id: null, status: "proposed", approval: null, commit: null, sha256: null },
];

// ---------------------------------------------------------------- vocabularies
const vocabularies: Row[] = [];
function term(list: string, code: string, name: string, sort: number | null = null, extra: Row = {}): string {
  const id = vocabId(list, code);
  vocabularies.push({ id, list, code, name, parent_id: null, color: null, sort, batch_id: BATCH, ...extra });
  return id;
}
[
  ["unspecified", "unspecified"],
  ["racemic", "racemic"],
  ["enantiomer", "enantiomer"],
  ["enriched", "enriched in one isomer"],
  ["single_isomer", "single isomer"],
].forEach(([c, n], i) => term("isomeric_form", c, n, i + 1));
[
  ["description", "description"],
  ["use", "use"],
  ["history", "history"],
  ["comparison", "comparison"],
  ["warning", "warning"],
  ["ifra_secondhand", "IFRA, second-hand"],
].forEach(([c, n], i) => term("text_type", c, n, i + 1));
[
  ["substitute", "substitute"],
  ["similar", "similar"],
  ["blends_with", "blends with"],
  ["confused_with", "confused with"],
  ["obtained_from", "obtained from"],
].forEach(([c, n], i) => term("relation_type", c, n, i + 1));
[
  ["rectified", "rectified"],
  ["terpeneless", "terpeneless"],
  ["fcf", "furocoumarin-free (FCF)"],
  ["decolorized", "decolorized"],
].forEach(([c, n], i) => term("treatment", c, n, i + 1));
[
  ["top", "top"],
  ["heart", "heart"],
  ["base", "base"],
].forEach(([c, n], i) => term("note", c, n, i + 1));
// Families come as each source gives them (V3-71): none are seeded here. The user's nine, with
// their colours (V3-38), stay in the app of today until the families are standardised.
notes.push("Sin familias: cada fuente trae las suyas, como las da (V3-71). Tus nueve familias, con su color (V3-38), siguen en la app actual hasta que se estandaricen.");

// ---------------------------------------------------------------- attributes
type Attr = [code: string, name: string, group: string, valueType: string, unit: string | null, list: string | null, appliesTo: string];
const ATTRIBUTES: Attr[] = [
  ["purity_typical", "typical purity", "pure", "number", "fraction", null, "pure"],
  ["isomer_ratio", "isomer ratio", "pure", "text", null, null, "pure"],
  ["provenance", "provenance", "natural", "list", null, "country", "natural"],
  ["concept", "concept", "blend", "text", null, null, "blend"],
  ["product_isomers_purity", "product isomers or purity", "product", "text", null, null, "product"],
  ["families", "families with %", "olfactory", "list", null, "family", "all"],
  ["subfamilies", "subfamilies with %", "olfactory", "list", null, "subfamily", "all"],
  ["descriptors", "descriptors", "olfactory", "list", null, "descriptor", "all"],
  ["odor_category", "odor category", "olfactory", "text", null, null, "all"],
  ["evokes", "evokes", "olfactory", "text", null, null, "all"],
  ["note", "note", "olfactory", "list", null, "note", "all"],
  ["potency", "potency", "performance", "number", null, null, "all"],
  ["diffusion", "diffusion", "performance", "number", null, null, "all"],
  ["duration_strip", "duration on strip", "performance", "number", "h", null, "all"],
  ["odor_threshold", "odor threshold", "performance", "number", null, null, "all"],
  ["working_dilution", "working dilution", "performance", "range", "fraction", null, "all"],
  ["dose_in_formula", "dose in formula", "performance", "range", "fraction", null, "all"],
  ["role", "role", "performance", "list", null, "role", "all"],
  ["solubility", "solubility", "performance", "text", null, null, "all"],
  ["physical_state", "physical state", "physical", "list", null, "physical_state", "all"],
  ["appearance", "appearance", "physical", "text", null, null, "all"],
  ["density", "density", "physical", "number", "g/mL", null, "all"],
  ["melting_point", "melting point", "physical", "number", "°C", null, "all"],
  ["boiling_point", "boiling point", "physical", "number", "°C", null, "all"],
  ["flash_point", "flash point", "physical", "number", "°C", null, "all"],
  ["vapor_pressure", "vapor pressure", "physical", "number", "mmHg", null, "all"],
  ["logp", "logP", "physical", "number", null, null, "all"],
  ["stains", "stains or discolors", "physical", "text", null, null, "all"],
  ["stability", "stability", "physical", "text", null, null, "all"],
  ["incompatibilities", "incompatibilities", "physical", "text", null, null, "all"],
  ["handling", "handling", "physical", "text", null, null, "all"],
];
const attributes: Row[] = ATTRIBUTES.map(([code, name, group, valueType, unit, list, appliesTo], i) => ({
  id: attributeId(code),
  code,
  name,
  group,
  value_type: valueType,
  unit,
  is_list: list !== null,
  vocabulary_list: list,
  applies_to: appliesTo,
  sort: i + 1,
  batch_id: BATCH,
}));
notes.push(`${attributes.length} atributos: los 30 de la radiografía y «odor category», que trae PerfuMate (texto: «Bright citrus»). Nombres en inglés (V3-71).`);

// ---------------------------------------------------------------- IFRA 51
const AMENDMENT = uuidFor("common:amendment:51");
const amendments: Row[] = [{ id: AMENDMENT, number: 51, notified_on: null, in_force_new: null, in_force_existing: null, batch_id: BATCH }];
notes.push("La 51.ª enmienda, sin fechas: los archivos de IFRA que tiene la v3 no las dan.");
const CATEGORIES: ReadonlyArray<readonly [string, string]> = [
  ["1", "Lip products"],
  ["2", "Axillae products (deodorants and antiperspirants)"],
  ["3", "Products applied to the face or body with the fingertips (eye products, men's facial products)"],
  ["4", "Fine fragrance products"],
  ["5A", "Body lotion products, applied with the hands"],
  ["5B", "Face moisturiser products, applied with the hands"],
  ["5C", "Hand cream products"],
  ["5D", "Baby creams, baby oils and baby talc"],
  ["6", "Products with oral and lip exposure (mouthwash, toothpaste)"],
  ["7A", "Rinse-off hair products, with some hand contact"],
  ["7B", "Leave-on hair products, with some hand contact"],
  ["8", "Products with significant anogenital exposure"],
  ["9", "Rinse-off products with body and hand exposure"],
  ["10A", "Household care products with mostly hand contact, excluding aerosols and sprays"],
  ["10B", "Household care products with mostly hand contact, including aerosols and sprays"],
  ["11A", "Products with intended skin contact but minimal transfer from an inert substrate, without UV exposure"],
  ["11B", "Products with intended skin contact but minimal transfer from an inert substrate, with possible UV exposure"],
  ["12", "Products not intended for direct skin contact"],
];
const categoryId = (code: string) => uuidFor(`common:ifra-category:51:${code}`);
const ifraCategories: Row[] = CATEGORIES.map(([code, description]) => ({ id: categoryId(code), amendment_id: AMENDMENT, code, description, batch_id: BATCH }));
notes.push("Las descripciones de las 18 categorías, en inglés, son un resumen de la sesión de las definiciones de IFRA (de memoria: los archivos de IFRA de la v3 no las traen); la definición que vale es la de la guía de IFRA.");

const substances = new Map<string, Row>();
const aliases = new Map<string, Row>();
function substance(cas: string, name: string, kind = "defined"): string {
  const id = substanceId(cas);
  if (!substances.has(cas)) substances.set(cas, { id, cas, name: name.trim() || cas, kind, formula: null, molecular_weight: null, smiles: null, inchikey: null, pubchem_cid: null, batch_id: BATCH });
  return id;
}

const standards = read("ifra_standards.csv");
// The few Spanish notes of batch 6, in English (V3-71).
const SUBGROUP_EN: Readonly<Record<string, string>> = { "miembro por nombre, según la v2 (V3-44)": "member by name, as in the v2 (V3-44)" };
const NOTICE_EN: Readonly<Record<string, string>> = { "IFRA escribe «0..3»; se lee 0.3": "IFRA writes «0..3»; read as 0.3" };
const ifraSubstanceRows = read("ifra_substances.csv");
const membersOf = new Map<string, number>();
for (const s of ifraSubstanceRows) membersOf.set(s.standard_id, (membersOf.get(s.standard_id) ?? 0) + 1);
const standardName = new Map(standards.map((s) => [s.id, s.name]));
const bool = (t: string) => t === "true";
const ifraStandards: Row[] = standards.map((s) => ({
  id: s.id,
  amendment_id: AMENDMENT,
  code: s.code,
  name: s.name,
  last_amended: s.amendment ? Number(s.amendment) : null,
  type: s.type,
  prohibition: bool(s.prohibition),
  restriction: bool(s.restriction),
  specification: bool(s.specification),
  prohibited_as_such: bool(s.prohibited_as_such),
  group_key: s.group_key,
  limit_expressed_as: s.limit_expressed_as || null,
  limit_expressed_as_cas: s.limit_expressed_as_cas || null,
  prohibition_note: s.prohibition_note || null,
  restriction_note: s.restriction_note || null,
  specification_note: s.specification_note || null,
  limit_note: s.limit_note || null,
  phototoxicity_note: s.phototoxicity_note || null,
  property: s.property || null,
  scope_note: s.scope_note || null,
  contributions: s.contributions || null,
  contributions_note: s.contributions_note || null,
  batch_id: BATCH,
}));

const ifraLimits: Row[] = read("ifra_limits.csv").map((l) => ({
  id: l.id,
  standard_id: l.standard_id,
  category_id: categoryId(l.category),
  kind: l.kind,
  max_value: l.max_value || null,
  batch_id: BATCH,
}));

const annexRows = read("ifra_annex.csv");
// The annex first: its constituents are defined substances, its naturals' own CAS are UVCBs, and both come with a name.
for (const a of annexRows) substance(a.constituent_cas, a.constituent_name);
const ifraAnnex: Row[] = annexRows.map((a) => {
  // One row writes three CAS in one cell («8016-26-0 89997-74-0 84775-64-4»): the first is the natural's, the rest are aliases.
  const [main, ...more] = a.natural_cas.split(/\s+/).filter(Boolean);
  if (more.length > 0) notes.push(`El anexo da ${a.natural_cas} en una celda (${a.natural_name}): el primero es el CAS del natural y los demás, sus alias.`);
  const natural = main ? substance(main, a.natural_name, "natural_uvcb") : null;
  if (natural) {
    for (const other of [...more, ...(JSON.parse(a.natural_other_cas || "[]") as string[])]) {
      if (!CAS.test(other) || other === main) continue;
      if (substances.has(other)) {
        if (substances.get(other)!.id !== natural) notes.push(`Alias no puesto: ${other} es otro CAS de ${a.natural_name} en el anexo, pero ya es una sustancia (${substances.get(other)!.name}).`);
        continue;
      }
      const previous = aliases.get(other);
      if (previous && previous.substance_id !== natural) {
        notes.push(`Alias no puesto: ${other} aparece como otro CAS de dos naturales distintos del anexo.`);
        continue;
      }
      aliases.set(other, { id: uuidFor(`common:substance-alias:${other}`), substance_id: natural, cas_alias: other, reason: `Otro CAS de ${a.natural_name} en el anexo de IFRA`, batch_id: BATCH });
    }
  }
  return {
    id: a.id,
    amendment_id: AMENDMENT,
    natural_substance_id: natural,
    constituent_substance_id: substanceId(a.constituent_cas),
    concentration: a.concentration,
    natural_name: a.natural_name,
    botanical_name: a.botanical_name || null,
    iso_category: a.iso_category || null,
    rifm_id: a.rifm_id || null,
    constituent_standard: a.constituent_standard || null,
    notice: NOTICE_EN[a.notice] ?? (a.notice || null),
    batch_id: BATCH,
  };
});
// An alias that later turned out to be a substance of its own is not an alias.
for (const cas of [...aliases.keys()]) if (substances.has(cas)) aliases.delete(cas);

const ifraSubstances: Row[] = ifraSubstanceRows.map((s) => {
  const synonyms = JSON.parse(s.synonyms || "[]") as string[];
  // After the annex, whose names are better (a natural's name, not its CAS). A standard with one CAS names its substance; otherwise its first synonym does, or the standard with the CAS.
  const name = membersOf.get(s.standard_id) === 1 ? standardName.get(s.standard_id)! : (synonyms[0] ?? `${standardName.get(s.standard_id)} (${s.cas})`);
  return {
    id: s.id,
    standard_id: s.standard_id,
    substance_id: substance(s.cas, name),
    original_cas: s.cas,
    subgroup: SUBGROUP_EN[s.subgroup] ?? (s.subgroup || null),
    synonyms,
    batch_id: BATCH,
  };
});


// The rules match the process as the new system writes it: an English code of the «process» list
// (V3-71). The v3 of today matched Spanish process names; each pattern gets its English word.
// «rectificado» is a treatment in the new system, not a process: the rule reads that list.
const PATTERN_EN: Readonly<Record<string, readonly [field: string | null, match: string | null, pattern: string]>> = {
  aceite: [null, "contains", "oil"],
  absoluto: [null, null, "absolute"],
  destilad: [null, null, "distilled"],
  extracto: [null, null, "extract"],
  resinoide: [null, null, "resinoid"],
  rectificado: ["treatment", null, "rectified"],
};
function englishRule(field: string, match: string, pattern: string) {
  if (field !== "process") return { field, match, pattern };
  const en = PATTERN_EN[pattern];
  if (!en) throw new Error(`Regla de IFRA sin palabra en inglés: «${pattern}»`);
  // «starts with aceite» (aceite esencial, aceite por expresión) is «contains oil» in the codes (essential_oil, expressed_oil).
  return { field: en[0] ?? field, match: en[1] ?? match, pattern: en[2] };
}
const SPEC_NOTE_EN: Readonly<Record<string, string>> = {
  "6e94aa32-d433-5677-b577-e105108450ff":
    "datos/v2/exclusiones.csv: IFRA 51, STD 078: «Styrax oil obtained through pyrolysis shall be rectified…»; the PAH specification is the pyrolysis oil's, not a resinoid's (the user, 2026-10-03: only the resinoid). On 2026-10-04 «absolute», «extract» and «solvent extraction» were removed; they had been added on 2026-10-03 without a decision of the user.",
};
notes.push("Las reglas de variante de IFRA se escriben con la palabra en inglés del proceso (V3-71): aceite → oil (y «empieza por aceite» → «contiene oil»), absoluto → absolute, destilad → distilled, extracto → extract, resinoide → resinoid; «rectificado» pasa a la lista de tratamientos (rectified), porque en el sistema nuevo no es un proceso. Las notas, traducidas.");
const ifraRules: Row[] = [
  ...read("ifra_variant_rules.csv").map((r) => ({ id: r.id, standard_id: r.standard_id, kind: "variant", ...englishRule(r.field, r.match, r.pattern), variant: r.variant, note: null, batch_id: BATCH })),
  ...read("ifra_spec_exclusions.csv").map((r) => ({ id: r.id, standard_id: r.standard_id, kind: "specification_exclusion", ...englishRule("process", "contains", r.process), variant: null, note: SPEC_NOTE_EN[r.id] ?? r.note, batch_id: BATCH })),
];

// ---------------------------------------------------------------- write
const tables: Array<[string, string[], Row[]]> = [
  ["sources", ["id", "name", "url", "kind", "consulted_on", "notes"], sources],
  ["batches", ["id", "code", "script", "source_id", "status", "approval", "commit", "sha256"], batches],
  ["vocabularies", ["id", "list", "code", "name", "parent_id", "color", "sort", "batch_id"], vocabularies],
  ["attributes", ["id", "code", "name", "group", "value_type", "unit", "is_list", "vocabulary_list", "applies_to", "sort", "batch_id"], attributes],
  ["amendments", ["id", "number", "notified_on", "in_force_new", "in_force_existing", "batch_id"], amendments],
  ["ifra_categories", ["id", "amendment_id", "code", "description", "batch_id"], ifraCategories],
  ["substances", ["id", "cas", "name", "kind", "formula", "molecular_weight", "smiles", "inchikey", "pubchem_cid", "batch_id"], [...substances.values()]],
  ["substance_aliases", ["id", "substance_id", "cas_alias", "reason", "batch_id"], [...aliases.values()]],
  ["ifra_standards", Object.keys(ifraStandards[0]), ifraStandards],
  ["ifra_substances", ["id", "standard_id", "substance_id", "original_cas", "subgroup", "synonyms", "batch_id"], ifraSubstances],
  ["ifra_limits", ["id", "standard_id", "category_id", "kind", "max_value", "batch_id"], ifraLimits],
  ["ifra_annex", Object.keys(ifraAnnex[0]), ifraAnnex],
  ["ifra_rules", ["id", "standard_id", "kind", "field", "match", "pattern", "variant", "note", "batch_id"], ifraRules],
];
for (const [name, columns, rows] of tables) writeTable(join(OUT, `${name}.csv`), columns, rows);

const report = [
  "# Tanda 20 · base del sistema nuevo de materiales",
  "",
  "La base de lo común en el esquema nuevo (V3-70; `docs-v3/sistema-materiales.md`). No trae información nueva: reordena lo ya aprobado.",
  "",
  "| Tabla | Filas |",
  "|---|---|",
  ...tables.map(([name, , rows]) => `| ${name} | ${rows.length} |`),
  "",
  "## Qué hay que mirar",
  "",
  ...[...new Set(notes)].map((n) => `- ${n}`),
  "",
];
writeFileSync(join(OUT, "informe.md"), report.join("\n"), "utf8");
console.log(`${OUT}: ${tables.map(([n, , r]) => `${n} ${r.length}`).join(", ")}`);
