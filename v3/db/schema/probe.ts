import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/**
 * A table to prove the offline copy (plan v3, step 1.5): a row written without network stays
 * in the browser, and reaches Supabase when the network is back. It goes away when the
 * materials' tables arrive (phase 2).
 *
 * Its own uuid id, as every synced table (V3-9: PowerSync takes no composite keys).
 */
export const syncProbe = pgTable("sync_probe", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .default(sql`auth.uid()`)
    .references(() => authUsers.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
