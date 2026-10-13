/**
 * Passes an approved batch to v3/datos/ (V3-21): nothing reaches the v3 without the user's
 * approval. Copies the batch's CSV files and writes down the approval, in
 * migracion-v3/tandas/aprobadas.csv and in v3/datos/tandas.csv (which travels with the data, as
 * their audit trail): the batch, the date, the user's words and each file's hash.
 * Run only after the user has said yes in the chat.
 *
 *   node migracion-v3/aprobar.ts 1-materiales "el usuario: «…»"
 */
import { createHash } from "node:crypto";
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [batch, approval] = process.argv.slice(2);
if (!batch || !approval) {
  console.error('Uso: node migracion-v3/aprobar.ts <tanda> "<quién y con qué palabras la aprobó>"');
  process.exit(1);
}
const from = join("migracion-v3/tandas", batch);
const files = existsSync(from) ? readdirSync(from).filter((f) => f.endsWith(".csv")).sort() : [];
if (files.length === 0) {
  console.error(`La tanda ${batch} no tiene CSV en ${from}.`);
  process.exit(1);
}
mkdirSync("v3/datos", { recursive: true });
const logs = ["migracion-v3/tandas/aprobadas.csv", "v3/datos/tandas.csv"];
for (const log of logs) if (!existsSync(log)) writeFileSync(log, "tanda,fecha,aprobacion,archivo,sha256\n", "utf8");
const date = new Date().toISOString().slice(0, 10);
const quote = (t: string) => `"${t.replace(/"/g, '""')}"`;
for (const file of files) {
  const hash = createHash("sha256").update(readFileSync(join(from, file))).digest("hex");
  copyFileSync(join(from, file), join("v3/datos", file));
  for (const log of logs) appendFileSync(log, `${batch},${date},${quote(approval)},${file},${hash}\n`, "utf8");
  console.log(`v3/datos/${file} ← ${from}/${file}`);
}
