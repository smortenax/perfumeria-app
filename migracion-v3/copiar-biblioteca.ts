/**
 * Plan v3, step 7.4: a copy of your library of formulas in the project, read from your computer
 * with your permission (2026-10-14, «tienes permiso, sigue con el 7.4»). The library is only read:
 * nothing is written there. The copies go to migracion-v3/biblioteca/archivos/, which Git ignores
 * (they are your formulas); the manifest (path, bytes, SHA-256) is kept, so the import of step 7.5
 * says which files it read. Run again, it copies what changed and the manifest says so.
 *
 *   node migracion-v3/copiar-biblioteca.ts                      (Documentos\Perfumería\Fórmulas)
 *   BIBLIOTECA_DIR=… node migracion-v3/copiar-biblioteca.ts     (another folder)
 */
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";
import { type Cell, writeTable } from "./lib/csv.ts";

const SOURCE = process.env.BIBLIOTECA_DIR ?? join(homedir(), "Documents", "Perfumería", "Fórmulas");
const OUT = "migracion-v3/biblioteca";

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
}

const rows: Array<Record<string, Cell>> = [];
for (const path of files(SOURCE).sort()) {
  const rel = relative(SOURCE, path).split("\\").join("/");
  const bytes = readFileSync(path);
  const target = join(OUT, "archivos", rel);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(path, target);
  rows.push({ id: rel, carpeta: rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "", bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), modificado: statSync(path).mtime.toISOString() });
}
writeTable(join(OUT, "manifiesto.csv"), ["id", "carpeta", "bytes", "sha256", "modificado"], rows);
console.log(`${rows.length} archivos de ${SOURCE} copiados a ${OUT}/archivos/; manifiesto en ${OUT}/manifiesto.csv.`);
