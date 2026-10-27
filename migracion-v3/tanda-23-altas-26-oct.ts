/**
 * Batch 23 (2026-10-27): the 20 materials that arrived on 2026-10-26 (10 from Perfumiarz, 10 from
 * Maese Lab), into the common data, each in a category of its own (V3-13), with their information
 * table at once (as batches 13 and 14 did in two steps). The user, 2026-10-27: «si adelante puedes
 * pasarlo a la repo de la app con la info necesaria». The search is the lab's (perfumeria-lab,
 * biblioteca/investigaciones/2026-10-26-altas, commit eef4193), copied to
 * migracion-v3/web/altas-2026-10-26/: lista.csv (names, shop's product, shop), fichas-2026-10-26.csv
 * (each value with its URL and the sentence that backs it, after the user's decisions) and
 * avisos.csv (identity warnings). `origen` says whose each value is; «propuesta de la sesión»
 * (family, its detail, facets, tier, role, some forms) is a reading, to be checked before approving.
 * A usage level is a dose in the concentrate, never an IFRA limit; IFRA reads the CAS from its layer
 * (V3-35). What the search did not find is left empty, never invented (V3-46, V3-51).
 * Writes the whole common tables as approved at BASE, with these added.
 *
 *   node migracion-v3/tanda-23-altas-26-oct.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/23-altas-26-oct";
const WEB = "migracion-v3/web/altas-2026-10-26";
const LAB = "laboratorio, biblioteca/investigaciones/2026-10-26-altas (commit eef4193)";
// The common data as batch 22 left it (its approval, 2d856d7): redoing the batch gives the same tables.
const BASE = "2d856d7";
type Rec = Record<string, Cell>;
const read = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = read("v3/datos/materials.csv");
const categories = read("v3/datos/material_categories.csv");
const descriptors = read("v3/datos/material_descriptors.csv");
const doses = read("v3/datos/material_doses.csv");
const ifraSubstances = read("v3/datos/ifra_substances.csv").rows;
const annex = read("v3/datos/ifra_annex.csv").rows;
const local = (file: string) => parseCsvRecords(readFileSync(join(WEB, file), "utf8"));
const list = local("lista.csv");
const found = local("fichas-2026-10-26.csv");
const warnings = local("avisos.csv");

/** What each one is (V3-6): a single molecule, a natural (species, part, process) or a manufacturer's base. */
const KIND: Readonly<Record<string, "molecule" | "natural" | "composition">> = {
  "MAT-filbertone": "molecule", "MAT-isobutavan": "molecule", "MAT-luminide": "molecule", "MAT-operanide": "molecule",
  "MAT-para-cresol": "molecule", "MAT-exaltolide-total": "molecule", "MAT-indol": "molecule", "MAT-etil-vainillina": "molecule",
  "MAT-veramoss": "molecule",
  "MAT-ambrarome": "composition", "MAT-shangralide": "composition", "MAT-prunella": "composition", "MAT-orris-givco": "composition",
  // Clearwood is no species' oil but a biotech ingredient rich in patchoulol (Fraterworks: «Natural Isolate»): a product, not a natural.
  "MAT-clearwood": "composition",
  "MAT-mirra-aceite-esencial": "natural", "MAT-opoponax-aceite-esencial": "natural", "MAT-galbano-aceite-esencial": "natural",
  "MAT-ambreta-tintura": "natural", "MAT-cardamomo-verde-tintura": "natural", "MAT-cardamomo-villoso-tintura": "natural",
};
/** The form, in the words the common data already uses; the lab's longer text goes to the notes. */
const formOf = (text: string) =>
  text.startsWith("aceite esencial") ? "aceite esencial" : text.startsWith("base") ? "base" : text === "tintura" ? "tintura" : null;

const SCALAR = new Set([
  "house", "code", "synthesis", "isomers", "family", "family_detail", "facets", "tier", "role", "strength", "diffusion", "blend_effect",
  "recommended_dilution", "handling", "physical_state", "appearance", "solubility", "density", "melting_point_c", "formula",
  "molecular_weight", "vapor_pressure", "stability", "incompatibilities", "species", "part", "process", "origin", "inci", "tenacity_hours",
]);
const PHYSICAL = new Set(["physical_state", "appearance", "solubility", "density", "melting_point_c", "formula", "molecular_weight", "vapor_pressure"]);
const ENUMS: Record<string, readonly string[]> = {
  family: ["citrus", "green", "ozonic", "floral", "fruity", "spicy", "woody", "animal", "transformed", "gourmand"],
  strength: ["low", "medium", "high", "very_high"],
  tier: ["top", "top_heart", "heart", "heart_base", "base"],
  role: ["modifier", "structure", "fixative", "trace", "bridge", "booster"],
  synthesis: ["synthetic", "natural", "semisynthetic"],
};
const NUMERIC = new Set(["density", "melting_point_c", "molecular_weight", "tenacity_hours"]);
const CAS = /\b\d{2,7}-\d{2}-\d\b/;
const proposal = (origen: string) => origen.startsWith("propuesta");
const site = (origen: string) => origen.replace(/ \(.*\)$/, "");

const knownCas = new Set(materials.rows.filter((m) => !m.owner_id).flatMap((m) => [String(m.cas ?? ""), ...(JSON.parse(String(m.other_cas || "[]")) as string[])]).filter((c) => c));
const knownNames = new Set(materials.rows.filter((m) => !m.owner_id).map((m) => String(m.name).toLowerCase()));

type Line = { material: string; campo: string; valor: string; origen: string; url: string; frase: string; dónde: string };
const report: Line[] = [];
const newMaterials: Rec[] = [];
const newCategories: Rec[] = [];
const newDescriptors: Rec[] = [];
const newDoses: Rec[] = [];
for (const item of list) {
  const key = item.id;
  const kind = KIND[key];
  if (!kind) throw new Error(`${key}: sin tipo`);
  const rows = found.filter((r) => r.material_id === key);
  if (rows.length === 0) throw new Error(`${key}: sin ficha`);
  const m: Rec = Object.fromEntries(materials.header.map((c) => [c, null]));
  const notes: string[] = [`Alta del 2026-10-26 (tanda 23), con su ficha de la investigación del ${LAB}.`];
  const aliases = new Set<string>([item.producto_tienda].filter((a) => a && a !== item.nombre));
  const otherCas = new Set<string>();
  const sites = new Set<string>();
  const doseBy = new Map<string, Rec>();
  let physicalUrl: string | null = null;
  for (const r of rows) {
    if (!r.url && !proposal(r.origen)) throw new Error(`${item.nombre} ${r.campo}: sin URL`);
    const line: Line = { material: item.nombre, campo: r.campo, valor: r.valor, origen: r.origen, url: r.url, frase: r.frase, dónde: "" };
    report.push(line);
    if (!proposal(r.origen)) sites.add(site(r.origen));
    if (r.campo === "cas") {
      const cas = CAS.exec(r.valor)?.[0];
      if (!cas) {
        line.dónde = "sin CAS (mezcla): no entra";
        continue;
      }
      m.cas = cas;
      line.dónde = "CAS";
    } else if (r.campo === "other_cas") {
      const cas = CAS.exec(r.valor)?.[0];
      if (!cas) throw new Error(`${item.nombre}: «${r.valor}» no es un CAS`);
      otherCas.add(cas);
      if (r.valor !== cas) notes.push(`Otro CAS ${r.valor} (${r.origen}).`);
      line.dónde = "otro CAS";
    } else if (r.campo === "aliases") {
      aliases.add(r.valor);
      line.dónde = "otro nombre";
    } else if (r.campo === "form") {
      const form = formOf(r.valor);
      if (form) m.form = form;
      if (r.valor !== form && r.valor !== "molécula") notes.push(`Forma, según ${r.origen}: ${r.valor}.`);
      line.dónde = form ? "forma" : "nota";
    } else if (SCALAR.has(r.campo)) {
      if (ENUMS[r.campo] && !ENUMS[r.campo].includes(r.valor)) throw new Error(`${item.nombre} ${r.campo}: «${r.valor}» no es un valor admitido`);
      if (NUMERIC.has(r.campo) && !/^-?\d+(\.\d+)?$/.test(r.valor)) throw new Error(`${item.nombre} ${r.campo}: «${r.valor}» no es un número`);
      if (m[r.campo] !== null) throw new Error(`${item.nombre} ${r.campo}: dos valores`);
      m[r.campo] = r.valor;
      if (r.campo === "tenacity_hours") m.tenacity_source = `web: ${site(r.origen)}, ${r.url}: «${r.frase}»`;
      if (PHYSICAL.has(r.campo)) physicalUrl ??= `web: ${site(r.origen)}, ${r.url}`;
      line.dónde = "ficha";
    } else if (r.campo === "descriptor") {
      newDescriptors.push({ id: uuidFor(`desc:v3:tanda23:${key}:${r.valor}`), material_id: null, owner_id: null, source: r.origen.startsWith("TGSC") ? "TG" : "web", text: r.valor, key });
      line.dónde = "descriptor";
    } else if (/^dose_(min|typical|max)$/.test(r.campo)) {
      if (!/^\d+(\.\d+)?$/.test(r.valor)) throw new Error(`${item.nombre} ${r.campo}: «${r.valor}» no es un número`);
      const at = `${key}|${r.url}`;
      const dose = doseBy.get(at) ?? {
        id: uuidFor(`dose:v3:tanda23:${at}`), material_id: null, owner_id: null, min: null, typical: null, max: null,
        basis: "concentrate", authority: "literature", source: `web: ${site(r.origen)}, ${r.url}`, disputed: false, notes: "", key,
      };
      dose[r.campo.slice(5)] = r.valor;
      dose.notes = `${String(dose.notes)} «${r.frase}»`.trim();
      doseBy.set(at, dose);
      line.dónde = "dosis (fracción del concentrado)";
    } else if (r.campo === "notes") {
      notes.push(`${r.origen}: ${r.valor}`);
      line.dónde = "nota";
    } else {
      throw new Error(`${item.nombre}: campo desconocido «${r.campo}»`);
    }
  }
  for (const w of warnings.filter((w) => w.material_id === key)) notes.push(`${w.tipo === "no_encontrado" ? "No encontrado" : "Identidad"}: ${w.texto}`);
  if (m.cas && knownCas.has(String(m.cas))) throw new Error(`${item.nombre}: su CAS ya lo tiene un material común`);
  // Another CAS that is already another common material's (Clearwood: 84238-39-1 is patchouli oil's) would
  // make the search and IFRA take one for the other: it stays out, said in the notes.
  for (const c of [...otherCas].filter((c) => knownCas.has(c))) {
    otherCas.delete(c);
    const owner = materials.rows.find((x) => !x.owner_id && (x.cas === c || String(x.other_cas).includes(c)));
    notes.push(`El CAS ${c} no entra: es el de «${owner?.name}», otro material común.`);
    report.push({ material: item.nombre, campo: "other_cas", valor: c, origen: "propuesta de la sesión", url: "", frase: "", dónde: `no entra: es de «${owner?.name}»` });
  }
  if (knownNames.has(item.nombre.toLowerCase())) throw new Error(`«${item.nombre}» ya es un material común`);
  otherCas.delete(String(m.cas));
  const id = uuidFor(`comun:tanda23:${key}`);
  const category = uuidFor(m.cas ? `cat:v3:cas:${m.cas}` : `cat:v3:tanda23:${key}`);
  if (categories.rows.some((c) => c.id === category)) throw new Error(`${item.nombre}: su categoría ya existe`);
  newCategories.push({ id: category, name: item.nombre, aliases: [] });
  for (const d of newDescriptors.filter((d) => d.key === key)) d.material_id = id;
  for (const d of doseBy.values()) newDoses.push({ ...d, material_id: id, notes: `${String(d.notes)} Uso observado o recomendado, no un límite de IFRA.` });
  Object.assign(m, {
    id,
    name: item.nombre,
    kind,
    solvent: false,
    aliases: [...aliases],
    other_cas: [...otherCas],
    category_id: category,
    disputed_fields: [],
    physical_sources: physicalUrl,
    sources: `${LAB}: ${[...sites].sort().join(", ")}`,
    confidence: warnings.some((w) => w.material_id === key && w.tipo === "aviso_identidad") ? "medium" : "high",
    notes: notes.join(" "),
  });
  newMaterials.push(m);
}

const strip = (rows: Rec[]) => rows.map(({ key: _, ...r }) => r);
const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "materials.csv"), materials.header, [...asCells(materials.rows), ...newMaterials]);
writeTable(join(OUT, "material_categories.csv"), categories.header, [...asCells(categories.rows), ...newCategories]);
writeTable(join(OUT, "material_descriptors.csv"), descriptors.header, [...asCells(descriptors.rows), ...strip(newDescriptors)]);
writeTable(join(OUT, "material_doses.csv"), doses.header, [...asCells(doses.rows), ...strip(newDoses)]);

const ifraOf = (m: Rec) => {
  const all = [String(m.cas ?? ""), ...(m.other_cas as string[])].filter((c) => c);
  const std = all.filter((c) => ifraSubstances.some((s) => s.cas === c));
  if (std.length) return `estándar por su CAS (${std.join(", ")})`;
  if (all.some((c) => annex.some((a) => a.natural_cas === c))) return "en el anexo (constituyentes)";
  return all.length ? "sin estándar por su CAS" : "sin CAS: IFRA no lo cruza";
};
const KINDS = { molecule: "molécula", natural: "natural", composition: "base o producto" } as const;
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 23 · Los ${newMaterials.length} materiales del 2026-10-26, en lo común, con su ficha

*Generada por \`migracion-v3/tanda-23-altas-26-oct.ts\` (2026-10-27). El usuario: «si adelante puedes pasarlo a la repo de la app con la info necesaria». La ficha sale de la investigación del ${LAB}, copiada en \`${WEB}/\`. Escribe las tablas enteras de lo común como están aprobadas (${BASE}), con estos añadidos: los ${materials.rows.filter((m) => !m.owner_id).length} de antes no cambian.*

Entran ${newMaterials.length} materiales, ${newCategories.length} categorías, ${newDescriptors.length} descriptores y ${newDoses.length} filas de dosis. Los nombres son los tuyos; el producto de la tienda queda como otro nombre. **Lo marcado «propuesta de la sesión» (familia, matiz, facetas, nivel, papel) es una lectura, para que lo corrijas antes de aprobar.** La dosis es uso observado o recomendado en el concentrado, no un límite de IFRA.

| Nombre | Tipo | CAS | Otros CAS | Confianza | IFRA |
|---|---|---|---|---|---|
${newMaterials.map((m) => `| ${m.name} | ${KINDS[m.kind as keyof typeof KINDS]} | ${m.cas ?? "—"} | ${(m.other_cas as string[]).join(", ")} | ${m.confidence === "high" ? "alta" : "media (aviso de identidad)"} | ${ifraOf(m)} |`).join("\n")}

**Para mirar antes de aprobar:**

- **Clearwood**, como base o producto y no como natural: no es el aceite de una especie, sino un ingrediente de biotecnología rico en patchoulol (propuesta de la sesión).
- **Sin CAS** (Shangralide, Prunella, Orris Givco, Ambrarome, cardamomo villoso): IFRA no los cruza; sus límites, del certificado del fabricante.
- **Opopónax:** la tienda da 93686-00-1 y 100084-96-6; el estándar 70 de IFRA está en 8021-36-1, que entra como otro CAS (de TGSC y Robertet).
- **Constituyentes y alérgenos:** ninguno. Salen de los documentos del fabricante: es la tarea \`docs-v3/tareas/2026-10-27-info-altas.md\`.

${list
  .map((item) => {
    const lines = report.filter((l) => l.material === item.nombre);
    return `## ${item.nombre}

| Campo | Valor | Entra como | De dónde |
|---|---|---|---|
${lines.map((l) => `| ${l.campo} | ${cell(l.valor)} | ${l.dónde} | ${proposal(l.origen) ? `propuesta de la sesión${l.frase ? `, por «${cell(l.frase)}»` : ""}` : `${cell(l.origen)}: «${cell(l.frase)}» ${l.url}`} |`).join("\n")}
`;
  })
  .join("\n")}`,
  "utf8",
);
console.log(`Tanda 23: ${newMaterials.length} materiales, ${newCategories.length} categorías, ${newDescriptors.length} descriptores, ${newDoses.length} dosis. ${OUT}/informe.md`);
