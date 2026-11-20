// Copied from designboard 3f221ae (src/adapter/config.ts), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
/**
 * The contract an app fills in to bring its own components to the board.
 *
 * An app puts a `designboard.config.ts` next to its code. It imports the app's fichas and
 * its token file and hands them over with `defineBoardConfig`. Designboard loads that file
 * through the `@app-config` alias (see `vite.config.ts`); without one it loads this repo's
 * own `src/designboard.config.ts`, which serves `src/library/`.
 *
 * Inside an app's config and fichas, import Designboard's types from `@designboard/…`
 * (an alias for this repo's `src/`), e.g. `import type { ComponentDef } from "@designboard/core/manifest"`.
 */
import type { Composition } from "../core/composition";
import { makeLibrary, type ComponentDef, type Library } from "../core/manifest";
import { extractHashRoutes, type RouteDef } from "../core/screenMap";
import { blankComposition } from "../runtime/starter";
import { BASE_MODE, flattenTokens, modesOf, setTokenNaming, tokensIn, tokenVar, tokensToCss, type CssVarOf, type Token } from "../core/tokens";

export interface BoardConfig {
  /** Short id of the app, e.g. "perfumeria". Names the saved work so two apps never share it. */
  app: string;
  /** Name shown in the board's top bar, e.g. "Perfumería". */
  label?: string;
  /** The app's fichas: every component the board may place. */
  components: readonly ComponentDef[];
  /** The app's design-token file in the W3C DTCG shape (the vault's `50-tokens/products/*.json`). */
  tokens: Record<string, unknown>;
  /**
   * How the app names its tokens as CSS custom properties, when not the default
   * ("color.surface.raised" → "--color-surface-raised"). Perfumería, for one, writes
   * "--surface-raised" and "--size-text-md". The board then declares and reads the app's own
   * names, so a component draws the same on the board and in the app. The app's runtime calls
   * `setTokenNaming` with the same rule.
   */
  cssVarOf?: CssVarOf;
  /** Extra CSS the components need around them, such as custom properties that alias tokens. Tokens only, no raw values. */
  css?: string;
  /** Composition to start from when nothing is saved yet. Without one the board opens a blank screen. */
  starter?: () => Composition;
  /** The app's screens as routes, for the screen map. Listed by hand; merged with `routesFrom`. */
  routes?: readonly RouteDef[];
  /** Source text of the app's router (import it with `?raw`); its hash routes become screens too. */
  routesFrom?: string;
  /** Size of the screens the screen map makes. Web apps default to 1440×900. */
  screenSize?: { w: number; h: number };
  /** Colour token path for a blank screen's ground. Without one, the first colour token is used. */
  background?: string;
  /**
   * What the app's root (its `body`) gives every component by inheritance, so a component that
   * sets no font, ink or line height of its own draws on the board as it does in the app. Without
   * it, a screen starts from the browser's defaults, never from the editor's own look.
   */
  root?: AppRoot;
  /**
   * The app's fonts, so the board draws with the faces the app loads: each family name as the
   * token file writes it, with the CSS that loads it, the same package the app imports (import its
   * CSS with `?inline`, e.g. `import body from "@fontsource-variable/atkinson-hyperlegible-next?inline"`).
   * The board declares those faces under the token's name, so a package's own name for them
   * ("… Variable") does not matter. Exports embed what a layer uses.
   */
  fonts?: Readonly<Record<string, string>>;
}

/**
 * The `@font-face` rules of each font's CSS with their family renamed to the token's family name.
 * Only the `font-family` inside `@font-face` blocks changes; sources, weights and ranges stay.
 */
export function fontFaceCss(fonts: Readonly<Record<string, string>> | undefined): string {
  if (!fonts) return "";
  return Object.entries(fonts)
    .map(([family, css]) => {
      const name = `'${family.replace(/'/g, "\\'")}'`;
      return css.replace(/@font-face\s*\{[^}]*\}/g, (block) => block.replace(/font-family\s*:[^;}]*/g, `font-family: ${name}`));
    })
    .join("\n");
}

/** The inherited text styles of an app's root: token paths, and the app's own line height. */
export interface AppRoot {
  /** Font family token, e.g. "font.family.body". */
  font?: string;
  /** Font size token. */
  size?: string;
  /** Text colour token, e.g. "color.text.default". */
  color?: string;
  /** The unitless line height the app's root sets (no token group exists for it yet). */
  lineHeight?: number;
}

/**
 * The element that stands for the app's body: a screen's content on the board and Vista app's
 * screen carry it. The editor's element rules skip what is inside it (src/styles.css).
 */
export const APP_ROOT_ATTR = "data-app-root";

/** CSS for the app's root styles, and the warnings for token paths the file lacks. */
export function appRootCss(root: AppRoot | undefined, tokenMap: ReadonlyMap<string, string>): { css: string; warnings: string[] } {
  if (!root) return { css: "", warnings: [] };
  const warnings: string[] = [];
  const decls: string[] = [];
  const token = (prop: string, key: "font" | "size" | "color") => {
    const path = root[key];
    if (!path) return;
    if (!tokenMap.has(path)) warnings.push(`La raíz de la app usa ${path}, que no está en el archivo de tokens.`);
    else decls.push(`${prop}: ${tokenVar(path)};`);
  };
  token("font-family", "font");
  token("font-size", "size");
  token("color", "color");
  if (root.lineHeight !== undefined) decls.push(`line-height: ${root.lineHeight};`);
  return { css: decls.length ? `[${APP_ROOT_ATTR}] { ${decls.join(" ")} }` : "", warnings };
}

/** Identity function that gives an app's config file its type checking. */
export function defineBoardConfig(config: BoardConfig): BoardConfig {
  return config;
}

/** What the board works with once a config is read. */
export interface LoadedConfig {
  app: string;
  label: string;
  library: Library;
  tokens: Token[];
  tokenMap: ReadonlyMap<string, string>;
  /** Modes the token file offers, the base (light) first. */
  modes: string[];
  /** Custom properties for every token, plus the config's own CSS. */
  css: string;
  /** localStorage key for this app's work in progress. */
  storageKey: string;
  starter: () => Composition;
  /** Routes of the app, for the screen map; empty when the config gives none. */
  routes: RouteDef[];
  /** Size of the screens the screen map makes. */
  screenSize: { w: number; h: number };
  /** Problems worth telling the person about; the board still opens. */
  warnings: string[];
}

/** The key the board used before configs existed; the default config keeps it so saved work is not lost. */
export const LEGACY_STORAGE_KEY = "designboard.composition.v1";

export function loadConfig(config: BoardConfig): LoadedConfig {
  if (!config.app || !/^[a-z0-9][a-z0-9-]*$/.test(config.app)) {
    throw new Error(`designboard.config: "app" must be a short id in lower case (letters, digits, dashes); got "${config.app}".`);
  }
  if (!config.components?.length) throw new Error("designboard.config: \"components\" is empty; the board needs at least one ficha.");

  setTokenNaming(config.cssVarOf);
  const tokens = flattenTokens(config.tokens);
  const tokenMap = new Map(tokens.map((t) => [t.path, t.css]));
  const components = config.components.map((def) => fitBoardDefaults(def, tokens));
  const library = makeLibrary(components);
  const root = appRootCss(config.root, tokenMap);
  const warnings = [...checkFichas(components, tokenMap), ...checkNaming(tokens), ...tokens.flatMap((t) => (t.problem ? [t.problem] : [])), ...root.warnings];

  const background = config.background ?? tokens.find((t) => t.path.startsWith("color."))?.path;
  if (config.background && !tokenMap.has(config.background)) warnings.push(`El fondo "${config.background}" no está en el archivo de tokens.`);
  if (!config.starter && !background) warnings.push("No hay ningún token de color para el fondo de una pantalla nueva.");

  const routes: RouteDef[] = [...(config.routes ?? [])];
  for (const r of config.routesFrom ? extractHashRoutes(config.routesFrom) : []) {
    if (!routes.some((x) => x.path === r.path)) routes.push(r);
  }

  return {
    app: config.app,
    label: config.label ?? config.app,
    library,
    tokens,
    tokenMap,
    modes: [BASE_MODE, ...modesOf(tokens).filter((m) => m !== BASE_MODE)],
    css: [fontFaceCss(config.fonts), tokensToCss(tokens), root.css, config.css ?? ""].filter(Boolean).join("\n"),
    storageKey: config.app === "designboard" ? LEGACY_STORAGE_KEY : `${LEGACY_STORAGE_KEY}:${config.app}`,
    starter: config.starter ?? (() => blankComposition(config.label ?? config.app, config.app, background ?? "")),
    routes,
    screenSize: config.screenSize ?? { w: 1440, h: 900 },
    warnings,
  };
}

/**
 * The board's own fichas (`source: "designboard"`, such as the Panel) serve every app, so their
 * token defaults are only a guess at the app's names. One the app's file lacks becomes the first
 * token of the param's groups, or the empty choice when the param has one and the groups are
 * empty. An app's own fichas are left alone: a wrong default there is the ficha's mistake, and
 * `checkFichas` reports it.
 */
export function fitBoardDefaults(def: ComponentDef, tokens: readonly Token[]): ComponentDef {
  if (def.source !== "designboard") return def;
  let changed = false;
  const params = Object.fromEntries(
    Object.entries(def.params).map(([key, p]) => {
      if (p.kind !== "token" || !p.default || tokens.some((t) => t.path === p.default)) return [key, p];
      const first = tokensIn(tokens, p.groups)[0]?.path;
      const fallback = first ?? (p.none !== undefined ? "" : p.default);
      if (fallback === p.default) return [key, p];
      changed = true;
      return [key, { ...p, default: fallback }];
    }),
  );
  return changed ? { ...def, params } : def;
}

/**
 * What a ficha gets wrong that the board can see from its params alone: token defaults missing from
 * the file or outside their own groups, numbers outside their limits, selects without their default,
 * slots that ship an image. The board shows these in its top bar; tests can assert none.
 */
export function checkFichas(defs: readonly ComponentDef[], tokenMap: ReadonlyMap<string, string>): string[] {
  const out: string[] = [];
  for (const def of defs) {
    for (const [key, p] of Object.entries(def.params)) {
      const where = `${def.name} (${def.type}): «${key}»`;
      if (p.kind === "token") {
        if (p.default && !tokenMap.has(p.default)) out.push(`${def.name} (${def.type}): el valor por defecto de «${key}», ${p.default}, no está en el archivo de tokens.`);
        else if (p.default && !p.groups.some((g) => p.default === g || p.default.startsWith(g + "."))) out.push(`${where}: ${p.default} no está en sus grupos (${p.groups.join(", ")}).`);
        if (!p.default && p.none === undefined) out.push(`${where}: sin valor por defecto y sin opción vacía.`);
      }
      if (p.kind === "number" && !(p.min <= p.default && p.default <= p.max)) out.push(`${where}: ${p.default} está fuera de ${p.min}–${p.max}.`);
      if (p.kind === "select" && !p.options.some((o) => o.value === p.default)) out.push(`${where}: ${p.default} no es una de sus opciones.`);
      // An image or icon is the owner's: a ficha never ships one of its own (CLAUDE.md).
      if (p.kind === "slot" && p.default) out.push(`${where}: un hueco empieza vacío; la imagen la pone el dueño.`);
    }
  }
  return out;
}

/** Two tokens the naming rule gives the same custom property: one would hide the other. */
export function checkNaming(tokens: readonly Token[]): string[] {
  const seen = new Map<string, string>();
  const out: string[] = [];
  for (const t of tokens) {
    const other = seen.get(t.cssVar);
    if (other) out.push(`${other} y ${t.path} se llaman igual en CSS (${t.cssVar}); revisa cssVarOf.`);
    else seen.set(t.cssVar, t.path);
  }
  return out;
}

/** Kept here for the board's callers; the runtime owns it so an app's copy has it too. */
export { blankComposition };
