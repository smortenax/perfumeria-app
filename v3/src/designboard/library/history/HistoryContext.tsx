import { createContext, useContext, type ReactNode } from "react";
import type { HistoryData } from "./history";

/**
 * The history's data and callbacks, shared by the three pieces wherever the composition puts
 * them. In the app, the HistoryDock wrapper provides it; on the board, the fichas' preview does,
 * with example data.
 */
const HistoryContext = createContext<HistoryData | null>(null);

export function HistoryProvider({ value, children }: { value: HistoryData; children: ReactNode }) {
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

/** The history around a piece, or null when nothing provides one (the piece then draws nothing). */
export function useHistoryData(): HistoryData | null {
  return useContext(HistoryContext);
}
