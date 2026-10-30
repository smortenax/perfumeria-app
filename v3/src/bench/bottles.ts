import { Ratio } from "../core/arith/ratio";
import { DILUENTS } from "../core/model/material";
import type { GlossaryData } from "../glossary/useGlossary";
import { DILUENT_NAMES } from "./v3-repository";

/**
 * Your bottles of a material, as the add bar offers them (V3-67): a tab each, above the dilution.
 * Each diluent is one of the bar's (DPG, alcohol…), found by the name of its common material, as the
 * bar's own diluents are (v3-repository.ts); a bottle with a diluent the bar does not have is not
 * offered, rather than guessed.
 */
export interface BottleChoice {
  readonly id: string;
  /** «al 10 %», or the exact figure when it has no name. */
  readonly label: string;
  readonly fraction: Ratio;
  /** In order: the bar's diluent and its share of the bottle. */
  readonly diluents: readonly { readonly id: keyof typeof DILUENTS; readonly share: Ratio }[];
}

/** A percent as a cell of the bar writes it: «9.97», without trailing zeros. */
export function percentCell(fraction: Ratio): string {
  return fraction
    .mul(Ratio.of(100n))
    .toFixed(4)
    .replace(/\.?0+$/, "");
}

export function bottlesFor(data: Pick<GlossaryData, "catalog">, materialKey: string): BottleChoice[] {
  const barIdOf = (diluentId: string): keyof typeof DILUENTS | null => {
    const name = data.catalog.materials.get(diluentId)?.name ?? "";
    const found = Object.entries(DILUENT_NAMES).find(([, re]) => re.test(name));
    const id = found?.[0].replace(/^solv:/, "");
    return id && id in DILUENTS ? (id as keyof typeof DILUENTS) : null;
  };
  return (data.catalog.dilutions.get(materialKey) ?? [])
    .filter((d) => !d.archivedAt && d.diluents.length > 0)
    .flatMap((d): BottleChoice[] => {
      const diluents = d.diluents.map((x) => ({ id: barIdOf(x.diluentId), share: x.fraction }));
      if (diluents.some((x) => x.id === null)) return [];
      return [{ id: d.id, label: d.label ?? `${percentCell(d.fraction)} %`, fraction: d.fraction, diluents: diluents as BottleChoice["diluents"] }];
    })
    .sort((a, b) => a.fraction.cmp(b.fraction));
}
