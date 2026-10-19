/**
 * Loads v3/datos/ into Supabase (plan v3, phase 4, «Cargar»; V3-21): the common data, as the
 * migration wrote it and the user approved it. Run again, it changes no row: a row is only
 * updated when something in it differs. A common row that is no longer in the data (a material
 * fused into another, plan step 4.8) is deleted, only in a table whose CSV is there; a user's
 * row never is, and if one still points to it, nothing is loaded. Then it writes data_version
 * with the commit of the data (V3-26), which must be committed first.
 *
 *   npm run datos:cargar                      (the local Supabase)
 *   DATABASE_URL=… npm run datos:cargar       (another one: the cloud, when the user asks)
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getTableColumns, getTableName } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import postgres from "postgres";
import * as ifra from "../db/schema/ifra.ts";
import * as schema from "../db/schema/materials.ts";
import { BOOLEAN_COLUMNS, LIST_COLUMNS } from "../src/db/server-row.ts";
import { parseCsv } from "./csv.ts";

const DATA = "datos";
/** In the order their foreign keys need: the materials and their lists, then IFRA's layer (V3-35). */
const ORDER = [
  "material_categories",
  "materials",
  "material_components",
  "regulations",
  "material_doses",
  "material_descriptors",
  "material_relations",
  "material_references",
  "ifra_standards",
  "ifra_limits",
  "ifra_substances",
  "ifra_annex",
  "ifra_variant_rules",
  "ifra_spec_exclusions",
] as const;

const tables = new Map<string, PgTable>(
  ([...Object.values(schema), ...Object.values(ifra)] as PgTable[])
    .filter((t) => typeof t === "object" && t !== null && getTableName(t))
    .map((t) => [getTableName(t), t]),
);

const url = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:55322/postgres";
const sql = postgres(url, { max: 1, onnotice: () => {} });

type Value = string | boolean | null | string[];

function value(table: string, column: string, text: string): Value {
  if (text === "") return null;
  if ((LIST_COLUMNS[table] ?? []).includes(column)) return JSON.parse(text);
  if ((BOOLEAN_COLUMNS[table] ?? []).includes(column)) return text === "true";
  return text;
}

interface Loaded {
  readonly inserted: number;
  readonly updated: number;
  readonly rows: number;
  /** The ids in the data, or null when the table has no CSV (then nothing of it is deleted). */
  readonly ids: string[] | null;
}

async function load(db: postgres.TransactionSql, table: string): Promise<Loaded> {
  const path = join(DATA, `${table}.csv`);
  if (!existsSync(path)) return { inserted: 0, updated: 0, rows: 0, ids: null };
  const [header, ...lines] = parseCsv(readFileSync(path, "utf8")).filter((l) => l.length > 1 || l[0] !== "");
  // Only rows need columns the schema has: a file with none (a table emptied of common rows) still prunes.
  const allowed = new Set(Object.values(getTableColumns(tables.get(table)!)).map((c) => c.name));
  for (const column of lines.length > 0 ? header : []) {
    if (!allowed.has(column)) throw new Error(`${path}: la columna «${column}» no está en el esquema de ${table}`);
  }
  if (lines.length === 0) return { inserted: 0, updated: 0, rows: 0, ids: [] };
  const rows = lines.map((cells) => Object.fromEntries(header.map((c, i) => [c, value(table, c, cells[i] ?? "")])) as Record<string, Value>);
  const changing = header.filter((c) => c !== "id");
  const set = changing.map((c) => `"${c}" = excluded."${c}"`).join(", ");
  const differs = `(${changing.map((c) => `"${table}"."${c}"`).join(", ")}) is distinct from (${changing.map((c) => `excluded."${c}"`).join(", ")})`;
  let inserted = 0;
  let updated = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const result = await db`
      insert into ${db(table)} ${db(batch, header)}
      on conflict (id) do update set ${db.unsafe(set)} where ${db.unsafe(differs)}
      returning (xmax = 0) as inserted`;
    for (const r of result) (r.inserted ? inserted++ : updated++);
  }
  return { inserted, updated, rows: rows.length, ids: rows.map((r) => r.id as string) };
}

/** Deletes the common rows of a table that are not in its data; a user's rows are never touched. */
async function prune(db: postgres.TransactionSql, table: string, ids: readonly string[]): Promise<number> {
  const owned = Object.values(getTableColumns(tables.get(table)!)).some((c) => c.name === "owner_id");
  const result = owned
    ? await db`delete from ${db(table)} where owner_id is null and not (id = any(${ids as string[]}::uuid[])) returning id`
    : await db`delete from ${db(table)} where not (id = any(${ids as string[]}::uuid[])) returning id`;
  return result.length;
}

try {
  const pending = execSync(`git status --porcelain -- ${DATA}`, { encoding: "utf8" }).trim();
  if (pending) throw new Error(`v3/datos/ tiene cambios sin commit: el commit de los datos no los diría.\n${pending}`);
  const commit = execSync(`git log -1 --format=%h -- ${DATA}`, { encoding: "utf8" }).trim();
  // The approved batches, from the audit trail that travels with the data (datos/tandas.csv).
  const trail = join(DATA, "tandas.csv");
  const batches = existsSync(trail)
    ? [...new Set(parseCsv(readFileSync(trail, "utf8")).slice(1).map((l) => l[0]).filter((b) => b))].join(" ") || null
    : null;
  // One transaction: if any row is refused, nothing is left half loaded.
  const report = await sql.begin(async (db) => {
    const lines: string[] = [];
    const loaded = new Map<string, Loaded>();
    for (const table of ORDER) loaded.set(table, await load(db, table));
    // Children first: a fused material goes after its rows.
    const deleted = new Map<string, number>();
    for (const table of [...ORDER].reverse()) {
      const ids = loaded.get(table)!.ids;
      if (ids) deleted.set(table, await prune(db, table, ids));
    }
    for (const table of ORDER) {
      const { inserted, updated, rows } = loaded.get(table)!;
      const gone = deleted.get(table) ?? 0;
      if (rows > 0 || gone > 0) lines.push(`${table}: ${rows} filas en los datos; ${inserted} nuevas, ${updated} cambiadas, ${rows - inserted - updated} iguales${gone ? `; ${gone} borradas` : ""}.`);
    }
    await db`
    insert into data_version (single, "commit", batch) values (true, ${commit}, ${batches})
    on conflict (single) do update set "commit" = excluded."commit", batch = excluded.batch, loaded_at = now()
    where (data_version."commit", data_version.batch) is distinct from (excluded."commit", excluded.batch)`;
    return lines;
  });
  for (const line of report) console.log(line);
  console.log(`data_version: ${commit} (tandas: ${batches ?? "ninguna"}).`);
} finally {
  await sql.end();
}
