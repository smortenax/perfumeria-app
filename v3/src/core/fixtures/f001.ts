import { Ratio } from "../arith/ratio";
import { parseMass } from "../arith/units";
import type { Change, Formula } from "../model/formula";
import { DILUENTS, type Material } from "../model/material";

/**
 * F-001-v1, "Lejía": the first real formula of the lab, as recorded in
 * perfumeria-lab formulas/f-001-lejia/v1.md (2026-09-19). Masses are the
 * "Total g" column, as weighed; the dilution is the final fraction of pure
 * matter and its diluent. The order of the history was not recorded, so the
 * lines follow the table.
 */
export const F001_LINES = [
  // name, lab ID, grams poured, final % of pure matter, diluent, expected pure grams, expected % of the bottle
  ["Alcohol 96º", "alcohol", "5,060", "100", null, "5,060", null],
  ["Hedione", "MAT-hedione", "0,619", "100", null, "0,6190", "7,078"],
  ["Dartanol", "MAT-dartanol", "0,416", "100", null, "0,4160", "4,757"],
  ["Iso E Super", "MAT-iso-e-super", "0,372", "100", null, "0,3720", "4,254"],
  ["Diphenyl Oxide", "MAT-diphenyl-oxide", "0,361", "100", null, "0,3610", "4,128"],
  ["Florosa", "MAT-florosa", "0,267", "100", null, "0,2670", "3,053"],
  ["Alcohol Feniletílico", "MAT-alcohol-feniletilico", "0,065", "100", null, "0,0650", "0,743"],
  ["Cedro Atlas", "MAT-cedro-atlas", "0,063", "100", null, "0,0630", "0,720"],
  ["Cashmeran", "MAT-cashmeran", "0,110", "50", "dpg", "0,0550", "0,629"],
  ["Ebanol", "MAT-ebanol", "0,040", "100", null, "0,0400", "0,457"],
  ["Ionona Alpha", "MAT-ionona-alpha", "0,260", "10", "alcohol", "0,0260", "0,297"],
  ["Polysantol", "MAT-polysantol", "0,237", "10", "dpg", "0,0237", "0,271"],
  ["Sandalmysore Core", "MAT-sandalmysore-core", "0,221", "10", "dpg", "0,0221", "0,253"],
  ["Lavanda", "MAT-lavanda", "0,017", "100", null, "0,0170", "0,194"],
  ["Patchouli", "MAT-patchouli", "0,017", "100", null, "0,0170", "0,194"],
  ["Haba tonka (tintura)", "MAT-haba-tonka-tintura", "0,164", "10", "alcohol", "0,0164", "0,188"],
  ["Mayol", "MAT-mayol", "0,016", "100", null, "0,0160", "0,183"],
  ["Isobutil Quinoleína", "MAT-isobutil-quinoleina-ibq", "0,039", "40", "dpg", "0,0156", "0,178"],
  ["Ámbar gris (tintura)", "MAT-ambar-gris-tintura", "0,141", "10", "alcohol", "0,0141", "0,161"],
  ["Ethylene Brassylate", "MAT-ethylene-brassylate", "0,084", "10", "dpg", "0,0084", "0,096"],
  ["Absoluto de Tabaco", "MAT-absoluto-de-tabaco", "0,063", "10", "dpg", "0,0063", "0,072"],
  ["Resinoide Estírax", "MAT-resinoide-estyrax-estoraque", "0,040", "10", "dpg", "0,0040", "0,046"],
  ["Resinoide Benjuí", "MAT-resinoide-benjui", "0,032", "10", "dpg", "0,0032", "0,037"],
  ["Allyl Amyl Glycolate", "MAT-allyl-amyl-glycolate", "0,021", "10", "dpg", "0,0021", "0,024"],
  ["Dihydromyrcenol", "MAT-dihydromyrcenol", "0,020", "10", "dpg", "0,0020", "0,023"],
] as const;

export function f001Material(labId: string, name: string): Material {
  return labId === "alcohol" ? DILUENTS.alcohol : { key: `lab:${labId}`, kind: "base", name };
}

export function f001(): Formula {
  const history: Change[] = F001_LINES.map(([name, labId, grams, percent, diluent], i) => ({
    kind: "add",
    id: `f001-${i + 1}`,
    material: f001Material(labId, name),
    massUg: parseMass(grams, "g"),
    fraction: Ratio.fromDecimal(percent).div(Ratio.of(100)),
    diluent: diluent === null ? null : DILUENTS[diluent],
  }));
  return {
    header: { name: "Lejía", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
    history,
  };
}
