import { Ratio } from "../core/arith/ratio";
import type { Catalog, CatalogMaterial, Family } from "../db/catalog";
import type { PlanRow } from "../db/plans";
import { familyOf } from "../families/palette";
import { defaultShape, type PlanLine, type ShapeId } from "./profile";

/** A field of a material, or of the one it is based on: your version says only what it changes. */
function inherited<K extends keyof CatalogMaterial>(catalog: Catalog, material: CatalogMaterial, key: K): CatalogMaterial[K] | null {
  let m: CatalogMaterial | undefined = material;
  for (let i = 0; m && i < 10; i++) {
    if (m[key] !== null && m[key] !== undefined) return m[key];
    m = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined;
  }
  return null;
}

/** A plan line as the planner reads it, with what it shows beside: its default shape and whether the user picked another. */
export interface ShownLine extends PlanLine {
  readonly rowId: string;
  readonly picked: ShapeId | null;
  readonly fallback: ShapeId | null;
}

/** The plan's rows with their materials' data. A material not in the copy keeps its line, with nothing known. */
export function planLinesOf(catalog: Catalog, rows: readonly PlanRow[]): ShownLine[] {
  return rows.map((r) => {
    const m = catalog.materials.get(r.materialId);
    const hours = m ? inherited(catalog, m, "tenacityHours") : null;
    const fallback = m
      ? defaultShape({ name: m.name, form: inherited(catalog, m, "form"), tier: inherited(catalog, m, "tier") }, hours === null ? null : Number(hours.num) / Number(hours.den))
      : null;
    const family: Family | null = m ? familyOf(catalog, m) : null;
    return {
      key: r.materialId,
      rowId: r.id,
      name: m?.name ?? "—",
      family,
      parts: r.parts,
      impact: m ? inherited(catalog, m, "impact") : null,
      hours,
      shape: r.shape ?? fallback,
      picked: r.shape,
      fallback,
    };
  });
}

/** One material, planned against weighed: each as a share of its own aromatic total. null where it is not. */
export interface Against {
  readonly key: string;
  readonly name: string;
  readonly planned: Ratio | null;
  readonly weighed: Ratio | null;
}

/**
 * What is weighed against the plan (V3-98: the plan is the formula's template): each material's share
 * of the planned parts and of the aromatic matter weighed, both exact. Solvents are left out of both.
 * Planned first, in its order; then what is weighed and was not planned.
 */
export function againstPlan(
  plan: readonly { readonly key: string; readonly name: string; readonly parts: Ratio }[],
  weighed: readonly { readonly key: string; readonly name: string; readonly massUg: Ratio; readonly solvent: boolean }[],
): Against[] {
  const planTotal = Ratio.sum(plan.map((p) => p.parts));
  const aromatic = weighed.filter((w) => !w.solvent);
  const weighedTotal = Ratio.sum(aromatic.map((w) => w.massUg));
  const massOf = new Map<string, Ratio>();
  for (const w of aromatic) massOf.set(w.key, (massOf.get(w.key) ?? Ratio.ZERO).add(w.massUg));
  const share = (x: Ratio | undefined, of: Ratio) => (x === undefined || of.isZero() ? null : x.div(of));
  const planned = plan.map((p) => ({ key: p.key, name: p.name, planned: share(p.parts, planTotal), weighed: share(massOf.get(p.key), weighedTotal) }));
  const inPlan = new Set(plan.map((p) => p.key));
  const extra = [...new Map(aromatic.filter((w) => !inPlan.has(w.key)).map((w) => [w.key, w.name])).entries()].map(([key, name]) => ({
    key,
    name,
    planned: null,
    weighed: share(massOf.get(key), weighedTotal),
  }));
  return [...planned, ...extra];
}
