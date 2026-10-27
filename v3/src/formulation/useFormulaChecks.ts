import { useEffect, useState } from "react";
import { compose } from "../core/compose";
import { checkIfra } from "../core/ifra";
import { loadFormula } from "../db/formulas";
import type { LocalDatabase } from "../db/local/database";
import { type FamilyShare, familyShares } from "../families/bar";
import type { GlossaryData } from "../glossary/useGlossary";
import { type IfraLabel, ifraLabel } from "./ifra-label";

export interface FormulaCheck {
  readonly families: readonly FamilyShare[];
  readonly ifra: IfraLabel;
}

/**
 * Each formula asked for, composed and checked as the bench does (F2, F20), again whenever a step is
 * written. A formula that cannot be read (a material not yet in the copy) is left out, not guessed.
 */
export function useFormulaChecks(local: LocalDatabase, data: GlossaryData, ids: readonly string[]): ReadonlyMap<string, FormulaCheck> {
  const [checks, setChecks] = useState<ReadonlyMap<string, FormulaCheck>>(new Map());
  const [stamp, setStamp] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    local.powerSync.watch(
      "SELECT count(*) AS n, max(id) AS last FROM formula_events",
      [],
      { onResult: (r) => setStamp(JSON.stringify(r.rows?._array ?? [])) },
      { signal: abort.signal },
    );
    return () => abort.abort();
  }, [local]);
  const key = ids.join(",");
  useEffect(() => {
    let live = true;
    void Promise.all(
      key
        .split(",")
        .filter((id) => id)
        .map((id) =>
          loadFormula(local.db, data.catalog, local.userId, id).then(
            (formula) => {
              const composition = compose(formula);
              const check: FormulaCheck = {
                families: familyShares(composition.parts, data.catalog),
                ifra: ifraLabel(checkIfra(formula, data.ifra), !composition.aromaticUg.isZero()),
              };
              return [[id, check] as const];
            },
            () => [],
          ),
        ),
    ).then((all) => {
      if (live) setChecks(new Map(all.flat()));
    });
    return () => {
      live = false;
    };
  }, [key, stamp, local, data]);
  return checks;
}
