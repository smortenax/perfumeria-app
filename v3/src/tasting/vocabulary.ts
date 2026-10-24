/**
 * The tasting's fixed vocabularies (V3-62): every choice from a list is kept as one of these codes,
 * checked by the database (db/schema/tastings.ts builds its CHECKs from here). What you read on
 * screen is apart, in src/i18n/en.ts, so renaming an option never breaks a tasting already made.
 * The lists are the lab's evaluation grid v2 (rejilla de evaluación, 2026-08-04) and P48.
 */

/** The tabs of a strip, in order (V3-61): t0 is the blind opening, written once. */
export const MOMENTS = ["t0", "t5", "t15", "t30", "t60", "h24", "days"] as const;
export type Moment = (typeof MOMENTS)[number];

/** When each tab is due, in minutes after the strip was dipped: its timer and its notice. */
export const MOMENT_MINUTES: Readonly<Record<Moment, number>> = { t0: 0, t5: 5, t15: 15, t30: 30, t60: 60, h24: 1440, days: 4320 };

/** The tabs shown by default; t15 only when the material moves fast (the grid). */
export const DEFAULT_MOMENTS: readonly Moment[] = ["t0", "t5", "t30", "t60", "h24", "days"];

/** A session holds up to four strips (the lab's tasting plan), each under its blind label. */
export const BLIND_LABELS = ["A", "B", "C", "D"] as const;
export type BlindLabel = (typeof BLIND_LABELS)[number];

/**
 * The blocks of a tab that can be marked as reviewed (V3-61, the log's rule): a block untouched is
 * «no data»; reviewed and unchanged, «the same».
 */
export const BLOCKS = ["description", "thing_or_place", "intensity", "curve", "synesthetic", "families", "battery", "form"] as const;
export type Block = (typeof BLOCKS)[number];

/** A1 · the 24 families of Calkin and Jellinek. */
export const CALKIN_FAMILIES = [
  "aldehydic", "amber", "animal", "anisic", "aromatic_herbal", "balsamic", "camphoraceous", "cinnamic", "citrus", "floral", "fresh", "fruity",
  "green", "herbal", "iris", "lavender", "leather", "linalool", "minty", "mossy", "musky", "spicy", "sweet", "melon_cucumber",
] as const;

/** A2 · Ellena's nine groups. */
export const ELLENA_GROUPS = ["flowers", "fruits", "woods", "herbs", "spices", "sweets", "animals", "marine", "minerals"] as const;

/** The app's ten families (P48, and Gourmand by V3-76), the same codes as materials.family. */
export const APP_FAMILIES = ["citrus", "green", "ozonic", "floral", "fruity", "spicy", "woody", "animal", "transformed", "gourmand"] as const;

/** Which list a perceived family comes from. */
export const FAMILY_SCHEMES = ["calkin", "ellena", "app"] as const;
export type FamilyScheme = (typeof FAMILY_SCHEMES)[number];
export const FAMILY_CODES: Readonly<Record<FamilyScheme, readonly string[]>> = { calkin: CALKIN_FAMILIES, ellena: ELLENA_GROUPS, app: APP_FAMILIES };

/** F · the battery of discards: eight axes, four states. */
export const BATTERY_AXES = ["metallic", "soapy", "green", "floral", "sweet", "smoky", "animalic", "resinous"] as const;
export type BatteryAxis = (typeof BATTERY_AXES)[number];
/** sí · — (looked for, not there) · ? (something, without a name) · n/r (not evaluated). */
export const BATTERY_STATES = ["yes", "no", "unsure", "nr"] as const;
export type BatteryState = (typeof BATTERY_STATES)[number];

/** B1 · the curve inside one breath: four segments, each low, middle or high. */
export const CURVE_SEGMENTS = [1, 2, 3, 4] as const;
export const CURVE_LEVELS = ["low", "mid", "high"] as const;
export type CurveLevel = (typeof CURVE_LEVELS)[number];

/** Close-up intensity (B2 and D1 together, V3-61): 1 imperceptible … 5 overwhelming. */
export const INTENSITY_MIN = 1;
export const INTENSITY_MAX = 5;

/** A3 · is it a thing, or the air of a place. */
export const THING_OR_PLACE = ["thing", "place", "both", "unsure"] as const;
/** B3 · complexity, answered after the curve. */
export const COMPLEXITY = ["simple", "compound", "complex"] as const;
/** B4 · the puff test. */
export const PUFF = ["b1", "b2", "b3"] as const;

// What is answered once, when the strip is closed (V3-61).

/** G1 · protagonist or companion. */
export const ROLES = ["thesis", "holds", "projects"] as const;
/** G2 · Jellinek's effect: at most one pole of each axis. */
export const EFFECT_RICHNESS = ["rich", "fresh"] as const;
export const EFFECT_ENERGY = ["gentle", "active"] as const;
/** G3 · Aftel's versatility. */
export const VERSATILITY = ["difficult", "congenial", "turgid", "tenacious"] as const;
/** E · how it fades. */
export const DECAY = ["fades", "truncates", "simplifies"] as const;
/** R1 · would I get the family blind. */
export const R1 = ["no_idea", "two_or_three", "sure"] as const;
/** R2 · would I know the material blind, among its neighbours. */
export const R2 = ["no", "confuses", "sure", "confirmed"] as const;
/** R3 · do I know how it behaves in a mix. */
export const R3 = ["never_used", "used_in_accord"] as const;
/** The reading's reliability: the biases the grid names. */
export const BIASES = ["priming", "fatigue", "solvent", "informed"] as const;

/** A SQL list of codes, for a CHECK: ('a', 'b'). Codes are fixed words, never input. */
export const sqlList = (codes: readonly (string | number)[]) => `(${codes.map((c) => (typeof c === "number" ? String(c) : `'${c}'`)).join(", ")})`;
