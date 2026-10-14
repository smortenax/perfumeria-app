import { sql } from "drizzle-orm";
import { boolean, check, index, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

/**
 * IFRA's layer (V3-35): apart from the materials, private, and down its own sync stream, so that
 * it can be given only to whom has it. Written only by the loading script, from IFRA's own files
 * (P37), never by a user. A material says what it is (its CAS) and what it carries; the app reads
 * that against this layer and computes. The limits a manufacturer or the user's version give are
 * the material's, not IFRA's (V3-39): they stay in `regulations`.
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** One standard of IFRA, with its notes as IFRA writes them. */
export const ifraStandards = pgTable(
  "ifra_standards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** IFRA's reference: «IFRA_STD_154». */
    code: text("code").notNull(),
    name: text("name").notNull(),
    amendment: text("amendment").notNull(),
    /** IFRA's type: RESTRICTION, PROHIBITION, SPECIFICATION and their combinations. */
    type: text("type").notNull(),
    prohibition: boolean("prohibition").notNull().default(false),
    restriction: boolean("restriction").notNull().default(false),
    specification: boolean("specification").notNull().default(false),
    /** V3-30: IFRA prohibits the substance as an ingredient and limits it in the naturals that bring it. */
    prohibitedAsSuch: boolean("prohibited_as_such").notNull().default(false),
    /** The members that add up against one ceiling: the standard, or «furocumarinas» for the phototoxic oils (V3-27). */
    groupKey: text("group_key").notNull(),
    /** V3-27: the limit is of this constituent in the finished product, not of the member (STD 089: 5-MOP). */
    limitExpressedAs: text("limit_expressed_as"),
    limitExpressedAsCas: text("limit_expressed_as_cas"),
    prohibitionNote: text("prohibition_note"),
    restrictionNote: text("restriction_note"),
    specificationNote: text("specification_note"),
    limitNote: text("limit_note"),
    phototoxicityNote: text("phototoxicity_note"),
    /** Why IFRA regulates it: dermal sensitisation, systemic toxicity… */
    property: text("property"),
    scopeNote: text("scope_note"),
    contributions: text("contributions"),
    contributionsNote: text("contributions_note"),
    ...timestamps,
  },
  (t) => [unique("ifra_standards_code").on(t.code)],
);

/** The limit of a standard in one category of use, as a fraction of the finished product, or a prohibition. */
export const ifraLimits = pgTable(
  "ifra_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    standardId: uuid("standard_id")
      .notNull()
      .references(() => ifraStandards.id, { onDelete: "cascade" }),
    /** IFRA's category: «1», «4», «5A»… */
    category: text("category").notNull(),
    kind: text("kind").notNull(),
    maxValue: numeric("max_value"),
    ...timestamps,
  },
  (t) => [
    unique("ifra_limits_once").on(t.standardId, t.category),
    check("ifra_limits_kind", sql`${t.kind} in ('max', 'prohibited')`),
    check(
      "ifra_limits_value",
      sql`(${t.kind} = 'max' and ${t.maxValue} > 0 and ${t.maxValue} <= 1) or (${t.kind} = 'prohibited' and ${t.maxValue} is null)`,
    ),
  ],
);

/** A CAS a standard regulates (IFRA's list), with its subgroup and synonyms when IFRA gives them. */
export const ifraSubstances = pgTable(
  "ifra_substances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    standardId: uuid("standard_id")
      .notNull()
      .references(() => ifraStandards.id, { onDelete: "cascade" }),
    cas: text("cas").notNull(),
    subgroup: text("subgroup"),
    synonyms: text("synonyms").array().notNull().default(sql`'{}'::text[]`),
    ...timestamps,
  },
  (t) => [unique("ifra_substances_once").on(t.standardId, t.cas), index("ifra_substances_cas_idx").on(t.cas)],
);

/** What IFRA's annex says a natural brings of a regulated constituent, as a fraction of the natural. */
export const ifraAnnex = pgTable(
  "ifra_annex",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    amendment: text("amendment").notNull(),
    /** Its principal CAS; IFRA gives only other CAS for a few naturals (the ylang-ylang absolute). */
    naturalCas: text("natural_cas"),
    naturalOtherCas: text("natural_other_cas").array().notNull().default(sql`'{}'::text[]`),
    naturalName: text("natural_name").notNull(),
    botanicalName: text("botanical_name"),
    isoCategory: text("iso_category"),
    rifmId: text("rifm_id"),
    constituentCas: text("constituent_cas"),
    constituentName: text("constituent_name").notNull(),
    concentration: numeric("concentration").notNull(),
    /** The standard of the constituent, by IFRA's reference; empty in three rows of the annex. */
    constituentStandard: text("constituent_standard"),
    notice: text("notice"),
    ...timestamps,
  },
  (t) => [
    index("ifra_annex_natural_idx").on(t.naturalCas),
    index("ifra_annex_constituent_idx").on(t.constituentCas),
    check("ifra_annex_concentration", sql`${t.concentration} >= 0 and ${t.concentration} <= 1`),
  ],
);

/**
 * V3-31: a standard that prohibits one variant and limits another. A material goes by its species
 * or its process: the first rule that matches says which variant it is; none, and it is not known.
 */
export const ifraVariantRules = pgTable(
  "ifra_variant_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    standardId: uuid("standard_id")
      .notNull()
      .references(() => ifraStandards.id, { onDelete: "cascade" }),
    field: text("field").notNull(),
    /** How the pattern is matched, in lower case and without accents: contained in the field, or at its start. */
    match: text("match").notNull(),
    pattern: text("pattern").notNull(),
    variant: text("variant").notNull(),
    ...timestamps,
  },
  (t) => [
    check("ifra_variant_rules_field", sql`${t.field} in ('species', 'process')`),
    check("ifra_variant_rules_match", sql`${t.match} in ('contains', 'starts')`),
    check("ifra_variant_rules_variant", sql`${t.variant} in ('prohibited', 'permitted')`),
    check("ifra_variant_rules_pattern", sql`length(trim(${t.pattern})) > 0`),
  ],
);

/** Where a standard's specification is about other processes than a material's (the user's decision, with its note). */
export const ifraSpecExclusions = pgTable(
  "ifra_spec_exclusions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    standardId: uuid("standard_id")
      .notNull()
      .references(() => ifraStandards.id, { onDelete: "cascade" }),
    process: text("process").notNull(),
    note: text("note").notNull(),
    ...timestamps,
  },
  (t) => [check("ifra_spec_exclusions_process", sql`length(trim(${t.process})) > 0`)],
);
