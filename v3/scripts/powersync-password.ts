/**
 * Sets the password of PowerSync's role in the local database (plan v3, step 1.2). The
 * migration creates the role without one, so that no password reaches Git; it comes from
 * .env.local (POWERSYNC_DB_PASSWORD). In the cloud, the user sets it in Supabase's SQL editor.
 *
 *   npm run db:powersync-password
 */
import postgres from "postgres";

const password = process.env.POWERSYNC_DB_PASSWORD;
if (!password) {
  console.error("Falta POWERSYNC_DB_PASSWORD en .env.local (ver .env.example).");
  process.exit(1);
}

// Supabase's local database; its well-known local password, not a secret.
const sql = postgres("postgresql://postgres:postgres@127.0.0.1:54322/postgres", { max: 1 });
try {
  // ALTER ROLE takes no parameters: the password goes in as a quoted literal.
  await sql.unsafe(`ALTER ROLE powersync_role WITH PASSWORD '${password.replaceAll("'", "''")}'`);
  console.log("Contraseña de powersync_role puesta en la base local.");
} finally {
  await sql.end();
}
