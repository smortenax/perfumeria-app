/**
 * Loads batch 10, your formulas (plan v3, step 7.5; V3-15), into your account: never into the
 * common data. Only what you approved (migracion-v3/tandas/aprobadas.csv, 10-formulas); one
 * transaction, so a refused row leaves nothing half loaded. Run again, it changes no row: an event
 * is never changed (it is only added), so one that is there is left as it is.
 *
 * The order is what the foreign keys and the triggers need: workbenches; formulas, mothers before
 * their versions; your new provisionals; then the events, formula by formula in the order of their
 * ids, and each frozen accord (V3-49) right after the event it was frozen at, before any event that
 * uses it.
 *
 *   node migracion-v3/cargar-formulas.ts <the email of your account>
 *   node migracion-v3/cargar-formulas.ts <email> --prueba        (loads and undoes it: a check)
 *   node migracion-v3/cargar-formulas.ts <email> --rehacer       (a batch made again: see below)
 *
 * --rehacer: an event is never changed (it is only added), so a batch whose events point at other
 * materials cannot be loaded over the one before. It first takes out of your account what batch 10
 * put there (its workbenches, formulas and their events, its frozen accords and its provisionals,
 * known by their ids and their source «tus fórmulas (…)»), then loads it whole: in one transaction,
 * with the foreign keys between them set aside only for that deletion (they point at each other).
 * Nothing you made in the app is touched.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";

const postgres = createRequire(join(process.cwd(), "v3/package.json"))("postgres");
const BATCH = "10-formulas";
const FOLDER = `migracion-v3/tandas/${BATCH}`;
const email = process.argv[2];
const dryRun = process.argv.includes("--prueba");
const redo = process.argv.includes("--rehacer");
if (!email) {
  console.error("Uso: node migracion-v3/cargar-formulas.ts <el correo de tu cuenta> [--prueba]");
  process.exit(1);
}
const FILES = ["workbenches", "formulas", "materials", "formula_events"] as const;
const LISTS: Readonly<Record<string, readonly string[]>> = { formulas: ["markers"], materials: ["aliases", "other_cas", "disputed_fields"] };
const BOOLEANS: Readonly<Record<string, readonly string[]>> = { materials: ["solvent"] };

const approved = parseCsvRecords(readFileSync("migracion-v3/tandas/aprobadas.csv", "utf8")).filter((r) => r.tanda === BATCH);
type Row = Record<string, string>;
const tables = Object.fromEntries(
  FILES.map((table) => {
    const text = readFileSync(join(FOLDER, `${table}.csv`), "utf8");
    const hash = createHash("sha256").update(text, "utf8").digest("hex");
    if (!dryRun && approved.filter((r) => r.archivo === `${table}.csv`).at(-1)?.sha256 !== hash) {
      throw new Error(`${FOLDER}/${table}.csv no es el que aprobaste (aprobadas.csv): no se carga nada.`);
    }
    return [table, { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Row[] }];
  }),
) as Record<(typeof FILES)[number], { header: string[]; rows: Row[] }>;

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
    const counts = new Map<string, { inserted: number; same: number }>();
    const put = async (table: (typeof FILES)[number], row: Row) => {
      const { header } = tables[table];
      const value = (c: string) => {
        if (c === "owner_id") return owner;
        const v = row[c] ?? "";
        // A formula's intention is text, never unknown (P23): an empty cell is an empty text.
        if (v === "") return (LISTS[table] ?? []).includes(c) ? [] : table === "formulas" && c === "intention" ? "" : null;
        if ((LISTS[table] ?? []).includes(c)) return JSON.parse(v);
        if ((BOOLEANS[table] ?? []).includes(c)) return v === "true";
        return v;
      };
      const record = Object.fromEntries(header.map((c) => [c, value(c)]));
      const [theirs] = await db`select owner_id from ${db(table)} where id = ${record.id}`;
      if (theirs && theirs.owner_id !== owner) throw new Error(`${table}: la fila ${record.id} es común o de otra cuenta.`);
      const changing = header.filter((c) => c !== "id");
      const result =
        table === "formula_events"
          ? await db`insert into ${db(table)} ${db([record], header)} on conflict (id) do nothing returning id`
          : await db`insert into ${db(table)} ${db([record], header)} on conflict (id) do update set ${db.unsafe(changing.map((c) => `"${c}" = excluded."${c}"`).join(", "))}
              where (${db.unsafe(changing.map((c) => `"${table}"."${c}"`).join(", "))}) is distinct from (${db.unsafe(changing.map((c) => `excluded."${c}"`).join(", "))})
              returning (xmax = 0) as inserted`;
      const at = counts.get(table) ?? { inserted: 0, same: 0 };
      if (result.length && (table === "formula_events" || result[0].inserted)) at.inserted++;
      else at.same++;
      counts.set(table, at);
    };

    if (redo) {
      // What batch 10 put in your account: by the ids of this batch and by the source of its materials.
      const formulaIds = tables.formulas.rows.map((f) => f.id);
      const benchIds = tables.workbenches.rows.map((w) => w.id);
      await db`set local session_replication_role = replica`;
      const gone = {
        events: (await db`delete from formula_events where owner_id = ${owner} and formula_id = any(${formulaIds}::uuid[]) returning id`).length,
        materials: (await db`delete from materials where owner_id = ${owner} and (kind = 'frozen' or kind = 'provisional') and sources like 'tus fórmulas (%' returning id`).length,
        formulas: (await db`delete from formulas where owner_id = ${owner} and id = any(${formulaIds}::uuid[]) returning id`).length,
        benches: (await db`delete from workbenches where owner_id = ${owner} and id = any(${benchIds}::uuid[]) and id not in (select workbench_id from formulas) returning id`).length,
      };
      await db`set local session_replication_role = origin`;
      counts.set("rehecho", { inserted: 0, same: 0 });
      console.log(`Rehacer: quitados ${gone.events} eventos, ${gone.formulas} fórmulas, ${gone.benches} bancos y ${gone.materials} materiales de la tanda 10.`);
    }
    for (const row of tables.workbenches.rows) await put("workbenches", row);
    // Mothers before their versions.
    const pending = [...tables.formulas.rows];
    const loaded = new Set<string>();
    while (pending.length) {
      const i = pending.findIndex((f) => !f.parent_id || loaded.has(f.parent_id));
      if (i < 0) throw new Error("formulas.csv: una versión cuya madre no está en la tanda");
      const [f] = pending.splice(i, 1);
      await put("formulas", f);
      loaded.add(f.id);
    }
    const frozen = tables.materials.rows.filter((m) => m.kind === "frozen");
    for (const m of tables.materials.rows.filter((m) => m.kind !== "frozen")) await put("materials", m);
    // Events and frozen accords, in the order their references need.
    const waiting = new Set(frozen.map((m) => m.id));
    const queues = new Map<string, Row[]>();
    for (const e of [...tables.formula_events.rows].sort((a, b) => (a.id < b.id ? -1 : 1))) queues.set(e.formula_id, [...(queues.get(e.formula_id) ?? []), e]);
    const doneEvents = new Set<string>();
    for (let progress = true; progress; ) {
      progress = false;
      for (const m of frozen) {
        if (waiting.has(m.id) && doneEvents.has(m.source_event_id)) {
          await put("materials", m);
          waiting.delete(m.id);
          progress = true;
        }
      }
      for (const queue of queues.values()) {
        while (queue.length && ![queue[0].material_id, queue[0].diluent_id, queue[0].second_diluent_id].some((id) => id && waiting.has(id))) {
          const e = queue.shift()!;
          await put("formula_events", e);
          doneEvents.add(e.id);
          progress = true;
        }
      }
    }
    const left = [...queues.values()].reduce((n, q) => n + q.length, 0);
    if (left || waiting.size) throw new Error(`Quedan ${left} eventos y ${waiting.size} acordes sin poder cargar: un ciclo entre acordes.`);
    const out = FILES.map((t) => `${t}: ${tables[t].rows.length} filas; ${counts.get(t)?.inserted ?? 0} nuevas, ${counts.get(t)?.same ?? 0} iguales.`);
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
