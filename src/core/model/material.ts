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
  /**
   * The CAS of a base material, when it has one. It travels in the formula file, so a
   * later glossary can find the material again if its key changes (P44).
   */
  readonly cas?: string;
  /** A carrier, not aromatic matter: DPG, alcohol… */
  readonly solvent?: boolean;
  /** Only for kind "formula": what it is made of, flat and exact. */
  readonly vector?: Vector;
}

/**
 * A provisional material is known by its name (P44): the same name in any formula is
 * the same material, whatever its capitals, accents or spaces.
 */
export function provisionalKey(name: string): string {
  const folded = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return `prov:${folded}`;
}

/**
 * The diluents of the app (decisions §4): DPG and alcohol are the two offered
 * by default; the rest come from the menu of other diluents. A diluent is
 * checked against IFRA like any material when it has a standard (benzyl
 * benzoate does).
 */
export const DILUENTS = {
  dpg: { key: "solv:dpg", kind: "base", name: "DPG", solvent: true },
  alcohol: { key: "solv:alcohol", kind: "base", name: "Alcohol", solvent: true },
  ipm: { key: "solv:ipm", kind: "base", name: "IPM", solvent: true },
  dep: { key: "solv:dep", kind: "base", name: "DEP", solvent: true },
  tec: { key: "solv:tec", kind: "base", name: "TEC", solvent: true },
  triacetina: { key: "solv:triacetina", kind: "base", name: "Triacetina", solvent: true },
  bb: { key: "solv:bb", kind: "base", name: "Benzoato de bencilo", solvent: true },
} as const satisfies Record<string, Material>;
