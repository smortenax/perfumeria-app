import type { Ratio } from "../core/arith/ratio";

/**
 * The materials as the app works with them (plan v3, step 3.2): what the copy holds, with every
 * figure exact (Ratio) and every unknown left unknown. The search works over it in memory, and
 * the adapter (step 3.3) turns it into what the engine reads.
 */

export type MaterialKind = "molecule" | "natural" | "composition" | "provisional" | "frozen";
export type Authority = "lot" | "product" | "ifra" | "literature" | "consensus";
export type Family = "citrus" | "green" | "ozonic" | "floral" | "fruity" | "spicy" | "woody" | "animal" | "transformed" | "gourmand";
export type Tier = "top" | "top_heart" | "heart" | "heart_base" | "base";
export type Strength = "low" | "medium" | "high" | "very_high";
export type Confidence = "high" | "medium" | "low";
export type DoseBasis = "concentrate" | "finished_product" | "undeclared";

export const MATERIAL_KINDS: readonly MaterialKind[] = ["molecule", "natural", "composition", "provisional", "frozen"];
export const AUTHORITIES: readonly Authority[] = ["lot", "product", "ifra", "literature", "consensus"];
export const FAMILIES: readonly Family[] = ["citrus", "green", "ozonic", "floral", "fruity", "spicy", "woody", "animal", "transformed", "gourmand"];
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
  /** A material of the glossary; or null, and the component is a substance known by its CAS and name (V3-35, V3-36). */
  readonly componentId: string | null;
  readonly componentCas: string | null;
  readonly componentName: string | null;
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

/** An intensity of the evolution, 0 to 3; null when it is not known. */
export type Evolution = 0 | 1 | 2 | 3 | null;

/** What a material is physically (V3-36): every field may be unknown; the numbers, exact. */
export interface Physical {
  readonly state: string | null;
  /** What it looks like («incoloro a amarillo pálido»): not the display colour. */
  readonly appearance: string | null;
  readonly stains: string | null;
  readonly solubility: string | null;
  /** g/ml at 20–25 °C. */
  readonly density: Ratio | null;
  readonly meltingPointC: Ratio | null;
  readonly formula: string | null;
  readonly molecularWeight: Ratio | null;
  /** With its unit and temperature, as the source gives it. */
  readonly vaporPressure: string | null;
  readonly stability: string | null;
  readonly incompatibilities: string | null;
  readonly sources: string | null;
}

export const NO_EVOLUTION: readonly [Evolution, Evolution, Evolution, Evolution, Evolution] = [null, null, null, null, null];
export const NO_PHYSICAL: Physical = {
  state: null, appearance: null, stains: null, solubility: null, density: null, meltingPointC: null, formula: null,
  molecularWeight: null, vaporPressure: null, stability: null, incompatibilities: null, sources: null,
};

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
  /** Where it comes from: a country or region. */
  readonly origin: string | null;
  /** The glossary's short name (V3-37), the user's or generated (provisional). */
  readonly abbreviation: string | null;
  readonly abbreviationOrigin: "user" | "generated" | null;
  readonly categoryId: string | null;
  readonly form: string | null;
  readonly basedOnId: string | null;
  readonly grade: string | null;
  readonly supplier: string | null;
  /** A version's bottle (V3-36): the product as the shop names it, and its page. */
  readonly product: string | null;
  readonly productUrl: string | null;
  readonly purity: Ratio | null;
  readonly house: string | null;
  readonly code: string | null;
  readonly odorTarget: string | null;
  readonly synthesis: "synthetic" | "natural" | "semisynthetic" | null;
  readonly isomers: string | null;
  readonly family: Family | null;
  /** Fixed by somebody (V3-38), «#rrggbb»; null, its family's colour in the palette. */
  readonly color: string | null;
  readonly familyDetail: string | null;
  readonly facets: string | null;
  readonly tier: Tier | null;
  /** Hours on a blotter, pure material, TGSC's scale (V3-42): a guide, never a measure. */
  readonly tenacityHours: Ratio | null;
  readonly tenacitySource: string | null;
  /** Intensity 0–3 in five stretches (V3-42): to 15 min, to 2 h, to 8 h, to 24 h, beyond. */
  readonly evolution: readonly [Evolution, Evolution, Evolution, Evolution, Evolution];
  readonly strength: Strength | null;
  readonly threshold: string | null;
  readonly diffusion: string | null;
  readonly blendEffect: string | null;
  readonly role: string | null;
  readonly recommendedDilution: string | null;
  readonly cost: string | null;
  readonly handling: string | null;
  /** The physical block (V3-36, V3-41). */
  readonly physical: Physical;
  readonly notes: string | null;
  readonly sources: string | null;
  readonly confidence: Confidence | null;
  readonly disputedFields: readonly string[];
  /** The lab's second-hand IFRA, as text without figures (V3-32): shown apart, never calculated. */
  readonly ifraUnverified: string | null;
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
  /** How each source describes its smell (V3-36). */
  readonly descriptors: readonly Descriptor[];
  readonly relations: readonly Relation[];
  /** Perfumes where it is known to be used. */
  readonly references: readonly Reference[];
  /** A frozen formula (V3-49): its composition is its formula's, up to the event it was frozen at. */
  readonly source?: { readonly formulaId: string; readonly eventId: string };
}

export interface Descriptor {
  readonly id: string;
  readonly source: string;
  readonly text: string;
}

export type RelationKind = "combines" | "substitute" | "clashes";
export const RELATION_KINDS: readonly RelationKind[] = ["combines", "substitute", "clashes"];

/** Another material it goes with, stands in for or clashes with: in the glossary (otherId) or only by name. */
export interface Relation {
  readonly id: string;
  readonly kind: RelationKind;
  readonly otherId: string | null;
  readonly otherText: string | null;
  readonly note: string | null;
  readonly sources: string | null;
}

export interface Reference {
  readonly id: string;
  readonly perfume: string;
  readonly house: string | null;
  readonly note: string | null;
  readonly sources: string | null;
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly aliases: readonly string[];
}

/** A dilution the user made (V3-36): the pure matter as a fraction of the bottle, exact. */
export interface Dilution {
  readonly id: string;
  /** The pure matter, the exact figure (V3-67): 0.0997 for a bottle «al 10 %». */
  readonly fraction: Ratio;
  /** In words, as before V3-67 («DPG»); a bottle made in the app has its diluents instead. */
  readonly solvent: string | null;
  readonly madeOn: string | null;
  readonly description: string | null;
  /** Its rough name («al 10 %»). */
  readonly label: string | null;
  /** The material weighed in (or of the source bottle), in micrograms; null for the older bottles. */
  readonly materialMassUg: bigint | null;
  readonly sourceDilutionId: string | null;
  readonly archivedAt: string | null;
  /** Its diluents, in order, each with its share of the bottle (V3-67: as many as it takes). */
  readonly diluents: readonly DilutionDiluent[];
}

export interface DilutionDiluent {
  readonly id: string;
  readonly diluentId: string;
  readonly massUg: bigint | null;
  readonly fraction: Ratio;
}

/** The user's tasting of a material (V3-36). */
export interface Evaluation {
  readonly id: string;
  readonly status: string | null;
  readonly smellingTip: string | null;
  readonly reading: string | null;
  readonly sheet: string | null;
}

export interface Catalog {
  readonly materials: ReadonlyMap<string, CatalogMaterial>;
  readonly categories: ReadonlyMap<string, Category>;
  /** «Lo que tengo» (V3-3): the ids of the materials the user has marked. */
  readonly have: ReadonlySet<string>;
  /** The user's lab (V3-36), by material: the dilutions they made, their tasting and their axes. */
  readonly dilutions: ReadonlyMap<string, readonly Dilution[]>;
  readonly evaluations: ReadonlyMap<string, Evaluation>;
  readonly axes: ReadonlyMap<string, readonly string[]>;
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
