// Copied from designboard c0e1d34 (src/runtime/links.tsx), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

/**
 * How a linked image (`link:assets/vial.svg`, see `core/links.ts`) becomes something an
 * `<img>` can show. The board's desktop build supplies a store that reads the file and
 * watches it; an app passes `resolveLink` to `ComposedScreen`; with neither, the path is used
 * as an address relative to the page, which suits images in the app's public folder.
 */
export interface LinkResolver {
  /** The image address for a path, or "" while it is loading or missing. */
  resolve(path: string): string;
  /** Changes whenever something `resolve` returned may have changed. */
  subscribe(listener: () => void): () => void;
  version(): number;
  /** Desktop only: lets the person pick a file to link. Returns the path relative to the app's folder. */
  pick?(accept: "image" | "svg" | "any"): Promise<string | null>;
  /** Problem with a linked path (missing file…), if any. */
  problem?(path: string): string | null;
}

const PAGE_RELATIVE: LinkResolver = {
  resolve: (path) => path,
  subscribe: () => () => {},
  version: () => 0,
};

const LinkContext = createContext<LinkResolver>(PAGE_RELATIVE);

export function LinkProvider({ resolver, children }: { resolver: LinkResolver; children: ReactNode }) {
  return <LinkContext.Provider value={resolver}>{children}</LinkContext.Provider>;
}

/** The resolver in force, re-rendering the caller whenever a linked file changes. */
export function useLinks(): LinkResolver {
  const r = useContext(LinkContext);
  useSyncExternalStore(r.subscribe, r.version, r.version);
  return r;
}

/** A resolver from a plain function, for apps. */
export function resolverFrom(resolve: (path: string) => string): LinkResolver {
  return { resolve, subscribe: () => () => {}, version: () => 0 };
}
