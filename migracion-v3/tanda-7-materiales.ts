/**
 * Batch 7 of the migration (plan v3, phase 4, step 4.5; V3-34, V3-36): the lab's materials as the
 * COMMON materials of the v3 (owner_id empty), with their general, non-personal information only.
 * Reads ../Perfumery/biblioteca/materiales.sqlite, read-only: nothing is written there.
 *
 * Unlike batch 5 (draft of the same mapping for the user's account), these rows are not versions
 * (no based_on_id) and carry the identity of each material (cas, species, part, process…). The
 * user's own tables (user_materials, user_bottles, user_evaluations, user_material_axes) do not
 * enter here: they go to the user's version in a later batch (V3-36).
 *
 * The abbreviation (V3-37) and the closed family (V3-18, V3-38) come from the v1's glossary row
 * of each material's v2 pair (migracion-v3/respuestas/laboratorio.csv, datos/v2/v1-a-v2.csv).
 *
 *   node migracion-v3/tanda-7-materiales.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { parseCsvRecords } from "../src/data/csv.ts";
import { pctToFraction } from "./lib/cifras.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { many, readSources, type Row } from "./lib/fuentes.ts";
import { uuidFor } from "./lib/ids.ts";

const LAB = "../Perfumery/biblioteca/materiales.sqlite";
const ANSWERS = "migracion-v3/respuestas/laboratorio.csv";
const OUT = "migracion-v3/tandas/7-materiales";

/**
 * Batch 5 dropped the lab's conflicts on physical data because that data did not enter. Here it
 * does (V3-36), so by V3-17 a datum in dispute must leave marked as such: true keeps them. Set it
 * to false to drop them again, as batch 5 did.
 */
const PHYSICAL_DISPUTES = true;

const lab = new DatabaseSync(LAB, { readOnly: true });
const labCommit = execSync("git -C ../Perfumery log -1 --format=%h -- biblioteca/materiales.sqlite", { encoding: "utf8" }).trim();
const labDirty = execSync("git -C ../Perfumery status --porcelain -- biblioteca/materiales.sqlite", { encoding: "utf8" }).trim() !== "";
const src = readSources();
type LabRow = Record<string, string | number | null>;
const all = (sql: string) => lab.prepare(sql).all() as LabRow[];
const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const count = (sql: string) => Number(all(sql)[0].c);

// ------------------------------------------------------------ the review list, by heading (in this order)
const HEADINGS = [
  "Valores fuera de escala",
  "Abreviaturas",
  "Familias",
  "CAS",
  "Texto que parece del usuario o de su tienda",
  "En disputa",
  "IFRA sin verificar",
  "Duplicados fusionados y dosis",
  "Otros",
] as const;
type Heading = (typeof HEADINGS)[number];
const review = new Map<Heading, string[]>(HEADINGS.map((h) => [h, []]));
const note = (heading: Heading, message: string) => review.get(heading)!.push(message);

// ------------------------------------------------------------ closed lists and scales (as in batches 1 and 5)
const FAMILY: Readonly<Record<string, string>> = {
  Cítrico: "citrus", Verde: "green", Ozónico: "ozonic", Floral: "floral", Frutal: "fruity",
  Especiado: "spicy", Amaderado: "woody", Animal: "animal", Transformado: "transformed",
};
const TIER: Readonly<Record<string, string>> = { top: "top", "top-heart": "top_heart", heart: "heart", "heart-base": "heart_base", base: "base" };
const STRENGTH: Readonly<Record<string, string>> = { bajo: "low", medio: "medium", alto: "high", "muy alto": "very_high" };
const ROLE: Readonly<Record<string, string>> = { estructura: "structure", modificador: "modifier", traza: "trace", fijador: "fixative", puente: "bridge", booster: "booster" };
const CONFIDENCE: Readonly<Record<string, string>> = { alta: "high", media: "medium", baja: "low" };
const DOSE_AUTHORITY: Readonly<Record<string, string>> = { consensus: "consensus", literature: "literature", supplier: "product" };
const KINDS = new Set(["molecule", "natural", "composition"]);
const SYNTHESIS = new Set(["synthetic", "natural", "semisynthetic"]);
/** A conflict of the lab, by the v3's name of its field (V3-17); null: it does not travel on the material. */
const DISPUTED: Readonly<Record<string, string | null>> = {
  tenacity_h: "tenacity_hours", family: "family_detail", ifra: "ifra_unverified", dosage: null,
  state: PHYSICAL_DISPUTES ? "physical_state" : null,
  density: PHYSICAL_DISPUTES ? "density" : null,
  melting_point_c: PHYSICAL_DISPUTES ? "melting_point_c" : null,
  solubility: PHYSICAL_DISPUTES ? "solubility" : null,
  molecular_weight: PHYSICAL_DISPUTES ? "molecular_weight" : null,
};
/** V3-42: the lab's schema (esquema.sql) says «horas en tira, material puro (escala TGSC)». */
const TENACITY_SOURCE = "lab: horas en tira, material puro, escala TGSC";

const CAS = /\b\d{2,7}-\d{2}-\d\b/g;
/** For comparing names: no accents, case or punctuation. */
const nameKey = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/** A number of the lab as an exact decimal string, never in exponent notation. */
function exactDecimal(n: number): string {
  if (!Number.isFinite(n)) throw new Error(`Número que no vale: ${n}`);
  const s = String(n).toLowerCase();
  if (!s.includes("e")) return s;
  const [mantissa, exponent] = s.split("e");
  const sign = mantissa.startsWith("-") ? "-" : "";
  const [int, frac = ""] = mantissa.replace("-", "").split(".");
  const digits = int + frac;
  const point = int.length + Number(exponent);
  if (point <= 0) return `${sign}0.${"0".repeat(-point)}${digits}`;
  if (point >= digits.length) return `${sign}${digits}${"0".repeat(point - digits.length)}`;
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

/** A number of the lab as an exact decimal; with `positive`, it has to be above zero, else null with a note. */
function decimal(value: unknown, id: string, field: string, kind: "positive" | "any"): string | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (kind === "positive" && !(n > 0)) {
    note("Valores fuera de escala", `${id}: ${field} vale ${text(value)}, que no es mayor que cero; queda vacío.`);
    return null;
  }
  return exactDecimal(n);
}

const optional = (map: Readonly<Record<string, string>>, value: unknown, field: string, id: string): string | null => {
  const t = text(value).trim();
  if (!t) return null;
  const hit = map[t] ?? Object.entries(map).find(([k]) => t.startsWith(`${k} `))?.[1];
  if (!hit) note("Valores fuera de escala", `${id}: ${field} «${t}» no está en la escala de la v3; queda vacío.`);
  else if (!map[t]) note("Valores fuera de escala", `${id}: ${field} «${t}» se lee como «${hit}».`);
  return hit ?? null;
};

// ------------------------------------------------------------ the lab
const materials = all("select * from materials order by id");
const ids = new Set(materials.map((m) => text(m.id)));
if (materials.some((m) => m.owner_id !== null)) throw new Error("Hay materiales del laboratorio con owner_id: no son globales.");
const common = (labId: string) => uuidFor(`comun:${labId}`);
const grouped = (sql: string, key: string, valueOf: (r: LabRow) => string) => {
  const map = new Map<string, string[]>();
  for (const r of all(sql)) map.set(text(r[key]), [...(map.get(text(r[key])) ?? []), valueOf(r)]);
  return map;
};
const synonyms = grouped("select material_id, name from material_synonyms order by name", "material_id", (r) => text(r.name));
const physical = new Map(all("select * from material_physical").map((p) => [text(p.material_id), p]));
const pendingConflicts = grouped("select material_id, field from conflicts where status = 'pendiente' order by field", "material_id", (r) => text(r.field));
const ifraEntries = new Map<string, LabRow[]>();
for (const e of all("select * from ifra_entries order by standard")) ifraEntries.set(text(e.material_id), [...(ifraEntries.get(text(e.material_id)) ?? []), e]);

// ------------------------------------------------------------ each material's v2 pair, and the v1 row it leads to
const answers = new Map(parseCsvRecords(readFileSync(ANSWERS, "utf8")).map((r) => [r.id, r.respuesta.trim()]));
const v2Materials = new Map(src.v2.materials.map((m) => [m.id, m]));
const v2Products = new Map(src.v2.products.map((p) => [p.id, p]));

interface PairRow {
  readonly v1Id: string;
  readonly row: Row;
  readonly confirmedOn: string;
}
interface Pair {
  /** «M00050», «P00025» or null for «material nuevo». */
  readonly target: string | null;
  readonly materialId: string | null;
  readonly rows: readonly PairRow[];
}
function pairOf(labId: string): Pair {
  const answer = answers.get(labId);
  if (answer === undefined) throw new Error(`Falta la respuesta de ${labId} en ${ANSWERS}`);
  if (answer === "material nuevo") return { target: null, materialId: null, rows: [] };
  const target = answer.startsWith("versión de ") ? answer.slice("versión de ".length) : "";
  const materialId = v2Products.get(target)?.materialId ?? (v2Materials.has(target) ? target : null);
  if (!materialId) throw new Error(`${labId}: la respuesta «${answer}» no apunta a un material ni a un producto de la v2`);
  const rows: PairRow[] = [];
  for (const link of src.v2.v1Links) {
    if (link.v2Id !== materialId && link.productId !== target) continue;
    const row = src.v1.get(link.v1Id);
    if (row && !rows.some((r) => r.v1Id === link.v1Id)) rows.push({ v1Id: link.v1Id, row, confirmedOn: link.confirmedOn });
  }
  return { target, materialId, rows };
}

/** Every name of a v1 row the search finds it by, except its code (the abbreviation has its own column, V3-37). */
function v1Names(r: Row): string[] {
  return [
    r.nombre_comercial, r.sigla_comercial, r.icono_distintivo && r.sigla_comercial ? `${r.icono_distintivo}${r.sigla_comercial}` : "",
    ...many(r.otros_nombres_comerciales), r.nombre, ...many(r.nombre_ifra), ...many(r.sinonimos), ...many(r.nombres_transparencia),
    ...many(r.sinonimos_pubchem), ...many(r.nombres_proveedores),
  ].filter((n) => n);
}

/**
 * Which row of the pair gives the abbreviation when there are several with a code: the user's own
 * first (V3-37), then the one whose name is a name of the lab's material, then the first in the file.
 */
function chooseRow(labNames: ReadonlySet<string>, pair: Pair): { chosen: PairRow | null; others: PairRow[] } {
  const withCode = pair.rows.filter((r) => r.row.codigo);
  const score = (r: PairRow) => {
    if ([r.row.nombre, r.row.nombre_comercial].some((n) => n && labNames.has(nameKey(n)))) return 2;
    return [...many(r.row.otros_nombres_comerciales), ...many(r.row.nombre_ifra), ...many(r.row.sinonimos)].some((n) => labNames.has(nameKey(n))) ? 1 : 0;
  };
  const ranked = withCode
    .map((r, i) => ({ r, i, user: r.row.codigo_origen === "usuario" ? 1 : 0, s: score(r) }))
    .sort((a, b) => b.user - a.user || b.s - a.s || a.i - b.i);
  return { chosen: ranked[0]?.r ?? null, others: ranked.slice(1).map((x) => x.r) };
}

// ------------------------------------------------------------ the IFRA of second hand (V3-32), as in batch 5
let conditionsLeft = 0;
/** The kind, the standard and the condition, without figures; a condition with figures stays in the lab. */
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

// ------------------------------------------------------------ the material rows
const MATERIAL_COLUMNS = [
  "id", "owner_id", "name", "kind", "solvent", "aliases", "cas", "other_cas", "species", "part", "process", "chemotype", "inci", "origin",
  "abbreviation", "abbreviation_origin", "category_id", "form", "based_on_id", "grade", "supplier", "product", "product_url", "purity",
  "house", "code", "odor_target", "synthesis", "isomers", "family", "color", "family_detail", "facets", "tier", "tenacity_hours",
  "tenacity_source", "evolution_to_15m", "evolution_to_2h", "evolution_to_8h", "evolution_to_24h", "evolution_beyond_24h", "strength",
  "threshold", "diffusion", "blend_effect", "role", "recommended_dilution", "cost", "handling", "physical_state", "appearance", "stains",
  "solubility", "density", "melting_point_c", "formula", "molecular_weight", "vapor_pressure", "stability", "incompatibilities",
  "physical_sources", "notes", "sources", "confidence", "disputed_fields", "ifra_unverified",
] as const;

interface Trace {
  readonly labId: string;
  readonly pair: string;
  readonly v1Id: string;
  readonly abbreviation: string | null;
  readonly origin: string | null;
  readonly family: string | null;
}
const materialRows: Array<Record<string, Cell>> = [];
const traces: Trace[] = [];
const usedAbbreviations = new Map<string, string>();
let aliasesFromPair = 0;
let synonymsMergedByCase = 0;
let multiRowPairs = 0;

for (const m of materials) {
  const id = text(m.id);
  const value = (column: string) => text(m[column]).trim() || null;
  const kind = text(m.kind);
  if (!KINDS.has(kind)) throw new Error(`${id}: tipo «${kind}» que no entra en lo común`);
  const roleText = text(m.role).trim();
  const name = text(m.name).trim();

  // The pair, the abbreviation and the family.
  const pair = pairOf(id);
  const labSynonyms = synonyms.get(id) ?? [];
  const labNames = new Set([name, ...labSynonyms].map(nameKey).filter((k) => k));
  const { chosen, others } = chooseRow(labNames, pair);
  let abbreviation: string | null = chosen?.row.codigo ?? null;
  let abbreviationOrigin: string | null = chosen ? (chosen.row.codigo_origen === "usuario" ? "user" : "generated") : null;
  const pairLabel = pair.target ? (v2Products.has(pair.target) ? `${pair.target} (material ${pair.materialId})` : pair.target) : "material nuevo";
  if (!pair.target) note("Abreviaturas", `${id}: sin pareja en la v2 («material nuevo»): sin abreviatura ni familia; no se inventa.`);
  else if (!pair.rows.length) note("Abreviaturas", `${id}: su pareja ${pairLabel} no tiene ninguna fila en la v1 (datos/v2/v1-a-v2.csv): sin abreviatura ni familia.`);
  else if (!chosen) note("Abreviaturas", `${id}: las filas de la v1 de su pareja (${pair.rows.map((r) => r.v1Id).join(", ")}) no tienen código: sin abreviatura.`);
  if (others.length) {
    multiRowPairs++;
    note("Abreviaturas", `${id}: su pareja ${pairLabel} tiene ${others.length + 1} filas con código en la v1; se toma «${chosen!.row.codigo}» (${chosen!.v1Id}) y no ${others.map((o) => `«${o.row.codigo}» (${o.v1Id})`).join(", ")}.`);
  }
  if (chosen && chosen.row.codigo_origen !== "usuario") {
    note("Abreviaturas", `${id}: la abreviatura «${chosen.row.codigo}» (${chosen.v1Id}) es generada, provisional.`);
  }
  if (abbreviation) {
    const holder = usedAbbreviations.get(abbreviation);
    if (holder) {
      note("Abreviaturas", `${id}: «${abbreviation}» ya es la de ${holder} (misma sigla en la v1); aquí queda vacía.`);
      abbreviation = null;
      abbreviationOrigin = null;
    } else usedAbbreviations.set(abbreviation, id);
  }
  const families = [...new Set([chosen, ...pair.rows].map((r) => r?.row.familia ?? "").filter((f) => f))];
  if (families.length > 1) note("Familias", `${id}: las filas de la v1 de su pareja dan varias familias (${families.join(", ")}); se toma «${families[0]}».`);
  const family = families[0] ? (FAMILY[families[0]] ?? null) : null;
  if (families[0] && !family) note("Familias", `${id}: familia de la v1 fuera de las nueve de P48: «${families[0]}»; queda vacía.`);
  if (pair.rows.length && !families.length) note("Familias", `${id}: la v1 no da familia para su pareja ${pairLabel}; queda vacía.`);
  traces.push({ labId: id, pair: pairLabel, v1Id: chosen?.v1Id ?? pair.rows.map((r) => r.v1Id).join(" "), abbreviation, origin: abbreviationOrigin, family });

  // Other names: the lab's synonyms, then the pair's (the v2 material's name and the v1 rows').
  const pairNames = [...(pair.materialId ? [v2Materials.get(pair.materialId)!.name] : []), ...pair.rows.flatMap((r) => v1Names(r.row))];
  const seen = new Set([name.toLowerCase()]);
  const aliases: string[] = [];
  for (const [n, fromPair] of [...labSynonyms.map((s) => [s, false] as const), ...pairNames.map((s) => [s, true] as const)]) {
    const t = n.trim();
    if (!t) continue;
    if (seen.has(t.toLowerCase())) {
      if (!fromPair && t !== name) synonymsMergedByCase++;
      continue;
    }
    seen.add(t.toLowerCase());
    aliases.push(t);
    if (fromPair) aliasesFromPair++;
  }

  // CAS: the first the regex finds in the lab's text, then the rest without repeats.
  const casText = text(m.cas).trim();
  const casList = [...new Set(casText.match(CAS) ?? [])];
  if (casText && !casList.length) note("CAS", `${id}: el texto de CAS del laboratorio no trae ningún CAS («${casText}»): queda vacío.`);
  else if (casText && casText.replace(CAS, "").replace(/[\s/;,]+/g, "") !== "") note("CAS", `${id}: el texto de CAS lleva más que los números (se pierde lo que no es CAS): «${casText}»`);

  const ph = physical.get(id);
  const phValue = (column: string) => text(ph?.[column]).trim() || null;
  const density = decimal(ph?.density, id, "la densidad", "positive");
  const molecularWeight = decimal(ph?.molecular_weight, id, "el peso molecular", "positive");
  const tenacityHours = decimal(m.tenacity_h, id, "la tenacidad", "positive");
  const synthesis = value("synthesis");
  if (synthesis && !SYNTHESIS.has(synthesis)) note("Valores fuera de escala", `${id}: síntesis «${synthesis}» no es de la v3; queda vacía.`);
  if (value("evolution")) note("Otros", `${id}: el laboratorio ya trae evolución («${value("evolution")}»); aquí las cinco columnas quedan vacías, hay que repartirla.`);

  const disputed = [...new Set((pendingConflicts.get(id) ?? []).map((f) => (f in DISPUTED ? DISPUTED[f] : f)).filter((f): f is string => f !== null))].sort();
  const sources = text(m.sources).trim();

  materialRows.push({
    id: common(id), owner_id: null, name, kind, solvent: roleText === "disolvente", aliases,
    cas: casList[0] ?? null, other_cas: casList.slice(1),
    species: value("species"), part: value("part"), process: value("process"), chemotype: value("chemotype"), inci: value("inci"), origin: value("origin"),
    abbreviation, abbreviation_origin: abbreviationOrigin, category_id: null, form: value("form"), based_on_id: null,
    grade: null, supplier: null, product: null, product_url: null, purity: null,
    house: value("house"), code: value("code"), odor_target: value("odor_target"),
    synthesis: synthesis && SYNTHESIS.has(synthesis) ? synthesis : null, isomers: value("isomers"),
    family, color: null, family_detail: value("family"), facets: value("facets"), tier: optional(TIER, m.tier, "piso", id),
    tenacity_hours: tenacityHours, tenacity_source: tenacityHours ? TENACITY_SOURCE : null,
    evolution_to_15m: null, evolution_to_2h: null, evolution_to_8h: null, evolution_to_24h: null, evolution_beyond_24h: null,
    strength: optional(STRENGTH, m.strength, "potencia", id), threshold: value("threshold"), diffusion: value("diffusion"),
    blend_effect: value("blend_effect"), role: roleText === "disolvente" ? null : optional(ROLE, m.role, "función", id),
    recommended_dilution: value("recommended_dilution"), cost: value("cost"), handling: value("handling"),
    physical_state: phValue("state"), appearance: phValue("color"), stains: phValue("stains"), solubility: phValue("solubility"),
    density, melting_point_c: decimal(ph?.melting_point_c, id, "el punto de fusión", "any"), formula: phValue("formula"),
    molecular_weight: molecularWeight, vapor_pressure: phValue("vapor_pressure"), stability: phValue("stability"),
    incompatibilities: phValue("incompatibilities"), physical_sources: phValue("sources"),
    notes: value("notes"), sources: sources ? `lab: ${sources}` : "lab",
    // V3-32: «Lo común no lo lleva»; the lab's second-hand IFRA goes to the user's version (batch 8), and its dispute with it.
    confidence: optional(CONFIDENCE, m.confidence, "confianza", id), disputed_fields: disputed.filter((f) => f !== "ifra_unverified"), ifra_unverified: null,
  });
}
const labIdOfRow = new Map(materialRows.map((r, i) => [r, text(materials[i].id)]));

// ------------------------------------------------------------ descriptors, relations, references
interface Table {
  readonly rows: Array<Record<string, Cell>>;
  merged: number;
}
const descriptors: Table = { rows: [], merged: 0 };
const relations: Table = { rows: [], merged: 0 };
const references: Table = { rows: [], merged: 0 };
const seenIds = new Set<string>();
/** A child row with the id of its content; an identical row is the same row, so it enters once. */
function push(table: Table, prefix: string, content: readonly unknown[], row: Record<string, Cell>): void {
  const rowId = uuidFor(`${prefix}:${JSON.stringify(content)}`);
  if (seenIds.has(rowId)) {
    table.merged++;
    return;
  }
  seenIds.add(rowId);
  table.rows.push({ id: rowId, ...row });
}
const required = (value: unknown) => text(value).trim();

for (const d of all("select * from material_descriptors order by material_id, source, text")) {
  const [labId, source, body] = [text(d.material_id), required(d.source), required(d.text)];
  if (!source || !body) {
    note("Otros", `${labId}: un descriptor sin fuente o sin texto no entra.`);
    continue;
  }
  push(descriptors, "comun-descriptor", [labId, source, body], { material_id: common(labId), owner_id: null, source, text: body });
}
for (const r of all("select * from material_relations order by material_id, kind, other_id, other_text")) {
  const labId = text(r.material_id);
  const otherLab = r.other_id === null ? null : text(r.other_id);
  if (otherLab !== null && !ids.has(otherLab)) throw new Error(`${labId}: una relación apunta a ${otherLab}, que no es de los 111`);
  const otherText = required(r.other_text) || null;
  if (otherLab === null && !otherText) {
    note("Otros", `${labId}: una relación sin material ni nombre no entra.`);
    continue;
  }
  const [relNote, relSources] = [required(r.note) || null, required(r.sources) || null];
  push(relations, "comun-relation", [labId, text(r.kind), otherLab, otherText, relNote, relSources], {
    material_id: common(labId), owner_id: null, kind: text(r.kind), other_id: otherLab === null ? null : common(otherLab),
    other_text: otherLab === null ? otherText : null, note: relNote, sources: relSources,
  });
}
for (const r of all("select * from material_references order by material_id, perfume, house")) {
  const labId = text(r.material_id);
  const perfume = required(r.perfume);
  if (!perfume) {
    note("Otros", `${labId}: un perfume de referencia sin nombre no entra.`);
    continue;
  }
  const [house, refNote, refSources] = [required(r.house) || null, required(r.note) || null, required(r.sources) || null];
  push(references, "comun-reference", [labId, perfume, house, refNote, refSources], {
    material_id: common(labId), owner_id: null, perfume, house, note: refNote, sources: refSources,
  });
}

// ------------------------------------------------------------ doses
const BASIS = (b: string) => (b.startsWith("% del concentrado") ? "concentrate" : b.startsWith("% del producto terminado") ? "finished_product" : b.startsWith("sin declarar") ? "undeclared" : null);
/** A percentage of the lab as the exact fraction of 1 the v3 keeps (V3-14). */
function fraction(pct: unknown, id: string): string | null {
  if (pct === null || pct === undefined) return null;
  const decimalText = exactDecimal(Number(pct));
  if (/\.\d{7,}$/.test(decimalText)) note("Duplicados fusionados y dosis", `${id}: una cifra de dosis con muchos decimales (${decimalText} %): puede ser ruido de coma flotante en el laboratorio.`);
  return pctToFraction(decimalText);
}
const doses: Table = { rows: [], merged: 0 };
let dosesWithoutFigures = 0;
let dosesWithInvalidFigures = 0;
let dosesOutOfBasis = 0;
for (const d of all("select * from material_dosages order by material_id, kind, basis, min_pct, typical_pct, max_pct, text, sources")) {
  const id = text(d.material_id);
  const [min, typical, max] = [fraction(d.min_pct, id), fraction(d.typical_pct, id), fraction(d.max_pct, id)];
  if (min === null && typical === null && max === null) {
    dosesWithoutFigures++;
    continue;
  }
  // The schema asks min >= 0, typical and max > 0, all <= 1 and min <= max.
  const bad = [min !== null && (Number(min) < 0 || Number(min) > 1), typical !== null && (Number(typical) <= 0 || Number(typical) > 1), max !== null && (Number(max) <= 0 || Number(max) > 1)];
  if (bad.some((b) => b) || (min !== null && max !== null && Number(min) > Number(max))) {
    dosesWithInvalidFigures++;
    note("Duplicados fusionados y dosis", `${id}: una dosis con cifras que la v3 no admite (${text(d.min_pct)} / ${text(d.typical_pct)} / ${text(d.max_pct)} %): no entra.`);
    continue;
  }
  const basis = BASIS(text(d.basis));
  if (!basis) {
    dosesOutOfBasis++;
    note("Duplicados fusionados y dosis", `${id}: una dosis con base «${text(d.basis)}», que no es de la v3; no entra.`);
    continue;
  }
  const said = [required(d.text), text(d.confidence) ? `confianza: ${text(d.confidence)}` : "", basis === "undeclared" && text(d.basis) !== "sin declarar" ? `base: ${text(d.basis)}` : ""].filter((t) => t);
  push(doses, "comun-dose", [id, text(d.kind), text(d.basis), d.min_pct, d.typical_pct, d.max_pct, text(d.text), text(d.sources), text(d.confidence)], {
    material_id: common(id), owner_id: null, min, typical, max, basis,
    authority: DOSE_AUTHORITY[text(d.kind)] ?? "consensus", source: required(d.sources) ? `lab: ${required(d.sources)}` : "lab",
    disputed: (pendingConflicts.get(id) ?? []).includes("dosage"), notes: said.join(" · ") || null,
  });
}

// ------------------------------------------------------------ checks: what the schema would refuse
const problems: string[] = [];
const check = (ok: boolean, message: string) => {
  if (!ok) problems.push(message);
};
const FAMILIES = new Set(Object.values(FAMILY));
const tierValues = new Set(Object.values(TIER));
const strengthValues = new Set(Object.values(STRENGTH));
const confidenceValues = new Set(Object.values(CONFIDENCE));
const materialIds = new Set<string>();
const abbreviations = new Set<string>();
for (const r of materialRows) {
  const where = `${text(r.id)} «${text(r.name as string)}»`;
  check(!materialIds.has(r.id as string), `${where}: id repetido`);
  materialIds.add(r.id as string);
  check(r.owner_id === null && r.based_on_id === null && r.category_id === null && r.color === null, `${where}: owner_id, based_on_id, category_id y color tienen que ir vacíos`);
  check(KINDS.has(r.kind as string), `${where}: tipo`);
  check(r.family === null || FAMILIES.has(r.family as string), `${where}: familia`);
  check(r.tier === null || tierValues.has(r.tier as string), `${where}: piso`);
  check(r.strength === null || strengthValues.has(r.strength as string), `${where}: potencia`);
  check(r.confidence === null || confidenceValues.has(r.confidence as string), `${where}: confianza`);
  check(r.synthesis === null || SYNTHESIS.has(r.synthesis as string), `${where}: síntesis`);
  check(r.abbreviation_origin === null || r.abbreviation_origin === "user" || r.abbreviation_origin === "generated", `${where}: origen de la abreviatura`);
  check((r.abbreviation === null) === (r.abbreviation_origin === null), `${where}: abreviatura y origen van juntos`);
  if (r.abbreviation !== null) {
    check(!abbreviations.has(r.abbreviation as string), `${where}: abreviatura repetida`);
    abbreviations.add(r.abbreviation as string);
  }
  for (const column of ["tenacity_hours", "density", "molecular_weight"] as const) check(r[column] === null || (/^\d+(\.\d+)?$/.test(r[column] as string) && Number(r[column]) > 0), `${where}: ${column}`);
  check(r.melting_point_c === null || /^-?\d+(\.\d+)?$/.test(r.melting_point_c as string), `${where}: punto de fusión`);
  check((r.tenacity_hours === null) === (r.tenacity_source === null), `${where}: tenacidad y fuente van juntas`);
  check(r.solvent !== true || r.role === null, `${where}: un disolvente no lleva función`);
  check(String(r.name).trim() !== "", `${where}: nombre`);
}
for (const t of [descriptors, relations, references, doses]) for (const r of t.rows) check(materialIds.has(r.material_id as string), `${r.id}: material que no está en la tanda`);
for (const r of relations.rows) {
  check(["combines", "substitute", "clashes"].includes(r.kind as string), `${r.id}: tipo de relación`);
  check(r.other_id !== null || text(r.other_text).trim() !== "", `${r.id}: relación sin material ni nombre`);
  check(r.other_id === null || (materialIds.has(r.other_id as string) && r.other_id !== r.material_id), `${r.id}: other_id que no es de la tanda o es el mismo material`);
}
for (const r of doses.rows) {
  const [min, typical, max] = [r.min, r.typical, r.max].map((v) => (v === null ? null : Number(v)));
  check(min !== null || typical !== null || max !== null, `${r.id}: dosis sin cifra`);
  check(min === null || (min >= 0 && min <= 1), `${r.id}: mínimo`);
  check(typical === null || (typical > 0 && typical <= 1), `${r.id}: típica`);
  check(max === null || (max > 0 && max <= 1), `${r.id}: máximo`);
  check(min === null || max === null || min <= max, `${r.id}: mínimo mayor que máximo`);
  check(["concentrate", "finished_product", "undeclared"].includes(r.basis as string), `${r.id}: base`);
  check(["lot", "product", "ifra", "literature", "consensus"].includes(r.authority as string), `${r.id}: autoridad`);
  check(text(r.source).trim() !== "", `${r.id}: fuente`);
  for (const column of ["min", "typical", "max"] as const) check(r[column] === null || /^\d+(\.\d+)?$/.test(r[column] as string), `${r.id}: ${column} no es un decimal exacto`);
}
if (problems.length) throw new Error(`La tanda no cumple el esquema:\n${problems.slice(0, 20).join("\n")}`);

// ------------------------------------------------------------ what looks like the user's or a shop's, in general fields
const PERSONAL = /(Olfatorium|\bkit\b|el usuario|del usuario|\bse compr[oó]|\bse pes[oó]|mi frasco|mi lote)/i;
for (const column of ["notes", "isomers", "physical_state", "handling", "blend_effect", "recommended_dilution", "origin", "house", "threshold", "diffusion", "stability", "incompatibilities", "ifra_unverified"] as const) {
  const hits = materialRows.filter((r) => PERSONAL.test(text(r[column])));
  if (!hits.length) continue;
  note("Texto que parece del usuario o de su tienda", `\`${column}\`: ${hits.length} materiales (${hits.length <= 8 ? hits.map((r) => labIdOfRow.get(r)).join(", ") : "ver el CSV"}) hablan de «Olfatorium», «el kit», «el usuario» o de cuándo se compró o se pesó. Entra tal cual, como pediste que entre lo del laboratorio.`);
}

// ------------------------------------------------------------ notes on the disputes and the IFRA text
const notColumns = new Map<string, number>();
for (const r of materialRows) for (const f of r.disputed_fields as string[]) if (!MATERIAL_COLUMNS.includes(f as never)) notColumns.set(f, (notColumns.get(f) ?? 0) + 1);
for (const [f, n] of [...notColumns].sort()) note("En disputa", `\`disputed_fields\` lleva «${f}» en ${n} materiales: no es una columna del material (es el nombre del campo del laboratorio, que no cambia).`);
const pendingByField = new Map<string, number>();
for (const [, fields] of pendingConflicts) for (const f of new Set(fields)) pendingByField.set(f, (pendingByField.get(f) ?? 0) + 1);
const physicalFields = ["state", "density", "melting_point_c", "solubility", "molecular_weight"];
const physicalCount = physicalFields.reduce((n, f) => n + (pendingByField.get(f) ?? 0), 0);
note(
  "En disputa",
  PHYSICAL_DISPUTES
    ? `**Lo que cambia respecto a la tanda 5:** allí los conflictos de datos físicos (${physicalFields.map((f) => `${f} ${pendingByField.get(f) ?? 0}`).join(", ")}; ${physicalCount} en total, materiales distintos por campo) no viajaban porque esos datos no entraban. Aquí los datos físicos entran (V3-36), así que sus conflictos entran como «en disputa» (V3-17), con \`state\` → \`physical_state\`. Para quitarlos otra vez: \`PHYSICAL_DISPUTES = false\` en el script.`
    : `Los conflictos de datos físicos (${physicalCount}) no viajan, como en la tanda 5 (\`PHYSICAL_DISPUTES = false\`), aunque los datos físicos sí entran.`,
);
for (const m of materials) unverified(text(m.id)); // only to count the conditions with figures, for the report
note("IFRA sin verificar", `**No entra en lo común** (V3-32: «Lo común no lo lleva»; V3-35: IFRA, fuera de la ficha). El texto de \`ifra_entries\` (${ifraEntries.size} materiales) irá a tu versión, en la tanda de tu cuenta, con su conflicto pendiente si lo tiene.`);
if (conditionsLeft) note("IFRA sin verificar", `${conditionsLeft} notas de condición llevan cifras o fechas (límites copiados de tiendas, fechas del banco): tampoco irán a tu versión, se quedan en el laboratorio.`);
note("Duplicados fusionados y dosis", `${synonymsMergedByCase} sinónimos del laboratorio solo se diferenciaban en mayúsculas de otro del mismo material (por ejemplo «Popcorn pyrazine» y «popcorn pyrazine») y entran una vez.`);
if (descriptors.merged) note("Duplicados fusionados y dosis", `${descriptors.merged} descriptores idénticos (mismo material, fuente y texto) en \`material_descriptors\` del laboratorio entran una vez.`);
if (relations.merged) note("Duplicados fusionados y dosis", `${relations.merged} relaciones idénticas entran una vez.`);
if (references.merged) note("Duplicados fusionados y dosis", `${references.merged} perfumes de referencia idénticos entran una vez.`);
if (doses.merged) note("Duplicados fusionados y dosis", `${doses.merged} dosis idénticas entran una vez.`);
if (dosesWithoutFigures) note("Duplicados fusionados y dosis", `${dosesWithoutFigures} dosis del laboratorio no tienen ninguna cifra (solo texto, por ejemplo «cat. 4: 0,50–5,00 %») y no entran: el esquema pide al menos una.`);

// ------------------------------------------------------------ files
writeTable(join(OUT, "materials.csv"), MATERIAL_COLUMNS, materialRows);
writeTable(join(OUT, "material_descriptors.csv"), ["id", "material_id", "owner_id", "source", "text"], descriptors.rows);
writeTable(join(OUT, "material_relations.csv"), ["id", "material_id", "owner_id", "kind", "other_id", "other_text", "note", "sources"], relations.rows);
writeTable(join(OUT, "material_references.csv"), ["id", "material_id", "owner_id", "perfume", "house", "note", "sources"], references.rows);
writeTable(join(OUT, "material_doses.csv"), ["id", "material_id", "owner_id", "min", "typical", "max", "basis", "authority", "source", "disputed", "notes"], doses.rows);

// ------------------------------------------------------------ the report
const tally = (f: (r: Record<string, Cell>) => boolean) => materialRows.filter(f).length;
const filled = (column: string) => tally((r) => r[column] !== null && !(Array.isArray(r[column]) && (r[column] as string[]).length === 0));
const total = materialRows.length;
const labTable = (table: string) => count(`select count(*) c from ${table}`);
const fromPair = (column: string) => `${filled(column)} de ${total}`;
const noPair = traces.filter((t) => t.pair === "material nuevo");
const noV1Row = traces.filter((t) => t.pair !== "material nuevo" && !t.v1Id);
const noAbbreviation = traces.filter((t) => !t.abbreviation);
const generated = traces.filter((t) => t.origin === "generated");
const noFamily = traces.filter((t) => !t.family);
const userAbbreviations = traces.filter((t) => t.origin === "user").length;
const fieldRows: Array<[string, string, string]> = [
  ["`id`", "`uuidFor(\"comun:<id del laboratorio>\")`, el mismo siempre", `${total}`],
  ["`name`, `kind`, `form`, `house`, `code`, `odor_target`, `synthesis`, `isomers`, `species`, `part`, `process`, `chemotype`, `inci`, `origin`", "`materials` del laboratorio (`origin` es su «procedencia»; el tipo, el del laboratorio)", `\`name\` ${filled("name")}, \`kind\` ${filled("kind")}, \`cas\` ${filled("cas")}, \`inci\` ${filled("inci")}, \`species\` ${filled("species")}, \`origin\` ${filled("origin")}`],
  ["`solvent`", "función «disolvente» del laboratorio (entonces `role` queda vacío)", `${tally((r) => r.solvent === true)}`],
  ["`aliases`", `\`material_synonyms\` del laboratorio, más el nombre del material de la v2 y los nombres de las filas de la v1 de la pareja (comercial, sigla, IFRA, sinónimos, PubChem, transparencia, tiendas; no el código); sin repetir el nombre ni mayúsculas distintas`, `${filled("aliases")} materiales; ${aliasesFromPair} nombres vienen de la pareja`],
  ["`cas`, `other_cas`", "el primer CAS que encuentra `\\b\\d{2,7}-\\d{2}-\\d\\b` en el texto de CAS del laboratorio; el resto, en orden y sin repetir", `\`cas\` ${filled("cas")}, \`other_cas\` ${filled("other_cas")}`],
  ["`abbreviation`, `abbreviation_origin`", "`codigo` y `codigo_origen` de la pareja del material en la v1 (V3-37): `usuario` → `user`, `generado` → `generated`; única en la tanda", `${userAbbreviations} del usuario, ${generated.length} generadas`],
  ["`family`", "`familia` de la pareja en la v1, en la lista cerrada de P48 (V3-18, V3-38)", fromPair("family")],
  ["`color`", "vacío: sale de la paleta de la familia (V3-38)", "0"],
  ["`family_detail`, `facets`", "`family` y `facets` del laboratorio, en texto libre", `\`family_detail\` ${filled("family_detail")}, \`facets\` ${filled("facets")}`],
  ["`tier`, `strength`, `role`, `confidence`", "`materials` del laboratorio, traducidos a la escala en inglés de la v3 (`top-heart` → `top_heart`, `muy alto` → `very_high`, `estructura` → `structure`, `alta` → `high`…)", `\`tier\` ${filled("tier")}, \`strength\` ${filled("strength")}, \`role\` ${filled("role")}, \`confidence\` ${filled("confidence")}`],
  ["`tenacity_hours`, `tenacity_source`", "`tenacity_h` del laboratorio, número exacto en horas; la fuente es una frase fija que cita el comentario de `esquema.sql` («horas en tira, material puro (escala TGSC)») (V3-42)", `${filled("tenacity_hours")}`],
  ["`evolution_*` (cinco)", "vacías: `evolution` del laboratorio no tiene ningún dato (V3-42)", "0"],
  ["`threshold`, `diffusion`, `blend_effect`, `recommended_dilution`, `cost`, `handling`, `notes`", "`materials` del laboratorio, tal cual", `\`threshold\` ${filled("threshold")}, \`diffusion\` ${filled("diffusion")}, \`blend_effect\` ${filled("blend_effect")}, \`recommended_dilution\` ${filled("recommended_dilution")}, \`cost\` ${filled("cost")}, \`handling\` ${filled("handling")}, \`notes\` ${filled("notes")}`],
  ["`physical_state`, `appearance`, `stains`, `solubility`, `density`, `melting_point_c`, `formula`, `molecular_weight`, `vapor_pressure`, `stability`, `incompatibilities`, `physical_sources`", "`material_physical` del laboratorio (`state`, `color`, `stains`, `solubility`, `density`, `melting_point_c`, `formula`, `molecular_weight`, `vapor_pressure`, `stability`, `incompatibilities`, `sources`); los números, como decimales exactos", `\`physical_state\` ${filled("physical_state")}, \`density\` ${filled("density")}, \`melting_point_c\` ${filled("melting_point_c")}, \`molecular_weight\` ${filled("molecular_weight")}`],
  ["`sources`", "`lab: ` y las fuentes del laboratorio de ese material", `${filled("sources")}`],
  ["`disputed_fields`", `conflictos con estado «pendiente» de \`conflicts\` del laboratorio, con el nombre del campo en la v3 (\`tenacity_h\` → \`tenacity_hours\`, \`family\` → \`family_detail\`, \`state\` → \`physical_state\`; \`dosage\` marca la dosis, no el material)`, `${tally((r) => (r.disputed_fields as string[]).length > 0)} materiales`],
  ["`ifra_unverified`", "vacío en lo común (V3-32, V3-35): el texto de `ifra_entries` va a tu versión", "0"],
  ["`owner_id`, `category_id`, `based_on_id`, `grade`, `supplier`, `product`, `product_url`, `purity`", "vacíos: lo común no tiene dueño ni tienda ni frasco; las categorías vienen en un paso posterior", "0"],
];

const appendix = traces.map((t) => `| ${t.labId} | ${t.pair} | ${t.v1Id || "—"} | ${t.abbreviation ?? "—"}${t.origin ? ` (${t.origin === "user" ? "tuya" : "generada"})` : ""} | ${t.family ?? "—"} |`).join("\n");

const report = `# Tanda 7 · Los materiales del laboratorio, en lo común

*Generada por \`migracion-v3/tanda-7-materiales.ts\` desde \`../Perfumery/biblioteca/materiales.sqlite\` (commit \`${labCommit}\` del laboratorio${labDirty ? ", **con cambios sin confirmar en ese archivo**" : ", sin cambios locales"}; abierto solo para leer), tus respuestas a \`conflictos/laboratorio.csv\` (\`respuestas/laboratorio.csv\`: la pareja de cada material en la v2) y la v2, la v1 y los archivos de IFRA del commit \`${src.commit}\`. \`validar:v2\`: sin errores. No va a \`v3/datos/\` hasta que la apruebes.*

**Qué es.** Tus ${total} materiales del laboratorio (\`materials\` de \`materiales.sqlite\`: ${labTable("materials")} filas, todas con \`owner_id\` vacío allí) pasan a ser los materiales **comunes** de la v3 (V3-34, V3-36), con su información general y sin lo personal. No son versiones (sin \`based_on_id\`) y todos llevan su identidad (CAS, especie, parte, proceso…). Los ids son \`uuidFor("comun:<id del laboratorio>")\`: volver a ejecutar da los mismos bytes.

## Qué entra

| Archivo | Filas | De dónde |
|---|---|---|
| \`materials.csv\` | ${total} | \`materials\` (${labTable("materials")}), \`material_synonyms\` (${labTable("material_synonyms")}), \`material_physical\` (${labTable("material_physical")}), \`conflicts\` pendientes (${count("select count(*) c from conflicts where status = 'pendiente'")}), \`ifra_entries\` (${labTable("ifra_entries")}) y la pareja de cada material en la v2/v1 |
| \`material_descriptors.csv\` | ${descriptors.rows.length} | \`material_descriptors\` (${labTable("material_descriptors")} filas; ${descriptors.merged} idénticas se fusionan) |
| \`material_relations.csv\` | ${relations.rows.length} | \`material_relations\` (${labTable("material_relations")} filas): ${relations.rows.filter((r) => r.other_id !== null).length} enlazan con otro material de la tanda y ${relations.rows.filter((r) => r.other_id === null).length} llevan solo el nombre |
| \`material_references.csv\` | ${references.rows.length} | \`material_references\` (${labTable("material_references")} filas) |
| \`material_doses.csv\` | ${doses.rows.length} | \`material_dosages\` (${labTable("material_dosages")} filas; ${dosesWithoutFigures} sin ninguna cifra no entran; ${doses.merged} idénticas se fusionan): ${doses.rows.filter((r) => r.disputed === true).length} en disputa |

Tipos: ${["molecule", "natural", "composition"].map((k) => `${k} ${tally((r) => r.kind === k)}`).join(", ")} (el del laboratorio). Cada columna lleva el nombre del esquema (\`v3/db/schema/materials.ts\`), sin \`created_at\` ni \`updated_at\`.

## De dónde sale cada campo

| Campo | Origen | Cuántos lo llevan |
|---|---|---|
${fieldRows.map(([a, b, c]) => `| ${a} | ${b} | ${c} |`).join("\n")}

**Las dosis** (\`material_doses.csv\`): \`min\`, \`typical\` y \`max\` son el porcentaje del laboratorio pasado a fracción de 1 con \`pctToFraction\`, sin coma flotante. La \`basis\` sale de la base del laboratorio («% del concentrado» → \`concentrate\`, «% del producto terminado» → \`finished_product\`, «sin declarar…» → \`undeclared\`, con la frase original en \`notes\`). La \`authority\` sale del tipo del laboratorio (consensus → \`consensus\`, literature → \`literature\`, supplier → \`product\`). \`notes\` lleva el texto original de la fuente y la confianza del laboratorio.

## Lo que no entra y por qué

- **La composición** de \`material_components\` (${labTable("material_components")} filas): aplazada (V3-33).
- **Las voces** (los JSON de \`2026-10-11-voces-materiales\`): entran cuando el laboratorio las meta en su biblioteca (V3-40). Esta tanda no lee ningún JSON.
- **Tu parte personal** (V3-36), que irá a tu versión en una tanda posterior: \`user_materials\` (${labTable("user_materials")}), \`user_bottles\` (${labTable("user_bottles")}), \`user_evaluations\` (${labTable("user_evaluations")}) y \`user_material_axes\` (${labTable("user_material_axes")}). Aquí no se lee ninguna.
- **La monografía** (\`monograph\`, ${count("select count(monograph) c from materials")} rutas al repo del laboratorio): no tiene columna en la v3.
- **El IFRA de segunda mano con cifras** (V3-32): solo pasa el texto sin cifras de \`ifra_entries\`; las cifras (\`cat4_pct_finished\`, ${count("select count(cat4_pct_finished) c from ifra_entries")} filas) y las condiciones con números se quedan en el laboratorio. Lo regulado de IFRA sale solo de sus archivos (V3-35).
- **Del laboratorio, sin destino en la v3:** \`research_runs\` (${labTable("research_runs")}), la tabla \`sources\` (${labTable("sources")} etiquetas), \`material_allergens\` (${labTable("material_allergens")}), los conflictos resueltos y los valores y fuentes de cada conflicto: solo viaja el nombre del campo en disputa (V3-17).
- **Categorías:** \`category_id\` vacío; las categorías llegan en un paso posterior.

## Para revisar

${HEADINGS.map((h) => {
  const items = review.get(h)!;
  return `### ${h} (${items.length})\n\n${items.length ? items.map((n) => `- ${n}`).join("\n") : "- Nada."}`;
}).join("\n\n")}

### Resumen de abreviaturas y familias

- **Sin pareja en la v2 («material nuevo»):** ${noPair.length}${noPair.length ? ` (${noPair.map((t) => t.labId).join(", ")})` : ""}. Sin abreviatura ni familia.
- **Con pareja, pero sin fila en la v1:** ${noV1Row.length}${noV1Row.length ? ` (${noV1Row.map((t) => `${t.labId} → ${t.pair}`).join("; ")})` : ""}.
- **Sin abreviatura en total:** ${noAbbreviation.length} de ${total}. **Con abreviatura tuya:** ${userAbbreviations}. **Generada, provisional:** ${generated.length}.
- **Sin familia:** ${noFamily.length} de ${total}${noFamily.length ? ` (${noFamily.map((t) => t.labId).join(", ")})` : ""}.

## Pareja, abreviatura y familia de cada material

La pareja es tu respuesta en \`respuestas/laboratorio.csv\`; la fila de la v1 sale de \`datos/v2/v1-a-v2.csv\` (el material de la pareja, o el de su producto); la abreviatura y la familia, de \`datos/glosario/materiales.csv\`.

| Laboratorio | Pareja en la v2 | Fila de la v1 | Abreviatura | Familia |
|---|---|---|---|---|
${appendix}
`;
writeFileSync(join(OUT, "informe.md"), report, "utf8");
console.log(
  `Tanda 7: ${total} materiales, ${descriptors.rows.length} descriptores, ${relations.rows.length} relaciones, ${references.rows.length} perfumes, ${doses.rows.length} dosis; ` +
    `${userAbbreviations + generated.length} abreviaturas, ${total - noFamily.length} familias. ${OUT}/informe.md`,
);
