/**
 * Batch 11 (plan v3, step 8.2; V3-53): DEP, TEC, triacetin and benzyl benzoate, the diluents the
 * v2's workbench offered that are not among your 111, into the common data, as solvents, each in a
 * category of its own (V3-13). Their names, CAS and short names are the v2 app's own
 * (src/data/catalog.ts, DILUENT_DATA, and src/core/model/material.ts, DILUENTS). IFRA reads them by
 * their CAS from its layer (V3-35). The 111 do not change: the batch writes the whole tables, as
 * approved (v3/datos/), with these four added.
 *
 *   node migracion-v3/tanda-11-diluyentes.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/11-diluyentes";
type Rec = Record<string, Cell>;
const read = (path: string) => {
  const text = readFileSync(path, "utf8");
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = read("v3/datos/materials.csv");
const categories = read("v3/datos/material_categories.csv");

/** From the v2 app: its key, its name in the workbench, its short name, its CAS and the names it was found by. */
const DILUENTS: ReadonlyArray<readonly [string, string, string, string, readonly string[]]> = [
  ["dep", "DEP", "DEPd", "84-66-2", ["Ftalato de dietilo", "Diethyl phthalate"]],
  ["tec", "TEC", "TEC", "77-93-0", ["Citrato de trietilo", "Triethyl citrate"]],
  ["triacetina", "Triacetina", "TRI", "102-76-1", ["Triacetin"]],
  ["bb", "Benzoato de bencilo", "BBd", "120-51-4", ["Benzyl benzoate"]],
];
const commit = execSync("git log -1 --format=%h -- src/data/catalog.ts src/core/model/material.ts", { encoding: "utf8" }).trim();

const taken = new Set(materials.rows.map((m) => String(m.abbreviation)).filter((a) => a));
const newMaterials: Rec[] = [];
const newCategories: Rec[] = [];
for (const [key, name, abbreviation, cas, aliases] of DILUENTS) {
  if (taken.has(abbreviation)) throw new Error(`La abreviatura ${abbreviation} ya la tiene otro material común`);
  if (materials.rows.some((m) => m.cas === cas)) throw new Error(`El CAS ${cas} ya lo tiene un material común`);
  const category = uuidFor(`cat:v3:cas:${cas}`);
  newCategories.push({ id: category, name, aliases: [] });
  const row: Rec = Object.fromEntries(materials.header.map((c) => [c, null]));
  Object.assign(row, {
    id: uuidFor(`comun:diluyente:${key}`),
    name,
    kind: "molecule",
    solvent: true,
    aliases: [...aliases],
    cas,
    other_cas: [],
    abbreviation,
    abbreviation_origin: "generated",
    category_id: category,
    role: null,
    disputed_fields: [],
    sources: `app de la v2: diluyentes del banco (src/data/catalog.ts, DILUENT_DATA; commit ${commit})`,
    notes: "Diluyente del banco de la v2 (V3-53). Sus datos de ficha están por completar (V3-46).",
  });
  newMaterials.push(row);
}
// Lists as the approved files keep them: JSON text.
const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, [...asCells(materials.rows), ...newMaterials]);
writeTable(join(OUT, "material_categories.csv"), categories.header, [...asCells(categories.rows), ...newCategories]);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 11 · Cuatro diluyentes, en lo común

*Generada por \`migracion-v3/tanda-11-diluyentes.ts\` (V3-53), desde los diluyentes de la app de la v2 (\`src/data/catalog.ts\`, \`DILUENT_DATA\`; commit \`${commit}\`). Escribe las tablas enteras de lo común, como están aprobadas, con estos cuatro añadidos: los ${materials.rows.length} de antes no cambian.*

| Nombre | CAS | Abreviatura | Otros nombres |
|---|---|---|---|
${DILUENTS.map(([, name, abbreviation, cas, aliases]) => `| ${name} | ${cas} | ${abbreviation} (generada, provisional) | ${aliases.join(" · ")} |`).join("\n")}

Son moléculas marcadas como disolvente, cada una en su categoría. Su IFRA sale de la capa por su CAS (V3-35): el benzoato de bencilo tiene estándar. El resto de su ficha está por completar (V3-46).
`,
  "utf8",
);
console.log(`Tanda 11: ${materials.rows.length} + ${newMaterials.length} materiales comunes, ${categories.rows.length} + ${newCategories.length} categorías. ${OUT}/informe.md`);
