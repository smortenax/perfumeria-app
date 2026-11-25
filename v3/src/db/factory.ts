import type { Catalog, Dilution } from "./catalog";

/**
 * The bottles that came made (batch 42, batch 66: «de fábrica, al 10 %», with its diluent). The material
 * is the pure one; the factory bottle carries what it came diluted in, so a new dilution made from that
 * bottle keeps it (calc.ts bottleOf). Weighing it as if it were pure would lose it.
 */

/** A bottle that came made (batch 42, «de fábrica»): said by its name or its note. */
export const isFactoryBottle = (d: Dilution): boolean => /f[aá]brica|factory/i.test(`${d.label ?? ""} ${d.description ?? ""}`);

/** The material's factory bottle, not archived, that says its diluents (the newest), or undefined. */
export function factoryBottleOf(catalog: Catalog, materialId: string): Dilution | undefined {
  const bottles = (catalog.dilutions.get(materialId) ?? []).filter((d) => !d.archivedAt && d.diluents.length > 0 && !d.sourceDilutionId && isFactoryBottle(d));
  return [...bottles].sort((a, b) => (b.madeOn ?? "").localeCompare(a.madeOn ?? ""))[0];
}
