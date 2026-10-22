/**
 * Batch 20 of the migration: the base of the new materials' system (V3-70; docs-v3/sistema-materiales.md).
 * Writes migracion-v3/tandas/20-comun-base/, one CSV per table of the `common` schema, for the
 * user to review (V3-21). Nothing here is new information: it reshapes what is already approved.
 *
 *   · The fixed vocabularies of the design (isomeric form, text type, relation type, treatments)
 *     and the attributes' catalogue, as the radiografía of 2026-10-22 lists them.
 *   · The user's nine general families, with their colours (V3-38), from v3/datos/family_palette.csv.
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
  { id: SOURCE_IFRA, name: "IFRA, 51.ª enmienda", url: "https://ifrafragrance.org/standards/library", kind: "regulation", consulted_on: null, notes: "Los archivos de IFRA en datos/ifra/51/ (P37), ya tratados en la tanda 6 de la v3." },
  { id: SOURCE_USER, name: "El usuario", url: null, kind: "own", consulted_on: null, notes: "Decisiones y datos del usuario: su paleta de familias (V3-38)." },
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
  ["unspecified", "sin especificar"],
  ["racemic", "racémico"],
  ["enantiomer", "enantiómero"],
  ["enriched", "enriquecido en un isómero"],
  ["single_isomer", "isómero único"],
].forEach(([c, n], i) => term("isomeric_form", c, n, i + 1));
[
  ["description", "descripción"],
  ["use", "uso"],
  ["history", "historia"],
  ["comparison", "comparación"],
  ["warning", "advertencia"],
  ["ifra_secondhand", "IFRA de segunda mano"],
].forEach(([c, n], i) => term("text_type", c, n, i + 1));
[
  ["substitute", "sustituto"],
  ["similar", "similar"],
  ["blends_with", "combina con"],
  ["confused_with", "se confunde con"],
  ["obtained_from", "se obtiene de"],
].forEach(([c, n], i) => term("relation_type", c, n, i + 1));
[
  ["rectified", "rectificado"],
  ["terpeneless", "sin terpenos"],
  ["fcf", "sin furocumarinas"],
  ["decolorized", "decolorado"],
].forEach(([c, n], i) => term("treatment", c, n, i + 1));
[
  ["top", "salida"],
  ["heart", "corazón"],
  ["base", "fondo"],
].forEach(([c, n], i) => term("note", c, n, i + 1));
for (const f of read("family_palette.csv")) {
  term("family", f.family, f.name, Number(f.order), { color: f.light });
}
notes.push(`Las nueve familias generales del usuario, con su color claro (V3-38), de v3/datos/family_palette.csv. El color oscuro y lo que cubre cada una siguen en ese archivo.`);

// ---------------------------------------------------------------- attributes
type Attr = [code: string, name: string, group: string, valueType: string, unit: string | null, list: string | null, appliesTo: string];
const ATTRIBUTES: Attr[] = [
  ["purity_typical", "pureza típica", "pure", "number", "fracción", null, "pure"],
  ["isomer_ratio", "proporción de isómeros", "pure", "text", null, null, "pure"],
  ["provenance", "procedencia", "natural", "list", null, "country", "natural"],
  ["concept", "concepto", "blend", "text", null, null, "blend"],
  ["product_isomers_purity", "isómeros o pureza del producto", "product", "text", null, null, "product"],
  ["families", "familias con %", "olfactory", "list", null, "family", "all"],
  ["subfamilies", "subfamilias con %", "olfactory", "list", null, "subfamily", "all"],
  ["descriptors", "descriptores", "olfactory", "list", null, "descriptor", "all"],
  ["odor_category", "categoría olfativa", "olfactory", "text", null, null, "all"],
  ["evokes", "evoca", "olfactory", "text", null, null, "all"],
  ["note", "nota", "olfactory", "list", null, "note", "all"],
  ["potency", "potencia", "performance", "number", null, null, "all"],
  ["diffusion", "difusión", "performance", "number", null, null, "all"],
  ["duration_strip", "duración en tira", "performance", "number", "h", null, "all"],
  ["odor_threshold", "umbral de olor", "performance", "number", null, null, "all"],
  ["working_dilution", "dilución de trabajo", "performance", "range", "fracción", null, "all"],
  ["dose_in_formula", "dosis en fórmula", "performance", "range", "fracción", null, "all"],
  ["role", "papel", "performance", "list", null, "role", "all"],
  ["solubility", "solubilidad", "performance", "text", null, null, "all"],
  ["physical_state", "estado físico", "physical", "list", null, "physical_state", "all"],
  ["appearance", "aspecto", "physical", "text", null, null, "all"],
  ["density", "densidad", "physical", "number", "g/mL", null, "all"],
  ["melting_point", "punto de fusión", "physical", "number", "°C", null, "all"],
  ["boiling_point", "punto de ebullición", "physical", "number", "°C", null, "all"],
  ["flash_point", "punto de inflamación", "physical", "number", "°C", null, "all"],
  ["vapor_pressure", "presión de vapor", "physical", "number", "mmHg", null, "all"],
  ["logp", "logP", "physical", "number", null, null, "all"],
  ["stains", "mancha o decolora", "physical", "text", null, null, "all"],
  ["stability", "estabilidad", "physical", "text", null, null, "all"],
  ["incompatibilities", "incompatibilidades", "physical", "text", null, null, "all"],
  ["handling", "manejo", "physical", "text", null, null, "all"],
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
notes.push(`${attributes.length} atributos: los 30 de la radiografía y «categoría olfativa», que trae PerfuMate (texto: «Bright citrus»).`);

// ---------------------------------------------------------------- IFRA 51
const AMENDMENT = uuidFor("common:amendment:51");
const amendments: Row[] = [{ id: AMENDMENT, number: 51, notified_on: null, in_force_new: null, in_force_existing: null, batch_id: BATCH }];
notes.push("La 51.ª enmienda, sin fechas: los archivos de IFRA que tiene la v3 no las dan.");
const CATEGORIES: ReadonlyArray<readonly [string, string]> = [
  ["1", "Productos para los labios"],
  ["2", "Desodorantes y antitranspirantes"],
  ["3", "Productos para los ojos y la cara de hombre"],
  ["4", "Perfume fino"],
  ["5A", "Cremas y lociones de cuerpo"],
  ["5B", "Cremas de cara"],
  ["5C", "Cremas de manos"],
  ["5D", "Productos de bebé"],
  ["6", "Productos para la boca"],
  ["7A", "Productos de pelo con aclarado"],
  ["7B", "Productos de pelo sin aclarado"],
  ["8", "Productos para las mucosas"],
  ["9", "Productos con aclarado para el cuerpo"],
  ["10A", "Productos del hogar"],
  ["10B", "Productos del hogar en aerosol"],
  ["11A", "Productos sin contacto con la piel o con contacto mínimo"],
  ["11B", "Productos con contacto mínimo y con aclarado"],
  ["12", "Productos sin contacto con la piel"],
];
const categoryId = (code: string) => uuidFor(`common:ifra-category:51:${code}`);
const ifraCategories: Row[] = CATEGORIES.map(([code, description]) => ({ id: categoryId(code), amendment_id: AMENDMENT, code, description, batch_id: BATCH }));
notes.push("Las descripciones de las 18 categorías son un resumen de la sesión en español, para mostrarlas; la definición que vale es la de IFRA.");

const substances = new Map<string, Row>();
const aliases = new Map<string, Row>();
function substance(cas: string, name: string, kind = "defined"): string {
  const id = substanceId(cas);
  if (!substances.has(cas)) substances.set(cas, { id, cas, name: name.trim() || cas, kind, formula: null, molecular_weight: null, smiles: null, inchikey: null, pubchem_cid: null, batch_id: BATCH });
  return id;
}

const standards = read("ifra_standards.csv");
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
    notice: a.notice || null,
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
    subgroup: s.subgroup || null,
    synonyms,
    batch_id: BATCH,
  };
});


const ifraRules: Row[] = [
  ...read("ifra_variant_rules.csv").map((r) => ({ id: r.id, standard_id: r.standard_id, kind: "variant", field: r.field, match: r.match, pattern: r.pattern, variant: r.variant, note: null, batch_id: BATCH })),
  ...read("ifra_spec_exclusions.csv").map((r) => ({ id: r.id, standard_id: r.standard_id, kind: "specification_exclusion", field: "process", match: "contains", pattern: r.process, variant: null, note: r.note, batch_id: BATCH })),
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
