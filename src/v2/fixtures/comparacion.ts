import { Ratio } from "../../core/arith/ratio";
import { parseMass } from "../../core/arith/units";
import type { Change, Formula } from "../../core/model/formula";
import { DILUENTS, type Material } from "../../core/model/material";

/**
 * The two formulas of docs/v2/comparacion-fase2.md, each with the keys of v1 and of v2, so the
 * same weighing is checked with both models of materials.
 */

/** One line of the seven: name, v1 key, v2 key, grams poured, % of pure matter, diluent. */
export const SEVEN_LINES: ReadonlyArray<readonly [string, string, string, string, string, keyof typeof DILUENTS | null]> = [
  ["Geraniol 98%", "fig:1906", "v2:P00001", "0,200", "100", null],
  ["Linalol", "fig:2220", "v2:P00002", "0,400", "50", "dpg"],
  ["Lavanda", "fig:2179", "v2:P00003", "0,300", "100", null],
  ["Absoluto de Castoreum 20%", "fig:1343", "v2:P00004", "0,100", "20", "alcohol"],
  ["Aldehyde C11 MOA", "prod:symrise-656012", "v2:P00005", "0,050", "10", "dpg"],
  ["Oakmoss Absolute 50% (IPM)", "prod:iff-00133097", "v2:P00006", "0,040", "50", "ipm"],
  ["Castoreum Synthetic", "prod:firmenich-184004", "v2:P00007", "0,150", "100", null],
];

/**
 * The seven materials of phase 2 in one concentrate of 1,24 g, as each is bought (the linalool at
 * 50 % in DPG, the castoreum at 20 % in alcohol, the oakmoss at 50 % in IPM), taken to a perfume
 * at 20 %: work batch 1,24 g, final batch 6,2 g.
 */
export function seven(model: "v1" | "v2"): Formula {
  const history: Change[] = SEVEN_LINES.map(([name, v1, v2, grams, percent, diluent], i) => {
    const material: Material = { key: model === "v1" ? v1 : v2, kind: "base", name };
    return {
      kind: "add",
      id: `s${i + 1}`,
      material,
      massUg: parseMass(grams, "g"),
      fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)),
      diluent: diluent === null ? null : DILUENTS[diluent],
    };
  });
  return {
    header: { name: "Siete", intention: "", container: null, workBatchUg: 1_240_000n, finalBatchUg: 6_200_000n },
    history,
  };
}
