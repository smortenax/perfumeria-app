import { DrizzleAppSchema } from "@powersync/drizzle-driver";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The browser's copy of the data (V3-9): the server's tables again (db/schema/), in SQLite.
 * PowerSync keeps only text, integer and real, and sends them so: uuids, dates and exact
 * numbers as text (numeric never goes through a JavaScript number), booleans as 1 or 0,
 * lists as JSON text. Every synced table has its own text id, a uuid.
 */

const list = (name: string) => text(name, { mode: "json" }).$type<string[]>();
const timestamps = { createdAt: text("created_at"), updatedAt: text("updated_at") };

export const materialCategories = sqliteTable("material_categories", {
  id: text("id").primaryKey(),
  name: text("name"),
  aliases: list("aliases"),
  ...timestamps,
});

export const materials = sqliteTable("materials", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id"),
  name: text("name"),
  kind: text("kind"),
  solvent: integer("solvent", { mode: "boolean" }),
  aliases: list("aliases"),
  cas: text("cas"),
  otherCas: list("other_cas"),
  species: text("species"),
  part: text("part"),
  process: text("process"),
  chemotype: text("chemotype"),
  inci: text("inci"),
  origin: text("origin"),
  abbreviation: text("abbreviation"),
  abbreviationOrigin: text("abbreviation_origin"),
  categoryId: text("category_id"),
  form: text("form"),
  basedOnId: text("based_on_id"),
  sourceFormulaId: text("source_formula_id"),
  sourceEventId: text("source_event_id"),
  grade: text("grade"),
  supplier: text("supplier"),
  product: text("product"),
  productUrl: text("product_url"),
  lot: text("lot"),
  purchasedOn: text("purchased_on"),
  originRegion: text("origin_region"),
  status: text("status"),
  purity: text("purity"),
  house: text("house"),
  code: text("code"),
  odorTarget: text("odor_target"),
  synthesis: text("synthesis"),
  isomers: text("isomers"),
  family: text("family"),
  color: text("color"),
  familyDetail: text("family_detail"),
  facets: text("facets"),
  tier: text("tier"),
  tenacityHours: text("tenacity_hours"),
  tenacitySource: text("tenacity_source"),
  evolutionTo15m: integer("evolution_to_15m"),
  evolutionTo2h: integer("evolution_to_2h"),
  evolutionTo8h: integer("evolution_to_8h"),
  evolutionTo24h: integer("evolution_to_24h"),
  evolutionBeyond24h: integer("evolution_beyond_24h"),
  strength: text("strength"),
  threshold: text("threshold"),
  diffusion: text("diffusion"),
  blendEffect: text("blend_effect"),
  role: text("role"),
  recommendedDilution: text("recommended_dilution"),
  cost: text("cost"),
  handling: text("handling"),
  physicalState: text("physical_state"),
  appearance: text("appearance"),
  stains: text("stains"),
  solubility: text("solubility"),
  density: text("density"),
  meltingPointC: text("melting_point_c"),
  formula: text("formula"),
  molecularWeight: text("molecular_weight"),
  vaporPressure: text("vapor_pressure"),
  stability: text("stability"),
  incompatibilities: text("incompatibilities"),
  physicalSources: text("physical_sources"),
  notes: text("notes"),
  sources: text("sources"),
  confidence: text("confidence"),
  disputedFields: list("disputed_fields"),
  ifraUnverified: text("ifra_unverified"),
  ...timestamps,
});

export const materialComponents = sqliteTable("material_components", {
  id: text("id").primaryKey(),
  materialId: text("material_id"),
  ownerId: text("owner_id"),
  componentId: text("component_id"),
  componentCas: text("component_cas"),
  componentName: text("component_name"),
  amountKind: text("amount_kind"),
  value: text("value"),
  min: text("min"),
  max: text("max"),
  authority: text("authority"),
  source: text("source"),
  ...timestamps,
});

export const regulations = sqliteTable("regulations", {
  id: text("id").primaryKey(),
  materialId: text("material_id"),
  ownerId: text("owner_id"),
  regime: text("regime"),
  category: text("category"),
  kind: text("kind"),
  maxValue: text("max_value"),
  groupKey: text("group_key"),
  requirement: text("requirement"),
  authority: text("authority"),
  source: text("source"),
  ...timestamps,
});

export const materialDoses = sqliteTable("material_doses", {
  id: text("id").primaryKey(),
  materialId: text("material_id"),
  ownerId: text("owner_id"),
  min: text("min"),
  typical: text("typical"),
  max: text("max"),
  basis: text("basis"),
  authority: text("authority"),
  source: text("source"),
  disputed: integer("disputed", { mode: "boolean" }),
  notes: text("notes"),
  ...timestamps,
});

export const materialDescriptors = sqliteTable("material_descriptors", {
  id: text("id").primaryKey(),
  materialId: text("material_id"),
  ownerId: text("owner_id"),
  source: text("source"),
  text: text("text"),
  ...timestamps,
});

export const materialRelations = sqliteTable("material_relations", {
  id: text("id").primaryKey(),
  materialId: text("material_id"),
  ownerId: text("owner_id"),
  kind: text("kind"),
  otherId: text("other_id"),
  otherText: text("other_text"),
  note: text("note"),
  sources: text("sources"),
  ...timestamps,
});

export const materialReferences = sqliteTable("material_references", {
  id: text("id").primaryKey(),
  materialId: text("material_id"),
  ownerId: text("owner_id"),
  perfume: text("perfume"),
  house: text("house"),
  note: text("note"),
  sources: text("sources"),
  ...timestamps,
});

export const labMaterials = sqliteTable("lab_materials", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  materialId: text("material_id"),
  createdAt: text("created_at"),
});

export const labDilutions = sqliteTable("lab_dilutions", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  materialId: text("material_id"),
  fraction: text("fraction"),
  solvent: text("solvent"),
  madeOn: text("made_on"),
  description: text("description"),
  label: text("label"),
  materialMassUg: text("material_mass_ug"),
  sourceDilutionId: text("source_dilution_id"),
  archivedAt: text("archived_at"),
  ...timestamps,
});

export const shoppingItems = sqliteTable("shopping_items", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  materialId: text("material_id"),
  product: text("product"),
  shop: text("shop"),
  note: text("note"),
  formulaId: text("formula_id"),
  resolvedAt: text("resolved_at"),
  specificationId: text("specification_id"),
  ...timestamps,
});

export const labDilutionDiluents = sqliteTable("lab_dilution_diluents", {
  id: text("id").primaryKey(),
  dilutionId: text("dilution_id"),
  userId: text("user_id"),
  diluentId: text("diluent_id"),
  massUg: text("mass_ug"),
  fraction: text("fraction"),
  position: integer("position"),
  createdAt: text("created_at"),
});

export const labEvaluations = sqliteTable("lab_evaluations", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  materialId: text("material_id"),
  status: text("status"),
  smellingTip: text("smelling_tip"),
  reading: text("reading"),
  sheet: text("sheet"),
  ...timestamps,
});

export const labAxes = sqliteTable("lab_axes", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  materialId: text("material_id"),
  axis: text("axis"),
  createdAt: text("created_at"),
});

/** Your workbenches, formulas and their history (phase 7). Masses as text: a bigint never goes through a number. */
export const workbenches = sqliteTable("workbenches", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id"),
  name: text("name"),
  notes: text("notes"),
  ...timestamps,
});

export const formulas = sqliteTable("formulas", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id"),
  workbenchId: text("workbench_id"),
  parentId: text("parent_id"),
  name: text("name"),
  intention: text("intention"),
  containerCapacityMl: text("container_capacity_ml"),
  containerTareUg: text("container_tare_ug"),
  workBatchUg: text("work_batch_ug"),
  finalBatchUg: text("final_batch_ug"),
  markers: list("markers"),
  role: text("role"),
  ...timestamps,
});

export const formulaEvents = sqliteTable("formula_events", {
  id: text("id").primaryKey(),
  formulaId: text("formula_id"),
  ownerId: text("owner_id"),
  kind: text("kind"),
  materialId: text("material_id"),
  massUg: text("mass_ug"),
  fraction: text("fraction"),
  diluentId: text("diluent_id"),
  secondDiluentId: text("second_diluent_id"),
  secondFraction: text("second_fraction"),
  target: text("target"),
  grossUg: text("gross_ug"),
  tareUg: text("tare_ug"),
  text: text("text"),
  dilutionId: text("dilution_id"),
  createdAt: text("created_at"),
});

/** The third diluent of a pour and on (V3-67). */
export const formulaEventDiluents = sqliteTable("formula_event_diluents", {
  id: text("id").primaryKey(),
  eventId: text("event_id"),
  ownerId: text("owner_id"),
  position: integer("position"),
  diluentId: text("diluent_id"),
  fraction: text("fraction"),
  createdAt: text("created_at"),
});

/** Your tastings (V3-60 to V3-63): sessions, strips, their tabs and closings, as the server keeps them. */
export const tastingSessions = sqliteTable("tasting_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  startedAt: text("started_at"),
  endedAt: text("ended_at"),
  note: text("note"),
  ...timestamps,
});

export const tastingStrips = sqliteTable("tasting_strips", {
  id: text("id").primaryKey(),
  sessionId: text("session_id"),
  userId: text("user_id"),
  materialId: text("material_id"),
  dilutionId: text("dilution_id"),
  fraction: text("fraction"),
  solvent: text("solvent"),
  dose: text("dose"),
  appliedAt: text("applied_at"),
  blindLabel: text("blind_label"),
  revealedAt: text("revealed_at"),
  closedAt: text("closed_at"),
  ...timestamps,
});

export const tastingMoments = sqliteTable("tasting_moments", {
  id: text("id").primaryKey(),
  stripId: text("strip_id"),
  userId: text("user_id"),
  moment: text("moment"),
  at: text("at"),
  text: text("text"),
  intensity: integer("intensity"),
  texture: text("texture"),
  temperature: text("temperature"),
  shape: text("shape"),
  color: text("color"),
  brightness: text("brightness"),
  thingOrPlace: text("thing_or_place"),
  thingOrPlaceText: text("thing_or_place_text"),
  ownField: text("own_field"),
  complexity: text("complexity"),
  complexityNote: text("complexity_note"),
  puff: text("puff"),
  revisedImage: text("revised_image"),
  metaphor: text("metaphor"),
  notes: text("notes"),
  nearDetectable: integer("near_detectable", { mode: "boolean" }),
  farDetectable: integer("far_detectable", { mode: "boolean" }),
  reviewed: list("reviewed"),
  ...timestamps,
});

export const tastingFamilies = sqliteTable("tasting_families", {
  id: text("id").primaryKey(),
  momentId: text("moment_id"),
  userId: text("user_id"),
  scheme: text("scheme"),
  code: text("code"),
  createdAt: text("created_at"),
});

export const tastingBattery = sqliteTable("tasting_battery", {
  id: text("id").primaryKey(),
  momentId: text("moment_id"),
  userId: text("user_id"),
  axis: text("axis"),
  state: text("state"),
  ...timestamps,
});

export const tastingCurve = sqliteTable("tasting_curve", {
  id: text("id").primaryKey(),
  momentId: text("moment_id"),
  userId: text("user_id"),
  segment: integer("segment"),
  level: text("level"),
  ...timestamps,
});

export const tastingClosures = sqliteTable("tasting_closures", {
  id: text("id").primaryKey(),
  stripId: text("strip_id"),
  userId: text("user_id"),
  role: text("role"),
  effectRichness: text("effect_richness"),
  effectEnergy: text("effect_energy"),
  versatility: text("versatility"),
  decay: text("decay"),
  r1: text("r1"),
  r2: text("r2"),
  r2Note: text("r2_note"),
  r3: text("r3"),
  r3Note: text("r3_note"),
  biases: list("biases"),
  biasNote: text("bias_note"),
  affinities: text("affinities"),
  destination: text("destination"),
  negativeDestination: text("negative_destination"),
  comparison: text("comparison"),
  ...timestamps,
});

export const tastingMarks = sqliteTable("tasting_marks", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  materialId: text("material_id"),
  label: text("label"),
  createdAt: text("created_at"),
});

export const dataVersion = sqliteTable("data_version", {
  id: text("id").primaryKey(),
  single: integer("single", { mode: "boolean" }),
  commit: text("commit"),
  batch: text("batch"),
  loadedAt: text("loaded_at"),
});

// IFRA's layer (V3-35): its own tables, read-only, down its own stream.

export const ifraStandards = sqliteTable("ifra_standards", {
  id: text("id").primaryKey(),
  code: text("code"),
  name: text("name"),
  amendment: text("amendment"),
  type: text("type"),
  prohibition: integer("prohibition", { mode: "boolean" }),
  restriction: integer("restriction", { mode: "boolean" }),
  specification: integer("specification", { mode: "boolean" }),
  prohibitedAsSuch: integer("prohibited_as_such", { mode: "boolean" }),
  groupKey: text("group_key"),
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
  ...timestamps,
});

export const ifraLimits = sqliteTable("ifra_limits", {
  id: text("id").primaryKey(),
  standardId: text("standard_id"),
  category: text("category"),
  kind: text("kind"),
  maxValue: text("max_value"),
  ...timestamps,
});

export const ifraSubstances = sqliteTable("ifra_substances", {
  id: text("id").primaryKey(),
  standardId: text("standard_id"),
  cas: text("cas"),
  subgroup: text("subgroup"),
  synonyms: list("synonyms"),
  ...timestamps,
});

export const ifraAnnex = sqliteTable("ifra_annex", {
  id: text("id").primaryKey(),
  amendment: text("amendment"),
  naturalCas: text("natural_cas"),
  naturalOtherCas: list("natural_other_cas"),
  naturalName: text("natural_name"),
  botanicalName: text("botanical_name"),
  isoCategory: text("iso_category"),
  rifmId: text("rifm_id"),
  constituentCas: text("constituent_cas"),
  constituentName: text("constituent_name"),
  concentration: text("concentration"),
  constituentStandard: text("constituent_standard"),
  notice: text("notice"),
  ...timestamps,
});

export const ifraVariantRules = sqliteTable("ifra_variant_rules", {
  id: text("id").primaryKey(),
  standardId: text("standard_id"),
  field: text("field"),
  match: text("match"),
  pattern: text("pattern"),
  variant: text("variant"),
  ...timestamps,
});

export const ifraSpecExclusions = sqliteTable("ifra_spec_exclusions", {
  id: text("id").primaryKey(),
  standardId: text("standard_id"),
  process: text("process"),
  note: text("note"),
  ...timestamps,
});

/**
 * What Supabase refused to take (a broken rule, a row it does not allow): kept here, in this
 * browser only, instead of being dropped, so that nothing is lost in silence.
 */
export const uploadRejections = sqliteTable("upload_rejections", {
  id: text("id").primaryKey(),
  tableName: text("table_name"),
  rowId: text("row_id"),
  op: text("op"),
  data: text("data"),
  error: text("error"),
  rejectedAt: text("rejected_at"),
});

/** The tables, as Drizzle queries them. */
export const tables = {
  workbenches,
  formulas,
  formulaEvents,
  formulaEventDiluents,
  tastingSessions,
  tastingStrips,
  tastingMoments,
  tastingFamilies,
  tastingBattery,
  tastingCurve,
  tastingClosures,
  tastingMarks,
  materialCategories,
  materials,
  materialComponents,
  regulations,
  materialDoses,
  materialDescriptors,
  materialRelations,
  materialReferences,
  labMaterials,
  labDilutions,
  labDilutionDiluents,
  shoppingItems,
  labEvaluations,
  labAxes,
  ifraStandards,
  ifraLimits,
  ifraSubstances,
  ifraAnnex,
  ifraVariantRules,
  ifraSpecExclusions,
  dataVersion,
  uploadRejections,
};

/** The same tables, as PowerSync keeps them: the rejections never leave the browser. */
export const AppSchema = new DrizzleAppSchema({
  workbenches,
  formulas,
  formulaEvents,
  formulaEventDiluents,
  tastingSessions,
  tastingStrips,
  tastingMoments,
  tastingFamilies,
  tastingBattery,
  tastingCurve,
  tastingClosures,
  tastingMarks,
  materialCategories,
  materials,
  materialComponents,
  regulations,
  materialDoses,
  materialDescriptors,
  materialRelations,
  materialReferences,
  labMaterials,
  labDilutions,
  labDilutionDiluents,
  shoppingItems,
  labEvaluations,
  labAxes,
  ifraStandards,
  ifraLimits,
  ifraSubstances,
  ifraAnnex,
  ifraVariantRules,
  ifraSpecExclusions,
  dataVersion,
  uploadRejections: { tableDefinition: uploadRejections, options: { localOnly: true } },
});
