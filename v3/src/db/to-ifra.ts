import { Ratio } from "../core/arith/ratio";
import type { IfraData, IfraMaterial, IfraSubstance } from "../core/ifra";
import type { Authority, Catalog, CatalogMaterial, Component, Regulation } from "./catalog";

/**
 * From the catalog to the engine's IfraData (plan v3, step 3.3), as src/v2/to-ifra.ts did from
 * the v2's CSV. The engine reasons by IFRA standards, not molecules: each standard is a
 * «substance» with its ceiling, and what each member brings adds up against it.
 *
 * - A material's composition is opened recursively (plan §24). A molecule without components is
 *   itself; a natural, a composition, a provisional or a frozen formula without components is
 *   unknown, and leaves the check pending, never free (§3.4, §5.3).
 * - A figure of the literature or of consensus is never known: it counts its maximum in the
 *   worst case (V3-7). An «unknown» amount counts, at worst, the whole of its container.
 * - A material with regulations is a member: of its group (group_key) or alone. Members of one
 *   group with one ceiling add up against it; with several ceilings, each is a substance of a
 *   combined group, where the shares of their ceilings add up to at most 1 (§4.5).
 * - The user's version of a common material (V3-5) inherits its composition, each component by
 *   the most authoritative row, and every regulation of both.
 * - Only category 4 counts, or a regulation for every category (plan, step 4.6).
 * - A substance IFRA prohibits as such but limits in naturals (V3-30) has both rows: alone, it is
 *   prohibited; inside a natural, it counts against the ceiling; put straight into anything else,
 *   it leaves the check pending.
 *
 * Still to come with the migration (phase 4): how the standards whose limit is expressed as a
 * constituent (STD 089, 5-MOP) are written in `regulations`; the equivalence with the v2
 * (phase 5) will tell what is missing.
 */

export const NO_DATA = "Sin datos de sus constituyentes: puede llevar sustancias con techo.";
export const CATEGORY = "4";

const RANK: Readonly<Record<Authority, number>> = { lot: 0, product: 1, ifra: 2, literature: 3, consensus: 4 };
const isPlaceholder = (authority: Authority) => authority === "literature" || authority === "consensus";

/** What a material brings of a member, as a fraction of its pure matter: known, or bounded by `upper`. */
interface Load {
  readonly known: Ratio | null;
  readonly upper: Ratio;
}

const scale = (load: Load, by: Load): Load => ({
  known: load.known && by.known ? load.known.mul(by.known) : null,
  upper: load.upper.mul(by.upper),
});

const plus = (a: Load, b: Load): Load => ({
  known: a.known && b.known ? a.known.add(b.known) : null,
  upper: a.upper.add(b.upper),
});

function loadOf(component: Component): Load {
  const amount = component.amount;
  if (amount.kind === "unknown") {
    return { known: null, upper: Ratio.ONE };
  }
  // A «max» or a «range» counts its top: the worst the source allows.
  const value = amount.kind === "range" ? amount.max : amount.value;
  return isPlaceholder(component.authority) ? { known: null, upper: value } : { known: value, upper: value };
}

/** A material with what it inherits from the common one it is based on (V3-5). */
export interface Effective {
  readonly material: CatalogMaterial;
  readonly components: readonly Component[];
  readonly regulations: readonly Regulation[];
}

export function effective(catalog: Catalog, id: string): Effective {
  const material = catalog.materials.get(id);
  if (!material) {
    throw new Error(`No such material: ${id}`);
  }
  const chain: CatalogMaterial[] = [];
  for (let m: CatalogMaterial | undefined = material; m; m = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined) {
    if (chain.includes(m)) throw new Error(`A material based on itself: ${id}`);
    chain.push(m);
  }
  // Each component by the most authoritative row; at the same authority, the most specific (the user's).
  const best = new Map<string, { component: Component; rank: number; depth: number }>();
  chain.forEach((m, depth) => {
    for (const component of m.components) {
      const rank = RANK[component.authority];
      const before = best.get(component.componentId);
      if (!before || rank < before.rank || (rank === before.rank && depth < before.depth)) {
        best.set(component.componentId, { component, rank, depth });
      }
    }
  });
  return {
    material,
    components: [...best.values()].map((b) => b.component),
    regulations: chain.flatMap((m) => m.regulations),
  };
}

const applies = (r: Regulation) => r.category === null || r.category === CATEGORY;

/**
 * The members a material carries (itself included when it has regulations), why its list may be
 * incomplete, and which members arrive somewhere other than inside a natural (V3-30).
 */
function flatten(catalog: Catalog, rootId: string): { loads: Map<string, Load>; pending: string[]; outsideNaturals: Set<string> } {
  const loads = new Map<string, Load>();
  const pending = new Set<string>();
  const outsideNaturals = new Set<string>();
  const walk = (id: string, load: Load, seen: readonly string[]) => {
    if (seen.includes(id)) {
      throw new Error(`A material that contains itself: ${[...seen, id].join(" → ")}`);
    }
    const { material, components, regulations } = effective(catalog, id);
    if (regulations.some(applies)) {
      const before = loads.get(id);
      loads.set(id, before ? plus(before, load) : load);
    }
    if (components.length === 0) {
      if (material.kind !== "molecule") pending.add(NO_DATA);
      return;
    }
    for (const component of components) {
      if (material.kind !== "natural") outsideNaturals.add(component.componentId);
      walk(component.componentId, scale(loadOf(component), load), [...seen, id]);
    }
  };
  walk(rootId, { known: Ratio.ONE, upper: Ratio.ONE }, []);
  return { loads, pending: [...pending], outsideNaturals };
}

type Entry = { key: string; fraction: Ratio | null; upper?: Ratio };

/** Two members under one key add up; an unknown one leaves the sum unknown, bounded if both are (as the v2). */
function merge(list: readonly Entry[]): Entry[] {
  const byKey = new Map<string, Entry>();
  for (const entry of list) {
    const before = byKey.get(entry.key);
    if (!before) {
      byKey.set(entry.key, entry);
    } else if (before.fraction && entry.fraction) {
      byKey.set(entry.key, { key: entry.key, fraction: before.fraction.add(entry.fraction) });
    } else {
      const a = before.fraction ?? before.upper;
      const b = entry.fraction ?? entry.upper;
      byKey.set(entry.key, a && b ? { key: entry.key, fraction: null, upper: a.add(b) } : { key: entry.key, fraction: null });
    }
  }
  return [...byKey.values()];
}

/** The state of a requirement (§4.4, V3-25): accredited by a lot or a product, assumed by literature or consensus, else pending. */
export type RequirementState = "accredited" | "assumed" | "pending";
const PROVEN: readonly RequirementState[] = ["pending", "assumed", "accredited"];

export function requirementState(rows: readonly Regulation[]): RequirementState {
  if (rows.some((r) => r.authority === "lot" || r.authority === "product")) return "accredited";
  if (rows.some((r) => isPlaceholder(r.authority))) return "assumed";
  return "pending";
}

const groupOf = (r: Regulation) => r.groupKey ?? `reg:${r.id}`;

/** The engine's IfraData for every material of the catalog, keyed by the material's id. */
export function toIfra(catalog: Catalog): IfraData {
  // Which ceilings each group has, over the whole catalog: one ceiling adds up against it; several make a combined group.
  const limitsOf = new Map<string, Set<string>>();
  for (const m of catalog.materials.values()) {
    for (const r of m.regulations) {
      if (r.regime === "ifra" && r.kind === "max" && applies(r) && r.maxValue) {
        limitsOf.set(groupOf(r), (limitsOf.get(groupOf(r)) ?? new Set()).add(r.maxValue.toString()));
      }
    }
  }
  const substances = new Map<string, IfraSubstance>();
  const casOf = (m: CatalogMaterial) => [...(m.cas ? [m.cas] : []), ...m.otherCas];

  /** The engine's substance for a ceiling of IFRA on a member, registered once. */
  const ifraSubstance = (r: Regulation, member: CatalogMaterial): string => {
    const group = groupOf(r);
    const several = (limitsOf.get(group)?.size ?? 0) > 1;
    const key = several ? `std:${group}@${r.maxValue!.toString()}` : `std:${group}`;
    const before = substances.get(key);
    const cas = [...new Set([...(before?.cas ?? []), ...casOf(member)])];
    substances.set(key, {
      key,
      name: before && !before.name.split(" / ").includes(member.name) ? `${before.name} / ${member.name}` : (before?.name ?? member.name),
      limit: r.maxValue!,
      amendment: r.source,
      ...(cas.length ? { cas } : {}),
      ...(several ? { combined: group } : {}),
    });
    return key;
  };

  const materials = new Map<string, IfraMaterial>();
  for (const material of catalog.materials.values()) {
    if (material.kind === "provisional") {
      // Only a name: nothing is known of it, and it is never free (§1.4).
      materials.set(material.id, { status: "unchecked", substances: [], conditions: [] });
      continue;
    }
    const flat = flatten(catalog, material.id);
    const entries: Entry[] = [];
    const conditions: string[] = [];
    const assumed: string[] = [];
    const pending = [...flat.pending];
    for (const [memberId, load] of flat.loads) {
      const { material: member, regulations } = effective(catalog, memberId);
      const asItself = memberId === material.id;
      const mine = regulations.filter(applies);
      const requirementsByGroup = new Map<string, Regulation[]>();
      for (const r of mine.filter((r) => r.kind === "requirement")) {
        requirementsByGroup.set(groupOf(r), [...(requirementsByGroup.get(groupOf(r)) ?? []), r]);
      }
      for (const r of mine) {
        if (r.kind === "max" && r.regime === "manufacturer") {
          // A manufacturer's ceiling is of its product: it counts what the product brings, reported apart (P62).
          const key = `tope:${member.id}`;
          substances.set(key, {
            key,
            name: `${member.name} (tope de ${member.supplier ?? member.house ?? "su fabricante"})`,
            limit: r.maxValue!,
            amendment: "",
            supplier: member.supplier ?? member.house ?? "fabricante",
          });
          entries.push(load.known ? { key, fraction: load.known } : { key, fraction: null, upper: load.upper });
        } else if (r.kind === "max") {
          const key = ifraSubstance(r, member);
          // V3-7: a load that is not proven goes with its bound, which the engine counts in the worst case.
          entries.push(load.known ? { key, fraction: load.known } : { key, fraction: null, upper: load.upper });
        } else if (r.kind === "prohibited" && !requirementsByGroup.has(groupOf(r))) {
          if (asItself) {
            // A prohibition with nothing else: the material is prohibited as such.
            const key = `prohibido:${groupOf(r)}`;
            substances.set(key, { key, name: `${member.name}, como tal`, limit: Ratio.ZERO, amendment: r.source });
            entries.push({ key, fraction: Ratio.ONE });
          } else if (!mine.some((c) => c.kind === "max" && c.regime === "ifra" && groupOf(c) === groupOf(r))) {
            pending.push(`${member.name}: prohibido como tal; lo que trae este material no tiene techo en los datos (${groupOf(r)}).`);
          } else if (flat.outsideNaturals.has(memberId)) {
            // V3-30: its ceiling is for what a natural brings; put straight into a mixture, it is used as such.
            pending.push(`${member.name}: prohibido como tal; aquí no llega dentro de un natural, y su techo es solo para lo que traen los naturales (${groupOf(r)}).`);
          }
          // V3-30: inside a natural, a substance prohibited as such counts against its standard's ceiling.
        }
      }
      if (asItself) {
        for (const [group, rows] of requirementsByGroup) {
          const what = rows.find((r) => r.requirement)?.requirement ?? group;
          const state = requirementState(rows);
          if (state === "accredited") {
            conditions.push(`${what} (${group})`);
          } else if (state === "assumed") {
            const text = `${what} (${group}): supuesta, no acreditada`;
            conditions.push(text);
            assumed.push(text);
          } else {
            pending.push(`${member.name}: ${what}: no está acreditado (${group}).`);
          }
        }
      }
    }
    materials.set(material.id, {
      status: "checked",
      substances: merge(entries),
      conditions: [...new Set(conditions)],
      ...(assumed.length ? { assumed: [...new Set(assumed)] } : {}),
      ...(pending.length ? { pending: [...new Set(pending)] } : {}),
    });
  }
  return { substances, materials };
}

/**
 * What the card and the search say of one material's IFRA (V3-25): its own, with its condition,
 * never the worst variant of a standard. A category does not have one: each material does.
 */
export type IfraCardState =
  | { readonly state: "prohibited" }
  | { readonly state: "ceiling"; readonly requirement?: RequirementState; readonly what?: string }
  | { readonly state: "requirement"; readonly requirement: RequirementState; readonly what: string }
  | { readonly state: "by-constituents" }
  | { readonly state: "no-data" }
  | { readonly state: "no-standard" };

export function ifraCard(catalog: Catalog, id: string): IfraCardState {
  const { material, regulations } = effective(catalog, id);
  if (material.kind === "provisional") return { state: "no-data" };
  const own = regulations.filter(applies);
  const requirements = own.filter((r) => r.kind === "requirement");
  const requirementGroups = new Set(requirements.map(groupOf));
  // «Prohibited» only for the prohibited variant: a prohibition whose group also allows a variant with a requirement is not this one's.
  if (own.some((r) => r.kind === "prohibited" && !requirementGroups.has(groupOf(r)))) return { state: "prohibited" };
  // V3-25: a requirement shows with its state, also next to a ceiling; of several standards, the least proven.
  const worst = [...requirementGroups]
    .map((group) => {
      const rows = requirements.filter((r) => groupOf(r) === group);
      return { requirement: requirementState(rows), what: rows.find((r) => r.requirement)?.requirement ?? "" };
    })
    .sort((a, b) => PROVEN.indexOf(a.requirement) - PROVEN.indexOf(b.requirement))[0];
  if (own.some((r) => r.kind === "max")) return worst ? { state: "ceiling", ...worst } : { state: "ceiling" };
  if (worst) return { state: "requirement", ...worst };
  const flat = flatten(catalog, id);
  if ([...flat.loads.keys()].some((member) => member !== id)) return { state: "by-constituents" };
  return flat.pending.includes(NO_DATA) ? { state: "no-data" } : { state: "no-standard" };
}
