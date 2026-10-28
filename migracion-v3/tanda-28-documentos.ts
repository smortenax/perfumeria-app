/**
 * Batches 28 and 29 (2026-10-28): what the manufacturers' documents say about the arrivals of
 * 2026-10-26. The user: «puedes acceder a perfumiarz? mira si tienen disponible los SAS y itra de los
 * que faltan, sino … buscalos en internet … o otros proveedores lo suben»; and on the two usage
 * conflicts of batch 27: «busca otro referente».
 *
 * - Batch 28, of your account (V3-39): Perfumiarz publishes the SDS, the IFRA certificate and the
 *   allergens of the products you bought there. Read into documentos-perfumiarz.csv (one subagent;
 *   each line copied from its page of the PDF), they go to YOUR version of each material, with
 *   authority «product»: its constituents (allergens first, then the IFRA-restricted list, then the
 *   SDS), and the certificate's ceiling in category 4 as a manufacturer's ceiling.
 * - Batch 29, common: the documents Fraterworks publishes for ITS lots of the materials you bought at
 *   Maese Lab (documentos-fraterworks.csv) are literature: they add constituents a material does not
 *   have yet. And the two usage conflicts: today's Fraterworks figures and a third reference
 *   (Scentspiracy, for Clearwood) are added, and batch 23's figure is kept and marked disputed.
 *
 * A component without a CAS in its document goes by its name; a pure molecule's own CAS in its SDS adds
 * nothing and is left out; a line without a figure is listed, not written. No limit
 * of IFRA is written: a manufacturer's ceiling is the product's (V3-35, V3-39), never IFRA's.
 *
 *   node migracion-v3/tanda-28-documentos.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

// The common data with batch 27 approved (cf672b6, on claude/info-altas-26-oct).
const BASE = "cf672b6";
const WEB = "migracion-v3/web/info-altas-26-oct";
const OUT_ACCOUNT = "migracion-v3/tandas/28-documentos-tus-botes";
const OUT_COMMON = "migracion-v3/tandas/29-documentos-comun";
type Rec = Record<string, Cell>;

const read = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = read("v3/datos/materials.csv").rows;
const doses = read("v3/datos/material_doses.csv");
const components = read("v3/datos/material_components.csv");
const local = (file: string) => parseCsvRecords(readFileSync(join(WEB, file), "utf8"));
const yours = [
  ...(parseCsvRecords(execSync(`git show ${BASE}:migracion-v3/tandas/24-tus-altas-26-oct/materials.csv`, { encoding: "utf8" })) as Rec[]),
  ...(parseCsvRecords(execSync(`git show ${BASE}:migracion-v3/tandas/8-tu-version/materials.csv`, { encoding: "utf8" })) as Rec[]),
];

// Each «MAT-…» as the common material: batch 23's by its key, the older ones by name.
const BY_NAME: Record<string, string> = { "MAT-polysantol": "Polysantol", "MAT-auranone": "Auranone", "MAT-ajenjo": "Ajenjo, aceite esencial" };
const commonId = (key: string): string => {
  const m = BY_NAME[key] ? materials.find((x) => !x.owner_id && x.name === BY_NAME[key]) : materials.find((x) => x.id === uuidFor(`comun:tanda23:${key}`));
  if (!m) throw new Error(`${key}: no está en lo común`);
  return String(m.id);
};
const nameOf = (id: string) => String(materials.find((m) => m.id === id)?.name ?? yours.find((m) => m.id === id)?.name ?? id);
/** Your version of a common material, bought at Perfumiarz (batch 24, or batch 8 for Auranone). */
const yourVersion = (key: string): string => {
  const base = commonId(key);
  // «Perfumiarz (muestra)» counts: the wormwood of batch 8 was a sample from there.
  const v = yours.find((m) => m.based_on_id === base && String(m.supplier).startsWith("Perfumiarz"));
  if (!v) throw new Error(`${key}: no tienes versión de Perfumiarz`);
  return String(v.id);
};

/** A percent as written («0,4945 %», «55.000») → a fraction as exact text. */
const fraction = (percent: string): string => {
  const p = percent.replace(",", ".").trim();
  if (!/^\d+(\.\d+)?$/.test(p)) throw new Error(`cifra «${percent}»`);
  const [int, dec = ""] = p.split(".");
  const digits = (int + dec).replace(/^0+/, "") || "0";
  const scale = dec.length + 2;
  const padded = digits.padStart(scale + 1, "0");
  const out = `${padded.slice(0, padded.length - scale)}.${padded.slice(padded.length - scale)}`.replace(/0+$/, "").replace(/\.$/, "");
  return out.replace(/^0+(?=\d)/, "") || "0";
};
const num = String.raw`(\d+(?:[.,]\d+)?)`;
/** The amount as the document writes it: a figure, «<x», a range «a-b» or «>= a - < b», «≥ a», «<= 100». */
const amountOf = (text: string): Rec | null => {
  const t = text.replace(/%/g, "").trim();
  let m: RegExpExecArray | null;
  if ((m = new RegExp(`^${num}$`).exec(t))) return { amount_kind: "exact", value: fraction(m[1]), min: null, max: null };
  if ((m = new RegExp(`^(?:<|<=)\\s*${num}$`).exec(t))) return { amount_kind: "max", value: fraction(m[1]), min: null, max: null };
  if ((m = new RegExp(`^(?:>=|≥)?\\s*${num}\\s*(?:-|(?=<))\\s*(?:<|<=)?\\s*${num}$`).exec(t))) return { amount_kind: "range", value: null, min: fraction(m[1]), max: fraction(m[2]) };
  if ((m = new RegExp(`^(?:>=|≥)\\s*${num}$`).exec(t))) return { amount_kind: "range", value: null, min: fraction(m[1]), max: "1" };
  return null;
};
/** A CAS as the documents print it, with the leading zeros some SDS add taken off («0005986-55-0» → «5986-55-0»). */
const casOf = (text: string): string | null => {
  const m = /^0*(\d{2,7}-\d{2}-\d)$/.exec(text.trim());
  return m ? m[1] : null;
};
/** A name as the lists write it, without their annex number («LIMONENE – III/88») or marks. */
const plain = (name: string) => name.replace(/\s*[–-]\s*III\/\d+\s*$/, "").replace(/\*/g, "").trim().toLowerCase();
const PRIORITY: Record<string, number> = { alergeno: 0, ifra_restringida: 1, componente_sds: 2 };
const TIPO: Record<string, string> = { alergenos: "declaración de alérgenos", ifra: "certificado IFRA", sds: "SDS", tecnica: "ficha técnica", coa: "certificado de análisis" };

/** The constituents of a list of document lines, one per material and CAS, the most precise first. */
function componentsOf(lines: Record<string, string>[], materialOf: (key: string) => string, authority: string, sourceOf: (l: Record<string, string>) => string, skip: (materialId: string, cas: string) => boolean) {
  const out = new Map<string, Rec>();
  const left: string[] = [];
  const sorted = [...lines].filter((l) => l.campo in PRIORITY).sort((a, b) => PRIORITY[a.campo] - PRIORITY[b.campo] || a.archivo.localeCompare(b.archivo) || Number(a.pagina) - Number(b.pagina));
  for (const l of sorted) {
    const id = materialOf(l.material_id);
    // Without a CAS in the document it goes by its name, as written: IFRA cannot link it, the declaration is still whole.
    // One per material and name; a CAS also counts, so «LIMONENE – III/88» and «Limonene» are one.
    const cas = casOf(l.cas);
    const key = `${id}|${plain(l.valor)}`;
    const own = materials.find((m) => m.id === commonId(l.material_id));
    const itself = cas !== null && (own?.cas === cas || (own?.other_cas ?? []).toString().includes(cas));
    const seen = out.has(key) || (cas !== null && [...out.values()].some((r) => r.material_id === id && r.component_cas === cas));
    if (itself || (cas && skip(id, cas)) || seen) continue;
    const amount = amountOf(l.cantidad);
    if (!amount) {
      left.push(`${nameOf(id)}: ${l.valor} ${cas ?? "(sin CAS)"} «${l.cantidad || "sin cifra"}», sin cifra que se lea como número`);
      continue;
    }
    const source = sourceOf(l);
    out.set(key, { id: uuidFor(`comp:v3:tanda28:${key}`), material_id: id, owner_id: null, component_id: null, component_cas: cas, component_name: l.valor.trim(), ...amount, authority, source });
  }
  return { rows: [...out.values()], left };
}

// Batch 28: your bottles from Perfumiarz.
// The wormwood's (PCW «Absinthe Essence», 2026-10-28) read by script into its own file.
const perfumiarz = [...local("documentos-perfumiarz.csv"), ...local("documentos-ajenjo-perfumiarz.csv")];
const docSource = (shop: string) => (l: Record<string, string>) => `${shop}, ${TIPO[l.tipo] ?? l.tipo} (${l.archivo}), ${l.url}, página ${l.pagina}: «${l.frase}»`;
const accountComponents = componentsOf(perfumiarz, yourVersion, "product", docSource("Perfumiarz"), () => false);
const ceilings: Rec[] = [];
const noCeiling: string[] = [];
for (const l of perfumiarz.filter((x) => x.campo === "ifra_cat4")) {
  const id = yourVersion(l.material_id);
  if (!/^\d+([.,]\d+)?$/.test(l.valor.trim())) {
    noCeiling.push(`${nameOf(id)}: «${l.valor}» (${l.archivo}, página ${l.pagina})`);
    continue;
  }
  ceilings.push({
    id: uuidFor(`reg:v3:tanda28:${id}:4`),
    material_id: id,
    owner_id: null,
    regime: "manufacturer",
    category: "4",
    kind: "max",
    max_value: fraction(l.valor),
    group_key: null,
    requirement: null,
    authority: "product",
    source: docSource("Perfumiarz")(l),
  });
}
const COMPONENT_HEADER = ["id", "material_id", "owner_id", "component_id", "component_cas", "component_name", "amount_kind", "value", "min", "max", "authority", "source"];
const REGULATION_HEADER = ["id", "material_id", "owner_id", "regime", "category", "kind", "max_value", "group_key", "requirement", "authority", "source"];
writeTable(join(OUT_ACCOUNT, "material_components.csv"), COMPONENT_HEADER, accountComponents.rows);
writeTable(join(OUT_ACCOUNT, "regulations.csv"), REGULATION_HEADER, ceilings);

// Batch 29, common: other suppliers' documents, as literature, where the material has no such CAS yet.
const has = (id: string, cas: string) => components.rows.some((c) => c.material_id === id && c.component_cas === cas);
const fraterworks = local("documentos-fraterworks.csv");
const commonComponents = componentsOf(fraterworks, commonId, "literature", (l) => `${docSource("Fraterworks")(l)} (documento de su lote, no del bote comprado)`, has);

// The usage conflicts of batch 27: the new figures are added and batch 23's is marked disputed.
const NEW_DOSES: { key: string; min: string | null; typical: string | null; max: string; source: string; note: string }[] = [
  {
    key: "MAT-ambrarome",
    min: null,
    typical: "0.05",
    max: "50",
    source: "web: Fraterworks, https://fraterworks.com/products/ambrarome-absolute: «Ambrarome® appears in 3% of the perfumes we have analysed, at a median of 0.05% of the concentrate.»",
    note: "mínimo «tr.»; máximo 50 % en perfumes (3 % en bases) · releído por la sesión el 2026-10-27 · no se encontró un tercer referente de uso (Hekserij, Perfumer's Apprentice, Scentspiracy, Synarome: no lo dicen)",
  },
  {
    key: "MAT-clearwood",
    min: "0.1",
    typical: "0.311",
    max: "6",
    source: "web: Fraterworks, https://fraterworks.com/products/clearwood: «Clearwood® is used at a median of 0.311% of the concentrate in the formulas we have analysed.»",
    note: "releído por la sesión el 2026-10-27",
  },
  {
    key: "MAT-clearwood",
    min: "1",
    typical: null,
    max: "5",
    source: "web: Scentspiracy, https://www.scentspiracy.com/fragrance-ingredients/p/clearwood: «Typical usage levels: Fine fragrance: 1–5%»",
    note: "tercer referente; leído por la sesión el 2026-10-28",
  },
];
const newDoses: Rec[] = NEW_DOSES.map((d) => ({
  id: uuidFor(`dose:v3:tanda29:${d.key}:${d.source}`),
  material_id: commonId(d.key),
  owner_id: null,
  min: d.min ? fraction(d.min) : null,
  typical: d.typical ? fraction(d.typical) : null,
  max: fraction(d.max),
  basis: "concentrate",
  authority: "literature",
  source: d.source,
  disputed: true,
  notes: `${d.note} · en disputa con la cifra de la tanda 23`,
}));
const disputedIds: string[] = [];
const updatedDoses = doses.rows.map((d) => {
  const from = (key: string, slug: string) => d.material_id === commonId(key) && d.disputed !== true && new RegExp(`^web: Fraterworks, https://fraterworks\\.com/products/${slug}(?![-\\w])`).test(String(d.source)) && !String(d.notes).includes("tanda 27");
  const isOld = from("MAT-ambrarome", "ambrarome-absolute") || from("MAT-clearwood", "clearwood");
  if (!isOld) return d;
  disputedIds.push(String(d.id));
  return { ...d, disputed: true, notes: `${d.notes} · en disputa (tanda 29): la página de Fraterworks da hoy otras cifras` };
});
if (disputedIds.length !== 2) throw new Error(`se esperaban 2 dosis de la tanda 23 en disputa, hay ${disputedIds.length}`);
const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT_COMMON, "material_doses.csv"), doses.header, asCells([...updatedDoses, ...newDoses]));
writeTable(join(OUT_COMMON, "material_components.csv"), components.header, asCells([...components.rows, ...commonComponents.rows]));

const count = (rows: Rec[]) => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(nameOf(String(r.material_id)), (m.get(nameOf(String(r.material_id))) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
};
const cell = (t: string) => t.replace(/\|/g, "/");
const amountText = (c: Rec) => (c.amount_kind === "range" ? `${c.min}–${c.max}` : c.amount_kind === "max" ? `≤ ${c.value}` : String(c.value));
writeFileSync(
  join(OUT_ACCOUNT, "informe.md"),
  `# Tanda 28 · Lo que dicen los documentos de tus botes de Perfumiarz

*Generada por \`migracion-v3/tanda-28-documentos.ts\` (sobre \`${BASE}\`) desde \`${WEB}/documentos-perfumiarz.csv\`: la SDS, el certificado IFRA y los alérgenos que Perfumiarz publica en cada producto, leídos por un subagente línea a línea (cada fila, con su página y su frase) y comprobados por la sesión. Es de tu cuenta (V3-39): va a tu versión de cada material, con autoridad \`product\`. Se aprueba con \`--cuenta\` y se carga con \`cargar-laboratorio.ts <correo> --tanda=28-documentos-tus-botes\`. Sin aprobar.*

## Topes del fabricante en la categoría 4 (${ceilings.length})

Son del producto, no de IFRA (V3-35, V3-39): la app los suma con IFRA y manda el más estricto.

| Material | Tope cat. 4 | Documento |
|---|---|---|
${ceilings.map((c) => `| ${nameOf(String(c.material_id))} | ${c.max_value} | ${cell(String(c.source)).slice(0, 160)} |`).join("\n")}

Sin tope numérico: ${noCeiling.join("; ") || "ninguno"}. Sin certificado IFRA en Perfumiarz: Luminide, Filbertone, Para-cresol y Operanide (solo SDS).

## Constituyentes de tus botes (${accountComponents.rows.length})

| Material | Constituyentes |
|---|---|
${count(accountComponents.rows).map(([n, k]) => `| ${n} | ${k} |`).join("\n")}

| Material | Constituyente | CAS | Cantidad |
|---|---|---|---|
${accountComponents.rows.map((c) => `| ${nameOf(String(c.material_id))} | ${cell(String(c.component_name))} | ${c.component_cas ?? "—"} | ${amountText(c)} |`).join("\n")}

## Lo que no entra

${accountComponents.left.map((l) => `- ${cell(l)}`).join("\n") || "Nada."}
`,
  "utf8",
);
writeFileSync(
  join(OUT_COMMON, "informe.md"),
  `# Tanda 29 · Documentos de otros proveedores y los conflictos de uso

*Generada por \`migracion-v3/tanda-28-documentos.ts\` (sobre \`${BASE}\`). Escribe \`v3/datos/material_doses.csv\` y \`v3/datos/material_components.csv\` enteros. Sin aprobar.*

## Constituyentes de literatura (${commonComponents.rows.length})

De los documentos que Fraterworks publica para **su** lote (\`${WEB}/documentos-fraterworks.csv\`), solo donde el material común aún no tiene ese CAS. No son de tus botes de Maese Lab.

| Material | Constituyente | CAS | Cantidad |
|---|---|---|---|
${commonComponents.rows.map((c) => `| ${nameOf(String(c.material_id))} | ${cell(String(c.component_name))} | ${c.component_cas ?? "—"} | ${amountText(c)} |`).join("\n")}

## Los conflictos de uso de la tanda 27

La dosis de la tanda 23 **se queda** y pasa a «en disputa»; se añaden las de hoy, también en disputa, para que la app enseñe las dos (V3-17).

| Material | Mín. | Típico | Máx. | Fuente |
|---|---|---|---|---|
${newDoses.map((d) => `| ${nameOf(String(d.material_id))} | ${d.min ?? "—"} | ${d.typical ?? "—"} | ${d.max} | ${cell(String(d.source))} |`).join("\n")}

Fracciones del concentrado (0.00311 = 0,311 %). Cambian dos filas ya aprobadas: ${disputedIds.join(", ")} (solo \`disputed\` y su nota).

## Lo que no entra

${commonComponents.left.map((l) => `- ${cell(l)}`).join("\n") || "Nada."}
`,
  "utf8",
);
console.log(`Tanda 28 (cuenta): ${ceilings.length} topes, ${accountComponents.rows.length} constituyentes. Tanda 29 (común): ${commonComponents.rows.length} constituyentes, ${newDoses.length} dosis, ${disputedIds.length} en disputa.`);
