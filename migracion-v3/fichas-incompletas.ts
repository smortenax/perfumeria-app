/**
 * The materials you have («lo tengo»), and what each one's sheet still lacks (bandeja del
 * laboratorio, 2026-11-18: «listar todas las fichas incompletas de los materiales que el usuario
 * ya tiene»). It only reads: the common data of v3/datos/ and your account as the batches left it
 * (the cloud is not reachable from here, so what you added by hand in the app is not seen).
 * A field counts as present when your version or any material it is based on has it (as the app
 * reads it: traits.ts, `inherited`).
 *
 *   node migracion-v3/fichas-incompletas.ts   → migracion-v3/fichas-incompletas/informe.md and .csv
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { writeTable } from "./lib/csv.ts";

type Row = Record<string, string>;
const OUT = "migracion-v3/fichas-incompletas";
const T = "migracion-v3/tandas";
const read = (path: string): Row[] => (existsSync(path) ? parseCsvRecords(readFileSync(path, "utf8")) : []);

/** The batches that went to your account, in the order they were loaded. */
const ACCOUNT = [
  "8-tu-version",
  "17-tus-nuevos",
  "24-tus-altas-26-oct",
  "28-documentos-tus-botes",
  "31-tu-artemisa-vulgaris",
  "33-tus-altas-maese-28-oct",
  "37-tus-nombres-en-ingles",
  "39-tus-altas-maese-30-oct",
  "40-timbersilk",
  "53-tu-ambar-gris",
];

const materials = new Map<string, Row>();
for (const m of read("v3/datos/materials.csv")) materials.set(m.id, m);
const mine = new Set<string>();
const has = new Set<string>();
const children = (table: string) => {
  const by = new Map<string, Row[]>();
  for (const r of read(`v3/datos/${table}.csv`)) by.set(r.material_id, [...(by.get(r.material_id) ?? []), r]);
  return by;
};
const doses = children("material_doses");
const components = children("material_components");
const regulations = children("regulations");
const descriptors = children("material_descriptors");
const add = (by: Map<string, Row[]>, r: Row) => by.set(r.material_id, [...(by.get(r.material_id) ?? []), r]);

for (const batch of ACCOUNT) {
  for (const m of read(join(T, batch, "materials.csv"))) {
    materials.set(m.id, { ...(materials.get(m.id) ?? {}), ...m });
    mine.add(m.id);
  }
  for (const r of read(join(T, batch, "material_doses.csv"))) add(doses, r);
  for (const r of read(join(T, batch, "material_components.csv"))) add(components, r);
  for (const r of read(join(T, batch, "regulations.csv"))) add(regulations, r);
  for (const r of read(join(T, batch, "material_descriptors.csv"))) add(descriptors, r);
  for (const r of read(join(T, batch, "lab_materials.csv"))) has.add(r.material_id);
  for (const c of read(join(T, batch, "cambiar.csv"))) {
    if (c.table !== "materials") continue;
    for (const m of c.id ? [materials.get(c.id)] : [...mine].map((id) => materials.get(id))) {
      if (m && (m[c.column] ?? "") === c.before) m[c.column] = c.after;
    }
  }
}

const chainOf = (id: string): Row[] => {
  const chain: Row[] = [];
  for (let m = materials.get(id); m && chain.length < 10; m = m.based_on_id ? materials.get(m.based_on_id) : undefined) chain.push(m);
  return chain;
};
const first = (chain: Row[], key: string) => chain.map((m) => (m[key] ?? "").trim()).find((v) => v !== "" && v !== "[]") ?? "";
const any = (chain: Row[], by: Map<string, Row[]>, keep: (r: Row) => boolean = () => true) => chain.some((m) => (by.get(m.id) ?? []).some(keep));

/** What a sheet should say, and how to tell it lacks it. */
const CHECKS: ReadonlyArray<{ key: string; label: string; lacks: (chain: Row[]) => boolean }> = [
  { key: "cas", label: "CAS", lacks: (c) => !first(c, "cas") },
  { key: "species", label: "especie (natural)", lacks: (c) => first(c, "kind") === "natural" && !first(c, "species") },
  { key: "family", label: "familia", lacks: (c) => !first(c, "family") },
  { key: "supplier", label: "proveedor", lacks: (c) => !(c[0].supplier ?? "").trim() },
  { key: "product", label: "producto", lacks: (c) => !(c[0].product ?? "").trim() && !(c[0].product_url ?? "").trim() },
  { key: "house", label: "fabricante", lacks: (c) => first(c, "kind") !== "natural" && !first(c, "house") },
  { key: "documents", label: "documentos", lacks: (c) => !any(c, components, (r) => r.authority === "product" || r.authority === "batch" || r.authority === "lote" || r.authority === "producto") },
  { key: "doses", label: "dosis", lacks: (c) => !any(c, doses) },
  { key: "tenacity", label: "duración", lacks: (c) => !first(c, "tenacity_hours") },
  { key: "strength", label: "fuerza", lacks: (c) => !first(c, "impact") && !first(c, "strength") },
  { key: "descriptors", label: "descriptores", lacks: (c) => !any(c, descriptors) },
  { key: "ifra", label: "IFRA sin comprobar", lacks: (c) => c[0].ifra_unverified === "true" },
];

const rows = [...has]
  .map((id) => {
    const chain = chainOf(id);
    // The diluents (ethanol, DPG, IPM…) are not perfume materials: their sheet needs none of this.
    if (chain.length === 0 || first(chain, "solvent") === "true") return null;
    const lacking = CHECKS.filter((k) => k.lacks(chain));
    return { id, name: chain[0].name, kind: first(chain, "kind"), supplier: (chain[0].supplier ?? "").trim(), lacking };
  })
  .filter((r): r is NonNullable<typeof r> => r !== null)
  .sort((a, b) => b.lacking.length - a.lacking.length || a.name.localeCompare(b.name));
const missingIds = [...has].filter((id) => !materials.has(id));

mkdirSync(OUT, { recursive: true });
writeTable(
  join(OUT, "fichas-incompletas.csv"),
  ["material_id", "name", "kind", "supplier", ...CHECKS.map((k) => `lacks_${k.key}`)],
  rows.map((r) => ({
    material_id: r.id,
    name: r.name,
    kind: r.kind,
    supplier: r.supplier,
    ...Object.fromEntries(CHECKS.map((k) => [`lacks_${k.key}`, r.lacking.includes(k) ? "yes" : ""])),
  })),
);
const count = (k: (typeof CHECKS)[number]) => rows.filter((r) => r.lacking.includes(k)).length;
writeFileSync(
  join(OUT, "informe.md"),
  `# Fichas incompletas de los materiales que tienes

*Generado por \`migracion-v3/fichas-incompletas.ts\`. Bandeja del laboratorio, 2026-11-18: «listar todas las fichas incompletas de los materiales que el usuario ya tiene». Solo lee: lo común de \`v3/datos/\` y tu cuenta tal como la dejaron las tandas ${ACCOUNT.map((b) => b.split("-")[0]).join(", ")}. **Lo que hayas dado de alta o cambiado a mano en la app no se ve aquí** (desde la nube no hay acceso a tu cuenta).*

Un campo cuenta como lleno si lo tiene tu versión o el material en que se basa. Proveedor y producto se miran solo en tu versión (son de tu bote). Fabricante, solo en moléculas y bases. «Documentos» es composición de autoridad producto o lote (SDS, alérgenos, CoA del bote); lo común solo trae literatura. «Fuerza» es el impacto de 1 a 10 o la fuerza en palabras. Los diluyentes no se cuentan.

**${rows.length} materiales con «lo tengo»**${missingIds.length ? ` (y ${missingIds.length} «lo tengo» que apuntan a un material que no está: ${missingIds.join(", ")})` : ""}. ${rows.filter((r) => r.lacking.length === 0).length} completos.

| Falta | Materiales |
|---|---|
${CHECKS.map((k) => `| ${k.label} | ${count(k)} |`).join("\n")}

## Uno por uno

| Material | Tipo | Proveedor | Le falta |
|---|---|---|---|
${rows
  .filter((r) => r.lacking.length > 0)
  .map((r) => `| ${r.name} | ${r.kind || "—"} | ${r.supplier || "—"} | ${r.lacking.map((k) => k.label).join(", ")} |`)
  .join("\n")}
`,
  "utf8",
);
console.log(`${rows.length} materiales; ${rows.filter((r) => r.lacking.length > 0).length} con huecos. ${OUT}/informe.md`);
