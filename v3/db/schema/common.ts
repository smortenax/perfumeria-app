import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * The new materials' system, common side (V3-70; reference: docs-v3/sistema-materiales.md).
 * It lives in its own Postgres schema, `common`, beside the tables of today, which it does not
 * touch: the app keeps reading those until the user's side moves over. Every row here is written
 * by the loading script (`npm run datos:cargar-comun`), by batches the user approves, and each
 * one says which batch it came from; a signed-in user only reads.
 *
 * Four groups: support (sources, companies, vocabularies, scales, batches), the chemical core
 * (substances), the glossary (identity, products, compositions, claims and the resolved sheet)
 * and regulation (IFRA by amendment, EU allergens). Every fraction is a `numeric` (exact), never
 * a float: text on the phone, an exact Ratio in the engine (A3).
 */
export const common = pgSchema("common");

/** Vocabulary lists kept as rows (they grow, have parents and colours, and sources map onto them). */
export const VOCABULARY_LISTS = [
  "family",
  "subfamily",
  "descriptor",
  "part",
  "process",
  "treatment",
  "isomeric_form",
  "physical_state",
  "role",
  "note",
  "country",
  "relation_type",
  "text_type",
] as const;

const inList = (column: AnyPgColumn, values: readonly string[]) =>
  sql`${column} in (${sql.raw(values.map((v) => `'${v}'`).join(", "))})`;
const fraction = (column: AnyPgColumn) => sql`(${column} is null or (${column} >= 0 and ${column} <= 1))`;
/** A vocabulary column: its list is a constant generated column, so the pair (list, id) can be a foreign key. */
const listOf = (name: string, list: (typeof VOCABULARY_LISTS)[number]) =>
  text(name).generatedAlwaysAs(sql.raw(`'${list}'`));

// ---------------------------------------------------------------- support

/** Each web, document, laboratory or regulation a datum comes from. */
export const sources = common.table(
  "sources",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    url: text("url"),
    kind: text("kind").notNull(),
    consultedOn: date("consulted_on"),
    notes: text("notes"),
  },
  (t) => [
    unique("sources_name").on(t.name),
    check("sources_kind", inList(t.kind, ["web", "manufacturer_document", "laboratory", "own", "regulation"])),
  ],
);

/** Each load of the script: every glossary row says which one it came from, and a batch can be undone whole. */
export const batches = common.table(
  "batches",
  {
    id: uuid("id").primaryKey(),
    /** «20-perfumate»: the folder of migracion-v3/tandas/ it was written in. */
    code: text("code").notNull(),
    loadedAt: timestamp("loaded_at", { withTimezone: true }).notNull().defaultNow(),
    script: text("script").notNull(),
    sourceId: uuid("source_id").references(() => sources.id),
    status: text("status").notNull().default("proposed"),
    /** The user's words, quoted, when approved. */
    approval: text("approval"),
    commit: text("commit"),
    sha256: text("sha256"),
  },
  (t) => [unique("batches_code").on(t.code), check("batches_status", inList(t.status, ["proposed", "approved", "reverted"]))],
);

/** All vocabulary lists in one table; (list, id) is what other tables point to, so a family cannot be a «part». */
export const vocabularies = common.table(
  "vocabularies",
  {
    id: uuid("id").primaryKey(),
    list: text("list").notNull(),
    /** Stable code: «citrus», «essential_oil». */
    code: text("code").notNull(),
    /** As the app shows it, in Spanish. */
    name: text("name").notNull(),
    /** Two-level families (A10): a detailed family points to its general one. */
    parentId: uuid("parent_id").references((): AnyPgColumn => vocabularies.id),
    /** Families only: their fixed colour (V3-38). */
    color: text("color"),
    sort: integer("sort"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("vocabularies_list_code").on(t.list, t.code),
    unique("vocabularies_list_id").on(t.list, t.id),
    check("vocabularies_list", inList(t.list, VOCABULARY_LISTS)),
  ],
);

/** Which word of each source is which term of ours. */
export const equivalences = common.table(
  "equivalences",
  {
    id: uuid("id").primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id),
    sourceTerm: text("source_term").notNull(),
    list: text("list").notNull(),
    vocabularyId: uuid("vocabulary_id").notNull(),
    note: text("note"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("equivalences_once").on(t.sourceId, t.list, t.sourceTerm),
    foreignKey({ name: "equivalences_term", columns: [t.list, t.vocabularyId], foreignColumns: [vocabularies.list, vocabularies.id] }),
  ],
);

/** Manufacturers, distributors and laboratories. */
export const companies = common.table(
  "companies",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    /** Null when no source says it. */
    role: text("role"),
    countryList: listOf("country_list", "country"),
    countryId: uuid("country_id"),
    website: text("website"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("companies_name").on(t.name),
    check("companies_role", sql`${t.role} is null or ${inList(t.role, ["manufacturer", "distributor", "laboratory"])}`),
    foreignKey({ name: "companies_country", columns: [t.countryList, t.countryId], foreignColumns: [vocabularies.list, vocabularies.id] }),
  ],
);

// ---------------------------------------------------------------- chemical core

/** Each substance by its CAS, with the molecule's chemistry, once: the one door between the glossary, the user's side and IFRA. */
export const substances = common.table(
  "substances",
  {
    id: uuid("id").primaryKey(),
    /** Null only for a constituent a source names without a CAS. */
    cas: text("cas"),
    name: text("name").notNull(),
    kind: text("kind").notNull().default("defined"),
    formula: text("formula"),
    molecularWeight: numeric("molecular_weight"),
    smiles: text("smiles"),
    inchikey: text("inchikey"),
    pubchemCid: bigint("pubchem_cid", { mode: "bigint" }),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("substances_cas").on(t.cas),
    check("substances_cas_format", sql`${t.cas} is null or ${t.cas} ~ '^[0-9]{2,7}-[0-9]{2}-[0-9]$'`),
    check("substances_kind", inList(t.kind, ["defined", "natural_uvcb", "group"])),
  ],
);

/** Other CAS of the same substance, so that an old CAS or an isomer's finds its standard. */
export const substanceAliases = common.table(
  "substance_aliases",
  {
    id: uuid("id").primaryKey(),
    substanceId: uuid("substance_id")
      .notNull()
      .references(() => substances.id, { onDelete: "cascade" }),
    casAlias: text("cas_alias").notNull(),
    reason: text("reason"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [unique("substance_aliases_cas").on(t.casAlias), check("substance_aliases_cas_format", sql`${t.casAlias} ~ '^[0-9]{2,7}-[0-9]{2}-[0-9]$'`)],
);

// ---------------------------------------------------------------- glossary

/**
 * The identity: pure (a substance and its isomeric form), natural (species, part, process,
 * chemotype and treatments) or blend (its company and name). Each type has its own columns and a
 * check keeps the others empty. `identity_key` is unique; the script writes it and the database
 * verifies it at commit (common.check_identity_key).
 */
export const materials = common.table(
  "materials",
  {
    id: uuid("id").primaryKey(),
    /** Chemical for a pure material, in Spanish for a natural; the trade name goes to the product (A9). */
    name: text("name").notNull(),
    ticker: text("ticker"),
    tickerOrigin: text("ticker_origin"),
    type: text("type").notNull(),
    origin: text("origin"),
    isSolvent: boolean("is_solvent").notNull().default(false),
    /** Pure: required. Natural or blend: its own, when it has a CAS (lemon oil, 8008-56-8). */
    substanceId: uuid("substance_id").references(() => substances.id),
    isomericFormList: listOf("isomeric_form_list", "isomeric_form"),
    isomericFormId: uuid("isomeric_form_id"),
    species: text("species"),
    partList: listOf("part_list", "part"),
    partId: uuid("part_id"),
    processList: listOf("process_list", "process"),
    processId: uuid("process_id"),
    chemotype: text("chemotype"),
    /** Blends only, and required. */
    companyId: uuid("company_id").references(() => companies.id),
    identityKey: text("identity_key").notNull(),
    /** A duplicate points to the one that stays, and is never deleted. */
    mergedIntoId: uuid("merged_into_id").references((): AnyPgColumn => materials.id),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("materials_identity_key").on(t.identityKey),
    unique("materials_ticker").on(t.ticker),
    check("materials_type", inList(t.type, ["pure", "natural", "blend"])),
    check("materials_ticker_origin", sql`${t.tickerOrigin} is null or ${inList(t.tickerOrigin, ["own", "fig", "ifra", "session"])}`),
    check("materials_origin", sql`${t.origin} is null or ${inList(t.origin, ["synthetic", "natural_isolate", "biotech", "semisynthetic", "natural"])}`),
    check(
      "materials_by_type",
      sql`case ${t.type}
        when 'pure' then ${t.substanceId} is not null and ${t.species} is null and ${t.partId} is null and ${t.processId} is null and ${t.chemotype} is null and ${t.companyId} is null
        when 'natural' then ${t.species} is not null and ${t.isomericFormId} is null and ${t.companyId} is null
        when 'blend' then ${t.companyId} is not null and ${t.species} is null and ${t.partId} is null and ${t.processId} is null and ${t.chemotype} is null and ${t.isomericFormId} is null
        else false end`,
    ),
    check("materials_not_merged_into_itself", sql`${t.mergedIntoId} is null or ${t.mergedIntoId} <> ${t.id}`),
    foreignKey({ name: "materials_isomeric_form", columns: [t.isomericFormList, t.isomericFormId], foreignColumns: [vocabularies.list, vocabularies.id] }),
    foreignKey({ name: "materials_part", columns: [t.partList, t.partId], foreignColumns: [vocabularies.list, vocabularies.id] }),
    foreignKey({ name: "materials_process", columns: [t.processList, t.processId], foreignColumns: [vocabularies.list, vocabularies.id] }),
    index("materials_substance").on(t.substanceId),
  ],
);

/** The treatments of a natural (rectified, terpeneless, FCF): part of its identity key, sorted. */
export const naturalTreatments = common.table(
  "natural_treatments",
  {
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    treatmentList: listOf("treatment_list", "treatment"),
    treatmentId: uuid("treatment_id").notNull(),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    primaryKey({ name: "natural_treatments_pk", columns: [t.materialId, t.treatmentId] }),
    foreignKey({ name: "natural_treatments_term", columns: [t.treatmentList, t.treatmentId], foreignColumns: [vocabularies.list, vocabularies.id] }),
  ],
);

/** Names and codes that are not a CAS: INCI, FEMA, EINECS, synonyms and trade names. The CAS lives only in substances. */
export const identifiers = common.table(
  "identifiers",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    value: text("value").notNull(),
    sourceId: uuid("source_id").references(() => sources.id),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("identifiers_once").on(t.materialId, t.kind, t.value),
    check("identifiers_kind", inList(t.kind, ["inci", "fema", "einecs", "synonym", "trade_name", "chemical_name", "other_language", "other"])),
    index("identifiers_value").on(t.value),
  ],
);

/** Substitutes, similar, blends with, confused with, obtained from (the reactants of a reaction product). */
export const relations = common.table(
  "relations",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    kindList: listOf("kind_list", "relation_type"),
    kindId: uuid("kind_id").notNull(),
    otherId: uuid("other_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").references(() => sources.id),
    note: text("note"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    check("relations_not_itself", sql`${t.materialId} <> ${t.otherId}`),
    foreignKey({ name: "relations_kind", columns: [t.kindList, t.kindId], foreignColumns: [vocabularies.list, vocabularies.id] }),
  ],
);

/** Perfumes where the material stands out. */
export const referencePerfumes = common.table("reference_perfumes", {
  id: uuid("id").primaryKey(),
  materialId: uuid("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  perfume: text("perfume").notNull(),
  house: text("house"),
  year: integer("year"),
  sourceId: uuid("source_id").references(() => sources.id),
  batchId: uuid("batch_id").references(() => batches.id),
});

/** Texts with their source. A text never computes; a datum inside one is taken out to a claim. */
export const materialTexts = common.table(
  "material_texts",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    kindList: listOf("kind_list", "text_type"),
    kindId: uuid("kind_id").notNull(),
    text: text("text").notNull(),
    language: text("language"),
    sourceId: uuid("source_id").references(() => sources.id),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [foreignKey({ name: "material_texts_kind", columns: [t.kindList, t.kindId], foreignColumns: [vocabularies.list, vocabularies.id] })],
);

/** How a company sells it. The dilution is informative: the product's composition is already as sold, solvent included (P14). */
export const products = common.table(
  "products",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    tradeName: text("trade_name").notNull(),
    code: text("code"),
    captive: boolean("captive"),
    grade: text("grade"),
    dilution: numeric("dilution"),
    solventMaterialId: uuid("solvent_material_id").references(() => materials.id),
    status: text("status"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("products_once").on(t.materialId, t.companyId, t.tradeName),
    unique("products_id_material").on(t.id, t.materialId),
    check("products_dilution", sql`${t.dilution} is null or (${t.dilution} > 0 and ${t.dilution} <= 1)`),
    check("products_status", sql`${t.status} is null or ${inList(t.status, ["in_catalog", "discontinued"])}`),
  ],
);

export const amendments = common.table(
  "amendments",
  {
    id: uuid("id").primaryKey(),
    number: integer("number").notNull(),
    notifiedOn: date("notified_on"),
    inForceNew: date("in_force_new"),
    inForceExisting: date("in_force_existing"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [unique("amendments_number").on(t.number)],
);

/** The categories of use of one amendment (18 in the 51st). IFRA's limits, the manufacturers' caps, the user's limits and the formula point here. */
export const ifraCategories = common.table(
  "ifra_categories",
  {
    id: uuid("id").primaryKey(),
    amendmentId: uuid("amendment_id")
      .notNull()
      .references(() => amendments.id),
    code: text("code").notNull(),
    description: text("description"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [unique("ifra_categories_once").on(t.amendmentId, t.code)],
);

/** The manufacturer's documents. An IFRA certificate points to its amendment, so the app can say when it is out of date. */
export const documents = common.table(
  "documents",
  {
    id: uuid("id").primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    fileUrl: text("file_url"),
    issuedOn: date("issued_on"),
    amendmentId: uuid("amendment_id").references(() => amendments.id),
    pages: integer("pages"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [check("documents_kind", inList(t.kind, ["sds", "ifra_certificate", "allergens", "analysis", "specification", "other"]))],
);

/** A manufacturer's limit of use. It is not IFRA: compared afterwards, the strictest wins. */
export const manufacturerCaps = common.table(
  "manufacturer_caps",
  {
    id: uuid("id").primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => ifraCategories.id),
    cap: numeric("cap").notNull(),
    documentId: uuid("document_id").references(() => documents.id),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [check("manufacturer_caps_cap", sql`${t.cap} > 0 and ${t.cap} <= 1`)],
);

/** The header of a composition: whose it is (the material, generic, or a product as sold), who gives it and from which document. */
export const compositions = common.table(
  "compositions",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id").references(() => materials.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
    authority: text("authority").notNull(),
    documentId: uuid("document_id").references(() => documents.id),
    sourceId: uuid("source_id").references(() => sources.id),
    page: integer("page"),
    quote: text("quote"),
    datedOn: date("dated_on"),
    /** When the source gives only part of it. */
    incomplete: boolean("incomplete").notNull().default(false),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    check("compositions_one_owner", sql`(${t.materialId} is null) <> (${t.productId} is null)`),
    check("compositions_authority", inList(t.authority, ["product", "literature", "consensus"])),
  ],
);

const amountChecks = (name: string, t: { amountKind: AnyPgColumn; value: AnyPgColumn; min: AnyPgColumn; max: AnyPgColumn }) => [
  check(`${name}_amount_kind`, inList(t.amountKind, ["typical", "max", "range", "unspecified"])),
  check(
    `${name}_amount`,
    sql`case ${t.amountKind}
      when 'range' then ${t.value} is null and ${t.min} is not null and ${t.max} is not null and ${t.min} >= 0 and ${t.min} <= ${t.max} and ${t.max} <= 1
      else ${t.value} is not null and ${t.min} is null and ${t.max} is null and ${t.value} > 0 and ${t.value} <= 1 end`,
  ),
];

/** The substances of a composition and their fraction. «unspecified»: the source gives a number and does not say whether typical or maximum. */
export const compositionLines = common.table(
  "composition_lines",
  {
    id: uuid("id").primaryKey(),
    compositionId: uuid("composition_id")
      .notNull()
      .references(() => compositions.id, { onDelete: "cascade" }),
    substanceId: uuid("substance_id")
      .notNull()
      .references(() => substances.id),
    amountKind: text("amount_kind").notNull(),
    value: numeric("value"),
    min: numeric("min"),
    max: numeric("max"),
    /** The molecules that define a blend. */
    defines: boolean("defines").notNull().default(false),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [unique("composition_lines_once").on(t.compositionId, t.substanceId), ...amountChecks("composition_lines", t)],
);

/** What shape each datum that goes by source has. Adding a datum is adding a row. */
export const attributes = common.table(
  "attributes",
  {
    id: uuid("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    group: text("group").notNull(),
    valueType: text("value_type").notNull(),
    unit: text("unit"),
    isList: boolean("is_list").notNull().default(false),
    /** The vocabulary list its terms come from, when it is a list. */
    vocabularyList: text("vocabulary_list"),
    appliesTo: text("applies_to").notNull().default("all"),
    sort: integer("sort"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("attributes_code").on(t.code),
    check("attributes_group", inList(t.group, ["pure", "natural", "blend", "product", "olfactory", "performance", "physical"])),
    check("attributes_value_type", inList(t.valueType, ["number", "range", "text", "list", "boolean"])),
    check("attributes_vocabulary_list", sql`(${t.vocabularyList} is null) = (not ${t.isList}) and (${t.vocabularyList} is null or ${inList(t.vocabularyList, VOCABULARY_LISTS)})`),
    check("attributes_applies_to", inList(t.appliesTo, ["pure", "natural", "blend", "product", "all"])),
  ],
);

/** Each potency or diffusion scale of a source and how it converts to ours. «unconverted»: the conversion is not decided yet. */
export const scales = common.table(
  "scales",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    sourceId: uuid("source_id").references(() => sources.id),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => attributes.id),
    min: numeric("min"),
    max: numeric("max"),
    rule: text("rule").notNull(),
    points: jsonb("points"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [unique("scales_name").on(t.name), check("scales_rule", inList(t.rule, ["min_max", "points", "unconverted"]))],
);

/**
 * One claim: what a source said about one attribute of a material (or of one of its products),
 * kept as said, converted to our unit and scale, with its conditions. One star per material,
 * product and attribute (decided 2026-10-22): the generic star has no product.
 */
export const claims = common.table(
  "claims",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    productId: uuid("product_id"),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => attributes.id),
    /** As the source said it: «3 days», «Low», «Neat or 10%». */
    originalValue: text("original_value"),
    originalUnit: text("original_unit"),
    /** Converted to our unit and scale; null when it cannot be (yet). */
    valueMin: numeric("value_min"),
    valueMax: numeric("value_max"),
    valueText: text("value_text"),
    scaleId: uuid("scale_id").references(() => scales.id),
    dilution: numeric("dilution"),
    solventMaterialId: uuid("solvent_material_id").references(() => materials.id),
    temperatureC: numeric("temperature_c"),
    pressure: text("pressure"),
    support: text("support"),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id),
    /** When it copies another claim: it does not count as a separate source. */
    derivedFromId: uuid("derived_from_id").references((): AnyPgColumn => claims.id),
    rank: text("rank").notNull().default("normal"),
    reason: text("reason"),
    quote: text("quote"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    foreignKey({ name: "claims_product_of_material", columns: [t.productId, t.materialId], foreignColumns: [products.id, products.materialId] }).onDelete(
      "cascade",
    ),
    check("claims_rank", inList(t.rank, ["star", "normal", "discarded", "disputed"])),
    check("claims_support", sql`${t.support} is null or ${inList(t.support, ["strip", "skin"])}`),
    check("claims_dilution", sql`${t.dilution} is null or (${t.dilution} > 0 and ${t.dilution} <= 1)`),
    check("claims_range", sql`${t.valueMin} is null or ${t.valueMax} is null or ${t.valueMin} <= ${t.valueMax}`),
    check("claims_not_derived_from_itself", sql`${t.derivedFromId} is null or ${t.derivedFromId} <> ${t.id}`),
    index("claims_material").on(t.materialId, t.attributeId),
  ],
);

/** The values of a list attribute: «floral 67 %, citrus 33 %» is one claim with two terms. The list comes from the attribute. */
export const claimTerms = common.table(
  "claim_terms",
  {
    id: uuid("id").primaryKey(),
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "cascade" }),
    list: text("list").notNull(),
    vocabularyId: uuid("vocabulary_id").notNull(),
    percentage: numeric("percentage"),
    sort: integer("sort"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("claim_terms_once").on(t.claimId, t.vocabularyId),
    foreignKey({ name: "claim_terms_term", columns: [t.list, t.vocabularyId], foreignColumns: [vocabularies.list, vocabularies.id] }),
    check("claim_terms_percentage", fraction(t.percentage)),
  ],
);

/**
 * The resolved sheet the app reads: one generic row per material and one per product with data of
 * its own. A table the script writes (common.refresh_sheets), not a view, so PowerSync can copy it.
 */
export const sheets = common.table(
  "sheets",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tradeName: text("trade_name"),
    ticker: text("ticker"),
    type: text("type").notNull(),
    identityKey: text("identity_key").notNull(),
    familyList: listOf("family_list", "family"),
    familyId: uuid("family_id"),
    durationH: numeric("duration_h"),
    workingDilution: text("working_dilution"),
    density: numeric("density"),
    noteList: listOf("note_list", "note"),
    noteId: uuid("note_id"),
    /** Every starred claim, by attribute code: the value that wins, its source and its terms. */
    values: jsonb("values").notNull().default(sql`'{}'::jsonb`),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("sheets_once").on(t.materialId, t.productId).nullsNotDistinct(),
    foreignKey({ name: "sheets_family", columns: [t.familyList, t.familyId], foreignColumns: [vocabularies.list, vocabularies.id] }),
    foreignKey({ name: "sheets_note", columns: [t.noteList, t.noteId], foreignColumns: [vocabularies.list, vocabularies.id] }),
  ],
);

/** The resolved composition of each sheet: what the IFRA engine uses offline. «identity»: a pure material is its substance. */
export const sheetComposition = common.table(
  "sheet_composition",
  {
    id: uuid("id").primaryKey(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => sheets.id, { onDelete: "cascade" }),
    substanceId: uuid("substance_id")
      .notNull()
      .references(() => substances.id),
    amountKind: text("amount_kind").notNull(),
    value: numeric("value"),
    min: numeric("min"),
    max: numeric("max"),
    authority: text("authority").notNull(),
    origin: text("origin").notNull(),
    /** Its id in that table: not a foreign key, it can come from two tables. */
    originId: uuid("origin_id"),
  },
  (t) => [
    unique("sheet_composition_once").on(t.sheetId, t.substanceId),
    ...amountChecks("sheet_composition", t),
    check("sheet_composition_authority", inList(t.authority, ["product", "ifra", "literature", "consensus", "identity"])),
    check("sheet_composition_origin", inList(t.origin, ["compositions", "ifra_annex", "identity"])),
  ],
);

// ---------------------------------------------------------------- regulation

/** IFRA's standards, by amendment. The engine uses the type: a limit adds up, a prohibition admits nothing, a specification is accredited. */
export const ifraStandards = common.table(
  "ifra_standards",
  {
    id: uuid("id").primaryKey(),
    amendmentId: uuid("amendment_id")
      .notNull()
      .references(() => amendments.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    /** The amendment in which this standard was last changed (49 for Farnesol in the 51st). */
    lastAmended: integer("last_amended"),
    type: text("type").notNull(),
    prohibition: boolean("prohibition").notNull().default(false),
    restriction: boolean("restriction").notNull().default(false),
    specification: boolean("specification").notNull().default(false),
    prohibitedAsSuch: boolean("prohibited_as_such").notNull().default(false),
    groupKey: text("group_key").notNull(),
    limitExpressedAs: text("limit_expressed_as"),
    limitExpressedAsCas: text("limit_expressed_as_cas"),
    prohibitionNote: text("prohibition_note"),
    restrictionNote: text("restriction_note"),
    specificationNote: text("specification_note"),
    limitNote: text("limit_note"),
    phototoxicityNote: text("phototoxicity_note"),
    property: text("property"),
    scopeNote: text("scope_note"),
    contributions: text("contributions"),
    contributionsNote: text("contributions_note"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [unique("ifra_standards_once").on(t.amendmentId, t.code)],
);

/** Which substances each standard covers, resolved to a substance. */
export const ifraSubstances = common.table(
  "ifra_substances",
  {
    id: uuid("id").primaryKey(),
    standardId: uuid("standard_id")
      .notNull()
      .references(() => ifraStandards.id, { onDelete: "cascade" }),
    substanceId: uuid("substance_id")
      .notNull()
      .references(() => substances.id),
    originalCas: text("original_cas").notNull(),
    subgroup: text("subgroup"),
    synonyms: text("synonyms").array().notNull().default(sql`'{}'::text[]`),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [unique("ifra_substances_once").on(t.standardId, t.originalCas), index("ifra_substances_substance").on(t.substanceId)],
);

/** The limit of a standard in each category, as a fraction of the finished product, or a prohibition. */
export const ifraLimits = common.table(
  "ifra_limits",
  {
    id: uuid("id").primaryKey(),
    standardId: uuid("standard_id")
      .notNull()
      .references(() => ifraStandards.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => ifraCategories.id),
    kind: text("kind").notNull(),
    maxValue: numeric("max_value"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("ifra_limits_once").on(t.standardId, t.categoryId),
    check("ifra_limits_kind", inList(t.kind, ["max", "prohibited"])),
    check("ifra_limits_value", sql`(${t.kind} = 'max' and ${t.maxValue} > 0 and ${t.maxValue} <= 1) or (${t.kind} = 'prohibited' and ${t.maxValue} is null)`),
  ],
);

/** The composition of the naturals in IFRA's annex. It does not go to the phone: what is needed is already in sheet_composition. */
export const ifraAnnex = common.table(
  "ifra_annex",
  {
    id: uuid("id").primaryKey(),
    amendmentId: uuid("amendment_id")
      .notNull()
      .references(() => amendments.id),
    naturalSubstanceId: uuid("natural_substance_id").references(() => substances.id),
    constituentSubstanceId: uuid("constituent_substance_id")
      .notNull()
      .references(() => substances.id),
    concentration: numeric("concentration").notNull(),
    naturalName: text("natural_name").notNull(),
    botanicalName: text("botanical_name"),
    isoCategory: text("iso_category"),
    rifmId: text("rifm_id"),
    constituentStandard: text("constituent_standard"),
    notice: text("notice"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [check("ifra_annex_concentration", sql`${t.concentration} >= 0 and ${t.concentration} <= 1`), index("ifra_annex_natural").on(t.naturalSubstanceId)],
);

/** Variant rules (which form of a natural a standard prohibits) and specification exclusions. */
export const ifraRules = common.table(
  "ifra_rules",
  {
    id: uuid("id").primaryKey(),
    standardId: uuid("standard_id")
      .notNull()
      .references(() => ifraStandards.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    field: text("field"),
    match: text("match"),
    pattern: text("pattern"),
    variant: text("variant"),
    note: text("note"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [check("ifra_rules_kind", inList(t.kind, ["variant", "specification_exclusion"]))],
);

/** The entries of the EU allergen list (Regulation 2023/1545), with their label name: an entry can be a whole oil or a group. */
export const allergenEntries = common.table(
  "allergen_entries",
  {
    id: uuid("id").primaryKey(),
    labelName: text("label_name").notNull(),
    list: text("list").notNull(),
    inForceNew: date("in_force_new"),
    inForceExisting: date("in_force_existing"),
    leaveOnThreshold: numeric("leave_on_threshold"),
    rinseOffThreshold: numeric("rinse_off_threshold"),
    /** A condition the annex attaches to the entry, if any. */
    condition: text("condition"),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [
    unique("allergen_entries_label").on(t.labelName),
    check("allergen_entries_list", inList(t.list, ["eu_26", "eu_extended"])),
    check("allergen_entries_thresholds", sql`${fraction(t.leaveOnThreshold)} and ${fraction(t.rinseOffThreshold)}`),
  ],
);

export const allergenSubstances = common.table(
  "allergen_substances",
  {
    id: uuid("id").primaryKey(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => allergenEntries.id, { onDelete: "cascade" }),
    substanceId: uuid("substance_id")
      .notNull()
      .references(() => substances.id),
    batchId: uuid("batch_id").references(() => batches.id),
  },
  (t) => [unique("allergen_substances_once").on(t.entryId, t.substanceId)],
);
