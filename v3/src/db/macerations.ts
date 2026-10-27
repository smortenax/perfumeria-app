import { and, eq, isNull } from "drizzle-orm";
import { updateFormula } from "./formulas";
import * as local from "./local/schema";
import type { LocalDb } from "./materials";

/**
 * A formula macerating (V3-83, F21): optional, started from the bench or from the list of formulas;
 * Home shows its days and asks at each check (7, 14 and 28 days). The note of a check goes to the
 * formula's notes (F7), with its day and its date. No stock, no bottle: a start, and an end if you like.
 */

export const CHECKS = [7, 14, 28] as const;

export interface Maceration {
  readonly id: string;
  readonly formulaId: string;
  /** «2026-10-27». */
  readonly startedOn: string;
  readonly checked: readonly number[];
}

/** The day it is in (the day it started is day 0), and the check it is due for, if one is reached and not noted. */
export function macerationState(m: Pick<Maceration, "startedOn" | "checked">, today: string): { day: number; due: number | null; next: number | null } {
  const day = Math.max(0, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${m.startedOn}T00:00:00Z`)) / 86_400_000));
  const reached = CHECKS.filter((c) => c <= day && !m.checked.includes(c));
  return { day, due: reached.length > 0 ? reached[reached.length - 1] : null, next: CHECKS.find((c) => c > day) ?? null };
}

export const todayIso = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const stamp = () => new Date().toISOString();

/** What is macerating now: started and not ended. */
export async function listMacerations(db: LocalDb, ownerId: string): Promise<Maceration[]> {
  const rows = await db.select().from(local.macerations).where(and(eq(local.macerations.ownerId, ownerId), isNull(local.macerations.endedOn)));
  return rows
    .map((r) => ({ id: r.id, formulaId: r.formulaId ?? "", startedOn: r.startedOn ?? "", checked: r.checked ?? [] }))
    .sort((a, b) => a.startedOn.localeCompare(b.startedOn));
}

/** Starts it (today unless said); a formula already macerating is not started twice. */
export async function startMaceration(db: LocalDb, ownerId: string, formulaId: string, on = todayIso()): Promise<string> {
  const [formula] = await db.select().from(local.formulas).where(and(eq(local.formulas.id, formulaId), eq(local.formulas.ownerId, ownerId)));
  if (!formula) throw new Error("not one of your formulas");
  const open = (await listMacerations(db, ownerId)).find((m) => m.formulaId === formulaId);
  if (open) return open.id;
  const id = crypto.randomUUID();
  await db.insert(local.macerations).values({ id, ownerId, formulaId, startedOn: on, endedOn: null, checked: [], createdAt: stamp(), updatedAt: stamp() });
  return id;
}

export async function endMaceration(db: LocalDb, ownerId: string, id: string, on = todayIso()): Promise<void> {
  await db
    .update(local.macerations)
    .set({ endedOn: on, updatedAt: stamp() })
    .where(and(eq(local.macerations.id, id), eq(local.macerations.ownerId, ownerId)));
}

/** Notes a check: marks it done and, with words, adds them to the formula's notes as «Day 7 (2026-11-03): …». */
export async function noteCheck(db: LocalDb, ownerId: string, id: string, check: number, text: string, on = todayIso()): Promise<void> {
  const [m] = await db.select().from(local.macerations).where(and(eq(local.macerations.id, id), eq(local.macerations.ownerId, ownerId)));
  if (!m) throw new Error("not one of your macerations");
  if (text.trim()) {
    const [f] = await db.select().from(local.formulas).where(eq(local.formulas.id, m.formulaId!));
    const before = (f?.notes ?? "").trimEnd();
    await updateFormula(db, ownerId, m.formulaId!, { notes: `${before ? `${before}\n` : ""}Day ${check} (${on}): ${text.trim()}` });
  }
  await db
    .update(local.macerations)
    .set({ checked: [...new Set([...(m.checked ?? []), check])].sort((a, b) => a - b), updatedAt: stamp() })
    .where(eq(local.macerations.id, id));
}
