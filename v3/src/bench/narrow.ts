import { useEffect, useState } from "react";

/** A phone's width (plan 8.6): the bench's own breakpoint, the one bench.css uses. */
export const NARROW = "(max-width: 40rem)";

/** Whether the screen matches a media query, following it as it changes (a phone turned, a window narrowed). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}
