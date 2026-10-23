import type { Tastings } from "../db/tastings";
import { dueMoments } from "./logic";
import { useNow } from "./useTastings";
import { DEFAULT_MOMENTS } from "./vocabulary";

/** How many strips of the open session have a moment due now: the sidebar's badge on «Evaluations» (V3-73). */
export function useDueCount(tastings: Tastings | null): number {
  const session = tastings?.sessions.find((s) => !s.endedAt) ?? null;
  const strips = session && tastings ? tastings.strips.filter((s) => s.sessionId === session.id && !s.closedAt) : [];
  const now = useNow(strips.length > 0);
  return strips.filter((s) => {
    const written = tastings!.moments.filter((m) => m.stripId === s.id).map((m) => m.moment);
    if (!written.includes("t0")) return false;
    return dueMoments(s, written, DEFAULT_MOMENTS.filter((m) => m !== "t0"), now).some((d) => d.state === "due");
  }).length;
}
