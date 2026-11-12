// Copied from designboard c0e1d34 (src/runtime/starter.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { Composition } from "../core/composition";

/**
 * The composition an app falls back to when it has no file yet, or its file cannot be read: the
 * same one the board starts from. Both read it from the app's `designboard.config.ts`
 * (`starter`), so the fallback is written once, in the app, and never copied by hand.
 */

/** One blank 1440×900 screen on the given ground (a colour token path, or "" for none). */
export function blankComposition(name: string, tokens: string, background: string): Composition {
  return {
    version: 2,
    name,
    tokens,
    artboards: [{ id: "screen-1", name: "Pantalla · 1440", width: 1440, height: 900, x: 0, y: 0, background, layout: { mode: "free" }, children: [] }],
  };
}

/** What a starter needs from an app's config (`BoardConfig` fits it). */
export interface StarterSource {
  app: string;
  label?: string;
  starter?: () => Composition;
  background?: string;
}

/**
 * The config's starter, or a blank screen named after the app. An app imports its own config and
 * passes it here for its fallback, e.g. `useComposition(url, { initial, fallback: starterComposition(config) })`.
 */
export function starterComposition(config: StarterSource): Composition {
  return config.starter?.() ?? blankComposition(config.label ?? config.app, config.app, config.background ?? "");
}
