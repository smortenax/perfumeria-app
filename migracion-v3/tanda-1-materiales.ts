/**
 * Batch 1 of the migration (plan v3, phase 4, steps 4.1, 4.2, 4.4 and 4.7): the common
 * materials. Writes migracion-v3/tandas/1-materiales/ (materials.csv and informe.md), for the
 * user to review; nothing reaches v3/datos/ until the batch is approved (V3-21).
 *
 *   node migracion-v3/tanda-1-materiales.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Cell, writeTable } from "./lib/csv.ts";
import { known, many, readSources, type Row } from "./lib/fuentes.ts";
import { uuidFor, v2Id } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/1-materiales";
const src = readSources();
const { v2 } = src;

const KIND: Readonly<Record<string, string>> = { sustancia: "molecule", natural: "natural", base: "composition" };
/** V3-12: the seven diluents of the app are these molecules of the v2; both DPGs carry the mark (which one is the app's, 4.8). */
const SOLVENTS = new Set(["M01446", "M02733", "M02736", "M02952", "M03278", "M03304", "M03145", "M02710"]);
/** V3-18: the nine families of P48, as the v1 writes them, and their code. */
const FAMILY: Readonly<Record<string, string>> = {
  Cítrico: "citrus", Verde: "green", Ozónico: "ozonic", Floral: "floral", Frutal: "fruity",
  Especiado: "spicy", Amaderado: "woody", Animal: "animal", Transformado: "transformed",
};
const SYNTHESIS: Readonly<Record<string, string>> = { sintetico: "synthetic", "aislado-natural": "natural" };

const notes: string[] = [];
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// ------------------------------------------------------------ what the v1 says of each v2 material or product
const v1Of = new Map<string, Row[]>();
for (const link of v2.v1Links) {
  const target = link.productId || link.v2Id;
  const row = src.v1.get(link.v1Id);
  if (row) v1Of.set(target, [...(v1Of.get(target) ?? []), row]);
}

/** Every name the v1's search finds a row by (src/data/catalog.ts), but the material's own. */
function aliasesOf(name: string, rows: readonly Row[]): string[] {
  const out: string[] = [];
  const seen = new Set([fold(name)]);
  const add = (n: string) => {
    if (n && !seen.has(fold(n))) {
      seen.add(fold(n));
      out.push(n);
    }
  };
  for (const r of rows) {
    add(r.nombre_comercial);
    add(r.sigla_comercial);
    if (r.icono_distintivo && r.sigla_comercial) add(`${r.icono_distintivo}${r.sigla_comercial}`);
    many(r.otros_nombres_comerciales).forEach(add);
    add(r.nombre);
    many(r.nombre_ifra).forEach(add);
    many(r.sinonimos).forEach(add);
    many(r.nombres_transparencia).forEach(add);
    many(r.sinonimos_pubchem).forEach(add);
    many(r.nombres_proveedores).forEach(add);
    add(r.codigo);
  }
  return out;
}

function familyOf(id: string, rows: readonly Row[]): { family: string | null; facets: string | null } {
  const families = [...new Set(rows.map((r) => r.familia).filter((f) => f))];
  if (families.length > 1) notes.push(`${id}: el glosario de la v1 da varias familias (${families.join(", ")}); se toma la primera.`);
  const family = families[0] ? (FAMILY[families[0]] ?? null) : null;
  if (families[0] && !family) notes.push(`${id}: familia de la v1 fuera de las nueve de P48: «${families[0]}»; queda vacía.`);
  const facets = rows.map((r) => r.matiz).find((m) => m) ?? null;
  return { family, facets };
}

// ------------------------------------------------------------ the other CAS of each material (V3-16)
const substanceCas = new Map<string, string[]>();
for (const a of v2.casAliases) {
  if (a.relation !== "principal") substanceCas.set(a.substanceId, [...(substanceCas.get(a.substanceId) ?? []), a.cas]);
}
const ifraOtherCas = new Map<string, Set<string>>();
for (const n of src.ifraNaturals) {
  const all = [n.cas_principal, ...n.otros_cas.split(/\s+/)].filter((c) => c);
  for (const cas of all) {
    const others = ifraOtherCas.get(cas) ?? new Set<string>();
    all.filter((c) => c !== cas).forEach((c) => others.add(c));
    ifraOtherCas.set(cas, others);
  }
}

function otherCasOf(cas: string | null, substanceId: string, rows: readonly Row[]): string[] {
  const out = new Set<string>([
    ...(substanceCas.get(substanceId) ?? []),
    ...rows.flatMap((r) => r.otros_cas.split(/[\s|;]+/)),
    ...(cas ? [...(ifraOtherCas.get(cas) ?? [])] : []),
  ]);
  out.delete("");
  if (cas) out.delete(cas);
  return [...out].sort();
}

// ------------------------------------------------------------ the rows
const COLUMNS = [
  "id", "owner_id", "name", "kind", "solvent", "aliases", "cas", "other_cas", "species", "part", "process", "chemotype",
  "inci", "origin", "category_id", "form", "based_on_id", "grade", "supplier", "purity", "house", "code", "odor_target",
  "synthesis", "isomers", "family", "family_detail", "facets", "tier", "evolution", "tenacity", "strength", "threshold",
  "diffusion", "blend_effect", "role", "recommended_dilution", "sources", "confidence", "disputed_fields",
] as const;

const rows: Array<Record<string, Cell>> = [];
const byId = new Map(v2.materials.map((m) => [m.id, m]));

for (const m of v2.materials) {
  const v1 = v1Of.get(m.id) ?? [];
  const cas = known(m.cas);
  rows.push({
    id: v2Id(m.id),
    name: m.name,
    kind: KIND[m.type],
    solvent: SOLVENTS.has(m.id),
    aliases: aliasesOf(m.name, v1),
    cas,
    other_cas: otherCasOf(cas, m.substanceId, v1),
    species: known(m.species),
    part: known(m.part),
    process: known(m.process),
    chemotype: known(m.chemotype),
    inci: known(m.inci),
    synthesis: SYNTHESIS[m.origin] ?? null,
    ...familyOf(m.id, v1),
    sources: [`v2:${m.id}`, ...v1.map((r) => `v1:${r.id}`)].join(" "),
    disputed_fields: [],
  });
}

// V3-2: each product, a common material of its own, with its material's identity.
for (const p of v2.products) {
  const m = byId.get(p.materialId)!;
  const general = rows.find((r) => r.id === v2Id(m.id))!;
  const v1 = v1Of.get(p.id) ?? [];
  rows.push({
    ...general,
    id: v2Id(p.id),
    name: p.name,
    aliases: aliasesOf(p.name, v1),
    house: known(p.maker),
    code: known(p.code),
    supplier: known(p.shop),
    sources: [`v2:${p.id}`, `de v2:${m.id}`, ...v1.map((r) => `v1:${r.id}`)].join(" "),
  });
}

// The four substances of the v2 without a material: three molecules and a natural (V3-12: decides the chemistry).
const NATURAL_SUBSTANCES = new Set(["S00104"]);
const withMaterial = new Set(v2.materials.map((m) => m.substanceId).filter((s) => s));
for (const s of v2.substances) {
  if (withMaterial.has(s.id)) continue;
  const principal = v2.casAliases.find((a) => a.substanceId === s.id && a.relation === "principal")?.cas ?? null;
  rows.push({
    id: v2Id(s.id),
    name: s.name,
    kind: NATURAL_SUBSTANCES.has(s.id) ? "natural" : "molecule",
    solvent: false,
    aliases: [],
    cas: principal,
    other_cas: otherCasOf(principal, s.id, []),
    sources: `v2:${s.id}`,
    disputed_fields: [],
  });
}

// V3-27: the constituent of STD 089's limit, as IFRA names it; no CAS, which IFRA's files do not give for it.
rows.push({ id: uuidFor("ifra:5-MOP"), name: "5-MOP", kind: "molecule", solvent: false, aliases: [], other_cas: [], sources: "IFRA 51 STD 089", disputed_fields: [] });
// §3.5: what a partial list leaves out (batch 2 writes it into those lists).
rows.push({ id: uuidFor("v3:sin-identificar"), name: "Sin identificar", kind: "composition", solvent: false, aliases: [], other_cas: [], sources: "v3 modelo §3.5", disputed_fields: [] });

writeTable(join(OUT, "materials.csv"), COLUMNS, rows);

// ------------------------------------------------------------ the report
const count = (pred: (r: Record<string, Cell>) => boolean) => rows.filter(pred).length;
const byKind = ["molecule", "natural", "composition"].map((k) => `${k} ${count((r) => r.kind === k)}`).join(", ");
const solventNames = rows.filter((r) => r.solvent).map((r) => `${r.name} (${String(r.sources).split(" ")[0]})`);
const report = `# Tanda 1 · Los materiales comunes

*Generada por \`migracion-v3/tanda-1-materiales.ts\`. Datos de la v2, la v1 y los archivos de IFRA del commit \`${src.commit}\`. \`validar:v2\`: sin errores.*

**Qué entra** (\`materials.csv\`, ${rows.length} filas):

- **Los ${v2.materials.length} materiales de la v2**, con su id calculado del suyo: ${byKind} en total (V3-12: \`sustancia\` → \`molecule\`, \`natural\` → \`natural\`, \`base\` → \`composition\`).
- **Los ${v2.products.length} productos**, cada uno un material común con la identidad del suyo, su fabricante (\`house\`), su código y su tienda (\`supplier\`) (V3-2).
- **Las 4 sustancias de la v2 sin material**: atranol, cloroatranol y cinamato de bencilo trans como moléculas; el bálsamo del Perú, como natural (V3-12: decide la química; la v2 lo tenía como sustancia).
- **«5-MOP»**, molécula, para el límite del 089 (V3-27), y **«Sin identificar»**, para las listas parciales (§3.5; la composición, en la tanda 2).

**Cómo se traduce:**

- **Disolventes (V3-12):** ${solventNames.length} con la marca: ${solventNames.join("; ")}. Los dos DPG la llevan; cuál es el de la app (\`solv:dpg\`) lo decides en la tanda 4.
- **Otros nombres (V3-6):** todos los que encuentra hoy el buscador de la v1 (comercial, sigla, otros comerciales, nombre, nombre de IFRA, sinónimos, PubChem, transparencia, tiendas y código), unidos por \`v1-a-v2.csv\`. ${count((r) => (r.aliases as string[]).length > 0)} materiales llevan alguno.
- **Otros CAS (V3-16):** de \`sustancia-cas.csv\`, de \`otros_cas\` de la v1 y del anexo de IFRA. ${count((r) => (r.other_cas as string[]).length > 0)} materiales llevan alguno.
- **Familias (V3-18):** la de la v1 (P48), con su código; el matiz, a \`facets\`. ${count((r) => r.family !== null && r.family !== undefined)} materiales llevan familia.
- **\`origen\` de la v2 → \`synthesis\`:** \`sintetico\` → synthetic (${count((r) => r.synthesis === "synthetic")}), \`aislado-natural\` → natural (${count((r) => r.synthesis === "natural")}); \`desconocido\`, vacío. \`origin\` queda para el país o la región (referencia §3).
- **Lo desconocido queda vacío**, nunca un valor: «no lo dice» y «desconocido» de la v2 son vacíos.
- **La fuente de cada material**, en \`sources\`: su id de la v2 y las filas de la v1 de las que salen sus nombres y su familia.

**Para revisar** (${notes.length}):

${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "- Nada."}

**Lo que no entra en esta tanda:** la composición (tanda 2), IFRA (tanda 3), las categorías y los duplicados (tanda 4, con tus decisiones) y lo del laboratorio (tanda 5, en tu cuenta).
`;
writeFileSync(join(OUT, "informe.md"), report, "utf8");
console.log(`Tanda 1: ${rows.length} materiales; ${notes.length} notas para revisar. ${OUT}/informe.md`);
