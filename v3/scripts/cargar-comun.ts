/**
 * Loads the common side of the new materials' system (V3-70; docs-v3/sistema-materiales.md) into
 * the `common` schema: one folder per batch, as the migration wrote it, in the order of their
 * numbers. Each folder has batches.csv (its one batch) and one CSV per table it fills. Run again,
 * it changes no row; a row of the batch that is no longer in its CSV is deleted. Then it rewrites
 * the resolved sheets (common.refresh_sheets). One transaction: if any row is refused, nothing
 * is left half loaded.
 *
 *   npm run datos:cargar-comun                         (every folder of datos/comun/, local Supabase)
 *   npm run datos:cargar-comun -- <folder> [<folder>…]  (a batch still under review, to look at it)
 *   DATABASE_URL=… npm run datos:cargar-comun          (another database, when the user asks)
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { getTableColumns, getTableName } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import postgres from "postgres";
import * as common from "../db/schema/common.ts";
import { parseCsv } from "./csv.ts";

const DATA = "datos/comun";
/** In the order their foreign keys need. */
const ORDER = [
  "sources",
  "batches",
  "vocabularies",
  "equivalences",
  "companies",
  "substances",
  "substance_aliases",
  "amendments",
  "ifra_categories",
  "ifra_standards",
  "ifra_substances",
  "ifra_limits",
  "ifra_annex",
  "ifra_rules",
  "allergen_entries",
  "allergen_substances",
  "attributes",
  "scales",
  "materials",
  "natural_treatments",
  "identifiers",
  "relations",
  "reference_perfumes",
  "material_texts",
  "products",
  "documents",
  "manufacturer_caps",
  "compositions",
  "composition_lines",
  "claims",
  "claim_terms",
] as const;
/** Shared by every batch: never pruned by one of them. */
const SHARED = new Set(["sources", "batches"]);

const tables = new Map<string, PgTable>(
  (Object.values(common) as unknown[])
    .filter((t): t is PgTable => typeof t === "object" && t !== null && typeof getTableName(t as PgTable) === "string")
    .map((t) => [getTableName(t), t]),
);
const columnsOf = (table: string): Map<string, PgColumn> =>
  new Map(Object.values(getTableColumns(tables.get(table)!)).map((c) => [c.name, c as PgColumn]));
const keyOf = (table: string) => (table === "natural_treatments" ? ["material_id", "treatment_id"] : ["id"]);

const url = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:55322/postgres";
const sql = postgres(url, { max: 1, onnotice: () => {} });

type Value = string | boolean | null | string[] | ReturnType<typeof sql.json>;

function value(column: PgColumn, text: string): Value {
  if (text === "") return null;
  if (column.columnType === "PgArray") return JSON.parse(text) as string[];
  if (column.columnType === "PgBoolean") return text === "true";
  if (column.columnType === "PgJsonb") return sql.json(JSON.parse(text));
  return text;
}

interface Loaded {
  readonly inserted: number;
  readonly updated: number;
  readonly rows: number;
  readonly keys: string[][] | null;
}

async function load(db: postgres.TransactionSql, dir: string, table: string, batchId: string): Promise<Loaded> {
  const path = join(dir, `${table}.csv`);
  if (!existsSync(path)) return { inserted: 0, updated: 0, rows: 0, keys: null };
  const [header, ...lines] = parseCsv(readFileSync(path, "utf8")).filter((l) => l.length > 1 || l[0] !== "");
  const columns = columnsOf(table);
  for (const name of header) {
    const column = columns.get(name);
    if (!column) throw new Error(`${path}: la columna «${name}» no está en common.${table}`);
    if (column.generated) throw new Error(`${path}: «${name}» es una columna generada; no va en los datos`);
  }
  if (lines.length === 0) return { inserted: 0, updated: 0, rows: 0, keys: [] };
  const rows = lines.map((cells) => Object.fromEntries(header.map((c, i) => [c, value(columns.get(c)!, cells[i] ?? "")])));
  const key = keyOf(table);
  const changing = header.filter((c) => !key.includes(c));
  const qualified = `common.${table}`;
  const conflict = `on conflict (${key.map((k) => `"${k}"`).join(", ")}) ${
    changing.length === 0
      ? "do nothing"
      : `do update set ${changing.map((c) => `"${c}" = excluded."${c}"`).join(", ")} where (${changing.map((c) => `${qualified}."${c}"`).join(", ")}) is distinct from (${changing.map((c) => `excluded."${c}"`).join(", ")})`
  }`;
  // A row belongs to the batch that wrote it: another batch never overwrites it.
  if (key.length === 1 && columns.has("batch_id") && !SHARED.has(table)) {
    const ids = rows.map((r) => String(r.id));
    const [{ n }] = await db`select count(*)::int as n from ${db(qualified)} where id = any(${ids}::uuid[]) and batch_id is distinct from ${batchId}`;
    if (n > 0) throw new Error(`${path}: ${n} filas ya son de otra tanda; una tanda no reescribe las de otra`);
  }
  let inserted = 0;
  let updated = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const result = await db`insert into ${db(qualified)} ${db(chunk as Record<string, Value>[], header)} ${db.unsafe(conflict)} returning (xmax = 0) as inserted`;
    for (const r of result) (r.inserted ? inserted++ : updated++);
  }
  return { inserted, updated, rows: rows.length, keys: rows.map((r) => key.map((k) => String(r[k]))) };
}

/** Deletes the rows of this batch that are no longer in its CSV. */
async function prune(db: postgres.TransactionSql, table: string, batchId: string, keys: readonly string[][]): Promise<number> {
  if (SHARED.has(table) || !columnsOf(table).has("batch_id")) return 0;
  const key = keyOf(table);
  const kept = keys.map((k) => k.join("|"));
  const result = await db`
    delete from ${db(`common.${table}`)}
     where batch_id = ${batchId}
       and not ((${db.unsafe(key.map((k) => `"${k}"::text`).join(" || '|' || "))}) = any(${kept}::text[]))
    returning 1`;
  return result.length;
}

function folders(): string[] {
  const given = process.argv.slice(2);
  if (given.length > 0) return given;
  if (!existsSync(DATA)) return [];
  const number = (name: string) => Number.parseInt(name, 10) || 0;
  return readdirSync(DATA)
    .filter((name) => statSync(join(DATA, name)).isDirectory())
    .sort((a, b) => number(a) - number(b) || a.localeCompare(b))
    .map((name) => join(DATA, name));
}

try {
  const dirs = folders();
  if (dirs.length === 0) throw new Error(`No hay tandas que cargar en ${DATA}/`);
  const report = await sql.begin(async (db) => {
    const lines: string[] = [];
    for (const dir of dirs) {
      const batchRows = parseCsv(readFileSync(join(dir, "batches.csv"), "utf8")).filter((l) => l.length > 1);
      if (batchRows.length !== 2) throw new Error(`${dir}/batches.csv: tiene que llevar una sola tanda`);
      const batchId = batchRows[1][batchRows[0].indexOf("id")];
      const loaded = new Map<string, Loaded>();
      for (const table of ORDER) loaded.set(table, await load(db, dir, table, batchId));
      const deleted = new Map<string, number>();
      for (const table of [...ORDER].reverse()) {
        const keys = loaded.get(table)!.keys;
        if (keys) deleted.set(table, await prune(db, table, batchId, keys));
      }
      // The commit of an approved batch, when it is committed; a batch under review has none.
      const tracked = dir.startsWith(DATA) && !execSync(`git status --porcelain -- ${dir}`, { encoding: "utf8" }).trim();
      const commit = tracked ? execSync(`git log -1 --format=%h -- ${dir}`, { encoding: "utf8" }).trim() || null : null;
      await db`update common.batches set "commit" = ${commit} where id = ${batchId} and "commit" is distinct from ${commit}`;
      lines.push(`${dir}${commit ? ` (commit ${commit})` : " (sin commit: en revisión)"}`);
      for (const table of ORDER) {
        const { inserted, updated, rows } = loaded.get(table)!;
        const gone = deleted.get(table) ?? 0;
        if (rows > 0 || gone > 0) lines.push(`  ${table}: ${rows} filas; ${inserted} nuevas, ${updated} cambiadas, ${rows - inserted - updated} iguales${gone ? `; ${gone} borradas` : ""}.`);
      }
    }
    const [{ sheets }] = await db`select common.refresh_sheets() as sheets`;
    const [{ lines: composition }] = await db`select count(*)::int as lines from common.sheet_composition`;
    lines.push(`Fichas: ${sheets}, con ${composition} líneas de composición.`);
    return lines;
  });
  for (const line of report) console.log(line);
} finally {
  await sql.end();
}
