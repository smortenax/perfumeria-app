import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/web";
import { SupabaseConnector } from "../connector";
import { AppSchema, tables } from "./schema";

/**
 * The browser's copy for one user (V3-9): a SQLite file of their own, so two people in the
 * same browser never share one. The app always reads and writes here; PowerSync syncs it
 * with Supabase whenever there is network.
 */
function open(userId: string) {
  const powerSync = new PowerSyncDatabase({
    schema: AppSchema,
    database: { dbFilename: `perfumeria-${userId}.sqlite` },
  });
  const db = wrapPowerSyncWithDrizzle(powerSync, { schema: tables });
  void powerSync.connect(new SupabaseConnector());
  return { userId, powerSync, db };
}

export type LocalDatabase = ReturnType<typeof open>;

/** One copy open at a time, kept while the user is signed in (PowerSync wants one instance per file). */
let current: LocalDatabase | null = null;

export function localDatabaseFor(userId: string): LocalDatabase {
  if (current?.userId !== userId) {
    void current?.powerSync.close();
    current = open(userId);
  }
  return current;
}

/** On signing out: stop syncing and close the copy. Its file stays in the browser, with what has not gone up yet. */
export async function closeLocalDatabase(): Promise<void> {
  const closing = current;
  current = null;
  await closing?.powerSync.disconnect();
  await closing?.powerSync.close();
}
