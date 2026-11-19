/**
 * Los materiales que tienes a los que les falta algo que TGSC suele dar (horas en tira, uso habitual,
 * fuerza, familia), con un enlace de búsqueda por CAS o nombre. TGSC devuelve 403 a las lecturas
 * automáticas: el usuario abre cada enlace en su navegador y guarda la página en paginas/ (el usuario,
 * 2026-11-19: «si, prepara la lista»).
 *   node migracion-v3/fichas-incompletas.ts && node migracion-v3/web/tgsc/lista.ts   → lista.csv y lista.md
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../../../src/data/csv.ts";
import { writeTable } from "../../lib/csv.ts";

type Row = Record<string, string>;
const read = (p: string): Row[] => (existsSync(p) ? (parseCsvRecords(readFileSync(p, "utf8")) as Row[]) : []);
const ACCOUNT = ["8-tu-version", "17-tus-nuevos", "24-tus-altas-26-oct", "28-documentos-tus-botes", "31-tu-artemisa-vulgaris", "33-tus-altas-maese-28-oct", "37-tus-nombres-en-ingles", "39-tus-altas-maese-30-oct", "40-timbersilk", "53-tu-ambar-gris"];
const materials = new Map(read("v3/datos/materials.csv").map((m) => [m.id, m]));
const commonIds = new Set(materials.keys());
for (const b of ACCOUNT) for (const m of read(join("migracion-v3/tandas", b, "materials.csv"))) if (!commonIds.has(m.id)) materials.set(m.id, m);
const chain = (id: string) => {
  const out: Row[] = [];
  for (let m = materials.get(id); m && out.length < 10; m = m.based_on_id ? materials.get(m.based_on_id) : undefined) out.push(m);
  return out;
};
const first = (c: Row[], k: string) => c.map((m) => (m[k] ?? "").trim()).find((v) => v && v !== "[]") ?? "";
const LABEL: Record<string, string> = { tenacity: "horas", doses: "uso", strength: "fuerza", family: "familia" };
const rows = read("migracion-v3/fichas-incompletas/fichas-incompletas.csv")
  .map((r) => ({ r, c: chain(r.material_id), gaps: Object.keys(LABEL).filter((k) => r[`lacks_${k}`] === "yes") }))
  .filter((x) => x.gaps.length)
  .sort((a, b) => (a.r.kind === "molecule" ? 0 : 1) - (b.r.kind === "molecule" ? 0 : 1) || a.r.name.localeCompare(b.r.name))
  .map(({ r, c, gaps }, i) => {
    const common = c.find((m) => commonIds.has(m.id)) ?? c[0];
    const cas = r.kind === "molecule" ? first(c, "cas") : "";
    const q = cas || common.name.replace(/\s*\(.*?\)/g, "").replace(/,.*$/, "");
    return {
      n: `t${String(i + 1).padStart(2, "0")}`, material_id: common.id, nombre: common.name, tipo: r.kind, cas, proveedor: r.supplier,
      faltan: gaps.map((g) => LABEL[g]).join(", "),
      buscar_tgsc: `https://www.google.com/search?q=${encodeURIComponent(`site:thegoodscentscompany.com ${q}`)}`,
      guardar_como: `paginas/t${String(i + 1).padStart(2, "0")}.html`,
    };
  });
const H = ["n", "material_id", "nombre", "tipo", "cas", "proveedor", "faltan", "buscar_tgsc", "guardar_como"];
writeTable("migracion-v3/web/tgsc/lista.csv", H, rows.map((r) => ({ ...r, id: r.n })));
writeFileSync(
  "migracion-v3/web/tgsc/lista.md",
  `# Páginas de TGSC que guardar a mano

TGSC (The Good Scents Company) devuelve 403 a las lecturas automáticas. Para los ${rows.length} materiales que tienes a los que les falta algo que TGSC suele dar (horas en tira, uso habitual, fuerza o familia):

1. Abre el enlace «buscar» (busca en TGSC por CAS o por nombre) y entra en la ficha de TGSC del material. **Comprueba que el CAS de la ficha es el de la tabla** (en una molécula); en un natural, que la especie y la forma (aceite, absoluto, tintura) son las mismas.
2. Guarda la página con Ctrl+S, «Página web, solo HTML», con el nombre de la columna «guardar como» (\`t01.html\`…), en \`migracion-v3/web/tgsc/paginas/\`.
3. Si TGSC no tiene ficha de ese material, no guardes nada: lo apunto como «TGSC no lo tiene».

Las moléculas van primero: es donde TGSC tiene ficha casi siempre. Las tinturas, esencias y bases de Maese casi nunca están; si una tintura solo tiene la ficha del aceite, guárdala igual: el script no toma sus horas ni su uso para la tintura.

| n | Material | Tipo | CAS | Tienda | Falta | Buscar | Guardar como |
|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.n} | ${r.nombre} | ${r.tipo} | ${r.cas || "—"} | ${r.proveedor} | ${r.faltan} | [buscar](${r.buscar_tgsc}) | \`${r.guardar_como}\` |`).join("\n")}
`,
  "utf8",
);
console.log(`${rows.length} materiales; ${rows.filter((r) => r.tipo === "molecule").length} moléculas`);
