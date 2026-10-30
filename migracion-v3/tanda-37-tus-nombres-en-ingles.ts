/**
 * Batch 37 (2026-10-30): into YOUR ACCOUNT, never into the common data. The names of your versions
 * that were a copy of the common name, in English as the common one is since batch 36 (V3-71). A
 * version takes the common name when it is made, and then it was Spanish. The user, 2026-10-30, on
 * the card «¿Paso al inglés los nombres de tus versiones que copian el nombre común?»: «Sí, esos» (V3-88).
 *
 * What it reads: the common materials before batch 36 (v3/datos/materials.csv at the BASE of
 * migracion-v3/ingles/extraer.ts) and as batch 36 left them (migracion-v3/tandas/36-ingles/); and,
 * only for the report, your versions as your batches wrote them.
 *
 * What it writes: cambiar.csv, one row per common material that batch 36 renamed, with no id: each
 * version of yours (a material based on another) still named exactly the old name takes the new
 * one, and keeps the old one among its other names, so that search still finds it. A version you
 * renamed, or a material whose name you wrote, stays as it is; so do your notes, labels and
 * descriptions (V3-71: your account is yours). And one row with id: the bottle whose diluent says
 * «no consta» (batch 25) says «unstated solvent» (the session's proposal), if it still says so.
 * Approved with `aprobar.ts --cuenta`, loaded with
 * `cargar-laboratorio.ts <your email> --nube --tanda=37-tus-nombres-en-ingles`.
 *
 *   node migracion-v3/tanda-37-tus-nombres-en-ingles.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { BASE, show } from "./ingles/extraer.ts";

const OUT = "migracion-v3/tandas/37-tus-nombres-en-ingles";
const TANDAS = "migracion-v3/tandas";
const ANSWER = "el usuario, 2026-10-30, en la tarjeta «¿Paso al inglés los nombres de tus versiones que copian el nombre común?»: «Sí, esos»";
/** Batch 25's bottle «de fábrica, al 10 %», whose factory solvent nobody states (its description says so). */
const UNSTATED = { id: "1e4abe54-d61b-5761-97de-4a12a4555bcd", before: "no consta", after: "unstated solvent" };

const common = (text: string) => new Map(parseCsvRecords(text).filter((r) => !r.owner_id).map((r) => [r.id, r.name]));
const before = common(show("v3/datos/materials.csv"));
const after = common(readFileSync(join(TANDAS, "36-ingles", "materials.csv"), "utf8"));
const rules = [...before]
  .filter(([id, name]) => after.has(id) && after.get(id) !== name)
  .map(([id, name]) => ({ before: name, after: after.get(id)! }))
  .sort((a, b) => a.before.localeCompare(b.before, "es") || a.after.localeCompare(b.after, "es"));
for (const r of rules) {
  const others = rules.filter((o) => o.before === r.before && o.after !== r.after);
  if (others.length > 0) throw new Error(`«${r.before}» pasaría a dos nombres: «${r.after}» y «${others[0].after}».`);
  if (rules.some((o) => o.before === r.after)) throw new Error(`«${r.after}» es a la vez nombre nuevo y antiguo: el orden cambiaría el resultado.`);
}
const unique = rules.filter((r, i) => rules.findIndex((o) => o.before === r.before) === i);

// Your versions as your batches left them, for the report: the batches approved that are not common
// (v3/datos/tandas.csv lists the common ones; 1 to 4 were common too, «retirada-1-a-4»), in order,
// each row taking the columns a later batch writes.
const commonBatches = new Set(parseCsvRecords(readFileSync("v3/datos/tandas.csv", "utf8")).map((r) => r.tanda));
const yours = [...new Set(parseCsvRecords(readFileSync(join(TANDAS, "aprobadas.csv"), "utf8")).map((r) => r.tanda))]
  .filter((t) => /^\d+-/.test(t) && !commonBatches.has(t) && Number.parseInt(t) > 4 && existsSync(join(TANDAS, t, "materials.csv")))
  .sort((a, b) => Number.parseInt(a) - Number.parseInt(b));
const mine = new Map<string, Record<string, string>>();
for (const t of yours) {
  for (const row of parseCsvRecords(readFileSync(join(TANDAS, t, "materials.csv"), "utf8"))) mine.set(row.id, { ...mine.get(row.id), ...row });
}
const versions = [...mine.values()].filter((m) => m.based_on_id);
const hits = (name: string) => versions.filter((m) => m.name === name).length;

const rows: Record<string, Cell>[] = [
  ...unique.map((r) => ({ table: "materials", id: "", column: "name", before: r.before, after: r.after })),
  { table: "lab_dilutions", id: UNSTATED.id, column: "solvent", before: UNSTATED.before, after: UNSTATED.after },
];
writeTable(join(OUT, "cambiar.csv"), ["table", "id", "column", "before", "after"], rows);

const known = unique.filter((r) => hits(r.before) > 0);
writeFileSync(
  join(OUT, "informe.md"),
  [
    "# Tanda 37 · Tus nombres, en inglés donde copiaban el común",
    "",
    `*Generada por \`migracion-v3/tanda-37-tus-nombres-en-ingles.ts\`. De tu cuenta: se aprueba con \`--cuenta\` y se carga con \`cargar-laboratorio.ts <correo> --nube --tanda=37-tus-nombres-en-ingles\`. Sin aprobar.*`,
    "",
    `${ANSWER}.`,
    "",
    "Una versión toma el nombre del común al crearse, y entonces era español. La tanda 36 pasó al inglés",
    `${unique.length} nombres comunes; cada versión tuya que **aún se llama exactamente** como el común antiguo`,
    "toma el nombre nuevo, y el español queda entre sus otros nombres, para que el buscador la siga",
    "encontrando. Valen las que vinieron en tus tandas y las que creaste en la app.",
    "",
    "No cambia nada más: una versión que renombraste se queda como la dejaste, y tus notas, etiquetas",
    "y descripciones siguen como están (V3-71).",
    "",
    `## Las que se sabe que cambian (${known.reduce((n, r) => n + hits(r.before), 0)}, según tus tandas)`,
    "",
    "| Ahora | Pasa a | Tuyas |",
    "|---|---|---|",
    ...known.map((r) => `| ${r.before} | ${r.after} | ${hits(r.before)} |`),
    "",
    `Las que creaste en la app no están en el repositorio: la carga dice cuántas cambian de verdad. Los otros`,
    `${unique.length - known.length} nombres comunes que cambiaron también se miran, por si tienes una versión suya.`,
    "",
    "## El frasco con el diluyente «no consta»",
    "",
    `Tu frasco «de fábrica, al 10 %» (tanda 25) tiene escrito como diluyente «${UNSTATED.before}»: el fabricante no dice cuál`,
    `es. Pasa a «${UNSTATED.after}» (propuesta de la sesión), solo si aún dice «${UNSTATED.before}».`,
    "",
    `Fuente de los nombres: v3/datos/materials.csv en ${BASE} (antes de la tanda 36) y migracion-v3/tandas/36-ingles/materials.csv.`,
    "",
  ].join("\n"),
  "utf8",
);
console.log(`${unique.length} nombres; ${known.length} con versiones tuyas conocidas (${known.reduce((n, r) => n + hits(r.before), 0)}); 1 frasco.`);
