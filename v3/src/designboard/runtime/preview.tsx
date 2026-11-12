import { createContext, useContext, type ReactNode } from "react";

/**
 * Whether components draw with their ficha's example data (`ComponentDef.preview`), and which
 * example. The board turns it on around its canvas and its app view; an app never does, so its
 * components read the app's own providers.
 */
const PreviewContext = createContext<{ sample: string } | null>(null);

export function PreviewProvider({ sample, children }: { sample: string; children: ReactNode }) {
  return <PreviewContext.Provider value={{ sample }}>{children}</PreviewContext.Provider>;
}

/** The example picked on the board, or null outside it. */
export function usePreview(): { sample: string } | null {
  return useContext(PreviewContext);
}
