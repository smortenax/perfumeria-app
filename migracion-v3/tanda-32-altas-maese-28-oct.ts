/**
 * Batches 32 and 33 (2026-10-28): three Maese Lab materials that were in no list, so that the user can
 * formulate with them today. The user: «los dos nuevos son schinus molle oil, juniperus comunis fruit
 * oil, ambos de maese, tambien hyraceum de maese, no lo usare hoy pero aun asi puedes ponerlo ya, al
 * menos los dos que usare si necesitaria la ficha basica con fuerza y limitaciones sobretodo».
 *
 * - Batch 32, common: the three materials with what Maese Lab's pages say, quoted, and their strength,
 *   usual use and descriptors from TGSC, Scentspiracy, PerfumersWorld and Fraterworks. Each in a
 *   category of its own (V3-13). IFRA reads each CAS from its layer (V3-35): the two oils are in IFRA's
 *   annex (their constituents), the hyraceum has no standard. A figure of another shop's product is a
 *   hint in the notes, never a limit (P37).
 * - Batch 33, your account: your Maese Lab specification of each, with «I have it». Taken as pure, as
 *   Maese Lab sells them: no bottle.
 *
 * What the pages read on 2026-10-28 say is quoted; «propuesta de la sesión» (the name, the family, two
 * strengths) is a reading, to be checked before approving. Made from the common data as main has it at
 * BASE: a batch approved on another branch first means redoing this one (as batch 26 was over 23).
 *
 *   node migracion-v3/tanda-32-altas-maese-28-oct.ts
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = "1a785dc";
const OUT_COMMON = "migracion-v3/tandas/32-altas-maese-28-oct";
const OUT_ACCOUNT = "migracion-v3/tandas/33-tus-altas-maese-28-oct";
const SAID =
  "el usuario, 2026-10-28: «los dos nuevos son schinus molle oil, juniperus comunis fruit oil, ambos de maese, tambien hyraceum de maese, no lo usare hoy pero aun asi puedes ponerlo ya»";
type Rec = Record<string, Cell>;

const show = (path: string) => execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const table = (path: string) => {
  const text = show(path);
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = table("v3/datos/materials.csv");
const categories = table("v3/datos/material_categories.csv");
const descriptors = table("v3/datos/material_descriptors.csv");
const doses = table("v3/datos/material_doses.csv");
const annex = table("v3/datos/ifra_annex.csv").rows;
const substances = table("v3/datos/ifra_substances.csv").rows;

const MAESE = {
  pepper: "https://maeselab.com/aceite-esencial-de-aguaribay-o-pimienta-rosa-100-natural/",
  juniper: "https://maeselab.com/aceite-esencial-de-enebro-100-natural/",
  hyraceum: "https://maeselab.com/abs-hyraceum-piedra-de-africa/",
};
const TGSC = {
  pepper: "https://www.thegoodscentscompany.com/data/es1034621.html",
  juniperTerpeneless: "https://www.thegoodscentscompany.com/data/tl1057391.html",
  hyraceum: "https://www.thegoodscentscompany.com/data/ab1015541.html",
};
const SCENTSPIRACY_JUNIPER = "https://www.scentspiracy.com/fragrance-ingredients/p/juniperberriesoil";
const PW_JUNIPER = "https://www.perfumersworld.com/view.php?pro_id=7KH00262";
const FW = { juniper: "https://fraterworks.com/products/juniper-berry", hyraceum: "https://fraterworks.com/products/hyraceum-signature-absolute" };
const maese = (url: string, phrase: string) => `Maese Lab, ${url}: «${phrase}»`;
const web = (site: string, url: string, phrase: string) => `web: ${site}, ${url}: «${phrase}»`;
const proposal = (why: string) => `propuesta de la sesión: ${why}`;

type Dose = { min?: string; typical?: string; max?: string; site: string; url: string; said: string };
type Descriptor = { source: string; text: string };
type New = {
  key: string;
  record: Rec;
  /** Why each value is there, for the report: field, value, where from. */
  why: Array<[string, string, string]>;
  doses: Dose[];
  descriptors: Descriptor[];
  shop: { product: string; url: string; origin: string; originSaid: string; purity?: string };
};

const fresh: New[] = [
  {
    key: "pimienta-rosa",
    record: {
      name: "Pimienta rosa (Schinus molle), aceite esencial",
      kind: "natural",
      aliases: ["Aguaribay", "Schinus molle oil", "Pink pepper oil", "Pepper tree berry oil", "Aceite Esencial de Aguaribay o Pimienta Rosa"],
      cas: "68917-52-2",
      other_cas: ["94334-31-3"],
      species: "Schinus molle",
      part: "fruto",
      process: "arrastre de vapor",
      inci: "Schinus Molle Oil",
      form: "aceite esencial",
      synthesis: "natural",
      family: "spicy",
      strength: "medium",
      strength_source: `${web("TGSC", TGSC.pepper, "Odor Strength:medium")}, por la tanda 32`,
      tenacity_hours: "147",
      tenacity_source: web("TGSC", TGSC.pepper, "Substantivity:147 hour(s) at 100.00 %"),
      confidence: "high",
      notes: [
        "Alta del 2026-10-28 (tanda 32), con la ficha de Maese Lab y TGSC.",
        `${maese(MAESE.pepper, "Componentes / Quimiotipo: b-Myrcene, a-Phellandrene, b-Phellandrene, Limonene")}, sin cifras.`,
        `${maese(MAESE.pepper, "Su fragancia seca, penetrante y duradera lo posiciona como una excelente nota de base")}.`,
        `TGSC, ${TGSC.pepper}: «Pink pepper (Schinus molle) is of no relation to green, black or white pepper oils (Piper nigrum).»`,
        "IFRA: sin estándar por su CAS; está en el anexo de IFRA 51 («Schinus molle oil», Schinus areira L.) con acetato de citronelilo 0,14 %, farnesol 0,03 %, geraniol 0,1 % y citronelol 0,02 %. Con esas cifras ninguno lo limita por sí solo en la categoría 4 (cálculo de la sesión); sí suman con lo que lleve el resto de la fórmula.",
      ].join("\n"),
    },
    why: [
      ["Nombre", "Pimienta rosa (Schinus molle), aceite esencial", proposal("como los aceites de lo común; «Aguaribay o Pimienta Rosa» queda como otro nombre")],
      ["Especie", "Schinus molle", maese(MAESE.pepper, "INCI: Schinus Molle Oil")],
      ["Parte", "fruto", maese(MAESE.pepper, "Parte Utilizada: Fruto")],
      ["Proceso", "arrastre de vapor", maese(MAESE.pepper, "Método de Obtención: Arrastre de Vapor")],
      ["CAS", "68917-52-2 y 94334-31-3", maese(MAESE.pepper, "Nº CAS: 68917-52-2 / 94334-31-3")],
      ["Familia", "especiada", proposal(`por TGSC: «peppery woody spicy aromatic juniper mace tropical pine balsamic resinous»`)],
      ["Fuerza", "media", web("TGSC", TGSC.pepper, "Odor Strength:medium")],
      ["Tenacidad", "147 h en tira", web("TGSC", TGSC.pepper, "Substantivity:147 hour(s) at 100.00 %")],
      ["Uso", "hasta el 4 % del concentrado", web("TGSC", TGSC.pepper, "4.0000 % in the fragrance concentrate.")],
    ],
    doses: [{ max: "0.04", site: "TGSC", url: TGSC.pepper, said: "Recommendation for pepper tree berry oil usage levels up to: 4.0000 % in the fragrance concentrate." }],
    descriptors: [
      { source: "TG", text: "TGSC: peppery woody spicy aromatic juniper mace tropical pine balsamic resinous" },
      { source: "web", text: "Maese Lab: aroma herbal y especiado, con notas de pimienta verde que evocan la mejorana" },
    ],
    shop: { product: "Aceite Esencial de Aguaribay o Pimienta Rosa- 100% Natural", url: MAESE.pepper, origin: "Paraguay", originSaid: "Origen: PARAGUAY" },
  },
  {
    key: "enebro-bayas",
    record: {
      name: "Enebro (bayas), aceite esencial",
      kind: "natural",
      aliases: ["Juniper berry oil", "Juniperus communis fruit oil", "Enebro bayas", "Aceite Esencial de Enebro"],
      cas: "8002-68-4",
      other_cas: ["73049-62-4", "84603-69-0"],
      species: "Juniperus communis",
      part: "fruto",
      process: "arrastre de vapor",
      inci: "Juniperus Communis Fruit Oil",
      form: "aceite esencial",
      synthesis: "natural",
      family: "woody",
      strength: "medium",
      strength_source: `${web("Scentspiracy", SCENTSPIRACY_JUNIPER, "Medium to strong; persistent with good tenacity")}, por la tanda 32 (leído como «medium»: propuesta de la sesión)`,
      confidence: "high",
      notes: [
        "Alta del 2026-10-28 (tanda 32), con la ficha de Maese Lab, Scentspiracy, PerfumersWorld y Fraterworks.",
        `${maese(MAESE.juniper, "Componentes / Quimiotipo: a-pinene, b-Myrcene, Sabinene, a-Humulene")}, sin cifras.`,
        `El CAS 73049-62-4, que da Maese Lab, es en TGSC el del aceite sin terpenos (${TGSC.juniperTerpeneless}).`,
        `Tenacidad, sin cifra: las fuentes no coinciden. Fraterworks (${FW.juniper}), de su aceite rectificado: más de 24 h en tira; PerfumersWorld (${PW_JUNIPER}): 3 h en tira.`,
        "IFRA: sin estándar por su CAS; está en el anexo de IFRA 51 («Juniper berry oil», Juniperus communis L.) con geraniol 0,1 %, alfa-cedreno 0,4 %, acetato de citronelilo 0,19 %, beta-tuyona 0,05 % y longifoleno 0,1 %. Con esas cifras ninguno lo limita por sí solo en la categoría 4 (cálculo de la sesión); sí suman con lo que lleve el resto de la fórmula.",
        `Pista, no límite: Fraterworks da para su aceite rectificado (CAS 8012-91-7) un máximo de 18,181 % en el producto acabado en la categoría 4 (${FW.juniper}); es de su producto, no del de Maese Lab.`,
      ].join("\n"),
    },
    why: [
      ["Nombre", "Enebro (bayas), aceite esencial", proposal("para no confundirlo con el aceite de cade, que es otro enebro (Juniperus oxycedrus)")],
      ["Especie", "Juniperus communis", maese(MAESE.juniper, "INCI: Juniperus Communis Fruit Oil")],
      ["Parte", "fruto", maese(MAESE.juniper, "Parte Utilizada: Fruto")],
      ["Proceso", "arrastre de vapor", maese(MAESE.juniper, "Método de Obtención: Arrastre de Vapor")],
      ["CAS", "8002-68-4, 73049-62-4 y 84603-69-0", maese(MAESE.juniper, "Nº CAS: 8002-68-4 / 73049-62-4 / 84603-69-0")],
      ["Familia", "amaderada", proposal(`por Maese Lab: «aroma herbal, balsámico y amaderado»; es una nota de conífera`)],
      ["Fuerza", "media", `${web("Scentspiracy", SCENTSPIRACY_JUNIPER, "Medium to strong; persistent with good tenacity")}; ${proposal("«medium to strong» leído como media")}`],
      ["Uso", "0,05 % a 4 % del concentrado, media 0,5 %", `PerfumersWorld, ${PW_JUNIPER}: uso en compuestos de perfume desde 0,050 %, media 0,500 %, máximo 4,000 %`],
      ["Uso", "mediana 0,3 % en perfumes", `Fraterworks, ${FW.juniper}: mediana 0,3 % en los perfumes que analiza (su aceite rectificado)`],
    ],
    doses: [
      { min: "0.0005", typical: "0.005", max: "0.04", site: "PerfumersWorld", url: PW_JUNIPER, said: "uso típico en compuestos de perfume: desde 0,050 %, media 0,500 %, máximo 4,000 %" },
      { typical: "0.003", site: "Fraterworks", url: FW.juniper, said: "mediana 0,3 % en los perfumes que analiza, de su aceite rectificado (CAS 8012-91-7)" },
    ],
    descriptors: [
      { source: "web", text: "Maese Lab: aroma herbal, balsámico y amaderado, con matices frescos y notas alcanforadas" },
      { source: "web", text: "Fraterworks: fresh, sparkling coniferous aroma with a distinctive gin-like character" },
    ],
    shop: { product: "Aceite Esencial de Enebro - 100% Natural", url: MAESE.juniper, origin: "Hungría", originSaid: "Origen: HUNGRIA" },
  },
  {
    key: "hyraceum",
    record: {
      name: "Hyraceum (piedra de África), absoluto",
      kind: "natural",
      aliases: ["Piedra de África", "Africa stone", "ABS. Hyraceum (Piedra de África)", "Hyraceum extract", "Procavia capensis extract"],
      cas: "1005328-84-6",
      other_cas: [],
      species: "Procavia capensis",
      part: "excreción",
      process: "extracción con disolvente (absoluto)",
      inci: "Hyraceum extract",
      form: "absoluto",
      synthesis: "natural",
      family: "animal",
      strength: "high",
      strength_source: `${proposal(`Fraterworks (${FW.hyraceum}) da «moderate strength (6/10)» a su absoluto al 40 % en DPG; el de Maese Lab es puro («Pureza 100%»)`)}, por la tanda 32`,
      confidence: "medium",
      notes: [
        "Alta del 2026-10-28 (tanda 32), con la ficha de Maese Lab, TGSC y Fraterworks.",
        `Maese Lab no da el CAS (${MAESE.hyraceum}: «Nº CAS: N/C») ni la especie; el CAS y la especie son de Fraterworks (${FW.hyraceum}), y el CAS está en la lista de transparencia de IFRA como «Procavia capensis extract» (datos/ifra/transparencia-2025).`,
        `Fraterworks, de su absoluto al 40 % en DPG: dura más de 400 h en tira.`,
        `${maese(MAESE.hyraceum, "No aplicar directamente sobre la piel. Pueden causar irritación.")}`,
        "IFRA: sin estándar ni línea del anexo por su CAS en los archivos de IFRA.",
        `Pista, no límite: Fraterworks da para su absoluto al 40 % en DPG un máximo de 1,28 % en el producto acabado en la categoría 4 (${FW.hyraceum}); equivale a un 0,51 % del absoluto puro (cálculo de la sesión). No dice de qué constituyente sale. Es de su producto, no del de Maese Lab.`,
      ].join("\n"),
    },
    why: [
      ["Nombre", "Hyraceum (piedra de África), absoluto", proposal("por el título de Maese Lab, «ABS. Hyraceum (Piedra de África)»")],
      ["Especie", "Procavia capensis", `Fraterworks, ${FW.hyraceum} (Maese Lab no la da)`],
      ["Parte", "excreción", maese(MAESE.hyraceum, "Parte Utilizada: Excreción")],
      ["Proceso", "extracción con disolvente (absoluto)", `${maese(MAESE.hyraceum, "Método de Obtención: ABSOLUTO")}; Fraterworks: extracción con disolvente`],
      ["CAS", "1005328-84-6", `Fraterworks, ${FW.hyraceum}, y la lista de transparencia de IFRA; ${maese(MAESE.hyraceum, "Nº CAS: N/C")}`],
      ["Familia", "animal", web("TGSC", TGSC.hyraceum, "animal warm phenolic")],
      ["Fuerza", "alta", proposal("Fraterworks da 6 sobre 10 a su absoluto al 40 % en DPG; el de Maese Lab es puro")],
      ["Uso", "no lo dice", "Ni Maese Lab ni Fraterworks dan una dosis; una reseña de la tienda aconseja diluirlo al 1 o al 5 %, y una reseña no es evidencia"],
    ],
    doses: [],
    descriptors: [
      { source: "TG", text: "TGSC (al 1 % en DPG): animal warm phenolic" },
      { source: "web", text: "Fraterworks: phenolic, urinous notes mingle with tarry leather and scorched earth" },
    ],
    shop: { product: "ABS. Hyraceum (Piedra de África)", url: MAESE.hyraceum, origin: "Sudáfrica", originSaid: "Origen: SUDAFRICA", purity: "1" },
  },
];

const known = materials.rows.filter((m) => !m.owner_id);
const knownCas = new Set(known.flatMap((m) => [String(m.cas ?? ""), ...(JSON.parse(String(m.other_cas || "[]")) as string[])]).filter((c) => c));
const knownNames = new Set(known.map((m) => String(m.name).toLowerCase()));

const newMaterials: Rec[] = [];
const newCategories: Rec[] = [];
const newDoses: Rec[] = [];
const newDescriptors: Rec[] = [];
const versions: Rec[] = [];
for (const item of fresh) {
  const r = item.record;
  const id = uuidFor(`comun:tanda32:${item.key}`);
  const allCas = [String(r.cas), ...(r.other_cas as string[])];
  for (const c of allCas) if (knownCas.has(c)) throw new Error(`${r.name}: el CAS ${c} ya es de un material común`);
  if (knownNames.has(String(r.name).toLowerCase())) throw new Error(`«${r.name}» ya es un material común`);
  const category = uuidFor(`cat:v3:cas:${r.cas}`);
  if (categories.rows.some((c) => c.id === category)) throw new Error(`${r.name}: su categoría ya existe`);
  newCategories.push({ id: category, name: r.name, aliases: [] });
  newMaterials.push({
    ...Object.fromEntries(materials.header.map((h) => [h, null])),
    ...r,
    id,
    owner_id: null,
    solvent: false,
    disputed_fields: [],
    category_id: category,
    sources: item.why.map(([field, , from]) => `${field}: ${from}`).join(" · "),
  });
  item.doses.forEach((d, n) =>
    newDoses.push({
      id: uuidFor(`dose:v3:tanda32:${item.key}:${n}`),
      material_id: id,
      owner_id: null,
      min: d.min ?? null,
      typical: d.typical ?? null,
      max: d.max ?? null,
      basis: "concentrate",
      authority: "literature",
      source: `web: ${d.site}, ${d.url}`,
      disputed: false,
      notes: `${d.said.replace(/\.$/, "")}. Uso observado o recomendado, no un límite de IFRA.`,
    }),
  );
  for (const d of item.descriptors) newDescriptors.push({ id: uuidFor(`desc:v3:tanda32:${item.key}:${d.text}`), material_id: id, owner_id: null, source: d.source, text: d.text });
  // Batch 33: your specification of it, from Maese Lab, with «I have it».
  versions.push({
    ...Object.fromEntries(materials.header.map((h) => [h, null])),
    id: uuidFor(`tuya:tanda33:${id}`),
    owner_id: null,
    name: r.name,
    kind: r.kind,
    solvent: false,
    aliases: [],
    other_cas: [],
    disputed_fields: [],
    category_id: category,
    based_on_id: id,
    supplier: "Maese Lab",
    product: item.shop.product,
    product_url: item.shop.url,
    origin: item.shop.origin,
    purity: item.shop.purity ?? null,
    sources: `${SAID}. ${maese(item.shop.url, item.shop.originSaid)}${item.shop.purity ? `; ${maese(item.shop.url, "Pureza 100%")}` : ""}`,
  });
}

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT_COMMON, "materials.csv"), materials.header, [...asCells(materials.rows), ...newMaterials]);
writeTable(join(OUT_COMMON, "material_categories.csv"), categories.header, [...asCells(categories.rows), ...newCategories]);
writeTable(join(OUT_COMMON, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...newDoses]);
writeTable(join(OUT_COMMON, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);
writeTable(join(OUT_ACCOUNT, "materials.csv"), materials.header, asCells(versions));
writeTable(join(OUT_ACCOUNT, "lab_materials.csv"), ["id", "user_id", "material_id"], versions.map((v) => ({ id: uuidFor(`tengo:tanda33:${v.id}`), user_id: null, material_id: v.id })));

const ifraOf = (r: Rec) => {
  const all = [String(r.cas), ...(r.other_cas as string[])];
  if (all.some((c) => substances.some((s) => s.cas === c))) return "estándar por su CAS";
  const lines = annex.filter((a) => all.includes(String(a.natural_cas)));
  return lines.length ? `en el anexo: ${lines.map((a) => `${a.constituent_name} ${(Number(a.concentration) * 100).toLocaleString("es", { maximumFractionDigits: 2 })} %`).join(", ")}` : "sin estándar ni anexo por su CAS";
};
const pct = (fraction: string) => `${(Number(fraction) * 100).toLocaleString("es", { maximumFractionDigits: 3 })} %`;
const STRENGTH: Record<string, string> = { low: "baja", medium: "media", high: "alta", very_high: "muy alta" };
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");
writeFileSync(
  join(OUT_COMMON, "informe.md"),
  `# Tanda 32 · Pimienta rosa, enebro (bayas) e hyraceum, de Maese Lab, en lo común

*Generada por \`migracion-v3/tanda-32-altas-maese-28-oct.ts\` sobre lo común de \`main\` (\`${BASE}\`). Escribe \`v3/datos/materials.csv\`, \`material_categories.csv\`, \`material_doses.csv\` y \`material_descriptors.csv\` enteros, con estos añadidos: los ${known.length} de antes no cambian. Sin aprobar.*

**Por qué:** ${SAID}.

| Nombre | CAS | Fuerza | Uso habitual | IFRA |
|---|---|---|---|---|
${fresh
  .map((item) => {
    const r = item.record;
    const use = item.doses.length ? item.doses.map((d) => [d.min && `desde ${pct(d.min)}`, d.typical && `típico ${pct(d.typical)}`, d.max && `hasta ${pct(d.max)}`].filter((x) => x).join(", ") + ` (${d.site})`).join("; ") : "no lo dice";
    return `| ${r.name} | ${[r.cas, ...(r.other_cas as string[])].join(", ")} | ${STRENGTH[String(r.strength)]} | ${use} | ${ifraOf(r)} |`;
  })
  .join("\n")}

**Para mirar antes de aprobar:**

- **Lo marcado «propuesta de la sesión»:** los tres nombres, las familias de la pimienta rosa y del enebro, la fuerza del enebro («medium to strong» leído como media) y la del hyraceum (alta, sin una fuente que hable del absoluto puro).
- **IFRA:** ninguno tiene estándar propio. Los dos aceites entran por el anexo de IFRA 51, con cifras de literatura: la app los dará como mucho por «acotados», nunca «dentro». Con esas cifras, ninguno de sus constituyentes los limita por sí solo en la categoría 4 (cálculo de la sesión), pero suman con el resto de la fórmula.
- **Hyraceum:** sin cifra de IFRA. Fraterworks da 1,28 % en el producto acabado (cat. 4) para su absoluto al 40 % en DPG, unos 0,51 % de absoluto puro; va en las notas como pista, no como límite.
- **Sin constituyentes con cifra:** la ficha de Maese Lab los nombra sin porcentajes (van a las notas). Los alérgenos, de sus documentos, cuando los tengas.

${fresh
  .map(
    (item) => `## ${item.record.name}

| Campo | Valor | De dónde |
|---|---|---|
${item.why.map(([field, value, from]) => `| ${field} | ${cell(value)} | ${cell(from)} |`).join("\n")}
`,
  )
  .join("\n")}`,
  "utf8",
);
writeFileSync(
  join(OUT_ACCOUNT, "informe.md"),
  `# Tanda 33 · Tus tres de Maese Lab, en tu cuenta

*Generada por \`migracion-v3/tanda-32-altas-maese-28-oct.ts\`. De tu cuenta: se aprueba con \`--cuenta\` y se carga con \`cargar-laboratorio.ts <correo> --tanda=33-tus-altas-maese-28-oct\` **después de cargar la tanda 32**. Sin aprobar.*

${SAID}.

| Tu especificación | Tienda | Producto | Origen |
|---|---|---|---|
${versions.map((v) => `| ${v.name} | ${v.supplier} | ${v.product} | ${v.origin} |`).join("\n")}

Las tres con «lo tengo», puras, como las vende Maese Lab: sin frasco. Si diluyes alguna, el frasco se añade en Diluciones.
`,
  "utf8",
);
console.log(`Tanda 32: ${newMaterials.length} materiales, ${newCategories.length} categorías, ${newDoses.length} dosis, ${newDescriptors.length} descriptores. Tanda 33: ${versions.length} especificaciones con «lo tengo».`);
