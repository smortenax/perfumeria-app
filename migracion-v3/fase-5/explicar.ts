import type { CompositionRow, Dataset, Material } from "../../src/v2/model.ts";
import { buildIfra, type IfraBuild, type IfraFiles } from "../../src/v2/to-ifra.ts";
import type { CatalogMaterial } from "../../v3/src/db/catalog";
import type { IfraLayer } from "../../v3/src/db/ifra-layer";
import type { Pair } from "./cargar.ts";
import { type Canon, compare, type Diff } from "./comparar.ts";

/**
 * Why each difference is there (plan v3, step 5.1). A difference is explained only when the data prove it:
 *
 * 1. By taking the v2 apart. The v2 is read again without what the v3 does not carry (the certificate, ceiling
 *    and claims of the user's product, which go to the user's version: V3-39; and the figures of other
 *    suppliers' documents, which the v3 does not bring at all). If the difference is gone, that is its reason.
 * 2. By what the pair is: its type in the lab and in the v2, the standards the v2 linked to it by name, the
 *    entries the annex has for its CAS, the variant rules of the layer.
 *
 * What neither does is «sin explicar», with whatever the data show of it. Nothing is hidden or fixed here.
 */

export interface Reason {
  readonly label: string;
  /** For the tables. */
  readonly short: string;
  readonly decisions: string;
}

/** Plain order, whatever the machine's locale: the output must be the same bytes anywhere. */
export const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

export const REASONS: Readonly<Record<string, Reason>> = {
  "V3-39": { short: "certificado, tope y afirmaciones, a tu versión", label: "El certificado, el tope o la afirmación de tu producto van a tu versión, no al común", decisions: "V3-39" },
  "otros-proveedores": {
    short: "cifras de otro proveedor",
    label: "Cifras de documentos de otro proveedor (D9 de la v2): la v3 solo trae los certificados de tu producto y el anexo de IFRA",
    decisions: "V3-34, V3-39",
  },
  tipo: { short: "tipo del laboratorio", label: "El laboratorio tiene el material por otro tipo que la v2 (molécula, natural, composición)", decisions: "V3-12, V3-34" },
  aislado: { short: "aislado sin «Sin identificar»", label: "Aislado natural sin «Sin identificar»: la composición del laboratorio quedó aplazada", decisions: "V3-29, V3-33" },
  "por-cas": {
    short: "capa de IFRA por CAS",
    label: "La capa de IFRA lee por CAS: la v2 lo enlazaba por el grupo de la v2 o solo daba el anexo a los naturales del glosario",
    decisions: "V3-35",
  },
  variante: { short: "variante por especie y proceso", label: "La variante prohibida se clasifica por especie y proceso", decisions: "V3-31" },
  "V3-23": { short: "propia entrada del anexo", label: "El anexo: cada ficha toma su propia entrada, no el máximo de las de su CAS", decisions: "V3-23" },
  "V3-28": { short: "anexo prestado, literatura", label: "Cifras del anexo prestadas de otras formas: literatura, nunca «dentro»", decisions: "V3-28" },
  "V3-27": { short: "5-MOP como componente", label: "Un límite expresado como constituyente (5-MOP) va como componente", decisions: "V3-27" },
  "V3-30": { short: "prohibida como tal con techo", label: "Una molécula prohibida como tal lleva la prohibición y el techo", decisions: "V3-30" },
  "V3-25": {
    short: "estado de la ficha",
    label: "La ficha lee todas las regulaciones de la ficha y su condición: el tope del fabricante cuenta como techo y el cade rectificado ya no sale «prohibido»",
    decisions: "V3-25, V3-39",
  },
  consecuencia: { short: "consecuencia de lo anterior", label: "La ficha sale del mismo cálculo: cambia porque cambia lo anterior", decisions: "las de arriba" },
  "sin-explicar": { short: "sin explicar", label: "Sin explicar", decisions: "—" },
};

/** The order the reasons are shown in. */
export const REASON_ORDER = Object.keys(REASONS);

export interface Explained extends Diff {
  /** A key of REASONS. */
  readonly reason: string;
  readonly evidence: string;
  /** What the v3 does with respect to the v2: loses a constraint, adds one, or changes a figure. */
  readonly effect: "v3 pierde" | "v3 añade" | "cambia";
}

const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const itemKey = (d: Diff) => `${d.where}|${d.what}`;
const short = (text: string, n = 70) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);

// ------------------------------------------------------------------ taking the v2 apart

export interface V2Variants {
  /** Without the certificates, ceilings and claims of the user's product (V3-39). */
  readonly withoutUserDocuments: IfraBuild;
  /** Also without the figures of other suppliers' documents and the literature. */
  readonly withoutBoth: IfraBuild;
  /** Without the figures of other suppliers' documents and the literature only (for the user's version). */
  readonly withoutForeign: IfraBuild;
}

function without(data: Dataset, authorities: readonly string[], userDocuments: boolean): Dataset {
  const removed = data.composition.filter((r) => authorities.includes(r.authority));
  const pairs = new Set(removed.map((r) => `${r.containerId}|${r.documentId}`));
  const containers = new Set([...data.products.map((p) => p.id), ...data.lots.map((l) => l.id)]);
  return {
    ...data,
    composition: data.composition.filter((r) => !authorities.includes(r.authority)),
    // A document's coverage goes with its figures; a product's or a lot's certificate that declares nothing is also the user's.
    coverages: data.coverages.filter((c) => !pairs.has(`${c.containerId}|${c.documentId}`) && !(userDocuments && containers.has(c.containerId))),
    ceilings: userDocuments ? [] : data.ceilings,
    conditions: userDocuments ? [] : data.conditions,
  };
}

export function v2Variants(data: Dataset, files: IfraFiles): V2Variants {
  const noUser = without(data, ["lote", "producto"], true);
  return {
    withoutUserDocuments: buildIfra(noUser, files),
    withoutBoth: buildIfra(without(noUser, ["literatura", "consenso"], false), files),
    withoutForeign: buildIfra(without(data, ["literatura", "consenso"], false), files),
  };
}

// ------------------------------------------------------------------ what a pair is

/** The entries of IFRA's annex for a material, and the one the v3 takes as its own (adapter, `annexOf`). */
export function annexFor(layer: IfraLayer, cas: readonly string[], names: readonly string[]) {
  const entries = layer.annex.filter((e) => (e.naturalCas !== null && cas.includes(e.naturalCas)) || e.naturalOtherCas.some((c) => cas.includes(c)));
  const entryNames = [...new Set(entries.map((e) => e.naturalName))];
  const candidates = entryNames.filter((n) => names.some((m) => fold(m) === fold(n)));
  const own = entryNames.length === 1 ? entryNames[0] : candidates[0];
  return { entries, entryNames, candidates, own, onlyEntry: entryNames.length === 1 };
}

export interface PairContext {
  readonly pair: Pair;
  readonly v2Material: Material;
  readonly v3: CatalogMaterial;
  readonly cas: readonly string[];
  readonly annex: ReturnType<typeof annexFor>;
  /** The v2's annex rows of the pair (authority anexo-ifra) with the note that says which entry they come from. */
  readonly v2Annex: ReadonlyArray<{ readonly row: CompositionRow; readonly note: string }>;
  /** The IFRA standards the v2 links to the pair by its groups (by name, not by CAS). */
  readonly v2Standards: ReadonlySet<string>;
  readonly layer: IfraLayer;
  readonly hasV3Components: boolean;
}

export function contextOf(
  pair: Pair,
  data: Dataset,
  notes: ReadonlyMap<number, string>,
  common: CatalogMaterial,
  mine: CatalogMaterial,
  layer: IfraLayer,
): PairContext | null {
  if (!pair.v2Id || !pair.v2Material) return null;
  const v2Material = data.materials.find((m) => m.id === pair.v2Material)!;
  const chain = [...new Set([pair.v2Id, pair.v2Material])];
  const cas = [...new Set([...(common.cas ? [common.cas] : []), ...common.otherCas])];
  const names = [...new Set([common.name, ...common.aliases, mine.name, ...mine.aliases])];
  const groupStandard = new Map(data.groups.filter((g) => g.type === "estandar-ifra").map((g) => [g.id, g.reference]));
  const members = new Set([pair.v2Material, v2Material.substanceId].filter(Boolean));
  return {
    pair,
    v2Material,
    v3: common,
    cas,
    annex: annexFor(layer, cas, names),
    v2Annex: data.composition.filter((r) => chain.includes(r.containerId) && r.authority === "anexo-ifra").map((row) => ({ row, note: notes.get(row.line) ?? "" })),
    v2Standards: new Set(data.groupMembers.filter((gm) => members.has(gm.memberId)).map((gm) => groupStandard.get(gm.groupId)).filter((s): s is string => !!s)),
    layer,
    hasV3Components: mine.components.length > 0 || common.components.length > 0,
  };
}

// ------------------------------------------------------------------ the detectors

interface Hit {
  readonly reason: string;
  readonly evidence: string;
}

const codesOf = (what: string): string[] => [...what.matchAll(/IFRA_STD_\d+/g)].map((m) => m[0]);

/** V3-31: which variant the material is, by the rules of the layer (adapter, `variantOf`). */
function variantOf(layer: IfraLayer, code: string, c: PairContext): string {
  const s = layer.standards.get(code);
  if (!s || s.variantRules.length === 0) return "sin reglas";
  for (const rule of s.variantRules) {
    const value = fold((rule.field === "species" ? c.v3.species : c.v3.process) ?? "");
    const pattern = fold(rule.pattern);
    if (value && (rule.match === "starts" ? value.startsWith(pattern) : value.includes(pattern))) return rule.variant === "prohibited" ? "prohibida" : "permitida";
  }
  return "no se sabe";
}

type Detector = (d: Diff, c: PairContext) => Hit | null;

/** The note of a v2 annex row says which entry it comes from: «<name> (<botanical name>)» or «el máximo de las N entradas…». */
function v2Entry(c: PairContext): { borrowed: boolean; name: string | null } {
  const notes = [...new Set(c.v2Annex.map((a) => a.note))];
  if (notes.some((n) => n.startsWith("el máximo de las"))) return { borrowed: true, name: null };
  return { borrowed: false, name: notes.length === 1 ? notes[0].replace(/ \(.*$/, "") : null };
}

/** The type the lab gives the material, against the v2's. */
const byType: Detector = (d, c) => {
  if (d.where !== "pendiente" || d.what !== "sin-datos") return null;
  const v2Pure = c.v2Material.type === "sustancia";
  if (d.v3 === "—" && c.v3.kind === "molecule" && !v2Pure) {
    return { reason: "tipo", evidence: `v2: tipo «${c.v2Material.type}», sin datos de sus constituyentes; v3: molécula (V3-12), sin componentes = ella misma (§3.4)` };
  }
  if (d.v2 === "—" && c.v3.kind !== "molecule" && v2Pure && c.annex.entries.length === 0) {
    return { reason: "tipo", evidence: `v2: sustancia, pura por convención (D7); v3: ${c.v3.kind} sin componentes ni entrada en el anexo, queda «sin datos»` };
  }
  return null;
};

/** V3-29 and V3-33: a natural isolate with no documents was pending in the v2. */
const byIsolate: Detector = (d, c) => {
  if (d.where !== "pendiente" || !d.what.startsWith("impurezas:") || d.v3 !== "—") return null;
  if (c.v3.kind !== "molecule" || c.hasV3Components) return null;
  return {
    reason: "aislado",
    evidence: `v2: ${c.v2Material.origin || "origen sin decir"}, sin documentos de su producto (D7); v3: molécula sin componentes; el «Sin identificar» de V3-29 vivía en la composición retirada (V3-34) y la del laboratorio está aplazada (V3-33)`,
  };
};

/** V3-31: the v2 left a note of a prohibited variant that the v3 classifies by species and process. */
const byVariant: Detector = (d, c) => {
  if (d.where === "condición" && d.what.startsWith("nota-variante:") && d.v3 === "—") {
    const code = codesOf(d.what)[0];
    if (variantOf(c.layer, code, c) === "permitida") {
      return { reason: "variante", evidence: `v3: ${code} clasifica su proceso «${short(c.v3.process ?? "", 40)}» como la variante permitida y le pone su techo, sin la nota` };
    }
  }
  if (d.where === "pendiente" && d.what.startsWith("variante:") && d.v2 === "—") {
    const code = codesOf(d.what)[0];
    return { reason: "variante", evidence: `v3: ${code} no puede decir qué variante es (${variantOf(c.layer, code, c)}); pide acreditar que no es la prohibida` };
  }
  return null;
};

/** V3-30: a substance that IFRA prohibits as such and limits in the naturals that bring it. */
const byProhibitedAsSuch: Detector = (d, c) => {
  if (!d.what.startsWith("prohibido")) return null;
  const code = codesOf(d.what)[0];
  return code && c.layer.standards.get(code)?.prohibitedAsSuch ? { reason: "V3-30", evidence: `${code} prohíbe la sustancia como tal y le pone techo en los naturales` } : null;
};

/** V3-27 and V3-35: a v2 note that a limit is of a constituent, or a specification, that rests on a link by name. */
const byClassLink: Detector = (d, c) => {
  if (d.where !== "pendiente" || d.v3 !== "—" || !/^(limite-constituyente|espec):/.test(d.what)) return null;
  const code = codesOf(d.what)[0];
  const standard = code ? c.layer.standards.get(code) : undefined;
  if (!code || !standard) return null;
  const listed = standard.substances.filter((s) => c.cas.includes(s.cas));
  if (d.what.startsWith("limite-constituyente:") && standard.limitExpressedAsCas && listed.length > 0) {
    return { reason: "V3-27", evidence: `v3: ${standard.limitExpressedAs} entra como componente de cantidad desconocida (${code})` };
  }
  if (c.v2Standards.has(code) && listed.length === 0) {
    const why = standard.substances.length === 0 ? "es un estándar de clase y IFRA no lista ningún CAS en él" : `no lista ${c.cas.join(" ni ") || "ningún CAS suyo"}`;
    return { reason: "por-cas", evidence: `v2: el grupo de ${code} (${standard.name}) lo tiene como miembro (${c.v2Material.name}); v3: ${code} ${why}` };
  }
  return null;
};

/** The annex: the entries the v3 reads for the material's CAS, against the rows the v2 gave it. */
const byAnnex: Detector = (d, c) => {
  const noDataGone = d.where === "pendiente" && d.what === "sin-datos" && d.v2 !== "—" && d.v3 === "—";
  if (d.where !== "sustancia" && !noDataGone) return null;
  const codes = d.where === "sustancia" ? d.what.replace(/^std:/, "").split("+") : [];
  const v3FromAnnex = d.where === "sustancia" ? d.v3 !== "—" && codes.some((code) => c.annex.entries.some((e) => e.constituentStandard === code)) : c.annex.entries.length > 0;
  const v2FromAnnex = d.where === "sustancia" && d.v2 !== "—" && c.v2Annex.length > 0;
  if (!v3FromAnnex && !v2FromAnnex) return null;
  // The v2 gave it no annex row at all: it only had them for the glossary's naturals (D14).
  if (c.v2Annex.length === 0) {
    if (!v3FromAnnex) return null;
    const reads = `v2: ninguna fila del anexo (D14 solo lo daba a los naturales del glosario); v3: lee ${c.annex.entries.length} filas del anexo por CAS, de ${c.annex.entryNames.join(", ")}`;
    // V3-23 and V3-28: an entry that is not the material's own is borrowed, so its figures are literature (a bound, never «dentro»).
    // The adapter takes the only entry of a CAS as the material's own, whatever its name, and counts it as proven.
    if (d.where === "sustancia" && c.annex.onlyEntry && c.annex.candidates.length === 0 && !d.v3.startsWith("≤")) {
      return {
        reason: "sin-explicar",
        evidence: `${reads}. V3-35 explica que lea el anexo por CAS, pero V3-23 y V3-28 piden que, sin entrada con su nombre, las cifras entren como literatura (cota, nunca «dentro»): la v3 toma «${c.annex.own}» como propia por ser la única de su CAS y la da por conocida`,
      };
    }
    return { reason: "por-cas", evidence: reads };
  }
  const before = v2Entry(c);
  const own = c.annex.own;
  if (before.borrowed && own !== undefined) return { reason: "V3-23", evidence: `v2: el máximo de las entradas de su CAS (D14); v3: su propia entrada «${own}»` };
  if (before.borrowed && own === undefined) return { reason: "V3-28", evidence: "v2: el máximo de las entradas de su CAS, con autoridad del anexo; v3: lo mismo, como literatura" };
  if (before.name !== null && own !== undefined && fold(before.name) !== fold(own)) {
    const many = c.annex.candidates.length > 1 ? ` Hay ${c.annex.candidates.length} entradas con el nombre de un alias suyo (${c.annex.candidates.join(", ")}) y la v3 toma la primera.` : "";
    return { reason: "sin-explicar", evidence: `la v2 usó la entrada «${before.name}» y la v3 usa «${own}».${many}` };
  }
  return null;
};

const DETECTORS: readonly Detector[] = [byType, byIsolate, byVariant, byProhibitedAsSuch, byClassLink, byAnnex];

// ------------------------------------------------------------------ explaining a pair

export interface Stage {
  readonly reason: string;
  /** The v2's pair taken apart as far as this stage. */
  readonly canon: Canon;
  readonly describe: string;
}

export interface Context {
  readonly pairContext: PairContext;
  readonly v3Canon: Canon;
  /** In order: a difference is explained by the first stage after which it is gone. */
  readonly stages: readonly Stage[];
  readonly diffs: readonly Diff[];
}

const effectOf = (d: Diff): Explained["effect"] => (d.v3 === "—" ? "v3 pierde" : d.v2 === "—" ? "v3 añade" : "cambia");

export function explain(ctx: Context): Explained[] {
  // The differences still standing after each stage of taking the v2 apart.
  const standing = ctx.stages.map((s) => new Set(compare(s.canon, ctx.v3Canon).map(itemKey)));
  return ctx.diffs.map((d): Explained => {
    let hit: Hit | null = null;
    for (const [i, stage] of ctx.stages.entries()) {
      if (!standing[i].has(itemKey(d))) {
        hit = { reason: stage.reason, evidence: stage.describe };
        break;
      }
    }
    for (const detector of DETECTORS) {
      if (hit) break;
      hit = detector(d, ctx.pairContext);
    }
    return { ...d, reason: hit?.reason ?? "sin-explicar", evidence: hit?.evidence ?? "ningún motivo de V3-23 a V3-43 lo explica", effect: effectOf(d) };
  });
}

/** What a stage takes out of the pair's chain in the v2, in words (for the evidence). */
export function describeRemoved(data: Dataset, pair: Pair, authorities: readonly string[], userExtras: boolean): string {
  const chain = new Set([pair.v2Id, pair.v2Material]);
  const rows = data.composition.filter((r) => chain.has(r.containerId) && authorities.includes(r.authority));
  const docs = new Map(data.documents.map((d) => [d.id, d]));
  const byDoc = new Map<string, CompositionRow[]>();
  for (const r of rows) byDoc.set(r.documentId, [...(byDoc.get(r.documentId) ?? []), r]);
  const parts = [...byDoc]
    .sort(([a], [b]) => cmp(a, b))
    .map(([id, list]) => `${list.length} fila${list.length === 1 ? "" : "s"} (${[...new Set(list.map((r) => r.authority))].join("/")}) de ${id} «${short(docs.get(id)?.title ?? "", 60)}»`);
  if (userExtras) {
    const ceilings = data.ceilings.filter((c) => chain.has(c.productId)).length;
    const claims = data.conditions.filter((c) => chain.has(c.containerId)).length;
    if (ceilings) parts.push(`${ceilings} topes del fabricante`);
    if (claims) parts.push(`${claims} afirmaciones de especificación`);
  }
  return `en la v2, ${parts.length > 0 ? parts.join("; ") : "lo que la v3 no trae"}; sin ello la diferencia desaparece`;
}
