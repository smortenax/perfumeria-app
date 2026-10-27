import { useEffect, useState } from "react";
import type { LocalDatabase } from "../db/local/database";
import { formulasUsing } from "../db/uses";
import { texts } from "../i18n/en";
import type { GlossaryData } from "./useGlossary";

const t = texts.usedIn;

/**
 * «Used in» on a material's sheet (F18): the formulas of yours that carry it (or its common
 * material, or a specification of it), each with its workbench, as links that open it. Live: a pour
 * in the bench shows here without reloading.
 */
export function MaterialUses({ data, local, materialId, onOpen }: { data: GlossaryData; local: LocalDatabase; materialId: string; onOpen: (formulaId: string) => void }) {
  const [ids, setIds] = useState<string[] | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    local.powerSync.watch(
      "SELECT count(*) AS n, max(id) AS last FROM formula_events",
      [],
      { onResult: () => void formulasUsing(local.db, data.catalog, local.userId, materialId).then(setIds) },
      { signal: abort.signal },
    );
    return () => abort.abort();
  }, [local, data.catalog, materialId]);
  const bench = new Map(data.workbenches.map((w) => [w.id, w.name]));
  const formulas = (ids ?? [])
    .map((id) => data.formulas.find((f) => f.id === id))
    .filter((f) => f !== undefined)
    .sort((a, b) => (bench.get(a.workbenchId) ?? "").localeCompare(bench.get(b.workbenchId) ?? "", "es") || a.name.localeCompare(b.name, "es"));
  return (
    <section className="sheet-section material-uses">
      <h3>{t.title}</h3>
      {ids === null ? null : formulas.length === 0 ? (
        <p className="unknown">{t.none}</p>
      ) : (
        <ul>
          {formulas.map((f) => (
            <li key={f.id}>
              <button type="button" className="link" onClick={() => onOpen(f.id)}>
                {f.name}
              </button>
              <span className="hint"> · {bench.get(f.workbenchId) ?? "—"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
