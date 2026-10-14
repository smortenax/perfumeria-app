import { sql } from "drizzle-orm";
import { type AnyPgColumn, bigint, check, index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { materials } from "./materials";

/**
 * The formulas' tables (plan v3, phase 7; plan §34, V3-10, V3-19, V3-20). Each user's own: no
 * common rows. A formula is its header and its history; the composition is not stored, it is
 * derived from the history by the engine (plan §42, decisions §3.4).
 *
 * Masses are integers of micrograms (bigint), fractions `numeric`: never a float (plan §38).
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
const owner = () =>
  uuid("owner_id")
    .notNull()
    .default(sql`auth.uid()`)
    .references(() => authUsers.id, { onDelete: "cascade" });

/** A workbench (V3-10): a compartment of yours for one perfume or idea; what is made in it stays in it. */
export const workbenches = pgTable(
  "workbenches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: owner(),
    name: text("name").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("workbenches_owner_idx").on(t.ownerId), check("workbenches_name", sql`length(trim(${t.name})) > 0`)],
);

/** The markers that take a formula out to a general folder (V3-19, V3-20): a closed list. */
export const FORMULA_MARKERS = ["accord", "finished"] as const;

export const formulas = pgTable(
  "formulas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: owner(),
    /** Every formula lives in one workbench (V3-19); a new version is born in its mother's. */
    workbenchId: uuid("workbench_id")
      .notNull()
      .references(() => workbenches.id, { onDelete: "restrict" }),
    /** The version it comes from (P44); null when the mother is deleted. */
    parentId: uuid("parent_id").references((): AnyPgColumn => formulas.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    /** What it is for, in free text (P23). */
    intention: text("intention").notNull().default(""),
    /** The container: its capacity, and its tare once weighed (unknown until then, §1.2). */
    containerCapacityMl: numeric("container_capacity_ml"),
    containerTareUg: bigint("container_tare_ug", { mode: "bigint" }),
    /** The work batch, and the final one with the alcohol, on which IFRA is measured. */
    workBatchUg: bigint("work_batch_ug", { mode: "bigint" }),
    finalBatchUg: bigint("final_batch_ug", { mode: "bigint" }),
    markers: text("markers").array().notNull().default(sql`'{}'::text[]`),
    /** Its part in the workbench («corazón», «salida»): free and optional; the app does nothing with it (V3-20). */
    role: text("role"),
    ...timestamps,
  },
  (t) => [
    index("formulas_owner_idx").on(t.ownerId),
    index("formulas_workbench_idx").on(t.workbenchId),
    index("formulas_parent_idx").on(t.parentId),
    check("formulas_name", sql`length(trim(${t.name})) > 0`),
    check("formulas_markers", sql`${t.markers} <@ array['accord', 'finished']::text[]`),
    check("formulas_not_own_parent", sql`${t.parentId} is null or ${t.parentId} <> ${t.id}`),
    check("formulas_capacity", sql`${t.containerCapacityMl} is null or ${t.containerCapacityMl} > 0`),
    check("formulas_tare", sql`${t.containerTareUg} is null or ${t.containerTareUg} >= 0`),
    check("formulas_batches", sql`(${t.workBatchUg} is null or ${t.workBatchUg} > 0) and (${t.finalBatchUg} is null or ${t.finalBatchUg} > 0)`),
  ],
);

export const EVENT_KINDS = ["add", "set_mass", "remove", "reweigh", "note"] as const;

/**
 * One change of a formula's history (decisions §3.4), as the engine's `Change`. Only added, never
 * changed: undoing adds the opposite event (plan 8.2). The order is the id's: a UUID v7 made on
 * the device, with its time, so that two devices without network do not clash (plan 7.2).
 */
export const formulaEvents = pgTable(
  "formula_events",
  {
    id: uuid("id").primaryKey(),
    formulaId: uuid("formula_id")
      .notNull()
      .references(() => formulas.id, { onDelete: "cascade" }),
    /** The formula's owner, copied whatever the writer sends: the sync filters by it. */
    ownerId: uuid("owner_id").references(() => authUsers.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    /** add: the material poured, its mass as weighed, its final fraction of pure matter and its diluent(s). */
    materialId: uuid("material_id").references(() => materials.id, { onDelete: "restrict" }),
    massUg: bigint("mass_ug", { mode: "bigint" }),
    fraction: numeric("fraction"),
    diluentId: uuid("diluent_id").references(() => materials.id, { onDelete: "restrict" }),
    secondDiluentId: uuid("second_diluent_id").references(() => materials.id, { onDelete: "restrict" }),
    secondFraction: numeric("second_fraction"),
    /** set_mass, remove: the add event it changes. */
    target: uuid("target"),
    /** reweigh: gross weight and tare. */
    grossUg: bigint("gross_ug", { mode: "bigint" }),
    tareUg: bigint("tare_ug", { mode: "bigint" }),
    /** note: its text. */
    text: text("text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("formula_events_formula_idx").on(t.formulaId),
    index("formula_events_owner_idx").on(t.ownerId),
    check("formula_events_kind", sql`${t.kind} in ('add', 'set_mass', 'remove', 'reweigh', 'note')`),
    // Each kind carries what it needs and nothing else (plan 7.2).
    check(
      "formula_events_shape",
      sql`case ${t.kind}
        when 'add' then ${t.materialId} is not null and ${t.massUg} > 0 and ${t.fraction} > 0 and ${t.fraction} <= 1
          and (${t.fraction} = 1 or ${t.diluentId} is not null)
          and ((${t.secondDiluentId} is null and ${t.secondFraction} is null)
            or (${t.secondDiluentId} is not null and ${t.secondFraction} > 0 and ${t.fraction} + ${t.secondFraction} < 1))
          and ${t.target} is null and ${t.grossUg} is null and ${t.tareUg} is null and ${t.text} is null
        when 'set_mass' then ${t.target} is not null and ${t.massUg} > 0 and ${t.materialId} is null and ${t.fraction} is null
          and ${t.diluentId} is null and ${t.grossUg} is null and ${t.tareUg} is null and ${t.text} is null
        when 'remove' then ${t.target} is not null and ${t.materialId} is null and ${t.massUg} is null and ${t.fraction} is null
          and ${t.diluentId} is null and ${t.grossUg} is null and ${t.tareUg} is null and ${t.text} is null
        when 'reweigh' then ${t.grossUg} is not null and ${t.tareUg} >= 0 and ${t.grossUg} > ${t.tareUg} and ${t.materialId} is null
          and ${t.massUg} is null and ${t.target} is null and ${t.text} is null
        when 'note' then length(trim(coalesce(${t.text}, ''))) > 0 and ${t.materialId} is null and ${t.massUg} is null
          and ${t.target} is null and ${t.grossUg} is null
        else false end`,
    ),
  ],
);
