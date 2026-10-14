import { sql } from "drizzle-orm";
import { type AnyPgColumn, boolean, check, index, numeric, pgTable, smallint, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/**
 * The materials' tables (plan v3, phase 2; docs-v3/modelo-materiales-v3.md). Common rows
 * (owner_id null) are written only by the loading script; each user's rows, by that user.
 * Every table has its own uuid id, because PowerSync takes no composite keys (V3-9).
 *
 * Exact numbers are `numeric`, never float (plan §38): fractions of 1 (0.05 is 5 %). Closed
 * lists are text with a CHECK, so that adding a value is one migration and nothing else.
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Who gives a figure, from most to least (plan §32): a lot, a product, IFRA, literature, consensus. */
const AUTHORITY = sql`('lot', 'product', 'ifra', 'literature', 'consensus')`;

/** The groups the search shows instead of every form and supplier (V3-13). Common only. */
export const materialCategories = pgTable("material_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  aliases: text("aliases").array().notNull().default(sql`'{}'::text[]`),
  ...timestamps,
});

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null: common, written by the loading script. Otherwise, the user's own (plan §16). */
    ownerId: uuid("owner_id").references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** What defines it (V3-12): its chemistry, its origin, its recipe; or just a name, or a frozen formula. */
    kind: text("kind").notNull(),
    /** Not aromatic matter (V3-12): DPG, alcohol, IPM… A mark apart from the kind and the role. */
    solvent: boolean("solvent").notNull().default(false),
    /** Other names the search finds it by: trade name, acronym, synonyms (V3-6). */
    aliases: text("aliases").array().notNull().default(sql`'{}'::text[]`),
    cas: text("cas"),
    /** The other CAS numbers, as IFRA gives them for most naturals (V3-16). */
    otherCas: text("other_cas").array().notNull().default(sql`'{}'::text[]`),
    species: text("species"),
    part: text("part"),
    process: text("process"),
    chemotype: text("chemotype"),
    inci: text("inci"),
    /** Where it comes from: a country or region (the lab's «procedencia»). */
    origin: text("origin"),
    /** The short name of the glossary (V3-37): the user's, or generated in their style and provisional. */
    abbreviation: text("abbreviation"),
    abbreviationOrigin: text("abbreviation_origin"),
    /** The search's group (V3-13) and, in a natural, its form: essential oil, absolute, CO2 extract… */
    categoryId: uuid("category_id").references(() => materialCategories.id, { onDelete: "set null" }),
    form: text("form"),
    /** The user's version of a common material (V3-5): it inherits, and adds its own. */
    basedOnId: uuid("based_on_id").references((): AnyPgColumn => materials.id, { onDelete: "restrict" }),
    grade: text("grade"),
    supplier: text("supplier"),
    /** A version's bottle (V3-36): the product as the shop names it, and its page. */
    product: text("product"),
    productUrl: text("product_url"),
    /** As the bottle says it, informative: what is known of the rest goes in the composition. */
    purity: numeric("purity"),
    // What belongs to each kind (V3-14): a molecule's house, synthesis and isomers; a composition's house, code and target.
    house: text("house"),
    code: text("code"),
    odorTarget: text("odor_target"),
    synthesis: text("synthesis"),
    isomers: text("isomers"),
    // The core of the card (V3-14), empty when unknown.
    /** One of the nine families of P48 (V3-18); the user's own words go in family_detail. */
    family: text("family"),
    /** Fixed by somebody (V3-38), «#rrggbb»; empty, it is its family's colour in the palette. */
    color: text("color"),
    familyDetail: text("family_detail"),
    facets: text("facets"),
    tier: text("tier"),
    /** Hours on a blotter, pure material, TGSC's scale (V3-42): a guide for the bench, never a measure. */
    tenacityHours: numeric("tenacity_hours"),
    tenacitySource: text("tenacity_source"),
    /** Its intensity, 0 to 3, in five stretches (V3-42): to 15 min, to 2 h, to 8 h, to 24 h, beyond. */
    evolutionTo15m: smallint("evolution_to_15m"),
    evolutionTo2h: smallint("evolution_to_2h"),
    evolutionTo8h: smallint("evolution_to_8h"),
    evolutionTo24h: smallint("evolution_to_24h"),
    evolutionBeyond24h: smallint("evolution_beyond_24h"),
    strength: text("strength"),
    threshold: text("threshold"),
    diffusion: text("diffusion"),
    blendEffect: text("blend_effect"),
    /** Its aesthetic role: structure, modifier, trace, fixative, bridge, booster. Not the solvent mark. */
    role: text("role"),
    recommendedDilution: text("recommended_dilution"),
    cost: text("cost"),
    // Safety and the physical block (V3-36, V3-41), one attribute per column; numbers exact.
    handling: text("handling"),
    physicalState: text("physical_state"),
    /** What it looks like («incoloro a amarillo pálido»): not the display colour. */
    appearance: text("appearance"),
    stains: text("stains"),
    solubility: text("solubility"),
    /** g/ml at 20–25 °C. */
    density: numeric("density"),
    meltingPointC: numeric("melting_point_c"),
    formula: text("formula"),
    molecularWeight: numeric("molecular_weight"),
    /** With its unit and temperature, as the source gives it. */
    vaporPressure: text("vapor_pressure"),
    stability: text("stability"),
    incompatibilities: text("incompatibilities"),
    physicalSources: text("physical_sources"),
    notes: text("notes"),
    /** Short tags of where the card's data come from, and how sure (V3-14). */
    sources: text("sources"),
    confidence: text("confidence"),
    /** The fields with a conflict still open, shown «en disputa» (V3-17). */
    disputedFields: text("disputed_fields").array().notNull().default(sql`'{}'::text[]`),
    /** The lab's second-hand IFRA, as text without figures (V3-32): shown apart, never calculated. */
    ifraUnverified: text("ifra_unverified"),
    ...timestamps,
  },
  (t) => [
    index("materials_owner_idx").on(t.ownerId),
    index("materials_category_idx").on(t.categoryId),
    index("materials_based_on_idx").on(t.basedOnId),
    // Unique in the common glossary, as it was in the v1's (V3-37); a user's version may repeat it.
    uniqueIndex("materials_common_abbreviation").on(t.abbreviation).where(sql`${t.ownerId} is null`),
    check("materials_kind", sql`${t.kind} in ('molecule', 'natural', 'composition', 'provisional', 'frozen')`),
    // A provisional material or a frozen formula is always somebody's.
    check("materials_kind_owner", sql`${t.kind} not in ('provisional', 'frozen') or ${t.ownerId} is not null`),
    check("materials_not_based_on_itself", sql`${t.basedOnId} is null or ${t.basedOnId} <> ${t.id}`),
    check("materials_purity", sql`${t.purity} is null or (${t.purity} > 0 and ${t.purity} <= 1)`),
    check(
      "materials_family",
      sql`${t.family} is null or ${t.family} in ('citrus', 'green', 'ozonic', 'floral', 'fruity', 'spicy', 'woody', 'animal', 'transformed')`,
    ),
    check("materials_tier", sql`${t.tier} is null or ${t.tier} in ('top', 'top_heart', 'heart', 'heart_base', 'base')`),
    check("materials_strength", sql`${t.strength} is null or ${t.strength} in ('low', 'medium', 'high', 'very_high')`),
    check("materials_synthesis", sql`${t.synthesis} is null or ${t.synthesis} in ('synthetic', 'natural', 'semisynthetic')`),
    check("materials_confidence", sql`${t.confidence} is null or ${t.confidence} in ('high', 'medium', 'low')`),
    check("materials_abbreviation_origin", sql`${t.abbreviationOrigin} is null or ${t.abbreviationOrigin} in ('user', 'generated')`),
    check("materials_color", sql`${t.color} is null or ${t.color} ~ '^#[0-9a-f]{6}$'`),
    check("materials_tenacity_hours", sql`${t.tenacityHours} is null or ${t.tenacityHours} > 0`),
    check(
      "materials_evolution",
      sql`coalesce(${t.evolutionTo15m}, 0) between 0 and 3 and coalesce(${t.evolutionTo2h}, 0) between 0 and 3 and coalesce(${t.evolutionTo8h}, 0) between 0 and 3 and coalesce(${t.evolutionTo24h}, 0) between 0 and 3 and coalesce(${t.evolutionBeyond24h}, 0) between 0 and 3`,
    ),
    check("materials_density", sql`${t.density} is null or ${t.density} > 0`),
    check("materials_molecular_weight", sql`${t.molecularWeight} is null or ${t.molecularWeight} > 0`),
  ],
);

/** What a material contains (plan §21–22): one row per component, with how much and who says it. */
export const materialComponents = pgTable(
  "material_components",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    /** Its material's owner, copied by a trigger: what PowerSync filters by (one bucket for the common, one per user). */
    ownerId: uuid("owner_id"),
    componentId: uuid("component_id")
      .notNull()
      .references(() => materials.id, { onDelete: "restrict" }),
    /** exact: a figure; max: at most; range: between two; unknown: it is there, how much is not known. */
    amountKind: text("amount_kind").notNull(),
    value: numeric("value"),
    min: numeric("min"),
    max: numeric("max"),
    authority: text("authority").notNull(),
    source: text("source").notNull(),
    ...timestamps,
  },
  (t) => [
    index("material_components_material_idx").on(t.materialId),
    index("material_components_owner_idx").on(t.ownerId),
    index("material_components_component_idx").on(t.componentId),
    unique("material_components_once").on(t.materialId, t.componentId, t.authority, t.source),
    check("material_components_not_itself", sql`${t.materialId} <> ${t.componentId}`),
    check("material_components_authority", sql`${t.authority} in ${AUTHORITY}`),
    check("material_components_source", sql`length(trim(${t.source})) > 0`),
    check(
      "material_components_amount",
      sql`case ${t.amountKind}
        when 'exact' then ${t.value} is not null and ${t.min} is null and ${t.max} is null and ${t.value} >= 0 and ${t.value} <= 1
        when 'max' then ${t.value} is not null and ${t.min} is null and ${t.max} is null and ${t.value} > 0 and ${t.value} <= 1
        when 'range' then ${t.value} is null and ${t.min} is not null and ${t.max} is not null and ${t.min} >= 0 and ${t.min} <= ${t.max} and ${t.max} <= 1
        when 'unknown' then ${t.value} is null and ${t.min} is null and ${t.max} is null
        else false end`,
    ),
  ],
);

/** A limit on a material (plan §28–29): IFRA's, or a manufacturer's for its product. */
export const regulations = pgTable(
  "regulations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    /** Its material's owner, copied by a trigger: what PowerSync filters by (one bucket for the common, one per user). */
    ownerId: uuid("owner_id"),
    regime: text("regime").notNull(),
    /** IFRA's category of use ("4"); null when it holds for every category. */
    category: text("category"),
    kind: text("kind").notNull(),
    /** Fraction of the finished product (plan, step 2.3). */
    maxValue: numeric("max_value"),
    /** The members of one standard share it; their shares of their limits add up to at most 1. */
    groupKey: text("group_key"),
    /** What has to be met (the cade: rectified); its authority says whether it is (§4.4, V3-25). */
    requirement: text("requirement"),
    authority: text("authority").notNull(),
    /** The standard, its amendment and the page (plan §28). */
    source: text("source").notNull(),
    ...timestamps,
  },
  (t) => [
    index("regulations_material_idx").on(t.materialId),
    index("regulations_owner_idx").on(t.ownerId),
    index("regulations_group_idx").on(t.groupKey),
    check("regulations_regime", sql`${t.regime} in ('ifra', 'manufacturer')`),
    check("regulations_authority", sql`${t.authority} in ${AUTHORITY}`),
    check("regulations_source", sql`length(trim(${t.source})) > 0`),
    check(
      "regulations_kind",
      sql`case ${t.kind}
        when 'max' then ${t.maxValue} is not null and ${t.maxValue} >= 0 and ${t.maxValue} <= 1
        when 'prohibited' then ${t.maxValue} is null
        when 'requirement' then ${t.requirement} is not null and length(trim(${t.requirement})) > 0
        else false end`,
    ),
  ],
);

/** How much of a material is used, one row per source, always with its base (V3-14). */
export const materialDoses = pgTable(
  "material_doses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    /** Its material's owner, copied by a trigger: what PowerSync filters by (one bucket for the common, one per user). */
    ownerId: uuid("owner_id"),
    min: numeric("min"),
    typical: numeric("typical"),
    max: numeric("max"),
    /** Of what: the concentrate, the finished product, or the source does not say. */
    basis: text("basis").notNull(),
    authority: text("authority").notNull(),
    source: text("source").notNull(),
    /** A conflict still open on this row (V3-17). */
    disputed: boolean("disputed").notNull().default(false),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("material_doses_material_idx").on(t.materialId),
    index("material_doses_owner_idx").on(t.ownerId),
    check("material_doses_basis", sql`${t.basis} in ('concentrate', 'finished_product', 'undeclared')`),
    check("material_doses_authority", sql`${t.authority} in ${AUTHORITY}`),
    check("material_doses_source", sql`length(trim(${t.source})) > 0`),
    check("material_doses_some", sql`coalesce(${t.min}, ${t.typical}, ${t.max}) is not null`),
    check(
      "material_doses_values",
      sql`(${t.min} is null or (${t.min} >= 0 and ${t.min} <= 1)) and (${t.typical} is null or (${t.typical} > 0 and ${t.typical} <= 1)) and (${t.max} is null or (${t.max} > 0 and ${t.max} <= 1)) and (${t.min} is null or ${t.max} is null or ${t.min} <= ${t.max})`,
    ),
  ],
);

/** How a source describes a material's smell, one row per source and text (V3-36). */
export const materialDescriptors = pgTable(
  "material_descriptors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    /** Its material's owner, copied by a trigger, as in the composition. */
    ownerId: uuid("owner_id"),
    /** A short tag of the source: TG, web, FIG… */
    source: text("source").notNull(),
    text: text("text").notNull(),
    ...timestamps,
  },
  (t) => [
    index("material_descriptors_material_idx").on(t.materialId),
    index("material_descriptors_owner_idx").on(t.ownerId),
    check("material_descriptors_source", sql`length(trim(${t.source})) > 0`),
    check("material_descriptors_text", sql`length(trim(${t.text})) > 0`),
  ],
);

/** What a material goes with, can stand in for, or clashes with (V3-36): another material, or only its name. */
export const materialRelations = pgTable(
  "material_relations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id"),
    kind: text("kind").notNull(),
    /** The other material, when it is in the glossary; else, its name in other_text. If it goes, the relation goes. */
    otherId: uuid("other_id").references((): AnyPgColumn => materials.id, { onDelete: "cascade" }),
    otherText: text("other_text"),
    note: text("note"),
    sources: text("sources"),
    ...timestamps,
  },
  (t) => [
    index("material_relations_material_idx").on(t.materialId),
    index("material_relations_owner_idx").on(t.ownerId),
    index("material_relations_other_idx").on(t.otherId),
    check("material_relations_kind", sql`${t.kind} in ('combines', 'substitute', 'clashes')`),
    check("material_relations_other", sql`${t.otherId} is not null or length(trim(coalesce(${t.otherText}, ''))) > 0`),
  ],
);

/** A perfume where a material is known to be used (V3-36). */
export const materialReferences = pgTable(
  "material_references",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id"),
    perfume: text("perfume").notNull(),
    house: text("house"),
    note: text("note"),
    sources: text("sources"),
    ...timestamps,
  },
  (t) => [
    index("material_references_material_idx").on(t.materialId),
    index("material_references_owner_idx").on(t.ownerId),
    check("material_references_perfume", sql`length(trim(${t.perfume})) > 0`),
  ],
);

/** «Lo que tengo» (V3-3): the materials a user has, without quantities. */
export const labMaterials = pgTable(
  "lab_materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => authUsers.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("lab_materials_once").on(t.userId, t.materialId), index("lab_materials_material_idx").on(t.materialId)],
);

/** Which data the common rows were loaded from (V3-26): one row, written by the loading script. */
export const dataVersion = pgTable(
  "data_version",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Always true and unique: there is only one row. */
    single: boolean("single").notNull().default(true).unique(),
    commit: text("commit").notNull(),
    batch: text("batch"),
    loadedAt: timestamp("loaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("data_version_single", sql`${t.single}`)],
);
