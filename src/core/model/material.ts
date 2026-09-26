import type { Vector } from "./vector";

/**
 * The four kinds of material (decisions §2.1). Each one gets its own visual
 * signal in the interface, so an own name is never mistaken for a base one.
 *
 * - base: a known material of the reference data, keyed by its CAS;
 * - own: registered by the user, with the fields of a base one or with marked gaps;
 * - provisional: just a name, so the work never stops to define it;
 * - formula: a formula used as a material, frozen as its vector (§2.4).
 */
export type MaterialKind = "base" | "own" | "provisional" | "formula";

export interface Material {
  /**
   * Stable identity: "cas:…", "own:…", "prov:…", "vec:…" or, for the built-in
   * diluents, "solv:…". Two lines with the same key are the same substance.
   */
  readonly key: string;
  readonly kind: MaterialKind;
  readonly name: string;
  /** A carrier, not aromatic matter: DPG, alcohol… */
  readonly solvent?: boolean;
  /** Only for kind "formula": what it is made of, flat and exact. */
  readonly vector?: Vector;
}

/** The diluents offered by default in the add bar (decisions §4). */
export const DILUENTS = {
  dpg: { key: "solv:dpg", kind: "base", name: "DPG", solvent: true },
  alcohol: { key: "solv:alcohol", kind: "base", name: "Alcohol", solvent: true },
} as const satisfies Record<string, Material>;
