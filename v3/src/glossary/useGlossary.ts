import { useEffect, useState } from "react";
import type { IfraData } from "../core/ifra";
import type { Catalog } from "../db/catalog";
import { type IfraLayer, loadIfraLayer } from "../db/ifra-layer";
import type { LocalDatabase } from "../db/local/database";
import { type FormulaRecord, loadFormulas, loadWorkbenches, type Workbench } from "../db/formulas";
import { loadCatalog } from "../db/materials";
import { indexCatalog, type SearchIndex } from "../db/search";
import { ifraCard, type IfraCardState, toIfra } from "../db/to-ifra";

/** What the glossary works with, read from this browser's copy: built once per change of the data. */
export interface GlossaryData {
  readonly catalog: Catalog;
  readonly layer: IfraLayer;
  readonly ifra: IfraData;
  readonly index: SearchIndex;
  /** Each material's own IFRA state (V3-25), for its line and the filter. */
  readonly ifraStates: ReadonlyMap<string, IfraCardState>;
  /** Your workbenches and formulas (phase 7), for the «Fórmulas» tab (V3-50). */
  readonly workbenches: readonly Workbench[];
  readonly formulas: readonly FormulaRecord[];
}

/** The tables the glossary reads: when any of them changes (a sync, an edit), it is read again. */
const TABLES = [
  "materials", "material_categories", "material_components", "regulations", "material_doses", "material_descriptors",
  "material_relations", "material_references", "lab_materials", "lab_dilutions", "lab_evaluations", "lab_axes",
  "ifra_standards", "ifra_limits", "ifra_substances", "ifra_annex", "ifra_variant_rules", "ifra_spec_exclusions", "data_version",
  "workbenches", "formulas", "formula_events",
];

async function read(local: LocalDatabase): Promise<GlossaryData> {
  const [catalog, layer, workbenches, formulas] = await Promise.all([
    loadCatalog(local.db, local.userId),
    loadIfraLayer(local.db),
    loadWorkbenches(local.db, local.userId),
    loadFormulas(local.db, local.userId),
  ]);
  const ifraStates = new Map([...catalog.materials.keys()].map((id) => [id, ifraCard(catalog, layer, id)]));
  return { catalog, layer, ifra: toIfra(catalog, layer), index: indexCatalog(catalog), ifraStates, workbenches, formulas };
}

export function useGlossary(local: LocalDatabase): GlossaryData | null {
  const [data, setData] = useState<GlossaryData | null>(null);
  useEffect(() => {
    let live = true;
    let reading = Promise.resolve();
    const refresh = () => {
      reading = reading
        .then(() => read(local))
        .then((d) => {
          if (live) setData(d);
        })
        // A failed reading keeps the last one on screen; the next change reads again.
        .catch((error: unknown) => console.error("glossary", error));
    };
    refresh();
    const stop = local.powerSync.onChangeWithCallback({ onChange: refresh }, { tables: TABLES, throttleMs: 500 });
    return () => {
      live = false;
      stop();
    };
  }, [local]);
  return data;
}
