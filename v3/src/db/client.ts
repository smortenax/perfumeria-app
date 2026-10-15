import { createClient, type User } from "@supabase/supabase-js";

/**
 * The connection to Supabase (plan step 1.7). The session is kept in the browser, so the app
 * opens without network with the last one (V3-8): Supabase is reached only to sign in, to
 * renew the session and to upload.
 */
const STORAGE_KEY = "perfumeria.sesion";

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: STORAGE_KEY },
});

export interface SignedInUser {
  readonly id: string;
  readonly email: string;
}

const toUser = (user: Pick<User, "id" | "email">): SignedInUser => ({ id: user.id, email: user.email ?? "" });

/**
 * Who is signed in. The session kept in the browser opens the app at once, with or without
 * network (V3-8): waiting for Supabase would leave the app shut while it tries to renew an
 * expired session offline (it retries for half a minute). Supabase renews it in the
 * background and says SIGNED_OUT if it no longer stands.
 */
export async function currentUser(): Promise<SignedInUser | null> {
  const kept = storedUser();
  if (kept) {
    return kept;
  }
  const { data } = await supabase.auth.getSession();
  return data.session ? toUser(data.session.user) : null;
}

/** The user of the session kept in the browser, if there is one. */
export function storedUser(read: (key: string) => string | null = (key) => localStorage.getItem(key)): SignedInUser | null {
  try {
    const user = JSON.parse(read(STORAGE_KEY) ?? "null")?.user;
    return typeof user?.id === "string" ? toUser(user) : null;
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<SignedInUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw error ?? new Error("sign-in without a user");
  }
  return toUser(data.user);
}

/**
 * The one-click sign-in of the test phase (vite.config.ts, devLogin): the dev server, on this
 * computer, gets a one-use sign-in for the account from the local Supabase, and it is redeemed here.
 */
export async function signInForTesting(who: "test" | "me"): Promise<SignedInUser> {
  const response = await fetch("/__dev/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ who }) });
  const answer = (await response.json()) as { tokenHash?: string; error?: string };
  if (!response.ok || !answer.tokenHash) throw new Error(answer.error ?? `HTTP ${response.status}`);
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: answer.tokenHash, type: "magiclink" });
  if (error || !data.user) throw error ?? new Error("sign-in without a user");
  return toUser(data.user);
}

/** Signing out of this browser. Without network Supabase may not answer: the kept session goes anyway. */
export async function signOut(): Promise<void> {
  await Promise.race([supabase.auth.signOut({ scope: "local" }), new Promise((resolve) => setTimeout(resolve, 3000))]);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing was kept.
  }
}
