import { and, eq, inArray, or } from "drizzle-orm";
import type { Catalog } from "./catalog";
import * as local from "./local/schema";
import type { LocalDb } from "./materials";

/**
 * «Used in» (F18, V3-78): the formulas of yours that carry a material, as the material itself or as
 * a diluent of a pour. A specification of yours counts as its common material and the other way
 * round: the sheet of either lists the formulas of both. A pour later removed does not count.
 */

/** The material and its kin: its common material and every specification of it. */
export function kinOf(catalog: Pick<Catalog, "materials">, materialId: string): string[] {
  const base = catalog.materials.get(materialId)?.basedOnId ?? materialId;
  return [base, ...[...catalog.materials.values()].filter((m) => m.basedOnId === base).map((m) => m.id)];
}

export async function formulasUsing(db: LocalDb, catalog: Pick<Catalog, "materials">, ownerId: string, materialId: string): Promise<string[]> {
  const kin = kinOf(catalog, materialId);
  const e = local.formulaEvents;
  const byMoreDiluents = await db
    .select({ eventId: local.formulaEventDiluents.eventId })
    .from(local.formulaEventDiluents)
    .where(and(eq(local.formulaEventDiluents.ownerId, ownerId), inArray(local.formulaEventDiluents.diluentId, kin)));
  const pours = await db
    .select({ id: e.id, formulaId: e.formulaId })
    .from(e)
    .where(
      and(
        eq(e.ownerId, ownerId),
        eq(e.kind, "add"),
        or(inArray(e.materialId, kin), inArray(e.diluentId, kin), inArray(e.secondDiluentId, kin), inArray(e.id, byMoreDiluents.map((d) => d.eventId ?? ""))),
      ),
    );
  if (pours.length === 0) return [];
  const removed = await db
    .select({ target: e.target })
    .from(e)
    .where(and(eq(e.ownerId, ownerId), eq(e.kind, "remove"), inArray(e.target, pours.map((p) => p.id))));
  const gone = new Set(removed.map((r) => r.target));
  return [...new Set(pours.filter((p) => !gone.has(p.id)).map((p) => p.formulaId ?? ""))].filter((f) => f);
}
