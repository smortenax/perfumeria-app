/**
 * Batch 4 of the migration (plan v3, phase 4, step 4.8; V3-11, V3-13): the categories of the
 * search, and what is fused. Nothing is fused on its own: the candidates go, each with the
 * session's recommendation, to migracion-v3/conflictos/duplicados.csv; the user decides each
 * row, and their answers are written to migracion-v3/respuestas/duplicados.csv, which this
 * script reads (as the v2's batches did). Until every row has its answer, it writes nothing else.
 *
 *   node migracion-v3/tanda-4-categorias.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { parseCsvRecords } from "../src/data/csv.ts";
import type { Material as V2Material } from "../src/v2/model.ts";
import { writeTable } from "./lib/csv.ts";
import { known, readSources } from "./lib/fuentes.ts";

const CONFLICTS = "migracion-v3/conflictos/duplicados.csv";
const ANSWERS = "migracion-v3/respuestas/duplicados.csv";
const src = readSources();
const { v2 } = src;

const products = new Map<string, string[]>();
for (const p of v2.products) products.set(p.materialId, [...(products.get(p.materialId) ?? []), p.name]);
const hasProduct = (m: V2Material) => products.has(m.id);

/** A name as the search compares it: no invisible spaces, no case. */
const norm = (name: string) => name.normalize("NFKC").replace(/​/g, "").trim().toLowerCase();
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
  `${m.id} «${m.name.replace(/​/g, "")}» (CAS ${m.cas || "—"}; ${known(m.species) ?? "sin especie"}; ${known(m.process) ?? "sin proceso"}${hasProduct(m) ? `; producto: ${products.get(m.id)!.join(", ")}` : ""})`;
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
