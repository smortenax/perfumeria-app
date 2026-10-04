import type { Dataset, SourceDocument } from "./model";
import type { MaterialDetail } from "./to-ifra";

/**
 * Where each figure of a material comes from (Phase 5): its authority and its document, cited. What the card of a
 * v2 material shows under «De dónde sale». Pure, from the data of the v2: nothing here is calculated, only read.
 */
export interface DocRef {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly issuer: string;
  readonly date: string;
  readonly path: string;
  readonly reviewed: boolean;
}

export interface FigureRow {
  /** The container that says it: the lot, the product (the bottle as it is bought) or the material. */
  readonly from: "lote" | "producto" | "material";
  readonly component: string;
  readonly cas: string;
  /** «0,0045 %», «≤ 10 %» or «1–3 %», in the base of `base`. */
  readonly value: string;
  /** What the figure is a share of: the product as it is bought (D12), or the pure matter of the material. */
  readonly base: "producto" | "materia pura";
  readonly valueType: string;
  readonly authority: string;
  /** Literature or consensus: an estimate of another source, never proof; it counts its maximum (D2). */
  readonly placeholder: boolean;
  readonly document: DocRef | null;
}

export interface CoverageInfo {
  readonly from: "lote" | "producto" | "material";
  readonly coverage: string;
  readonly document: DocRef | null;
}

/** A manufacturer's ceiling: of the product, and its manufacturer's, not IFRA's (D4). */
export interface CeilingInfo {
  readonly category: string;
  readonly maxPct: string;
  readonly maker: string;
  readonly document: DocRef | null;
}

export interface ConditionInfo {
  readonly standard: string;
  readonly text: string;
  readonly state: "probada" | "supuesta" | "pendiente" | "nota";
  readonly authority: string;
  readonly claim: string;
  readonly document: DocRef | null;
}

export interface Provenance {
  readonly figures: readonly FigureRow[];
  readonly coverages: readonly CoverageInfo[];
  readonly ceilings: readonly CeilingInfo[];
  readonly conditions: readonly ConditionInfo[];
}

const PLACEHOLDERS: ReadonlySet<string> = new Set(["literatura", "consenso"]);

/** What `provenanceOf` looks up for every material, indexed once per dataset (it never changes), not rebuilt for each of thousands of calls. */
interface Lookups {
  readonly documents: ReadonlyMap<string, SourceDocument>;
  readonly names: ReadonlyMap<string, string>;
  readonly casOfMaterial: ReadonlyMap<string, string>;
  readonly casOfSubstance: ReadonlyMap<string, string>;
  readonly lots: ReadonlyMap<string, Dataset["lots"][number]>;
  readonly products: ReadonlyMap<string, Dataset["products"][number]>;
  readonly compositionBy: ReadonlyMap<string, readonly Dataset["composition"][number][]>;
  readonly coveragesBy: ReadonlyMap<string, readonly Dataset["coverages"][number][]>;
  readonly ceilingsBy: ReadonlyMap<string, readonly Dataset["ceilings"][number][]>;
}
const LOOKUPS = new WeakMap<Dataset, Lookups>();

function group<T>(rows: readonly T[], keyOf: (row: T) => string): Map<string, T[]> {
  const by = new Map<string, T[]>();
  for (const row of rows) {
    by.set(keyOf(row), [...(by.get(keyOf(row)) ?? []), row]);
  }
  return by;
}

function lookupsOf(data: Dataset): Lookups {
  let l = LOOKUPS.get(data);
  if (!l) {
    const casOfSubstance = new Map<string, string>();
    for (const c of data.casAliases) {
      if (c.relation === "principal" && !casOfSubstance.has(c.substanceId)) {
        casOfSubstance.set(c.substanceId, c.cas);
      }
    }
    l = {
      documents: new Map(data.documents.map((d) => [d.id, d])),
      names: new Map<string, string>([...data.substances.map((s) => [s.id, s.name] as const), ...data.materials.map((m) => [m.id, m.name] as const)]),
      casOfMaterial: new Map(data.materials.map((m) => [m.id, m.cas])),
      casOfSubstance,
      lots: new Map(data.lots.map((x) => [x.id, x])),
      products: new Map(data.products.map((x) => [x.id, x])),
      compositionBy: group(data.composition, (r) => r.containerId),
      coveragesBy: group(data.coverages, (c) => c.containerId),
      ceilingsBy: group(data.ceilings, (c) => c.productId),
    };
    LOOKUPS.set(data, l);
  }
  return l;
}

/** The rows of some containers, in the order of the file (their lines), as a filter over all the rows gave them. */
function inFileOrder<T extends { readonly line: number }>(by: ReadonlyMap<string, readonly T[]>, containers: Iterable<string>): T[] {
  return [...containers].flatMap((c) => by.get(c) ?? []).sort((a, b) => a.line - b.line);
}

export function provenanceOf(data: Dataset, id: string, detail?: MaterialDetail): Provenance {
  const { documents, names, casOfMaterial, casOfSubstance, lots, products, compositionBy, coveragesBy, ceilingsBy } = lookupsOf(data);
  const docRef = (docId: string): DocRef | null => {
    const d = documents.get(docId);
    return d
      ? { id: d.id, type: d.type, title: d.title, issuer: d.issuer, date: d.date, path: d.path, reviewed: d.reviewStatus === "revisado" }
      : null;
  };
  const lot = lots.get(id);
  const productId = lot ? lot.productId : products.has(id) ? id : undefined;
  const product = productId ? products.get(productId) : undefined;
  const materialId = product ? product.materialId : id;
  const containers: ReadonlyArray<readonly [string, FigureRow["from"]]> = [
    ...(lot ? ([[lot.id, "lote"]] as const) : []),
    ...(product ? ([[product.id, "producto"]] as const) : []),
    [materialId, "material"],
  ];
  const fromOf = new Map(containers);

  const casOf = (component: string): string => casOfMaterial.get(component) || casOfSubstance.get(component) || "";
  const value = (r: { min: string; typical: string; max: string; valueType: string }): string =>
    r.valueType === "rango" ? `${r.min}–${r.max} %` : r.valueType === "maximo" ? `≤ ${r.max} %` : `${r.typical} %`;

  const figures = inFileOrder(compositionBy, fromOf.keys())
    .map(
      (r): FigureRow => ({
        from: fromOf.get(r.containerId)!,
        component: names.get(r.componentId) ?? r.componentId,
        cas: casOf(r.componentId),
        value: value(r),
        base: fromOf.get(r.containerId) === "material" ? "materia pura" : "producto",
        valueType: r.valueType,
        authority: r.authority,
        placeholder: PLACEHOLDERS.has(r.authority),
        document: docRef(r.documentId),
      }),
    );
  const coverages = inFileOrder(coveragesBy, fromOf.keys())
    .map((c): CoverageInfo => ({ from: fromOf.get(c.containerId)!, coverage: c.coverage, document: docRef(c.documentId) }));
  const ceilings = (productId ? (ceilingsBy.get(productId) ?? []) : [])
    .map((c): CeilingInfo => ({ category: c.category, maxPct: c.maxPct, maker: product?.maker ?? "", document: docRef(c.documentId) }));
  const conditions = (detail?.conditions ?? []).map(
    (c): ConditionInfo => ({
      standard: c.standard,
      text: c.text,
      state: c.state,
      authority: c.authority ?? "",
      claim: c.claim ?? "",
      document: c.documentId ? docRef(c.documentId) : null,
    }),
  );
  return { figures, coverages, ceilings, conditions };
}
