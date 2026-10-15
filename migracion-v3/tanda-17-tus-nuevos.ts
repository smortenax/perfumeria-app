/**
 * Batch 17 (2026-10-16): your version of each material of batches 13 and 16, as batch 8 gave you one
 * of each of your lab's (V3-5, V3-36), into YOUR ACCOUNT, never into the common data, and «lo tengo»
 * on it. The user: «creo que falta dar de alta los de harrison … cuando he descargado el md de los
 * materiales no figuraba». The shop is Harrison Joseph, the user's word for that order; the cistus
 * absolute that came in it is a second bottle of your Láudano de jara (same species and process;
 * the origin does not make a natural another one), with its origin. Nothing else is said of them:
 * what the bottle's documents say is yours to add (V3-39). Approved with `aprobar.ts --cuenta`,
 * loaded with `cargar-laboratorio.ts <your email> --tanda=17-tus-nuevos`.
 *
 *   node migracion-v3/tanda-17-tus-nuevos.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/17-tus-nuevos";
const SHOP = "Harrison Joseph";
const SAID = "el usuario, 2026-10-16: «creo que falta dar de alta los de harrison»";
type Rec = Record<string, Cell>;
const text = readFileSync("v3/datos/materials.csv", "utf8");
const header = text.slice(0, text.indexOf("\n")).split(",");
const common = (parseCsvRecords(text) as Rec[]).filter((m) => m.owner_id === "" || m.owner_id === null);

const newOnes = common.filter((m) => /tanda (13|16)/.test(String(m.notes ?? "")));
if (newOnes.length !== 12) throw new Error(`Se esperaban los 12 de las tandas 13 y 16; hay ${newOnes.length}`);
const labdanum = common.filter((m) => m.name === "Láudano de jara");
if (labdanum.length !== 1) throw new Error(`«Láudano de jara»: ${labdanum.length} comunes`);

const version = (base: Rec, extra: Rec = {}): Rec => ({
  ...Object.fromEntries(header.map((c) => [c, null])),
  id: uuidFor(`tuya:tanda17:${base.id}`),
  owner_id: null,
  name: base.name,
  kind: base.kind,
  solvent: false,
  aliases: [],
  other_cas: [],
  disputed_fields: [],
  based_on_id: base.id,
  category_id: base.category_id,
  supplier: SHOP,
  sources: SAID,
  ...extra,
});
const materials: Rec[] = [
  ...newOnes.map((m) => version(m)),
  version(labdanum[0], {
    origin: "Marruecos",
    notes: "Cistus ladaniferus absolute, de Marruecos: llegó en el pedido de Harrison Joseph. Tu segundo frasco de Láudano de jara (V3-5).",
  }),
].sort((a, b) => String(a.name).localeCompare(String(b.name), "es"));
const have: Rec[] = materials.map((m) => ({ id: uuidFor(`tengo:tanda17:${m.id}`), user_id: null, material_id: m.id }));

writeTable(join(OUT, "materials.csv"), header, materials);
writeTable(join(OUT, "lab_materials.csv"), ["id", "user_id", "material_id"], have);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 17 · Tus versiones de los materiales nuevos, en tu cuenta

*Generada por \`migracion-v3/tanda-17-tus-nuevos.ts\` (2026-10-16). ${SAID}. Como la tanda 8: una versión tuya de cada uno, basada en su común, y «lo tengo». Va a tu cuenta, no a lo común.*

| Tu versión | Basada en | Tienda | Origen |
|---|---|---|---|
${materials.map((m) => `| ${m.name} | común | ${m.supplier} | ${m.origin ?? ""} |`).join("\n")}

- **Tienda:** Harrison Joseph para todos, por tu mensaje; si alguno vino de otra tienda, se cambia en su editor.
- **El cistus** es un segundo frasco de tu Láudano de jara (ya tienes el del laboratorio), con origen Marruecos. El 50 % en TEC no se apunta: la dilución se elige en el banco.
- Nada más: lo que digan los documentos de cada frasco (certificado, ficha del producto) lo añades tú en su editor (V3-39).

Con esto salen en Propios y en «Copiar paleta»: ${materials.length} materiales más.
`,
  "utf8",
);
console.log(`Tanda 17: ${materials.length} versiones tuyas y ${have.length} «lo tengo». ${OUT}/informe.md`);
