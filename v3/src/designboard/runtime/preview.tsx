// Copied from designboard 3f221ae (src/runtime/preview.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * Whether components draw with their ficha's example data (`ComponentDef.preview`), and which
 * example. The board turns it on around its canvas and its app view; an app never does, so its
 * components read the app's own providers.
 */
const PreviewContext = createContext<{ sample: string } | null>(null);

export function PreviewProvider({ sample, children }: { sample: string; children: ReactNode }) {
  // The same object while the example is the same, so layers are not drawn again on every render above them.
  const value = useMemo(() => ({ sample }), [sample]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

/** The example picked on the board, or null outside it. */
export function usePreview(): { sample: string } | null {
  return useContext(PreviewContext);
}
