/**
 * Tanda 60: los 44 comunes que la tanda 57 dio de alta a medias, con lo que ya tienen y lo que les falta.
 *   node migracion-v3/web/info-18-nov/lista.ts   → lista.csv
 */
import { readFileSync } from "node:fs";
import { parseCsvRecords } from "../../../src/data/csv.ts";
import { writeTable } from "../../lib/csv.ts";
import { uuidFor } from "../../lib/ids.ts";

const materials = parseCsvRecords(readFileSync("v3/datos/materials.csv", "utf8")) as Record<string, string>[];
const fichas = parseCsvRecords(readFileSync("migracion-v3/web/perfumiarz-pedido-18-nov/fichas.csv", "utf8")) as Record<string, string>[];
const byId = new Map(materials.map((m) => [m.id, m]));
const FIELDS = ["family", "tier", "tenacity_hours", "strength", "impact", "physical_state", "house", "cas"];
const rows = [{ n: "maese-461", id: uuidFor("comun:tanda57:maese:461"), url: "https://maeselab.com/" }, ...fichas.map((f) => ({ n: f.n, id: uuidFor(`comun:tanda57:perfumiarz:${f.n}`), url: f.url }))]
  .filter((r) => byId.has(r.id))
  .map((r) => {
    const m = byId.get(r.id)!;
    return { n: r.n, id: r.id, nombre: m.name, tipo: m.kind, cas: m.cas, casa: m.house, especie: m.species, url: r.url, faltan: FIELDS.filter((f) => !m[f]).join(" ") };
  });
writeTable("migracion-v3/web/info-18-nov/lista.csv", ["n", "id", "nombre", "tipo", "cas", "casa", "especie", "url", "faltan"], rows);
console.log(`${rows.length} comunes`);
