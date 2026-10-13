import { defineConfig } from "drizzle-kit";

/**
 * The server's schema (plan v3, step 1.3): Drizzle writes the SQL into Supabase's own folder,
 * with Supabase's file names, so there is one folder of migrations. RLS, triggers and the
 * PowerSync setup are SQL migrations in the same folder (`drizzle-kit generate --custom`).
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema",
  out: "./supabase/migrations",
  migrations: { prefix: "supabase" },
  // Supabase owns the other schemas (auth, storage…): Drizzle only manages public.
  schemaFilter: ["public"],
  dbCredentials: {
    // Supabase's local database (`npx supabase start`); its well-known local password, not a secret.
    url: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
});
