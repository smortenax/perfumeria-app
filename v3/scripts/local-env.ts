/**
 * Writes .env.local for local development (plan v3, steps 1.4 and 1.5): the local Supabase's
 * address and keys (from `supabase status`), PowerSync's address, a random password for
 * PowerSync's role and two local test users (for the checks with two users, step 2.8).
 *
 * A value already in .env.local is kept: run it again after `npm run db:start` without losing
 * anything. The file never goes to Git, and nothing here is printed.
 *
 *   npm run env:local
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const FILE = ".env.local";

const status = JSON.parse(execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const url: string = status.API_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
  console.error(`Supabase no es local (${url}): no se escribe nada.`);
  process.exit(1);
}

const kept = new Map<string, string>();
if (existsSync(FILE)) {
  for (const line of readFileSync(FILE, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m && m[2] !== "") kept.set(m[1], m[2]);
  }
}

// Letters and digits only, so they go into a connection URI as they are.
const secret = (bytes: number) => randomBytes(bytes).toString("base64url").replace(/[-_]/g, "x");
const keep = (key: string, value: () => string) => kept.get(key) ?? value();

const values: Array<[string, string]> = [
  ["VITE_SUPABASE_URL", url],
  ["VITE_SUPABASE_ANON_KEY", status.PUBLISHABLE_KEY],
  ["SUPABASE_LOCAL_SECRET_KEY", status.SECRET_KEY],
  ["VITE_POWERSYNC_URL", keep("VITE_POWERSYNC_URL", () => "http://127.0.0.1:8080")],
  ["POWERSYNC_DB_PASSWORD", keep("POWERSYNC_DB_PASSWORD", () => secret(24))],
  ["TEST_USER_A_EMAIL", keep("TEST_USER_A_EMAIL", () => "prueba-a@perfumeria.test")],
  ["TEST_USER_A_PASSWORD", keep("TEST_USER_A_PASSWORD", () => secret(18))],
  ["TEST_USER_B_EMAIL", keep("TEST_USER_B_EMAIL", () => "prueba-b@perfumeria.test")],
  ["TEST_USER_B_PASSWORD", keep("TEST_USER_B_PASSWORD", () => secret(18))],
];
const others = [...kept].filter(([k]) => !values.some(([v]) => v === k));

writeFileSync(
  FILE,
  "# Local development only (npm run env:local). Never in Git.\n" +
    [...values, ...others].map(([k, v]) => `${k}=${v}`).join("\n") +
    "\n",
);
console.log(`${FILE} escrito: ${values.length + others.length} valores (no se muestran).`);
