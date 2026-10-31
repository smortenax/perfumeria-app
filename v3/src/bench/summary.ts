import { Ratio } from "../core/arith/ratio";
import type { Part } from "../core/compose";
import type { Family } from "../db/catalog";
import { byNote } from "./notes";

/**
 * The formula in a few lines, with how far to trust them (F6, V3-89): computed from its own data, not
 * written by a model. Every share is of the aromatic matter (the diluents are no family and no note).
 * What a material does not say is counted apart and named, never given to another family or note, and
 * the confidence is how much of the aromatic matter has the data: never a figure without its base.
 */

export type Confidence = "high" | "medium" | "low";
export type Lead = "top" | "heart" | "base";

export interface FormulaSummary {
  /** The known families, the largest first: at most three. */
  readonly families: readonly { readonly family: Family; readonly share: Ratio }[];
  /** How many known families there are in all, for «and N more». */
  readonly familyCount: number;
  /** Top, heart and base, each over the aromatic matter; the rest is `noNote`. */
  readonly notes: { readonly top: Ratio; readonly heart: Ratio; readonly base: Ratio };
  /** The note that weighs most, when one does more than the others and its data covers half or more. */
  readonly lead: Lead | null;
  /** Share of the aromatic matter whose family, and whose note, is known. */
  readonly coverage: { readonly family: Ratio; readonly note: Ratio };
  /** The materials that lack one or both, the heaviest first. */
  readonly missing: readonly { readonly key: string; readonly name: string; readonly share: Ratio; readonly lacks: readonly ("family" | "note")[] }[];
  readonly confidence: Confidence;
}

/** Proposal of the session (V3-89): high from 90 % of the aromatic matter with both data, medium from 60 %. */
export const HIGH = Ratio.of(9, 10);
export const MEDIUM = Ratio.of(6, 10);
const HALF = Ratio.of(1, 2);

export function confidenceOf(coverage: Ratio): Confidence {
  return coverage.cmp(HIGH) >= 0 ? "high" : coverage.cmp(MEDIUM) >= 0 ? "medium" : "low";
}

/** null when there is nothing aromatic in the formula: then there is nothing to sum up. */
export function formulaSummary(parts: readonly Part[], familyOf: (key: string) => Family | null, tierOf: (key: string) => string | null | undefined): FormulaSummary | null {
  const aromatic = parts.filter((p) => !p.material.solvent);
  const total = Ratio.sum(aromatic.map((p) => p.massUg));
  if (total.isZero()) return null;

  const byFamily = new Map<Family, Ratio>();
  let familyKnown = Ratio.ZERO;
  for (const p of aromatic) {
    const family = familyOf(p.material.key);
    if (!family) continue;
    byFamily.set(family, (byFamily.get(family) ?? Ratio.ZERO).add(p.massUg));
    familyKnown = familyKnown.add(p.massUg);
  }
  const families = [...byFamily.entries()]
    .map(([family, mass]) => ({ family, share: mass.div(total) }))
    .sort((a, b) => b.share.cmp(a.share) || a.family.localeCompare(b.family));

  const groups = byNote(aromatic, tierOf, total);
  const shareOf = (note: string) => groups.find((g) => g.note === note)?.share ?? Ratio.ZERO;
  const notes = { top: shareOf("top"), heart: shareOf("heart"), base: shareOf("base") };
  const noteKnown = notes.top.add(notes.heart).add(notes.base);
  const unknownNote = new Set(groups.find((g) => g.note === "unknown")?.parts.map((p) => p.material.key) ?? []);

  // One note leads only when it weighs more than each of the others, and the notes are known for at
  // least half the matter: a lead read on a quarter of the formula would say more than the data does.
  const ranked = (["top", "heart", "base"] as const).map((n) => [n, notes[n]] as const).sort((a, b) => b[1].cmp(a[1]));
  const lead = noteKnown.cmp(HALF) >= 0 && ranked[0][1].cmp(ranked[1][1]) > 0 ? ranked[0][0] : null;

  // One line per material: the same one poured twice is counted once.
  const missingBy = new Map<string, { key: string; name: string; mass: Ratio; lacks: ("family" | "note")[] }>();
  for (const p of aromatic) {
    const lacks: ("family" | "note")[] = [];
    if (!familyOf(p.material.key)) lacks.push("family");
    if (unknownNote.has(p.material.key)) lacks.push("note");
    if (lacks.length === 0) continue;
    const was = missingBy.get(p.material.key);
    missingBy.set(p.material.key, { key: p.material.key, name: p.material.name, mass: (was?.mass ?? Ratio.ZERO).add(p.massUg), lacks });
  }
  const missing = [...missingBy.values()]
    .map((m) => ({ key: m.key, name: m.name, share: m.mass.div(total), lacks: m.lacks }))
    .sort((a, b) => b.share.cmp(a.share) || a.name.localeCompare(b.name, "es"));

  const coverage = { family: familyKnown.div(total), note: noteKnown };
  const weaker = coverage.family.cmp(coverage.note) <= 0 ? coverage.family : coverage.note;
  return { families: families.slice(0, 3), familyCount: families.length, notes, lead, coverage, missing, confidence: confidenceOf(weaker) };
}
