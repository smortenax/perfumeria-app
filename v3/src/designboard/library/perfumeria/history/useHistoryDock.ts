// Copied from designboard 4aa3488 (src/library/perfumeria/history/useHistoryDock.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { centreOf, hoveredAt, maxScrollOf, scaleAt, shiftAt, slotOf, type DockGeometry } from "./history";

/** The root's font size: the slot is set in px at 16 px and grows with larger text, as the app's 3.25rem did (audit F-06). */
const remPx = () => (typeof document === "undefined" ? 16 : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);

/**
 * The track's behaviour, from HistoryDock.tsx (lines 13 to 87 at 322e353): its scroll, the
 * pointer, how much each chip grows and moves, and which change is under the pointer. The
 * geometry comes in as arguments, from the ficha's params.
 */
export function useHistoryDock(count: number, params: DockGeometry, hoverIndex?: number) {
  const area = useRef<HTMLDivElement>(null);
  const [areaWidth, setAreaWidth] = useState(1000);
  const [rem, setRem] = useState(16);
  const [pointerRaw, setPointer] = useState<number | null>(null);
  const [scroll, setScrollRaw] = useState(0);

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const read = () => {
      setAreaWidth(el.clientWidth || 1000);
      setRem(remPx());
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const g: DockGeometry = { ...params, slot: (slotOf(params) * rem) / 16 };
  const maxScroll = maxScrollOf(count, g, areaWidth);
  // A new change comes into view.
  useEffect(() => setScrollRaw(maxScroll), [count, maxScroll]);
  const setScroll = (v: number) => setScrollRaw(Math.max(0, Math.min(maxScroll, v)));

  const pointer = pointerRaw ?? (hoverIndex !== undefined && hoverIndex >= 0 && hoverIndex < count ? centreOf(hoverIndex, g, scroll) : null);
  const centre = (i: number) => centreOf(i, g, scroll);
  const scale = (i: number) => scaleAt(centre(i), pointer, g);
  const shift = (i: number) => shiftAt(centre(i), pointer, scale(i));
  const hovered = hoveredAt(count, pointer, g, scroll);

  return { area, geometry: g, scroll, maxScroll, setScroll, setPointer, centre, scale, shift, hovered };
}
