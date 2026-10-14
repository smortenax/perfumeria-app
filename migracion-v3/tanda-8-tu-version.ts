/**
 * Batch 8 of the migration (plan v3, phase 4, step 4.6; V3-15, V3-36, V3-39, V3-43): your part of
 * each of your lab's materials, as your version of its common material (V3-5, based_on_id),
 * into YOUR ACCOUNT, never into the common data (v3/datos/). Approved with
 * `aprobar.ts --cuenta`, loaded with `cargar-laboratorio.ts <your email>`.
 *
 * - Your bottle (user_materials): shop, product, page, grade, declared house, its notes.
 * - What batch 7 kept out of the common glossary because it speaks of your own material (V3-43,
 *   lib/personal.ts): the sentences of each general text, and the descriptors, relations,
 *   reference perfumes and doses whose source is your shop's sheet.
 * - The lab's second-hand IFRA, as text without figures (V3-32), with its dispute.
 * - What your products' certificates declare (V3-39): their composition and the manufacturer's
 *   ceilings, from the v2 (D12: figures of the product as it is bought), and what your material
 *   claims of a specification (condiciones.csv, the cade).
 * - Your dilutions, your tasting, your axes and «what I have» (V3-36).
 *
 * Reads ../Perfumery/biblioteca/materiales.sqlite read-only, the v2 (its pairs and certificates)
 * and batch 7 as approved (v3/datos/materials.csv), to check that both split the texts alike.
 *
 *   node migracion-v3/tanda-8-tu-version.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { parseCsvRecords } from "../src/data/csv.ts";
import { pctToFraction } from "./lib/cifras.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { readSources } from "./lib/fuentes.ts";
import { uuidFor } from "./lib/ids.ts";
import { isPersonalRow, shopsOf, splitPersonal, tagsOf } from "./lib/personal.ts";

const LAB = "../Perfumery/biblioteca/materiales.sqlite";
const OUT = "migracion-v3/tandas/8-tu-version";
const lab = new DatabaseSync(LAB, { readOnly: true });
const labCommit = execSync("git -C ../Perfumery log -1 --format=%h -- biblioteca/materiales.sqlite", { encoding: "utf8" }).trim();
const src = readSources();
const { v2 } = src;
type LabRow = Record<string, string | number | null>;
const all = (sql: string) => lab.prepare(sql).all() as LabRow[];
const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const trimmed = (v: unknown) => text(v).trim() || null;
const notes: string[] = [];

const common = (labId: string) => uuidFor(`comun:${labId}`);
const mine = (labId: string) => uuidFor(`tuya:${labId}`);

// ------------------------------------------------------------ the lab, and batch 7 as approved
const materials = all("select * from materials order by id");
const labIds = new Set(materials.map((m) => text(m.id)));
const approved = new Map(parseCsvRecords(readFileSync("v3/datos/materials.csv", "utf8")).map((r) => [r.id, r]));
for (const id of labIds) if (!approved.has(common(id))) throw new Error(`${id}: su material común no está en v3/datos/materials.csv (¿se aprobó la tanda 7?)`);
const physical = new Map(all("select * from material_physical").map((p) => [text(p.material_id), p]));
const bottles = new Map(all("select * from user_materials").map((u) => [text(u.material_id), u]));
const pending = new Map<string, string[]>();
for (const c of all("select material_id, field from conflicts where status = 'pendiente' order by field")) {
  pending.set(text(c.material_id), [...(pending.get(text(c.material_id)) ?? []), text(c.field)]);
}

// ------------------------------------------------------------ V3-43: what speaks of your material, by the same rule as batch 7
const labSources = all("select id, name from sources").map((s) => ({ id: text(s.id), name: text(s.name) }));
const shopsFor = (id: string) => shopsOf(text(bottles.get(id)?.supplier));
const tagsFor = (id: string) => tagsOf(shopsFor(id), labSources);
/** Each free-text column of the card and where the lab keeps it (as batch 7 maps it). */
const NARRATIVE: ReadonlyArray<readonly [column: string, table: "materials" | "physical", labColumn: string]> = [
  ["notes", "materials", "notes"], ["isomers", "materials", "isomers"], ["handling", "materials", "handling"],
  ["recommended_dilution", "materials", "recommended_dilution"], ["origin", "materials", "origin"], ["threshold", "materials", "threshold"],
  ["diffusion", "materials", "diffusion"], ["blend_effect", "materials", "blend_effect"], ["cost", "materials", "cost"],
  ["odor_target", "materials", "odor_target"], ["house", "materials", "house"], ["family_detail", "materials", "family"],
  ["facets", "materials", "facets"], ["physical_state", "physical", "state"], ["appearance", "physical", "color"],
  ["stains", "physical", "stains"], ["solubility", "physical", "solubility"], ["vapor_pressure", "physical", "vapor_pressure"],
  ["stability", "physical", "stability"], ["incompatibilities", "physical", "incompatibilities"],
];
let splitMismatch = 0;

/** V3-32: the kind, the standard and the condition, without figures; a condition with figures stays in the lab. */
const ifraEntries = new Map<string, LabRow[]>();
for (const e of all("select * from ifra_entries order by standard")) ifraEntries.set(text(e.material_id), [...(ifraEntries.get(text(e.material_id)) ?? []), e]);
let conditionsLeft = 0;
function unverified(id: string): string | null {
  const entries = ifraEntries.get(id) ?? [];
  if (!entries.length) return null;
  return entries
    .map((e) => {
      const kind = text(e.kind).trim();
      const condition = text(e.condition).trim();
      const keep = condition && !/\d/.test(condition);
      if (condition && !keep) conditionsLeft++;
      const head = kind === "sin verificar" ? "Sin verificar" : `${kind.charAt(0).toUpperCase()}${kind.slice(1)}${text(e.standard) ? `, STD ${text(e.standard)}` : ""}`;
      return `${head}${keep ? `: ${condition}` : ""}${kind === "sin verificar" ? "" : " · sin verificar"}`;
    })
    .join(" | ");
}

// ------------------------------------------------------------ your versions
const MATERIAL_COLUMNS = [
  "id", "owner_id", "name", "kind", "solvent", "aliases", "other_cas", "based_on_id", "category_id", "grade", "supplier", "product",
  "product_url", ...NARRATIVE.map(([c]) => c), "sources", "disputed_fields", "ifra_unverified",
] as const;
const versions: Array<Record<string, Cell>> = [];
const counts = { sentences: 0, bottles: 0, ifra: 0 };
for (const m of materials) {
  const id = text(m.id);
  const base = approved.get(common(id))!;
  const bottle = bottles.get(id);
  const ph = physical.get(id);
  const row: Record<string, Cell> = {
    id: mine(id),
    owner_id: null,
    name: base.name,
    // Your version takes its common one's kind and solvent mark (V3-5, V3-12); its other names it inherits.
    kind: base.kind,
    solvent: base.solvent === "true",
    aliases: [],
    other_cas: [],
    based_on_id: common(id),
    category_id: base.category_id || null,
    grade: trimmed(bottle?.grade),
    supplier: trimmed(bottle?.supplier),
    product: trimmed(text(bottle?.product).replace(/\s*—\s*\[.*$/, "")),
    product_url: trimmed(bottle?.url),
    sources: "lab",
    disputed_fields: (pending.get(id) ?? []).includes("ifra") ? ["ifra_unverified"] : [],
    ifra_unverified: unverified(id),
  };
  if (bottle) counts.bottles++;
  if (row.ifra_unverified) counts.ifra++;
  for (const [column, table, labColumn] of NARRATIVE) {
    const value = trimmed(table === "materials" ? m[labColumn] : ph?.[labColumn]);
    const split = splitPersonal(value, shopsFor(id));
    // Batch 7 kept the general part: it has to be the same, or something was lost between the two.
    if ((split.general ?? "") !== (base[column] ?? "")) {
      splitMismatch++;
      notes.push(`${id} · ${column}: la parte general no coincide con la aprobada en la tanda 7.`);
    }
    row[column] = split.personal;
    counts.sentences += split.moved.length;
  }
  // Your bottle's own house and notes go with what the lab said of it.
  const declared = trimmed(bottle?.declared_house);
  if (declared) row.house = row.house ? `${declared}\n${row.house}` : declared;
  const bottleNotes = trimmed(bottle?.notes);
  if (bottleNotes) row.notes = row.notes ? `Frasco: ${bottleNotes}\n${row.notes}` : `Frasco: ${bottleNotes}`;
  versions.push(row);
}

// ------------------------------------------------------------ the rows batch 7 kept out (V3-43), now yours
const descriptors: Array<Record<string, Cell>> = [];
const relations: Array<Record<string, Cell>> = [];
const references: Array<Record<string, Cell>> = [];
const doses: Array<Record<string, Cell>> = [];
const once = new Set<string>();
const add = (list: Array<Record<string, Cell>>, prefix: string, content: readonly unknown[], row: Record<string, Cell>) => {
  const id = uuidFor(`${prefix}:${JSON.stringify(content)}`);
  if (once.has(id)) return;
  once.add(id);
  list.push({ id, ...row });
};
for (const d of all("select * from material_descriptors order by material_id, source, text")) {
  const [id, source, body] = [text(d.material_id), text(d.source).trim(), text(d.text).trim()];
  if (source && body && isPersonalRow(body, source, shopsFor(id), tagsFor(id))) {
    add(descriptors, "tuya-descriptor", [id, source, body], { material_id: mine(id), owner_id: null, source, text: body });
  }
}
for (const r of all("select * from material_relations order by material_id, kind, other_id, other_text")) {
  const id = text(r.material_id);
  const otherLab = r.other_id === null ? null : text(r.other_id);
  const otherText = trimmed(r.other_text);
  const [note, sources] = [trimmed(r.note), trimmed(r.sources)];
  if ((otherLab === null && !otherText) || !isPersonalRow(`${otherText ?? ""} ${note ?? ""}`, sources ?? "", shopsFor(id), tagsFor(id))) continue;
  add(relations, "tuya-relation", [id, text(r.kind), otherLab, otherText, note, sources], {
    material_id: mine(id), owner_id: null, kind: text(r.kind), other_id: otherLab && labIds.has(otherLab) ? common(otherLab) : null,
    other_text: otherLab && labIds.has(otherLab) ? null : otherText, note, sources,
  });
}
for (const r of all("select * from material_references order by material_id, perfume, house")) {
  const id = text(r.material_id);
  const [perfume, house, note, sources] = [text(r.perfume).trim(), trimmed(r.house), trimmed(r.note), trimmed(r.sources)];
  if (perfume && isPersonalRow(`${perfume} ${house ?? ""} ${note ?? ""}`, sources ?? "", shopsFor(id), tagsFor(id))) {
    add(references, "tuya-reference", [id, perfume, house, note, sources], { material_id: mine(id), owner_id: null, perfume, house, note, sources });
  }
}
const BASIS = (b: string) => (b.startsWith("% del concentrado") ? "concentrate" : b.startsWith("% del producto terminado") ? "finished_product" : b.startsWith("sin declarar") ? "undeclared" : null);
const DOSE_AUTHORITY: Readonly<Record<string, string>> = { consensus: "consensus", literature: "literature", supplier: "product" };
const pctOf = (v: unknown) => (v === null || v === undefined ? null : pctToFraction(String(Number(v))));
for (const d of all("select * from material_dosages order by material_id, kind, basis, min_pct, typical_pct, max_pct, text, sources")) {
  const id = text(d.material_id);
  if (!isPersonalRow(text(d.text), text(d.sources), shopsFor(id), tagsFor(id))) continue;
  const [min, typical, max] = [pctOf(d.min_pct), pctOf(d.typical_pct), pctOf(d.max_pct)];
  const basis = BASIS(text(d.basis));
  if ((min === null && typical === null && max === null) || !basis) continue;
  const said = [text(d.text).trim(), text(d.confidence) ? `confianza: ${text(d.confidence)}` : ""].filter((t) => t);
  add(doses, "tuya-dose", [id, d.kind, d.basis, d.min_pct, d.typical_pct, d.max_pct, d.text, d.sources, d.confidence], {
    material_id: mine(id), owner_id: null, min, typical, max, basis, authority: DOSE_AUTHORITY[text(d.kind)] ?? "consensus",
    source: text(d.sources).trim() ? `lab: ${text(d.sources).trim()}` : "lab", disputed: (pending.get(id) ?? []).includes("dosage"),
    notes: said.join(" · ") || null,
  });
}

// ------------------------------------------------------------ what your products' certificates declare (V3-39, D12)
const answers = new Map(parseCsvRecords(readFileSync("migracion-v3/respuestas/laboratorio.csv", "utf8")).map((r) => [r.id, r.respuesta.trim()]));
const productMaterial = new Map(v2.products.map((p) => [p.id, p.materialId]));
const materialOfSubstance = new Map(v2.materials.filter((m) => m.substanceId).map((m) => [m.substanceId, m.id]));
const v2Materials = new Map(v2.materials.map((m) => [m.id, m]));
const substanceName = new Map(v2.substances.map((s) => [s.id, s.name]));
const principalCas = new Map(v2.casAliases.filter((a) => a.relation === "principal").map((a) => [a.substanceId, a.cas]));
const documents = new Map(v2.documents.map((d) => [d.id, d]));
/** Your lab material of each v2 container (a product or its material), from your answers in laboratorio.csv. */
const labOfContainer = new Map<string, string>();
const labOfMaterial = new Map<string, string>();
for (const [id, answer] of answers) {
  if (!answer.startsWith("versión de ")) continue;
  const target = answer.slice("versión de ".length);
  const material = productMaterial.get(target) ?? target;
  labOfContainer.set(target, id);
  if (!labOfContainer.has(material)) labOfContainer.set(material, id);
  if (!labOfMaterial.has(material)) labOfMaterial.set(material, id);
}
const components: Array<Record<string, Cell>> = [];
for (const row of v2.composition) {
  if (row.authority !== "producto") continue;
  const labId = labOfContainer.get(row.containerId);
  if (!labId) continue;
  const v2Material = row.componentId.startsWith("S") ? (materialOfSubstance.get(row.componentId) ?? null) : row.componentId;
  const componentLab = v2Material ? labOfMaterial.get(v2Material) : undefined;
  const cas = row.componentId.startsWith("S") ? (principalCas.get(row.componentId) ?? (v2Material ? v2Materials.get(v2Material)?.cas : "") ?? "") : (v2Materials.get(row.componentId)?.cas ?? "");
  const name = row.componentId.startsWith("S") ? (substanceName.get(row.componentId) ?? row.componentId) : (v2Materials.get(row.componentId)?.name ?? row.componentId);
  const typeOf = row.valueType;
  const amount: Record<string, Cell> =
    typeOf === "rango" ? { amount_kind: "range", value: null, min: pctToFraction(row.min || "0"), max: pctToFraction(row.max) }
    : typeOf === "maximo" ? (Number(row.max) === 0 ? { amount_kind: "exact", value: "0", min: null, max: null } : { amount_kind: "max", value: pctToFraction(row.max), min: null, max: null })
    : { amount_kind: "exact", value: pctToFraction(row.typical), min: null, max: null };
  const doc = documents.get(row.documentId);
  const note = (src.compositionNotes.get(row.line) ?? "").trim();
  components.push({
    id: uuidFor(`tuya-component:${row.containerId}|${row.componentId}|${row.documentId}`),
    material_id: mine(labId),
    owner_id: null,
    component_id: componentLab ? common(componentLab) : null,
    component_cas: componentLab ? null : cas || null,
    component_name: componentLab ? null : name,
    ...amount,
    authority: "product",
    source: `${row.documentId} · ${doc?.title ?? ""}${note ? ` (${note})` : ""} — D12: cifras del producto tal como se compra`,
  });
}
const regulations: Array<Record<string, Cell>> = [];
for (const t of v2.ceilings) {
  const labId = labOfContainer.get(t.productId);
  if (!labId) continue;
  regulations.push({
    id: uuidFor(`tuya-ceiling:${t.productId}|${t.category}|${t.documentId}`), material_id: mine(labId), owner_id: null, regime: "manufacturer",
    category: t.category, kind: "max", max_value: pctToFraction(t.maxPct), group_key: null, requirement: null, authority: "product",
    source: `${t.documentId} · ${documents.get(t.documentId)?.title ?? ""}`,
  });
}
const AUTHORITY: Readonly<Record<string, string>> = { lote: "lot", producto: "product", literatura: "literature", consenso: "consensus" };
for (const c of v2.conditions) {
  const labId = labOfContainer.get(c.containerId);
  if (!labId) continue;
  const authority = AUTHORITY[c.authority];
  if (!authority) {
    notes.push(`${c.containerId}: una afirmación de ${c.standard} con autoridad «${c.authority}», que no es de tu material; no entra.`);
    continue;
  }
  regulations.push({
    id: uuidFor(`tuya-claim:${c.containerId}|${c.standard}|${c.authority}`), material_id: mine(labId), owner_id: null, regime: "ifra",
    category: null, kind: "requirement", max_value: null, group_key: c.standard, requirement: c.claim, authority,
    source: `Lo que afirma tu material de ${c.standard}: ${c.documentId ? `${c.documentId} · ${documents.get(c.documentId)?.title ?? ""}` : "sin documento"}`,
  });
}

// ------------------------------------------------------------ your lab: dilutions, tasting, axes, «what I have»
const have = [...bottles.keys()].sort().map((id) => ({ id: uuidFor(`tuya-have:${id}`), user_id: null, material_id: mine(id) }));
// A bottle of the lab without a percentage is the pure bottle, not a dilution: its words go to your version's notes.
const pureBottles = all("select * from user_bottles where pct is null order by material_id, description");
for (const b of pureBottles) {
  const version = versions.find((v) => v.id === mine(text(b.material_id)))!;
  const said = `Frasco puro: ${text(b.description).trim()}${b.made_on ? ` (${text(b.made_on)})` : ""}`;
  version.notes = version.notes ? [version.notes, said].join("\n") : said;
  notes.push(`${text(b.material_id)}: un frasco del laboratorio sin porcentaje («${text(b.description).trim().slice(0, 60)}…») es el frasco puro, no una dilución: va a las notas de tu versión.`);
}
const dilutions = all("select * from user_bottles where pct is not null order by material_id, made_on, pct, solvent, description").map((b) => ({
  id: uuidFor(`tuya-dilution:${JSON.stringify([b.material_id, b.pct, b.solvent, b.made_on, b.description])}`),
  user_id: null,
  material_id: mine(text(b.material_id)),
  fraction: pctToFraction(String(Number(b.pct))),
  solvent: trimmed(b.solvent),
  made_on: /^\d{4}-\d{2}-\d{2}$/.test(text(b.made_on)) ? text(b.made_on) : null,
  description: trimmed(b.description),
}));
for (const b of all("select material_id, made_on from user_bottles where pct is not null")) {
  if (b.made_on !== null && !/^\d{4}-\d{2}-\d{2}$/.test(text(b.made_on))) notes.push(`${text(b.material_id)}: una dilución con fecha «${text(b.made_on)}», que no es AAAA-MM-DD; entra sin fecha.`);
}
const evaluations = all("select * from user_evaluations order by material_id").map((e) => ({
  id: uuidFor(`tuya-evaluation:${text(e.material_id)}`), user_id: null, material_id: mine(text(e.material_id)),
  status: trimmed(e.status), smelling_tip: trimmed(e.smelling_tip), reading: trimmed(e.reading), sheet: trimmed(e.sheet),
}));
const axes = all("select * from user_material_axes order by material_id, axis").map((x) => ({
  id: uuidFor(`tuya-axis:${text(x.material_id)}|${text(x.axis)}`), user_id: null, material_id: mine(text(x.material_id)), axis: text(x.axis).trim(),
}));
for (const t of [have, dilutions, evaluations, axes]) for (const r of t) if (!labIds.has([...labIds].find((id) => mine(id) === r.material_id) ?? "")) notes.push(`${r.id}: material que no es de los tuyos.`);

// ------------------------------------------------------------ write the batch (for your account only)
writeTable(join(OUT, "materials.csv"), MATERIAL_COLUMNS, versions);
writeTable(join(OUT, "material_components.csv"), ["id", "material_id", "owner_id", "component_id", "component_cas", "component_name", "amount_kind", "value", "min", "max", "authority", "source"], components);
writeTable(join(OUT, "regulations.csv"), ["id", "material_id", "owner_id", "regime", "category", "kind", "max_value", "group_key", "requirement", "authority", "source"], regulations);
writeTable(join(OUT, "material_doses.csv"), ["id", "material_id", "owner_id", "min", "typical", "max", "basis", "authority", "source", "disputed", "notes"], doses);
writeTable(join(OUT, "material_descriptors.csv"), ["id", "material_id", "owner_id", "source", "text"], descriptors);
writeTable(join(OUT, "material_relations.csv"), ["id", "material_id", "owner_id", "kind", "other_id", "other_text", "note", "sources"], relations);
writeTable(join(OUT, "material_references.csv"), ["id", "material_id", "owner_id", "perfume", "house", "note", "sources"], references);
writeTable(join(OUT, "lab_materials.csv"), ["id", "user_id", "material_id"], have);
writeTable(join(OUT, "lab_dilutions.csv"), ["id", "user_id", "material_id", "fraction", "solvent", "made_on", "description"], dilutions);
writeTable(join(OUT, "lab_evaluations.csv"), ["id", "user_id", "material_id", "status", "smelling_tip", "reading", "sheet"], evaluations);
writeTable(join(OUT, "lab_axes.csv"), ["id", "user_id", "material_id", "axis"], axes);

const report = `# Tanda 8 · Tu versión de cada material, en tu cuenta

*Generada por \`migracion-v3/tanda-8-tu-version.ts\` desde \`../Perfumery/biblioteca/materiales.sqlite\` (commit \`${labCommit}\` del laboratorio, abierto solo para leer), la v2 (commit \`${src.commit}\`) y la tanda 7 aprobada (\`v3/datos/materials.csv\`). **No va a \`v3/datos/\`**: es tuya (V3-15, V3-36). Con tu visto bueno, \`aprobar.ts --cuenta\` la apunta y \`cargar-laboratorio.ts <tu correo>\` la carga en tu cuenta.*

**Qué entra:**

- **${versions.length} versiones tuyas** (\`materials.csv\`), una por material del laboratorio, cada una sobre su común de la tanda 7 (\`based_on_id\`, V3-5): heredan su identidad, su ficha general y su IFRA, y añaden lo tuyo.
  - **Tu frasco** (${counts.bottles}): tienda, producto, página, grado y casa declarada; sus notas, como «Frasco: …».
  - **Lo de tu material concreto que la tanda 7 apartó** (V3-43): ${counts.sentences} frases de los textos generales, en el mismo campo. La parte general de cada texto coincide con la aprobada en la tanda 7 (${splitMismatch} diferencias).
  - **El IFRA de segunda mano** (V3-32), en ${counts.ifra}: el tipo y el estándar «· sin verificar», sin cifras; ${conditionsLeft} notas de condición con cifras se quedan en el laboratorio. Su conflicto pendiente, como «en disputa».
- **Las filas de tu material** que la tanda 7 apartó (V3-43): ${descriptors.length} descriptores, ${relations.length} relaciones, ${references.length} perfumes de referencia y ${doses.length} dosis.
- **Lo que declaran los certificados de tus productos** (V3-39): ${components.length} filas de composición (autoridad \`product\`; D12: cifras del producto tal como se compra), de ${new Set(components.map((c) => c.material_id)).size} materiales, ${components.filter((c) => c.component_id !== null).length} con un material tuyo como componente y ${components.filter((c) => c.component_id === null).length} con la sustancia por su CAS y su nombre; ${regulations.filter((r) => r.regime === "manufacturer").length} topes del fabricante, y ${regulations.filter((r) => r.kind === "requirement").length} afirmaciones de una especificación (el cade rectificado, por consenso: supuesta).
- **Tu laboratorio** (V3-36): ${have.length} «lo tengo», ${dilutions.length} diluciones, ${evaluations.length} catas y ${axes.length} ejes.

**Lo que no entra:** la composición del laboratorio (V3-33), las voces (V3-40) y la dilución de compra de tus frascos (no se registra: la dilución se elige en la app).

**Para revisar** (${notes.length}):

${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "- Nada."}
`;
writeFileSync(join(OUT, "informe.md"), report, "utf8");
console.log(
  `Tanda 8: ${versions.length} versiones, ${components.length} componentes, ${regulations.length} regulaciones, ${descriptors.length} descriptores, ${relations.length} relaciones, ${doses.length} dosis, ${have.length} «lo tengo», ${dilutions.length} diluciones, ${evaluations.length} catas, ${axes.length} ejes; ${notes.length} notas.`,
);
