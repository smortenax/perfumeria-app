import type { IfraData, IfraMaterial, IfraSubstance } from "../core/ifra";
import { viewMap } from "../v2/lazy";
import { FIVE_MOP_STANDARD, FUROCOUMARIN_OILS, FUROCOUMARINS } from "../v2/to-ifra";
import type { Dataset } from "../v2/model";
import type { CatalogEntry } from "./catalog";
import { repositoryOf, type MaterialRepository } from "./repository";

/**
 * The IFRA data of both models in one (Phase 5): the substances of the v2 win where both have one, since a substance that two
 * materials carry has to be one for the sum; the materials are never the same key (`fig:…` of the v1, `v2:…` of the v2), so
 * a material only of the v1 keeps its IFRA as it was, against the same standards.
 */
export function mergeIfra(v1: IfraData, v2: IfraData): IfraData {
  const own = (key: string) => FUROCOUMARIN_OILS.has(key.replace(/^std:/, ""));
  const fiveMop = `std:${FIVE_MOP_STANDARD}`;
  // The two are looked at when asked, not copied: the IFRA of the v2 is worked out material by material (Phase 6), and merging by copying
  // would work all of it out at start-up. What a lookup gives is kept, so that the same key answers with the same object.
  // The phototoxic oils of the v1 sum in the group of STD 089 as those of the v2 do (D10), whichever model first built the substance.
  const fromV1 = new Map<string, IfraSubstance>();
  const v1Substance = (key: string): IfraSubstance | undefined => {
    let s = fromV1.get(key);
    if (!s) {
      const own1 = v1.substances.get(key);
      s = own1 && (own(key) || key === fiveMop ? { ...own1, combined: FUROCOUMARINS } : own1);
      if (s) {
        fromV1.set(key, s);
      }
    }
    return s;
  };
  const substances = viewMap<IfraSubstance>({
    get: (key) => v2.substances.get(key) ?? v1Substance(key),
    has: (key) => v2.substances.has(key) || v1.substances.has(key),
    keys: () => [...v1.substances.keys(), ...v2.substances.keys()],
  });
  // One way into the group, never two (D10): a material of the v1 whose 5-MOP is listed counts by it, and not also by its own standard.
  const materialsOfV1 = new Map<string, IfraMaterial>();
  const v1Material = (key: string): IfraMaterial | undefined => {
    let m = materialsOfV1.get(key);
    if (!m) {
      const original = v1.materials.get(key);
      if (original) {
        const byFiveMop = original.substances.some((s) => s.key === fiveMop);
        m = byFiveMop ? { ...original, substances: original.substances.filter((s) => !own(s.key)) } : original;
        materialsOfV1.set(key, m);
      }
    }
    return m;
  };
  const materials = viewMap<IfraMaterial>({
    get: (key) => v2.materials.get(key) ?? v1Material(key),
    has: (key) => v2.materials.has(key) || v1.materials.has(key),
    keys: () => [...v1.materials.keys(), ...v2.materials.keys()],
  });
  return { substances, materials };
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
