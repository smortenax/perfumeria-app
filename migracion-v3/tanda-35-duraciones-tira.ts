/**
 * Batch 35 (2026-10-29): into YOUR ACCOUNT, never into the common data. How long each of your
 * materials lasts on a smelling strip, for the ones whose version (yours and the common one) had no
 * hours. The user, 2026-10-29: «Puedes mirar info de los que faltan duración y luego ya se pasará en
 * un file para la app» and «vale puedes buscarlo aunque sea en la web las que faltan menos trufa y
 * miel»; and, to the question whether to load the three doubtful figures, «Sin las 3 dudosas».
 *
 * What it reads: migracion-v3/web/duraciones-tira/propuesta.csv, one row per material of yours with
 * no hours (2026-10-29), as the session and two subagents found them: TGSC's «Substantivity», or
 * the «Lasts > N hours on a smelling strip» of Fraterworks, or another page, each with its URL and
 * its sentence. A day is 24 h. Its material_id is that of your version, read from your account in
 * the cloud on 2026-10-29.
 *
 * What it writes: tenacity_hours and tenacity_source of your version of each material. Only those
 * (plus name and kind, which the table needs and which stay as they are): nothing else of yours
 * changes. A row with no hours, or one of the three left out, is not written.
 * Your Veramoss is Evernyl, by Givaudan (the user: «el mio es evernyl»): its figure is that of
 * TGSC's sheet that names evernyl (Givaudan), and its source says so.
 * Approved with `aprobar.ts --cuenta`, loaded with
 * `cargar-laboratorio.ts <your email> --nube --tanda=35-duraciones-tira`.
 *
 *   node migracion-v3/tanda-35-duraciones-tira.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";

const OUT = "migracion-v3/tandas/35-duraciones-tira";
const IN = "migracion-v3/web/duraciones-tira/propuesta.csv";
// The user, 2026-10-29, in the card: «Sin las 3 dudosas».
const LEFT_OUT = new Set(["Thyme absolute", "Black Agar 296985", "Luminide"]);
type Rec = Record<string, Cell>;

const rows = parseCsvRecords(readFileSync(IN, "utf8"));
const out: Rec[] = [];
const notWritten: string[] = [];
for (const r of rows) {
  if (!r.hours || LEFT_OUT.has(r.name)) {
    notWritten.push(`${r.name}: ${LEFT_OUT.has(r.name) ? "dudosa, fuera por decisión del usuario" : "ninguna fuente da horas"}`);
    continue;
  }
  const hours = Number(r.hours);
  if (!Number.isFinite(hours) || hours <= 0) throw new Error(`${r.name}: horas «${r.hours}» no válidas`);
  const bound = r.qualifier === "más de" ? "más de " : r.qualifier === "menos de" ? "menos de " : "";
  const dilution = r.at_percent && r.at_percent !== "100.00" ? `, al ${r.at_percent.replace(/\.00$/, "")} %${r.solvent ? ` en ${r.solvent}` : ""}` : "";
  const evernyl = r.name === "Veramoss" ? " Tu producto es Evernyl, de Givaudan: esta ficha de TGSC nombra «evernyl (Givaudan)»." : "";
  const note = r.note ? ` Nota: ${r.note}` : "";
  out.push({
    id: r.material_id,
    owner_id: null,
    name: r.name,
    kind: r.kind,
    tenacity_hours: hours,
    tenacity_source: `web: ${r.source}, ${r.url}: «${r.quote}» (${bound}${hours} h en tira${dilution}; ${r.how}).${evernyl}${note}`,
  });
}
writeTable(join(OUT, "materials.csv"), ["id", "owner_id", "name", "kind", "tenacity_hours", "tenacity_source"], out);
writeFileSync(
  join(OUT, "informe.md"),
  [
    "# Tanda 35: duración en tira de tus materiales sin horas",
    "",
    `Para tu cuenta. ${out.length} materiales con horas en tira, cada una con su página y su frase; ${notWritten.length} no se escriben.`,
    "Solo cambian `tenacity_hours` y `tenacity_source` de tu versión. Entrada: `" + IN + "`.",
    "",
    "| Material | Horas | Fuente |",
    "|---|---|---|",
    ...out.map((m) => {
      const r = rows.find((x) => x.material_id === m.id)!;
      return `| ${m.name} | ${r.qualifier === "exacto" ? "" : `${r.qualifier} `}${m.tenacity_hours} | ${r.source} |`;
    }),
    "",
    "## No se escriben",
    "",
    ...notWritten.map((n) => `- ${n}`),
    "",
  ].join("\n"),
  "utf8",
);
console.log(`Tanda 35: ${out.length} materiales con horas; ${notWritten.length} sin escribir. ${OUT}/informe.md`);
