/**
 * Batch 51 (V3-100): what published documents say a natural contains, for the naturals that IFRA's annex
 * does not cover. The user, 2026-11-07: «Lo más importante es lo que falta de restricciones de ifra» and
 * «Todo lo que son tinturas y c02 o extracciones naturales se agrupan y se buscan en algún referente online
 * donde estén publicados».
 *
 * Reads migracion-v3/web/maese-ifra/lista.csv (the 184 naturals that the app cannot check against IFRA 51,
 * after batches 46 to 50) and ifra-*.csv (what was read on the web: an allergen declaration, an SDS, a
 * certificate of analysis or a published analysis, with its literal line). Writes material_components.csv
 * whole, with these rows added. The figures are the material's composition, not IFRA data (V3-35): the
 * app reads them against IFRA. A supplier's document is not the bottle bought, so the authority is
 * «literature» and the app never says «within» from it, only «bounded».
 *
 * Not used: a document of another form (the oil for a tincture, orris butter for an absolute), a solvent,
 * a document whose species must be checked, and a figure that cannot be read.
 *
 *   node migracion-v3/tanda-51-composicion-naturales.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const BASE = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const OUT = "migracion-v3/tandas/51-composicion-naturales";
const WEB = "migracion-v3/web/maese-ifra";
type Rec = Record<string, Cell>;

const text = execSync(`git show ${BASE}:v3/datos/material_components.csv`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const header = text.slice(0, text.indexOf("\n")).split(",");
const before = parseCsvRecords(text) as Rec[];
const list = parseCsvRecords(readFileSync(join(WEB, "lista.csv"), "utf8")) as Record<string, string>[];
const byK = new Map(list.map((r) => [r.k, r]));
const reads = [0, 1, 2, 3, 4].flatMap((i) => parseCsvRecords(readFileSync(join(WEB, `ifra-0${i}.csv`), "utf8")) as Record<string, string>[]);

/** Why a read is not this material's composition (session reading of the reader's note). */
const NOT_THIS: [RegExp, string][] = [
  [/otra forma|material puro/i, "es de otra forma del material"],
  [/disolvente|solvent/i, "es el disolvente, no el material"],
  [/verificar la especie|Bulnesia sarmientoi, nombre/i, "el documento es de otra especie (Bulnesia sarmientoi para un Guaiacum officinale)"],
];
const SOLVENT = /^(ethanol|ethyl alcohol|alcohol)\b/i;

const num = (s: string) => {
  const v = Number(s.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(v) && /\d/.test(s) ? v : null;
};
/** The figure as the document prints it, in % (or mg/kg), into a fraction of 1. */
function amount(valor: string, tipo: string, nota: string): Pick<Rec, "amount_kind" | "value" | "min" | "max"> | null {
  const raw = valor.trim();
  const scale = /mg\s*\/\s*kg/i.test(`${raw} ${nota}`) ? 1e-6 : 0.01;
  const range = raw.match(/^([<≤]?\s*[\d.,]+)\s*%?\s*[-–]\s*([\d.,]+)\s*%?/);
  if (tipo === "rango" || (range && !/^[<≤]/.test(raw))) {
    if (!range) return null;
    const [lo, hi] = [num(range[1]), num(range[2])];
    if (lo === null || hi === null || lo > hi) return null;
    return { amount_kind: "range", value: null, min: round(lo * scale), max: round(hi * scale) };
  }
  const v = num(raw.split(/\s+/)[0] === "<" || raw.split(/\s+/)[0] === "≤" ? raw : raw.split(" ")[0]);
  if (v === null) return null;
  if (tipo === "maximo" || /^[<≤]|max|up to|hasta/i.test(raw)) return { amount_kind: "max", value: null, min: null, max: round(v * scale) };
  return { amount_kind: "exact", value: round(v * scale), min: null, max: null };
}
const round = (v: number) => Number(v.toPrecision(6));

const added: Rec[] = [];
const left = new Map<string, string>();
const report = new Map<string, { n: number; fuente: string; nota: string }>();
for (const r of reads) {
  const m = byK.get(r.k);
  if (!m) throw new Error(`k=${r.k} no está en la lista`);
  if (!r.constituyente.trim()) continue;
  const why = NOT_THIS.find(([re]) => re.test(`${r.nota} ${r.fuente}`))?.[1] ?? (SOLVENT.test(r.constituyente) ? "es el disolvente, no el material" : null);
  if (why) {
    left.set(m.material, why);
    continue;
  }
  const a = amount(r.valor, r.tipo, r.nota);
  if (!a) continue;
  const cas = (r.cas_constituyente.match(/\d{2,7}-\d\d-\d/) ?? [""])[0];
  added.push({
    id: uuidFor(`component:v3:tanda51:${m.id}:${cas || r.constituyente.toLowerCase()}:${r.fuente.slice(0, 80)}`),
    material_id: m.id, component_id: null, component_cas: cas || null, component_name: r.constituyente.trim(), ...a,
    authority: "literature",
    source: `${r.fuente}${r.nota ? ` (${r.nota})` : ""}; from a supplier's document or a published analysis, not the bottle bought; batch 51`,
  });
  const got = report.get(m.material) ?? { n: 0, fuente: r.fuente.split(",").slice(0, 2).join(","), nota: r.nota };
  got.n++;
  report.set(m.material, got);
  left.delete(m.material);
}
const seenIds = new Set<string>();
const unique = added.filter((r) => !seenIds.has(String(r.id)) && seenIds.add(String(r.id)));
writeTable(join(OUT, "material_components.csv"), header, [...before, ...unique]);

const none = list.filter((m) => !report.has(m.material));
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 51 · Lo que llevan los naturales que el anexo de IFRA no cubre

*Generada por \`migracion-v3/tanda-51-composicion-naturales.ts\` sobre \`${BASE}\`, desde \`${WEB}/\`. Escribe \`v3/datos/material_components.csv\` entero, con estas filas añadidas; las de antes no cambian. Va con las tandas 46 a 50 (sus materiales). Sin aprobar.*

**Por qué** (V3-100): el usuario, 2026-11-07: «Lo más importante es lo que falta de restricciones de ifra» y «Todo lo que son tinturas y c02 o extracciones naturales se agrupan y se buscan en algún referente online donde estén publicados».

**Cómo:** de los 562 comunes tras las tandas 46 a 50, ${list.length} naturales no se podían comprobar contra IFRA 51: ni están en su anexo por CAS ni tienen composición (\`/mnt/project-files/maese/ifra-por-material.csv\`). Se agruparon por especie y se buscó cada uno en la web: declaración de alérgenos, certificado IFRA, ficha de seguridad o análisis publicado de la misma especie, parte y forma (\`${WEB}/ifra-*.csv\`, con la línea literal). Las cifras son lo que el material lleva, no límites de IFRA (V3-35). Son de un documento del proveedor o de la literatura, no del frasco comprado: autoridad «literature», así que la app dirá «acotado», nunca «dentro».

**Resultado:** ${report.size} materiales con composición (${unique.length} constituyentes); ${none.length} siguen sin poderse comprobar.

**Para mirar antes de aprobar:**

- **Rangos de ficha de seguridad:** una SDS da rangos amplios (por ejemplo, 1–10 %). Para IFRA se usa el máximo (regla de la v2), así que un rango amplio acota de más.
- **Dudas que quedan en la nota de cada fila:** el SDS de la cassis y el de la caléndula no nombran la especie; el de *Picea mariana* es de «leaf oil» y el material dice «aerial parts» (las agujas: lectura de la sesión); el del acetato de guayilo suma 120–150 % en sus rangos.
- **No entra:** lo que es de otra forma (el aceite para una tintura, la manteca de iris para un absoluto), el disolvente y el guayaco de *Bulnesia* para un *Guaiacum officinale*.

## Con composición

| Material | Constituyentes | Documento | Nota |
|---|---|---|---|
${[...report].map(([n, g]) => `| ${cell(n)} | ${g.n} | ${cell(g.fuente)} | ${cell(g.nota)} |`).join("\n")}

## Con un documento que no sirve

| Material | Por qué |
|---|---|
${[...left].map(([n, w]) => `| ${cell(n)} | ${w} |`).join("\n")}

## Siguen sin poderse comprobar (${none.length})

${none.map((m) => cell(m.material)).join(" · ")}
`,
  "utf8",
);
console.log(`Tanda 51: ${report.size} materiales, ${unique.length} constituyentes; ${none.length} sin composición.`);
