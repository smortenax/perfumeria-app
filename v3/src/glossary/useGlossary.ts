import { useEffect, useMemo, useState } from "react";
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

/** The tables of the catalog and IFRA: when any of them changes (a sync, an edit), all of it is read again. */
const CATALOG_TABLES = [
  "materials", "material_categories", "material_components", "regulations", "material_doses", "material_descriptors",
  "material_relations", "material_references", "lab_materials", "lab_dilutions", "lab_dilution_diluents", "lab_evaluations", "lab_axes",
  "ifra_standards", "ifra_limits", "ifra_substances", "ifra_annex", "ifra_variant_rules", "ifra_spec_exclusions", "data_version",
];
/**
 * Your workbenches and formulas: read apart, and only them. Editing a formula (its name, a pour)
 * must not read the whole catalog again (the test phase: typing a name re-read it on every key).
 * A formula's history is the workbench's to watch (bench/Bench.tsx), not this one's.
 */
const FORMULA_TABLES = ["workbenches", "formulas"];

type CatalogPart = Omit<GlossaryData, "workbenches" | "formulas">;
type FormulaPart = Pick<GlossaryData, "workbenches" | "formulas">;

async function readCatalog(local: LocalDatabase): Promise<CatalogPart> {
  const [catalog, layer] = await Promise.all([loadCatalog(local.db, local.userId), loadIfraLayer(local.db)]);
  const ifraStates = new Map([...catalog.materials.keys()].map((id) => [id, ifraCard(catalog, layer, id)]));
  return { catalog, layer, ifra: toIfra(catalog, layer), index: indexCatalog(catalog), ifraStates };
}

async function readFormulas(local: LocalDatabase): Promise<FormulaPart> {
  const [workbenches, formulas] = await Promise.all([loadWorkbenches(local.db, local.userId), loadFormulas(local.db, local.userId)]);
  return { workbenches, formulas };
}

export function useGlossary(local: LocalDatabase): GlossaryData | null {
  const [catalogPart, setCatalogPart] = useState<CatalogPart | null>(null);
  const [formulaPart, setFormulaPart] = useState<FormulaPart | null>(null);
  useEffect(() => {
    let live = true;
    // One reading after another of each part; a failed one keeps the last on screen, the next change reads again.
    const reader = <T,>(read: () => Promise<T>, set: (value: T) => void, what: string) => {
      let reading = Promise.resolve();
      return () => {
        reading = reading
          .then(read)
          .then((value) => {
            if (live) set(value);
          })
          .catch((error: unknown) => console.error(what, error));
      };
    };
    const refreshCatalog = reader(() => readCatalog(local), setCatalogPart, "glossary");
    const refreshFormulas = reader(() => readFormulas(local), setFormulaPart, "formulas");
    refreshCatalog();
    refreshFormulas();
    const stopCatalog = local.powerSync.onChangeWithCallback({ onChange: refreshCatalog }, { tables: CATALOG_TABLES, throttleMs: 500 });
    const stopFormulas = local.powerSync.onChangeWithCallback({ onChange: refreshFormulas }, { tables: FORMULA_TABLES, throttleMs: 300 });
    return () => {
      live = false;
      stopCatalog();
      stopFormulas();
    };
  }, [local]);
  return useMemo(() => (catalogPart && formulaPart ? { ...catalogPart, ...formulaPart } : null), [catalogPart, formulaPart]);
}
