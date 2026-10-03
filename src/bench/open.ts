import { formulaFromJson } from "../core/io/formula-json";
import type { Formula } from "../core/model/formula";
import type { ModelVersion } from "../data/repository";
import { v2Dataset } from "../v2/data";
import { migrateFormula, type Migration } from "../v2/migrate";

/** A formula as it is opened: in memory, migrated to the v2 if the user works with it (D13), with the file's text as it was. */
export interface OpenedFormula {
  readonly formula: Formula;
  readonly path: string | null;
  /** The text of the file as it was, when the migration changed the formula: copied to «copias-v1» before the first write over it. */
  readonly original?: string;
  readonly migration?: Migration;
}

/**
 * Opens the text of a formula file (Phase 5). With the v2 as the model, each material goes to the product the user has by
 * `v1-a-v2.csv` and the CAS check; what cannot migrate stays as it was, with a note. The file is not touched here.
 */
export function openFormula(text: string, path: string | null, model: ModelVersion): OpenedFormula {
  const formula = formulaFromJson(text);
  if (model !== "v2") {
    return { formula, path };
  }
  const migration = migrateFormula(formula, v2Dataset());
  return migration.changed ? { formula: migration.formula, path, original: text, migration } : { formula, path, migration };
}
