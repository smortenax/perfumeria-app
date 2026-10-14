/**
 * Batch 5 of the migration (plan v3, phase 4, step 4.9; V3-15): your lab's materials, into your
 * account, not into the common data. Reads ../Perfumery/biblioteca/materiales.sqlite, read-only:
 * nothing is written there.
 *
 * First step: which common material each of yours is a version of (V3-5). The candidates go, each
 * with the session's recommendation, to migracion-v3/conflictos/laboratorio.csv; you decide each
 * row, and your answers are written to migracion-v3/respuestas/laboratorio.csv. Until every row
 * has its answer, it writes nothing else.
 *
 *   node migracion-v3/tanda-5-laboratorio.ts
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { parseCsvRecords } from "../src/data/csv.ts";
import { pctToFraction } from "./lib/cifras.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { readSources } from "./lib/fuentes.ts";
import { uuidFor, v2Id } from "./lib/ids.ts";

const LAB = "../Perfumery/biblioteca/materiales.sqlite";
const CONFLICTS = "migracion-v3/conflictos/laboratorio.csv";
const ANSWERS = "migracion-v3/respuestas/laboratorio.csv";
const lab = new DatabaseSync(LAB, { readOnly: true });
const labCommit = execSync("git -C ../Perfumery log -1 --format=%h -- biblioteca/materiales.sqlite", { encoding: "utf8" }).trim();
const src = readSources();
type LabRow = Record<string, string | number | null>;
const all = (sql: string) => lab.prepare(sql).all() as LabRow[];
const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));

// ------------------------------------------------------------ the common data, as the user approved it (v3/datos)
type Rec = Record<string, string>;
const common = parseCsvRecords(readFileSync("v3/datos/materials.csv", "utf8")) as Rec[];
const commonById = new Map(common.map((m) => [m.id, m]));
const v2Of = new Map<string, string>();
for (const m of src.v2.materials) v2Of.set(v2Id(m.id), m.id);
for (const p of src.v2.products) v2Of.set(v2Id(p.id), p.id);
for (const s of src.v2.substances) if (!v2Of.has(v2Id(s.id))) v2Of.set(v2Id(s.id), s.id);
const byV2 = new Map([...v2Of].map(([v3, v2]) => [v2, v3]));

/** Without accents, case or punctuation at the ends. */
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u200b/g, "").toLowerCase().trim();
const tokens = (s: string) => new Set(fold(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2));
const list = (r: Rec, column: string): string[] => JSON.parse(r[column] || "[]");

const byCas = new Map<string, Set<string>>();
const byName = new Map<string, Set<string>>();
const put = (map: Map<string, Set<string>>, key: string, id: string) => map.set(key, (map.get(key) ?? new Set()).add(id));
for (const m of common) {
  for (const cas of [m.cas, ...list(m, "other_cas")]) if (cas) put(byCas, cas, m.id);
  for (const name of [m.name, ...list(m, "aliases")]) put(byName, fold(name), m.id);
}
const CAS = /\b\d{2,7}-\d{2}-\d\b/g;

// ------------------------------------------------------------ your lab
const materials = all("select * from materials order by id");
const synonyms = new Map<string, string[]>();
for (const s of all("select material_id, name from material_synonyms order by name")) {
  synonyms.set(text(s.material_id), [...(synonyms.get(text(s.material_id)) ?? []), text(s.name)]);
}
const bottles = new Map(all("select * from user_materials").map((u) => [text(u.material_id), u]));
const productName = (bottle: LabRow) => text(bottle.product).replace(/\s*—\s*\[.*$/, "").trim();

const show = (id: string) => {
  const m = commonById.get(id)!;
  return `${v2Of.get(id) ?? id} «${m.name.replace(/\u200b/g, "")}»${m.supplier ? ` (${m.supplier})` : ""}${m.kind ? ` [${m.kind}]` : ""}`;
};

interface Row {
  readonly id: string;
  readonly kind: string;
  readonly candidates: readonly string[];
  readonly recommendation: string;
  readonly reason: string;
}
const rows: Row[] = materials.map((m) => {
  const id = text(m.id);
  const bottle = bottles.get(id);
  // Your names, your synonyms and the name of the product you have (without the lab's link to its research).
  const names = [text(m.name), ...(synonyms.get(id) ?? []), ...(bottle?.product ? [productName(bottle)] : [])];
  const byCasHits = new Set((text(m.cas).match(CAS) ?? []).flatMap((c) => [...(byCas.get(c) ?? [])]));
  const byNameHits = new Set(names.flatMap((n) => [...(byName.get(fold(n)) ?? [])]));
  const candidates = [...new Set([...byCasHits, ...byNameHits])].sort((a, b) => (v2Of.get(a) ?? a).localeCompare(v2Of.get(b) ?? b));
  const supplier = fold(text(bottle?.supplier));
  const kindNote = (target: string) => {
    const k = commonById.get(target)!.kind;
    return k !== text(m.kind) ? `; el laboratorio dice ${text(m.kind)} y el común ${k}: tu versión toma el del común` : "";
  };
  const pick = (target: string, why: string) => ({ id, kind: text(m.kind), candidates, recommendation: `versión de ${v2Of.get(target) ?? target}`, reason: why + kindNote(target) });

  // Your bottle is a product of the common data (the v2's products came from your notebook).
  const mine = candidates.filter((c) => {
    const s = fold(commonById.get(c)!.supplier ?? "");
    return s && supplier && (supplier.includes(s) || s.includes(supplier));
  });
  if (mine.length === 1) return pick(mine[0], `es tu producto de ${commonById.get(mine[0])!.supplier}`);
  const general = (hits: Set<string>) => [...hits].filter((c) => !commonById.get(c)!.supplier);
  for (const [hits, how] of [[byCasHits, "por CAS"], [byNameHits, "por nombre"]] as const) {
    const g = general(hits);
    if (g.length === 1) return pick(g[0], `el único material general que casa ${how}`);
  }
  const g = general(new Set(candidates));
  if (g.length > 1) {
    const mineTokens = new Set(names.concat(text(bottle?.product)).flatMap((n) => [...tokens(n)]));
    const score = (c: string) => {
      const r = commonById.get(c)!;
      return Math.max(...[r.name, ...list(r, "aliases")].map((n) => [...tokens(n)].filter((t) => mineTokens.has(t)).length));
    };
    const ranked = g.map((c) => [c, score(c)] as const).sort((a, b) => b[1] - a[1]);
    const tie = ranked.length > 1 && ranked[0][1] === ranked[1][1];
    return pick(ranked[0][0], `de ${g.length} materiales generales que casan, el que más palabras comparte con tus nombres${tie ? " (empata con otro: míralo)" : ""}`);
  }
  return { id, kind: text(m.kind), candidates, recommendation: "material nuevo", reason: candidates.length ? "solo casa con productos de otras tiendas" : "no casa con ningún común, ni por CAS ni por nombre" };
});

writeTable(CONFLICTS, ["id", "nombre", "tipo", "cas_del_laboratorio", "tu_producto", "candidatos", "recomendacion", "motivo"], rows.map((r) => {
  const m = materials.find((x) => text(x.id) === r.id)!;
  const bottle = bottles.get(r.id);
  return {
    id: r.id, nombre: text(m.name), tipo: r.kind, cas_del_laboratorio: text(m.cas),
    tu_producto: bottle ? `${text(bottle.supplier)}: ${productName(bottle)}` : "",
    candidatos: r.candidates.map(show).join(" | "), recomendacion: r.recommendation, motivo: r.reason,
  };
}));

const answers = new Map(existsSync(ANSWERS) ? parseCsvRecords(readFileSync(ANSWERS, "utf8")).map((r) => [r.id, r.respuesta.trim()]) : []);
const invalid = rows.filter((r) => {
  const a = answers.get(r.id);
  return a !== undefined && a !== "material nuevo" && !(a.startsWith("versión de ") && byV2.has(a.slice("versión de ".length)) && commonById.has(byV2.get(a.slice("versión de ".length))!));
});
const pending = rows.filter((r) => !answers.has(r.id));
const count = (f: (r: Row) => boolean) => rows.filter(f).length;
console.log(`Tanda 5: ${rows.length} materiales del laboratorio (commit ${labCommit}) en ${CONFLICTS}.`);
console.log(`Recomendación: ${count((r) => r.reason.startsWith("es tu producto"))} tu producto, ${count((r) => r.reason.startsWith("el único"))} el único general, ${count((r) => r.reason.startsWith("de "))} entre varios, ${count((r) => r.recommendation === "material nuevo")} nuevos.`);
if (invalid.length) throw new Error(`Respuestas que no valen: ${invalid.map((r) => `${r.id}: «${answers.get(r.id)}»`).join("; ")}`);
if (pending.length) {
  console.log(`Faltan ${pending.length} respuestas en ${ANSWERS}: no se escribe la tanda.`);
  process.exit(0);
}
console.log("Todas contestadas.");

// ================================================================ second step: your materials, for your account
// Nothing here goes to v3/datos/ (the common data): it is loaded into your account by
// migracion-v3/cargar-laboratorio.ts, with your owner_id, once you approve it.
const OUT = "migracion-v3/tandas/5-laboratorio";
const notes: string[] = [];
const TIER: Readonly<Record<string, string>> = { top: "top", "top-heart": "top_heart", heart: "heart", "heart-base": "heart_base", base: "base" };
const STRENGTH: Readonly<Record<string, string>> = { bajo: "low", medio: "medium", alto: "high", "muy alto": "very_high" };
const ROLE: Readonly<Record<string, string>> = { estructura: "structure", modificador: "modifier", traza: "trace", fijador: "fixative", puente: "bridge", booster: "booster" };
const CONFIDENCE: Readonly<Record<string, string>> = { alta: "high", media: "medium", baja: "low" };
const DOSE_AUTHORITY: Readonly<Record<string, string>> = { consensus: "consensus", literature: "literature", supplier: "product" };
/** A conflict of the lab, by the v3's name of its field (V3-17); the lab's physical data do not enter, nor their conflicts. */
const DISPUTED: Readonly<Record<string, string | null>> = {
  tenacity_h: "tenacity", family: "family_detail", ifra: "ifra_unverified", dosage: null, state: null, density: null,
  melting_point_c: null, solubility: null, molecular_weight: null,
};

/** A number of the lab as a decimal, never in exponent notation, and then a fraction of 1 (V3-14: a dose is a fraction). */
function fraction(pct: unknown): string | null {
  if (pct === null || pct === undefined) return null;
  const n = Number(pct);
  const decimal = String(n).includes("e") ? n.toFixed(20).replace(/0+$/, "").replace(/\.$/, "") : String(n);
  return pctToFraction(decimal);
}
const hours = (h: unknown) => (h === null || h === undefined ? null : `${String(Number(h)).replace(".", ",")} h, según el laboratorio`);
const optional = (map: Readonly<Record<string, string>>, value: unknown, field: string, id: string): string | null => {
  const t = text(value).trim();
  if (!t) return null;
  const hit = map[t] ?? Object.entries(map).find(([k]) => t.startsWith(`${k} `))?.[1];
  if (!hit) notes.push(`${id}: ${field} «${t}» no está en la escala de la v3; queda vacío.`);
  else if (!map[t]) notes.push(`${id}: ${field} «${t}» se lee como «${hit}».`);
  return hit ?? null;
};

const pendingConflicts = new Map<string, string[]>();
for (const c of all("select material_id, field from conflicts where status = 'pendiente' order by field")) {
  pendingConflicts.set(text(c.material_id), [...(pendingConflicts.get(text(c.material_id)) ?? []), text(c.field)]);
}
const ifraEntries = new Map<string, LabRow[]>();
for (const e of all("select * from ifra_entries order by standard")) ifraEntries.set(text(e.material_id), [...(ifraEntries.get(text(e.material_id)) ?? []), e]);
let conditionsLeft = 0;
/** V3-32: the kind, the standard and the condition, without figures; a condition with figures stays in the lab. */
function unverified(id: string): string | null {
  const entries = ifraEntries.get(id) ?? [];
  if (!entries.length) return null;
  return entries.map((e) => {
    const kind = text(e.kind).trim();
    const condition = text(e.condition).trim();
    const keep = condition && !/\d/.test(condition);
    if (condition && !keep) conditionsLeft++;
    const head = kind === "sin verificar" ? "Sin verificar" : `${kind.charAt(0).toUpperCase()}${kind.slice(1)}${text(e.standard) ? `, STD ${text(e.standard)}` : ""}`;
    return `${head}${keep ? `: ${condition}` : ""}${kind === "sin verificar" ? "" : " · sin verificar"}`;
  }).join(" | ");
}

const MATERIAL_COLUMNS = [
  "id", "owner_id", "name", "kind", "solvent", "aliases", "cas", "other_cas", "species", "part", "process", "chemotype", "inci",
  "category_id", "form", "based_on_id", "grade", "supplier", "house", "code", "odor_target", "synthesis", "isomers", "family_detail",
  "facets", "tier", "evolution", "tenacity", "strength", "threshold", "diffusion", "blend_effect", "role", "recommended_dilution",
  "sources", "confidence", "disputed_fields", "ifra_unverified",
] as const;
const mine = (labId: string) => uuidFor(`lab:${labId}`);
const materialRows: Array<Record<string, Cell>> = [];
const doseRows: Array<Record<string, Cell>> = [];
const haveRows: Array<Record<string, Cell>> = [];
let versions = 0;
let dosesWithoutFigures = 0;
for (const m of materials) {
  const id = text(m.id);
  const answer = answers.get(id)!;
  const base = answer === "material nuevo" ? null : byV2.get(answer.slice("versión de ".length))!;
  const of = base ? commonById.get(base)! : null;
  if (of) versions++;
  const bottle = bottles.get(id);
  const value = (column: string) => text(m[column]).trim() || null;
  const casList = text(m.cas).match(CAS) ?? [];
  const roleText = text(m.role).trim();
  const disputed = [...new Set((pendingConflicts.get(id) ?? []).map((f) => (f in DISPUTED ? DISPUTED[f] : f)).filter((f): f is string => f !== null))];
  materialRows.push({
    id: mine(id), owner_id: null, name: text(m.name).trim(),
    // Your version takes the kind of its common (V3-5); a new one, the lab's.
    kind: of ? of.kind : text(m.kind),
    solvent: of ? of.solvent === "true" || roleText === "disolvente" : roleText === "disolvente",
    aliases: [...new Set(synonyms.get(id) ?? [])].filter((n) => fold(n) !== fold(text(m.name))),
    // What the material is, only for a new one: your version inherits it from its common.
    cas: of ? null : (casList[0] ?? null), other_cas: of ? [] : casList.slice(1),
    species: of ? null : value("species"), part: of ? null : value("part"), process: of ? null : value("process"),
    chemotype: of ? null : value("chemotype"), inci: of ? null : value("inci"),
    category_id: of ? of.category_id || null : null, form: value("form"), based_on_id: base,
    grade: text(bottle?.grade).trim() || null, supplier: text(bottle?.supplier).trim() || null,
    house: value("house"), code: value("code"), odor_target: value("odor_target"),
    synthesis: value("synthesis"), isomers: value("isomers"),
    family_detail: value("family"), facets: value("facets"),
    tier: optional(TIER, m.tier, "piso", id), evolution: value("evolution"), tenacity: hours(m.tenacity_h),
    strength: optional(STRENGTH, m.strength, "potencia", id), threshold: value("threshold"), diffusion: value("diffusion"),
    blend_effect: value("blend_effect"), role: roleText === "disolvente" ? null : optional(ROLE, m.role, "función", id),
    recommended_dilution: value("recommended_dilution"), sources: text(m.sources).trim() ? `lab: ${text(m.sources).trim()}` : "lab",
    confidence: optional(CONFIDENCE, m.confidence, "confianza", id), disputed_fields: disputed, ifra_unverified: unverified(id),
  });
  if (bottle) haveRows.push({ id: uuidFor(`lab-have:${id}`), user_id: null, material_id: mine(id) });
}
const BASIS = (b: string) => (b.startsWith("% del concentrado") ? "concentrate" : b.startsWith("% del producto terminado") ? "finished_product" : b.startsWith("sin declarar") ? "undeclared" : null);
for (const d of all("select * from material_dosages order by material_id, kind, basis, min_pct, typical_pct, max_pct, text")) {
  const id = text(d.material_id);
  const [min, typical, max] = [fraction(d.min_pct), fraction(d.typical_pct), fraction(d.max_pct)];
  if (min === null && typical === null && max === null) {
    dosesWithoutFigures++;
    continue;
  }
  const basis = BASIS(text(d.basis));
  if (!basis) {
    notes.push(`${id}: una dosis con base «${text(d.basis)}», que no es de la v3; no entra.`);
    continue;
  }
  const key = JSON.stringify([id, d.kind, d.basis, d.min_pct, d.typical_pct, d.max_pct, d.text, d.sources]);
  const said = [text(d.text).trim(), text(d.confidence) ? `confianza: ${text(d.confidence)}` : "", basis === "undeclared" && text(d.basis) !== "sin declarar" ? `base: ${text(d.basis)}` : ""].filter((t) => t);
  doseRows.push({
    id: uuidFor(`lab-dose:${key}`), owner_id: null, material_id: mine(id), min, typical, max, basis,
    authority: DOSE_AUTHORITY[text(d.kind)] ?? "consensus", source: text(d.sources).trim() ? `lab: ${text(d.sources).trim()}` : "lab",
    disputed: (pendingConflicts.get(id) ?? []).includes("dosage"), notes: said.join(" · ") || null,
  });
}

writeTable(join(OUT, "materials.csv"), MATERIAL_COLUMNS, materialRows);
writeTable(join(OUT, "material_doses.csv"), ["id", "owner_id", "material_id", "min", "typical", "max", "basis", "authority", "source", "disputed", "notes"], doseRows);
writeTable(join(OUT, "lab_materials.csv"), ["id", "user_id", "material_id"], haveRows);

const tally = (rows: ReadonlyArray<Record<string, Cell>>, f: (r: Record<string, Cell>) => boolean) => rows.filter(f).length;
const report = `# Tanda 5 · Tus materiales del laboratorio, en tu cuenta

*Generada por \`migracion-v3/tanda-5-laboratorio.ts\` desde \`../Perfumery/biblioteca/materiales.sqlite\` (commit \`${labCommit}\` del laboratorio, abierto solo para leer) y tus respuestas a \`conflictos/laboratorio.csv\` (\`respuestas/laboratorio.csv\`). **No va a \`v3/datos/\`**: es tuyo (V3-15). Con tu visto bueno, \`migracion-v3/cargar-laboratorio.ts\` lo carga en tu cuenta, con tu \`owner_id\`.*

**Qué entra** (V3-15, V3-18, V3-32, V3-33):

- **${materialRows.length} materiales tuyos** (\`materials.csv\`): ${versions} versiones de un común (\`based_on_id\`, V3-5), con la categoría de su común, y ${materialRows.length - versions} nuevos. Tu versión hereda del común lo que el material es (CAS, especie, proceso…), su composición y su IFRA, y no los repite; un material nuevo lleva los suyos.
- **Tu ficha:** tu nombre y tus sinónimos (${tally(materialRows, (r) => (r.aliases as string[]).length > 0)} con otros nombres); tu familia en texto libre, a \`family_detail\` (V3-18: la familia cerrada la hereda del común); facetas, piso, evolución, potencia, umbral, difusión, efecto en la mezcla, función (en inglés, como el esquema), dilución recomendada, fuentes y confianza; la tenacidad, como texto («400 h, según el laboratorio»); tu tienda y tu grado, de tus frascos.
- **El disolvente es una marca** (V3-12): la función «disolvente» del laboratorio pasa a \`solvent\` (${tally(materialRows, (r) => r.solvent === true)} materiales).
- **El IFRA de segunda mano** (V3-32), en \`ifra_unverified\`, en ${tally(materialRows, (r) => r.ifra_unverified !== null)} materiales: el tipo y el estándar, «· sin verificar», y la condición solo si no lleva cifras. **${conditionsLeft} notas de condición llevan cifras** (límites copiados de tiendas y glosarios) **y se quedan en el laboratorio**: «sin la cifra».
- **En disputa** (V3-17): ${tally(materialRows, (r) => (r.disputed_fields as string[]).length > 0)} materiales con algún campo de conflicto pendiente en el laboratorio; los del estado físico (densidad, punto de fusión…) no entran, porque esos datos tampoco.
- **Tus dosis** (\`material_doses.csv\`, ${doseRows.length}): con su base (del concentrado, del producto terminado o «sin declarar»), en fracción; la autoridad, la del laboratorio (consenso, literatura; la de una tienda, \`product\`). ${tally(doseRows, (r) => r.disputed === true)} en disputa. **${dosesWithoutFigures} dosis sin ninguna cifra** (solo texto) **no entran**: el esquema pide al menos una.
- **Lo que tengo** (\`lab_materials.csv\`, ${haveRows.length}): tus frascos de \`user_materials\`, sin la dilución de compra.

**Lo que no entra todavía:** la composición del laboratorio (V3-33); tu cata, tus ejes y tus frascos preparados (la capa del usuario, plan §46); los descriptores, las relaciones, los perfumes de referencia y el estado físico (después, V3-14); la procedencia, el coste, la manipulación y la monografía, que no tienen columna en la v3.

**Para revisar** (${notes.length}):

${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "- Nada."}
`;
writeFileSync(join(OUT, "informe.md"), report, "utf8");
console.log(`Tanda 5: ${materialRows.length} materiales (${versions} versiones), ${doseRows.length} dosis, ${haveRows.length} «lo tengo»; ${notes.length} notas. ${OUT}/informe.md`);
