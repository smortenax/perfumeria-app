import { Ratio } from "../core/arith/ratio";
import type { Part } from "../core/compose";

/**
 * The composition by notes (F3, V3-78): top, heart and base, each with its subtotal over the base the
 * list is read in. A material's note comes from its tier (V3-41); the two in-between tiers read as
 * heart, as the orb does. What has no tier goes in its own group, never shared out among the others.
 */

export const NOTES = ["top", "heart", "base", "unknown", "diluents"] as const;
export type NoteGroup = (typeof NOTES)[number];

export interface Group {
  readonly note: NoteGroup;
  readonly parts: readonly Part[];
  /** Its mass, and its share of the base (null when the base is zero). */
  readonly massUg: Ratio;
  readonly share: Ratio | null;
}

const NOTE_OF_TIER: Readonly<Record<string, NoteGroup>> = { top: "top", top_heart: "heart", heart: "heart", heart_base: "heart", base: "base" };

export function byNote(parts: readonly Part[], tierOf: (key: string) => string | null | undefined, baseUg: Ratio): Group[] {
  return NOTES.map((note) => {
    // In the bottle the diluents are lines too: they go apart, they are no note.
    const mine = parts.filter((p) => (p.material.solvent ? "diluents" : (NOTE_OF_TIER[tierOf(p.material.key) ?? ""] ?? "unknown")) === note);
    const massUg = Ratio.sum(mine.map((p) => p.massUg));
    return { note, parts: mine, massUg, share: baseUg.isZero() ? null : massUg.div(baseUg) };
  }).filter((g) => g.parts.length > 0);
}
