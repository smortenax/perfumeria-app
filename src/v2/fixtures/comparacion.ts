import { Ratio } from "../../core/arith/ratio";
import { parseMass } from "../../core/arith/units";
import { F001_LINES, f001 } from "../../core/fixtures/f001";
import type { Change, Formula } from "../../core/model/formula";
import { DILUENTS, type Material } from "../../core/model/material";

/**
 * The two formulas of docs/v2/comparacion-fase2.md, each with the keys of v1 and of v2, so the
 * same weighing is checked with both models of materials.
 */

/**
 * The v1 glossary row of each material of F-001, by the CAS of the lab's notebook
 * (materias-primas/<id>.md) and, for a natural, its form there. Tonka and ambergris are found by
 * name: their CAS is not in the glossary. Lavender points where the v1 points today (fig:2179,
 * every form mixed); the other naturals whose form has several rows take the first one.
 */
export const F001_V1: Readonly<Record<string, string>> = {
  "MAT-hedione": "fig:2351",
  "MAT-dartanol": "fig:412",
  "MAT-iso-e-super": "fig:92",
  "MAT-diphenyl-oxide": "fig:1689",
  "MAT-florosa": "fig:464",
  "MAT-alcohol-feniletilico": "fig:2657",
  "MAT-cedro-atlas": "fig:1357",
  "MAT-cashmeran": "fig:924",
  "MAT-ebanol": "fig:722",
  "MAT-ionona-alpha": "fig:1051",
  "MAT-polysantol": "fig:607",
  "MAT-sandalmysore-core": "fig:487",
  "MAT-lavanda": "fig:2179",
  "MAT-patchouli": "fig:2599",
  "MAT-haba-tonka-tintura": "fig:2992",
  "MAT-mayol": "fig:1447",
  "MAT-isobutil-quinoleina-ibq": "fig:938",
  "MAT-ambar-gris-tintura": "fig:1069",
  "MAT-ethylene-brassylate": "fig:1818",
  "MAT-absoluto-de-tabaco": "fig:2982",
  "MAT-resinoide-estyrax-estoraque": "fig:2914",
  "MAT-resinoide-benjui": "fig:1168",
  "MAT-allyl-amyl-glycolate": "fig:1012",
  "MAT-dihydromyrcenol": "fig:1672",
};

/** The materials of F-001 in the v2 today: only the lavender, of the seven of phase 2. */
export const F001_V2: Readonly<Record<string, string>> = { "MAT-lavanda": "v2:P00003" };

/** F-001 with its materials renamed to the keys of a model; the rest keep the notebook's key. */
export function f001With(keys: Readonly<Record<string, string>>): Formula {
  const formula = f001();
  const byName = new Map(F001_LINES.map(([name, labId]) => [name as string, labId as string]));
  return {
    ...formula,
    history: formula.history.map((c) => {
      if (c.kind !== "add" || c.material.kind !== "base" || c.material.solvent) {
        return c;
      }
      const key = keys[byName.get(c.material.name) ?? ""];
      return key ? { ...c, material: { ...c.material, key } } : c;
    }),
  };
}

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
