/**
 * Batch 18 (2026-10-19): your lab's tasting sheets, as the legacy of «Catas» (V3-60, V3-66), into
 * YOUR ACCOUNT. Batch 8 kept in lab_evaluations.sheet only the path of each sheet
 * («diario/cata-x.md»); this one brings the text of the sheets that were filled in, and takes out the
 * rows of the blank ones. The user, 2026-10-19: «puedes buscar las fichas de v3 estaran en la repo /
 * puedes borrar las fichas del banco» (en blanco), after «las fichas en blanco de laboratorio se pueden
 * borrar el nuevo formato en el que se guarde la app lo sustituira».
 *
 * A sheet is filled when the lab marked it tasted («catado…») or when its opening (t0) holds text
 * that is not the template's. A blank sheet whose row keeps a smelling tip or a reading stays, without
 * the path. The lab is only read (CLAUDE.md); its files are not touched. Approved with
 * `aprobar.ts --cuenta`, loaded with `cargar-laboratorio.ts <your email> --tanda=18-fichas-de-cata`.
 *
 *   node migracion-v3/tanda-18-fichas-de-cata.ts
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";

const LAB = "../Perfumery";
const DIARY = join(LAB, "diario");
const OUT = "migracion-v3/tandas/18-fichas-de-cata";
type Rec = Record<string, Cell>;

const commit = execFileSync("git", ["-C", LAB, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
const rows = parseCsvRecords(readFileSync("migracion-v3/tandas/8-tu-version/lab_evaluations.csv", "utf8")) as Rec[];

/** The lines of a sheet's opening (t0), between its heading and the next rule or heading. */
function openingLines(text: string): string[] {
  const m = /^# t0[^\n]*\n([\s\S]*?)(?=\n---|\n# )/m.exec(text);
  return m ? m[1].split("\n").map((l) => l.trim()).filter((l) => l !== "") : [];
}

// The template's lines: those that most sheets share. What is left in a sheet's opening is yours.
const counts = new Map<string, number>();
const files = readdirSync(DIARY).filter((f) => /^cata-.*\.md$/.test(f));
for (const f of files) for (const l of new Set(openingLines(readFileSync(join(DIARY, f), "utf8")))) counts.set(l, (counts.get(l) ?? 0) + 1);
const template = new Set([...counts].filter(([, n]) => n >= files.length / 2).map(([l]) => l));
const written = (text: string) => openingLines(text).filter((l) => !template.has(l)).join(" ").replace(/^>\s*/g, "").trim();

const kept: Rec[] = [];
const removed: Rec[] = [];
const report: string[] = [];
for (const r of rows) {
  const path = String(r.sheet ?? "");
  const file = join(DIARY, basename(path));
  const text = path && existsSync(file) ? readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;
  const tasted = /^catado/i.test(String(r.status ?? ""));
  const opening = text ? written(text) : "";
  const filled = text !== null && (tasted || opening.length >= 3);
  const why = tasted ? `marcada «${r.status}»` : `apertura escrita (${opening.length} caracteres)`;
  if (filled) {
    kept.push({ ...r, sheet: text });
    report.push(`| ${basename(path)} | se trae | ${why} |`);
  } else if (String(r.smelling_tip ?? "").trim() || String(r.reading ?? "").trim()) {
    kept.push({ ...r, sheet: null });
    report.push(`| ${basename(path)} | en blanco: se queda la fila, sin la ruta | guarda una pista o una lectura |`);
  } else {
    removed.push({ table: "lab_evaluations", id: r.id });
    if (opening) report.push(`| ${basename(path)} | en blanco: se borra la fila | su apertura solo dice «${opening}» |`);
  }
}

writeTable(join(OUT, "lab_evaluations.csv"), ["id", "user_id", "material_id", "status", "smelling_tip", "reading", "sheet"], kept);
writeTable(join(OUT, "borrar.csv"), ["table", "id"], removed);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 18: tus fichas de cata, como legado de «Catas»

Del laboratorio (\`../Perfumery/diario\`, commit \`${commit}\`), solo leído. La tanda 8 guardó de cada ficha su ruta; esta trae el
texto de las rellenas y quita las filas de las fichas en blanco (V3-66). Los archivos del laboratorio no se tocan.

- **Se traen ${kept.filter((r) => r.sheet).length} fichas rellenas**, con su texto entero en \`lab_evaluations.sheet\`.
- **Se quedan ${kept.filter((r) => !r.sheet).length} filas en blanco** porque guardan una pista o una lectura; sin la ruta.
- **Se borran ${removed.length} filas** de fichas en blanco (\`borrar.csv\`): solo de tu cuenta.

| Ficha | Qué pasa | Por qué |
|---|---|---|
${report.join("\n")}

Las demás, en blanco y sin pista ni lectura, se borran sin más.
`,
  "utf8",
);
console.log(`${kept.filter((r) => r.sheet).length} fichas se traen, ${kept.filter((r) => !r.sheet).length} filas se quedan sin ruta, ${removed.length} se borran.`);
