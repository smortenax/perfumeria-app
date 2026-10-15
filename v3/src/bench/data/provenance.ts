/**
 * The types of the v2's provenance and IFRA details the workbench reads (ported from the v2,
 * V3-52): only the types. The v3 does not fill them yet; every field that uses them is optional.
 */

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

export type ConditionState =
  | { readonly kind: "probada"; readonly authority: string; readonly documentId: string; readonly claim: string }
  | { readonly kind: "supuesta"; readonly authority: string; readonly documentId: string; readonly claim: string }
  | { readonly kind: "pendiente" };

export interface ConditionDetail {
  readonly standard: string;
  readonly text: string;
  /** «nota» is a fact of the standard (a variant is prohibited) that the material neither proves nor assumes. */
  readonly state: "probada" | "supuesta" | "pendiente" | "nota";
  readonly authority?: string;
  readonly documentId?: string;
  readonly claim?: string;
}

export interface MaterialDetail {
  readonly conditions: readonly ConditionDetail[];
  /** The pending entries (the texts of `IfraMaterial.pending`) that are specifications to prove, not quantities unknown. */
  readonly specPending: readonly string[];
}
