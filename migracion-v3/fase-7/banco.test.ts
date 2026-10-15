import { afterAll, beforeAll, expect, it } from "vitest";
import { compose } from "../../v3/src/core/compose";
import { checkIfra } from "../../v3/src/core/ifra";
import { undoOf } from "../../v3/src/bench/undo";
import { repositoryOfV3 } from "../../v3/src/bench/v3-repository";
import { loadFormula, loadFormulas, loadFrozen, usableFrozen } from "../../v3/src/db/formulas";
import { ifraCard, toIfra } from "../../v3/src/db/to-ifra";
import type { GlossaryData } from "../../v3/src/glossary/useGlossary";
import { loadV3 } from "../fase-5/cargar";
import { type Copy, ME, openCopy } from "./copia";

/**
 * Plan v3, step 8.2, on your library (the copy of phase 7: the commons, your versions and your 33
 * formulas): every formula opens in the workbench as the workbench opens it. It is read from the
 * copy; the accords it may pour are built with their vector; every material its history pours is in
 * the bar's catalog; it composes, IFRA reads it and undo knows what to do. Nothing of yours is in
 * Git: this reads the batches as they are on this computer.
 */

let copy: Copy;
beforeAll(async () => {
  copy = await openCopy();
}, 180_000);
afterAll(async () => {
  await copy?.close();
});

it("every formula of your library opens in the workbench", async () => {
  const { layer } = await loadV3();
  const ifra = toIfra(copy.catalog, layer);
  const data = {
    catalog: copy.catalog,
    ifra,
    ifraStates: new Map([...copy.catalog.materials.keys()].map((id) => [id, ifraCard(copy.catalog, layer, id)])),
  } as unknown as GlossaryData;
  const repository = repositoryOfV3(data);
  const records = await loadFormulas(copy.db, ME);
  expect(records.length).toBeGreaterThan(0);
  const problems: string[] = [];
  let accords = 0;
  for (const record of records) {
    try {
      const formula = await loadFormula(copy.db, copy.catalog, ME, record.id);
      const { materials, failed } = await loadFrozen(copy.db, copy.catalog, ME, usableFrozen(copy.catalog, records, ME, record.id));
      accords += materials.length;
      for (const [id, why] of failed) problems.push(`${record.name}: el acorde ${copy.catalog.materials.get(id)?.name} no se construye: ${why}`);
      for (const c of formula.history) {
        if (c.kind !== "add") continue;
        for (const m of [c.material, c.diluent, c.secondDiluent?.material]) {
          if (m && m.kind !== "formula" && !repository.get(m.key)) problems.push(`${record.name}: «${m.name}» no está en la barra`);
        }
      }
      compose(formula);
      checkIfra(formula, ifra);
      undoOf(formula);
    } catch (e) {
      problems.push(`${record.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.log(`${records.length} fórmulas abiertas; ${accords} acordes disponibles en sus barras.`);
  expect(problems).toEqual([]);
});
