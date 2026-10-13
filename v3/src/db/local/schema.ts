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
  categoryId: text("category_id"),
  form: text("form"),
  basedOnId: text("based_on_id"),
  grade: text("grade"),
  supplier: text("supplier"),
  purity: text("purity"),
  house: text("house"),
  code: text("code"),
  odorTarget: text("odor_target"),
  synthesis: text("synthesis"),
  isomers: text("isomers"),
  family: text("family"),
  familyDetail: text("family_detail"),
  facets: text("facets"),
  tier: text("tier"),
  evolution: text("evolution"),
  tenacity: text("tenacity"),
  strength: text("strength"),
  threshold: text("threshold"),
  diffusion: text("diffusion"),
  blendEffect: text("blend_effect"),
  role: text("role"),
  recommendedDilution: text("recommended_dilution"),
  sources: text("sources"),
  confidence: text("confidence"),
  disputedFields: list("disputed_fields"),
  ...timestamps,
});

export const materialComponents = sqliteTable("material_components", {
  id: text("id").primaryKey(),
  materialId: text("material_id"),
  ownerId: text("owner_id"),
  componentId: text("component_id"),
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

export const labMaterials = sqliteTable("lab_materials", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  materialId: text("material_id"),
  createdAt: text("created_at"),
});

export const dataVersion = sqliteTable("data_version", {
  id: text("id").primaryKey(),
  single: integer("single", { mode: "boolean" }),
  commit: text("commit"),
  batch: text("batch"),
  loadedAt: text("loaded_at"),
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
  materialCategories,
  materials,
  materialComponents,
  regulations,
  materialDoses,
  labMaterials,
  dataVersion,
  uploadRejections,
};

/** The same tables, as PowerSync keeps them: the rejections never leave the browser. */
export const AppSchema = new DrizzleAppSchema({
  materialCategories,
  materials,
  materialComponents,
  regulations,
  materialDoses,
  labMaterials,
  dataVersion,
  uploadRejections: { tableDefinition: uploadRejections, options: { localOnly: true } },
});
