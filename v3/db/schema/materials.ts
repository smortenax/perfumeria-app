import { sql } from "drizzle-orm";
import { type AnyPgColumn, boolean, check, index, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
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
    origin: text("origin"),
    /** The search's group (V3-13) and, in a natural, its form: essential oil, absolute, CO2 extract… */
    categoryId: uuid("category_id").references(() => materialCategories.id, { onDelete: "set null" }),
    form: text("form"),
    /** The user's version of a common material (V3-5): it inherits, and adds its own. */
    basedOnId: uuid("based_on_id").references((): AnyPgColumn => materials.id, { onDelete: "restrict" }),
    grade: text("grade"),
    supplier: text("supplier"),
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
    familyDetail: text("family_detail"),
    facets: text("facets"),
    tier: text("tier"),
    evolution: text("evolution"),
    /** Text with its source, never a number, until its source is decided (V3-18). */
    tenacity: text("tenacity"),
    strength: text("strength"),
    threshold: text("threshold"),
    diffusion: text("diffusion"),
    blendEffect: text("blend_effect"),
    /** Its aesthetic role: structure, modifier, trace, fixative, bridge, booster. Not the solvent mark. */
    role: text("role"),
    recommendedDilution: text("recommended_dilution"),
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
