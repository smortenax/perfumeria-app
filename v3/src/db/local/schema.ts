import { DrizzleAppSchema } from "@powersync/drizzle-driver";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The browser's copy of the data (V3-9, plan step 1.5): the server's tables again, in SQLite.
 * PowerSync keeps only text, integer and real, so exact numbers travel as text (V3-9).
 * Every synced table has its own text id, a uuid.
 */

/** The probe of step 1.5, as `db/schema/probe.ts` on the server. */
export const syncProbe = sqliteTable("sync_probe", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id"),
  note: text("note"),
  createdAt: text("created_at"),
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
export const tables = { syncProbe, uploadRejections };

/** The same tables, as PowerSync keeps them: the rejections never leave the browser. */
export const AppSchema = new DrizzleAppSchema({
  syncProbe,
  uploadRejections: { tableDefinition: uploadRejections, options: { localOnly: true } },
});
