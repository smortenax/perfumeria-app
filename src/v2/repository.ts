import { DILUENTS } from "../core/model/material";
import { fold, normalize, type CatalogEntry } from "../data/catalog";
import { repositoryOf, type MaterialRepository } from "../data/repository";
import type { Dataset } from "./model";
import { provenanceOf } from "./provenance";
import { buildIfra, flatten, ifraCards, v2Key, type IfraCard, type IfraFiles, type MaterialDetail } from "./to-ifra";

/** The diluents as the v1 catalog shows them; their IFRA comes from their CAS (to-ifra.ts). */
const DILUENT_ENTRIES: ReadonlyArray<readonly [keyof typeof DILUENTS, string, string]> = [
  ["dpg", "DPG", "25265-71-8"],
  ["alcohol", "EtOH", "64-17-5"],
  ["ipm", "IPM", "110-27-0"],
  ["dep", "DEP", "84-66-2"],
  ["tec", "TEC", "77-93-0"],
  ["triacetina", "TRI", "102-76-1"],
  ["bb", "BB", "120-51-4"],
];

/**
 * The bench's view of the v2 data: one entry per product (the bottle the user weighs), and one per
 * material that has none yet. Provisional, like the rest of the interface: no families or usual use
 * yet, and the id as the code, since the v2 has no codes of its own.
 */
export function v2Entries(
  data: Dataset,
  cards: ReadonlyMap<string, IfraCard> = new Map(),
  details: ReadonlyMap<string, MaterialDetail> = new Map(),
): CatalogEntry[] {
  const provenance = (id: string) => ({ provenance: provenanceOf(data, id, details.get(v2Key(id))) });
  const card = (id: string) => {
    const c = cards.get(v2Key(id));
    return c ? { state: c.state, ...(c.standardName ? { standardName: c.standardName } : {}), ...(c.note ? { ifraNote: c.note } : {}) } : {};
  };
  const materials = new Map(data.materials.map((m) => [m.id, m]));
  const documented = new Set(data.coverages.filter((c) => c.documentId !== "").map((c) => c.containerId));
  const entries: CatalogEntry[] = DILUENT_ENTRIES.map(([id, icon, cas]) => ({
    material: DILUENTS[id],
    group: "diluent",
    code: icon,
    icon,
    chemicalName: DILUENTS[id].name,
    cas,
    search: normalize(`${icon} ${DILUENTS[id].name} ${cas}`),
    folded: [fold(DILUENTS[id].name)],
  }));
  const withProduct = new Set(data.products.map((p) => p.materialId));
  for (const p of data.products) {
    const m = materials.get(p.materialId);
    const chemical = m?.name ?? p.name;
    const cas = m?.cas ?? "";
    entries.push({
      material: { key: v2Key(p.id), kind: "base", name: p.name, ...(cas ? { cas } : {}) },
      group: "base",
      code: p.id,
      icon: p.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3),
      chemicalName: chemical,
      ...(chemical !== p.name ? { tradeName: p.name } : {}),
      cas,
      search: normalize(`${p.id} ${p.name} ${chemical} ${p.maker} ${p.code} ${p.shop} ${cas} ${m?.species ?? ""}`),
      folded: [p.name, chemical].map(fold),
      ...(p.maker ? { maker: { name: p.maker, code: p.code } } : {}),
      ...(documented.has(p.id) ? { documented: true } : {}),
      ...(flatten(data, p.id).pureByConvention ? { pureByConvention: true } : {}),
      ...card(p.id),
      ...provenance(p.id),
    });
  }
  for (const m of data.materials.filter((x) => !withProduct.has(x.id))) {
    entries.push({
      material: { key: v2Key(m.id), kind: "base", name: m.name, ...(m.cas ? { cas: m.cas } : {}) },
      group: "base",
      code: m.id,
      icon: m.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3),
      chemicalName: m.name,
      cas: m.cas,
      search: normalize(`${m.id} ${m.name} ${m.cas} ${m.species}`),
      folded: [fold(m.name)],
      ...(flatten(data, m.id).pureByConvention ? { pureByConvention: true } : {}),
      ...card(m.id),
      ...provenance(m.id),
    });
  }
  return entries;
}

export function v2RepositoryOf(data: Dataset, ifra: IfraFiles, generated: string): MaterialRepository {
  const built = buildIfra(data, ifra);
  return repositoryOf("v2", {
    entries: v2Entries(data, ifraCards(data, ifra), built.details),
    ifra: built.ifra,
    details: built.details,
    families: [],
    source: { amendment: ifra.amendment, generated },
  });
}
