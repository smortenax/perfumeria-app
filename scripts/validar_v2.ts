/**
 * `npm run validar:v2`: validates datos/v2/ against the schema and the rules of
 * datos/v2/LEEME.md. Prints the count by rule and the first issues; the full list goes
 * to datos/v2/validacion.txt. Exits with 1 when there is any error (warnings do not).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { loadDataset } from "../src/v2/load.ts";
import type { Issue } from "../src/v2/model.ts";
import { validate } from "../src/v2/validate.ts";

const SHOWN = 30;

const dir = process.argv[2] ?? "datos/v2";
const readOrNull = (path: string): string | null => (existsSync(path) ? readFileSync(path, "utf8") : null);
const column = (path: string, name: string): Set<string> =>
  new Set(parseCsvRecords(readFileSync(path, "utf8")).map((r) => r[name]));

const { dataset, issues: loadIssues } = loadDataset((file) => readOrNull(join(dir, file)));
const issues: Issue[] = [
  ...loadIssues,
  ...validate(dataset, {
    ifraStandards: column("datos/ifra/51/estandares.csv", "estandar"),
    v1Ids: column("datos/glosario/materiales.csv", "id"),
  }),
];

const line = (i: Issue) => `${i.severity}\t${i.rule}\t${i.file}:${i.line}\t${i.message}`;
const errors = issues.filter((i) => i.severity === "error");
const warnings = issues.filter((i) => i.severity === "aviso");

const byRule = new Map<string, number>();
for (const i of issues) {
  const key = `${i.severity} ${i.rule}`;
  byRule.set(key, (byRule.get(key) ?? 0) + 1);
}

writeFileSync(join(dir, "validacion.txt"), issues.map(line).join("\n") + (issues.length ? "\n" : ""));

console.log(`${dir}: ${errors.length} errores, ${warnings.length} avisos.`);
for (const [key, count] of [...byRule].sort()) {
  console.log(`  ${key}: ${count}`);
}
const shown = [...errors, ...warnings].slice(0, SHOWN);
if (shown.length > 0) {
  console.log(`\nPrimeros ${shown.length} (todos en ${join(dir, "validacion.txt")}):`);
  shown.forEach((i) => console.log(line(i)));
}
process.exit(errors.length > 0 ? 1 : 0);
