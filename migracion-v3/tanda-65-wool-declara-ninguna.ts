/**
 * Batch 65 (2026-11-23), common: Wool Absolute's certificate declares no IFRA-restricted material (V3-108).
 * The user, 2026-11-23: «Sí, añade la marca para Wool».
 *
 * From batch 64's reading of Biolandes' IFRA certificate of its Wool Absolute (F2915, published by
 * Fraterworks; migracion-v3/web/info-64/documentos-64.csv): «RESTRICTED MATERIAL(S) / MATIERE(S)
 * RESTREINTE(S) None / Aucune», with a detection limit of 0.001 %. A claim of the material (V3-39),
 * group «declares-none», as literature: a public document of the same product, not the bottle bought.
 * The app reads it as bounded, never within (src/db/to-ifra.ts). Rewrites regulations.csv whole.
 *
 *   node migracion-v3/tanda-65-wool-declara-ninguna.ts
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = process.env.BASE ?? execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/65-wool-declara-ninguna";
type Rec = Record<string, Cell>;
const show = (path: string) => execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const regs = show("v3/datos/regulations.csv");
const header = regs.slice(0, regs.indexOf("\n")).split(",");
const rows = parseCsvRecords(regs) as Rec[];
const wool = (parseCsvRecords(show("v3/datos/materials.csv")) as Rec[]).filter((m) => !m.owner_id && m.name === "Wool, absolute");
if (wool.length !== 1) throw new Error(`Wool, absolute: ${wool.length} comunes`);
const docs = parseCsvRecords(readFileSync("migracion-v3/web/info-64/documentos-64.csv", "utf8")) as Record<string, string>[];
const doc = docs.find((d) => d.n === "2" && d.documento === "ifra" && d.campo === "ninguna_restringida");
if (!doc) throw new Error("documentos-64.csv no tiene la declaración de Wool");
const id = uuidFor("regulation:v3:tanda65:wool:declares-none");
const row: Rec = {
  id,
  material_id: wool[0].id,
  regime: "manufacturer",
  category: null,
  kind: "requirement",
  max_value: null,
  group_key: "declares-none",
  requirement: "declares no IFRA-restricted material (detection limit 0.001 %)",
  authority: "literature",
  source: `Biolandes, IFRA certificate of WOOL ABSOLUTE (F2915), ${doc.url}, page ${doc.pagina}: «${doc.frase}»; «Detection limit < 0.001%»; a public document of the same product, not the bottle bought; read by script (documentos.py, batch 64); batch 65 (V3-108)`,
};
mkdirSync(OUT, { recursive: true });
writeTable(join(OUT, "regulations.csv"), header, [...rows.filter((r) => r.id !== id), row]);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 65 · Wool Absolute: el certificado no declara sustancias restringidas (V3-108)

*Generada por \`migracion-v3/tanda-65-wool-declara-ninguna.ts\` sobre lo común de \`${BASE}\`. Reescribe \`regulations.csv\` entero (añade una fila). Sin aprobar.*

**Por qué:** el usuario, 2026-11-23: «Sí, añade la marca para Wool».

**Qué:** una afirmación del material (V3-39) en \`regulations.csv\`: grupo \`declares-none\`, «${row.requirement}», autoridad \`literature\` (el certificado público de Biolandes, F2915, que enlaza Fraterworks; no es el de tu frasco). La frase: «${doc.frase}».

**Cómo lo lee la app** (\`v3/src/db/to-ifra.ts\`): un natural o una base sin constituyentes y con esta marca ya no es «sin datos». Desde la literatura cuenta una carga desconocida bajo un techo del 100 %: la fórmula sale **acotada, nunca dentro**, y la ficha dice «supuesto, no probado». Si la marca viene del certificado de tu frasco (autoridad \`lot\` o \`product\`), queda acreditada.
`,
  "utf8",
);
console.log(`Tanda 65: 1 fila en regulations.csv (${wool[0].id}).`);
