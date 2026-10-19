import type { LocalDatabase } from "../db/local/database";
import { addStrip, createSession, type Tastings } from "../db/tastings";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/es";
import { latestDilution } from "./logic";

/**
 * A new tasting of a material, from wherever you are (the queue, its sheet in Materiales): a strip in
 * the open session, or in a new one, with your newest bottle of it. If the material already has a
 * strip still open in that session, that one is returned instead of a second. The tasting lives in
 * «Catas»; the material only points at it (the user, 2026-10-19).
 */
export async function tasteMaterial(data: GlossaryData, local: LocalDatabase, tastings: Tastings, materialId: string): Promise<string> {
  const open = tastings.sessions.find((s) => !s.endedAt) ?? null;
  const already = open && tastings.strips.find((s) => s.sessionId === open.id && s.materialId === materialId && !s.closedAt);
  if (already) return already.id;
  const sessionId = open?.id ?? (await createSession(local.db, local.userId));
  const dilution = latestDilution(data.catalog.dilutions.get(materialId));
  return addStrip(local.db, local.userId, sessionId, { materialId, dilutionId: dilution?.id ?? null, dose: texts.tasting.doseHint });
}
