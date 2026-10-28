/**
 * Batches 30 and 31 (2026-10-28): your two wormwoods are two species. The user: «el ajenjo de
 * perfumiarz es significativamente diferente del de maese»; to where the line between another
 * material and another specification goes, «Por identidad (Recomendada)»: another species, part,
 * process, treatment or declared chemotype is another material of the glossary; another supplier,
 * origin or lot is another specification of yours; the category only groups them in the search.
 *
 * Maese Lab's only «ajenjo» is «Aceite Esencial de Artemisa Annua - 100% Natural» (Artemisia annua,
 * «Ajenjo Dulce o Chino»), not the Artemisia absinthium of Perfumiarz (PCW «Absinthe Essence»).
 *
 * - Batch 30, common: the new material, with what Maese Lab's page says, quoted, in the wormwood's
 *   category (which gains «ajenjo dulce» as another name); its four named components without a figure.
 *   It builds on batch 29's components (approve 29 first).
 * - Batch 31, your account: your Maese Lab specification of it, with «I have it», and bottle nº 17 of
 *   batch 24 («Ajenjo AE», 10 %) moved to it: the same row and id, another material.
 *
 * No IFRA figure: Artemisia annua has no standard and no annex line in IFRA's files by its CAS.
 *
 *   node migracion-v3/tanda-30-artemisa-annua.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = "3674ea0";
const OUT_COMMON = "migracion-v3/tandas/30-artemisa-annua";
const OUT_ACCOUNT = "migracion-v3/tandas/31-tu-artemisa-annua";
const URL = "https://maeselab.com/aceite-esencial-de-artemisa-annua-100-natural/";
const DECISION = "el usuario, 2026-10-28: «Por identidad (Recomendada)» (otra especie, otro material del glosario)";
type Rec = Record<string, Cell>;

const show = (path: string) => execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const table = (text: string) => ({ header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] });
const materials = table(show("v3/datos/materials.csv"));
const categories = table(show("v3/datos/material_categories.csv"));
const components = table(readFileSync("migracion-v3/tandas/29-documentos-comun/material_components.csv", "utf8"));
const yours24 = table(show("migracion-v3/tandas/24-tus-altas-26-oct/materials.csv"));
const dilutions24 = table(show("migracion-v3/tandas/24-tus-altas-26-oct/lab_dilutions.csv"));

const wormwood = materials.rows.find((m) => !m.owner_id && m.name === "Ajenjo, aceite esencial");
if (!wormwood) throw new Error("no está el ajenjo común");
const say = (phrase: string) => `Maese Lab, ${URL}: «${phrase}»`;

// Batch 30: the new common material.
const annuaId = uuidFor("comun:tanda30:artemisa-annua");
const annua: Rec = {
  ...Object.fromEntries(materials.header.map((h) => [h, null])),
  id: annuaId,
  owner_id: null,
  name: "Artemisa annua (ajenjo dulce), aceite esencial",
  kind: "natural",
  solvent: false,
  aliases: ["Ajenjo dulce", "Ajenjo chino", "Artemisia annua herb oil", "Aceite Esencial de Artemisa Annua"],
  other_cas: [],
  disputed_fields: [],
  cas: "84775-74-6",
  species: "Artemisia annua",
  part: "hoja",
  process: "arrastre de vapor",
  inci: "Artemisia Annua Herb Oil",
  form: "aceite esencial",
  category_id: wormwood.category_id,
  notes: `Otra especie que el ajenjo (Artemisia absinthium): ${DECISION}. ${say("también conocida como Ajenjo Dulce o Chino")}. ${say("tiene un aroma dulce y herbal")}. La ficha da como origen «ESPAÑA»: es de ese producto, no del material (va a tu especificación).`,
  sources: [say("Tipo / Nombre: ARTEMISA ANNUA"), say("Método de Obtención: Arrastre de Vapor"), say("Parte Utilizada: Hoja"), say("INCI: Artemisia Annua Herb Oil"), say("Nº CAS: 84775-74-6")].join(" · "),
};
const NOTE = "No confundir con la artemisa annua (ajenjo dulce) de Maese Lab, otra especie y otro material (tanda 30).";
const newMaterials = materials.rows.map((m) => (m.id === wormwood.id && !String(m.notes ?? "").includes(NOTE) ? { ...m, notes: `${m.notes ? `${m.notes}\n` : ""}${NOTE}` } : m));
newMaterials.push(annua);

const newCategories = categories.rows.map((c) => {
  if (c.id !== wormwood.category_id) return c;
  const aliases = JSON.parse(String(c.aliases || "[]")) as string[];
  return { ...c, aliases: [...new Set([...aliases, "ajenjo dulce", "artemisa annua"])] };
});

const named = ["Camphor", "1,8-Cineol", "D-Germacrene", "a-Humulene"];
const newComponents: Rec[] = named.map((name) => ({
  id: uuidFor(`comp:v3:tanda30:${annuaId}:${name}`),
  material_id: annuaId,
  owner_id: null,
  component_id: null,
  component_cas: null,
  component_name: name,
  amount_kind: "unknown",
  value: null,
  min: null,
  max: null,
  authority: "literature",
  source: say("Componentes / Quimiotipo: Camphor, 1,8-Cineol, D-Germacrene, a-Humulene"),
}));

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT_COMMON, "materials.csv"), materials.header, asCells(newMaterials));
writeTable(join(OUT_COMMON, "material_categories.csv"), categories.header, asCells(newCategories));
writeTable(join(OUT_COMMON, "material_components.csv"), components.header, asCells([...components.rows, ...newComponents]));

// Batch 31: your specification of it, and bottle nº 17 moved to it.
const versionId = uuidFor(`tuya:tanda31:${annuaId}`);
const version: Rec = {
  ...Object.fromEntries(yours24.header.map((h) => [h, null])),
  id: versionId,
  owner_id: null,
  name: "Artemisa annua (ajenjo dulce), aceite esencial",
  kind: "natural",
  solvent: false,
  aliases: [],
  other_cas: [],
  disputed_fields: [],
  category_id: wormwood.category_id,
  based_on_id: annuaId,
  supplier: "Maese Lab",
  product: "Aceite Esencial de Artemisa Annua - 100% Natural",
  product_url: URL,
  sources: `${DECISION}; el bote del 2026-10-26 que tu hoja llama «Ajenjo AE» (diluciones-26-oct.xlsx, fila 17). Origen según la tienda: ${say("Origen: ESPAÑA")}`,
};
const bottle = dilutions24.rows.find((d) => String(d.description).includes("fila 17") && String(d.label) === "al 10 %");
if (!bottle) throw new Error("no está el frasco nº 17 de la tanda 24");
const moved: Rec = { ...bottle, material_id: versionId, description: `${bottle.description} Movido el 2026-10-28 a tu artemisa annua de Maese Lab: es otra especie, sin tuyona (tanda 31).` };
writeTable(join(OUT_ACCOUNT, "materials.csv"), yours24.header, asCells([version]));
writeTable(join(OUT_ACCOUNT, "lab_materials.csv"), ["id", "user_id", "material_id"], [{ id: uuidFor(`tengo:tanda31:${versionId}`), user_id: null, material_id: versionId }]);
writeTable(join(OUT_ACCOUNT, "lab_dilutions.csv"), dilutions24.header, asCells([moved]));

writeFileSync(
  join(OUT_COMMON, "informe.md"),
  `# Tanda 30 · La artemisa annua (ajenjo dulce), otro material

*Generada por \`migracion-v3/tanda-30-artemisa-annua.ts\` sobre \`${BASE}\` y los componentes de la tanda 29 (**apruébala después de la 29**). Escribe \`v3/datos/materials.csv\`, \`material_categories.csv\` y \`material_components.csv\` enteros. Sin aprobar.*

**Por qué:** ${DECISION}. Tu ajenjo de Perfumiarz es *Artemisia absinthium* (PCW «Absinthe Essence»: tuyona 60 %, beta-cariofileno 10 %, tope de 2,33 % en cat. 4); el de Maese Lab, según la única ficha de su web, es *Artemisia annua*.

| Campo | Valor | De dónde |
|---|---|---|
| Nombre | ${annua.name} | propuesta de la sesión |
| Especie | Artemisia annua | ${say("Tipo / Nombre: ARTEMISA ANNUA")} |
| Parte | hoja | ${say("Parte Utilizada: Hoja")} |
| Proceso | arrastre de vapor | ${say("Método de Obtención: Arrastre de Vapor")} |
| CAS | 84775-74-6 | ${say("Nº CAS: 84775-74-6")} |
| INCI | Artemisia Annua Herb Oil | ${say("INCI: Artemisia Annua Herb Oil")} |
| Componentes | ${named.join(", ")}, sin cifra | ${say("Componentes / Quimiotipo: Camphor, 1,8-Cineol, D-Germacrene, a-Humulene")} |
| Categoría | la del ajenjo, que gana «ajenjo dulce» y «artemisa annua» como otros nombres | ${DECISION} |

**IFRA:** *Artemisia annua* no tiene estándar ni línea del anexo por su CAS en los archivos de IFRA: la app lo dirá («sin estándar»), sin tuyona. Al ajenjo común se le añade la nota «${NOTE}»
`,
  "utf8",
);
writeFileSync(
  join(OUT_ACCOUNT, "informe.md"),
  `# Tanda 31 · Tu artemisa annua de Maese Lab y el frasco nº 17

*Generada por \`migracion-v3/tanda-30-artemisa-annua.ts\`. De tu cuenta: se aprueba con \`--cuenta\` y se carga con \`cargar-laboratorio.ts <correo> --tanda=31-tu-artemisa-annua\` **después de cargar la tanda 30**. Sin aprobar.*

**Antes de aprobarla:** confirma en la etiqueta o la factura que tu bote de Maese Lab es «Artemisa Annua». Si dice otra cosa, no se aprueba.

- **Tu especificación** de la artemisa annua: Maese Lab, «${version.product}», con «lo tengo».
- **El frasco nº 17** («Ajenjo AE», al 10 %, pesado el 2026-10-26): la misma fila (\`${bottle.id}\`), con sus pesos, pasa de tu ajenjo de Perfumiarz a esta especificación. Es un cambio sobre lo ya cargado: la carga lo actualiza por su id.
`,
  "utf8",
);
console.log(`Tanda 30: 1 material, 1 categoría con otros nombres, ${newComponents.length} componentes. Tanda 31: 1 especificación, el frasco ${bottle.id} movido.`);
