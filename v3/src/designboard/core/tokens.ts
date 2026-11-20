// Copied from designboard 3f221ae (src/core/tokens.ts), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
/**
 * Reads a design-token file in the W3C DTCG shape (the one the design vault uses in
 * `50-tokens/products/*.json`) and turns it into a flat list the board can offer.
 *
 * The board never offers a raw value: every colour, size, radius or gap a person picks
 * is one of these tokens, so a tweak stays inside the product's system.
 */

export interface Token {
  /** Dotted path without the product root, e.g. "color.surface.base". */
  path: string;
  /** Resolved CSS value, e.g. "#e4e9ee", "16px" or "'Geist Mono', monospace". */
  css: string;
  /** The custom property that carries it, e.g. "--color-surface-base". */
  cssVar: string;
  description?: string;
  /**
   * Values that differ in other modes, resolved, keyed by mode name (e.g. `dark`). The base
   * value is the light mode. A token with no entry for a mode keeps its base value there.
   * Written in the file as `"$extensions": { "designboard": { "modes": { "dark": "#111" } } }`;
   * the value may be a `{reference}` like any other.
   */
  modes?: Record<string, string>;
  /** Set when the value's shape cannot be written as CSS; the board lists it among its warnings. */
  problem?: string;
}

/**
 * Turns a token path into the name of the custom property that carries it. The default writes
 * the path with dashes ("color.surface.raised" → "--color-surface-raised"); an app whose own
 * stylesheet names its tokens differently gives its rule in `designboard.config.ts` (`cssVarOf`),
 * so the board declares and reads the same names the app declares (e.g. "--surface-raised").
 */
export type CssVarOf = (path: string) => string;

export const defaultCssVarOf: CssVarOf = (path) => "--" + path.replace(/\./g, "-");

/**
 * The naming rule lives on the page (`globalThis`), not in this module, so there is one rule per
 * page however many copies of this file the page loads. An app keeps its own copy of the runtime
 * (`npm run copy-runtime`); when the board loads that app's config, the board's `setTokenNaming`
 * and the app's copy read and write the same rule.
 */
const NAMING = Symbol.for("designboard.tokenNaming");
type NamingHolder = { rule: CssVarOf };

function namingHolder(): NamingHolder {
  const g = globalThis as unknown as Record<symbol, NamingHolder | undefined>;
  return (g[NAMING] ??= { rule: defaultCssVarOf });
}

/**
 * Sets the naming rule `tokenVar` and `flattenTokens` use, for the whole page: the board calls it
 * once when it loads an app's config, and an app that draws compositions calls it once at start-up
 * with the same rule. Without an argument it goes back to the default.
 *
 * Components must call `tokenVar` while they render, never when their module loads: a value
 * computed at load keeps whatever rule was in force then.
 */
export function setTokenNaming(rule?: CssVarOf): void {
  namingHolder().rule = rule ?? defaultCssVarOf;
}

/** The custom property for a token path under the current naming rule. */
export function cssVarName(path: string): string {
  const name = namingHolder().rule(path);
  return name.startsWith("--") ? name : "--" + name;
}

/** The name of the base mode: what a token's `$value` means. */
export const BASE_MODE = "light";

type Raw = Record<string, unknown>;

function isLeaf(node: unknown): node is Raw & { $value: unknown } {
  return typeof node === "object" && node !== null && "$value" in node;
}

/** Rounds to at most three decimals, without trailing zeros. */
const num = (n: number) => String(Math.round(n * 1000) / 1000);

/** A DTCG dimension or duration: `{ value, unit }`, a plain number (px) or a string as written. */
function dimension(v: unknown): string | null {
  if (typeof v === "number") return v === 0 ? "0" : `${num(v)}px`;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "value" in v) {
    const d = v as { value: number; unit?: string };
    return `${num(d.value)}${d.unit ?? ""}`;
  }
  return null;
}

/**
 * A DTCG colour: a string as written (`#rrggbb`, `rgb()`…), or the 2025 object
 * `{ colorSpace, components, alpha?, hex? }`. sRGB components become `rgb()`; another colour space
 * becomes CSS `color()` with that space; a `hex` is used when there is no alpha to add.
 */
function color(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (!v || typeof v !== "object" || !("components" in v)) return null;
  const c = v as { colorSpace?: string; components: (number | "none")[]; alpha?: number; hex?: string };
  const alpha = c.alpha ?? 1;
  if (c.hex && alpha === 1) return c.hex;
  const comps = c.components.map((x) => (x === "none" ? 0 : x));
  const space = c.colorSpace ?? "srgb";
  if (space === "srgb") {
    const [r, g, b] = comps.map((x) => Math.round(x * 255));
    return alpha === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${num(alpha)})`;
  }
  const a = alpha === 1 ? "" : ` / ${num(alpha)}`;
  return `color(${space} ${comps.map(num).join(" ")}${a})`;
}

function cubicBezier(v: unknown): string | null {
  return Array.isArray(v) && v.length === 4 && v.every((x) => typeof x === "number") ? `cubic-bezier(${v.map(num).join(", ")})` : null;
}

function fontFamily(v: unknown): string {
  return Array.isArray(v) ? v.map((x) => (/\s/.test(String(x)) ? `'${x}'` : String(x))).join(", ") : String(v);
}

/** One DTCG shadow layer: `offsetX offsetY blur spread color`, with `inset` first when set. */
function shadowLayer(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const s = v as Record<string, unknown>;
  const parts = [dimension(s.offsetX ?? 0), dimension(s.offsetY ?? 0), dimension(s.blur ?? 0), dimension(s.spread ?? 0), color(s.color)];
  if (parts.some((p) => p === null)) return null;
  return (s.inset ? "inset " : "") + parts.join(" ");
}

const STROKE_STYLES = ["solid", "dashed", "dotted", "double", "groove", "ridge", "outset", "inset"];

/**
 * A token value as CSS, read by its DTCG `$type` where the shape alone is ambiguous (a list is a
 * font stack, a cubic Bézier or a list of shadows). Returns null for a shape it cannot write, so
 * the board can say so instead of drawing "[object Object]".
 */
function toCss(value: unknown, type?: string): string | null {
  // A string is CSS as written, whatever its type (an older file's "1px 2px 0 #0003" shadow).
  if (typeof value === "string") return value;
  switch (type) {
    case "shadow": {
      const layers = (Array.isArray(value) ? value : [value]).map(shadowLayer);
      return layers.every((l) => l !== null) ? layers.join(", ") : null;
    }
    case "border": {
      if (!value || typeof value !== "object" || Array.isArray(value)) break;
      const b = value as Record<string, unknown>;
      const width = dimension(b.width);
      const c = color(b.color);
      // A stroke style given as an object (dash array, line caps) has no CSS keyword: dashed is closest.
      const style = typeof b.style === "string" && STROKE_STYLES.includes(b.style) ? b.style : b.style ? "dashed" : "solid";
      return width !== null && c !== null ? `${width} ${style} ${c}` : null;
    }
    case "transition": {
      if (!value || typeof value !== "object" || Array.isArray(value)) break;
      const t = value as Record<string, unknown>;
      const duration = dimension(t.duration);
      const timing = cubicBezier(t.timingFunction) ?? (typeof t.timingFunction === "string" ? t.timingFunction : null);
      const delay = t.delay === undefined ? null : dimension(t.delay);
      return duration !== null && timing !== null ? [duration, timing, delay].filter(Boolean).join(" ") : null;
    }
    case "cubicBezier":
      return cubicBezier(value) ?? (typeof value === "string" ? value : null);
    case "color":
      return color(value);
    case "typography": {
      // As the `font` shorthand: style weight size/line-height family. Letter spacing has no place in it.
      if (!value || typeof value !== "object" || Array.isArray(value)) break;
      const t = value as Record<string, unknown>;
      const size = dimension(t.fontSize);
      if (size === null || t.fontFamily === undefined) return null;
      const lh = t.lineHeight === undefined ? "" : `/${typeof t.lineHeight === "number" ? num(t.lineHeight) : dimension(t.lineHeight)}`;
      return [t.fontStyle, t.fontWeight, `${size}${lh}`, fontFamily(t.fontFamily)].filter((x) => x !== undefined && x !== "").join(" ");
    }
  }
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.every((v) => typeof v === "string") ? fontFamily(value) : null;
  if (value && typeof value === "object") return dimension(value) ?? color(value);
  return null;
}

/** Flattens and resolves `{a.b.c}` references. The product root key (if there is one) is dropped. */
export function flattenTokens(file: Raw): Token[] {
  const keys = Object.keys(file).filter((k) => !k.startsWith("$"));
  const root = keys.length === 1 && !isLeaf(file[keys[0]]) ? (file[keys[0]] as Raw) : file;
  const rootName = root === file ? "" : keys[0];

  const raw = new Map<string, { value: unknown; type?: string; description?: string; modes?: Record<string, unknown> }>();
  // A group's `$type` holds for every token under it that names none of its own (DTCG).
  const walk = (node: unknown, path: string[], type?: string) => {
    if (typeof node !== "object" || node === null) return;
    const own = typeof (node as Raw).$type === "string" ? ((node as Raw).$type as string) : type;
    if (isLeaf(node)) {
      const ext = node.$extensions as { designboard?: { modes?: Record<string, unknown> } } | undefined;
      raw.set(path.join("."), { value: node.$value, type: own, description: node.$description as string | undefined, modes: ext?.designboard?.modes });
      return;
    }
    for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) walk(v, [...path, k], own);
  };
  walk(root, []);

  // References resolve inside composite values too: a shadow's colour may be `{color.ink}`.
  const resolve = (value: unknown, seen: Set<string>): unknown => {
    if (Array.isArray(value)) return value.map((v) => resolve(v, seen));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, seen)]));
    if (typeof value !== "string") return value;
    const m = /^\{([^}]+)\}$/.exec(value);
    if (!m) return value;
    let ref = m[1];
    if (rootName && ref.startsWith(rootName + ".")) ref = ref.slice(rootName.length + 1);
    if (seen.has(ref)) throw new Error(`Token reference cycle at ${ref}`);
    const target = raw.get(ref);
    if (!target) throw new Error(`Unknown token reference {${m[1]}}`);
    return resolve(target.value, new Set([...seen, ref]));
  };

  return [...raw.entries()].map(([path, { value, type, description, modes }]) => {
    const css = toCss(resolve(value, new Set([path])), type);
    const token: Token = {
      path,
      // A shape the board cannot write draws as unset, never as "[object Object]"; `problem` says why.
      css: css ?? "initial",
      cssVar: cssVarName(path),
      description,
    };
    if (css === null) token.problem = `${path}: el valor${type ? ` (${type})` : ""} no se puede escribir en CSS.`;
    if (modes && Object.keys(modes).length) {
      token.modes = Object.fromEntries(Object.entries(modes).map(([m, v]) => [m, toCss(resolve(v, new Set([path])), type) ?? "initial"]));
    }
    return token;
  });
}

/** Tokens whose path starts with one of the given groups, e.g. ["color.surface", "color.accent"]. */
export function tokensIn(tokens: readonly Token[], groups: readonly string[]): Token[] {
  return tokens.filter((t) => groups.some((g) => t.path === g || t.path.startsWith(g + ".")));
}

/** Every mode a token file defines besides the base, in first-seen order. */
export function modesOf(tokens: readonly Token[]): string[] {
  return [...new Set(tokens.flatMap((t) => Object.keys(t.modes ?? {})))];
}

/**
 * A stylesheet body that declares every token as a custom property, then one block per other
 * mode (`[data-mode="dark"]`) that redeclares only the tokens that change. A screen or container
 * with `data-mode="dark"` and everything inside it then read the dark values.
 */
export function tokensToCss(tokens: readonly Token[], selector = ":root"): string {
  const base = `${selector} {\n${tokens.map((t) => `  ${t.cssVar}: ${t.css};`).join("\n")}\n}`;
  // A file that names the base mode among its modes gets no second block for it.
  const modes = modesOf(tokens).filter((m) => m !== BASE_MODE);
  const blocks = modes.map((mode) => {
    const changed = tokens.filter((t) => t.modes?.[mode] !== undefined);
    return `[data-mode="${mode}"] {\n${changed.map((t) => `  ${t.cssVar}: ${t.modes![mode]};`).join("\n")}\n}`;
  });
  // The base mode by name, for a container set back to it inside one in another mode: it puts back
  // the base value of every token another mode changes.
  const varying = tokens.filter((t) => modes.some((m) => t.modes?.[m] !== undefined));
  const back = varying.length ? [`[data-mode="${BASE_MODE}"] {\n${varying.map((t) => `  ${t.cssVar}: ${t.css};`).join("\n")}\n}`] : [];
  return [base, ...back, ...blocks].join("\n");
}

/** `var(--…)` for a token path; unknown paths fall back to the given CSS so a stale file still draws. */
export function tokenVar(path: string | undefined, fallback = "initial"): string {
  return path ? `var(${cssVarName(path)}, ${fallback})` : fallback;
}

/** Token path → CSS value as a screen in the given mode draws it: the mode's own value where the token has one, else the base. */
export function tokenMapFor(tokens: readonly Token[], mode?: string): Map<string, string> {
  return new Map(tokens.map((t) => [t.path, (mode && t.modes?.[mode]) || t.css]));
}
