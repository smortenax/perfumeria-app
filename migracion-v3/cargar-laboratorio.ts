/**
 * Loads batch 8, your version of each of your lab's materials, into your account (plan v3,
 * step 4.6; V3-15, V3-36): never into the common data. Only what you approved: each CSV must have
 * the hash written down in migracion-v3/tandas/aprobadas.csv for 8-tu-version. Every row gets
 * your id as its owner; one transaction, so a refused row leaves nothing half loaded. Run again,
 * it changes no row. It deletes only what a batch lists in its borrar.csv (table, id), approved as
 * the rest, and only rows of your account: what you add in the app stays yours.
 *
 *   node migracion-v3/cargar-laboratorio.ts <the email of your account>                (the local Supabase)
 *   node migracion-v3/cargar-laboratorio.ts <email> --prueba                           (loads and undoes it: a check)
 *   DATABASE_URL=… node migracion-v3/cargar-laboratorio.ts <the email of your account> (another one)
 *   node migracion-v3/cargar-laboratorio.ts <email> --tanda=17-tus-nuevos              (another batch of yours)
 *
 * Batch 8 by default; another batch of yours with --tanda, with only the tables it has.
 *
 * The account must exist: you create it, with your own password. With --prueba the batch need
 * not be approved yet: nothing stays.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";

// The Postgres client of the v3 (this folder has no dependencies of its own).
const postgres = createRequire(join(process.cwd(), "v3/package.json"))("postgres");

const BATCH = process.argv.find((a) => a.startsWith("--tanda="))?.slice("--tanda=".length) ?? "8-tu-version";
const FOLDER = `migracion-v3/tandas/${BATCH}`;
const email = process.argv[2];
const dryRun = process.argv.includes("--prueba");
if (!email) {
  console.error("Uso: node migracion-v3/cargar-laboratorio.ts <el correo de tu cuenta>");
  process.exit(1);
}
const LISTS: Readonly<Record<string, readonly string[]>> = { materials: ["aliases", "other_cas", "disputed_fields"] };
const BOOLEANS: Readonly<Record<string, readonly string[]>> = { materials: ["solvent"], material_doses: ["disputed"] };
/** In the order their foreign keys need; and the column that says whose a row is. */
const OWNER: Readonly<Record<string, string>> = {
  materials: "owner_id",
  material_components: "owner_id",
  regulations: "owner_id",
  material_doses: "owner_id",
  material_descriptors: "owner_id",
  material_relations: "owner_id",
  material_references: "owner_id",
  lab_materials: "user_id",
  lab_dilutions: "user_id",
  lab_dilution_diluents: "user_id",
  lab_evaluations: "user_id",
  lab_axes: "user_id",
};
const ORDER = Object.keys(OWNER);

const approved = parseCsvRecords(readFileSync("migracion-v3/tandas/aprobadas.csv", "utf8")).filter((r) => r.tanda === BATCH);
const tables = ORDER.filter((table) => existsSync(join(FOLDER, `${table}.csv`))).map((table) => {
  const text = readFileSync(join(FOLDER, `${table}.csv`), "utf8");
  const hash = createHash("sha256").update(text, "utf8").digest("hex");
  if (!dryRun && approved.filter((r) => r.archivo === `${table}.csv`).at(-1)?.sha256 !== hash) {
    throw new Error(`${FOLDER}/${table}.csv no es el que aprobaste (aprobadas.csv): no se carga nada.`);
  }
  return { table, header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) };
});

/** What the batch takes out of your account (batch 18: the rows of blank tasting sheets), approved as the rest. */
const removals = (() => {
  const file = join(FOLDER, "borrar.csv");
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf8");
  const hash = createHash("sha256").update(text, "utf8").digest("hex");
  if (!dryRun && approved.filter((r) => r.archivo === "borrar.csv").at(-1)?.sha256 !== hash) {
    throw new Error(`${FOLDER}/borrar.csv no es el que aprobaste (aprobadas.csv): no se carga nada.`);
  }
  const rows = parseCsvRecords(text);
  for (const r of rows) if (!(r.table in OWNER)) throw new Error(`borrar.csv: la tabla ${r.table} no es de tu laboratorio.`);
  return rows;
})();

/** Thrown at the end of a check (--prueba), to undo the transaction and keep its report. */
class DryRun extends Error {
  readonly lines: string[];
  constructor(lines: string[]) {
    super("prueba");
    this.lines = lines;
  }
}

const sql = postgres(process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:55322/postgres", { max: 1, onnotice: () => {} });
try {
  const users = await sql`select id from auth.users where lower(email) = lower(${email})`;
  if (users.length !== 1) throw new Error(`No hay ninguna cuenta con el correo ${email} en esa base: créala tú y vuelve a cargar.`);
  const owner: string = users[0].id;
  const lines = await sql.begin(async (db: typeof sql) => {
    const out: string[] = [];
    for (const { table, header, rows } of tables) {
      const value = (column: string, text: string) => {
        if (column === OWNER[table]) return owner;
        if (text === "") return null;
        if ((LISTS[table] ?? []).includes(column)) return JSON.parse(text);
        if ((BOOLEANS[table] ?? []).includes(column)) return text === "true";
        return text;
      };
      const records = rows.map((r) => Object.fromEntries(header.map((c) => [c, value(c, r[c] ?? "")])));
      // A row with this id that is someone else's is never touched.
      const theirs = await db`select count(*)::int as n from ${db(table)} where id = any(${records.map((r) => r.id)}::uuid[]) and ${db(OWNER[table])} is distinct from ${owner}`;
      if (theirs[0].n > 0) throw new Error(`${table}: ${theirs[0].n} filas con estos ids son comunes o de otra cuenta.`);
      const changing = header.filter((c) => c !== "id");
      const set = changing.map((c) => `"${c}" = excluded."${c}"`).join(", ");
      const differs = `(${changing.map((c) => `"${table}"."${c}"`).join(", ")}) is distinct from (${changing.map((c) => `excluded."${c}"`).join(", ")})`;
      let inserted = 0;
      let updated = 0;
      for (let i = 0; i < records.length; i += 500) {
        const result = await db`
          insert into ${db(table)} ${db(records.slice(i, i + 500), header)}
          on conflict (id) do update set ${db.unsafe(set)} where ${db.unsafe(differs)}
          returning (xmax = 0) as inserted`;
        for (const r of result) (r.inserted ? inserted++ : updated++);
      }
      out.push(`${table}: ${records.length} filas; ${inserted} nuevas, ${updated} cambiadas, ${records.length - inserted - updated} iguales.`);
    }
    for (const table of ORDER.filter((t) => removals.some((r) => r.table === t)).reverse()) {
      const ids = removals.filter((r) => r.table === table).map((r) => r.id);
      const gone = await db`delete from ${db(table)} where id = any(${ids}::uuid[]) and ${db(OWNER[table])} = ${owner} returning id`;
      out.push(`${table}: ${ids.length} filas para borrar; ${gone.length} borradas, ${ids.length - gone.length} ya no estaban.`);
    }
    // A check: everything went in; now it is undone, and nothing stays.
    if (dryRun) throw new DryRun(out);
    return out;
  }).catch((error: unknown) => {
    if (error instanceof DryRun) return error.lines;
    throw error;
  });
  for (const line of lines) console.log(line);
  console.log(dryRun ? `Prueba en la cuenta de ${email}: todo entró y se deshizo; no queda nada.` : `En la cuenta de ${email}.`);
} finally {
  await sql.end();
}
