import {
  UpdateType,
  type AbstractPowerSyncDatabase,
  type CrudEntry,
  type PowerSyncBackendConnector,
  type PowerSyncCredentials,
} from "@powersync/web";
import { supabase } from "./client";

/**
 * Between the browser's copy and Supabase (V3-9, plan step 1.5), after PowerSync's own
 * example with Supabase (powersync-js, demos/react-supabase-todolist, read 2026-10-13).
 * PowerSync downloads with the session's token; what was written here waits in a queue and
 * goes up through Supabase, where RLS checks it.
 */

/**
 * Where PowerSync is: an address of its own, or a path of the app's own site ("/powersync"),
 * which the development server forwards to the local PowerSync. The same site is needed in
 * some browsers, where the shared worker that syncs every tab cannot reach another origin
 * (seen in the desktop app's built-in browser, 2026-10-13). PowerSync wants it whole and
 * without a final slash.
 */
export function powerSyncEndpoint(configured: string = import.meta.env.VITE_POWERSYNC_URL, base: string = location.origin): string {
  return new URL(configured, base).toString().replace(/\/+$/, "");
}

/** Postgres errors that retrying will not mend: bad data (22), a broken rule (23), RLS (42501). */
const REFUSED = [/^22...$/, /^23...$/, /^42501$/];

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const { data, error } = await supabase.auth.getSession();
    if (!data.session || error) {
      throw new Error(`No Supabase session: ${error?.message ?? "signed out"}`);
    }
    return { endpoint: powerSyncEndpoint(), token: data.session.access_token };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) {
      return;
    }
    let last: CrudEntry | null = null;
    try {
      for (const op of transaction.crud) {
        last = op;
        const table = supabase.from(op.table);
        const result =
          op.op === UpdateType.PUT
            ? await table.upsert({ ...op.opData, id: op.id })
            : op.op === UpdateType.PATCH
              ? await table.update(op.opData ?? {}).eq("id", op.id)
              : await table.delete().eq("id", op.id);
        if (result.error) {
          throw result.error;
        }
      }
      await transaction.complete();
    } catch (e) {
      const code = (e as { code?: unknown }).code;
      if (typeof code === "string" && REFUSED.some((r) => r.test(code))) {
        // Supabase will never take it: keep it in this browser, and let the queue go on.
        await keepRejected(database, last, e);
        await transaction.complete();
      } else {
        // No network, or the server is down: PowerSync tries again later.
        throw e;
      }
    }
  }
}

async function keepRejected(database: AbstractPowerSyncDatabase, op: CrudEntry | null, error: unknown): Promise<void> {
  console.error("Supabase refused an upload; kept in upload_rejections", op, error);
  await database.execute(
    "INSERT INTO upload_rejections (id, table_name, row_id, op, data, error, rejected_at) VALUES (uuid(), ?, ?, ?, ?, ?, ?)",
    [op?.table ?? null, op?.id ?? null, op?.op ?? null, JSON.stringify(op?.opData ?? null), JSON.stringify(error), new Date().toISOString()],
  );
}
