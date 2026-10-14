import { Ratio } from "../core/arith/ratio";
import type { IfraData, IfraMaterial, IfraSubstance } from "../core/ifra";
import type { Authority, Catalog, CatalogMaterial, Component, MaterialKind, Regulation } from "./catalog";
import type { IfraLayer, IfraStandard } from "./ifra-layer";

/**
 * From the catalog and IFRA's layer to the engine's IfraData (plan v3, steps 3.3 and 4.3), as
 * src/v2/to-ifra.ts did from the v2's CSV. The engine reasons by IFRA standards, not molecules:
 * each standard is a «substance» with its ceiling, and what each member brings adds up against it.
 *
 * - IFRA is a layer apart (V3-35): a material says what it is (its CAS, its species, its process)
 *   and what it carries; its IFRA comes from reading that against the layer. The material keeps
 *   only what is its own: a manufacturer's ceiling, and what its documents claim (V3-39).
 * - A material's composition is opened recursively (plan §24): its components, which may be
 *   materials or substances known by their CAS (V3-36), and, in a natural, what IFRA's annex
 *   says it brings: its own entry if it has one, or the most any entry with its CAS gives, as
 *   literature (V3-23, V3-28). Of two rows for one CAS, the most authoritative counts: the
 *   certificate of the user's bottle over the annex (V3-39). A molecule without components is
 *   itself; a natural, a composition, a provisional or a frozen formula without any is unknown,
 *   and leaves the check pending, never free (§3.4, §5.3).
 * - A figure of the literature or of consensus is never known: it counts its maximum in the
 *   worst case (V3-7). An «unknown» amount counts, at worst, the whole of its container.
 * - Members of one group (IFRA's standard, or «furocumarinas») with one ceiling add up against
 *   it; with several, each is a substance of a combined group, whose shares add up to at most 1.
 * - The user's version of a common material (V3-5) inherits what it is, its composition (each
 *   component by the most authoritative row) and its regulations.
 * - Only category 4 counts, or a rule for every category (plan, step 4.6).
 * - A limit expressed as a constituent (STD 089, 5-MOP) is that constituent's, and its members
 *   carry it as a component of unknown amount until a document gives it (V3-27).
 * - A substance IFRA prohibits as such but limits in naturals (V3-30): alone, prohibited; inside
 *   a natural, against the ceiling; put straight into anything else, pending.
 * - A standard that prohibits a variant (V3-31): the prohibited one is prohibited; the permitted
 *   one keeps its ceiling; one the data do not place carries a pending requirement.
 */

export const NO_DATA = "Sin datos de sus constituyentes: puede llevar sustancias con techo.";
export const CATEGORY = "4";

const RANK: Readonly<Record<Authority, number>> = { lot: 0, product: 1, ifra: 2, literature: 3, consensus: 4 };
const isPlaceholder = (authority: Authority) => authority === "literature" || authority === "consensus";
/** For comparing names and processes: no accents, no case. */
const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

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

/** The member a component is: a material of the catalog, or a substance by its CAS (or its name, without one). */
const childOf = (c: Component): string => c.componentId ?? (c.componentCas ? `cas:${c.componentCas}` : `name:${fold(c.componentName ?? "")}`);

/** A material with what it inherits from the common one it is based on (V3-5). */
export interface Effective {
  readonly material: CatalogMaterial;
  /** The material first, then the one it is based on, and so on. */
  readonly chain: readonly CatalogMaterial[];
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
      const before = best.get(childOf(component));
      if (!before || rank < before.rank || (rank === before.rank && depth < before.depth)) {
        best.set(childOf(component), { component, rank, depth });
      }
    }
  });
  return {
    material,
    chain,
    components: [...best.values()].map((b) => b.component),
    regulations: chain.flatMap((m) => m.regulations),
  };
}

/** What a member says to IFRA (V3-35): its CAS numbers, its species and process, its names. */
interface Identity {
  readonly cas: readonly string[];
  readonly species: string | null;
  readonly process: string | null;
  readonly names: readonly string[];
}

/** A member of a material's tree, with its IFRA read from the layer and its own regulations. */
interface Node {
  readonly id: string;
  readonly name: string;
  readonly kind: MaterialKind | "substance";
  readonly material: CatalogMaterial | null;
  readonly identity: Identity;
  readonly components: readonly Component[];
  readonly regulations: readonly Regulation[];
}

const applies = (r: Regulation) => r.category === null || r.category === CATEGORY;
const groupOf = (r: Regulation) => r.groupKey ?? `reg:${r.id}`;

/** V3-31: which variant a member is, by the first rule that matches its species or process. */
function variantOf(standard: IfraStandard, identity: Identity): "prohibited" | "permitted" | "unknown" {
  for (const rule of standard.variantRules) {
    const value = fold((rule.field === "species" ? identity.species : identity.process) ?? "");
    const pattern = fold(rule.pattern);
    if (value && (rule.match === "starts" ? value.startsWith(pattern) : value.includes(pattern))) return rule.variant;
  }
  return "unknown";
}

/** What IFRA's layer says of a member, as rows of its regulation (V3-25, V3-27, V3-30, V3-31). */
function ifraRegulations(layer: IfraLayer, identity: Identity): Regulation[] {
  const codes = new Set<string>();
  for (const cas of identity.cas) for (const code of layer.byCas.get(cas) ?? []) codes.add(code);
  for (const s of layer.standards.values()) if (s.limitExpressedAsCas && identity.cas.includes(s.limitExpressedAsCas)) codes.add(s.code);
  const out: Regulation[] = [];
  for (const code of [...codes].sort()) {
    const s = layer.standards.get(code)!;
    // V3-27: a limit expressed as a constituent is that constituent's, not its members'.
    if (s.limitExpressedAs && !(s.limitExpressedAsCas && identity.cas.includes(s.limitExpressedAsCas))) continue;
    const row = (kind: Regulation["kind"], extra: Partial<Regulation> = {}): Regulation => ({
      id: `ifra:${code}:${kind}:${extra.category ?? "all"}`,
      regime: "ifra",
      category: null,
      kind,
      maxValue: null,
      groupKey: s.groupKey,
      requirement: null,
      authority: "ifra",
      source: `IFRA ${s.amendment}, ${s.code}: ${s.name}`,
      ...extra,
    });
    const variant = s.variantRules.length > 0 ? variantOf(s, identity) : null;
    if (variant === "prohibited") {
      out.push(row("prohibited"));
      continue;
    }
    const limit = s.limits.get(CATEGORY);
    if (limit?.kind === "max") out.push(row("max", { category: CATEGORY, maxValue: limit.maxValue }));
    if (limit?.kind === "prohibited") out.push(row("prohibited", { category: CATEGORY }));
    // A prohibition with no limit in any category prohibits the member as such (with a specification, a variant of
    // it, as the cade: V3-25); one prohibited as such keeps its ceiling too (V3-30).
    if (s.prohibition && (s.limits.size === 0 || s.prohibitedAsSuch)) out.push(row("prohibited"));
    const process = fold(identity.process ?? "");
    if (s.specification && !s.specExclusions.some((x) => process.includes(fold(x.process)))) {
      out.push(row("requirement", { requirement: (s.specificationNote ?? s.name).trim() }));
    }
    if (variant === "unknown") {
      out.push(row("requirement", {
        id: `ifra:${code}:variant`,
        groupKey: `${s.groupKey} · variante`,
        requirement: `No es la variante prohibida: «${(s.prohibitionNote ?? "").trim()}»`,
      }));
    }
  }
  return out;
}

/** What IFRA's annex says a natural brings: its own entry, or the most any entry with its CAS gives, as literature. */
function annexOf(layer: IfraLayer, identity: Identity): Component[] {
  const entries = layer.annex.filter((e) => (e.naturalCas !== null && identity.cas.includes(e.naturalCas)) || e.naturalOtherCas.some((c) => identity.cas.includes(c)));
  if (entries.length === 0) return [];
  const names = [...new Set(entries.map((e) => e.naturalName))];
  // V3-23: its own entry is the one with its name, the first of its names IFRA uses; with none, borrowed (V3-28),
  // even when only one entry has its CAS (a tincture is not the absolute IFRA lists).
  // The brackets of an annex's name say no variant («Vetiver oil (all origins)», «… (Neroli and Neroli bigarade)»): it matches without them.
  const isName = (entry: string, name: string) => fold(name) === fold(entry) || fold(name) === fold(entry.replace(/\s*\([^)]*\)\s*$/, ""));
  const own = identity.names.map((n) => names.find((e) => isName(e, n))).find((e) => e !== undefined);
  const component = (e: (typeof entries)[number], authority: Authority, source: string): Component => ({
    id: `annex:${e.naturalName}:${e.constituentCas ?? e.constituentName}`,
    componentId: null,
    componentCas: e.constituentCas,
    componentName: e.constituentName,
    amount: e.concentration.isZero() ? { kind: "exact", value: e.concentration } : { kind: "max", value: e.concentration },
    authority,
    source,
  });
  if (own !== undefined) {
    return entries.filter((e) => e.naturalName === own).map((e) => component(e, "ifra", `IFRA, anexo de naturales: ${own}`));
  }
  // V3-28: borrowed from the other forms with its CAS, the most of each: literature, never «inside».
  const most = new Map<string, (typeof entries)[number]>();
  for (const e of entries) {
    const key = e.constituentCas ?? e.constituentName;
    const before = most.get(key);
    if (!before || e.concentration.cmp(before.concentration) > 0) most.set(key, e);
  }
  return [...most.values()].map((e) => component(e, "literature", `IFRA, anexo de naturales: prestada por CAS de «${e.naturalName}»`));
}

/** V3-27: a member of a standard limited as one of its constituents carries it, how much not known until a document says. */
function constituentsOf(layer: IfraLayer, identity: Identity): Component[] {
  const out: Component[] = [];
  for (const s of layer.standards.values()) {
    if (!s.limitExpressedAs || !s.limitExpressedAsCas) continue;
    if (!s.substances.some((x) => identity.cas.includes(x.cas))) continue;
    out.push({
      id: `limit:${s.code}`,
      componentId: null,
      componentCas: s.limitExpressedAsCas,
      componentName: s.limitExpressedAs,
      amount: { kind: "unknown" },
      authority: "ifra",
      source: `IFRA ${s.amendment}, ${s.code}: el límite es del ${s.limitExpressedAs} en el producto terminado (V3-27)`,
    });
  }
  return out;
}

/** The members of the catalog as IFRA reads them, each built once. */
function nodes(catalog: Catalog, layer: IfraLayer) {
  const cache = new Map<string, Node>();
  const names = new Map<string, string>();
  const casOfMaterial = (id: string): string | null => {
    for (let m = catalog.materials.get(id); m; m = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined) if (m.cas) return m.cas;
    return null;
  };

  const ofMaterial = (id: string): Node => {
    const { material, chain, components, regulations } = effective(catalog, id);
    const identity: Identity = {
      cas: [...new Set(chain.flatMap((m) => [...(m.cas ? [m.cas] : []), ...m.otherCas]))],
      species: chain.find((m) => m.species)?.species ?? null,
      process: chain.find((m) => m.process)?.process ?? null,
      names: [...new Set(chain.flatMap((m) => [m.name, ...m.aliases]))],
    };
    // Of two rows for one substance, the most authoritative; at the same authority, the material's own over IFRA's.
    const extra = [...(material.kind === "natural" ? annexOf(layer, identity) : []), ...constituentsOf(layer, identity)];
    const byCas = new Map<string, Component>();
    const rest: Component[] = [];
    for (const c of [...components, ...extra]) {
      const cas = c.componentId ? casOfMaterial(c.componentId) : c.componentCas;
      if (!cas) {
        rest.push(c);
        continue;
      }
      const before = byCas.get(cas);
      if (!before || RANK[c.authority] < RANK[before.authority]) byCas.set(cas, c);
    }
    for (const c of extra) if (c.componentCas && c.componentName && !names.has(c.componentCas)) names.set(c.componentCas, c.componentName);
    for (const c of components) if (c.componentCas && c.componentName && !names.has(c.componentCas)) names.set(c.componentCas, c.componentName);
    return {
      id,
      name: material.name,
      kind: material.kind,
      material,
      identity,
      components: [...byCas.values(), ...rest],
      regulations: [...ifraRegulations(layer, identity), ...regulations],
    };
  };

  const ofSubstance = (id: string): Node => {
    const cas = id.startsWith("cas:") ? id.slice(4) : null;
    const identity: Identity = { cas: cas ? [cas] : [], species: null, process: null, names: [] };
    return {
      id,
      name: (cas && names.get(cas)) ?? (cas ? `CAS ${cas}` : id.slice(5)),
      // Known only by a name, without a CAS (as «Sin identificar», V3-29): nothing can be checked of it, and it is never free (§1.4).
      kind: cas ? "substance" : "provisional",
      material: null,
      identity,
      components: [],
      regulations: ifraRegulations(layer, identity),
    };
  };

  return (id: string): Node => {
    const before = cache.get(id);
    if (before) return before;
    const node = catalog.materials.has(id) ? ofMaterial(id) : ofSubstance(id);
    cache.set(id, node);
    return node;
  };
}

/**
 * The members a material carries (itself included when it has regulations), why its list may be
 * incomplete, and which members arrive somewhere other than inside a natural (V3-30).
 */
function flatten(node: (id: string) => Node, rootId: string): { loads: Map<string, Load>; pending: string[]; outsideNaturals: Set<string> } {
  const loads = new Map<string, Load>();
  const pending = new Set<string>();
  const outsideNaturals = new Set<string>();
  const walk = (id: string, load: Load, seen: readonly string[]) => {
    if (seen.includes(id)) {
      throw new Error(`A material that contains itself: ${[...seen, id].join(" → ")}`);
    }
    const n = node(id);
    if (n.regulations.some(applies)) {
      const before = loads.get(id);
      loads.set(id, before ? plus(before, load) : load);
    }
    if (n.components.length === 0) {
      if (n.kind !== "molecule" && n.kind !== "substance") pending.add(NO_DATA);
      return;
    }
    for (const component of n.components) {
      if (n.kind !== "natural") outsideNaturals.add(childOf(component));
      walk(childOf(component), scale(loadOf(component), load), [...seen, id]);
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

/** The engine's IfraData for every material of the catalog, keyed by the material's id. */
export function toIfra(catalog: Catalog, layer: IfraLayer): IfraData {
  // Which ceilings each group has in IFRA's layer: one ceiling adds up against it; several make a combined group.
  const limitsOf = new Map<string, Set<string>>();
  for (const s of layer.standards.values()) {
    const limit = s.limits.get(CATEGORY);
    if (limit?.kind === "max" && limit.maxValue) limitsOf.set(s.groupKey, (limitsOf.get(s.groupKey) ?? new Set()).add(limit.maxValue.toString()));
  }
  const node = nodes(catalog, layer);
  const substances = new Map<string, IfraSubstance>();

  /** The engine's substance for a ceiling of IFRA on a member, registered once. */
  const ifraSubstance = (r: Regulation, member: Node): string => {
    const group = groupOf(r);
    const several = (limitsOf.get(group)?.size ?? 0) > 1;
    const key = several ? `std:${group}@${r.maxValue!.toString()}` : `std:${group}`;
    const before = substances.get(key);
    const cas = [...new Set([...(before?.cas ?? []), ...member.identity.cas])];
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
    const flat = flatten(node, material.id);
    const entries: Entry[] = [];
    const conditions: string[] = [];
    const assumed: string[] = [];
    const pending = [...flat.pending];
    for (const [memberId, load] of flat.loads) {
      const member = node(memberId);
      const asItself = memberId === material.id;
      const mine = member.regulations.filter(applies);
      const requirementsByGroup = new Map<string, Regulation[]>();
      for (const r of mine.filter((r) => r.kind === "requirement")) {
        requirementsByGroup.set(groupOf(r), [...(requirementsByGroup.get(groupOf(r)) ?? []), r]);
      }
      for (const r of mine) {
        if (r.kind === "max" && r.regime === "manufacturer") {
          // A manufacturer's ceiling is of its product: it counts what the product brings, reported apart (P62).
          const supplier = member.material?.supplier ?? member.material?.house ?? null;
          const key = `tope:${member.id}`;
          substances.set(key, {
            key,
            name: `${member.name} (tope de ${supplier ?? "su fabricante"})`,
            limit: r.maxValue!,
            amendment: "",
            supplier: supplier ?? "fabricante",
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

export function ifraCard(catalog: Catalog, layer: IfraLayer, id: string): IfraCardState {
  const node = nodes(catalog, layer);
  const own = node(id);
  if (own.kind === "provisional") return { state: "no-data" };
  const regulations = own.regulations.filter(applies);
  const requirements = regulations.filter((r) => r.kind === "requirement");
  const requirementGroups = new Set(requirements.map(groupOf));
  // «Prohibited» only for the prohibited variant: a prohibition whose group also allows a variant with a requirement is not this one's.
  if (regulations.some((r) => r.kind === "prohibited" && !requirementGroups.has(groupOf(r)))) return { state: "prohibited" };
  // V3-25: a requirement shows with its state, also next to a ceiling; of several standards, the least proven.
  const worst = [...requirementGroups]
    .map((group) => {
      const rows = requirements.filter((r) => groupOf(r) === group);
      return { requirement: requirementState(rows), what: rows.find((r) => r.requirement)?.requirement ?? "" };
    })
    .sort((a, b) => PROVEN.indexOf(a.requirement) - PROVEN.indexOf(b.requirement))[0];
  if (regulations.some((r) => r.kind === "max")) return worst ? { state: "ceiling", ...worst } : { state: "ceiling" };
  if (worst) return { state: "requirement", ...worst };
  const flat = flatten(node, id);
  if ([...flat.loads.keys()].some((member) => member !== id)) return { state: "by-constituents" };
  return flat.pending.includes(NO_DATA) ? { state: "no-data" } : { state: "no-standard" };
}
