import type { IfraData } from "../core/ifra";
import type { Dataset } from "../v2/model";
import type { CatalogEntry } from "./catalog";
import { repositoryOf, type MaterialRepository } from "./repository";

/**
 * The IFRA data of both models in one (Phase 5): the substances of the v2 win where both have one, since a substance that two
 * materials carry has to be one for the sum; the materials are never the same key (`fig:…` of the v1, `v2:…` of the v2), so
 * a material only of the v1 keeps its IFRA as it was, against the same standards.
 */
export function mergeIfra(v1: IfraData, v2: IfraData): IfraData {
  return {
    substances: new Map([...v1.substances, ...v2.substances]),
    materials: new Map([...v1.materials, ...v2.materials]),
  };
}

/**
 * The materials of the app with the v2 by default (Phase 5): every material of the v2, and those that only exist in the v1,
 * marked «v1, sin revisar», with their IFRA calculated as before. A row of the v1 that the v2 has (`v1-a-v2.csv`) is not offered
 * twice: its v2 product is. It still resolves by its key, so a formula that has not migrated (a CAS that did not match, no
 * confirmation) keeps working.
 */
export function mergedRepository(v1: MaterialRepository, v2: MaterialRepository, data: Dataset): MaterialRepository {
  const covered = new Set(data.v1Links.map((l) => l.v1Id));
  const own = new Set(v2.entries.map((e) => e.material.key));
  const fromV1 = v1.entries
    .filter((e) => !covered.has(e.material.key) && !own.has(e.material.key))
    .map((e): CatalogEntry => (e.group === "diluent" ? e : { ...e, unreviewed: true }));
  const merged = repositoryOf("v2", {
    entries: [...v2.entries, ...fromV1],
    ifra: mergeIfra(v1.ifraData(), v2.ifraData()),
    ...(v2.details ? { details: v2.details } : {}),
    families: v1.families,
    source: v2.source,
  });
  return { ...merged, get: (key) => merged.get(key) ?? v1.get(key) };
}
