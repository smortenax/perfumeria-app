/**
 * Batch 6 of the migration (plan v3, phase 4, step 4.4; V3-35): IFRA's layer, apart from the
 * materials, only from IFRA's own files (datos/ifra/51/, P37): the standards with their notes,
 * their limits by category, the CAS each one regulates and what the annex says each natural
 * brings. With the rules decided on top of IFRA's text: V3-27 (a limit expressed as a
 * constituent), V3-30 (prohibited as such) and V3-31 (a prohibited variant). No material of the
 * v2 goes in: a material says its CAS, and the app reads it against this layer.
 * Writes migracion-v3/tandas/6-capa-ifra/ for the user to review.
 *
 *   node migracion-v3/tanda-6-capa-ifra.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { pctToFraction } from "./lib/cifras.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { readSources, type Row } from "./lib/fuentes.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/6-capa-ifra";
const src = readSources();
const notes: string[] = [];

const CATEGORIES: ReadonlyArray<readonly [string, string]> = [
  ["cat_1", "1"], ["cat_2", "2"], ["cat_3", "3"], ["cat_4", "4"], ["cat_5a", "5A"], ["cat_5b", "5B"], ["cat_5c", "5C"],
  ["cat_5d", "5D"], ["cat_6", "6"], ["cat_7a", "7A"], ["cat_7b", "7B"], ["cat_8", "8"], ["cat_9", "9"], ["cat_10a", "10A"],
  ["cat_10b", "10B"], ["cat_11a", "11A"], ["cat_11b", "11B"], ["cat_12", "12"],
];
const isNumber = (t: string) => /^\d+(\.\d+)?$/.test(t);
const text = (t: string | undefined) => (t ?? "").trim() || null;

/** STD 089 and the standards of the phototoxic oils it names: one group, summed against their ceilings (V3-27; the v2's FUROCOUMARIN_OILS). */
const FUROCOUMARINS = new Set(["IFRA_STD_086", "IFRA_STD_087", "IFRA_STD_088", "IFRA_STD_089", "IFRA_STD_090", "IFRA_STD_091", "IFRA_STD_092", "IFRA_STD_093", "IFRA_STD_096"]);
/**
 * V3-27: the CAS of a constituent a limit is expressed as. IFRA's files name it but give no CAS:
 * 5-MOP is bergapten, CAS 484-20-8 (en.wikipedia.org/wiki/Bergapten; fishersci.ca, CAS RN 484-20-8;
 * read 2026-10-14). It is the constituent's identity, not a figure of IFRA.
 */
const CONSTITUENT_CAS: Readonly<Record<string, { cas: string; source: string }>> = {
  "5-MOP": { cas: "484-20-8", source: "bergapteno; en.wikipedia.org/wiki/Bergapten y fishersci.ca (CAS RN 484-20-8), leídos el 2026-10-14" },
};
/** V3-30: IFRA prohibits the substance as an ingredient and limits it in the naturals that bring it. */
const AS_SUCH = /as such should not be used/i;
/**
 * V3-31: the standards that prohibit one variant and limit another, by the species or the process
 * of a material. The first rule that matches says the variant; none, and it is not known. Each
 * cites IFRA's note it reads (nota_prohibicion, nota_restriccion).
 */
type Rule = readonly [field: "species" | "process", match: "contains" | "starts", pattern: string, variant: "prohibited" | "permitted"];
const EXTRACTS: readonly Rule[] = ["absoluto", "extracto", "destilad", "aceite", "resinoide", "rectificado"].map((p) => ["process", "contains", p, "permitted"] as const);
const VARIANTS: Readonly<Record<string, { readonly rules: readonly Rule[]; readonly reads: string }>> = {
  IFRA_STD_097: {
    rules: [["species", "contains", "erecta", "prohibited"], ["species", "contains", "minuta", "permitted"], ["species", "contains", "patula", "permitted"]],
    reads: "«Tagetes erecta should not be used…»; la restricción, «only applies to Tagetes patula and Tagetes minuta»",
  },
  IFRA_STD_071: { rules: EXTRACTS, reads: "«Peru balsam crude should not be used…»; la restricción, a sus extractos y destilados" },
  IFRA_STD_078: { rules: EXTRACTS, reads: "«Crude gums of Liquidambar… should not be used…»; solo extractos o destilados de la exudación" },
  IFRA_STD_083: {
    rules: [["process", "starts", "absoluto", "permitted"], ["process", "starts", "aceite", "prohibited"]],
    reads: "«Verbena oils… should not be used…»; «Only Verbena absolutes… can be used»",
  },
};

// ------------------------------------------------------------ the standards and their limits
const standards: Array<Record<string, Cell>> = [];
const limits: Array<Record<string, Cell>> = [];
const substances: Array<Record<string, Cell>> = [];
const variantRules: Array<Record<string, Cell>> = [];
const exclusions: Array<Record<string, Cell>> = [];
const counts = { asSuch: [] as string[], expressedAs: [] as string[], prohibitedOnly: 0, max: 0, prohibited: 0 };
const standardId = (code: string) => uuidFor(`ifra:std:${code}`);

for (const s of [...src.ifraStandards.values()].sort((a, b) => a.estandar.localeCompare(b.estandar))) {
  const code = s.estandar;
  const own = CATEGORIES.flatMap(([column, category]) => {
    const cell = (s[column] ?? "").trim();
    if (isNumber(cell)) return [{ category, kind: "max", value: pctToFraction(cell) }];
    if (cell === "ver-nota") {
      if (isNumber(s.limite_nota)) return [{ category, kind: "max", value: pctToFraction(s.limite_nota) }];
      notes.push(`${code}, categoría ${category}: «ver-nota» sin cifra en la nota; no entra límite.`);
      return [];
    }
    if (cell === "prohibido") return [{ category, kind: "prohibited", value: null }];
    if (cell !== "" && cell !== "sin-restriccion") notes.push(`${code}, categoría ${category}: celda «${cell}» que no se entiende; no entra.`);
    return [];
  });
  for (const l of own) {
    limits.push({ id: uuidFor(`ifra:limit:${code}:${l.category}`), standard_id: standardId(code), category: l.category, kind: l.kind, max_value: l.value });
    if (l.kind === "max") counts.max++;
    else counts.prohibited++;
  }
  const asSuch = s.prohibicion === "sí" && AS_SUCH.test(s.nota_prohibicion ?? "") && own.some((l) => l.kind === "max");
  if (asSuch) counts.asSuch.push(`${code} (${s.nombre})`);
  if (s.prohibicion === "sí" && own.length === 0) counts.prohibitedOnly++;
  const expressed = text(s.limite_expresado_como);
  if (expressed && !CONSTITUENT_CAS[expressed]) notes.push(`${code}: límite expresado como «${expressed}», sin CAS conocido; el límite no tendrá a quién aplicarse.`);
  if (expressed) counts.expressedAs.push(`${code}: ${expressed}, CAS ${CONSTITUENT_CAS[expressed]?.cas ?? "—"} (${CONSTITUENT_CAS[expressed]?.source ?? "sin fuente"})`);
  standards.push({
    id: standardId(code),
    code,
    name: s.nombre,
    amendment: s.enmienda,
    type: s.tipo,
    prohibition: s.prohibicion === "sí",
    restriction: s.restriccion === "sí",
    specification: s.especificacion === "sí",
    prohibited_as_such: asSuch,
    group_key: FUROCOUMARINS.has(code) ? "furocumarinas" : code,
    limit_expressed_as: expressed,
    limit_expressed_as_cas: expressed ? (CONSTITUENT_CAS[expressed]?.cas ?? null) : null,
    prohibition_note: text(s.nota_prohibicion),
    restriction_note: text(s.nota_restriccion),
    specification_note: text(s.nota_especificacion),
    limit_note: text(s.limite_nota),
    phototoxicity_note: text(s.nota_fototoxicidad),
    property: text(s.propiedad),
    scope_note: text(s.alcance_cas),
    contributions: text(s.contribuciones),
    contributions_note: text(s.nota_contribuciones),
  });
  const variant = VARIANTS[code];
  for (const [field, match, pattern, which] of variant?.rules ?? []) {
    variantRules.push({ id: uuidFor(`ifra:rule:${code}:${field}:${match}:${pattern}`), standard_id: standardId(code), field, match, pattern, variant: which });
  }
}
for (const code of Object.keys(VARIANTS)) if (!src.ifraStandards.has(code)) notes.push(`${code}: tiene reglas de variante (V3-31) y no está en los archivos de IFRA.`);

// ------------------------------------------------------------ the CAS each standard regulates
// One row per standard and CAS: a CAS IFRA lists under two subgroups of one standard (STD 097's
// 8016-84-0, under the prohibition of T. erecta and the restriction of T. patula and T. minuta)
// keeps both, joined.
const byStandardCas = new Map<string, { standard: string; cas: string; subgroups: string[]; synonyms: string[] }>();
for (const row of src.ifraStandardCas) {
  if (!src.ifraStandards.has(row.estandar)) {
    notes.push(`${row.cas}: en estandar-cas.csv bajo ${row.estandar}, que no está en estandares.csv; no entra.`);
    continue;
  }
  const key = `${row.estandar}:${row.cas}`;
  const entry = byStandardCas.get(key) ?? { standard: row.estandar, cas: row.cas, subgroups: [], synonyms: [] };
  if (byStandardCas.has(key)) notes.push(`${row.cas} sale dos veces en ${row.estandar} (subgrupos «${entry.subgroups.join("», «")}» y «${row.grupo}»): entra una fila con los dos.`);
  const subgroup = text(row.grupo);
  if (subgroup && !entry.subgroups.includes(subgroup)) entry.subgroups.push(subgroup);
  for (const x of (row.sinonimos ?? "").split(" | ").map((y) => y.trim()).filter((y) => y)) if (!entry.synonyms.includes(x)) entry.synonyms.push(x);
  byStandardCas.set(key, entry);
}
// V3-44: a standard of a class lists no CAS in IFRA's files (089, 184, 188): it takes the members the v2 gave it
// by name (grupo-miembros.csv), with the CAS of each. The limits stay IFRA's; only who belongs comes from that reading.
const withCas = new Set([...byStandardCas.values()].map((x) => x.standard));
const standardOfGroup = new Map(src.v2.groups.map((g) => [g.id, g.reference]));
const v2Material = new Map(src.v2.materials.map((m) => [m.id, m]));
const principal = new Map(src.v2.casAliases.filter((a) => a.relation === "principal").map((a) => [a.substanceId, a.cas]));
const byName: string[] = [];
for (const gm of src.v2.groupMembers) {
  const standard = standardOfGroup.get(gm.groupId);
  if (!standard || withCas.has(standard) || !src.ifraStandards.has(standard)) continue;
  const cas = gm.memberId.startsWith("S") ? principal.get(gm.memberId) : v2Material.get(gm.memberId)?.cas;
  if (!cas) {
    notes.push(`${standard}: su miembro ${gm.memberId} en la v2 no tiene CAS; no entra (V3-44).`);
    continue;
  }
  const key = `${standard}:${cas}`;
  if (byStandardCas.has(key)) continue;
  byStandardCas.set(key, { standard, cas, subgroups: ["miembro por nombre, según la v2 (V3-44)"], synonyms: [] });
  byName.push(`${standard}: ${cas} (${gm.memberId})`);
}
for (const x of byStandardCas.values()) {
  substances.push({
    id: uuidFor(`ifra:cas:${x.standard}:${x.cas}`),
    standard_id: standardId(x.standard),
    cas: x.cas,
    subgroup: x.subgroups.length ? x.subgroups.join(" | ") : null,
    synonyms: x.synonyms,
  });
}

// ------------------------------------------------------------ the specification that is not about a process (the user's decision)
const exclusionNotes = new Map(parseCsvRecords(readFileSync("datos/v2/exclusiones.csv", "utf8")).map((r) => [r.estandar, r.notas]));
for (const x of src.v2.exclusions) {
  for (const process of x.processes) {
    exclusions.push({
      id: uuidFor(`ifra:excl:${x.standard}:${process}`),
      standard_id: standardId(x.standard),
      process,
      note: `datos/v2/exclusiones.csv: ${exclusionNotes.get(x.standard) ?? ""}`.trim(),
    });
  }
}

// ------------------------------------------------------------ the annex: what each natural brings, as a fraction of it
const annex = new Map<string, Record<string, Cell>>();
let repeated = 0;
for (const row of src.ifraNaturals as readonly Row[]) {
  const record: Record<string, Cell> = {
    amendment: row.enmienda,
    natural_cas: text(row.cas_principal),
    natural_other_cas: (row.otros_cas ?? "").split(/\s+/).filter((x) => x),
    natural_name: row.nombre,
    botanical_name: text(row.nombre_botanico),
    iso_category: text(row.categoria_iso),
    rifm_id: text(row.rifm_id),
    constituent_cas: text(row.cas_constituyente),
    constituent_name: row.constituyente,
    concentration: pctToFraction(row.concentracion_pct),
    constituent_standard: text(row.estandar_constituyente),
    notice: text(row.aviso),
  };
  const key = JSON.stringify(record);
  if (annex.has(key)) {
    repeated++;
    notes.push(`Anexo: «${row.nombre}» con ${row.constituyente} al ${row.concentracion_pct} % sale dos veces igual en naturales.csv; entra una.`);
    continue;
  }
  annex.set(key, { id: uuidFor(`ifra:annex:${key}`), ...record });
}
const withoutStandard = [...annex.values()].filter((a) => a.constituent_standard === null).length;

// ------------------------------------------------------------ write the batch
writeTable(join(OUT, "ifra_standards.csv"), [
  "id", "code", "name", "amendment", "type", "prohibition", "restriction", "specification", "prohibited_as_such", "group_key",
  "limit_expressed_as", "limit_expressed_as_cas", "prohibition_note", "restriction_note", "specification_note", "limit_note",
  "phototoxicity_note", "property", "scope_note", "contributions", "contributions_note",
], standards);
writeTable(join(OUT, "ifra_limits.csv"), ["id", "standard_id", "category", "kind", "max_value"], limits);
writeTable(join(OUT, "ifra_substances.csv"), ["id", "standard_id", "cas", "subgroup", "synonyms"], substances);
writeTable(join(OUT, "ifra_annex.csv"), [
  "id", "amendment", "natural_cas", "natural_other_cas", "natural_name", "botanical_name", "iso_category", "rifm_id", "constituent_cas",
  "constituent_name", "concentration", "constituent_standard", "notice",
], [...annex.values()]);
writeTable(join(OUT, "ifra_variant_rules.csv"), ["id", "standard_id", "field", "match", "pattern", "variant"], variantRules);
writeTable(join(OUT, "ifra_spec_exclusions.csv"), ["id", "standard_id", "process", "note"], exclusions);

const list = (items: readonly string[]) => (items.length ? items.map((i) => `  - ${i}`).join("\n") : "  - Ninguno.");
const cat4 = limits.filter((l) => l.category === "4");
const report = `# Tanda 6 · La capa de IFRA

*Generada por \`migracion-v3/tanda-6-capa-ifra.ts\` (plan, paso 4.4; V3-35), solo de los archivos de IFRA (\`datos/ifra/51/\`, P37), del commit \`${src.commit}\`. Va a lo común, pero en su propia capa: sus tablas no son de los materiales, y bajan por su propio canal («ifra»).*

**Qué entra:**

- **${standards.length} estándares** (\`ifra_standards.csv\`), con sus notas tal como las escribe IFRA y su enmienda: ${standards.filter((s) => s.amendment === "51").length} de la 51, ${standards.filter((s) => s.amendment === "49").length} de la 49 y el resto de enmiendas anteriores que la 51 mantiene.
- **${limits.length} límites por categoría** (\`ifra_limits.csv\`): ${counts.max} techos en fracción del producto terminado y ${counts.prohibited} prohibiciones de una categoría. En la categoría 4, la que usa la app: ${cat4.filter((l) => l.kind === "max").length} techos y ${cat4.filter((l) => l.kind === "prohibited").length} prohibiciones. «ver-nota» toma la cifra de su nota; «sin-restriccion» o nada, ninguna fila. **${counts.prohibitedOnly} estándares prohíben sin límite en ninguna categoría**: la app prohíbe el material como tal, o con especificación, una variante (el cade; V3-25).
- **${substances.length} CAS regulados** (\`ifra_substances.csv\`), con su subgrupo y sus sinónimos cuando IFRA los da. El subgrupo es un encabezado de la lista de IFRA, no otro techo.
- **${annex.size} filas del anexo de naturales** (\`ifra_annex.csv\`): lo que IFRA dice que trae cada natural, en fracción del natural, con su otro CAS. ${withoutStandard} no dicen el estándar de su constituyente (el CAS lo enlaza igual). ${[...annex.values()].filter((a) => a.natural_cas === null).length} no traen CAS principal, solo otros CAS (el absoluto de ylang-ylang): la app los busca también por ellos. ${repeated} filas repetidas iguales entran una vez.

**Lo decidido encima del texto de IFRA:**

- **El grupo «furocumarinas»** (V3-27): el 089 y los estándares de los aceites fototóxicos que nombra (086 a 096) suman contra sus techos, como un grupo combinado.
- **Un límite expresado como un constituyente** (V3-27):
${list(counts.expressedAs)}
- **Prohibidas como tal, con techo** (V3-30; su nota dice «as such should not be used»):
${list(counts.asSuch)}
- **Una variante prohibida** (V3-31), regla a regla, la primera que casa (\`ifra_variant_rules.csv\`, ${variantRules.length} reglas):
${Object.entries(VARIANTS).map(([code, v]) => `  - **${code}**: ${v.rules.map(([f, m, p, w]) => `${f === "species" ? "especie" : "proceso"} ${m === "starts" ? "empieza por" : "contiene"} «${p}» → ${w === "prohibited" ? "prohibida" : "permitida"}`).join("; ")}. Lee ${v.reads}.`).join("\n")}
- **Los estándares de clase** (V3-44): ${[...new Set(byName.map((x) => x.split(":")[0]))].join(", ") || "ninguno"} no listan ningún CAS en los archivos de IFRA; toman los ${byName.length} miembros que les dio la v2 por nombre (\`grupo-miembros.csv\`), marcados «miembro por nombre, según la v2 (V3-44)». Sus límites siguen saliendo de IFRA.
- **La especificación que no es de un proceso** (\`ifra_spec_exclusions.csv\`, ${exclusions.length}): de \`datos/v2/exclusiones.csv\`, con su nota y la decisión del usuario que cita (el resinoide de estoraque no lleva la especificación de HAP del aceite de pirólisis).

**Lo que no entra:** ningún material. La pertenencia de los materiales de la v2 a cada estándar (\`grupo-miembros.csv\`) era de la v2: en la v3 un material dice su CAS y la app lo busca aquí.

**Para revisar** (${notes.length}):

${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "- Nada."}
`;
writeFileSync(join(OUT, "informe.md"), report, "utf8");
console.log(`Tanda 6: ${standards.length} estándares, ${limits.length} límites, ${substances.length} CAS, ${annex.size} filas del anexo, ${variantRules.length} reglas, ${exclusions.length} exclusiones; ${notes.length} notas. ${OUT}/informe.md`);
