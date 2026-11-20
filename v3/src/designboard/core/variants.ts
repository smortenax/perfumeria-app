// Copied from designboard 3f221ae (src/core/variants.ts), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { ComponentNode, NodePatch } from "./composition";
import { defaultParams, normaliseParams, type ComponentDef, type Library, type ParamDef, type ParamValue, type Params } from "./manifest";

/**
 * Variants and instance swap for components.
 *
 * A variant is a combination of values of the select params a ficha marks with `variant: true`
 * (Figma's variant properties). Nothing new is stored: the choice lives in the node's params, so
 * composition files stay version 2 and the app's component code is not touched.
 *
 * Swapping an instance replaces its component type with another and keeps what matches: position,
 * name, sizing, and every param the new component also has with a value it can take.
 */

export function slugName(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------------------------
// Variants

export type SelectDef = Extract<ParamDef, { kind: "select" }>;

export interface VariantProp {
  key: string;
  def: SelectDef;
}

/** The variant properties of a component, in the order its ficha lists them. */
export function variantProps(def: ComponentDef): VariantProp[] {
  return Object.entries(def.params).flatMap(([key, p]) => (p.kind === "select" && p.variant ? [{ key, def: p }] : []));
}

/** One combination of variant values, e.g. `{ variant: "quiet", size: "sm" }`. */
export interface VariantCombo {
  values: Record<string, string>;
  /** Readable name: the option labels joined with " · ". */
  label: string;
}

/** Every combination of the variant properties' options (the first property varies slowest). Empty when there are none. */
export function variantCombos(def: ComponentDef): VariantCombo[] {
  const props = variantProps(def);
  if (!props.length) return [];
  let combos: VariantCombo[] = [{ values: {}, label: "" }];
  for (const { key, def: sd } of props) {
    combos = combos.flatMap((c) => sd.options.map((o) => ({ values: { ...c.values, [key]: o.value }, label: c.label ? `${c.label} · ${o.label}` : o.label })));
  }
  return combos;
}

/** The combination a node's params are in right now. Missing or invalid values read as the ficha's default. */
export function currentVariant(def: ComponentDef, stored: Params | undefined): VariantCombo {
  const params = normaliseParams(def, stored);
  const values: Record<string, string> = {};
  const labels: string[] = [];
  for (const { key, def: sd } of variantProps(def)) {
    const opt = sd.options.find((o) => o.value === params[key]) ?? sd.options.find((o) => o.value === sd.default) ?? sd.options[0];
    values[key] = opt?.value ?? sd.default;
    if (opt) labels.push(opt.label);
  }
  return { values, label: labels.join(" · ") };
}

/** The params with a variant chosen. Only variant properties are touched, and only to values the ficha offers. */
export function withVariant(def: ComponentDef, stored: Params | undefined, values: Record<string, string>): Params {
  const params = normaliseParams(def, stored);
  for (const { key, def: sd } of variantProps(def)) {
    const v = values[key];
    if (v !== undefined && sd.options.some((o) => o.value === v)) params[key] = v;
  }
  return params;
}

// ---------------------------------------------------------------------------------------------
// Instance swap

/**
 * Whether `value` is something the target param can hold; returns the value to keep (clamped or
 * trimmed where that is honest) or undefined when it cannot be kept.
 */
export function fitValue(def: ParamDef, value: ParamValue | undefined): ParamValue | undefined {
  if (value === undefined) return undefined;
  switch (def.kind) {
    case "number":
      return typeof value === "number" && Number.isFinite(value) ? Math.min(def.max, Math.max(def.min, value)) : undefined;
    case "boolean":
      return typeof value === "boolean" ? value : undefined;
    case "text":
      return typeof value === "string" ? value : undefined;
    case "select":
      return typeof value === "string" && def.options.some((o) => o.value === value) ? value : undefined;
    case "token":
      // A token path belongs to a group when it starts with it: "color.surface.base" is in "color.surface".
      if (typeof value !== "string") return undefined;
      if (value === "") return def.none !== undefined ? value : undefined;
      return def.groups.some((g) => value === g || value.startsWith(`${g}.`)) ? value : undefined;
    case "slot": {
      if (typeof value !== "string") return undefined;
      if (def.accept === "svg" && value !== "" && !/^data:image\/svg|\.svg(\?|#|$)/i.test(value)) return undefined;
      return value;
    }
    case "families":
      return Array.isArray(value) && value.every((f) => typeof f === "object" && f && typeof f.color === "string" && typeof f.share === "number")
        ? (value as readonly { color: string; share: number }[]).slice(0, def.max)
        : undefined;
  }
}

export interface SwapReport {
  /** Labels (in the new component) of the params that kept their value. */
  kept: string[];
  /** Labels of the new component's params that start from its defaults. */
  reset: string[];
  /** Labels (in the old component) of params the new one cannot hold, so they were dropped. Empty when the old component is unknown. */
  dropped: string[];
}

export interface SwapResult {
  patch: NodePatch;
  report: SwapReport;
}

/** Whether a name is the one the board gave a fresh instance: the slug of the component's name plus a number. */
function isAutoName(name: string, def: ComponentDef | undefined, type: string): boolean {
  const bases = [slugName(type), def ? slugName(def.name) : ""].filter(Boolean);
  return bases.some((b) => new RegExp(`^${b}-\\d+$`).test(name));
}

/**
 * What changes when `node` becomes an instance of `to`. Pure: the caller applies the patch.
 * Kept: the layer's place, anchors and sizing; its name (unless the board named it after the old
 * component, then it follows the new one); every param whose key and kind match and whose value the
 * new ficha accepts. A layer still at the old component's default size takes the new default size;
 * a square component (the orb) becomes square.
 */
export function swapComponent(node: ComponentNode, from: ComponentDef | undefined, to: ComponentDef): SwapResult {
  const next = defaultParams(to);
  // What the old instance shows, defaults included, so a value it never changed still carries over.
  const old = from ? normaliseParams(from, node.params) : node.params;
  const kept: string[] = [];
  const dropped: string[] = [];
  const matched = new Set<string>();

  for (const [key, pd] of Object.entries(to.params)) {
    const was = from?.params[key];
    // Same key and the same kind of param. With the old ficha missing, the value itself has to fit.
    if (was && was.kind !== pd.kind) continue;
    const fit = fitValue(pd, old[key]);
    if (fit === undefined) continue;
    next[key] = fit;
    matched.add(key);
    kept.push(pd.label);
  }
  if (from) {
    for (const [key, pd] of Object.entries(from.params)) {
      if (!matched.has(key) && !sameValue(old[key], pd.default as ParamValue)) dropped.push(pd.label);
    }
  }
  const reset = Object.entries(to.params)
    .filter(([key]) => !matched.has(key))
    .map(([, pd]) => pd.label);

  const patch: NodePatch = { type: to.type, params: next };
  if (isAutoName(node.name, from, node.type)) {
    const n = node.name.match(/-(\d+)$/)?.[1];
    if (n) patch.name = `${slugName(to.name)}-${n}`;
  }
  let { w, h } = node;
  if (from && w === from.defaultSize.w && h === from.defaultSize.h) ({ w, h } = to.defaultSize);
  if (to.square) w = h = w === node.w && h === node.h ? Math.max(w, h) : w;
  if (w !== node.w || h !== node.h) Object.assign(patch, { w, h });
  return { patch, report: { kept, reset, dropped } };
}

function sameValue(a: ParamValue, b: ParamValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * The components a node can be swapped for, the ficha's preferred ones first and then every other
 * one in library order. The node's own type is left out.
 */
export function swapTargets(library: Library, type: string): { preferred: ComponentDef[]; others: ComponentDef[] } {
  const own = library.get(type);
  const preferred = (own?.swapWith ?? []).flatMap((t) => (t !== type && library.get(t) ? [library.get(t)!] : []));
  const others = [...library.values()].filter((d) => d.type !== type && !preferred.includes(d));
  return { preferred, others };
}

/** A one-line summary of a swap, for the notice the board shows. */
export function describeSwap(to: ComponentDef, report: SwapReport): string {
  const parts = [`Cambiado a «${to.name}».`];
  parts.push(report.kept.length ? `Se mantuvieron: ${report.kept.join(", ")}.` : "No había parámetros en común.");
  if (report.reset.length) parts.push(`Con valores de la ficha: ${report.reset.join(", ")}.`);
  if (report.dropped.length) parts.push(`Se perdieron: ${report.dropped.join(", ")}.`);
  return parts.join(" ");
}
