import { F001_LINES, f001 } from "../../core/fixtures/f001";
import type { Formula } from "../../core/model/formula";
import type { Dataset } from "../model";
import { v2Key } from "../to-ifra";

/**
 * F-001 with its materials renamed to the keys of a model, for the comparison of phase 3
 * (docs/v2/comparacion-fase3.md). The v2 key of each line is its product; the v1 key is the glossary row
 * the user chose for that material, lot by lot (datos/v2/v1-a-v2.csv). The alcohol is a diluent of the app.
 */
export const F001_PRODUCT: Readonly<Record<string, string>> = {
  "MAT-hedione": "Hedione",
  "MAT-dartanol": "Dartanol",
  "MAT-iso-e-super": "Iso E Super",
  "MAT-diphenyl-oxide": "Diphenyl Oxide",
  "MAT-florosa": "Florosa",
  "MAT-alcohol-feniletilico": "Alcohol Feniletílico",
  "MAT-cedro-atlas": "Cedro Atlas",
  "MAT-cashmeran": "Cashmeran",
  "MAT-ebanol": "Ebanol",
  "MAT-ionona-alpha": "Ionona Alpha",
  "MAT-polysantol": "Polysantol",
  "MAT-sandalmysore-core": "Sandalmysore Core",
  "MAT-lavanda": "Lavanda",
  "MAT-patchouli": "Patchouli",
  "MAT-haba-tonka-tintura": "Haba tonka (semillas), tintura comercial",
  "MAT-mayol": "Mayol",
  "MAT-isobutil-quinoleina-ibq": "Isobutilquinoleína (IBQ)",
  "MAT-ambar-gris-tintura": "Ámbar gris, tintura comercial (purificado)",
  "MAT-ethylene-brassylate": "Ethylene Brassylate",
  "MAT-absoluto-de-tabaco": "Absoluto de Tabaco",
  "MAT-resinoide-estyrax-estoraque": "Resinoide de estírax (estoraque)",
  "MAT-resinoide-benjui": "Resinoide de benjuí",
  "MAT-allyl-amyl-glycolate": "Allyl Amyl Glycolate",
  "MAT-dihydromyrcenol": "Dihydromyrcenol",
};

export interface Keys {
  readonly v1: Readonly<Record<string, string>>;
  readonly v2: Readonly<Record<string, string>>;
}

/** The v1 row and the v2 product of every line of F-001, from the data of the v2. */
export function f001Keys(data: Dataset): Keys {
  const v1: Record<string, string> = {};
  const v2: Record<string, string> = {};
  for (const [labId, name] of Object.entries(F001_PRODUCT)) {
    const product = data.products.find((p) => p.name === name);
    if (!product) {
      throw new Error(`F-001: «${name}» no está en la v2`);
    }
    const link = data.v1Links.find((l) => l.v2Id === product.materialId);
    if (!link) {
      throw new Error(`F-001: «${name}» no tiene fila de la v1 elegida`);
    }
    v1[labId] = link.v1Id;
    v2[labId] = v2Key(product.id);
  }
  return { v1, v2 };
}

/** F-001 with the keys of a model; the alcohol keeps the diluent of the app. */
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
