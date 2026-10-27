/**
 * Brings your account from the local Supabase up to the cloud, so the PC and the phone see the
 * same data (2026-10-27). Table by table of what is yours (a column `owner_id` or `user_id`), by
 * id: a row only in the local copy goes up with its id and your cloud account as owner; a row in
 * both with different values (other than its dates) is left alone and written to the CSV for you to decide; nothing in
 * the cloud is changed or deleted. Run again, it inserts nothing.
 *
 *   DATABASE_URL_CLOUD=… node migracion-v3/subir-cuenta.ts <your email>           (compares only)
 *   DATABASE_URL_CLOUD=… node migracion-v3/subir-cuenta.ts <your email> --subir   (and inserts)
 *
 * The differences go to migracion-v3/subir-cuenta/diferencias.csv (outside Git: your data).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const postgres = createRequire(join(process.cwd(), "v3/package.json"))("postgres");

const email = process.argv[2];
const upload = process.argv.includes("--subir");
if (!email || !process.env.DATABASE_URL_CLOUD) {
  console.error("Uso: DATABASE_URL_CLOUD=… node migracion-v3/subir-cuenta.ts <correo> [--subir]");
  process.exit(1);
}
const local = postgres("postgresql://postgres:postgres@127.0.0.1:55322/postgres", { max: 1, onnotice: () => {} });
const cloud = postgres(process.env.DATABASE_URL_CLOUD, { max: 1, onnotice: () => {} });

type Row = Record<string, unknown>;
const DATES = ["created_at", "updated_at"];
const text = (v: unknown): string =>
  v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);

async function userId(db: typeof local): Promise<string> {
  const users = await db`select id from auth.users where lower(email) = lower(${email})`;
  if (users.length !== 1) throw new Error(`No hay ninguna cuenta con el correo ${email} en una de las dos bases.`);
  return users[0].id;
}

try {
  const localId = await userId(local);
  const cloudId = await userId(cloud);
  const owned: { table: string; owner: string }[] = await local`
    select table_name as table, min(column_name) as owner from information_schema.columns
    where table_schema = 'public' and column_name in ('owner_id', 'user_id')
    group by table_name order by table_name`;

  const pending: { table: string; owner: string; row: Row }[] = [];
  const conflicts: string[][] = [["tabla", "id", "columna", "local", "nube"]];
  const counts: string[] = [];
  for (const { table, owner } of owned) {
    const mine: Row[] = await local`select * from ${local(table)} where ${local(owner)} = ${localId}`;
    const theirs: Row[] = await cloud`select * from ${cloud(table)} where id in ${cloud(mine.length ? mine.map((r) => r.id as string) : ["00000000-0000-0000-0000-000000000000"])}`;
    const cloudMine = await cloud`select count(*)::int as n from ${cloud(table)} where ${cloud(owner)} = ${cloudId}`;
    const byId = new Map(theirs.map((r) => [r.id as string, r]));
    let onlyLocal = 0, same = 0, different = 0;
    for (const row of mine) {
      const other = byId.get(row.id as string);
      if (!other) {
        onlyLocal++;
        pending.push({ table, owner, row });
        continue;
      }
      // When a row was written says nothing about what it holds: each batch was loaded on its own
      // into each base, so their dates differ.
      const columns = Object.keys(row).filter((c) => c !== owner && !DATES.includes(c) && text(row[c]) !== text(other[c]));
      if (other[owner] !== cloudId) columns.unshift(owner);
      if (columns.length === 0) same++;
      else {
        different++;
        for (const c of columns) conflicts.push([table, row.id as string, c, c === owner ? "tu cuenta" : text(row[c]), c === owner ? text(other[c]) : text(other[c])]);
      }
    }
    counts.push(`${table}: local ${mine.length}, nube ${cloudMine[0].n}; solo en local ${onlyLocal}, iguales ${same}, distintas ${different}.`);
  }
  console.log(counts.join("\n"));

  mkdirSync("migracion-v3/subir-cuenta", { recursive: true });
  const csv = conflicts.map((line) => line.map((v) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)).join(",")).join("\n");
  writeFileSync("migracion-v3/subir-cuenta/diferencias.csv", csv + "\n");
  console.log(`Distintas: ${conflicts.length - 1} columnas en migracion-v3/subir-cuenta/diferencias.csv.`);

  if (upload && pending.length > 0) {
    // One transaction. A row whose parent is not there yet (another table, or a cycle between
    // tables such as an accord and the event it was frozen from) waits for the next pass.
    const inserted = await cloud.begin(async (db: typeof cloud) => {
      let left = pending, done = 0;
      while (left.length > 0) {
        const wait: typeof pending = [];
        for (const item of left) {
          const row = { ...item.row, [item.owner]: cloudId };
          try {
            await db.savepoint((sp: typeof cloud) => sp`insert into ${sp(item.table)} ${sp(row)}`);
            done++;
          } catch (e) {
            if ((e as { code?: string }).code !== "23503") throw new Error(`${item.table} ${item.row.id}: ${(e as Error).message}`);
            wait.push(item);
          }
        }
        if (wait.length === left.length) throw new Error(`Sin padre en la nube: ${wait.map((w) => `${w.table} ${w.row.id}`).slice(0, 10).join("; ")}`);
        left = wait;
      }
      return done;
    });
    console.log(`Subidas: ${inserted} filas, a la cuenta de ${email} en la nube.`);
  } else if (!upload) console.log(`Por subir: ${pending.length} filas (con --subir).`);
} finally {
  await local.end();
  await cloud.end();
}
