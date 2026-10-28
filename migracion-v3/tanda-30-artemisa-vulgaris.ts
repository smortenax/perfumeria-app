/**
 * Batches 30 and 31 (2026-10-28): your two wormwoods are two species. The user: «el ajenjo de
 * perfumiarz es significativamente diferente del de maese»; to where the line between another
 * material and another specification goes, «Por identidad (Recomendada)»: another species, part,
 * process, treatment or declared chemotype is another material of the glossary; another supplier,
 * origin or lot is another specification of yours.
 *
 * The user read the Maese Lab bottle: «artemisa vulgaris oil». It is Maese Lab's «Aceite Esencial de
 * Artemisa - 100% Natural» (INCI Artemisia Vulgaris Oil, CAS 84775-45-1), not the Artemisia
 * absinthium of Perfumiarz (PCW «Absinthe Essence»). The glossary already has that species
 * («Artemisa (Artemisia vulgaris), aceite esencial», with its IFRA annex lines), so no material is
 * created: the Artemisia annua of an earlier draft is dropped (the user: «Quitarla (Recomendada)»).
 *
 * - Batch 30, common: a note on each of the two materials so that they are not confused.
 * - Batch 31, your account: your Maese Lab specification of the Artemisia vulgaris, with «I have it»
 *   and the four components its page names (no figure), and bottle nº 17 of batch 24 («Ajenjo AE»,
 *   10 %) moved to it: the same row and id, another material.
 *
 *   node migracion-v3/tanda-30-artemisa-vulgaris.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = "8f5c97c";
const OUT_COMMON = "migracion-v3/tandas/30-artemisa-vulgaris";
const OUT_ACCOUNT = "migracion-v3/tandas/31-tu-artemisa-vulgaris";
const URL = "https://maeselab.com/aceite-esencial-de-artemisa-100-natural/";
const LABEL = "el usuario, 2026-10-28, leyendo la etiqueta del bote: «artemisa vulgaris oil»";
const DECISION = "el usuario, 2026-10-28: «Por identidad (Recomendada)» (otra especie, otro material del glosario)";
type Rec = Record<string, Cell>;

const show = (path: string) => execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const table = (text: string) => ({ header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] });
const materials = table(show("v3/datos/materials.csv"));
const components = table(show("v3/datos/material_components.csv"));
const yours24 = table(show("migracion-v3/tandas/24-tus-altas-26-oct/materials.csv"));
const dilutions24 = table(show("migracion-v3/tandas/24-tus-altas-26-oct/lab_dilutions.csv"));

const wormwood = materials.rows.find((m) => !m.owner_id && m.name === "Ajenjo, aceite esencial");
const mugwort = materials.rows.find((m) => !m.owner_id && m.name === "Artemisa (Artemisia vulgaris), aceite esencial");
if (!wormwood || !mugwort) throw new Error("no está el ajenjo o la artemisa común");
const say = (phrase: string) => `Maese Lab, ${URL}: «${phrase}»`;

// Batch 30: a note on each material.
const notes = new Map([
  [wormwood.id, "No confundir con la artemisa (Artemisia vulgaris), otra especie y otro material: el bote de Maese Lab que la hoja del 2026-10-26 llama «Ajenjo AE» es esa (tanda 30)."],
  [mugwort.id, "No confundir con el ajenjo (Artemisia absinthium), otra especie y otro material: el «Ajenjo AE» de Maese Lab de la hoja del 2026-10-26 es esta artemisa (tanda 30)."],
]);
const newMaterials = materials.rows.map((m) => {
  const note = notes.get(m.id);
  return note && !String(m.notes ?? "").includes(note) ? { ...m, notes: `${m.notes ? `${m.notes}\n` : ""}${note}` } : m;
});

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT_COMMON, "materials.csv"), materials.header, asCells(newMaterials));

// Batch 31: your specification of it, its named components, and bottle nº 17 moved to it.
const versionId = uuidFor(`tuya:tanda31:${mugwort.id}:maese`);
const version: Rec = {
  ...Object.fromEntries(yours24.header.map((h) => [h, null])),
  id: versionId,
  owner_id: null,
  name: "Artemisa (Artemisia vulgaris), aceite esencial",
  kind: "natural",
  solvent: false,
  aliases: [],
  other_cas: [],
  disputed_fields: [],
  category_id: mugwort.category_id,
  based_on_id: mugwort.id,
  supplier: "Maese Lab",
  product: "Aceite Esencial de Artemisa - 100% Natural",
  product_url: URL,
  sources: [
    LABEL,
    "el bote del 2026-10-26 que tu hoja llama «Ajenjo AE» (diluciones-26-oct.xlsx, fila 17)",
    say("INCI: Artemisia Vulgaris Oil"),
    say("Nº CAS: 84775-45-1"),
    say("Parte Utilizada: Planta"),
    say("Método de Obtención: Arrastre de Vapor"),
    `origen según la tienda: ${say("Origen: FRANCIA")}`,
  ].join(" · "),
};
const named = ["a-Thujene", "Lyratol", "1,8-Cineol", "Camphor"];
const versionComponents: Rec[] = named.map((name) => ({
  id: uuidFor(`comp:v3:tanda31:${versionId}:${name}`),
  material_id: versionId,
  owner_id: null,
  component_id: null,
  component_cas: null,
  component_name: name,
  amount_kind: "unknown",
  value: null,
  min: null,
  max: null,
  authority: "literature",
  source: say("Componentes / Quimiotipo: a-Thujene, Lyratol, 1,8-Cineol, Camphor"),
}));
const bottle = dilutions24.rows.find((d) => String(d.description).includes("fila 17") && String(d.label) === "al 10 %");
if (!bottle) throw new Error("no está el frasco nº 17 de la tanda 24");
const moved: Rec = { ...bottle, material_id: versionId, description: `${bottle.description} Movido el 2026-10-28 a tu artemisa (Artemisia vulgaris) de Maese Lab: es otra especie que el ajenjo (tanda 31).` };
writeTable(join(OUT_ACCOUNT, "materials.csv"), yours24.header, asCells([version]));
writeTable(join(OUT_ACCOUNT, "lab_materials.csv"), ["id", "user_id", "material_id"], [{ id: uuidFor(`tengo:tanda31:${versionId}`), user_id: null, material_id: versionId }]);
writeTable(join(OUT_ACCOUNT, "material_components.csv"), components.header, asCells(versionComponents));
writeTable(join(OUT_ACCOUNT, "lab_dilutions.csv"), dilutions24.header, asCells([moved]));

writeFileSync(
  join(OUT_COMMON, "informe.md"),
  `# Tanda 30 · El ajenjo y la artemisa, dos materiales que no se confunden

*Generada por \`migracion-v3/tanda-30-artemisa-vulgaris.ts\` sobre \`${BASE}\` (las tandas 27 a 29 aprobadas). Escribe \`v3/datos/materials.csv\` entero. Sin aprobar.*

**Por qué:** ${DECISION}. Tu ajenjo de Perfumiarz es *Artemisia absinthium* (PCW «Absinthe Essence»: tuyona 60 %, tope de 2,33 % en cat. 4); el de Maese Lab es *Artemisia vulgaris* (${LABEL}), que el glosario ya tiene: «${mugwort.name}». No se crea ningún material; la artemisa annua del borrador anterior se quita (el usuario: «Quitarla (Recomendada)»).

| Material | Nota que se le añade |
|---|---|
${[wormwood, mugwort].map((m) => `| ${m.name} | ${notes.get(m.id)} |`).join("\n")}
`,
  "utf8",
);
writeFileSync(
  join(OUT_ACCOUNT, "informe.md"),
  `# Tanda 31 · Tu artemisa de Maese Lab y el frasco nº 17

*Generada por \`migracion-v3/tanda-30-artemisa-vulgaris.ts\`. De tu cuenta: se aprueba con \`--cuenta\` y se carga con \`cargar-laboratorio.ts <correo> --tanda=31-tu-artemisa-vulgaris\`. Sin aprobar.*

- **Tu especificación** de «${mugwort.name}»: Maese Lab, «${version.product}», con «lo tengo». De dónde: ${LABEL}; la ficha de Maese Lab (${URL}) da INCI Artemisia Vulgaris Oil, CAS 84775-45-1, planta, arrastre de vapor, origen FRANCIA.
- **Sus componentes**, sin cifra: ${named.join(", ")} (${say("Componentes / Quimiotipo: a-Thujene, Lyratol, 1,8-Cineol, Camphor")}).
- **IFRA:** lo pone el material común, por su línea del anexo (Armoise vulgaris oil: tuyonas, geraniol y eugenol). Sin certificado de Maese Lab, sigue siendo cifra de IFRA, no de tu lote.
- **El frasco nº 17** («Ajenjo AE», al 10 %, pesado el 2026-10-26): la misma fila (\`${bottle.id}\`), con sus pesos, pasa de tu ajenjo de Perfumiarz a esta especificación. Es un cambio sobre lo ya cargado: la carga lo actualiza por su id.
`,
  "utf8",
);
console.log(`Tanda 30: notas en 2 materiales. Tanda 31: 1 especificación, ${versionComponents.length} componentes, el frasco ${bottle.id} movido.`);
