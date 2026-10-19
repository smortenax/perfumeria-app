import { and, eq } from "drizzle-orm";
import { bottleOf, storedBottle, type SourceBottle } from "../dilution/calc";
import { numericFromRatio, ratioFromNumeric } from "./exact";
import * as local from "./local/schema";
import type { LocalDb } from "./materials";

/**
 * Your bottles (V3-65, V3-67), on the browser's copy. What is weighed is kept, and the bottle's
 * figures are worked out from it (src/dilution/calc.ts); each write checks what Supabase would refuse
 * (the migrations dilutions and dilutions_rls). A bottle is a property of its material: never a
 * material of its own.
 */

export interface BottleInput {
  readonly materialId: string;
  /** Its rough name («al 10 %»). */
  readonly label?: string | null;
  readonly madeOn?: string | null;
  readonly description?: string | null;
  /** The material weighed in, or, from another bottle, how much of that bottle. */
  readonly materialUg: bigint;
  readonly sourceDilutionId?: string | null;
  /** Each diluent weighed in, in order (as many as it takes). */
  readonly diluents: readonly { readonly diluentId: string; readonly massUg: bigint }[];
}

const now = () => new Date().toISOString();
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const clean = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

async function visible(db: LocalDb, userId: string, materialId: string, what: string) {
  const [row] = await db.select().from(local.materials).where(eq(local.materials.id, materialId));
  if (!row || (row.ownerId !== null && row.ownerId !== userId)) throw new Error(`${what} is a common material or yours`);
  return row;
}

async function ownBottle(db: LocalDb, userId: string, id: string) {
  const [row] = await db.select().from(local.labDilutions).where(and(eq(local.labDilutions.id, id), eq(local.labDilutions.userId, userId)));
  if (!row) throw new Error("not one of your bottles");
  return row;
}

/** The bottle another is made from, as the calculation reads it. */
async function sourceOf(db: LocalDb, userId: string, sourceId: string, materialId: string): Promise<SourceBottle> {
  const source = await ownBottle(db, userId, sourceId);
  if (source.materialId !== materialId) throw new Error("a bottle is made from another of the same material");
  const diluents = await db.select().from(local.labDilutionDiluents).where(eq(local.labDilutionDiluents.dilutionId, sourceId));
  if (diluents.length === 0) throw new Error("that bottle does not say its diluents: make it again in the app first");
  return {
    fraction: ratioFromNumeric(source.fraction)!,
    diluents: diluents.map((d) => ({ diluentId: d.diluentId!, fraction: ratioFromNumeric(d.fraction)! })),
  };
}

async function check(db: LocalDb, userId: string, input: BottleInput) {
  await visible(db, userId, input.materialId, "a bottle's material");
  for (const d of input.diluents) {
    const row = await visible(db, userId, d.diluentId, "a diluent");
    if (!row.solvent) throw new Error(`${row.name} is not a diluent`);
  }
  if (input.madeOn && !DATE.test(input.madeOn)) throw new Error("a date is 2026-10-19");
  const source = input.sourceDilutionId ? await sourceOf(db, userId, input.sourceDilutionId, input.materialId) : undefined;
  return storedBottle(bottleOf({ materialUg: input.materialUg, diluents: input.diluents, source }));
}

async function writeDiluents(db: LocalDb, userId: string, dilutionId: string, bottle: ReturnType<typeof storedBottle>) {
  await db.delete(local.labDilutionDiluents).where(eq(local.labDilutionDiluents.dilutionId, dilutionId));
  let position = 0;
  for (const d of bottle.diluents) {
    await db.insert(local.labDilutionDiluents).values({
      id: crypto.randomUUID(),
      dilutionId,
      userId,
      diluentId: d.diluentId,
      massUg: d.massUg === null ? null : d.massUg.toString(),
      fraction: numericFromRatio(d.fraction),
      position: position++,
      createdAt: now(),
    });
  }
}

/** Gives a bottle of yours a place: its figures from what you weighed (V3-67). */
export async function createBottle(db: LocalDb, userId: string, input: BottleInput): Promise<string> {
  const bottle = await check(db, userId, input);
  const id = crypto.randomUUID();
  const stamp = now();
  await db.insert(local.labDilutions).values({
    id,
    userId,
    materialId: input.materialId,
    fraction: numericFromRatio(bottle.fraction),
    solvent: null,
    madeOn: clean(input.madeOn),
    description: clean(input.description),
    label: clean(input.label),
    materialMassUg: input.materialUg.toString(),
    sourceDilutionId: input.sourceDilutionId ?? null,
    archivedAt: null,
    createdAt: stamp,
    updatedAt: stamp,
  });
  await writeDiluents(db, userId, id, bottle);
  return id;
}

/**
 * Corrects what was weighed into a bottle (V3-67, 5a): its figures are worked out again. What already
 * used it keeps its own figure: each pour and each strip copied it when it was made.
 */
export async function updateBottle(db: LocalDb, userId: string, id: string, input: BottleInput): Promise<void> {
  const row = await ownBottle(db, userId, id);
  if (row.materialId !== input.materialId) throw new Error("a bottle keeps its material");
  if (input.sourceDilutionId === id) throw new Error("a bottle is not made from itself");
  const bottle = await check(db, userId, input);
  await db
    .update(local.labDilutions)
    .set({
      fraction: numericFromRatio(bottle.fraction),
      solvent: null,
      madeOn: clean(input.madeOn),
      description: clean(input.description),
      label: clean(input.label),
      materialMassUg: input.materialUg.toString(),
      sourceDilutionId: input.sourceDilutionId ?? null,
      updatedAt: now(),
    })
    .where(eq(local.labDilutions.id, id));
  await writeDiluents(db, userId, id, bottle);
}

/** A finished bottle leaves the choices, and stays (V3-67); or comes back. */
export async function archiveBottle(db: LocalDb, userId: string, id: string, archived: boolean): Promise<void> {
  await ownBottle(db, userId, id);
  await db.update(local.labDilutions).set({ archivedAt: archived ? now() : null, updatedAt: now() }).where(eq(local.labDilutions.id, id));
}
