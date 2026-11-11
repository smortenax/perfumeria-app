/**
 * Batch 55: tocopherol (vitamin E) from Maese Lab in the common bank, as an antioxidant additive. The user,
 * 2026-11-11, gave the data to copy and asked: «puedes dar de alta esto en la app no sin antes contrastar y
 * asegurar los datos». Each value below was checked on the web (migracion-v3/web/tocoferol/lecturas.csv,
 * with the literal phrase); what no source confirms stays empty or is said in the notes.
 *
 * It stands alone on the common data of git HEAD, so it can be approved without batches 46 to 51; those
 * are regenerated on top of it afterwards (they read v3/datos). It rewrites materials.csv,
 * material_categories.csv, material_descriptors.csv and material_doses.csv whole.
 *
 *   node migracion-v3/tanda-55-tocoferol.ts
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/55-tocoferol";
type Rec = Record<string, Cell>;
const fromFile = (name: string) => {
  const text = execSync(`git show ${BASE}:v3/datos/${name}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = fromFile("materials.csv");
const categories = fromFile("material_categories.csv");
const descriptors = fromFile("material_descriptors.csv");
const doses = fromFile("material_doses.csv");

const CAS = "10191-41-0";
if (materials.rows.some((m) => !m.owner_id && (m.cas === CAS || String(m.other_cas ?? "").includes(CAS)))) throw new Error("ya es un común");

const MAESE_ES = "https://maeselab.com/vitamina-e-tocopherol-liquido/";
const MAESE_EN = "https://maeselab.com/en/vitamina-e-tocopherol-liquido/";
const TGSC = "https://www.thegoodscentscompany.com/data/rw1131331.html";
const HEKSERIJ = "https://eng.hekserij.nl/shop/cosmetics-raw-material/active/vitamin-e-tocopherol/";

const id = uuidFor("comun:tanda55:tocopherol");
const category = uuidFor(`cat:v3:cas:${CAS}`);
const material: Rec = {
  ...Object.fromEntries(materials.header.map((h) => [h, null])),
  id,
  owner_id: null,
  name: "Tocopherol (vitamin E)",
  kind: "molecule",
  solvent: false,
  aliases: ["Vitamina E - Tocopherol líquido", "Vitamin E - Liquid Tocopherol", "Tocoferol (vitamina E)", "DL-alpha-tocopherol"],
  cas: CAS,
  other_cas: ["2074-53-5"],
  inci: "Tocopherol",
  category_id: category,
  family: null,
  tier: null,
  strength: null,
  impact: null,
  physical_state: "liquid",
  appearance: `viscous liquid: «colorless to yellow to brown viscous liquid (est)» (TGSC), «viscous, brown liquid» (Hekserij); Maese Lab: «Liquido Naranja Fuerte»`,
  handling: "Antioxidant additive: protects the oils and the concentrate from oxidation. It is not an odorant: no family, no note level.",
  confidence: "medium",
  disputed_fields: [],
  notes: [
    "Added on 2026-11-11 (batch 55) at the user's request, with the data checked on the web (migracion-v3/web/tocoferol/lecturas.csv).",
    `CAS: Maese Lab prints «Nº CAS: 1019-41-0 / 2074-53-5» (${MAESE_ES}); 1019-41-0 is a typo for 10191-41-0, which TGSC gives for «dextro,laevo-alpha-tocopherol» (DL-alpha-tocopherol) and Hekserij as «CAS number EU: 10191-41-0». 2074-53-5 is rel-alpha-tocopherol by a chemical vendor's page only (001chemical.com).`,
    `Purity: Maese Lab does not state it on the page; only its description says «100% pure raw material for natural cosmetics and perfumery» (${MAESE_EN}). Whether it is neat or in oil is not confirmed.`,
    `Odor: TGSC «at 100.00 %. bland», Odor Strength «none». TGSC also says «not for fragrance use» while listing «fragrance» among its uses: the page contradicts itself.`,
    "IFRA: neither 10191-41-0 nor 2074-53-5 is in IFRA 51 (checked against the IFRA layer, not a web page).",
  ].join("\n"),
  sources: `Maese Lab, ${MAESE_ES} · TGSC, ${TGSC} · Hekserij, ${HEKSERIJ}`,
};
const descriptor: Rec = { id: uuidFor("desc:v3:tanda55:tocopherol:tgsc"), material_id: id, owner_id: null, source: "TG", text: `TGSC: «at 100.00 %. bland» (Odor Strength «none»)` };
const dose: Rec = {
  id: uuidFor("dose:v3:tanda55:tocopherol"), material_id: id, owner_id: null, min: null, typical: 0.001, max: null, basis: "undeclared",
  authority: "literature",
  source: `Hekserij, ${HEKSERIJ}: «When used as an antioxidant, you use (much) less: 0.1% is typical, a little more does little harm.»`,
  disputed: false,
  notes: "Antioxidant use, not an IFRA limit. The page does not say 0.1 % of what (it speaks of oils and «many fragrances»), so the basis stays undeclared. Maese Lab gives no dose.",
};

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, [...asCells(materials.rows), material]);
writeTable(join(OUT, "material_categories.csv"), categories.header, [...asCells(categories.rows), { id: category, name: material.name, aliases: [] }]);
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), descriptor]);
writeTable(join(OUT, "material_doses.csv"), doses.header, [...asCells(doses.rows), dose]);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 55 · El tocoferol (vitamina E) de Maese Lab, en lo común

*Generada por \`migracion-v3/tanda-55-tocoferol.ts\` sobre lo común de \`${BASE}\`, sola: se puede aprobar sin las tandas 46 a 51, que después se regeneran encima. Escribe \`v3/datos/materials.csv\`, \`material_categories.csv\`, \`material_descriptors.csv\` y \`material_doses.csv\` enteros, con este añadido. Sin aprobar.*

**Por qué:** el usuario, 2026-11-11: «puedes dar de alta esto en la app no sin antes contrastar y asegurar los datos».

| Lo que diste | Contrastado | Fuente |
|---|---|---|
| Tocoferol (vitamina E) | Sí. Nombre en inglés, *Tocopherol (vitamin E)*; INCI Tocopherol | Maese Lab, TGSC |
| CAS 10191-41-0 / 2074-53-5 | 10191-41-0 sí (DL-alfa-tocoferol). Maese Lab lo escribe mal, «1019-41-0». 2074-53-5 solo lo explica la página de un vendedor de química (rel-alfa-tocoferol) | TGSC, Hekserij, Maese Lab |
| Proveedor Maese Lab | Sí | ${MAESE_ES} |
| Líquido muy viscoso, puro | Líquido viscoso, sí. Maese dice «Liquido Naranja Fuerte». **Puro: no confirmado**; solo la descripción dice «100% pure» | TGSC, Hekserij, Maese Lab |
| Aditivo antioxidante, sin olor útil, sin piso | Sí: TGSC, olor «bland», fuerza «none». Sin familia ni nivel | TGSC |
| ~0,1 % del concentrado | 0,1 % típico como antioxidante, sí. **Del concentrado: no confirmado**; la página no dice de qué. Va con la base «sin declarar» | Hekserij |

**IFRA:** ninguno de los dos CAS está en IFRA 51 (comprobado en la capa de IFRA, no en la web).

Las lecturas, con la frase literal: \`migracion-v3/web/tocoferol/lecturas.csv\`.
`,
  "utf8",
);
console.log("Tanda 55: el tocoferol, 1 material, 1 descriptor, 1 dosis.");
