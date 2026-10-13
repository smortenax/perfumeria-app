/**
 * Creates the two local test users of .env.local (TEST_USER_A_*, TEST_USER_B_*) in the local
 * Supabase, where sign-up is closed (plan v3, step 1.2). Only against a local address: the
 * user's own account, local or in the cloud, they create by hand.
 *
 *   npm run db:test-users
 */
const url = process.env.VITE_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_LOCAL_SECRET_KEY ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url) || key === "") {
  console.error("Hace falta el Supabase local en .env.local (npm run env:local).");
  process.exit(1);
}

for (const who of ["A", "B"]) {
  const email = process.env[`TEST_USER_${who}_EMAIL`];
  const password = process.env[`TEST_USER_${who}_PASSWORD`];
  if (!email || !password) {
    console.error(`Falta TEST_USER_${who}_EMAIL o TEST_USER_${who}_PASSWORD en .env.local.`);
    process.exit(1);
  }
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log(`Usuario de prueba ${who} creado.`);
  } else if (res.status === 422 && /already/i.test(JSON.stringify(body))) {
    console.log(`Usuario de prueba ${who}: ya existía.`);
  } else {
    console.error(`Usuario de prueba ${who}: ${res.status} ${JSON.stringify(body)}`);
    process.exit(1);
  }
}
