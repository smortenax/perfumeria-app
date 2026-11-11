import { and, eq } from "drizzle-orm";
import { Ratio } from "../core/arith/ratio";
import { SHAPE_IDS, type ShapeId } from "../planner/profile";
import { numericFromRatio, ratioFromNumeric } from "./exact";
import * as local from "./local/schema";
import type { LocalDb } from "./materials";

/**
 * The plan of a formula (V3-98, «Plantilla de la fórmula»): its materials in relative parts, without
 * grams, and the shape each fades along when the user picks one. One line per material.
 */

export interface PlanRow {
  readonly id: string;
  readonly materialId: string;
  /** Relative parts, exact. */
  readonly parts: Ratio;
  /** The user's pick; null takes the material's default. */
  readonly shape: ShapeId | null;
  readonly position: number;
  /** The block, link or floor it belongs to, as an imported plan names it (V3-100); null without one. */
  readonly groupName: string | null;
}

const stamp = () => new Date().toISOString();
const isShape = (s: unknown): s is ShapeId => typeof s === "string" && (SHAPE_IDS as readonly string[]).includes(s);

async function ownFormula(db: LocalDb, ownerId: string, formulaId: string) {
  const [f] = await db.select().from(local.formulas).where(and(eq(local.formulas.id, formulaId), eq(local.formulas.ownerId, ownerId)));
  if (!f) throw new Error("not one of your formulas");
}

/** The plan of one of your formulas, in the order it was written. */
export async function loadPlan(db: LocalDb, ownerId: string, formulaId: string): Promise<PlanRow[]> {
  const rows = await db
    .select()
    .from(local.formulaPlanLines)
    .where(and(eq(local.formulaPlanLines.formulaId, formulaId), eq(local.formulaPlanLines.ownerId, ownerId)));
  return rows
    .map((r) => ({ id: r.id, materialId: r.materialId ?? "", parts: ratioFromNumeric(r.parts) ?? Ratio.ZERO, shape: isShape(r.shape) ? r.shape : null, position: r.position ?? 0, groupName: r.groupName ?? null }))
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

/** Parts as the server's numeric takes them: exact, never negative. */
function decimal(parts: Ratio): string {
  if (parts.sign() < 0) throw new RangeError("parts cannot be negative");
  return numericFromRatio(parts);
}

/** Adds a material to the plan, or sets its parts if it is already there. Returns the line's id. */
export async function setPlanParts(db: LocalDb, ownerId: string, formulaId: string, materialId: string, parts: Ratio): Promise<string> {
  await ownFormula(db, ownerId, formulaId);
  const plan = await loadPlan(db, ownerId, formulaId);
  const there = plan.find((l) => l.materialId === materialId);
  if (there) {
    await db.update(local.formulaPlanLines).set({ parts: decimal(parts), updatedAt: stamp() }).where(eq(local.formulaPlanLines.id, there.id));
    return there.id;
  }
  const id = crypto.randomUUID();
  const position = plan.reduce((max, l) => Math.max(max, l.position + 1), 0);
  await db
    .insert(local.formulaPlanLines)
    .values({ id, ownerId, formulaId, materialId, parts: decimal(parts), shape: null, position, createdAt: stamp(), updatedAt: stamp() });
  return id;
}

/** Picks the shape a line fades along; null goes back to the material's default. */
export async function setPlanShape(db: LocalDb, ownerId: string, lineId: string, shape: ShapeId | null): Promise<void> {
  await db
    .update(local.formulaPlanLines)
    .set({ shape, updatedAt: stamp() })
    .where(and(eq(local.formulaPlanLines.id, lineId), eq(local.formulaPlanLines.ownerId, ownerId)));
}

export async function removePlanLine(db: LocalDb, ownerId: string, lineId: string): Promise<void> {
  await db.delete(local.formulaPlanLines).where(and(eq(local.formulaPlanLines.id, lineId), eq(local.formulaPlanLines.ownerId, ownerId)));
}

/** Copies a formula's plan to another of yours (a new version takes its mother's plan). */
export async function copyPlan(db: LocalDb, ownerId: string, fromId: string, toId: string): Promise<void> {
  for (const l of await loadPlan(db, ownerId, fromId)) {
    await db.insert(local.formulaPlanLines).values({
      id: crypto.randomUUID(),
      ownerId,
      formulaId: toId,
      materialId: l.materialId,
      parts: decimal(l.parts),
      shape: l.shape,
      position: l.position,
      groupName: l.groupName,
      createdAt: stamp(),
      updatedAt: stamp(),
    });
  }
}

/** A line to write into a plan: its material, exact parts, its shape (null: the default) and its group. */
export interface NewPlanLine {
  readonly materialId: string;
  readonly parts: Ratio;
  readonly shape: ShapeId | null;
  readonly groupName: string | null;
}

/**
 * Writes an imported plan into one of your formulas, all at once or nothing (V3-100).
 * «replace»: the plan becomes these lines, in this order. «add»: the lines it did not have go at the end,
 * and those it had take the new parts (and the shape and group, when the new line says one); the rest stay.
 */
export async function replacePlan(
  db: LocalDb,
  ownerId: string,
  formulaId: string,
  lines: readonly NewPlanLine[],
  mode: "replace" | "add" = "replace",
): Promise<void> {
  await ownFormula(db, ownerId, formulaId);
  const seen = new Set<string>();
  for (const l of lines) {
    if (seen.has(l.materialId)) throw new Error("a material appears twice in the plan");
    seen.add(l.materialId);
    if (l.shape !== null && !isShape(l.shape)) throw new Error(`unknown shape: ${String(l.shape)}`);
    decimal(l.parts);
  }
  const before = await loadPlan(db, ownerId, formulaId);
  await db.transaction(async (tx) => {
    const insert = (l: NewPlanLine, position: number) =>
      tx.insert(local.formulaPlanLines).values({
        id: crypto.randomUUID(),
        ownerId,
        formulaId,
        materialId: l.materialId,
        parts: decimal(l.parts),
        shape: l.shape,
        position,
        groupName: l.groupName,
        createdAt: stamp(),
        updatedAt: stamp(),
      });
    if (mode === "replace") {
      await tx.delete(local.formulaPlanLines).where(and(eq(local.formulaPlanLines.formulaId, formulaId), eq(local.formulaPlanLines.ownerId, ownerId)));
      for (const [i, l] of lines.entries()) await insert(l, i);
      return;
    }
    let next = before.reduce((max, l) => Math.max(max, l.position + 1), 0);
    for (const l of lines) {
      const there = before.find((b) => b.materialId === l.materialId);
      if (!there) {
        await insert(l, next++);
        continue;
      }
      await tx
        .update(local.formulaPlanLines)
        .set({ parts: decimal(l.parts), ...(l.shape !== null ? { shape: l.shape } : {}), ...(l.groupName !== null ? { groupName: l.groupName } : {}), updatedAt: stamp() })
        .where(eq(local.formulaPlanLines.id, there.id));
    }
  });
}
