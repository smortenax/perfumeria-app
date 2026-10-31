/**
 * Batch 40 (2026-10-31): into YOUR ACCOUNT, never into the common data. The Timbersilk you bought
 * from Maese Lab with the nine of batch 39. The user, 2026-10-31: «el timbersilk venia en esta compra
 * tambien tambien falta para el alta entonces».
 *
 * Timbersilk (IFF) is OTNE, the molecule of Iso E Super, with the same CAS and another ratio of its
 * isomers; the common data already has it as an alias of Iso E Super. So it is not a new common
 * material: it is your specification of Iso E Super, as Maese Lab sells it, with «I have it», beside
 * the Iso E Super you already have. No bottle: if you dilute it, it is added in Diluciones.
 * Approved with `aprobar.ts --cuenta`, loaded with
 * `cargar-laboratorio.ts <your email> --nube --tanda=40-timbersilk`, after batch 39.
 *
 *   node migracion-v3/tanda-40-timbersilk.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/40-timbersilk";
const SAID = "the user, 2026-10-31: «el timbersilk venia en esta compra tambien tambien falta para el alta entonces»";
const URL = "https://maeselab.com/timbersilk/";
type Rec = Record<string, Cell>;

const text = readFileSync("v3/datos/materials.csv", "utf8");
const header = text.slice(0, text.indexOf("\n")).split(",");
const iso = parseCsvRecords(text).find((m) => m.name === "Iso E Super" && !m.owner_id);
if (!iso) throw new Error("Iso E Super no está en lo común (v3/datos/materials.csv)");

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
  house: "IFF",
  product: "Timbersilk",
  product_url: URL,
  purity: "1",
  notes:
    "OTNE, like Iso E Super, with another ratio of its isomers: Fraterworks, https://fraterworks.com/products/timbersilk, calls it a variant of Iso E Super with more of its high-impact isomers.",
  sources: `${SAID}. Maese Lab, ${URL}: «PUREZA 100%»`,
};
writeTable(join(OUT, "materials.csv"), header, [version]);
writeTable(join(OUT, "lab_materials.csv"), ["id", "user_id", "material_id"], [{ id: uuidFor(`tengo:tanda40:${version.id}`), user_id: null, material_id: version.id }]);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 40 · Tu Timbersilk, en tu cuenta

*Generada por \`migracion-v3/tanda-40-timbersilk.ts\`. De tu cuenta: se aprueba con \`--cuenta\` y se carga con \`cargar-laboratorio.ts <correo> --nube --tanda=40-timbersilk\`, después de la 39.*

${SAID}.

| Tu especificación | Basada en | Tienda | Producto | Pureza |
|---|---|---|---|---|
| Timbersilk | Iso E Super (común) | Maese Lab | [Timbersilk](${URL}) | 100 % («PUREZA 100%») |

Con «lo tengo» y sin frasco. No es un material común nuevo: el Timbersilk es OTNE, la molécula del Iso E Super, con otra proporción de isómeros, y lo común ya lo tiene como sinónimo del Iso E Super. Va junto a tu Iso E Super, que no cambia.
`,
  "utf8",
);
console.log(`Tanda 40: 1 especificación (Timbersilk, sobre Iso E Super ${iso.id}) con «lo tengo». ${OUT}/informe.md`);
