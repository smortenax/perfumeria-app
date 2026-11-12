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
import { BASE_MODE, flattenTokens, modesOf, setTokenNaming, tokensToCss, type CssVarOf, type Token } from "../core/tokens";

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

  const library = makeLibrary(config.components);
  setTokenNaming(config.cssVarOf);
  const tokens = flattenTokens(config.tokens);
  const tokenMap = new Map(tokens.map((t) => [t.path, t.css]));
  const warnings = [...checkFichas(config.components, tokenMap), ...checkNaming(tokens)];

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
    modes: [BASE_MODE, ...modesOf(tokens)],
    css: tokensToCss(tokens) + (config.css ? `\n${config.css}` : ""),
    storageKey: config.app === "designboard" ? LEGACY_STORAGE_KEY : `${LEGACY_STORAGE_KEY}:${config.app}`,
    starter: config.starter ?? (() => blankComposition(config.label ?? config.app, config.app, background ?? "")),
    routes,
    screenSize: config.screenSize ?? { w: 1440, h: 900 },
    warnings,
  };
}

/** Token params whose default is not in the app's token file: the board would show them unset. */
export function checkFichas(defs: readonly ComponentDef[], tokenMap: ReadonlyMap<string, string>): string[] {
  const out: string[] = [];
  for (const def of defs) {
    for (const [key, p] of Object.entries(def.params)) {
      if (p.kind === "token" && p.default && !tokenMap.has(p.default)) {
        out.push(`${def.name} (${def.type}): el valor por defecto de «${key}», ${p.default}, no está en el archivo de tokens.`);
      }
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

export function blankComposition(name: string, tokens: string, background: string): Composition {
  return {
    version: 2,
    name,
    tokens,
    artboards: [{ id: "screen-1", name: "Pantalla · 1440", width: 1440, height: 900, x: 0, y: 0, background, layout: { mode: "free" }, children: [] }],
  };
}
