import type { Catalog, CatalogMaterial } from "../db/catalog";
import { casForm, normalize, search, type SearchIndex } from "../db/search";
import type { PlanFileLine } from "../planner/plan-json";

/**
 * Each line of an imported plan against the glossary (V3-100): by its materialId, then its CAS, then
 * its name. A plan prefers your version of a material over the common one, because the plan is weighed
 * with what you have. Pure; nothing is written until the review is confirmed, and a line that finds
 * nothing is not imported: the app never makes a material up (§1.2).
 */

export type PlanMatchStatus = "found" | "doubtful" | "missing" | "invalid";

export interface PlanMatch {
  readonly line: PlanFileLine;
  readonly status: PlanMatchStatus;
  /** Best first; the first is the proposal. Yours before the common ones. */
  readonly candidates: readonly CatalogMaterial[];
  readonly by: "id" | "cas" | "name" | "search" | null;
}

const usable = (m: CatalogMaterial) => !m.solvent && m.kind !== "frozen";

export function matchPlanLine(line: PlanFileLine, catalog: Catalog, index: SearchIndex, ownerId: string): PlanMatch {
  const done = (status: PlanMatchStatus, candidates: CatalogMaterial[], by: PlanMatch["by"]): PlanMatch => ({ line, status, candidates, by });
  if (line.problem) return done("invalid", [], null);
  const all = [...catalog.materials.values()].filter((m) => usable(m) && (m.ownerId === null || m.ownerId === ownerId));
  /** Your versions of these materials first, then the materials themselves; each once. */
  const yoursFirst = (found: CatalogMaterial[]) => {
    const ids = new Set(found.map((m) => m.id));
    const yours = all.filter((m) => m.ownerId === ownerId && (ids.has(m.id) || (m.basedOnId !== null && ids.has(m.basedOnId))));
    return yours.length > 0 ? yours : found;
  };
  const decide = (found: CatalogMaterial[], by: PlanMatch["by"]) => {
    const list = yoursFirst(found);
    return list.length === 1 ? done("found", list, by) : done("doubtful", list.slice(0, 5), by);
  };

  // The id rules when it is in the glossary: the file says exactly which material it means.
  const byId = line.materialId ? catalog.materials.get(line.materialId) : undefined;
  if (byId && usable(byId) && (byId.ownerId === null || byId.ownerId === ownerId)) return done("found", [byId], "id");

  const cas = casForm(line.cas ?? "");
  if (cas) {
    const byCas = all.filter((m) => m.cas === cas || m.otherCas.includes(cas));
    if (byCas.length > 0) return decide(byCas, "cas");
  }
  const name = normalize(line.material).trim();
  const byName = all.filter((m) => normalize(m.name).trim() === name || m.aliases.some((a) => normalize(a).trim() === name));
  if (byName.length > 0) {
    // By name, your material with that very name is the one; the others are only offered.
    const exactYours = byName.filter((m) => m.ownerId === ownerId);
    return exactYours.length === 1 ? done("found", exactYours, "name") : decide(byName, "name");
  }
  const near = search(index, line.material, 5)
    .flatMap((r) => r.members.map((m) => m.material))
    .filter((m) => usable(m) && (m.ownerId === null || m.ownerId === ownerId));
  const unique = [...new Map(near.map((m) => [m.id, m])).values()].slice(0, 5);
  return unique.length > 0 ? done("doubtful", unique, "search") : done("missing", [], null);
}

export function matchPlan(lines: readonly PlanFileLine[], catalog: Catalog, index: SearchIndex, ownerId: string): PlanMatch[] {
  return lines.map((l) => matchPlanLine(l, catalog, index, ownerId));
}

/**
 * The lines to write, from the material chosen for each (by line index; null leaves it out): in the
 * file's order, each material once. A material chosen twice keeps its first line, and the others are
 * returned as repeated so the screen says so.
 */
export function chosenLines(
  matches: readonly PlanMatch[],
  chosen: ReadonlyMap<number, string | null>,
): { readonly lines: readonly { readonly materialId: string; readonly match: PlanMatch }[]; readonly repeated: readonly number[] } {
  const seen = new Set<string>();
  const lines: { materialId: string; match: PlanMatch }[] = [];
  const repeated: number[] = [];
  for (const m of matches) {
    const id = choiceOf(m, chosen);
    if (id === null) continue;
    if (seen.has(id)) {
      repeated.push(m.line.index);
      continue;
    }
    seen.add(id);
    lines.push({ materialId: id, match: m });
  }
  return { lines, repeated };
}

/** What a line takes: your pick, or the proposal when it was found; a doubtful one waits for you. */
export function choiceOf(m: PlanMatch, chosen: ReadonlyMap<number, string | null>): string | null {
  if (chosen.has(m.line.index)) return chosen.get(m.line.index) ?? null;
  return m.status === "found" ? m.candidates[0].id : null;
}
