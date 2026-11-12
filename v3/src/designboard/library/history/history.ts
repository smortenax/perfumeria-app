/**
 * Perfumería's bench history (v3/src/bench/HistoryDock.tsx in smortenax/perfumeria-app, main at
 * 322e353, 2026-11-11), split as the plan for the board asks: what decides what is shown (which
 * changes, in which order, what each says, what a press does) stays in the app's code; what
 * decides how it looks (sizes, colours, icons, the magnifier, where each piece sits) becomes
 * params. This file holds the data the pieces read and the dock's geometry, without React.
 */
import type { ReactNode } from "react";

export type ChangeKind = "add" | "note" | "reweigh" | "remove" | "set-mass";

/**
 * One change as the dock shows it. The app builds these from its `Change` list with the
 * functions it already has (`describe`, `amountOf`, `weighingWarning`, its icons, orbs and
 * families), so the pieces never need the app's arithmetic or texts.
 */
export interface HistoryItem {
  id: string;
  kind: ChangeKind;
  /** What the tooltip and the label say: «Hedione», «620 mg at 10% in DPG». */
  title: string;
  sub: string;
  /** What goes under the chip: «+620 mg», «→ 0.2 g»; null for none. */
  amount: string | null;
  /** A weighing that is doubtful (amber) or below what a scale weighs (red). */
  warning?: "error" | "unweighable" | null;
  /** An addition's icon: its trade abbreviation or code, with the mark and kind letter (P39, P40). */
  icon?: { text: string; mark?: string; type?: string; typeTitle?: string };
  /** An addition's orb at a given size (V3-73); absent for a material outside the catalogue. */
  orb?: (size: number) => ReactNode;
  /** An addition's family: its colour and «Woody · floral hue» (P48). */
  family?: { colour: string; title: string };
}

/** The dock's words, from the app's texts (V3-71). Never params. */
export interface HistoryLabels {
  title: string;
  changes: (n: number) => string;
  asWeighed: string;
  ofCount: (n: number) => string;
  toEnd: string;
  play: string;
  pause: string;
  goStart: string;
  goEnd: string;
  empty: string;
}

/** Everything the three pieces share: the app's state and what a press does. */
export interface HistoryData {
  items: readonly HistoryItem[];
  /** The frame looked at (changes shown as done), or null at the end. */
  frame: number | null;
  selectedId: string | null;
  playing: boolean;
  onSelect: (id: string | null) => void;
  onFrame: (frame: number | null) => void;
  onTogglePlay: () => void;
  labels: HistoryLabels;
  /**
   * The change the pointer is over, for a preview that cannot hover (the board): the track
   * magnifies it and shows its tooltip. The app leaves it out.
   */
  hoverIndex?: number;
}

/** The track's geometry, in CSS pixels: the ficha's number params. */
export interface DockGeometry {
  chip: number;
  slot: number;
  gap: number;
  /** How much the chip under the pointer grows: 1 is no magnifier. */
  magnify: number;
  /** How far from the pointer chips still grow. */
  reach: number;
}

/** The app's values before the split (bench.css and HistoryDock.tsx). */
export const APP_GEOMETRY: DockGeometry = { chip: 28, slot: 52, gap: 4, magnify: 1.8, reach: 84 };

/** The chip's slot is never narrower than the chip. */
export function slotOf(g: DockGeometry): number {
  return Math.max(g.slot, g.chip);
}

/** The middle of change `i`, from the left of the track, with the row scrolled by `scroll`. */
export function centreOf(i: number, g: DockGeometry, scroll: number): number {
  const slot = slotOf(g);
  return i * (slot + g.gap) + slot / 2 - scroll;
}

/** How much a chip whose middle is at `centre` grows with the pointer at `pointer`. */
export function scaleAt(centre: number, pointer: number | null, g: DockGeometry): number {
  if (pointer === null || g.reach <= 0) return 1;
  return 1 + (g.magnify - 1) * Math.max(0, 1 - Math.abs(centre - pointer) / g.reach);
}

/** How far a grown chip moves aside, so its neighbours make room (the macOS dock). */
export function shiftAt(centre: number, pointer: number | null, scale: number): number {
  return pointer === null ? 0 : (centre - pointer) * (scale - 1) * 0.35;
}

/** The change under the pointer, or -1. */
export function hoveredAt(count: number, pointer: number | null, g: DockGeometry, scroll: number): number {
  if (pointer === null) return -1;
  const half = (slotOf(g) + g.gap) / 2;
  for (let i = 0; i < count; i++) if (Math.abs(centreOf(i, g, scroll) - pointer) <= half) return i;
  return -1;
}

/** How far the row can scroll in a track `width` wide. */
export function maxScrollOf(count: number, g: DockGeometry, width: number): number {
  return Math.max(0, count * (slotOf(g) + g.gap) - width + 24);
}
