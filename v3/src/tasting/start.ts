import type { LocalDatabase } from "../db/local/database";
import { addStrip, createSession, saveClosure, type Tastings } from "../db/tastings";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { latestDilution } from "./logic";

/**
 * A new tasting of a material, from wherever you are (the queue, its sheet in Materiales): a strip in
 * the open session, or in a new one, with your newest bottle of it. If the material already has a
 * strip still open in that session, that one is returned instead of a second. The tasting lives in
 * «Catas»; the material only points at it (V3-64). Started from its sheet, you know what it is: the
 * reading is born «informed» (V3-66), a bias you can take off at the closing.
 */
export async function tasteMaterial(
  data: GlossaryData,
  local: LocalDatabase,
  tastings: Tastings,
  materialId: string,
  from: "queue" | "sheet" = "queue",
): Promise<string> {
  const open = tastings.sessions.find((s) => !s.endedAt) ?? null;
  const already = open && tastings.strips.find((s) => s.sessionId === open.id && s.materialId === materialId && !s.closedAt);
  if (already) return already.id;
  const sessionId = open?.id ?? (await createSession(local.db, local.userId));
  const dilution = latestDilution(data.catalog.dilutions.get(materialId));
  // The newest bottle of yours, not archived; without one, the bottle is chosen on the strip before smelling it.
  const stripId = await addStrip(local.db, local.userId, sessionId, { materialId, dilutionId: dilution?.id ?? null, dose: texts.tasting.doseHint });
  if (from === "sheet") await saveClosure(local.db, local.userId, stripId, { biases: ["informed"] });
  return stripId;
}
