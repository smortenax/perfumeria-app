/**
 * Batch 67 (2026-11-25), common: meta-cresol (108-39-4) brings at most 2 % p-cresol (IFRA STD 260).
 * The user, 2026-11-25: «vale ahora creo que si esta cerrado y apruebo el limite».
 *
 * IFRA has no standard for m-cresol; STD 260 restricts p-cresol (106-44-5) and mixed cresols (1319-77-3),
 * for depigmentation, which RIFM, the CIR and the Australian tier II report say m-cresol does not cause.
 * Perfumiarz sells it as «PRODUCENT: Sigma Aldrich», and the SDS it links is Aldrich W353000, whose
 * product page gives «≥98%» and no impurities. The worst case of that purity, every impurity being
 * p-cresol, is a ceiling of 2 % p-cresol: a constituent of kind «max», as literature (a bound worked out
 * from the purity, not an analysis), so the check counts it against STD 260 and says bounded, never
 * within (V3-7). Research note: /mnt/project-files/investigaciones/2026-11-25-meta-cresol-ifra.md.
 * Rewrites material_components.csv whole (adds one row).
 *
 *   node migracion-v3/tanda-67-meta-cresol.ts
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { asCells, type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = process.env.BASE ?? "5d9848a";
const OUT = "migracion-v3/tandas/67-meta-cresol";
type Rec = Record<string, Cell>;
const show = (path: string) => execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const table = show("v3/datos/material_components.csv");
const header = table.slice(0, table.indexOf("\n")).split(",");
const rows = asCells(parseCsvRecords(table) as Rec[]);
const meta = (parseCsvRecords(show("v3/datos/materials.csv")) as Rec[]).filter((m) => !m.owner_id && m.cas === "108-39-4");
if (meta.length !== 1) throw new Error(`108-39-4: ${meta.length} comunes`);
const standard = (parseCsvRecords(show("v3/datos/ifra_substances.csv")) as Rec[]).filter((s) => s.cas === "106-44-5");
if (standard.length === 0) throw new Error("106-44-5 no está en ifra_substances.csv");

const PAGE = "https://www.sigmaaldrich.com/US/en/product/aldrich/w353000";
const id = uuidFor("material_component:v3:tanda67:meta-cresol:p-cresol");
const row: Rec = {
  id,
  material_id: meta[0].id,
  component_id: null,
  component_cas: "106-44-5",
  component_name: "p-Cresol",
  amount_kind: "max",
  value: "0.02",
  min: null,
  max: null,
  authority: "literature",
  source:
    `Sigma-Aldrich, m-Cresol W353000, ${PAGE}: «≥98%, FG» (assay «≥98%»; no impurities listed); ` +
    "Perfumiarz, https://perfumiarz.pl/products/meta-cresol-10: «PRODUCENT: Sigma Aldrich», and its SDS is Aldrich W353000 (Merck, version 7.10, 06.01.2025, page 3: «meta-Cresol … <= 100 %»); " +
    "the worst case of that purity, every impurity being p-cresol, not an analysis of the bottle bought; batch 67",
};
mkdirSync(OUT, { recursive: true });
writeTable(join(OUT, "material_components.csv"), header, [...rows.filter((r) => r.id !== id), row]);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 67 · Meta-cresol: como mucho un 2 % de p-cresol (IFRA 260)

*Generada por \`migracion-v3/tanda-67-meta-cresol.ts\` sobre lo común de \`${BASE}\`. Reescribe \`material_components.csv\` entero (añade una fila). Sin aprobar.*

**Por qué:** la bandeja del laboratorio (2026-11-25): la app no daba límite IFRA al Meta Cresol 10 % (DPG) de Perfumiarz. El usuario, 2026-11-25: «vale ahora creo que si esta cerrado y apruebo el limite». La investigación, con sus citas: \`/mnt/project-files/investigaciones/2026-11-25-meta-cresol-ifra.md\` (carpeta del proyecto).

**Qué:** un constituyente del meta-cresol común (\`${meta[0].id}\`): p-cresol (106-44-5), \`max\` 2 %, autoridad \`literature\`.

- **IFRA no regula el m-cresol.** El estándar 260 es del p-cresol (106-44-5) y de los cresoles mezclados (1319-77-3), por despigmentación; el 108-39-4 no aparece en su PDF.
- **Lo que sí cuenta es el p-cresol que lleve.** Perfumiarz lo vende como «PRODUCENT: Sigma Aldrich», y su SDS es la de Aldrich W353000. Sigma da «≥98%» y no lista impurezas: en el peor caso, todo lo demás sería p-cresol, un 2 %.
- **Es una cota, no un análisis:** por eso va como \`literature\`, y la comprobación sale **acotada, nunca dentro** (V3-7).

**Cómo lo lee la app:** el meta-cresol deja de ser «sin estándar» y cuenta su 2 % de p-cresol contra el 260 (0,005 % en la categoría 4). El 260 manda sobre el m-cresol a partir de un 0,25 % en el producto terminado; con el uso de TGSC (0,01 % del concentrado, ya en \`material_doses.csv\`) queda muy por debajo.

**Lo que no hace esta tanda:** el límite orientativo del m-cresol (0,027 % en la categoría 4, por analogía con la tabla de RIFM del o-cresol). La app solo admite límites de IFRA o del fabricante; cómo guardarlo está pendiente de decidir.
`,
  "utf8",
);
console.log(`Tanda 67: 1 fila en material_components.csv (${meta[0].id}).`);
