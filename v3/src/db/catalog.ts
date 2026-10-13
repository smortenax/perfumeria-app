import type { Ratio } from "../core/arith/ratio";

/**
 * The materials as the app works with them (plan v3, step 3.2): what the copy holds, with every
 * figure exact (Ratio) and every unknown left unknown. The search works over it in memory, and
 * the adapter (step 3.3) turns it into what the engine reads.
 */

export type MaterialKind = "molecule" | "natural" | "composition" | "provisional" | "frozen";
export type Authority = "lot" | "product" | "ifra" | "literature" | "consensus";
export type Family = "citrus" | "green" | "ozonic" | "floral" | "fruity" | "spicy" | "woody" | "animal" | "transformed";
export type Tier = "top" | "top_heart" | "heart" | "heart_base" | "base";
export type Strength = "low" | "medium" | "high" | "very_high";
export type Confidence = "high" | "medium" | "low";
export type DoseBasis = "concentrate" | "finished_product" | "undeclared";

export const MATERIAL_KINDS: readonly MaterialKind[] = ["molecule", "natural", "composition", "provisional", "frozen"];
export const AUTHORITIES: readonly Authority[] = ["lot", "product", "ifra", "literature", "consensus"];
export const FAMILIES: readonly Family[] = ["citrus", "green", "ozonic", "floral", "fruity", "spicy", "woody", "animal", "transformed"];
export const TIERS: readonly Tier[] = ["top", "top_heart", "heart", "heart_base", "base"];
export const STRENGTHS: readonly Strength[] = ["low", "medium", "high", "very_high"];
export const CONFIDENCES: readonly Confidence[] = ["high", "medium", "low"];
export const DOSE_BASES: readonly DoseBasis[] = ["concentrate", "finished_product", "undeclared"];

/** How much of a component (plan §22): a figure, at most, between two, or present but unknown. */
export type Amount =
  | { readonly kind: "exact"; readonly value: Ratio }
  | { readonly kind: "max"; readonly value: Ratio }
  | { readonly kind: "range"; readonly min: Ratio; readonly max: Ratio }
  | { readonly kind: "unknown" };

export interface Component {
  readonly id: string;
  readonly componentId: string;
  readonly amount: Amount;
  readonly authority: Authority;
  readonly source: string;
}

export type RegulationKind = "max" | "prohibited" | "requirement";

export interface Regulation {
  readonly id: string;
  readonly regime: "ifra" | "manufacturer";
  /** IFRA's category of use ("4"); null for every category. */
  readonly category: string | null;
  readonly kind: RegulationKind;
  /** Fraction of the finished product; only for kind "max". */
  readonly maxValue: Ratio | null;
  readonly groupKey: string | null;
  readonly requirement: string | null;
  readonly authority: Authority;
  readonly source: string;
}

export interface Dose {
  readonly id: string;
  readonly min: Ratio | null;
  readonly typical: Ratio | null;
  readonly max: Ratio | null;
  readonly basis: DoseBasis;
  readonly authority: Authority;
  readonly source: string;
  readonly disputed: boolean;
  readonly notes: string | null;
}

/** The fields a material carries besides its identity and its tables (all of them may be unknown). */
export interface MaterialFields {
  readonly solvent: boolean;
  readonly aliases: readonly string[];
  readonly cas: string | null;
  readonly otherCas: readonly string[];
  readonly species: string | null;
  readonly part: string | null;
  readonly process: string | null;
  readonly chemotype: string | null;
  readonly inci: string | null;
  readonly origin: string | null;
  readonly categoryId: string | null;
  readonly form: string | null;
  readonly basedOnId: string | null;
  readonly grade: string | null;
  readonly supplier: string | null;
  readonly purity: Ratio | null;
  readonly house: string | null;
  readonly code: string | null;
  readonly odorTarget: string | null;
  readonly synthesis: "synthetic" | "natural" | "semisynthetic" | null;
  readonly isomers: string | null;
  readonly family: Family | null;
  readonly familyDetail: string | null;
  readonly facets: string | null;
  readonly tier: Tier | null;
  readonly evolution: string | null;
  readonly tenacity: string | null;
  readonly strength: Strength | null;
  readonly threshold: string | null;
  readonly diffusion: string | null;
  readonly blendEffect: string | null;
  readonly role: string | null;
  readonly recommendedDilution: string | null;
  readonly sources: string | null;
  readonly confidence: Confidence | null;
  readonly disputedFields: readonly string[];
}

export interface CatalogMaterial extends MaterialFields {
  readonly id: string;
  /** Null: common. Otherwise, the user's own. */
  readonly ownerId: string | null;
  readonly name: string;
  readonly kind: MaterialKind;
  readonly components: readonly Component[];
  readonly regulations: readonly Regulation[];
  readonly doses: readonly Dose[];
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly aliases: readonly string[];
}

export interface Catalog {
  readonly materials: ReadonlyMap<string, CatalogMaterial>;
  readonly categories: ReadonlyMap<string, Category>;
  /** «Lo que tengo» (V3-3): the ids of the materials the user has marked. */
  readonly have: ReadonlySet<string>;
  /** Which data the common rows were loaded from (V3-26); null while none has been loaded. */
  readonly dataCommit: string | null;
}

/** The fields of a new material, before it has an id: identity, and any of the rest. */
export interface NewMaterial extends Partial<MaterialFields> {
  readonly name: string;
  readonly kind: MaterialKind;
}

/** What a user may change of their own material: anything but its id, owner and kind. */
export type MaterialChanges = Partial<MaterialFields> & { readonly name?: string };
