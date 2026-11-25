/**
 * Batch 68 (2026-11-25), common: the guidance limit of meta-cresol, 0.027 % in category 4 (V3-112).
 * The user, 2026-11-25: «apruebo el limite», and on the card «Tipo nuevo: límite orientativo».
 *
 * IFRA does not regulate m-cresol (108-39-4). RIFM's assessment of o-cresol (Food Chem Toxicol 149 (2021)
 * 112112, table 1, page 5) gives 0.027 % for category 4 from the reactive DST, for want of sensitization
 * data; m-cresol has none either (OECD SIDS 2003: «No sensitization test was available for m-cresol»).
 * RIFM's own assessment of m-cresol (112043) could not be read. A guidance limit by analogy, as literature:
 * summed apart from IFRA and never «within» (src/db/to-ifra.ts). Rewrites regulations.csv whole.
 *
 *   node migracion-v3/tanda-68-meta-cresol-orientativo.ts
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = process.env.BASE ?? "e595f53";
const OUT = "migracion-v3/tandas/68-meta-cresol-orientativo";
type Rec = Record<string, Cell>;
const show = (path: string) => execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const regs = show("v3/datos/regulations.csv");
const header = regs.slice(0, regs.indexOf("\n")).split(",");
const rows = parseCsvRecords(regs) as Rec[];
const meta = (parseCsvRecords(show("v3/datos/materials.csv")) as Rec[]).filter((m) => !m.owner_id && m.cas === "108-39-4");
if (meta.length !== 1) throw new Error(`108-39-4: ${meta.length} comunes`);
const id = uuidFor("regulation:v3:tanda68:meta-cresol:guidance");
const row: Rec = {
  id,
  material_id: meta[0].id,
  regime: "guidance",
  category: "4",
  kind: "max",
  max_value: "0.00027",
  group_key: null,
  requirement: null,
  authority: "literature",
  source:
    "By analogy with o-cresol: RIFM, «RIFM fragrance ingredient safety assessment, o-cresol, CAS Registry Number 95-48-7», Food Chem Toxicol 149 (2021) 112112, " +
    "https://fragrancematerialsafetyresource.elsevier.com/sites/default/files/95-48-7.pdf, page 5, table 1: «Maximum acceptable concentrations for o-cresol that present no appreciable risk for skin sensitization based on reactive DST», category 4: 0.027 %; " +
    "m-cresol has no sensitization test either (OECD SIDS, SIAM 16, 2003: «No sensitization test was available for m-cresol»); RIFM's own assessment of m-cresol (112043) was not read; " +
    "not IFRA's: IFRA does not regulate 108-39-4 (STD 260 is p-cresol's); approved by the user, 2026-11-25 (V3-112); batch 68",
};
mkdirSync(OUT, { recursive: true });
writeTable(join(OUT, "regulations.csv"), header, [...rows.filter((r) => r.id !== id), row]);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 68 · Meta-cresol: límite orientativo del 0,027 % en la categoría 4 (V3-112)

*Generada por \`migracion-v3/tanda-68-meta-cresol-orientativo.ts\` sobre lo común de \`${BASE}\`. Reescribe \`regulations.csv\` entero (añade una fila). Sin aprobar.*

**Por qué:** el usuario, 2026-11-25: «apruebo el limite» (el 0,027 % que propuso la sesión), y en la tarjeta: «Tipo nuevo: límite orientativo».

**Qué:** una fila en \`regulations.csv\` del meta-cresol común (\`${meta[0].id}\`): régimen \`guidance\`, categoría 4, \`max\` 0,027 %, autoridad \`literature\`.

- **De dónde sale:** la tabla 1 (p. 5) de la evaluación de RIFM del o-cresol (2021): 0,027 % en la categoría 4, por el umbral por defecto de las moléculas reactivas sin datos de sensibilización. El m-cresol tampoco tiene ensayos (OCDE, 2003). La evaluación de RIFM del propio m-cresol no se pudo leer.
- **No es de IFRA:** IFRA no regula el 108-39-4. Lo que IFRA cuenta es su p-cresol (tanda 67, como mucho un 2 %, contra el estándar 260).

**Cómo lo lee la app** (\`v3/src/db/to-ifra.ts\`): se suma aparte, como un tope de fabricante, en «Caps apart from IFRA», sin decidir las lecturas de IFRA, y nunca da «dentro». La ficha lo enseña como «Guidance (not IFRA)».
`,
  "utf8",
);
console.log(`Tanda 68: 1 fila en regulations.csv (${meta[0].id}).`);
