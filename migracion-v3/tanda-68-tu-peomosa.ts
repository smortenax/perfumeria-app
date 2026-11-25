/**
 * Batch 68 (2026-11-25): into YOUR ACCOUNT, never into the common data. Your Peomosa, from Maese Lab.
 * The user, 2026-11-25: «pon peomosa en mi inventario que falta», for the dilutions of that day
 * (diluciones-25-nov, «Peomosa (Maese Lab)», 10 ml at 20 % in alcohol, from the pure).
 *
 * - One version of yours (V3-5) on the common Peomosa (2-(2-methylphenyl)ethanol, IFF; Maese Lab sells it,
 *   batch 56): supplier Maese Lab, its page; «lo tengo». No weights: no stock (V3-37).
 * - Pure: the sheet weighs it from 100 %, and Maese Lab's page does not sell it diluted. No factory bottle.
 * Approved with `aprobar.ts --cuenta`, loaded with
 * `cargar-laboratorio.ts <your email> --nube --tanda=68-tu-peomosa`.
 *
 *   node migracion-v3/tanda-68-tu-peomosa.ts
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const TANDA = "68";
const OUT = "migracion-v3/tandas/68-tu-peomosa";
const SAID = "el usuario, 2026-11-25: «pon peomosa en mi inventario que falta»";
const PEOMOSA = "73e6dbba-5ab2-57b2-97e4-1735af005ddd";
type Rec = Record<string, Cell>;
const BASE = process.env.BASE ?? execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const materialsText = execSync(`git show ${BASE}:v3/datos/materials.csv`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const header = materialsText.slice(0, materialsText.indexOf("\n")).split(",");
const c = (parseCsvRecords(materialsText) as Rec[]).find((m) => m.id === PEOMOSA && !m.owner_id);
if (!c || !/peomosa/i.test(String(c.sources))) throw new Error(`${PEOMOSA}: no es el Peomosa común de ${BASE}`);

const id = uuidFor(`tuya:tanda${TANDA}:peomosa`);
const version: Rec = {
  ...Object.fromEntries(header.map((h) => [h, null])),
  id, owner_id: null, name: "Peomosa (Maese Lab)", kind: c.kind, solvent: false, aliases: [], other_cas: [], disputed_fields: [],
  category_id: c.category_id, based_on_id: c.id, supplier: "Maese Lab", product: "Peomosa", product_url: "https://maeselab.com/peomosa/",
  notes: "Bought from Maese Lab (no stock is kept: V3-37). Weighed from the pure in the dilutions of 2026-11-25.",
  sources: `${SAID}. The product: Maese Lab, https://maeselab.com/peomosa/ (the common material's own source).`,
};
mkdirSync(OUT, { recursive: true });
writeTable(join(OUT, "materials.csv"), header, [version]);
writeTable(join(OUT, "lab_materials.csv"), ["id", "user_id", "material_id"], [{ id: uuidFor(`tengo:tanda${TANDA}:${id}`), user_id: null, material_id: id }]);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 68 · Tu Peomosa (Maese Lab), en tu cuenta

*Generada por \`migracion-v3/tanda-68-tu-peomosa.ts\` sobre lo común de \`${BASE}\`. De tu cuenta: se aprueba con \`--cuenta\` y se carga desde tu PC con \`cargar-laboratorio.ts <correo> --nube --tanda=68-tu-peomosa\`.*

**Por qué:** ${SAID}. La hoja de diluciones del 25-nov la pesa desde el puro (10 ml al 20 % en alcohol) y no estaba entre tus materiales.

**Qué:** una versión tuya, «Peomosa (Maese Lab)», sobre el Peomosa común (2-(2-metilfenil)etanol, IFF; tanda 56: Maese Lab lo vende), con proveedor Maese Lab, su página y «lo tengo». Pura: sin frasco de fábrica. Sin pesos (no se lleva stock).
`,
  "utf8",
);
console.log(`Tanda ${TANDA}: 1 versión, 1 «lo tengo».`);
