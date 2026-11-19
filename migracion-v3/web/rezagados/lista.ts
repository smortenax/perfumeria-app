/**
 * Tanda 61: los rezagados de migracion-v3/fichas-incompletas/ (materiales que tienes con huecos), los que
 * más huecos tienen que se llenan en lo común (CAS, familia, fabricante, dosis, duración, fuerza,
 * descriptores). Producto y documentos son de tu bote: no salen de la web.
 *   node migracion-v3/web/rezagados/lista.ts [cuántos]   → lista.csv
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../../../src/data/csv.ts";
import { writeTable } from "../../lib/csv.ts";

type Row = Record<string, string>;
const read = (p: string): Row[] => (existsSync(p) ? (parseCsvRecords(readFileSync(p, "utf8")) as Row[]) : []);
const ACCOUNT = ["8-tu-version", "17-tus-nuevos", "24-tus-altas-26-oct", "28-documentos-tus-botes", "31-tu-artemisa-vulgaris", "33-tus-altas-maese-28-oct", "37-tus-nombres-en-ingles", "39-tus-altas-maese-30-oct", "40-timbersilk", "53-tu-ambar-gris"];
const materials = new Map(read("v3/datos/materials.csv").map((m) => [m.id, m]));
const commonIds = new Set(materials.keys());
for (const b of ACCOUNT) for (const m of read(join("migracion-v3/tandas", b, "materials.csv"))) if (!commonIds.has(m.id)) materials.set(m.id, { ...(materials.get(m.id) ?? {}), ...m });
const common = (id: string) => {
  for (let m = materials.get(id), i = 0; m && i < 10; m = m.based_on_id ? materials.get(m.based_on_id) : undefined, i++) if (commonIds.has(m.id)) return m;
  return undefined;
};
const GAPS = ["cas", "family", "house", "doses", "tenacity", "strength", "descriptors"];
const rows = read("migracion-v3/fichas-incompletas/fichas-incompletas.csv")
  .map((r) => ({ r, c: common(r.material_id), gaps: GAPS.filter((g) => r[`lacks_${g}`] === "yes") }))
  .filter((x) => x.c && x.gaps.length)
  .sort((a, b) => b.gaps.length - a.gaps.length || a.r.name.localeCompare(b.r.name))
  .slice(0, Number(process.argv[2] ?? 9))
  .map(({ r, c, gaps }, i) => ({ n: `r${i + 1}`, id: c!.id, version_id: r.material_id, nombre: c!.name, tipo: c!.kind, cas: c!.cas || materials.get(r.material_id)?.cas || "", casa: c!.house || materials.get(r.material_id)?.house || "", especie: c!.species, proveedor: r.supplier, faltan: gaps.join(" ") }));
writeTable("migracion-v3/web/rezagados/lista.csv", ["n", "id", "version_id", "nombre", "tipo", "cas", "casa", "especie", "proveedor", "faltan"], rows.map((r) => ({ ...r, id: r.id })));
console.log(rows.map((r) => `${r.n} ${r.nombre} | ${r.tipo} | ${r.cas || "—"} | ${r.proveedor} | ${r.faltan}`).join("\n"));
