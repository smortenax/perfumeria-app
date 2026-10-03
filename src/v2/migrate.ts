import type { Change, Formula } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { makeVector } from "../core/model/vector";
import type { Dataset, Product } from "./model";
import { v2Key } from "./to-ifra";

/**
 * Migrating a formula of the v1 to the v2 when it is opened (Phase 5, D13): each material is looked up in
 * `v1-a-v2.csv` by its key, and the formula goes to the product the user has, not to the row of the v1.
 * Nothing is guessed: a CAS that does not match, a material with two products or a material the v2 does not have
 * leaves the line as it was, with a note. The file is not touched here: the formula in memory changes, and the
 * file only when the user saves (the bench keeps a copy of the original before that).
 */
export type MigrationNote =
  /** The line moved to a product (or material) of the v2. `confirmedOn` when the user's confirmation let it (D13). */
  | { readonly kind: "migrated"; readonly from: string; readonly to: string; readonly name: string; readonly confirmedOn?: string; readonly provisional?: true }
  /** The CAS of the line is not the one of the v2 material, and the user has not confirmed the link: left as it was. */
  | { readonly kind: "cas"; readonly from: string; readonly name: string; readonly formulaCas: string; readonly v2Cas: string }
  /** The material has more than one product and the link does not say which: the user has to say. */
  | { readonly kind: "ambiguous"; readonly from: string; readonly name: string; readonly products: readonly string[] }
  /** Not in the v2: the line stays as «v1, sin revisar» and its IFRA is calculated as before. */
  | { readonly kind: "v1-only"; readonly from: string; readonly name: string };

export interface Migration {
  readonly formula: Formula;
  readonly notes: readonly MigrationNote[];
  /** Whether any line moved: if not, the file does not need to change. */
  readonly changed: boolean;
}

const sameCas = (a: string | undefined, b: string): boolean => (a ?? "").trim() === b.trim();

/** The material the bench builds for a product of the v2 (the bottle the user weighs), or for a material without product. */
export function v2MaterialOf(data: Dataset, id: string): Material {
  const product = data.products.find((p) => p.id === id);
  const material = data.materials.find((m) => m.id === (product ? product.materialId : id));
  const cas = material?.cas ?? "";
  return { key: v2Key(id), kind: "base", name: product?.name ?? material?.name ?? id, ...(cas ? { cas } : {}) };
}

export function migrateFormula(formula: Formula, data: Dataset): Migration {
  const notes: MigrationNote[] = [];
  const done = new Map<string, Material>();
  const links = new Map(data.v1Links.map((l) => [l.v1Id, l]));
  const productsOf = new Map<string, Product[]>();
  for (const p of data.products) {
    productsOf.set(p.materialId, [...(productsOf.get(p.materialId) ?? []), p]);
  }

  const resolve = (material: Material): Material => {
    const known = done.get(material.key);
    if (known) {
      return known;
    }
    const result = decide(material);
    done.set(material.key, result);
    return result;
  };

  const decide = (material: Material): Material => {
    if (material.kind === "formula" && material.vector) {
      const components = material.vector.components.map((c) => ({ material: resolve(c.material), amount: c.proportion }));
      if (components.every((c, i) => c.material === material.vector!.components[i].material)) {
        return material;
      }
      // The proportions are the same; a vector is flat, so two lines that now are one material add up.
      const vector = makeVector(components);
      return { ...material, key: vector.id, vector };
    }
    if (material.solvent || material.key.startsWith("solv:") || material.key.startsWith("v2:") || material.kind === "own") {
      return material;
    }
    const link = links.get(material.key);
    if (!link) {
      notes.push({ kind: "v1-only", from: material.key, name: material.name });
      return material;
    }
    const v2 = data.materials.find((m) => m.id === link.v2Id);
    if (!v2) {
      notes.push({ kind: "v1-only", from: material.key, name: material.name });
      return material;
    }
    const products = productsOf.get(v2.id) ?? [];
    const target = link.productId !== "" ? link.productId : products.length === 1 ? products[0].id : products.length === 0 ? v2.id : null;
    if (target === null) {
      notes.push({ kind: "ambiguous", from: material.key, name: material.name, products: products.map((p) => p.name) });
      return material;
    }
    // Same CAS migrates by itself; a different or missing one only if the user confirmed this link (D13).
    // A provisional material has no CAS to compare, so only the confirmation links it; a base without CAS on both sides
    // (a certificate of a product, a base) has nothing to contradict.
    const provisional = material.kind === "provisional";
    const bothWithout = (material.cas ?? "") === "" && v2.cas === "";
    const agrees = !provisional && (bothWithout || sameCas(material.cas, v2.cas));
    if (!agrees && link.confirmedOn === "") {
      notes.push({ kind: "cas", from: material.key, name: material.name, formulaCas: material.cas ?? "", v2Cas: v2.cas });
      return material;
    }
    const to = v2MaterialOf(data, target);
    notes.push({
      kind: "migrated",
      from: material.key,
      to: to.key,
      name: to.name,
      ...(link.confirmedOn !== "" && !agrees ? { confirmedOn: link.confirmedOn } : {}),
      ...(provisional ? { provisional: true as const } : {}),
    });
    return to;
  };

  const history = formula.history.map((change): Change => {
    if (change.kind !== "add") {
      return change;
    }
    const material = resolve(change.material);
    return material === change.material ? change : { ...change, material };
  });
  const changed = notes.some((n) => n.kind === "migrated");
  return { formula: changed ? { ...formula, history } : formula, notes, changed };
}
