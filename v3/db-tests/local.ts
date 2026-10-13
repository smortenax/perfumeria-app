import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";

/**
 * What the database tests need: the local database as its owner (it skips RLS, as the
 * loading script does), each test user as the app would be, and what PowerSync sends each one.
 * Only against local addresses.
 */

const url = process.env.VITE_SUPABASE_URL ?? "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url) || anonKey === "") {
  throw new Error("The database tests run only against the local Supabase (npm run env:local).");
}

/** The local database as its owner, like the loading script: RLS does not stop it. */
export const admin = postgres("postgresql://postgres:postgres@127.0.0.1:54322/postgres", { max: 2, onnotice: () => {} });

export interface TestUser {
  readonly id: string;
  readonly token: string;
  readonly db: SupabaseClient;
}

export async function signIn(who: "A" | "B"): Promise<TestUser> {
  const db = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.auth.signInWithPassword({
    email: process.env[`TEST_USER_${who}_EMAIL`] ?? "",
    password: process.env[`TEST_USER_${who}_PASSWORD`] ?? "",
  });
  if (error || !data.session) {
    throw new Error(`Test user ${who} cannot sign in (npm run db:test-users): ${error?.message}`);
  }
  return { id: data.user.id, token: data.session.access_token, db };
}

/** The rows PowerSync sends a user, by table and id, as they reach the browser. */
export type Synced = Map<string, Map<string, Record<string, unknown>>>;

/** One full download, as a new browser would get it: from nothing to the first complete checkpoint. */
export async function download(token: string): Promise<Synced> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 20_000);
  try {
    const res = await fetch("http://127.0.0.1:8080/sync/stream", {
      method: "POST",
      signal: abort.signal,
      headers: { Authorization: `Token ${token}`, "Content-Type": "application/json", Accept: "application/x-ndjson" },
      body: JSON.stringify({ buckets: [], include_checksum: true, raw_data: true, client_id: "test-db" }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`PowerSync answered ${res.status}: ${await res.text()}`);
    }
    const synced: Synced = new Map();
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        throw new Error("PowerSync closed the stream before a complete checkpoint");
      }
      pending += decoder.decode(value, { stream: true });
      let end: number;
      while ((end = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, end).trim();
        pending = pending.slice(end + 1);
        if (line === "") continue;
        const message = JSON.parse(line);
        for (const op of message.data?.data ?? []) {
          if (op.op === "PUT") {
            const rows = synced.get(op.object_type) ?? new Map<string, Record<string, unknown>>();
            rows.set(op.object_id, typeof op.data === "string" ? JSON.parse(op.data) : op.data);
            synced.set(op.object_type, rows);
          } else if (op.op === "REMOVE") {
            synced.get(op.object_type)?.delete(op.object_id);
          }
        }
        if (message.checkpoint_complete) {
          return synced;
        }
      }
    }
  } finally {
    clearTimeout(timer);
    abort.abort();
  }
}

/** Downloads again until `ready` holds: PowerSync replicates a moment after Postgres commits. */
export async function downloadWhen(token: string, ready: (synced: Synced) => boolean): Promise<Synced> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    const synced = await download(token);
    if (ready(synced) || Date.now() > deadline) {
      return synced;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

export const has = (synced: Synced, table: string, id: string): boolean => synced.get(table)?.has(id) ?? false;
