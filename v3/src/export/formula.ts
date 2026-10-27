import { Ratio } from "../core/arith/ratio";
import type { Composition, Line } from "../core/compose";
import { decimalOf } from "./tables";

/**
 * A formula you can read anywhere (V3-80): one row per pour, in the order it was poured, and a row of
 * totals. Exact to six decimals with a point; what is not known is empty. Pure, so it is tested
 * against the F-001 of the notebook.
 */

const UG_PER_G = Ratio.of(1_000_000n);
const grams = (ug: Ratio) => decimalOf(ug.div(UG_PER_G));
const percent = (x: Ratio) => decimalOf(x.mul(Ratio.of(100n)));

export const FORMULA_COLUMNS = ["n", "material", "poured_g", "dilution_pct", "diluents", "pure_g", "pct_of_aromatic"] as const;

/** Each diluent of a pour with its share of what was poured: «DPG 90; Ethanol 10». The first one takes the rest. */
export function diluentsOf(line: Line): string {
  const others = [line.secondDiluent, ...(line.moreDiluents ?? [])].filter((d) => d !== undefined);
  const firstShare = Ratio.ONE.sub(line.fraction).sub(Ratio.sum(others.map((d) => d.fraction)));
  const all = [...(line.diluent && firstShare.sign() > 0 ? [{ name: line.diluent.name, share: firstShare }] : []), ...others.map((d) => ({ name: d.material.name, share: d.fraction }))];
  return all.map((d) => `${d.name} ${percent(d.share)}`).join("; ");
}

const cell = (value: string | null | undefined): string => {
  const text = value ?? "";
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function formulaCsv(composition: Composition): string {
  const aromatic = composition.aromaticUg;
  const rows = composition.lines.map((line, i) => {
    const pure = line.massUg.mul(line.fraction);
    return [
      String(i + 1),
      line.material.name,
      grams(line.massUg),
      percent(line.fraction),
      diluentsOf(line),
      grams(pure),
      line.material.solvent || aromatic.isZero() ? null : percent(pure.div(aromatic)),
    ];
  });
  const totals = ["", "total", grams(composition.totalUg), null, null, grams(aromatic), aromatic.isZero() ? null : "100"];
  return [FORMULA_COLUMNS.join(","), ...[...rows, totals].map((r) => r.map(cell).join(","))].join("\n") + "\n";
}

/** «Lejía v2» on 2026-10-27 → «Lejia-v2-2026-10-27.csv». */
export function formulaFileName(name: string, day: string, extension: string): string {
  const base = name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "formula";
  return `${base}-${day}.${extension}`;
}
