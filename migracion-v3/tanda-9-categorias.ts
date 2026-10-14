/**
 * Batch 9 of the migration (plan v3, phase 4; V3-13): the categories the search shows, over the
 * common materials of batch 7 (v3/datos/materials.csv, as approved). Grouping mixes no data: each
 * material keeps its card, its composition and its limits; the category only gathers them.
 *
 * The rule (V3-13, as batch 4 applied it): a natural by its species (genus and epithet, with the
 * subspecies or variety; one epithet that starts another of the same genus is the same species);
 * a natural that does not say its species, by its CAS, with the species that has it if only one
 * does; a molecule by its CAS; the same name gathers the rest. A category's id comes from what
 * gathers it (the species, the CAS, or its first material), so a form added later joins it
 * without changing it. Its name: the material's while it has one; with several, the species of
 * a natural, else the words all their names share, else the shortest name. The user's versions
 * take their common material's category through based_on_id.
 *
 *   node migracion-v3/tanda-9-categorias.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/9-categorias";
const SOURCE = "v3/datos/materials.csv";
type Rec = Record<string, string>;
const text = readFileSync(SOURCE, "utf8");
const header = text.slice(0, text.indexOf("\n")).split(",");
const materials = parseCsvRecords(text).map((r) => ({ ...r })) as Rec[];
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Genus, epithet and subspecies or variety, without authors; null for a genus alone. */
function speciesKey(value: string): string | null {
  const t = fold(value).replace(/\(.*?\)/g, " ").replace(/×/g, " ").split(/\s+/).map((w) => w.replace(/,/g, "")).filter((w) => w && w !== "x");
  if (t.length < 2) return null;
  const epithet = t[1].replace(/\.$/, "");
  if (["sp", "spp", "l", ""].includes(epithet)) return null;
  const infra = t.findIndex((w) => ["ssp.", "subsp.", "var.", "ssp", "subsp", "var"].includes(w));
  const rank = infra > 0 && t[infra + 1] ? ` ${t[infra].startsWith("var") ? "var." : "subsp."} ${t[infra + 1].replace(/[.,]$/, "")}` : "";
  return `${t[0]} ${epithet}${rank}`;
}

// ------------------------------------------------------------ group
const parent = new Map<string, string>();
const find = (id: string): string => {
  const p = parent.get(id) ?? id;
  if (p === id) return id;
  const root = find(p);
  parent.set(id, root);
  return root;
};
const order = new Map(materials.map((m, i) => [m.id, i]));
const union = (a: string, b: string) => {
  const [x, y] = [find(a), find(b)];
  if (x !== y) (order.get(x)! < order.get(y)! ? parent.set(y, x) : parent.set(x, y));
};
const why = new Map<string, Set<string>>();
const mark = (id: string, rule: string) => why.set(id, (why.get(id) ?? new Set()).add(rule));
const linkBy = (rule: string, keyOf: (m: Rec) => string | null) => {
  const byKey = new Map<string, string[]>();
  for (const m of materials) {
    const key = keyOf(m);
    if (key) byKey.set(key, [...(byKey.get(key) ?? []), m.id]);
  }
  for (const ids of byKey.values()) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      union(ids[0], id);
      mark(id, rule);
    }
  }
};

const species = new Map<string, string>();
for (const m of materials) {
  const key = m.kind === "natural" && m.species ? speciesKey(m.species) : null;
  if (key) species.set(m.id, key);
}
const keys = [...new Set(species.values())].sort((a, b) => a.length - b.length || a.localeCompare(b));
const canonical = new Map<string, string>();
for (const key of keys) {
  const shorter = keys.find((k) => k !== key && k.length >= 7 && !/ (var\.|subsp\.)/.test(k + key) && key.split(" ")[0] === k.split(" ")[0] && key.startsWith(k));
  canonical.set(key, shorter ? (canonical.get(shorter) ?? shorter) : key);
}
for (const [id, key] of species) species.set(id, canonical.get(key)!);

linkBy("especie", (m) => species.get(m.id) ?? null);
linkBy("CAS", (m) => (m.kind === "molecule" && m.cas ? `cas:${m.cas}` : null));
const speciesOfCas = new Map<string, Set<string>>();
for (const m of materials) if (m.kind === "natural" && m.cas && species.has(m.id)) speciesOfCas.set(m.cas, (speciesOfCas.get(m.cas) ?? new Set()).add(species.get(m.id)!));
for (const m of materials) {
  if (m.kind !== "natural" || species.has(m.id) || !m.cas) continue;
  const only = speciesOfCas.get(m.cas);
  if (only?.size === 1) {
    const anchor = materials.find((x) => species.get(x.id) === [...only][0])!;
    union(anchor.id, m.id);
    mark(m.id, "CAS de una especie");
    mark(anchor.id, "CAS de una especie");
  }
}
linkBy("CAS", (m) => (m.kind === "natural" && !species.has(m.id) && m.cas && (speciesOfCas.get(m.cas)?.size ?? 0) !== 1 ? `cas-natural:${m.cas}` : null));
linkBy("nombre", (m) => fold(m.name));

// ------------------------------------------------------------ name and write
function shared(names: readonly string[]): string {
  const split = names.map((n) => n.split(/\s+/));
  const bare = (w: string) => w.toLowerCase().replace(/[,;:]$/, "");
  let n = 0;
  while (split.every((w) => w[n] !== undefined && bare(w[n]) === bare(split[0][n]))) n++;
  const common = split[0].slice(0, n).join(" ").replace(/[,;:]$/, "");
  return common || [...names].sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
}
const members = new Map<string, Rec[]>();
for (const m of materials) members.set(find(m.id), [...(members.get(find(m.id)) ?? []), m]);
const categories: Array<Record<string, Cell>> = [];
const review: string[] = [];
for (const list of members.values()) {
  const first = list[0];
  const plant = list.map((m) => species.get(m.id)).find((k) => k);
  const anchor = plant ? `especie:${plant}` : first.cas && first.kind === "molecule" ? `cas:${first.cas}` : `material:${first.id}`;
  const id = uuidFor(`cat:v3:${anchor}`);
  const name = list.length === 1 ? first.name : plant ? plant.charAt(0).toUpperCase() + plant.slice(1) : shared(list.map((m) => m.name));
  categories.push({ id, name, aliases: [] });
  for (const m of list) m.category_id = id;
  if (list.length > 1) review.push(`**${name}** (${list.length}, por ${[...new Set(list.flatMap((m) => [...(why.get(m.id) ?? [])]))].join(", ")}): ${list.map((m) => m.name).join(" · ")}`);
}
writeTable(join(OUT, "material_categories.csv"), ["id", "name", "aliases"], categories);
writeTable(join(OUT, "materials.csv"), header, materials);

const report = `# Tanda 9 · Las categorías de lo común

*Generada por \`migracion-v3/tanda-9-categorias.ts\` (V3-13) sobre los materiales comunes de la tanda 7 tal como se aprobaron (\`${SOURCE}\`). Agrupar no mezcla datos: cada material sigue con su ficha, su composición y sus límites.*

**Qué entra:** ${categories.length} categorías (\`material_categories.csv\`) y los ${materials.length} materiales comunes con la suya (\`materials.csv\`: solo cambia \`category_id\`). ${categories.length - review.length} categorías tienen un solo material y ${review.length} juntan varios.

**La regla** (V3-13, como la aplicó la tanda 4): un natural, por su especie; uno sin especie, por su CAS (con la especie que lo tiene, si solo lo tiene una); una molécula, por su CAS; el mismo nombre junta lo demás. El id de una categoría sale de lo que la junta (la especie, el CAS o su primer material), así que una forma que entre más adelante (un absoluto de lavanda) se une a la suya sin cambiarla. **Su nombre:** el del material mientras sea uno; con varios, la especie de un natural, o las palabras que comparten, o el nombre más corto.

**Tus versiones** toman la categoría de su común por \`based_on_id\` (V3-13): no hace falta escribirla en tu cuenta.

**Las que juntan varios materiales:**

${review.length ? review.map((r) => `- ${r}`).join("\n") : "- Ninguna: hoy cada uno de tus materiales es de una especie o un CAS distintos."}
`;
writeFileSync(join(OUT, "informe.md"), report, "utf8");
console.log(`Tanda 9: ${categories.length} categorías para ${materials.length} materiales; ${review.length} con varios. ${OUT}/informe.md`);
