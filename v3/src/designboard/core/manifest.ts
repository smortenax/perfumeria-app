import type { ComponentType, ReactNode } from "react";

/**
 * The "ficha" of a component: what the board needs to place it and edit it without
 * touching its code. Any component, from any app, that comes with one of these can be
 * used on the board. Think of it as the public fields of a game object: the board edits
 * the fields, the component's code stays as it is.
 */

export type ParamDef =
  | { kind: "number"; label: string; min: number; max: number; step?: number; default: number; unit?: string; help?: string }
  | { kind: "boolean"; label: string; default: boolean; help?: string }
  | { kind: "text"; label: string; default: string; multiline?: boolean; help?: string }
  | {
      kind: "select";
      label: string;
      options: readonly { value: string; label: string }[];
      default: string;
      help?: string;
      /**
       * Marks the select as a variant property, like Figma's `size=small` or `state=hover`: the
       * inspector lists it first, apart from the other params. The values stay ordinary params,
       * so the composition file needs nothing new.
       */
      variant?: boolean;
    }
  /** A design token from the given groups, e.g. ["color.surface"]. Stores the token path, never a raw value. */
  | { kind: "token"; label: string; groups: readonly string[]; default: string; help?: string }
  /**
   * A place for an image or vector the person supplies (a background, an icon, an illustration).
   * Stores a data URL or a path; empty shows a labelled placeholder.
   */
  | { kind: "slot"; label: string; accept: "image" | "svg" | "any"; default: string; help?: string }
  /** A list of colour + share pairs (used by the orb's families). */
  | { kind: "families"; label: string; max: number; default: readonly { color: string; share: number }[]; help?: string };

export type ParamValue = number | boolean | string | readonly { color: string; share: number }[];
export type Params = Record<string, ParamValue>;

export interface ComponentDef<P extends Params = Params> {
  /** Stable id, used in composition files: "orb", "button", "slot-image"… */
  type: string;
  name: string;
  /** Where it comes from, e.g. "perfumeria-app" or "designboard". */
  source: string;
  description?: string;
  params: Record<keyof P & string, ParamDef>;
  /** Size it gets when dropped on the board, in CSS pixels. */
  defaultSize: { w: number; h: number };
  /** Keep width and height equal (the orb). */
  square?: boolean;
  /** Types of components the inspector offers first when this one is swapped for another (Figma's preferred instances). */
  swapWith?: readonly string[];
  /**
   * What the component needs around it to draw on the board, where the app is not running: a
   * provider with example data, for a component that reads its data from the app (a React
   * context) rather than from its params. Only the board uses it; an app draws the component
   * inside its own providers. `sample` is the example the board's top bar picks, one of `samples`.
   */
  preview?: ComponentPreview;
  /** The real component. It gets its params plus the size the board gives it. */
  render: ComponentType<{ params: P; width: number; height: number; /** The element's name, shown in empty slots. */ name?: string }>;
}

export interface ComponentPreview {
  /** The examples the board offers, the first by default. Fichas that share a provider share these values. */
  samples?: readonly { value: string; label: string }[];
  Wrap: ComponentType<{ children: ReactNode; sample: string }>;
}

export function defaultParams(def: ComponentDef): Params {
  const out: Params = {};
  for (const [key, p] of Object.entries(def.params)) out[key] = p.default as ParamValue;
  return out;
}

/**
 * A stored value brought inside what its param allows: a number into its min and max (and onto
 * its step), an option the select offers, a value of the right type. A file edited by hand, or
 * written before a ficha tightened a limit, could otherwise leave a chip at 10 px, below the
 * accessibility floor its ficha keeps. Anything unusable falls back to the default.
 */
export function clampParam(def: ParamDef, value: unknown): ParamValue {
  switch (def.kind) {
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) return def.default;
      let v = Math.min(def.max, Math.max(def.min, value));
      if (def.step) {
        const decimals = (String(def.step).split(".")[1] ?? "").length;
        v = Number((def.min + Math.round((v - def.min) / def.step) * def.step).toFixed(decimals));
        v = Math.min(def.max, Math.max(def.min, v));
      }
      return v;
    }
    case "boolean":
      return typeof value === "boolean" ? value : def.default;
    case "select":
      return typeof value === "string" && def.options.some((o) => o.value === value) ? value : def.default;
    case "text":
    case "token":
    case "slot":
      return typeof value === "string" ? value : def.default;
    case "families": {
      if (!Array.isArray(value)) return def.default;
      const ok = value.filter((f): f is { color: string; share: number } => !!f && typeof f.color === "string" && typeof f.share === "number" && Number.isFinite(f.share));
      return ok.slice(0, def.max).map((f) => ({ color: f.color, share: Math.max(0, f.share) }));
    }
  }
}

/**
 * Fills params a stored node is missing (the component gained a field), drops ones it no longer
 * has, and brings each stored value inside its param's limits (`clampParam`).
 */
export function normaliseParams(def: ComponentDef, stored: Params | undefined): Params {
  const out = defaultParams(def);
  if (stored) for (const [key, p] of Object.entries(def.params)) if (key in stored) out[key] = clampParam(p, stored[key]);
  return out;
}

/**
 * The stored params of a node with every value it has brought inside its limits; keys it lacks
 * stay absent and keys the ficha no longer has are kept, so a file only changes where a value was
 * out of bounds. The board runs it over a composition when it loads one. Returns `stored` itself
 * when nothing changed.
 */
export function clampStoredParams(def: ComponentDef, stored: Params): Params {
  let out: Params | null = null;
  for (const [key, p] of Object.entries(def.params)) {
    if (!(key in stored)) continue;
    const v = clampParam(p, stored[key]);
    if (JSON.stringify(v) !== JSON.stringify(stored[key])) (out ??= { ...stored })[key] = v;
  }
  return out ?? stored;
}

export type Library = ReadonlyMap<string, ComponentDef>;

export function makeLibrary(defs: readonly ComponentDef[]): Library {
  const map = new Map<string, ComponentDef>();
  for (const d of defs) {
    if (map.has(d.type)) throw new Error(`Two components share the type "${d.type}"`);
    map.set(d.type, d);
  }
  return map;
}
