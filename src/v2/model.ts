/**
 * The v2 materials model (docs/v2/decisiones-v2.md). One type per CSV of datos/v2/,
 * described in datos/v2/LEEME.md. Numbers stay as the text of the file: the validator
 * reads them as exact ratios and reports what does not parse.
 */

/** Every row remembers where it came from, so an issue can point at it. */
export interface Located {
  /** Line of the CSV file, counting the header as line 1. */
  readonly line: number;
}

export type Entity = "sustancia" | "material" | "producto" | "lote" | "documento" | "grupo";

/** Id prefix of each entity: S00001, M00001… (five digits, assigned once). */
export const ID_PREFIX: Readonly<Record<Entity, string>> = {
  sustancia: "S",
  material: "M",
  producto: "P",
  lote: "L",
  documento: "D",
  grupo: "G",
};

export interface IdEntry extends Located {
  readonly id: string;
  readonly entity: string;
  /** The human key the id was given for, kept for the record. */
  readonly key: string;
  readonly added: string;
  /** "activo" or "retirado": a retired id is never reused. */
  readonly status: string;
}

export interface Substance extends Located {
  readonly id: string;
  readonly name: string;
}

/** IFRA limits by group, not by CAS: a substance carries its CAS numbers as aliases. */
export type CasRelation = "principal" | "isomero" | "mezcla" | "obsoleto";

export interface CasAlias extends Located {
  readonly substanceId: string;
  readonly cas: string;
  readonly relation: string;
}

export type GroupType = "estandar-ifra" | "alergeno-ue";

/** An IFRA standard or an EU allergen. Its limits are read from datos/ifra/51/, never copied. */
export interface Group extends Located {
  readonly id: string;
  readonly type: string;
  /** IFRA_STD_005 and the like for a standard. */
  readonly reference: string;
  readonly name: string;
}

/** A member is a substance, or a material for the standards that go by family (089, 184). */
export interface GroupMember extends Located {
  readonly groupId: string;
  readonly memberId: string;
  /** For the standards that split their CAS numbers (097, 181). */
  readonly subgroup: string;
}

export type MaterialType = "sustancia" | "natural" | "base" | "formula";

/** Rules a material may skip on purpose, with a reason. */
export type Exception = "suma" | "naturales";

export interface Material extends Located {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly substanceId: string;
  /** A natural is species + part + process + chemotype (D1); CAS and INCI are attributes. */
  readonly species: string;
  readonly part: string;
  readonly process: string;
  readonly chemotype: string;
  readonly cas: string;
  readonly inci: string;
  /** Only for a «sustancia»: sintetico, aislado-natural or desconocido (D7). */
  readonly origin: string;
  readonly exceptions: readonly string[];
  readonly exceptionReason: string;
}

export type ValueType = "tipico" | "maximo" | "rango";

/** From most to least authoritative (decisiones-v2, jerarquía de autoridad). */
export const AUTHORITIES = ["lote", "producto", "anexo-ifra", "literatura", "consenso"] as const;
export type Authority = (typeof AUTHORITIES)[number];

/**
 * One component of a material, product or lot, in % of its pure matter: a product's
 * dilution is a fact of the product and never enters its composition.
 */
export interface CompositionRow extends Located {
  readonly containerId: string;
  readonly componentId: string;
  readonly min: string;
  readonly typical: string;
  readonly max: string;
  readonly valueType: string;
  readonly authority: string;
  readonly documentId: string;
}

export type Coverage = "reguladas-completa" | "solo-alergenos" | "parcial" | "desconocida";

/** What a source's composition covers: an absent constituent only means zero if it is complete. */
export interface CoverageRow extends Located {
  readonly containerId: string;
  readonly documentId: string;
  readonly coverage: string;
}

/** The supplier lives at product level (D3). */
export interface Product extends Located {
  readonly id: string;
  readonly materialId: string;
  readonly name: string;
  readonly maker: string;
  readonly code: string;
  readonly shop: string;
  readonly url: string;
}

/** A maker's ceiling belongs to the product, not to the substance (D4). */
export interface Ceiling extends Located {
  readonly productId: string;
  readonly category: string;
  readonly maxPct: string;
  readonly documentId: string;
}

export interface Lot extends Located {
  readonly id: string;
  readonly productId: string;
  readonly lotCode: string;
  readonly date: string;
}

export type ReviewStatus = "pendiente" | "revisado";

export interface SourceDocument extends Located {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly issuer: string;
  readonly date: string;
  readonly path: string;
  /** Only reviewed sources feed the data (D6). */
  readonly reviewStatus: string;
}

/** Usual use and duration: another layer, with its own base, never mixed with IFRA. */
export interface Usage extends Located {
  readonly materialId: string;
  readonly magnitude: string;
  readonly min: string;
  readonly typical: string;
  readonly max: string;
  readonly unit: string;
  readonly base: string;
  readonly authority: string;
  readonly documentId: string;
}

/** The origin of a molecule (D7): an «aislado-natural» without documents leaves its impurities pending. */
export const ORIGINS = ["sintetico", "aislado-natural", "desconocido"] as const;

/**
 * A molecule known to carry regulated impurities (D7): without documents of its product, it is not
 * pure by convention, and leaves «impurezas sin declarar» pending. Each one with its source.
 */
export interface KnownImpurity extends Located {
  readonly substanceId: string;
  readonly documentId: string;
}

/**
 * A claim that makes a material meet an IFRA condition: that it is rectified, that its peroxides are low,
 * that its atranol and chloratranol are under the limit, that it is furocoumarin-free. The condition is
 * proven when the claim has the authority of a product or a lot with a reviewed document, assumed when
 * it only has a consensus or the literature, and pending when there is no row. The text of a process
 * describes the material; it proves nothing by itself.
 */
export interface Condition extends Located {
  readonly containerId: string;
  /** The IFRA standard whose specification the claim meets (IFRA_STD_119…). */
  readonly standard: string;
  readonly claim: string;
  readonly authority: string;
  readonly documentId: string;
}

/**
 * A specification of an IFRA standard that does not apply to the materials of some processes: the PAH
 * specification of STD 078 is of the styrax oil obtained by pyrolysis, so a styrax resinoid is outside it. It is
 * not an assumption: the standard itself says what it is about (decisiones-v2, D11).
 */
export interface Exclusion extends Located {
  readonly standard: string;
  /** Substrings of the process of a material that put it outside the specification. */
  readonly processes: readonly string[];
}

/** Link from a v1 glossary id (datos/glosario/materiales.csv) to its v2 id. */
export interface V1Link extends Located {
  readonly v2Id: string;
  readonly v1Id: string;
}

export interface Dataset {
  readonly ids: readonly IdEntry[];
  readonly substances: readonly Substance[];
  readonly casAliases: readonly CasAlias[];
  readonly groups: readonly Group[];
  readonly groupMembers: readonly GroupMember[];
  readonly materials: readonly Material[];
  readonly composition: readonly CompositionRow[];
  readonly coverages: readonly CoverageRow[];
  readonly products: readonly Product[];
  readonly ceilings: readonly Ceiling[];
  readonly lots: readonly Lot[];
  readonly documents: readonly SourceDocument[];
  readonly usages: readonly Usage[];
  readonly knownImpurities: readonly KnownImpurity[];
  readonly conditions: readonly Condition[];
  readonly exclusions: readonly Exclusion[];
  readonly v1Links: readonly V1Link[];
}

export type Severity = "error" | "aviso";

export interface Issue {
  readonly severity: Severity;
  readonly rule: string;
  readonly file: string;
  /** 0 when the issue is about a file, not a row. */
  readonly line: number;
  readonly message: string;
}
