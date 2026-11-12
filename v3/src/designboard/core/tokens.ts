// Copied from designboard c0e1d34 (src/core/tokens.ts), runtime 1.0.
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

function toCss(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map((v) => (/\s/.test(String(v)) ? `'${v}'` : String(v))).join(", ");
  if (value && typeof value === "object" && "value" in value) {
    const d = value as { value: number; unit?: string };
    return `${d.value}${d.unit ?? ""}`;
  }
  return String(value);
}

/** Flattens and resolves `{a.b.c}` references. The product root key (if there is one) is dropped. */
export function flattenTokens(file: Raw): Token[] {
  const keys = Object.keys(file).filter((k) => !k.startsWith("$"));
  const root = keys.length === 1 && !isLeaf(file[keys[0]]) ? (file[keys[0]] as Raw) : file;
  const rootName = root === file ? "" : keys[0];

  const raw = new Map<string, { value: unknown; description?: string; modes?: Record<string, unknown> }>();
  const walk = (node: unknown, path: string[]) => {
    if (isLeaf(node)) {
      const ext = node.$extensions as { designboard?: { modes?: Record<string, unknown> } } | undefined;
      raw.set(path.join("."), { value: node.$value, description: node.$description as string | undefined, modes: ext?.designboard?.modes });
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) walk(v, [...path, k]);
  };
  walk(root, []);

  const resolve = (value: unknown, seen: Set<string>): unknown => {
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

  return [...raw.entries()].map(([path, { value, description, modes }]) => {
    const token: Token = {
      path,
      css: toCss(resolve(value, new Set([path]))),
      cssVar: cssVarName(path),
      description,
    };
    if (modes && Object.keys(modes).length) {
      token.modes = Object.fromEntries(Object.entries(modes).map(([m, v]) => [m, toCss(resolve(v, new Set([path])))]));
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
  const blocks = modesOf(tokens).map((mode) => {
    const changed = tokens.filter((t) => t.modes?.[mode] !== undefined);
    return `[data-mode="${mode}"] {\n${changed.map((t) => `  ${t.cssVar}: ${t.modes![mode]};`).join("\n")}\n}`;
  });
  return [base, ...blocks].join("\n");
}

/** `var(--…)` for a token path; unknown paths fall back to the given CSS so a stale file still draws. */
export function tokenVar(path: string | undefined, fallback = "initial"): string {
  return path ? `var(${cssVarName(path)}, ${fallback})` : fallback;
}

/** Token path → CSS value as a screen in the given mode draws it: the mode's own value where the token has one, else the base. */
export function tokenMapFor(tokens: readonly Token[], mode?: string): Map<string, string> {
  return new Map(tokens.map((t) => [t.path, (mode && t.modes?.[mode]) || t.css]));
}
