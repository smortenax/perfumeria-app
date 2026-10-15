/**
 * Batch 13 (2026-10-15): nine materials you have just bought, into the common data, each in a
 * category of its own (V3-13), as batch 11 did. The user's message: «dar de alta los nuevos
 * materiales», with their list. Their names are yours, without the % they are bought at: the base
 * is pure matter and the dilution is chosen in the workbench when pouring. Each CAS cites where it
 * comes from: the FIG glossary of the lab (glosario-fig.csv), or the web, page and date. IFRA reads
 * them by their CAS from its layer (V3-35). What is not here (family, abbreviation, tenacity…) is
 * left out, never invented (V3-46, V3-51). The 115 do not change: the batch writes the whole tables,
 * as approved (v3/datos/), with these nine added.
 *
 *   node migracion-v3/tanda-13-nuevos.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/13-nuevos";
type Rec = Record<string, Cell>;
const read = (path: string) => {
  const text = readFileSync(path, "utf8");
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = read("v3/datos/materials.csv");
const categories = read("v3/datos/material_categories.csv");
const ifraSubstances = read("v3/datos/ifra_substances.csv").rows;
const annex = read("v3/datos/ifra_annex.csv").rows;

const FIG = "laboratorio, conocimiento/lenguaje/fig/glosario-fig.csv (glosario FIG)";
type New = {
  readonly key: string;
  readonly name: string;
  readonly kind: "molecule" | "natural";
  readonly cas: string;
  readonly aliases: readonly string[];
  readonly source: string;
  readonly confidence: "high" | "medium";
  readonly note?: string;
};
const NEW: readonly New[] = [
  { key: "1-octen-3-one", name: "1-Octen-3-one Stabilised", kind: "molecule", cas: "4312-99-6", aliases: ["1-Octen-3-one", "Amyl vinyl ketone"], source: `${FIG}: «4312-99-6,1-Octen-3-one»`, confidence: "high", note: "«Stabilised»: lleva estabilizante; cuál y cuánto, lo diría su ficha." },
  { key: "cypriol", name: "Cypriol / Nagarmotha EO", kind: "natural", cas: "68916-60-9", aliases: ["Cypriol oil", "Nagarmotha", "Cypriol"], source: `${FIG}: «68916-60-9,Cypriol oil»`, confidence: "high", note: "Otra CAS que da una tienda (PCW, catálogo del laboratorio 2026-09-29): 91771-62-9; sin contrastar, no entra." },
  { key: "cumin-nitrile", name: "Cumin Nitrile", kind: "molecule", cas: "13816-33-6", aliases: ["Cuminyl nitrile", "Cumin Nitrile 10%"], source: `${FIG}: «13816-33-6,Cuminyl nitrile»`, confidence: "high" },
  { key: "phenylethyl-mercaptan", name: "Phenylethyl Mercaptan", kind: "molecule", cas: "4410-99-5", aliases: ["2-Phenylethanethiol", "Phenethyl mercaptan", "Phenylethyl Mercaptan 0.1%"], source: "web: Spectrum Chemical, https://www.spectrumchemical.com/cas/4410-99-5 (2-Phenylethanethiol), y TCI P1715; consultado 2026-10-15", confidence: "high" },
  { key: "thialdine", name: "Thialdine", kind: "molecule", cas: "638-17-5", aliases: ["2,4,6-Trimethyl-1,3,5-dithiazinane", "Thialdine 0.1%"], source: "web: Wikipedia, https://en.wikipedia.org/wiki/Thialdine (638-17-5, el isómero todo-cis), y FDA UNII ZKG651IE9G; consultado 2026-10-15", confidence: "high", note: "CAS general de la mezcla de isómeros: 86241-90-9 (Wikipedia)." },
  { key: "narcisse-oxyacetate", name: "Narcisse Oxyacetate", kind: "molecule", cas: "67028-40-4", aliases: ["Ethyl (p-tolyloxy)acetate", "Ethyl 2-(4-methylphenoxy)acetate"], source: "web: Harrison Joseph, https://www.harrisonjoseph.co.uk/product-page/narcisse-oxyacetate (la tienda da 67028-40-4); la molécula, en The Good Scents Company, https://www.thegoodscentscompany.com/data/rw1023241.html, que no usa el nombre «Narcisse Oxyacetate»; consultado 2026-10-15", confidence: "medium", note: "Que «Narcisse Oxyacetate» sea esta molécula lo dice una tienda, no el fabricante." },
  { key: "rose-crystals", name: "Rose Crystals", kind: "molecule", cas: "90-17-5", aliases: ["Trichloromethyl phenyl carbinyl acetate", "Rosacetol", "2,2,2-Trichloro-1-phenylethyl acetate"], source: "web: NIST Chemistry WebBook, https://webbook.nist.gov/cgi/cbook.cgi?ID=90-17-5 (Benzenemethanol, α-(trichloromethyl)-, acetate), y Parchem «Rose crystals»; consultado 2026-10-15", confidence: "high", note: "Sólido (cristales)." },
  { key: "vinyl-sulfurol", name: "Vinyl Sulfurol", kind: "molecule", cas: "1759-28-0", aliases: ["4-Methyl-5-vinylthiazole", "Vinyl Sulfurol 1%"], source: `${FIG}: «1759-28-0,4-Methyl-5-vinylthiazole»; «vinyl sulfurol» entre sus sinónimos, en CymitQuimica, https://cymitquimica.com/cas/1759-28-0 (y TCI M1029); consultado 2026-10-15`, confidence: "high", note: "No confundir con el sulfurol (4-metil-5-tiazoletanol, 137-00-8)." },
  { key: "isobutyl-acetate", name: "Isobutyl acetate", kind: "molecule", cas: "110-19-0", aliases: ["Acetato de isobutilo"], source: `${FIG}: «110-19-0,Isobutyl acetate»`, confidence: "high" },
];

const newMaterials: Rec[] = [];
const newCategories: Rec[] = [];
for (const m of NEW) {
  if (materials.rows.some((r) => r.cas === m.cas)) throw new Error(`El CAS ${m.cas} ya lo tiene un material común`);
  if (materials.rows.some((r) => String(r.name).toLowerCase() === m.name.toLowerCase())) throw new Error(`«${m.name}» ya es un material común`);
  const category = uuidFor(`cat:v3:cas:${m.cas}`);
  newCategories.push({ id: category, name: m.name, aliases: [] });
  const row: Rec = Object.fromEntries(materials.header.map((c) => [c, null]));
  Object.assign(row, {
    id: uuidFor(`comun:tanda13:${m.key}`),
    name: m.name,
    kind: m.kind,
    solvent: false,
    aliases: [...m.aliases],
    cas: m.cas,
    other_cas: [],
    category_id: category,
    disputed_fields: [],
    sources: m.source,
    confidence: m.confidence,
    notes: ["Alta del 2026-10-15 (tanda 13). La ficha está por completar (V3-46).", m.note ?? ""].join(" ").trim(),
  });
  newMaterials.push(row);
}
const ifraOf = (cas: string) =>
  ifraSubstances.some((s) => s.cas === cas) ? "estándar por su CAS" : annex.some((a) => a.natural_cas === cas) ? "en el anexo (constituyentes)" : "sin estándar";

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, [...asCells(materials.rows), ...newMaterials]);
writeTable(join(OUT, "material_categories.csv"), categories.header, [...asCells(categories.rows), ...newCategories]);
const conf = { high: "alta", medium: "media" } as const;
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 13 · Nueve materiales nuevos, en lo común

*Generada por \`migracion-v3/tanda-13-nuevos.ts\` (2026-10-15), con la lista del usuario: «dar de alta los nuevos materiales». Escribe las tablas enteras de lo común, como están aprobadas, con estos nueve añadidos: los ${materials.rows.length} de antes no cambian.*

Los nombres son los tuyos, sin el % al que se compran: la base es la materia pura y la dilución se elige en el banco al verter. El nombre de compra queda como otro nombre, para que el buscador lo encuentre.

| Nombre | Tipo | CAS | Confianza | IFRA | De dónde sale el CAS |
|---|---|---|---|---|---|
${NEW.map((m) => `| ${m.name} | ${m.kind === "natural" ? "natural" : "molécula"} | ${m.cas} | ${conf[m.confidence]} | ${ifraOf(m.cas)} | ${m.source} |`).join("\n")}

**Notas, para revisarlas antes de aprobar:**

${NEW.filter((m) => m.note).map((m) => `- **${m.name}:** ${m.note}`).join("\n")}

Lo demás de la ficha (familia, abreviatura, tenacidad, dosis) no se rellena: no hay fuente en esta tanda (V3-46, V3-51). En tu cuenta no entra nada: «lo tengo» se marca en el glosario («Marcar lo que tengo»).
`,
  "utf8",
);
console.log(`Tanda 13: ${materials.rows.length} + ${newMaterials.length} materiales comunes, ${categories.rows.length} + ${newCategories.length} categorías. ${OUT}/informe.md`);
