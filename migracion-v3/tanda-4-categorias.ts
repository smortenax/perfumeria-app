/**
 * Batch 4 of the migration (plan v3, phase 4, step 4.8; V3-11, V3-13): the categories of the
 * search, and what is fused. Nothing is fused on its own: the candidates go, each with the
 * session's recommendation, to migracion-v3/conflictos/duplicados.csv; the user decides each
 * row, and their answers are written to migracion-v3/respuestas/duplicados.csv, which this
 * script reads (as the v2's batches did). Until every row has its answer, it writes nothing else.
 *
 *   node migracion-v3/tanda-4-categorias.ts
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import type { Material as V2Material } from "../src/v2/model.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { known, readSources } from "./lib/fuentes.ts";
import { uuidFor, v2Id } from "./lib/ids.ts";

const CONFLICTS = "migracion-v3/conflictos/duplicados.csv";
const ANSWERS = "migracion-v3/respuestas/duplicados.csv";
const src = readSources();
const { v2 } = src;

const products = new Map<string, string[]>();
for (const p of v2.products) products.set(p.materialId, [...(products.get(p.materialId) ?? []), p.name]);
const hasProduct = (m: V2Material) => products.has(m.id);

/** A name as the search compares it: no invisible spaces, no case. */
const norm = (name: string) => name.normalize("NFKC").replace(/\u200b/g, "").trim().toLowerCase();
/** Its words, in any order and without punctuation; without what is between brackets, if asked. */
const words = (name: string, withoutBrackets = false) =>
  [...new Set((withoutBrackets ? norm(name).replace(/\(.*?\)/g, " ") : norm(name)).split(/[^a-z0-9áéíóúñü]+/).filter((w) => w))].sort().join(" ");
const brackets = (name: string) => [...norm(name).matchAll(/\((.*?)\)/g)].map((m) => m[1]).join(" ");

/** Genus and epithet of a species, without its author («Cistus ladaniferus L.» → cistus, ladaniferus). */
function species(m: V2Material): readonly [string, string] | null {
  const text = known(m.species);
  if (!text) return null;
  const [genus, epithet = ""] = norm(text).replace(/\(.*?\)/g, " ").split(/\s+/).filter((w) => w);
  return [genus, epithet.replace(/[.,]/g, "")];
}
/** Two species are the same when the genus is, and one epithet starts the other (ladanifer, ladaniferus). */
function sameSpecies(a: V2Material, b: V2Material): boolean {
  const [x, y] = [species(a), species(b)];
  if (!x || !y) return true;
  return x[0] === y[0] && (x[1].startsWith(y[1]) || y[1].startsWith(x[1]));
}
const rectified = (m: V2Material) => /rectificad/.test(norm(m.process));

type Kind = "mismo-material" | "isomeros" | "tipos-distintos" | "disolvente";
interface Candidate {
  readonly key: string;
  readonly kind: Kind;
  readonly members: readonly V2Material[];
  readonly recommendation: string;
  readonly reason: string;
}

const candidates = new Map<string, Candidate>();
const add = (kind: Kind, members: readonly V2Material[], recommendation: string, reason: string) => {
  const sorted = [...members].sort((a, b) => a.id.localeCompare(b.id));
  const key = sorted.map((m) => m.id).join("+");
  if (!candidates.has(key)) candidates.set(key, { key, kind, members: sorted, recommendation, reason });
};

/** The session's recommendation for two or more naturals that may be the same material. */
function naturals(members: readonly V2Material[], why: string) {
  const [first, ...rest] = members;
  if (!rest.every((m) => sameSpecies(first, m))) return add("mismo-material", members, "no fusionar", `${why}, pero de especies distintas`);
  if (new Set(members.map(rectified)).size > 1) return add("mismo-material", members, "no fusionar", `${why}, pero uno es rectificado y el otro no lo dice`);
  const withProduct = members.filter(hasProduct);
  if (withProduct.length > 1) return add("mismo-material", members, "no fusionar", `${why}, pero cada uno tiene su producto`);
  const keep = withProduct[0] ?? [...members].sort((a, b) => a.id.localeCompare(b.id))[0];
  const cas = new Set(members.map((m) => m.cas).filter((c) => c));
  const where = withProduct.length ? "el de tu cuaderno, con producto" : "el primero que entró";
  add("mismo-material", members, `fusionar en ${keep.id}`, `${why}; queda ${where}${cas.size > 1 ? "; el otro CAS pasa a sus otros CAS" : ""}`);
}

// ------------------------------------------------------------ the same name
const byName = new Map<string, V2Material[]>();
for (const m of v2.materials) byName.set(norm(m.name), [...(byName.get(norm(m.name)) ?? []), m]);
for (const members of byName.values()) {
  if (members.length < 2) continue;
  const types = new Set(members.map((m) => m.type));
  if (types.size > 1) {
    add("tipos-distintos", members, "no fusionar", "el mismo nombre, pero uno es la entrada de IFRA como sustancia y otro un natural; van en la misma categoría");
  } else if (types.has("sustancia")) {
    add("isomeros", members, "no fusionar", "un nombre de IFRA con varios CAS (isómeros o registros distintos); van en la misma categoría, cada uno con su CAS");
  }
}

// ------------------------------------------------------------ naturals: the same words, in any order
const naturalsOnly = v2.materials.filter((m) => m.type === "natural");
const byWords = new Map<string, V2Material[]>();
for (const m of naturalsOnly) byWords.set(words(m.name), [...(byWords.get(words(m.name)) ?? []), m]);
for (const members of byWords.values()) {
  if (members.length > 1) naturals(members, new Set(members.map((m) => norm(m.name))).size === 1 ? "el mismo nombre" : "el mismo nombre salvo el orden o la puntuación");
}

// ------------------------------------------------------------ your notebook's naturals and the FIG's entries of the same plant
for (const mine of naturalsOnly.filter(hasProduct)) {
  for (const other of naturalsOnly) {
    if (other.id === mine.id || hasProduct(other) || words(other.name) === words(mine.name)) continue;
    if (words(other.name, true) !== words(mine.name)) continue;
    if (!(other.cas && other.cas === mine.cas) && !(species(other) && species(mine) && sameSpecies(other, mine))) continue;
    const inside = brackets(other.name);
    const genus = species(mine)?.[0];
    if ((genus && inside.includes(genus)) || inside === "all origins") {
      naturals([mine, other], `tu material del cuaderno y la entrada del FIG que solo añade «(${inside})»`);
    } else {
      add("mismo-material", [mine, other], "no fusionar", `tu material del cuaderno y una entrada del FIG que dice otra variante: «(${inside})»`);
    }
  }
}

// ------------------------------------------------------------ which DPG is the app's (plan, step 4.1)
const dpg = ["M02736", "M02952"].map((id) => v2.materials.find((m) => m.id === id)!);
add("disolvente", dpg, "M02952", "la clave solv:dpg de las fórmulas apunta a uno; el DPG del mercado es la mezcla de isómeros, CAS 25265-71-8 (conocimiento general, sin verificar). No se fusionan: son dos CAS; los dos llevan la marca de disolvente");

// ------------------------------------------------------------ the list to decide, and the answers
const detail = (m: V2Material) =>
  `${m.id} «${m.name.replace(/\u200b/g, "")}» (CAS ${m.cas || "—"}; ${known(m.species) ?? "sin especie"}; ${known(m.process) ?? "sin proceso"}${hasProduct(m) ? `; producto: ${products.get(m.id)!.join(", ")}` : ""})`;
const rows = [...candidates.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.key.localeCompare(b.key));
writeTable(CONFLICTS, ["id", "tipo", "materiales", "recomendacion", "motivo"], rows.map((c) => ({
  id: c.key, tipo: c.kind, materiales: c.members.map(detail).join(" | "), recomendacion: c.recommendation, motivo: c.reason,
})));

const answers = new Map(existsSync(ANSWERS) ? parseCsvRecords(readFileSync(ANSWERS, "utf8")).map((r) => [r.id, r.respuesta.trim()]) : []);
const invalid: string[] = [];
for (const c of rows) {
  const answer = answers.get(c.key);
  if (answer === undefined) continue;
  const ids = c.members.map((m) => m.id);
  const ok = c.kind === "disolvente" ? ids.includes(answer) : answer === "no fusionar" || ids.some((id) => answer === `fusionar en ${id}`);
  if (!ok) invalid.push(`${c.key}: «${answer}»`);
}
const pending = rows.filter((c) => !answers.has(c.key));
const counts = Object.entries(Object.groupBy(rows, (c) => c.kind)).map(([k, v]) => `${v!.length} ${k}`).join(", ");
console.log(`Tanda 4: ${rows.length} candidatos (${counts}) en ${CONFLICTS}.`);
console.log(`Recomiendan fusionar: ${rows.filter((c) => c.recommendation.startsWith("fusionar")).length}.`);
if (invalid.length) throw new Error(`Respuestas que no valen:\n${invalid.join("\n")}`);
if (pending.length) {
  console.log(`Faltan ${pending.length} respuestas en ${ANSWERS}: no se escribe la tanda.`);
  process.exit(0);
}
console.log("Todas contestadas.");

// ================================================================ second step: the fusions, then the categories
const OUT = "migracion-v3/tandas/4-categorias";
type Rec = Record<string, string>;

/** A table as batches 1 to 3 left it, which must be what the user approved (its hash in aprobadas.csv). */
function approvedTable(batch: string, table: string): { header: string[]; rows: Rec[] } {
  const path = `migracion-v3/tandas/${batch}/${table}.csv`;
  const text = readFileSync(path, "utf8");
  const trail = parseCsvRecords(readFileSync("migracion-v3/tandas/aprobadas.csv", "utf8")).filter((r) => r.tanda === batch && r.archivo === `${table}.csv`);
  const hash = createHash("sha256").update(text, "utf8").digest("hex");
  if (trail.at(-1)?.sha256 !== hash) throw new Error(`${path} no es el que aprobó el usuario (aprobadas.csv)`);
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text).map((r) => ({ ...r })) };
}
const materials = approvedTable("1-materiales", "materials");
const components = approvedTable("2-composicion", "material_components");
const regulations = approvedTable("3-ifra", "regulations");
const before = { materials: materials.rows.length, components: components.rows.length, regulations: regulations.rows.length };
const notes: string[] = [];

// ------------------------------------------------------------ the fusions the user decided
const fusions = rows.flatMap((c) => {
  const answer = answers.get(c.key)!;
  if (!answer.startsWith("fusionar en ")) return [];
  const keep = c.members.find((m) => answer === `fusionar en ${m.id}`)!;
  return c.members.filter((m) => m !== keep).map((gone) => ({ keep, gone, key: c.key }));
});
const redirect = new Map(fusions.map((f) => [v2Id(f.gone.id), v2Id(f.keep.id)]));
if (fusions.some((f) => redirect.has(v2Id(f.keep.id)))) throw new Error("Una ficha que queda en una fusión se va en otra.");
const to = (id: string) => redirect.get(id) ?? id;

const byId = new Map(materials.rows.map((r) => [r.id, r]));
const list = (r: Rec, column: string): string[] => JSON.parse(r[column] || "[]");
const unique = (items: readonly string[]) => [...new Set(items)];
const LISTS = ["aliases", "other_cas", "disputed_fields"];
const OWN = new Set(["id", "owner_id", "name", "kind", "cas", "solvent", "category_id", ...LISTS]);
const fusionReport: string[] = [];
for (const f of fusions) {
  const keep = byId.get(v2Id(f.keep.id))!;
  const gone = byId.get(v2Id(f.gone.id))!;
  const aliases = unique([...list(keep, "aliases"), gone.name, ...list(gone, "aliases")]).filter((n) => norm(n) !== norm(keep.name));
  const otherCas = unique([...list(keep, "other_cas"), gone.cas, ...list(gone, "other_cas")]).filter((c) => c && c !== keep.cas);
  const added = [
    ...aliases.filter((a) => !list(keep, "aliases").includes(a)).map((a) => `otro nombre «${a}»`),
    ...otherCas.filter((c) => !list(keep, "other_cas").includes(c)).map((c) => `otro CAS ${c}`),
  ];
  keep.aliases = JSON.stringify(aliases);
  keep.other_cas = JSON.stringify(otherCas);
  keep.disputed_fields = JSON.stringify(unique([...list(keep, "disputed_fields"), ...list(gone, "disputed_fields")]));
  for (const column of materials.header) {
    if (!OWN.has(column) && !keep[column] && gone[column]) {
      keep[column] = gone[column];
      added.push(`${column} «${gone[column]}»`);
    }
  }
  byId.delete(gone.id);
  fusionReport.push(`${f.gone.id} «${f.gone.name}» → ${f.keep.id} «${f.keep.name}»: ${added.join("; ") || "nada nuevo en la ficha"}`);
}

/** Of two rows for the same thing, the most authoritative; at the same authority, the one no fusion moved, then the lower id. */
const RANK: Readonly<Record<string, number>> = { lot: 0, product: 1, ifra: 2, literature: 3, consensus: 4 };
const moved = new Set<string>();
const better = (a: Rec, b: Rec) =>
  RANK[a.authority] !== RANK[b.authority] ? RANK[a.authority] < RANK[b.authority] : moved.has(a.id) !== moved.has(b.id) ? !moved.has(a.id) : a.id < b.id;

const componentRows = new Map<string, Rec>();
for (const row of components.rows) {
  const r = { ...row, material_id: to(row.material_id), component_id: to(row.component_id) };
  if (r.material_id !== row.material_id || r.component_id !== row.component_id) moved.add(r.id);
  if (r.material_id === r.component_id) {
    notes.push(`${r.id}: tras la fusión, ${r.material_id} se contendría a sí mismo; la fila no entra.`);
    continue;
  }
  const key = `${r.material_id}|${r.component_id}`;
  const was = componentRows.get(key);
  if (!was || better(r, was)) componentRows.set(key, r);
}
const regulationRows = new Map<string, Rec>();
for (const row of regulations.rows) {
  const r = { ...row, material_id: to(row.material_id) };
  if (r.material_id !== row.material_id) moved.add(r.id);
  const key = [r.material_id, r.regime, r.category, r.kind, r.group_key, r.requirement, r.max_value].join("|");
  const was = regulationRows.get(key);
  if (!was || better(r, was)) regulationRows.set(key, r);
}
const ceilings = new Map<string, Set<string>>();
for (const r of regulationRows.values()) {
  if (r.kind === "max") {
    const key = `${r.material_id}|${r.regime}|${r.category}|${r.group_key}`;
    ceilings.set(key, (ceilings.get(key) ?? new Set()).add(r.max_value));
  }
}
for (const [key, values] of ceilings) if (values.size > 1) notes.push(`${key}: dos techos distintos tras la fusión (${[...values].join(", ")}).`);
for (const f of fusions) {
  const keepId = v2Id(f.keep.id);
  const fromGone = (rows: Iterable<Rec>) => [...rows].filter((r) => r.material_id === keepId && moved.has(r.id)).length;
  const i = fusionReport.findIndex((line) => line.startsWith(`${f.gone.id} `));
  fusionReport[i] += `; ${fromGone(componentRows.values())} filas de composición y ${fromGone(regulationRows.values())} regulaciones que no tenía`;
}

// ------------------------------------------------------------ the categories (V3-13): grouping, which mixes no data
const v2OfV3 = new Map<string, string>();
for (const m of v2.materials) v2OfV3.set(v2Id(m.id), m.id);
for (const p of v2.products) v2OfV3.set(v2Id(p.id), p.id);
for (const s of v2.substances) if (!v2OfV3.has(v2Id(s.id))) v2OfV3.set(v2Id(s.id), s.id);
const order = (id: string) => v2OfV3.get(id) ?? `~${id}`;

/** Genus, epithet and the subspecies or variety, without authors; null for a genus alone («Liquidambar sp.»). */
function speciesKey(text: string): string | null {
  const t = norm(text).replace(/\(.*?\)/g, " ").replace(/×/g, " ").split(/\s+/).map((w) => w.replace(/[,]/g, "")).filter((w) => w && w !== "x");
  if (t.length < 2 || !known(text)) return null;
  const epithet = t[1].replace(/\.$/, "");
  if (["sp", "spp", "l", ""].includes(epithet)) return null;
  const infra = t.findIndex((w) => ["ssp.", "subsp.", "var.", "ssp", "subsp", "var"].includes(w));
  const rank = infra > 0 && t[infra + 1] ? ` ${t[infra].startsWith("var") ? "var." : "subsp."} ${t[infra + 1].replace(/[.,]$/, "")}` : "";
  return `${t[0]} ${epithet}${rank}`;
}
// One epithet that starts another, in the same genus, is the same species (ladanifer, ladaniferus).
const speciesOf = new Map<string, string>();
for (const r of byId.values()) {
  const key = r.kind === "natural" ? speciesKey(r.species) : null;
  if (key) speciesOf.set(r.id, key);
}
const keys = [...new Set(speciesOf.values())].sort((a, b) => a.length - b.length || a.localeCompare(b));
const canonical = new Map<string, string>();
for (const key of keys) {
  const shorter = keys.find((k) => k !== key && k.length >= 7 && !k.includes(" var.") && !k.includes(" subsp.") && !key.includes(" var.") && !key.includes(" subsp.") && key.split(" ")[0] === k.split(" ")[0] && key.startsWith(k));
  canonical.set(key, shorter ? (canonical.get(shorter) ?? shorter) : key);
}
for (const [id, key] of speciesOf) speciesOf.set(id, canonical.get(key)!);

const parent = new Map<string, string>();
const find = (id: string): string => {
  const p = parent.get(id) ?? id;
  if (p === id) return id;
  const root = find(p);
  parent.set(id, root);
  return root;
};
const union = (a: string, b: string) => {
  const [x, y] = [find(a), find(b)];
  if (x !== y) (order(x) < order(y) ? parent.set(y, x) : parent.set(x, y));
};
const linkBy = (keyOf: (r: Rec) => string | null) => {
  const first = new Map<string, string>();
  for (const r of [...byId.values()].sort((a, b) => order(a.id).localeCompare(order(b.id)))) {
    const key = keyOf(r);
    if (!key) continue;
    if (first.has(key)) union(first.get(key)!, r.id);
    else first.set(key, r.id);
  }
};
const SIN_IDENTIFICAR = uuidFor("v3:sin-identificar");
const grouped = [...byId.values()].filter((r) => r.id !== SIN_IDENTIFICAR);
const why = new Map<string, Set<string>>();
const mark = (id: string, rule: string) => why.set(id, (why.get(id) ?? new Set()).add(rule));
/** Links the materials that share a key, and notes the rule on those it linked. */
const because = (rule: string, keyOf: (r: Rec) => string | null) => {
  linkBy(keyOf);
  const count = new Map<string, number>();
  for (const r of grouped) {
    const key = keyOf(r);
    if (key) count.set(key, (count.get(key) ?? 0) + 1);
  }
  for (const r of grouped) if ((count.get(keyOf(r) ?? "") ?? 0) > 1) mark(r.id, rule);
};
// A product, with its material (V3-13: the options of each maker under the material).
for (const p of v2.products) {
  if (!byId.has(v2Id(p.id))) continue;
  union(to(v2Id(p.materialId)), v2Id(p.id));
  mark(v2Id(p.id), "producto");
  mark(to(v2Id(p.materialId)), "producto");
}
because("especie", (r) => speciesOf.get(r.id) ?? null);
because("CAS", (r) => (r.kind === "molecule" && r.cas ? `cas:${r.cas}` : null));
// A natural that does not say its species, by its CAS: with the species that has it, if only one does.
const speciesOfCas = new Map<string, Set<string>>();
for (const r of grouped) if (r.kind === "natural" && r.cas && speciesOf.has(r.id)) speciesOfCas.set(r.cas, (speciesOfCas.get(r.cas) ?? new Set()).add(speciesOf.get(r.id)!));
const speciesAnchor = new Map<string, string>();
for (const r of [...grouped].sort((a, b) => order(a.id).localeCompare(order(b.id)))) {
  const key = speciesOf.get(r.id);
  if (key && !speciesAnchor.has(key)) speciesAnchor.set(key, r.id);
}
because("CAS", (r) => {
  if (r.kind !== "natural" || speciesOf.has(r.id) || !r.cas) return null;
  const known = speciesOfCas.get(r.cas);
  return known?.size === 1 ? null : `cas-natural:${r.cas}`;
});
for (const r of grouped) {
  const only = r.kind === "natural" && !speciesOf.has(r.id) && r.cas ? speciesOfCas.get(r.cas) : undefined;
  if (only?.size === 1) {
    union(speciesAnchor.get([...only][0])!, r.id);
    mark(r.id, "CAS de una especie");
  }
}
because("nombre", (r) => norm(r.name));

const members = new Map<string, Rec[]>();
for (const r of grouped) members.set(find(r.id), [...(members.get(find(r.id)) ?? []), r]);
const capital = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);
/** The first words all the names share («Lavandin grosso», «Lavandin abrialis» → «Lavandin»); else, the shortest name. */
function shared(names: readonly string[]): string {
  const split = names.map((n) => n.replace(/\u200b/g, "").split(/\s+/));
  const bare = (w: string) => w.toLowerCase().replace(/[,;:]$/, "");
  let n = 0;
  while (split.every((w) => w[n] !== undefined && bare(w[n]) === bare(split[0][n]))) n++;
  const common = split[0].slice(0, n).join(" ").replace(/[,;:]$/, "");
  return common || [...names].sort((a, b) => a.length - b.length || a.localeCompare(b))[0].replace(/\u200b/g, "");
}
const categoryRows: Array<Record<string, Cell>> = [];
const review: Array<Record<string, Cell>> = [];
for (const list of members.values()) {
  list.sort((a, b) => order(a.id).localeCompare(order(b.id)));
  const plant = list.map((r) => speciesOf.get(r.id)).find((k) => k);
  const general = list.filter((r) => !r.supplier);
  const name = plant ? capital(plant) : shared((general.length ? general : list).map((r) => r.name));
  const id = uuidFor(`cat:${plant ? `especie:${plant}` : `material:${order(list[0].id)}`}`);
  for (const r of list) r.category_id = id;
  categoryRows.push({ id, name, aliases: [] });
  const RULES = ["producto", "especie", "CAS de una especie", "CAS", "nombre"];
  const rules = RULES.filter((rule) => list.length > 1 && list.some((r) => why.get(r.id)?.has(rule)));
  review.push({
    id, nombre: name, materiales: list.length, por: list.length === 1 ? "sola" : rules.join(", "),
    fichas: list.map((r) => `${order(r.id)} ${r.name.replace(/\u200b/g, "")}`).join(" | "),
  });
}

// ------------------------------------------------------------ write the batch
const materialRows = [...byId.values()];
writeTable(join(OUT, "material_categories.csv"), ["id", "name", "aliases"], categoryRows);
writeTable(join(OUT, "materials.csv"), materials.header, materialRows);
writeTable(join(OUT, "material_components.csv"), components.header, [...componentRows.values()]);
writeTable(join(OUT, "regulations.csv"), regulations.header, [...regulationRows.values()]);
writeTable("migracion-v3/categorias.csv", ["id", "nombre", "materiales", "por", "fichas"], review);
writeTable("migracion-v3/fusiones.csv", ["id", "id_v2", "nombre", "queda_id_v2", "queda_nombre", "queda_id", "decision"], fusions.map((f) => ({
  id: v2Id(f.gone.id), id_v2: f.gone.id, nombre: f.gone.name, queda_id_v2: f.keep.id, queda_nombre: f.keep.name, queda_id: v2Id(f.keep.id),
  decision: `${ANSWERS}, fila ${f.key}`,
})));

const sizes = [...members.values()].map((l) => l.length);
const biggest = [...review].sort((a, b) => Number(b.materiales) - Number(a.materiales) || String(a.nombre).localeCompare(String(b.nombre))).slice(0, 15);
const byRule = Object.entries(Object.groupBy(review.filter((r) => Number(r.materiales) > 1), (r) => String(r.por))).map(([k, v]) => `${v!.length} por ${k}`).join("; ");
const report = `# Tanda 4 · Las categorías y las fusiones

*Generada por \`migracion-v3/tanda-4-categorias.ts\` (plan, paso 4.8; V3-11, V3-13). Parte de lo que aprobaste en las tandas 1 a 3 (comprobado con su huella en \`aprobadas.csv\`) y de tus respuestas a \`conflictos/duplicados.csv\` (\`respuestas/duplicados.csv\`); la v2, del commit \`${src.commit}\`.*

**Qué cambia:** materiales, de ${before.materials} a ${materialRows.length}; composición, de ${before.components} a ${componentRows.size} filas; regulaciones, de ${before.regulations} a ${regulationRows.size}. Entran ${categoryRows.length} categorías (\`material_categories.csv\`), y cada material común lleva la suya (\`category_id\`), salvo «Sin identificar», que no se pesa.

## Las fusiones (${fusions.length}, las que decidiste)

Queda la ficha que elegiste, con su id, su nombre y sus campos. De la que se va: su nombre, a otros nombres; su CAS, si es otro, a otros CAS; sus campos solo llenan los vacíos. La composición y las regulaciones, la unión: de un mismo componente, la fila de más autoridad, y a igual autoridad, la de la ficha que queda. Lo que apuntaba a la que se va apunta a la que queda (\`migracion-v3/fusiones.csv\`).

${fusionReport.map((l) => `- ${l}`).join("\n")}

**No se fusionan** ${rows.length - fusions.length - 1} candidatos (tus respuestas), y el DPG de la app es **${answers.get("M02736+M02952")}** (la clave \`solv:dpg\` apuntará a él en la fase 7).

## Las categorías (${categoryRows.length})

**La regla** (propuesta de la sesión en V3-13, para que la revises en \`migracion-v3/categorias.csv\`):

- **Un producto**, con su material (los fabricantes, debajo de la molécula o de la forma).
- **Un natural**, por su especie: el género y el epíteto, con la subespecie o la variedad si la dice, sin autor. Un epíteto que empieza otro del mismo género es la misma especie (*Cistus ladanifer* y *ladaniferus*). La parte casi nunca está en los datos, así que hoy no separa nada.
- **Un natural que no dice su especie**, por su CAS: con la especie que lo tiene, si solo lo tiene una; si no, con los otros naturales de ese CAS.
- **Una molécula**, por su CAS.
- **El mismo nombre** junta lo demás (los isómeros que IFRA lista con un nombre).
- **El nombre de la categoría:** la especie, en un natural; si no, las primeras palabras que comparten todas sus fichas generales (sin fabricante), y si no comparten ninguna, el nombre más corto. Los otros nombres de la categoría quedan vacíos: el buscador encuentra por los de cada ficha.

**Cuántas:** ${sizes.filter((n) => n === 1).length} de una sola ficha y ${sizes.filter((n) => n > 1).length} de varias (${byRule}).

**Las más grandes**, para mirar si juntan de más:

${biggest.map((r) => `- **${r.nombre}** (${r.materiales}, por ${r.por})`).join("\n")}

**Lo que queda por hacer:** la forma de un natural (\`form\`, el segundo nivel de V3-13) sigue vacía; hoy el segundo nivel lo da el proceso.

**Para revisar** (${notes.length}):

${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "- Nada."}
`;
writeFileSync(join(OUT, "informe.md"), report, "utf8");
console.log(`Tanda 4: ${materialRows.length} materiales, ${categoryRows.length} categorías, ${fusions.length} fusiones; ${notes.length} notas. ${OUT}/informe.md`);
