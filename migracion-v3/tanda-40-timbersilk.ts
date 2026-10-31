/**
 * Batch 40 (2026-10-31), your account: Timbersilk from Maese Lab, as your version of Iso E Super.
 * The user, 2026-10-31: «el timbersilk venia en esta compra tambien tambien falta para el alta
 * entonces».
 *
 * Timbersilk has Iso E Super's CAS (54464-57-2) and is the same material with another balance of
 * isomers (Fraterworks), so it is not a new common material: it is your specification of the common
 * Iso E Super, with its own product, and IFRA reads it by that CAS. With «I have it», taken as sold.
 *
 *   node migracion-v3/tanda-40-timbersilk.ts
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = "00215cf";
const OUT = "migracion-v3/tandas/40-tu-timbersilk";
const SAID = "the user, 2026-10-31: «el timbersilk venia en esta compra tambien tambien falta para el alta entonces»";
const MAESE = "https://maeselab.com/timbersilk/";
const FW = "https://fraterworks.com/products/timbersilk";
type Rec = Record<string, Cell>;

const text = execSync(`git show ${BASE}:v3/datos/materials.csv`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const header = text.slice(0, text.indexOf("\n")).split(",");
const iso = (parseCsvRecords(text) as Rec[]).find((m) => !m.owner_id && m.name === "Iso E Super" && m.cas === "54464-57-2");
if (!iso) throw new Error("Iso E Super is not in the common data");

const version: Rec = {
  ...Object.fromEntries(header.map((h) => [h, null])),
  id: uuidFor(`tuya:tanda40:timbersilk:${iso.id}`),
  owner_id: null,
  name: "Timbersilk",
  kind: "molecule",
  solvent: false,
  aliases: [],
  other_cas: [],
  disputed_fields: [],
  category_id: iso.category_id,
  based_on_id: iso.id,
  supplier: "Maese Lab",
  product: "TIMBERSILK",
  product_url: MAESE,
  purity: "1",
  notes: [
    `Maese Lab, ${MAESE}: «Nº CAS: 54464-57-2», «INCI: TETRAMETHYL ACETYLOCTAHYDRONAPHTHALENES», «Cuero, melaza, ambar».`,
    `Fraterworks, ${FW}: «effectively the same material» as Iso E Super, with «a different balance of isomers»: Arborone 8.5 % and Iso Gamma 13.5 % (Iso E Super, 4.8 % and 11.7 %), and 0.07 % AmberXtreme. Of Fraterworks' product (IFF), not checked for Maese Lab's.`,
  ].join("\n"),
  sources: `${SAID}. Maese Lab, ${MAESE}: «PUREZA 100%»`,
};

const asCells = (r: Rec) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v]));
writeTable(join(OUT, "materials.csv"), header, [asCells(version)]);
writeTable(join(OUT, "lab_materials.csv"), ["id", "user_id", "material_id"], [{ id: uuidFor(`tengo:tanda40:${version.id}`), user_id: null, material_id: version.id }]);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 40 · Tu Timbersilk de Maese Lab

*Generada por \`migracion-v3/tanda-40-timbersilk.ts\`. De tu cuenta: se aprueba con \`--cuenta\` y se carga con \`cargar-laboratorio.ts <correo> --nube --tanda=40-tu-timbersilk\`, después de las tandas 38 y 39. Sin aprobar.*

${SAID}.

- **Qué es:** tu versión del Iso E Super común, con «lo tengo», de Maese Lab («TIMBERSILK», pureza 100 %). Mismo CAS (54464-57-2): IFRA lo lee como Iso E Super (estándar 68, 20 % en la categoría 4).
- **Por qué no es un material común aparte:** Fraterworks lo llama «effectively the same material»; cambia el reparto de isómeros (más Arborone e Iso Gamma) y lleva un 0,07 % de Amber Xtreme. Va en las notas, como dato de Fraterworks, no comprobado en el de Maese.
- **Sin frasco:** si lo diluyes, el frasco se añade en Diluciones.
`,
  "utf8",
);
console.log("Tanda 40: 1 especificación (Timbersilk) con «lo tengo».");
