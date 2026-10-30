/**
 * Batches 38 and 39 (2026-10-30): ten Maese Lab molecules that were in no list. The user, 2026-10-30:
 * «alta bencyl salicilate phenetyl acetate aurantiol javanol boisambrene forte amyl salicylate aldehyde
 * c12 magnolian manzanate y raspberry ketone».
 *
 * - Batch 38, common: the ten molecules with what Maese Lab's pages say, quoted, and what TGSC says
 *   where its page could be read (strength, hours on a strip, usual use). Each in a category of its own
 *   (V3-13). IFRA reads each CAS from its layer (V3-35). Aurantiol is a Schiff base of hydroxycitronellal,
 *   which IFRA 43 restricts: it carries hydroxycitronellal as a component, at most 56.4 % (TGSC), so that
 *   the bench counts it.
 * - Batch 39, your account: your Maese Lab specification of each, with «I have it», taken as sold.
 *
 * In English, as the common data is since batch 36; Maese Lab's and TGSC's words stay quoted as they
 * are. «session proposal» (the family where no source gives it) is a reading, to be checked before
 * approving. Where TGSC's page could not be read (benzyl salicylate, phenethyl acetate, amyl salicylate,
 * aldehyde C12, Manzanate, raspberry ketone), strength and hours stay empty: unknown, not zero.
 *
 *   node migracion-v3/tanda-38-altas-maese-30-oct.ts
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = "2264ad8";
const OUT_COMMON = "migracion-v3/tandas/38-altas-maese-30-oct";
const OUT_ACCOUNT = "migracion-v3/tandas/39-tus-altas-maese-30-oct";
const SAID =
  "the user, 2026-10-30: «alta bencyl salicilate phenetyl acetate aurantiol javanol boisambrene forte amyl salicylate aldehyde c12 magnolian manzanate y raspberry ketone»";
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
const components = table("v3/datos/material_components.csv");
const annex = table("v3/datos/ifra_annex.csv").rows;
const substances = table("v3/datos/ifra_substances.csv").rows;

const maese = (url: string, phrase: string) => `Maese Lab, ${url}: «${phrase}»`;
const tgsc = (url: string, phrase: string) => `web: TGSC, ${url}: «${phrase}»`;
const proposal = (why: string) => `session proposal: ${why}`;
const tg = (code: string) => `https://www.thegoodscentscompany.com/data/${code}.html`;

type Dose = { max: string; url: string; said: string };
type New = {
  key: string;
  name: string;
  aliases: string[];
  cas: string;
  inci: string;
  family: string;
  familyFrom: string;
  maeseUrl: string;
  product: string;
  purity: string;
  purityText: string;
  odor: string;
  house?: [string, string];
  physicalState?: [string, string];
  dilution?: [string, string];
  tgscUrl: string;
  strength?: [string, string];
  hours?: [string, string];
  dose?: Dose;
  tgscOdor?: string;
  notes?: string[];
  component?: { cas: string; name: string; max: string; source: string };
};

const fresh: New[] = [
  {
    key: "benzyl-salicylate",
    name: "Benzyl salicylate",
    aliases: ["Salicilato de bencilo"],
    cas: "118-58-1",
    inci: "BENZYL SALICYLATE",
    family: "floral",
    familyFrom: proposal("by Maese Lab: «Salicilato dulce-floral, especiado, balsámico, ligeramente fenólico, picante»"),
    maeseUrl: "https://maeselab.com/benzyl-salicylate/",
    product: "Benzyl Salicylate",
    purity: "1",
    purityText: "PUREZA 100%",
    odor: "Salicilato dulce-floral, especiado, balsámico, ligeramente fenólico, picante",
    tgscUrl: tg("rw1001792"),
  },
  {
    key: "phenethyl-acetate",
    name: "Phenethyl acetate",
    aliases: ["Phenylethyl acetate", "Acetato de feniletilo", "2-Phenylethyl acetate"],
    cas: "103-45-7",
    inci: "PHENETHYL ACETATE",
    family: "floral",
    familyFrom: proposal("by Maese Lab: «Chocolate blanco, gardenia, miel, verde»"),
    maeseUrl: "https://maeselab.com/phenethyl-acetate/",
    product: "PHENETHYL ACETATE",
    purity: "1",
    purityText: "PUREZA 100%",
    odor: "Chocolate blanco, gardenia, miel, verde",
    tgscUrl: tg("rw1010031"),
  },
  {
    key: "aurantiol",
    name: "Aurantiol",
    aliases: ["Hydroxycitronellal / methyl anthranilate Schiff base", "Hydroxycitronellal methyl anthranilate"],
    cas: "89-43-0",
    inci: "HYDROXYCITRONELLAL METHYL ANTHRANILATE",
    family: "floral",
    familyFrom: tgsc(tg("rw1004281"), "Odor Type: floral"),
    maeseUrl: "https://maeselab.com/en/aurantiol/",
    product: "Aurantiol",
    purity: "1",
    purityText: "PURITY 100",
    odor: "Floral (orange blossom), nectarous, honeyed, sweet citrus, subtle herbal",
    tgscUrl: tg("rw1004281"),
    strength: ["medium", tgsc(tg("rw1004281"), "Odor Strength: medium , recommend smelling in a 50.00 % solution or less")],
    hours: ["400", tgsc(tg("rw1004281"), "Substantivity: 400 hour(s) at 100.00 %")],
    dose: { max: "0.08", url: tg("rw1004281"), said: "Recommendation for hydroxycitronellal / methyl anthranilate schiff's base usage levels up to: 8.0000 % in the fragrance concentrate." },
    tgscOdor: "at 50.00 % in dipropylene glycol. floral lily orange blossom sweet",
    notes: [
      "IFRA: no standard of its own by its CAS. It is the Schiff base of hydroxycitronellal and methyl anthranilate, and hydroxycitronellal is restricted by IFRA 43; it goes in as a component, at most 56.4 %, so that the bench adds it up with the rest of the formula.",
    ],
    component: {
      cas: "107-75-5",
      name: "Hydroxycitronellal",
      max: "0.564",
      source: `web: TGSC, ${tg("rw1004281")}: «contains the following IFRA (Annex) restricted components: (non-analysis max. level reference only) hydroxycitronellal Max. Found: 56.4 % and Reason: Sensitization». Matches the share of hydroxycitronellal in the condensate (172 of 305 g/mol; session calculation)`,
    },
  },
  {
    key: "javanol",
    name: "Javanol",
    aliases: ["Sandal cyclopropane", "Javanol (Givaudan)"],
    cas: "198404-98-7",
    inci: "Sandal Cyclopropane",
    family: "woody",
    familyFrom: tgsc(tg("rw1493091"), "Odor Type: woody"),
    maeseUrl: "https://maeselab.com/javanol-givaudan/",
    product: "Javanol (Givaudan)",
    purity: "1",
    purityText: "PUREZA 100%",
    odor: "Amaderado, sándalo dulce, cremoso.",
    house: ["Givaudan", maese("https://maeselab.com/javanol-givaudan/", "Javanol (Givaudan)")],
    tgscUrl: tg("rw1493091"),
    strength: ["high", tgsc(tg("rw1493091"), "Odor Strength: high , recommend smelling in a 10.00 % solution or less")],
    hours: ["400", tgsc(tg("rw1493091"), "Substantivity: 400 hour(s) at 100.00 %")],
    dose: { max: "0.02", url: tg("rw1493091"), said: "Recommendation for sandal cyclopropane usage levels up to: 2.0000 % in the fragrance concentrate." },
    tgscOdor: "at 10.00 % in dipropylene glycol. tropical woody fatty sandalwood herbal cologne floral",
    notes: ["Amouage names it in Decision 42: the juniper «has been combined with Javanol, Patchouli and Rectified Pine Tar» (https://amouage.com/products/decision-42)."],
  },
  {
    key: "boisambrene-forte",
    name: "Boisambrene Forte",
    aliases: ["Amber decane", "Ethoxymethoxy cyclododecane"],
    cas: "58567-11-6",
    inci: "FORMALDEHYDE CYCLODECYL ETHYL ETHYL ACETAL",
    family: "woody",
    familyFrom: proposal(`TGSC gives «Odor Type: amber» (${tg("rw1016091")}); the app has no amber family, and its description is «woody cedar ambergris dry dusty amber»`),
    maeseUrl: "https://maeselab.com/en/boisambrene-forte-aroma-chemicals/",
    product: "Boisambrene Forte - Aroma Chemicals",
    purity: "",
    purityText: "PURITY 100 PURITY 100 PURITY 100 Purity",
    odor: "Aroma woody, amber, ambergris",
    tgscUrl: tg("rw1016091"),
    strength: ["medium", tgsc(tg("rw1016091"), "Odor Strength: medium")],
    hours: ["168", tgsc(tg("rw1016091"), "Substantivity: 168 hour(s) at 100.00 %")],
    dose: { max: "0.05", url: tg("rw1016091"), said: "Recommendation for amber decane usage levels up to: 5.0000 % in the fragrance concentrate." },
    tgscOdor: "at 100.00 %. woody cedar ambergris dry dusty amber",
    notes: ["Maese Lab's purity field is garbled («PURITY 100 PURITY 100 PURITY 100 Purity»): purity left empty."],
  },
  {
    key: "amyl-salicylate",
    name: "Amyl salicylate",
    aliases: ["Salicilato de amilo", "Pentyl salicylate"],
    cas: "2050-08-0",
    inci: "AMYL SALICYLATE",
    family: "floral",
    familyFrom: proposal(`TGSC's page summary: «Has a floral type odor» (${tg("rw1012551")}); Maese Lab: «Hierba seca, especiado, cuero»`),
    maeseUrl: "https://maeselab.com/salicilato-de-amilo-98/",
    product: "Salicilato de amilo 98%",
    purity: "0.98",
    purityText: "PUREZA 98%",
    odor: "Hierba seca, especiado, cuero",
    tgscUrl: tg("rw1012551"),
  },
  {
    key: "aldehyde-c12-lauric",
    name: "Aldehyde C12 lauric (dodecanal)",
    aliases: ["Dodecanal", "Lauric aldehyde", "Aldehyde C-12 lauric", "Lauraldehyde", "Aldehído C12 láurico"],
    cas: "112-54-9",
    inci: "LAURALDEHYDE",
    family: "ozonic",
    familyFrom: proposal(`with the other aliphatic aldehydes of the common data (Aldehyde C12 MNA is «ozonic»); TGSC's page summary: «Has a aldehydic type odor» (${tg("rw1000371")})`),
    maeseUrl: "https://maeselab.com/aldehyde-c12/",
    product: "ALDEHYDE C12",
    purity: "1",
    purityText: "PUREZA 100%",
    odor: "Balsámico, naranja, jabón, aroma verde y floral, lirios.",
    dilution: ["Maese Lab: 1 %", maese("https://maeselab.com/aldehyde-c12/", "Sugerimos, como con casi todos los Aldehides, diluir al 1%.")],
    tgscUrl: tg("rw1000371"),
    notes: ["Not the Aldehyde C12 MNA (2-methylundecanal, 110-41-8), which is another material."],
  },
  {
    key: "magnolan",
    name: "Magnolan",
    aliases: ["Magnolia indene", "2,4-Dimethyl-4,4a,5,9b-tetrahydroindeno[1,2-d][1,3]dioxine"],
    cas: "27606-09-3",
    inci: "2,4-DIMETHYL-4,4A,5,9B-TETRAHYDROINDENO-1,3-DIOXIN",
    family: "floral",
    familyFrom: tgsc(tg("rw1007991"), "Odor Type: floral"),
    maeseUrl: "https://maeselab.com/magnolan/",
    product: "MAGNOLAN",
    purity: "1",
    purityText: "PUREZA 100%",
    odor: "Hojas de magnolia, floral fresco nocturno, brotes de geranio.",
    house: ["Symrise", tgsc(tg("rw1007991"), "magnolia indene magnolan (Symrise)")],
    tgscUrl: tg("rw1007991"),
    strength: ["medium", tgsc(tg("rw1007991"), "Odor Strength: medium")],
    hours: ["308", tgsc(tg("rw1007991"), "Substantivity: 308 hour(s) at 100.00 %")],
    tgscOdor: "at 100.00 %. floral green grapefruit narcissus magnolia geranium gardenia",
    notes: ["Maese Lab writes the CAS as «27606-09-03»; the CAS is 27606-09-3 (TGSC)."],
  },
  {
    key: "manzanate",
    name: "Manzanate",
    aliases: ["Ethyl 2-methylpentanoate", "Ethyl 2-methylvalerate"],
    cas: "39255-32-8",
    inci: "ETHYL 2-METHYLVALERATE",
    family: "fruity",
    familyFrom: proposal("by Maese Lab: «Cerosa, manzana arenosa. Intensa.»"),
    maeseUrl: "https://maeselab.com/manzanate/",
    product: "MANZANATE",
    purity: "1",
    purityText: "PUREZA 100%",
    odor: "Cerosa, manzana arenosa. Intensa.",
    house: ["Givaudan", tgsc(tg("rw1006801"), "manzanate (Givaudan), 39255-32-8")],
    tgscUrl: tg("rw1006801"),
  },
  {
    key: "raspberry-ketone",
    name: "Raspberry ketone",
    aliases: ["4-(4-Hydroxyphenyl)butan-2-one", "Frambinone", "Cetona de frambuesa"],
    cas: "5471-51-2",
    inci: "RASPBERRY KETONE",
    family: "fruity",
    familyFrom: proposal("by Maese Lab: «Dulce, frambuesa, afrutada, mermelada, floral.»"),
    maeseUrl: "https://maeselab.com/raspberry-ketone/",
    product: "RASPBERRY KETONE",
    purity: "1",
    purityText: "PUREZA 100%",
    odor: "Dulce, frambuesa, afrutada, mermelada, floral.",
    physicalState: ["solid", proposal("Maese Lab sells it by weight («10 gr»), not by volume")],
    tgscUrl: tg("rw1020771"),
  },
];

const known = materials.rows.filter((m) => !m.owner_id);
const knownCas = new Set(known.flatMap((m) => [String(m.cas ?? ""), ...(JSON.parse(String(m.other_cas || "[]")) as string[])]).filter((c) => c));
const knownNames = new Set(known.map((m) => String(m.name).toLowerCase()));

const newMaterials: Rec[] = [];
const newCategories: Rec[] = [];
const newDoses: Rec[] = [];
const newDescriptors: Rec[] = [];
const newComponents: Rec[] = [];
const versions: Rec[] = [];
const why = new Map<string, Array<[string, string, string]>>();
for (const item of fresh) {
  const id = uuidFor(`comun:tanda38:${item.key}`);
  if (knownCas.has(item.cas)) throw new Error(`${item.name}: the CAS ${item.cas} is already a common material`);
  if (knownNames.has(item.name.toLowerCase())) throw new Error(`«${item.name}» is already a common material`);
  const category = uuidFor(`cat:v3:cas:${item.cas}`);
  if (categories.rows.some((c) => c.id === category)) throw new Error(`${item.name}: its category already exists`);
  const rows: Array<[string, string, string]> = [
    ["Name", item.name, maese(item.maeseUrl, item.product)],
    ["CAS", item.cas, maese(item.maeseUrl, `Nº CAS: ${item.cas === "27606-09-3" ? "27606-09-03" : item.cas}`)],
    ["INCI", item.inci, maese(item.maeseUrl, `INCI: ${item.inci}`)],
    ["Family", item.family, item.familyFrom],
  ];
  if (item.house) rows.push(["House", item.house[0], item.house[1]]);
  if (item.strength) rows.push(["Strength", item.strength[0], item.strength[1]]);
  if (item.hours) rows.push(["Tenacity", `${item.hours[0]} h on a strip`, item.hours[1]]);
  if (item.dose) rows.push(["Use", `up to ${Number(item.dose.max) * 100} % of the concentrate`, tgsc(item.dose.url, item.dose.said)]);
  if (item.dilution) rows.push(["Dilution", item.dilution[0], item.dilution[1]]);
  if (item.physicalState) rows.push(["State", item.physicalState[0], item.physicalState[1]]);
  why.set(item.key, rows);
  newCategories.push({ id: category, name: item.name, aliases: [] });
  newMaterials.push({
    ...Object.fromEntries(materials.header.map((h) => [h, null])),
    id,
    owner_id: null,
    name: item.name,
    kind: "molecule",
    solvent: false,
    aliases: item.aliases,
    cas: item.cas,
    other_cas: [],
    inci: item.inci,
    category_id: category,
    house: item.house?.[0] ?? null,
    family: item.family,
    strength: item.strength?.[0] ?? null,
    strength_source: item.strength ? `${item.strength[1]}, by batch 38` : null,
    tenacity_hours: item.hours?.[0] ?? null,
    tenacity_source: item.hours?.[1] ?? null,
    recommended_dilution: item.dilution ? `${item.dilution[0]} (${item.dilution[1]})` : null,
    physical_state: item.physicalState?.[0] ?? null,
    confidence: item.strength ? "high" : "medium",
    disputed_fields: [],
    notes: [
      `Added on 2026-10-30 (batch 38), with the sheet from Maese Lab${item.strength ? " and TGSC" : ""}.`,
      ...(item.strength ? [] : [`TGSC's page (${item.tgscUrl}) could not be read past its supplier list: strength and hours unknown.`]),
      ...(item.notes ?? []),
    ].join("\n"),
    sources: rows.map(([field, , from]) => `${field}: ${from}`).join(" · "),
  });
  if (item.dose)
    newDoses.push({
      id: uuidFor(`dose:v3:tanda38:${item.key}`),
      material_id: id,
      owner_id: null,
      min: null,
      typical: null,
      max: item.dose.max,
      basis: "concentrate",
      authority: "literature",
      source: `web: TGSC, ${item.dose.url}`,
      disputed: false,
      notes: `${item.dose.said.replace(/\.$/, "")}. Observed or recommended use, not an IFRA limit.`,
    });
  newDescriptors.push({ id: uuidFor(`desc:v3:tanda38:${item.key}:maese`), material_id: id, owner_id: null, source: "web", text: `Maese Lab: ${item.odor}` });
  if (item.tgscOdor) newDescriptors.push({ id: uuidFor(`desc:v3:tanda38:${item.key}:tgsc`), material_id: id, owner_id: null, source: "TG", text: `TGSC: ${item.tgscOdor}` });
  if (item.component)
    newComponents.push({
      id: uuidFor(`comp:v3:tanda38:${item.key}:${item.component.cas}`),
      material_id: id,
      component_id: null,
      component_cas: item.component.cas,
      component_name: item.component.name,
      amount_kind: "max",
      value: item.component.max,
      min: null,
      max: null,
      authority: "literature",
      source: item.component.source,
    });
  // Batch 39: your specification of it, from Maese Lab, with «I have it».
  versions.push({
    ...Object.fromEntries(materials.header.map((h) => [h, null])),
    id: uuidFor(`tuya:tanda39:${id}`),
    owner_id: null,
    name: item.name,
    kind: "molecule",
    solvent: false,
    aliases: [],
    other_cas: [],
    disputed_fields: [],
    category_id: category,
    based_on_id: id,
    supplier: "Maese Lab",
    product: item.product,
    product_url: item.maeseUrl,
    purity: item.purity || null,
    sources: `${SAID}. ${maese(item.maeseUrl, item.purityText)}`,
  });
}

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT_COMMON, "materials.csv"), materials.header, [...asCells(materials.rows), ...newMaterials]);
writeTable(join(OUT_COMMON, "material_categories.csv"), categories.header, [...asCells(categories.rows), ...newCategories]);
writeTable(join(OUT_COMMON, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...newDoses]);
writeTable(join(OUT_COMMON, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...newDescriptors]);
writeTable(join(OUT_COMMON, "material_components.csv"), components.header, [...asCells(components.rows), ...newComponents]);
writeTable(join(OUT_ACCOUNT, "materials.csv"), materials.header, asCells(versions));
writeTable(join(OUT_ACCOUNT, "lab_materials.csv"), ["id", "user_id", "material_id"], versions.map((v) => ({ id: uuidFor(`tengo:tanda39:${v.id}`), user_id: null, material_id: v.id })));

const ifraOf = (item: New) => {
  const standard = substances.find((s) => s.cas === item.cas);
  if (standard) return "estándar propio por su CAS";
  if (item.component) return `sin estándar propio; lleva ${item.component.name.toLowerCase()} como componente (máx. ${(Number(item.component.max) * 100).toLocaleString("es")} %)`;
  const lines = annex.filter((a) => a.natural_cas === item.cas);
  return lines.length ? "en el anexo" : "sin estándar ni anexo por su CAS";
};
const STRENGTH: Record<string, string> = { low: "baja", medium: "media", high: "alta", very_high: "muy alta" };
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");
writeFileSync(
  join(OUT_COMMON, "informe.md"),
  `# Tanda 38 · Diez moléculas de Maese Lab, en lo común

*Generada por \`migracion-v3/tanda-38-altas-maese-30-oct.ts\` sobre lo común de \`main\` (\`${BASE}\`). Escribe \`v3/datos/materials.csv\`, \`material_categories.csv\`, \`material_doses.csv\`, \`material_descriptors.csv\` y \`material_components.csv\` enteros, con estos añadidos: los ${known.length} de antes no cambian. En inglés, como lo común desde la tanda 36. Sin aprobar.*

**Por qué:** ${SAID}.

| Nombre | CAS | Fuerza | Horas en tira | Uso habitual | IFRA |
|---|---|---|---|---|---|
${fresh
  .map(
    (i) =>
      `| ${i.name} | ${i.cas} | ${i.strength ? STRENGTH[i.strength[0]] : "no lo dice"} | ${i.hours ? `${i.hours[0]} h` : "no lo dice"} | ${i.dose ? `hasta ${Number(i.dose.max) * 100} % del concentrado (TGSC)` : "no lo dice"} | ${ifraOf(i)} |`,
  )
  .join("\n")}

**Para mirar antes de aprobar:**

- **Lo marcado «session proposal»:** la familia de siete (el salicilato de bencilo, el acetato de feniletilo, el Boisambrene, el salicilato de amilo, el C12 láurico, el Manzanate y la raspberry ketone), y el estado sólido de la raspberry ketone.
- **Sin fuerza ni horas en seis:** la página de TGSC no se pudo leer más allá de su lista de proveedores. Quedan vacías, no a cero; se pueden completar en otra tanda.
- **Aurantiol e IFRA:** no tiene estándar propio, pero es la base de Schiff del hidroxicitronelal, que limita el estándar 43. Entra con hidroxicitronelal como componente, como mucho un 56,4 % (TGSC; cuadra con el peso molecular), con autoridad «literatura»: la app lo dará como mucho por «acotado».
- **Boisambrene Forte:** la pureza de la ficha de Maese está rota («PURITY 100 PURITY 100…»): va sin pureza.
- **Magnolan:** Maese escribe el CAS «27606-09-03»; va el correcto, 27606-09-3.

${fresh
  .map(
    (i) => `## ${i.name}

| Campo | Valor | De dónde |
|---|---|---|
${why
  .get(i.key)!
  .map(([field, value, from]) => `| ${field} | ${cell(value)} | ${cell(from)} |`)
  .join("\n")}
`,
  )
  .join("\n")}`,
  "utf8",
);
writeFileSync(
  join(OUT_ACCOUNT, "informe.md"),
  `# Tanda 39 · Tus diez de Maese Lab, en tu cuenta

*Generada por \`migracion-v3/tanda-38-altas-maese-30-oct.ts\`. De tu cuenta: se aprueba con \`--cuenta\` y se carga con \`cargar-laboratorio.ts <correo> --tanda=39-tus-altas-maese-30-oct\` **después de cargar la tanda 38**. Sin aprobar.*

${SAID}.

| Tu especificación | Tienda | Producto | Pureza |
|---|---|---|---|
${versions.map((v) => `| ${v.name} | ${v.supplier} | ${v.product} | ${v.purity ? `${Number(v.purity) * 100} %` : "no la dice"} |`).join("\n")}

Las diez con «lo tengo», tal como las vende Maese Lab: sin frasco. Si diluyes alguna (el C12, por ejemplo, al 1 %), el frasco se añade en Diluciones.
`,
  "utf8",
);
console.log(
  `Tanda 38: ${newMaterials.length} materiales, ${newCategories.length} categorías, ${newDoses.length} dosis, ${newDescriptors.length} descriptores, ${newComponents.length} componentes. Tanda 39: ${versions.length} especificaciones con «lo tengo».`,
);
