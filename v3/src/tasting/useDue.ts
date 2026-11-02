import type { Tastings } from "../db/tastings";
import { dueNowOf } from "./logic";
import { useNow } from "./useTastings";

/**
 * The moments due now, as every place counts them (audit F-05 L2: the badge said 3 strips while Catas
 * showed 6 moments): the sidebar's badge on «Evaluations» (V3-73) and Home.
 */
export function useDueNow(tastings: Tastings | null): ReturnType<typeof dueNowOf> {
  const open = !!tastings?.sessions.some((s) => !s.endedAt);
  const now = useNow(open);
  return tastings ? dueNowOf(tastings, now) : [];
}

export function useDueCount(tastings: Tastings | null): number {
  return useDueNow(tastings).length;
}
