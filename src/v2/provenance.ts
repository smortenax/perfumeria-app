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

export function provenanceOf(data: Dataset, id: string, detail?: MaterialDetail): Provenance {
  const documents = new Map<string, SourceDocument>(data.documents.map((d) => [d.id, d]));
  const docRef = (docId: string): DocRef | null => {
    const d = documents.get(docId);
    return d
      ? { id: d.id, type: d.type, title: d.title, issuer: d.issuer, date: d.date, path: d.path, reviewed: d.reviewStatus === "revisado" }
      : null;
  };
  const lot = data.lots.find((l) => l.id === id);
  const productId = lot ? lot.productId : data.products.some((p) => p.id === id) ? id : undefined;
  const product = productId ? data.products.find((p) => p.id === productId) : undefined;
  const materialId = product ? product.materialId : id;
  const containers: ReadonlyArray<readonly [string, FigureRow["from"]]> = [
    ...(lot ? ([[lot.id, "lote"]] as const) : []),
    ...(product ? ([[product.id, "producto"]] as const) : []),
    [materialId, "material"],
  ];
  const fromOf = new Map(containers);

  const names = new Map<string, string>([...data.substances.map((s) => [s.id, s.name] as const), ...data.materials.map((m) => [m.id, m.name] as const)]);
  const casOf = (component: string): string => {
    const direct = data.materials.find((m) => m.id === component)?.cas;
    if (direct) {
      return direct;
    }
    return data.casAliases.find((c) => c.substanceId === component && c.relation === "principal")?.cas ?? "";
  };
  const value = (r: { min: string; typical: string; max: string; valueType: string }): string =>
    r.valueType === "rango" ? `${r.min}–${r.max} %` : r.valueType === "maximo" ? `≤ ${r.max} %` : `${r.typical} %`;

  const figures = data.composition
    .filter((r) => fromOf.has(r.containerId))
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
  const coverages = data.coverages
    .filter((c) => fromOf.has(c.containerId))
    .map((c): CoverageInfo => ({ from: fromOf.get(c.containerId)!, coverage: c.coverage, document: docRef(c.documentId) }));
  const ceilings = data.ceilings
    .filter((c) => c.productId === productId)
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
