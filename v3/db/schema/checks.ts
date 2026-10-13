import { sql } from "drizzle-orm";
import { bigint, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/**
 * The check that exact numbers survive the sync both ways (plan v3, step 3.1): a mass in
 * micrograms past 2^53 and a fraction with 30 decimals. Each user's own; synced only to who
 * asks for its stream (the database tests), never to the app. It stays as a guard: if an
 * update of PowerSync or Supabase breaks exactness, `npm run test:db` says so.
 */
export const syncChecks = pgTable("sync_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .default(sql`auth.uid()`)
    .references(() => authUsers.id, { onDelete: "cascade" }),
  massUg: bigint("mass_ug", { mode: "bigint" }).notNull(),
  fraction: numeric("fraction").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
