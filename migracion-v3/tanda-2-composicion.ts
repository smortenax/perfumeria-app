/**
 * Batch 2 of the migration (plan v3, phase 4, steps 4.3 and 4.4): what each common material
 * and product contains. Writes migracion-v3/tandas/2-composicion/ (material_components.csv and
 * informe.md), for the user to review (V3-21).
 *
 * Which rows of the v2 count is decided as the v2 did (src/v2/to-ifra.ts, `flatten`): the
 * sources of a container, most authoritative first; within a rank, the most specific container;
 * the first source to give a component decides it; a source that covers every regulated
 * substance closes the list for the less authoritative. A product's list is its certificate's
 * and then its material's (V3-2). On top: each material its own entry of IFRA's annex (V3-23);
 * the borrowed ones, as literature (V3-28); the 5-MOP of STD 089's members (V3-27); and
 * «Sin identificar» where no source covers the list whole, and in the natural isolates without
 * documents (§3.5, V3-29).
 *
 *   node migracion-v3/tanda-2-composicion.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CompositionRow } from "../src/v2/model.ts";
import { pctToFraction } from "./lib/cifras.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { readSources } from "./lib/fuentes.ts";
import { uuidFor, v2Id } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/2-composicion";
const src = readSources();
const { v2 } = src;

const RANK: Readonly<Record<string, number>> = { lote: 0, producto: 1, "anexo-ifra": 2, literatura: 3, consenso: 4 };
const AUTHORITY: Readonly<Record<string, string>> = {
  lote: "lot", producto: "product", "anexo-ifra": "ifra", literatura: "literature", consenso: "consensus",
};
const SIN_IDENTIFICAR = uuidFor("v3:sin-identificar");
const FIVE_MOP = uuidFor("ifra:5-MOP");
// The CAS may be several, separated by spaces («68916-44-9 8000-46-2»).
const BORROWED = /el máximo de las (\d+) entradas del anexo para (.+?) \(D14\)/;

const notes: string[] = [];
const fold = (s: string) => s.trim().toLowerCase();

// ------------------------------------------------------------ indexes of the v2
const materials = new Map(v2.materials.map((m) => [m.id, m]));
const products = new Map(v2.products.map((p) => [p.id, p]));
const documents = new Map(v2.documents.map((d) => [d.id, d]));
const materialOfSubstance = new Map(v2.materials.filter((m) => m.substanceId).map((m) => [m.substanceId, v2Id(m.id)]));
const componentId = (substanceId: string) => materialOfSubstance.get(substanceId) ?? v2Id(substanceId);
const coverage = new Map(v2.coverages.map((c) => [`${c.containerId}|${c.documentId}`, c.coverage]));
/** The note of a row of the v2 (which entry of the annex it comes from): the loader leaves it out. */
const noteOf = (row: CompositionRow): string => src.compositionNotes.get(row.line) ?? "";
const compositionBy = new Map<string, CompositionRow[]>();
for (const row of v2.composition) compositionBy.set(row.containerId, [...(compositionBy.get(row.containerId) ?? []), row]);
const substanceOfCas = new Map<string, Set<string>>();
for (const a of v2.casAliases) substanceOfCas.set(a.cas, (substanceOfCas.get(a.cas) ?? new Set()).add(a.substanceId));

// V3-27: the members of STD 089 (a material, or a product of it).
const group089 = v2.groups.find((g) => g.type === "estandar-ifra" && g.reference === "IFRA_STD_089")?.id;
const members089 = new Set(v2.groupMembers.filter((gm) => gm.groupId === group089).map((gm) => gm.memberId));

// V3-23: the own entry of IFRA's annex of a natural, by its name.
const annexByName = new Map<string, typeof src.ifraNaturals[number][]>();
for (const n of src.ifraNaturals) annexByName.set(fold(n.nombre), [...(annexByName.get(fold(n.nombre)) ?? []), n]);

// ------------------------------------------------------------ which rows of the v2 count, as the v2 did
interface Selected {
  readonly rows: CompositionRow[];
  readonly complete: boolean;
  readonly open: string[];
  readonly onlyPlaceholders: boolean;
}

function select(containerId: string): Selected {
  const product = products.get(containerId);
  const materialId = product ? product.materialId : containerId;
  const chain = product ? [product.id, materialId] : [materialId];
  const sources = new Map<string, CompositionRow[]>();
  for (const c of chain) {
    for (const row of compositionBy.get(c) ?? []) {
      const key = `${row.containerId}|${row.documentId}`;
      sources.set(key, [...(sources.get(key) ?? []), row]);
    }
  }
  const ordered = [...sources.entries()].sort(([ka, [a]], [kb, [b]]) => {
    const byRank = (RANK[a.authority] ?? 9) - (RANK[b.authority] ?? 9);
    return byRank || chain.indexOf(a.containerId) - chain.indexOf(b.containerId) || ka.localeCompare(kb);
  });
  const decided = new Set<string>();
  const rows: CompositionRow[] = [];
  const open: string[] = [];
  let complete = false;
  let closedRank: number | null = null;
  for (const [key, sourceRows] of ordered) {
    const rank = RANK[sourceRows[0].authority] ?? 9;
    if (closedRank !== null && rank !== closedRank) break;
    for (const row of sourceRows) {
      if (decided.has(row.componentId)) continue;
      decided.add(row.componentId);
      rows.push(row);
    }
    const covers = coverage.get(key) ?? "desconocida";
    if (covers === "reguladas-completa") {
      complete = true;
      closedRank = rank;
    } else {
      open.push(`${key.split("|")[1]} (${covers})`);
    }
  }
  // A certificate of the product that declares no regulated substance closes the list all the same.
  const declaredNone = chain.some((c) =>
    v2.coverages.some((cv) => cv.containerId === c && c !== materialId && cv.coverage === "reguladas-completa" && !sources.has(`${c}|${cv.documentId}`)),
  );
  const onlyPlaceholders = !declaredNone && ordered.every(([, r]) => r[0].authority === "literatura" || r[0].authority === "consenso");
  return { rows, complete: complete || declaredNone, open, onlyPlaceholders };
}

// ------------------------------------------------------------ the rows of the v3
const COLUMNS = ["id", "material_id", "component_id", "amount_kind", "value", "min", "max", "authority", "source"] as const;
const out: Array<Record<string, Cell>> = [];
const changed = { ownEntry: [] as string[], borrowed: new Set<string>(), unidentified: [] as string[], isolates: [] as string[], fiveMop: [] as string[], zeros: 0, maxZeros: 0 };
const docLabel = (id: string) => `${id} · ${documents.get(id)?.title ?? ""}`;

function amountOf(row: CompositionRow): Record<string, Cell> {
  if (row.valueType === "tipico") return { amount_kind: "exact", value: pctToFraction(row.typical) };
  if (row.valueType === "maximo") {
    // A maximum of 0 is an exact 0: the v3 keeps «max» above 0.
    if (Number(row.max) === 0) {
      changed.maxZeros++;
      return { amount_kind: "exact", value: "0" };
    }
    return { amount_kind: "max", value: pctToFraction(row.max) };
  }
  throw new Error(`Tipo de valor sin traducir: ${row.valueType} (${row.containerId})`);
}

const containers = [...v2.materials.map((m) => m.id), ...v2.products.map((p) => p.id)];
for (const containerId of containers) {
  const target = v2Id(containerId);
  const materialId = products.get(containerId)?.materialId ?? containerId;
  const material = materials.get(materialId)!;
  const selected = select(containerId);
  const ownEntry = annexByName.get(fold(material.name));
  const replaceBorrowed = ownEntry !== undefined && selected.rows.some((r) => r.containerId === materialId && BORROWED.test(noteOf(r)));

  for (const row of selected.rows) {
    const borrowed = BORROWED.exec(noteOf(row));
    if (borrowed && replaceBorrowed && row.containerId === materialId) continue; // V3-23: its own entry instead
    if (row.valueType === "tipico" && Number(row.typical) === 0) changed.zeros++;
    out.push({
      id: uuidFor(`v2-comp:${containerId}|${row.containerId}|${row.componentId}|${row.documentId}`),
      material_id: target,
      component_id: componentId(row.componentId),
      ...amountOf(row),
      // V3-28: what is borrowed from other forms with its CAS is literature, never IFRA's word on this one.
      authority: borrowed ? "literature" : AUTHORITY[row.authority],
      source: borrowed
        ? `IFRA 51, anexo: entradas prestadas por CAS (${borrowed[2]}, el máximo de ${borrowed[1]}; ${noteOf(row).split(": ").slice(1).join(": ")}) · ${docLabel(row.documentId)}`
        : `${docLabel(row.documentId)}${noteOf(row) ? ` — ${noteOf(row)}` : ""}`,
    });
    if (borrowed) changed.borrowed.add(containerId);
  }

  if (replaceBorrowed && ownEntry) {
    changed.ownEntry.push(`${containerId} ${material.name}`);
    for (const n of ownEntry) {
      const substances = [...(substanceOfCas.get(n.cas_constituyente) ?? [])];
      if (substances.length !== 1) {
        notes.push(`${containerId}: el constituyente ${n.constituyente} (${n.cas_constituyente}) de su entrada del anexo no casa con una sola sustancia de la v2; no entra.`);
        continue;
      }
      const zero = Number(n.concentracion_pct) === 0;
      out.push({
        id: uuidFor(`ifra-anexo:${containerId}|${n.cas_constituyente}|${n.nombre}`),
        material_id: target,
        component_id: componentId(substances[0]),
        amount_kind: "exact",
        value: pctToFraction(n.concentracion_pct),
        authority: "ifra",
        source: `IFRA 51, anexo: ${n.nombre} (${n.nombre_botanico}) — su entrada propia (V3-23)${zero ? "; da 0" : ""}`,
      });
    }
  }

  // V3-27: STD 089 limits the 5-MOP in the product; its members carry it, amount unknown until a document gives it.
  if (members089.has(materialId) || members089.has(containerId)) {
    changed.fiveMop.push(`${containerId} ${products.get(containerId)?.name ?? material.name}`);
    out.push({
      id: uuidFor(`v3-5mop:${containerId}`), material_id: target, component_id: FIVE_MOP, amount_kind: "unknown",
      authority: "ifra", source: "IFRA 51, STD 089: el límite es del 5-MOP en el producto terminado; la cantidad no se declara (V3-27)",
    });
  }

  // §3.5 and V3-29: what no source covers whole, and the natural isolates without documents, may carry more.
  const isolate = material.type === "sustancia" && material.origin === "aislado-natural" && selected.onlyPlaceholders && !products.has(containerId);
  if (selected.rows.length > 0 && !selected.complete) {
    changed.unidentified.push(`${containerId} ${products.get(containerId)?.name ?? material.name}: ${selected.open.join(", ")}`);
    out.push({
      id: uuidFor(`v3-sinid:${containerId}`), material_id: target, component_id: SIN_IDENTIFICAR, amount_kind: "unknown",
      authority: "consensus", source: `Lista que ninguna fuente cubre entera: ${selected.open.join(", ")} (§3.5)`,
    });
  } else if (isolate) {
    changed.isolates.push(`${containerId} ${material.name}`);
    out.push({
      id: uuidFor(`v3-sinid:${containerId}`), material_id: target, component_id: SIN_IDENTIFICAR, amount_kind: "unknown",
      authority: "consensus", source: "Aislado natural sin documentos de su producto (D7 de la v2; V3-29)",
    });
  }
}

writeTable(join(OUT, "material_components.csv"), COLUMNS, out);

// ------------------------------------------------------------ the report
const byAuthority = Object.entries(out.reduce<Record<string, number>>((acc, r) => ({ ...acc, [String(r.authority)]: (acc[String(r.authority)] ?? 0) + 1 }), {}))
  .map(([a, n]) => `${a} ${n}`).join(", ");
const list = (items: readonly string[]) => (items.length ? items.map((i) => `  - ${i}`).join("\n") : "  - Ninguno.");
const report = `# Tanda 2 · La composición

*Generada por \`migracion-v3/tanda-2-composicion.ts\`. Datos de la v2 y del anexo de IFRA del commit \`${src.commit}\`. \`validar:v2\`: sin errores. Todas las cifras de la v2 salen de documentos revisados (D6).*

**Qué entra** (\`material_components.csv\`, ${out.length} filas, de ${v2.composition.length} cifras de la v2): por autoridad, ${byAuthority}.

**Cómo se eligen las filas, como la v2:** por cada material o producto, sus fuentes de más a menos autoridad; la primera que da un componente lo decide, y una fuente que cubre todas las sustancias reguladas cierra el paso a las de menos autoridad. Un producto lleva primero lo de su certificado y luego lo de su material (V3-2).

**Lo que cambia respecto a la v2, por decisión:**

- **Su propia entrada del anexo (V3-23)**, en lugar del máximo de las de su CAS (${changed.ownEntry.length}):
${list(changed.ownEntry)}
- **Las prestadas, como literatura (V3-28):** ${changed.borrowed.size} materiales y productos llevan cifras del anexo tomadas de otras formas con su CAS; su fuente dice de cuáles. Dan como mucho «acotado».
- **El 5-MOP del 089 (V3-27)**, de cantidad desconocida:
${list(changed.fiveMop)}
- **«Sin identificar» donde ninguna fuente cubre la lista entera** (§3.5):
${list(changed.unidentified)}
- **«Sin identificar» en los aislados naturales sin documentos (V3-29):**
${list(changed.isolates)}
- **Los ceros del anexo se quedan** (${changed.zeros} filas): una cifra exacta puede valer 0 («no lo lleva»; propuesta de la sesión, commit d700e55). Un máximo de 0 se escribe como exacto de 0 (${changed.maxZeros} filas, prestadas: siguen como literatura).

**Cómo se traduce:** \`tipico\` → \`exact\`, \`maximo\` → \`max\` (la v2 no tiene rangos); el porcentaje, a fracción exacta; \`anexo-ifra\` → \`ifra\`, \`producto\` → \`product\`, \`literatura\` → \`literature\`. La fuente de cada fila: su documento con su título y la nota de la v2 (la entrada del anexo).

**Para revisar** (${notes.length}):

${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "- Nada."}
`;
writeFileSync(join(OUT, "informe.md"), report, "utf8");
console.log(`Tanda 2: ${out.length} filas; ${notes.length} notas para revisar. ${OUT}/informe.md`);
