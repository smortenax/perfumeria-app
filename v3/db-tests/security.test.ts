import { afterAll, expect, it } from "vitest";
import { admin } from "./local";

/**
 * Before publishing (plan 9.1 and 9.2), a guard over the whole schema, so that a new migration that
 * forgets it does not pass: every table of `public` has RLS on, no policy is for the anonymous role,
 * and no SECURITY DEFINER function can be called without a session, and each fixes its search_path.
 */

afterAll(async () => {
  await admin.end();
});

it("every public table has RLS on", async () => {
  const off = await admin`
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity order by 1`;
  expect(off.map((r) => r.relname)).toEqual([]);
});

it("no policy is for the anonymous role or for everyone", async () => {
  const open = await admin`
    select c.relname, p.polname from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and (0 = any(p.polroles) or exists (select 1 from pg_roles r where r.oid = any(p.polroles) and r.rolname = 'anon'))`;
  expect(open).toEqual([]);
});

it("no SECURITY DEFINER function runs without a session, and each fixes its search_path", async () => {
  const definers = await admin`
    select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon, p.proconfig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef`;
  expect(definers.length).toBeGreaterThan(0);
  expect(definers.filter((f) => f.anon).map((f) => f.proname)).toEqual([]);
  expect(definers.filter((f) => !(f.proconfig ?? []).some((c: string) => c.startsWith("search_path="))).map((f) => f.proname)).toEqual([]);
});

it("a history can be neither changed nor deleted, and a material in one cannot be deleted", async () => {
  const policies = await admin`
    select p.polcmd from pg_policy p where p.polrelid = 'public.formula_events'::regclass`;
  expect(policies.map((p) => p.polcmd).sort()).toEqual(["a", "r"]);
  const restrict = await admin`
    select conname from pg_constraint
    where conrelid = 'public.formula_events'::regclass and contype = 'f' and confrelid = 'public.materials'::regclass and confdeltype <> 'r'`;
  expect(restrict).toEqual([]);
});
