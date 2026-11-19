/**
 * The list of batch 61 (2026-11-19): what to read on the web, material by material. The user, 2026-11-19:
 * «si sigue con la 2 y acepta las dosis de otras referencias». Two parts:
 * - the rezagados: the materials you have whose common sheet still lacks a field (fichas-incompletas.csv),
 *   leaving out what does not apply (the CAS of a base, which is a mixture; the house of a generic molecule
 *   bought from a shop that names none: Maese Lab or Olfatorium);
 * - the dose of the 45 materials of batches 57 and 60 that still have none.
 * It only reads; it writes lista.csv for the reading brief (encargo.md).
 *
 *   node migracion-v3/web/info-61/lista.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../../../src/data/csv.ts";
import { writeTable } from "../../lib/csv.ts";

type Row = Record<string, string>;
const read = (p: string): Row[] => (existsSync(p) ? parseCsvRecords(readFileSync(p, "utf8")) : []);
const common = new Map(read("v3/datos/materials.csv").map((m) => [m.id, m]));
const doses = new Set(read("v3/datos/material_doses.csv").map((d) => d.material_id));
const ACCOUNT = ["8-tu-version", "17-tus-nuevos", "24-tus-altas-26-oct", "31-tu-artemisa-vulgaris", "33-tus-altas-maese-28-oct", "39-tus-altas-maese-30-oct", "40-timbersilk", "58-tus-altas-maese-18-nov"];
const mine = new Map<string, Row>();
for (const t of ACCOUNT) for (const m of read(join("migracion-v3/tandas", t, "materials.csv"))) mine.set(m.id, m);
const root = (id: string) => {
  let m = mine.get(id) ?? common.get(id);
  for (let i = 0; m && !common.has(m.id) && m.based_on_id && i < 10; i++) m = mine.get(m.based_on_id) ?? common.get(m.based_on_id);
  return m && common.has(m.id) ? common.get(m.id)! : null;
};
// The doses batch 60 already read with a figure and a literal phrase: batch 61 turns them into doses, no need to read again.
const idOf60 = new Map(read("migracion-v3/web/info-18-nov/lista.csv").map((r) => [r.n, r.id]));
const doseRead = new Set(
  [0, 1, 2, 3, 4]
    .flatMap((i) => read(`migracion-v3/web/info-18-nov/web-60-0${i}.csv`))
    .filter((r) => r.campo === "dosis" && /\d/.test(r.valor) && !/reconstruida/.test(r.nota))
    .map((r) => (r.n.startsWith("maese-") ? "" : idOf60.get(r.n) ?? "")),
);
const GENERIC_SHOPS = /Maese Lab|Olfatorium/;
const rows: Record<string, string>[] = [];
const seen = new Set<string>();
for (const r of read("migracion-v3/fichas-incompletas/fichas-incompletas.csv")) {
  const c = root(r.material_id);
  if (!c || seen.has(c.id)) continue;
  const want = [
    r.lacks_cas === "yes" && c.kind !== "composition" ? "cas" : "",
    r.lacks_species === "yes" ? "especie" : "",
    r.lacks_family === "yes" ? "familia" : "",
    r.lacks_house === "yes" && !GENERIC_SHOPS.test(r.supplier) ? "casa" : "",
    r.lacks_doses === "yes" ? "dosis" : "",
    r.lacks_tenacity === "yes" ? "horas" : "",
    r.lacks_strength === "yes" ? "fuerza" : "",
    r.lacks_descriptors === "yes" ? "olor" : "",
  ].filter(Boolean);
  if (want.length === 0) continue;
  seen.add(c.id);
  const v = mine.get(r.material_id);
  rows.push({ material_id: c.id, nombre: c.name, tipo: c.kind, forma: c.form, cas: c.cas, especie: c.species, proveedor: r.supplier, producto: v?.product ?? "", url_producto: v?.product_url ?? "", buscar: want.join(" "), parte: "rezagado" });
}
for (const t of ["57-altas-18-nov", "60-info-altas-18-nov"]) {
  for (const m of read(join("migracion-v3/tandas", t, "materials.csv"))) {
    if (m.owner_id || !/batch 57|batch 60/.test(m.notes ?? "") || seen.has(m.id) || doses.has(m.id) || doseRead.has(m.id)) continue;
    const c = common.get(m.id);
    if (!c) continue;
    seen.add(m.id);
    const url = (c.sources.match(/Perfumiarz sells it: «[^»]*», (https:\/\/\S+)/) ?? c.sources.match(/(https:\/\/perfumiarz\.pl\/products\/[^\s:]+)/) ?? c.sources.match(/(https:\/\/maeselab\.com\/[^\s:]+)/) ?? ["", ""])[1];
    rows.push({ material_id: c.id, nombre: c.name, tipo: c.kind, forma: c.form, cas: c.cas, especie: c.species, proveedor: url.includes("maese") ? "Maese Lab" : "Perfumiarz", producto: "", url_producto: url, buscar: "dosis", parte: "dosis 57-60" });
  }
}
rows.forEach((r, i) => (r.n = String(i + 1)));
writeTable("migracion-v3/web/info-61/lista.csv", ["n", "material_id", "nombre", "tipo", "forma", "cas", "especie", "proveedor", "producto", "url_producto", "buscar", "parte"], rows);
console.log(`${rows.length} materiales: ${rows.filter((r) => r.parte === "rezagado").length} rezagados, ${rows.filter((r) => r.parte !== "rezagado").length} solo dosis.`);
