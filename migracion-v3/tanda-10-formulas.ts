/**
 * Batch 10, your formulas (plan v3, step 7.5; V3-19, V3-48), first part: what has to be decided
 * before importing them. Reads the copy of your library (step 7.4; each file must match the hash
 * of migracion-v3/biblioteca/manifiesto.csv) and resolves every material key of every formula:
 *
 * - a key of the v2 or the v1 (`v2:`, `fig:`, `prod:`, `ncs:`) that leads to one of your 111 lab
 *   materials, through its pair (respuestas/laboratorio.csv, datos/v2/v1-a-v2.csv): your version
 *   of it (your bottle, V3-39); without a version, the common one;
 * - `solv:`: your common solvents (Etanol, DPG, IPM);
 * - `vec:`: a frozen formula of yours, with its composition, its keys resolved the same way;
 * - the rest, and every `prov:`, to conflictos/materiales-formulas.csv, one by one (V3-48), with a
 *   proposal: one of your 111 by its CAS or its name, or a new provisional of yours.
 *
 * Every formula needs a workbench (V3-19): conflictos/bancos.csv proposes one (its subfolder; else
 * its family of versions; else its own name). You answer both in respuestas/.
 *
 *   node migracion-v3/tanda-10-formulas.ts
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { readSources } from "./lib/fuentes.ts";
import { uuidFor } from "./lib/ids.ts";

const LIBRARY = "migracion-v3/biblioteca";
type Rec = Record<string, string>;
const csv = (path: string): Rec[] => parseCsvRecords(readFileSync(path, "utf8")) as Rec[];
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// ------------------------------------------------------------ the library, as copied in 7.4
interface FileFormula {
  readonly file: string;
  readonly folder: string;
  readonly json: {
    header: { name: string; version?: { family: string; number: number; from: number | null } };
    materials: Record<string, { kind: string; name: string; cas?: string; solvent?: boolean; vector?: [string, string][] }>;
  };
}
const formulas: FileFormula[] = csv(join(LIBRARY, "manifiesto.csv")).map((m) => {
  const bytes = readFileSync(join(LIBRARY, "archivos", m.id));
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== m.sha256) throw new Error(`${m.id} no es el del manifiesto: vuelve a copiar la biblioteca (copiar-biblioteca.ts).`);
  return { file: m.id, folder: m.carpeta, json: JSON.parse(bytes.toString("utf8")) };
});

// ------------------------------------------------------------ your lab materials, and how a key reaches them
const src = readSources();
const products = new Map(src.v2.products.map((p) => [p.id, p]));
const answers = csv("migracion-v3/respuestas/laboratorio.csv");
/** A v2 material or product → the lab materials paired with it. */
const labOfTarget = new Map<string, Set<string>>();
for (const r of answers) {
  const answer = r.respuesta.trim();
  if (!answer.startsWith("versión de ")) continue;
  const target = answer.slice("versión de ".length);
  for (const t of [target, products.get(target)?.materialId].filter((x): x is string => !!x)) labOfTarget.set(t, (labOfTarget.get(t) ?? new Set()).add(r.id));
}
/** A v1 key → its v2 materials and products. */
const v2OfV1 = new Map<string, Set<string>>();
for (const l of src.v2.v1Links) for (const t of [l.v2Id, l.productId].filter((x): x is string => !!x)) v2OfV1.set(l.v1Id, (v2OfV1.get(l.v1Id) ?? new Set()).add(t));

const commons = csv("v3/datos/materials.csv");
const labIdOf = new Map(answers.map((r) => [uuidFor(`comun:${r.id}`), r.id]));
const versions = new Set(csv("migracion-v3/tandas/8-tu-version/materials.csv").map((m) => m.id));
const nameOfLab = new Map(commons.map((c) => [labIdOf.get(c.id)!, c.name]));
/** The material a formula points at for one of your lab materials: your version, else the common one (V3-48). */
const targetOf = (lab: string) => (versions.has(uuidFor(`tuya:${lab}`)) ? uuidFor(`tuya:${lab}`) : uuidFor(`comun:${lab}`));

const SOLVENTS: Record<string, RegExp> = { "solv:alcohol": /^etanol/i, "solv:dpg": /^dpg/i, "solv:ipm": /^ipm/i };
const solventLab = (key: string) => {
  const c = commons.find((m) => m.solvent === "true" && SOLVENTS[key]?.test(m.name));
  return c ? labIdOf.get(c.id)! : null;
};

/** How one key resolves without asking: to a lab material, or null. */
function labsOf(key: string): Set<string> {
  const [prefix] = key.split(":");
  if (prefix === "solv") return new Set([solventLab(key)].filter((x): x is string => !!x));
  if (prefix === "v2") return labOfTarget.get(key.slice(3)) ?? new Set();
  if (["fig", "prod", "ncs", "cas", "tienda", "tl"].includes(prefix)) return new Set([...(v2OfV1.get(key) ?? [])].flatMap((t) => [...(labOfTarget.get(t) ?? [])]));
  return new Set();
}

// ------------------------------------------------------------ every key, with the formulas that use it
interface KeyUse {
  readonly key: string;
  readonly name: string;
  readonly cas: string | null;
  readonly files: Set<string>;
}
const keys = new Map<string, KeyUse>();
const note = (key: string, entry: { name: string; cas?: string }, file: string) => {
  const at = keys.get(key) ?? { key, name: entry.name, cas: entry.cas ?? null, files: new Set<string>() };
  at.files.add(file);
  keys.set(key, at);
};
for (const f of formulas) {
  for (const [key, entry] of Object.entries(f.json.materials)) {
    note(key, entry, f.file);
    for (const [inner] of entry.vector ?? []) note(inner, f.json.materials[inner] ?? { name: inner.replace(/^\w+:/, "") }, f.file);
  }
}

const resolved: Array<[string, string]> = [];
const ambiguous: string[] = [];
const conflictRows: Array<Record<string, Cell>> = [];
const byCas = new Map<string, string[]>();
for (const c of commons) for (const cas of [c.cas, ...JSON.parse(c.other_cas || "[]")].filter((x: string) => x)) byCas.set(cas, [...(byCas.get(cas) ?? []), labIdOf.get(c.id)!]);
const byName = new Map<string, string[]>();
for (const c of commons) for (const n of [c.name, ...JSON.parse(c.aliases || "[]")]) byName.set(fold(n), [...new Set([...(byName.get(fold(n)) ?? []), labIdOf.get(c.id)!])]);

for (const use of [...keys.values()].sort((a, b) => a.key.localeCompare(b.key))) {
  if (use.key.startsWith("vec:")) continue;
  const labs = labsOf(use.key);
  if (labs.size === 1 && !use.key.startsWith("prov:")) {
    resolved.push([use.key, [...labs][0]]);
    continue;
  }
  if (labs.size > 1) ambiguous.push(`${use.key} («${use.name}»): ${[...labs].join(", ")}`);
  // One by one (V3-48): a proposal, never a merge in silence.
  // A provisional named as a CAS, with zeros more as some sheets write it (P52): «0123-07-09» is 123-07-9.
  const typedCas = /^\s*0*(\d{2,7})-(\d{2})-0?(\d)\s*$/.exec(use.name);
  const cas = use.cas ?? (typedCas ? `${typedCas[1]}-${typedCas[2]}-${typedCas[3]}` : null);
  const casHit = cas ? (byCas.get(cas) ?? []) : [];
  const nameHit = byName.get(fold(use.name)) ?? [];
  // Weaker: your material's name starts with it, up to a comma or a bracket («Cedro chino, aceite esencial»).
  const headHit = [...new Set(commons.filter((c) => fold(c.name.split(/[,(]/)[0]) === fold(use.name)).map((c) => labIdOf.get(c.id)!))];
  const candidate = labs.size > 1 ? [...labs][0] : casHit.length === 1 ? casHit[0] : nameHit.length === 1 ? nameHit[0] : headHit.length === 1 ? headHit[0] : null;
  const why =
    labs.size > 1
      ? `su pareja lleva a varios de tus materiales (${[...labs].join(", ")}): el primero`
      : casHit.length === 1
        ? `el mismo CAS (${cas}) que tu «${nameOfLab.get(casHit[0])}»`
        : nameHit.length === 1
          ? `el mismo nombre que tu «${nameOfLab.get(nameHit[0])}»`
          : headHit.length === 1
            ? `tu «${nameOfLab.get(headHit[0])}» empieza por su nombre`
            : casHit.length > 1
            ? `su CAS lo tienen varios de los tuyos (${casHit.join(", ")}): no se elige`
            : "ninguno de tus 111 tiene su CAS ni su nombre";
  const files = [...use.files].sort();
  conflictRows.push({
    id: use.key,
    nombre: use.name,
    cas: use.cas,
    formulas: `${files.length}: ${files.join(" | ")}`,
    recomendacion: candidate ? `tuyo:${candidate}` : "provisional",
    candidato: candidate ? nameOfLab.get(candidate) ?? null : null,
    motivo: why,
  });
}
writeTable("migracion-v3/conflictos/materiales-formulas.csv", ["id", "nombre", "cas", "formulas", "recomendacion", "candidato", "motivo"], conflictRows);

// ------------------------------------------------------------ the workbenches (V3-19)
const families = new Map<string, FileFormula[]>();
for (const f of formulas) if (f.json.header.version) families.set(f.json.header.version.family, [...(families.get(f.json.header.version.family) ?? []), f]);
const benchRows = formulas.map((f) => {
  const family = f.json.header.version ? families.get(f.json.header.version.family)! : null;
  const first = family?.find((x) => x.json.header.version?.number === 1) ?? family?.[0];
  const [bench, why] = f.folder
    ? [f.folder, "su subcarpeta de la biblioteca"]
    : first
      ? [first.json.header.name.trim(), `su familia de versiones (${family!.length}), con el nombre de la primera`]
      : [f.json.header.name.trim() || f.file.replace(/\.json$/, ""), "sin subcarpeta ni versiones: un banco con su nombre"];
  return { id: f.file, nombre: f.json.header.name.trim(), recomendacion: bench, motivo: why };
});
writeTable("migracion-v3/conflictos/bancos.csv", ["id", "nombre", "recomendacion", "motivo"], benchRows);

const vec = [...keys.keys()].filter((k) => k.startsWith("vec:"));
const report = `# Tanda 10 · Tus fórmulas: lo que decides antes de importarlas

*Generada por \`migracion-v3/tanda-10-formulas.ts\` desde la copia de tu biblioteca (paso 7.4; cada archivo coincide con su SHA-256 del manifiesto), tus parejas (\`respuestas/laboratorio.csv\`) y la v2 y la v1 del commit \`${src.commit}\`. Todavía no escribe ninguna fórmula: primero respondes los dos CSV.*

- **${formulas.length} fórmulas, ${keys.size} claves de material** (contando las de dentro de los acordes congelados).
- **${resolved.length} se resuelven solas:** llevan a uno de tus 111 por su pareja (a tu versión, tu frasco, si la tienes; V3-48), o son disolventes.
- **${vec.length} acordes congelados** (\`vec:\`): entrarán como material congelado tuyo con su composición.
- **${conflictRows.length} van a \`conflictos/materiales-formulas.csv\`** (V3-48): ${conflictRows.filter((r) => String(r.recomendacion).startsWith("tuyo:")).length} con un material tuyo propuesto y ${conflictRows.filter((r) => r.recomendacion === "provisional").length} como provisional nuevo. Respondes en \`respuestas/materiales-formulas.csv\` (\`id,respuesta\`): \`tuyo:<id del laboratorio>\` o \`provisional\`.
- **Bancos** (V3-19): \`conflictos/bancos.csv\` propone uno para cada fórmula; ${new Set(benchRows.map((b) => b.recomendacion)).size} bancos. Respondes en \`respuestas/bancos.csv\` (\`id,respuesta\`), con el nombre del banco.
${ambiguous.length ? `\n**Claves cuya pareja lleva a varios materiales tuyos** (van al CSV):\n\n${ambiguous.map((a) => `- ${a}`).join("\n")}\n` : ""}`;
writeFileSync("migracion-v3/tandas/10-formulas-informe.md", report, "utf8");
console.log(`Tanda 10: ${formulas.length} fórmulas, ${keys.size} claves; ${resolved.length} resueltas, ${conflictRows.length} al CSV, ${vec.length} acordes; bancos: ${new Set(benchRows.map((b) => b.recomendacion)).size}. ${existsSync("migracion-v3/respuestas/materiales-formulas.csv") ? "Hay respuestas." : "Sin respuestas todavía."}`);
