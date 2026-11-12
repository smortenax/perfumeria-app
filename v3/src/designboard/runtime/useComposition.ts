// Copied from designboard 4aa3488 (src/runtime/useComposition.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { clampComposition, parseComposition, runtimeMismatch, type Composition } from "../core/composition";
import type { Library } from "../core/manifest";

/**
 * How an app gets its composition. In production it is the file imported at build time
 * (`initial`). In development it can also follow the file live: give `url` (the address the dev
 * server serves the file at) and every save from the board shows in the app within a second,
 * with no build, commit or deploy.
 *
 *   import saved from "../designboard.composition.json";
 *   import config from "../designboard.config";
 *   const { composition } = useComposition(import.meta.env.DEV ? "/designboard.composition.json" : null, {
 *     initial: saved, fallback: () => starterComposition(config), library,
 *   });
 */

export interface CompositionState {
  /** The last composition read without errors, or null before the first one. */
  composition: Composition | null;
  /** Why the last read failed (missing file, broken JSON…); the last good composition stays. */
  error: string | null;
}

const EMPTY: CompositionState = { composition: null, error: null };

export interface SourceOptions {
  /** Brings every param inside its ficha's limits, as the board does when it opens a file. */
  library?: Library;
  /** How often to look at the file while watching, in ms. Default 1000. */
  interval?: number;
  /** Reads the file's text; `fetch` without caching by default. Tests pass their own. */
  fetchText?: (url: string) => Promise<string>;
}

async function fetchNoStore(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`No encuentro ${url} (${res.status}).`);
  return res.text();
}

/** Reads text into a composition: checked, migrated and clamped to the fichas' limits when a library is given. */
export function readComposition(input: unknown, library?: Library): Composition {
  const c = parseComposition(input);
  return library ? clampComposition(c, library) : c;
}

/**
 * A composition file followed at an address: read once, then again every `interval` ms and when
 * the window regains focus, while started. Only a change in the file's text causes a new
 * composition, so components keep their state between polls.
 */
export class CompositionSource {
  private state: CompositionState = EMPTY;
  private text: string | null = null;
  private listeners = new Set<() => void>();
  private busy = false;
  private readonly fetchText: (url: string) => Promise<string>;

  constructor(
    readonly url: string,
    private readonly options: SourceOptions = {},
  ) {
    this.fetchText = options.fetchText ?? fetchNoStore;
  }

  get = (): CompositionState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(next: CompositionState) {
    if (next.composition === this.state.composition && next.error === this.state.error) return;
    this.state = next;
    for (const l of this.listeners) l();
  }

  /** Reads the file now. Resolves once read, whether or not it changed. */
  async refresh(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const text = await this.fetchText(this.url);
      if (text === this.text && !this.state.error) return;
      this.text = text;
      this.set({ composition: readComposition(text, this.options.library), error: null });
    } catch (err) {
      this.set({ composition: this.state.composition, error: (err as Error).message ?? String(err) });
    } finally {
      this.busy = false;
    }
  }

  /** Reads now and, with `watch`, keeps reading. Returns the function that stops it. */
  start(watch = true): () => void {
    void this.refresh();
    if (!watch || typeof window === "undefined") return () => {};
    const tick = () => void this.refresh();
    const timer = window.setInterval(tick, Math.max(100, this.options.interval ?? 1000));
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }
}

export interface UseCompositionOptions extends SourceOptions {
  /** The file imported at build time (a JSON module or its text): what production draws. */
  initial?: unknown;
  /** What to draw when there is no `initial`, or it cannot be read, until the live file arrives (`starterComposition`). */
  fallback?: Composition | (() => Composition);
  /** Keep reading the file at `url` after the first read. Default true. */
  watch?: boolean;
}

export interface UseCompositionResult {
  /** What to draw: the live file once read, else `initial`, else `fallback`; null with none of them. */
  composition: Composition | null;
  /** The latest problem reading the live file or `initial`, for a quiet note in development. */
  error: string | null;
  /** Set when the file was written by another runtime version than this copy (`runtimeMismatch`). */
  warning: string | null;
  /** Whether `composition` comes from the live file. */
  live: boolean;
}

const noSubscribe = () => () => {};
const emptyState = () => EMPTY;

/**
 * The composition an app draws, from its build-time file and, when `url` is given, the same file
 * followed live (see the module's note). Pass `null` as `url` in production.
 */
export function useComposition(url: string | null | undefined, options: UseCompositionOptions = {}): UseCompositionResult {
  const { initial, fallback, library, interval, fetchText, watch = true } = options;
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const base = useMemo(() => {
    const fall = () => {
      const f = fallbackRef.current;
      return (typeof f === "function" ? f() : f) ?? null;
    };
    if (initial === undefined || initial === null) return { composition: fall(), error: null };
    try {
      return { composition: readComposition(initial, library), error: null };
    } catch (err) {
      return { composition: fall(), error: (err as Error).message };
    }
  }, [initial, library]);

  const source = useMemo(
    () => (url ? new CompositionSource(url, { library, interval, fetchText }) : null),
    // fetchText is for tests; a new function each render must not restart the source.
    [url, library, interval],
  );
  const live = useSyncExternalStore(source?.subscribe ?? noSubscribe, source?.get ?? emptyState, source?.get ?? emptyState);
  useEffect(() => source?.start(watch), [source, watch]);

  const composition = live.composition ?? base.composition;
  const warning = composition ? runtimeMismatch(composition) : null;
  useEffect(() => {
    if (warning) console.warn(`[designboard] ${warning}`);
  }, [warning]);

  return { composition, error: live.error ?? base.error, warning, live: !!live.composition };
}
