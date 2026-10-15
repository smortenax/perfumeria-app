import { engineMaterial } from "../db/formulas";
import type { IfraCardState } from "../db/to-ifra";
import type { GlossaryData } from "../glossary/useGlossary";
import { type CatalogEntry, fold, type IfraState, normalize, searchCatalog, type UsageData } from "./data/catalog";
import type { MaterialRepository } from "./data/repository";
import { texts } from "./texts";

/**
 * The workbench's materials from the v3 (V3-52): the ported workbench reads a repository of the
 * v2's shape, and this one is made from the v3's catalog and IFRA. A material's key is its id, so
 * a line of a formula is the material of the glossary it was poured from (loadFormula, toIfra).
 * What the v3 does not have yet (the family's colour, the provenance of each figure) is left out,
 * never invented (§1.2).
 */

const STATE: Readonly<Record<IfraCardState["state"], IfraState>> = {
  prohibited: "prohibido",
  ceiling: "con-techo",
  requirement: "condicion",
  "by-constituents": "por-constituyentes",
  "no-data": "sin-dato",
  "no-standard": "sin-estandar",
};

export function repositoryOfV3(data: GlossaryData): MaterialRepository {
  const entries: CatalogEntry[] = [];
  for (const m of data.catalog.materials.values()) {
    // A frozen formula is poured with its vector, which the workbench builds for the ones its bench may use (V3-19, V3-49).
    if (m.kind === "frozen") continue;
    const base = m.basedOnId ? data.catalog.materials.get(m.basedOnId) : undefined;
    const pick = <T,>(get: (x: typeof m) => T | null | undefined): T | null => get(m) ?? (base ? (get(base) ?? null) : null);
    const abbreviation = pick((x) => x.abbreviation);
    const cas = pick((x) => x.cas) ?? "";
    const aliases = [...new Set([...m.aliases, ...(base?.aliases ?? [])])];
    const dose = [...m.doses, ...(base?.doses ?? [])].find((d) => d.min || d.max || d.typical);
    const usage: UsageData | undefined = dose
      ? {
          ...(dose.min ? { min: dose.min } : {}),
          ...(dose.max ? { max: dose.max } : dose.typical ? { max: dose.typical } : {}),
          consensus: dose.authority === "consensus" ? "consenso" : "recomendacion",
          sources: dose.source,
        }
      : undefined;
    const names = [m.name, ...aliases, ...(m.product ? [m.product] : [])];
    entries.push({
      material: engineMaterial(m),
      group: m.ownerId !== null ? "own" : m.solvent ? "diluent" : "base",
      code: abbreviation ?? "",
      icon: abbreviation ?? "",
      chemicalName: m.name,
      cas,
      state: STATE[data.ifraStates.get(m.id)?.state ?? "no-data"],
      search: normalize(
        [abbreviation ?? "", ...names, cas, ...m.otherCas, ...(base?.otherCas ?? []), pick((x) => x.species) ?? "", pick((x) => x.inci) ?? ""].join(" "),
      ),
      folded: names.map(fold),
      ...(aliases.length ? { aliases } : {}),
      ...(m.product ? { shopNames: [m.product] } : {}),
      ...(usage ? { usage } : {}),
      // Your version of a common is one row with it, yours first (as a maker's product in the v2, P62).
      ...(m.ownerId !== null && (m.supplier || base)
        ? { maker: { name: m.supplier ?? texts.bench.yourVersion, code: m.code ?? "", ...(base ? { general: base.id } : {}) } }
        : {}),
    });
  }
  const byKey = new Map(entries.map((e) => [e.material.key, e]));
  return {
    version: "v2",
    entries,
    search: (query, limit) => searchCatalog(entries, query, limit),
    get: (key) => byKey.get(key),
    ifraData: () => data.ifra,
    families: [],
    source: { amendment: "51", generated: data.catalog.dataCommit ?? "" },
  };
}

/** The v2's diluents of the bar, by the name of the common diluent each one is in the v3 (batch 10: Etanol, DPG, IPM; V3-53: the other four). */
const DILUENT_NAMES: Readonly<Record<string, RegExp>> = {
  "solv:alcohol": /^etanol/i,
  "solv:dpg": /^dpg/i,
  "solv:ipm": /^ipm/i,
  "solv:dep": /^dep$/i,
  "solv:tec": /^tec$/i,
  "solv:triacetina": /^triacetina$/i,
  "solv:bb": /^benzoato de bencilo$/i,
};

/**
 * The id in the v3 of a key the bar gives: a material's key is already its id; a diluent of the bar
 * («solv:dpg») is the common diluent of that name. One the v3 does not have is said, not guessed.
 */
export function v3IdOf(data: Pick<GlossaryData, "catalog">): (key: string) => string {
  const solvents = [...data.catalog.materials.values()].filter((m) => m.ownerId === null && m.solvent);
  return (key) => {
    const name = DILUENT_NAMES[key];
    if (!name) return key;
    const found = solvents.filter((m) => name.test(m.name));
    if (found.length !== 1) throw new Error(`the diluent ${key} is ${found.length ? "more than one" : "not one"} of the common materials`);
    return found[0].id;
  };
}
