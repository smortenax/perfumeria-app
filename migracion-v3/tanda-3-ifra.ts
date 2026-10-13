/**
 * Batch 3 of the migration (plan v3, phase 4, steps 4.4, 4.5 and 4.6): IFRA's regulations and
 * the manufacturers' ceilings. Writes migracion-v3/tandas/3-ifra/ (regulations.csv and
 * informe.md), for the user to review (V3-21).
 *
 * From IFRA's own files (datos/ifra/51/estandares.csv, 51st amendment) and who is a member of
 * each standard (datos/v2/grupo-miembros.csv): one regulation per member and category, as the
 * v2 read them (src/v2/to-ifra.ts). A product carries its material's (V3-2), as the v2 judged it.
 *
 *   node migracion-v3/tanda-3-ifra.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pctToFraction } from "./lib/cifras.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { known, readSources, type Row } from "./lib/fuentes.ts";
import { uuidFor, v2Id } from "./lib/ids.ts";
import type { Material as V2Material } from "../src/v2/model.ts";

const OUT = "migracion-v3/tandas/3-ifra";
const src = readSources();
const { v2 } = src;

const CATEGORIES: ReadonlyArray<readonly [string, string]> = [
  ["cat_1", "1"], ["cat_2", "2"], ["cat_3", "3"], ["cat_4", "4"], ["cat_5a", "5A"], ["cat_5b", "5B"], ["cat_5c", "5C"],
  ["cat_5d", "5D"], ["cat_6", "6"], ["cat_7a", "7A"], ["cat_7b", "7B"], ["cat_8", "8"], ["cat_9", "9"], ["cat_10a", "10A"],
  ["cat_10b", "10B"], ["cat_11a", "11A"], ["cat_11b", "11B"], ["cat_12", "12"],
];
/** STD 089 and the standards of the phototoxic oils it names: summed against their ceilings (V3-27; the v2's FUROCOUMARIN_OILS). */
const FUROCOUMARINS = new Set(["IFRA_STD_086", "IFRA_STD_087", "IFRA_STD_088", "IFRA_STD_089", "IFRA_STD_090", "IFRA_STD_091", "IFRA_STD_092", "IFRA_STD_093", "IFRA_STD_096"]);
const FIVE_MOP = uuidFor("ifra:5-MOP");
const AUTHORITY: Readonly<Record<string, string>> = { lote: "lot", producto: "product", "anexo-ifra": "ifra", literatura: "literature", consenso: "consensus" };
const isNumber = (t: string) => /^\d+(\.\d+)?$/.test(t);

/** V3-30: IFRA prohibits the substance as an ingredient and limits it in the naturals that bring it. */
const AS_SUCH = /as such should not be used/i;

/**
 * V3-31: the standards that prohibit one variant and limit another. Each member goes by the
 * species and the process the v2 gives it; when they do not say which variant it is, «unknown».
 */
type Variant = "prohibited" | "permitted" | "unknown";
const EXTRACT_OR_DISTILLATE = /absoluto|extracto|destilad|aceite|resinoide|rectificado/;
const byProcess = (m: V2Material): Variant => (EXTRACT_OR_DISTILLATE.test(known(m.process) ?? "") ? "permitted" : "unknown");
const VARIANTS: Readonly<Record<string, { readonly rule: string; readonly classify: (m: V2Material) => Variant }>> = {
  IFRA_STD_097: {
    rule: "por la especie: *Tagetes erecta*, prohibida; *T. minuta* y *T. patula*, permitidas",
    classify: (m) => (/erecta/i.test(m.species) ? "prohibited" : /minuta|patula/i.test(m.species) ? "permitted" : "unknown"),
  },
  IFRA_STD_071: { rule: "por el proceso: un extracto o un destilado (absoluto, extracto, destilado, aceite, resinoide, rectificado), permitido; el crudo, prohibido", classify: byProcess },
  IFRA_STD_078: { rule: "por el proceso: un extracto o un destilado de la exudación (absoluto, extracto, destilado, aceite, resinoide, rectificado), permitido; las gomas crudas, prohibidas", classify: byProcess },
  IFRA_STD_083: {
    rule: "por el proceso: el absoluto, permitido; el aceite, prohibido",
    classify: (m) => (/^absoluto/.test(m.process) ? "permitted" : /^aceite/.test(m.process) ? "prohibited" : "unknown"),
  },
};
const VARIANT_NAME: Readonly<Record<Variant, string>> = { prohibited: "prohibida", permitted: "permitida", unknown: "no se sabe" };

const notes: string[] = [];
const materials = new Map(v2.materials.map((m) => [m.id, m]));
const substanceName = new Map(v2.substances.map((s) => [s.id, s.name]));
const materialOfSubstance = new Map(v2.materials.filter((m) => m.substanceId).map((m) => [m.substanceId, m.id]));
const productsOf = new Map<string, string[]>();
for (const p of v2.products) productsOf.set(p.materialId, [...(productsOf.get(p.materialId) ?? []), p.id]);
const standardOfGroup = new Map(v2.groups.map((g) => [g.id, g.reference]));
const documents = new Map(v2.documents.map((d) => [d.id, d]));

/** The v2 id of the material a member is (a substance's material, or the material itself), or the substance without a material. */
const materialOf = (memberId: string) => (memberId.startsWith("S") ? (materialOfSubstance.get(memberId) ?? memberId) : memberId);

const COLUMNS = ["id", "material_id", "regime", "category", "kind", "max_value", "group_key", "requirement", "authority", "source"] as const;
const out: Array<Record<string, Cell>> = [];
const counts = {
  members: 0, max: 0, prohibited: 0, requirement: 0, excluded: [] as string[], asSuch: [] as string[], variants: new Map<string, string[]>(),
  variantRequirements: 0, conditions: 0, ceilings: 0, fiveMop: 0, products: new Set<string>(),
};

const sourceOf = (s: Row) => `IFRA 51, ${s.estandar}: ${s.nombre} (enmienda ${s.enmienda})`;

/** Writes one regulation on a v2 container (material, product or substance) and on the products of a material. */
function write(v2Container: string, key: string, row: Record<string, Cell>, withProducts = true) {
  const targets = [v2Container, ...(withProducts ? (productsOf.get(v2Container) ?? []) : [])];
  for (const target of targets) {
    if (target !== v2Container) counts.products.add(target);
    out.push({ id: uuidFor(`reg:${target}|${key}`), material_id: v2Id(target), ...row });
  }
}

// ------------------------------------------------------------ the standards, member by member
for (const gm of v2.groupMembers) {
  const standard = standardOfGroup.get(gm.groupId)!;
  const s = src.ifraStandards.get(standard)!;
  const member = materialOf(gm.memberId);
  counts.members++;
  // The v2's subgroup is a heading of IFRA's list, not another ceiling: every member of a standard adds up against it.
  const group = FUROCOUMARINS.has(standard) ? "furocumarinas" : standard;
  const limits = CATEGORIES.flatMap(([column, category]) => {
    const cell = s[column];
    if (isNumber(cell)) return [{ category, kind: "max", value: pctToFraction(cell) }];
    if (cell === "ver-nota" && isNumber(s.limite_nota)) return [{ category, kind: "max", value: pctToFraction(s.limite_nota) }];
    if (cell === "prohibido") return [{ category, kind: "prohibited", value: null }];
    return [];
  });

  // V3-27: a limit expressed as a constituent (STD 089, 5-MOP) is the constituent's, not the member's.
  if (s.limite_expresado_como) {
    if (s.limite_expresado_como !== "5-MOP") notes.push(`${standard}: límite expresado como «${s.limite_expresado_como}», sin material para él; no entra.`);
    else if (counts.fiveMop === 0) {
      for (const l of limits) {
        out.push({
          id: uuidFor(`reg:5-MOP|${standard}|${l.category}`), material_id: FIVE_MOP, regime: "ifra", category: l.category, kind: l.kind,
          max_value: l.value, group_key: group, requirement: null, authority: "ifra", source: `${sourceOf(s)}; el límite es del 5-MOP en el producto terminado (V3-27)`,
        });
        counts.max++;
      }
      counts.fiveMop++;
    }
    continue;
  }

  // V3-31: the prohibited variant is prohibited, with no ceiling nor specification.
  const rule = VARIANTS[standard];
  const v2Material = materials.get(member);
  const variant: Variant | null = rule ? (v2Material ? rule.classify(v2Material) : "unknown") : null;
  if (variant) {
    counts.variants.set(standard, [...(counts.variants.get(standard) ?? []), `${v2Material?.name ?? substanceName.get(member) ?? member} (${member}): ${VARIANT_NAME[variant]}`]);
  }
  if (variant === "prohibited") {
    write(member, `${standard}|prohibited`, {
      regime: "ifra", category: null, kind: "prohibited", max_value: null, group_key: group, requirement: null, authority: "ifra", source: sourceOf(s),
    });
    counts.prohibited++;
    continue;
  }

  for (const l of limits) {
    write(member, `${standard}|${l.category}|${l.kind}`, {
      regime: "ifra", category: l.category, kind: l.kind, max_value: l.value, group_key: group, requirement: null, authority: "ifra", source: sourceOf(s),
    });
    if (l.kind === "max") counts.max++;
    else counts.prohibited++;
  }

  // A specification, unless the standard says it is about other processes than this material's (exclusiones.csv).
  const process = (materials.get(member)?.process ?? "").toLowerCase();
  const excluded = v2.exclusions.some((x) => x.standard === standard && x.processes.some((p) => process.includes(p)));
  const specified = s.especificacion === "sí" && !excluded;
  if (s.especificacion === "sí" && excluded) counts.excluded.push(`${member} (${materials.get(member)?.name}): ${standard}`);
  if (specified) {
    write(member, `${standard}|spec`, {
      regime: "ifra", category: null, kind: "requirement", max_value: null, group_key: group,
      requirement: (s.nota_especificacion || s.nombre).trim(), authority: "ifra", source: sourceOf(s),
    });
    counts.requirement++;
  }

  // V3-31: when the data do not say which variant it is, a requirement, pending until a document accredits it (V3-25).
  // Its own key: accrediting the standard's specification does not prove it is not the prohibited variant.
  if (variant === "unknown") {
    write(member, `${standard}|variant`, {
      regime: "ifra", category: null, kind: "requirement", max_value: null, group_key: `${group} · variante`,
      requirement: `No es la variante prohibida: «${s.nota_prohibicion.trim()}»`, authority: "ifra", source: sourceOf(s),
    });
    counts.variantRequirements++;
  }

  // A prohibition with no ceiling in any category: the material is prohibited as such, or (with a specification) a
  // variant of it is, and the permitted one has to meet the specification (STD 119, the cade). With ceilings: the
  // prohibitions of some categories are already in; a substance prohibited «as such» has both (V3-30); a prohibited
  // variant goes by V3-31; anything else is left for review.
  if (s.prohibicion === "sí") {
    const asSuch = AS_SUCH.test(s.nota_prohibicion) && limits.some((l) => l.kind === "max");
    if (limits.length === 0 || (asSuch && gm.memberId.startsWith("S"))) {
      write(member, `${standard}|prohibited`, {
        regime: "ifra", category: null, kind: "prohibited", max_value: null, group_key: group, requirement: null, authority: "ifra", source: sourceOf(s),
      });
      counts.prohibited++;
      if (asSuch) counts.asSuch.push(`${standard} (${s.nombre}): ${v2Material?.name ?? substanceName.get(member) ?? member} (${member})`);
    } else if (asSuch) {
      notes.push(`${standard}: prohíbe la sustancia como tal, y ${member} no es una sustancia; entran sus techos (V3-30).`);
    } else if (!rule && !limits.some((l) => l.kind === "prohibited")) {
      notes.push(`${standard} (${s.nombre}): prohíbe algo y pone techo, y no tiene regla (V3-30, V3-31); entran sus techos.`);
    }
  }
}

// ------------------------------------------------------------ the claims that meet a specification (condiciones.csv)
for (const c of v2.conditions) {
  const s = src.ifraStandards.get(c.standard)!;
  const group = FUROCOUMARINS.has(c.standard) ? "furocumarinas" : c.standard;
  const doc = c.documentId ? `${c.documentId} · ${documents.get(c.documentId)?.title ?? ""}` : "sin documento";
  write(c.containerId, `${c.standard}|condition|${c.authority}`, {
    regime: "ifra", category: null, kind: "requirement", max_value: null, group_key: group, requirement: c.claim,
    authority: AUTHORITY[c.authority], source: `Afirmación del cumplimiento de ${c.standard} (${s.nombre}): ${doc}`,
  });
  counts.conditions++;
}

// ------------------------------------------------------------ the manufacturers' ceilings of their products (D4, P62)
for (const t of v2.ceilings) {
  write(t.productId, `ceiling|${t.category}|${t.documentId}`, {
    regime: "manufacturer", category: t.category, kind: "max", max_value: pctToFraction(t.maxPct), group_key: null, requirement: null,
    authority: "product", source: `${t.documentId} · ${documents.get(t.documentId)?.title ?? ""}`,
  }, false);
  counts.ceilings++;
}

const ids = new Set<string>();
for (const r of out) {
  if (ids.has(String(r.id))) notes.push(`id repetido: ${r.id} (${r.material_id}, ${r.source})`);
  ids.add(String(r.id));
}
writeTable(join(OUT, "regulations.csv"), COLUMNS, out);

// ------------------------------------------------------------ the report
const list = (items: readonly string[]) => (items.length ? items.map((i) => `  - ${i}`).join("\n") : "  - Ninguno.");
const cat4 = out.filter((r) => r.category === "4" || r.category === null).length;
const report = `# Tanda 3 · IFRA y los topes de fabricante

*Generada por \`migracion-v3/tanda-3-ifra.ts\`. Los estándares, de los archivos de IFRA (\`datos/ifra/51/estandares.csv\`, 51.ª enmienda); quién es miembro de cada uno, de la v2 (\`grupo-miembros.csv\`); commit \`${src.commit}\`. \`validar:v2\`: sin errores.*

**Qué entra** (\`regulations.csv\`, ${out.length} filas; ${cat4} de la categoría 4 o de todas, las que usa la app): ${counts.max} techos, ${counts.prohibited} prohibiciones, ${counts.requirement} especificaciones, ${counts.variantRequirements} requisitos de «no es la variante prohibida», ${counts.conditions} afirmaciones de cumplimiento y ${counts.ceilings} topes de fabricante, de ${counts.members} pertenencias a un estándar.

**Cómo se traduce, como la v2:**

- **Una regulación por miembro y categoría** (de la 1 a la 12): una cifra es un techo en fracción del producto terminado; «ver-nota», el techo de su nota; «prohibido», una prohibición en esa categoría; «sin-restriccion» o nada, ninguna fila. La enmienda va en la fuente.
- **El grupo** (\`group_key\`) es el estándar: el subgrupo de la v2 es un encabezado de la lista de IFRA, no otro techo, y todos los miembros de un estándar suman contra él (lo usa el 097, y el 137, el 138 y el 181 con «e.g.» o su especificación). El 089 y los estándares de los aceites fototóxicos que nombra (086 a 096) comparten «furocumarinas», y el motor suma la parte de cada uno sobre su techo.
- **El 089 va en el 5-MOP** (V3-27): su límite es del 5-MOP en el producto terminado, no del aceite.
- **Una prohibición sin techo en ninguna categoría** prohíbe el material como tal; con especificación, prohíbe una variante, y la permitida tiene que cumplirla (el 119, el cade; V3-25).
- **Una especificación** es un requisito con autoridad de IFRA, pendiente de acreditar, salvo donde el estándar habla de otros procesos (\`exclusiones.csv\`):
${list(counts.excluded)}
- **Las afirmaciones de cumplimiento** de \`condiciones.csv\` son requisitos con su autoridad (el cade rectificado, por consenso: supuesto).
- **Los topes de fabricante** de \`topes.csv\`, cada uno en su producto (D4).
- **Cada producto lleva las regulaciones de su material** (V3-2; ${counts.products.size} productos), como la v2 lo juzgaba.

**Prohibidas como tal, con su techo** (V3-30): IFRA prohíbe la sustancia como ingrediente y la limita en los naturales que la traen. Cada una lleva una prohibición para todas las categorías y sus techos; sus productos, lo mismo:
${list(counts.asSuch)}

**Una variante prohibida** (V3-31): cada miembro va por la especie y el proceso que tiene en la v2. La prohibida lleva solo la prohibición. La permitida, sus techos y su especificación. Lo que no se sabe, además, el requisito «No es la variante prohibida», con la frase de IFRA, pendiente hasta que un documento lo acredite. Lleva su propia clave («IFRA_STD_078 · variante»): acreditar la especificación del estándar no prueba que no sea la variante prohibida.
${[...counts.variants].map(([standard, members]) => `- **${standard}** (${src.ifraStandards.get(standard)!.nombre}), ${VARIANTS[standard].rule}:\n${list(members)}`).join("\n")}

**Para revisar** (${notes.length}):

${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "- Nada."}
`;
writeFileSync(join(OUT, "informe.md"), report, "utf8");
console.log(`Tanda 3: ${out.length} regulaciones; ${notes.length} notas para revisar. ${OUT}/informe.md`);
