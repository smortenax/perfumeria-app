import { sql } from "drizzle-orm";
import { boolean, check, index, numeric, pgTable, smallint, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import {
  BATTERY_AXES, BATTERY_STATES, BIASES, BLIND_LABELS, BLOCKS, COMPLEXITY, CURVE_LEVELS, CURVE_SEGMENTS, DECAY, EFFECT_ENERGY, EFFECT_RICHNESS,
  FAMILY_CODES, FAMILY_SCHEMES, INTENSITY_MAX, INTENSITY_MIN, MOMENTS, PUFF, R1, R2, R3, ROLES, sqlList, THING_OR_PLACE, VERSATILITY,
} from "../../src/tasting/vocabulary";
import { labDilutions, materials } from "./materials";

/**
 * The tastings (V3-60 to V3-63; docs-v3/catas-diseno.md): each user's own, one attribute per column
 * (V3-41), every choice from a list as a fixed code (V3-62, src/tasting/vocabulary.ts). A tasting
 * points at a material and never writes in it. lab_evaluations stays as the legacy, read only.
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
const user = () =>
  uuid("user_id")
    .notNull()
    .default(sql`auth.uid()`)
    .references(() => authUsers.id, { onDelete: "cascade" });
const inList = (column: unknown, codes: readonly (string | number)[]) => sql`${column} is null or ${column} in ${sql.raw(sqlList(codes))}`;
const codes = (column: unknown, list: readonly string[]) => sql`${column} <@ array${sql.raw(`[${list.map((c) => `'${c}'`).join(", ")}]`)}::text[]`;

/** One sitting at the bench. */
export const tastingSessions = pgTable(
  "tasting_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: user(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    note: text("note"),
    ...timestamps,
  },
  (t) => [index("tasting_sessions_user_idx").on(t.userId)],
);

/**
 * One strip of a session, under its blind label. The fraction and the solvent are copied from the
 * dilution when the strip is made, so that editing the bottle later does not change the tasting.
 */
export const tastingStrips = pgTable(
  "tasting_strips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => tastingSessions.id, { onDelete: "cascade" }),
    userId: user(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    dilutionId: uuid("dilution_id").references(() => labDilutions.id, { onDelete: "set null" }),
    /** Pure matter on the strip, as a fraction (0.1 is 10 %); null when it is not known. */
    fraction: numeric("fraction"),
    solvent: text("solvent"),
    /** «2 gotas», as the user says it. */
    dose: text("dose"),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
    blindLabel: text("blind_label").notNull(),
    /** When the name was shown: on finishing t5 (V3-61). */
    revealedAt: timestamp("revealed_at", { withTimezone: true }),
    /** When the series was closed: only then the comparison with the sources opens. */
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("tasting_strips_user_idx").on(t.userId),
    index("tasting_strips_session_idx").on(t.sessionId),
    index("tasting_strips_material_idx").on(t.materialId),
    unique("tasting_strips_label_once").on(t.sessionId, t.blindLabel),
    check("tasting_strips_label", sql`${t.blindLabel} in ${sql.raw(sqlList(BLIND_LABELS))}`),
    check("tasting_strips_fraction", sql`${t.fraction} is null or (${t.fraction} > 0 and ${t.fraction} <= 1)`),
  ],
);

/** One tab of a strip (t0, t5, t30…): what can change with time, one column each. */
export const tastingMoments = pgTable(
  "tasting_moments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stripId: uuid("strip_id")
      .notNull()
      .references(() => tastingStrips.id, { onDelete: "cascade" }),
    userId: user(),
    moment: text("moment").notNull(),
    /** When it was smelled. */
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    /** t0: the opening; later, the description of that time. */
    text: text("text"),
    intensity: smallint("intensity"),
    texture: text("texture"),
    temperature: text("temperature"),
    shape: text("shape"),
    color: text("color"),
    brightness: text("brightness"),
    thingOrPlace: text("thing_or_place"),
    thingOrPlaceText: text("thing_or_place_text"),
    ownField: text("own_field"),
    complexity: text("complexity"),
    complexityNote: text("complexity_note"),
    puff: text("puff"),
    revisedImage: text("revised_image"),
    metaphor: text("metaphor"),
    notes: text("notes"),
    /** The two distance questions: is it noticed close up, and from where you are. */
    nearDetectable: boolean("near_detectable"),
    farDetectable: boolean("far_detectable"),
    /** The blocks marked as reviewed: untouched is «no data», reviewed and unchanged is «the same». */
    reviewed: text("reviewed").array().notNull().default(sql`'{}'::text[]`),
    ...timestamps,
  },
  (t) => [
    index("tasting_moments_user_idx").on(t.userId),
    unique("tasting_moments_once").on(t.stripId, t.moment),
    check("tasting_moments_moment", sql`${t.moment} in ${sql.raw(sqlList(MOMENTS))}`),
    check("tasting_moments_intensity", sql`${t.intensity} is null or ${t.intensity} between ${sql.raw(String(INTENSITY_MIN))} and ${sql.raw(String(INTENSITY_MAX))}`),
    check("tasting_moments_thing_or_place", inList(t.thingOrPlace, THING_OR_PLACE)),
    check("tasting_moments_complexity", inList(t.complexity, COMPLEXITY)),
    check("tasting_moments_puff", inList(t.puff, PUFF)),
    check("tasting_moments_reviewed", codes(t.reviewed, BLOCKS)),
    // t0 is the blind opening and nothing else: its text, written once (the trigger keeps it).
    check(
      "tasting_moments_t0",
      sql`${t.moment} <> 't0' or (length(trim(coalesce(${t.text}, ''))) > 0 and ${t.intensity} is null and ${t.texture} is null
        and ${t.temperature} is null and ${t.shape} is null and ${t.color} is null and ${t.brightness} is null and ${t.thingOrPlace} is null
        and ${t.thingOrPlaceText} is null and ${t.ownField} is null and ${t.complexity} is null and ${t.complexityNote} is null and ${t.puff} is null
        and ${t.revisedImage} is null and ${t.metaphor} is null and ${t.notes} is null and ${t.nearDetectable} is null and ${t.farDetectable} is null)`,
    ),
  ],
);

/** A perceived family of a tab: Calkin and Jellinek's, Ellena's or the app's (P48), several at once. */
export const tastingFamilies = pgTable(
  "tasting_families",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    momentId: uuid("moment_id")
      .notNull()
      .references(() => tastingMoments.id, { onDelete: "cascade" }),
    userId: user(),
    scheme: text("scheme").notNull(),
    code: text("code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tasting_families_user_idx").on(t.userId),
    unique("tasting_families_once").on(t.momentId, t.scheme, t.code),
    check(
      "tasting_families_code",
      sql`case ${t.scheme} ${sql.raw(FAMILY_SCHEMES.map((s) => `when '${s}' then code in ${sqlList(FAMILY_CODES[s])}`).join(" "))} else false end`,
    ),
  ],
);

/** One axis of the battery of discards in a tab, with its state. */
export const tastingBattery = pgTable(
  "tasting_battery",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    momentId: uuid("moment_id")
      .notNull()
      .references(() => tastingMoments.id, { onDelete: "cascade" }),
    userId: user(),
    axis: text("axis").notNull(),
    state: text("state").notNull(),
    ...timestamps,
  },
  (t) => [
    index("tasting_battery_user_idx").on(t.userId),
    unique("tasting_battery_once").on(t.momentId, t.axis),
    check("tasting_battery_axis", sql`${t.axis} in ${sql.raw(sqlList(BATTERY_AXES))}`),
    check("tasting_battery_state", sql`${t.state} in ${sql.raw(sqlList(BATTERY_STATES))}`),
  ],
);

/** One segment of the curve inside a breath, in a tab. */
export const tastingCurve = pgTable(
  "tasting_curve",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    momentId: uuid("moment_id")
      .notNull()
      .references(() => tastingMoments.id, { onDelete: "cascade" }),
    userId: user(),
    segment: smallint("segment").notNull(),
    level: text("level").notNull(),
    ...timestamps,
  },
  (t) => [
    index("tasting_curve_user_idx").on(t.userId),
    unique("tasting_curve_once").on(t.momentId, t.segment),
    check("tasting_curve_segment", sql`${t.segment} in ${sql.raw(sqlList(CURVE_SEGMENTS))}`),
    check("tasting_curve_level", sql`${t.level} in ${sql.raw(sqlList(CURVE_LEVELS))}`),
  ],
);

/**
 * The closing of a strip, once: what is answered when the series ends (V3-61). The tenacity is not
 * kept: it comes from the last tab still noticed close up (V3-42, V3-62).
 */
export const tastingClosures = pgTable(
  "tasting_closures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stripId: uuid("strip_id")
      .notNull()
      .references(() => tastingStrips.id, { onDelete: "cascade" }),
    userId: user(),
    role: text("role"),
    effectRichness: text("effect_richness"),
    effectEnergy: text("effect_energy"),
    versatility: text("versatility"),
    decay: text("decay"),
    r1: text("r1"),
    r2: text("r2"),
    r2Note: text("r2_note"),
    r3: text("r3"),
    r3Note: text("r3_note"),
    biases: text("biases").array().notNull().default(sql`'{}'::text[]`),
    biasNote: text("bias_note"),
    affinities: text("affinities"),
    destination: text("destination"),
    negativeDestination: text("negative_destination"),
    /** The comparison with the sources: only once the series is closed. */
    comparison: text("comparison"),
    ...timestamps,
  },
  (t) => [
    index("tasting_closures_user_idx").on(t.userId),
    unique("tasting_closures_once").on(t.stripId),
    check("tasting_closures_role", inList(t.role, ROLES)),
    check("tasting_closures_richness", inList(t.effectRichness, EFFECT_RICHNESS)),
    check("tasting_closures_energy", inList(t.effectEnergy, EFFECT_ENERGY)),
    check("tasting_closures_versatility", inList(t.versatility, VERSATILITY)),
    check("tasting_closures_decay", inList(t.decay, DECAY)),
    check("tasting_closures_r1", inList(t.r1, R1)),
    check("tasting_closures_r2", inList(t.r2, R2)),
    check("tasting_closures_r3", inList(t.r3, R3)),
    check("tasting_closures_biases", codes(t.biases, BIASES)),
  ],
);

/** A material marked in the queue, with why («pedido 2026-10-18»): it goes first (V3-63). */
export const tastingMarks = pgTable(
  "tasting_marks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: user(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tasting_marks_user_idx").on(t.userId),
    unique("tasting_marks_once").on(t.userId, t.materialId),
    check("tasting_marks_label", sql`length(trim(${t.label})) > 0`),
  ],
);
