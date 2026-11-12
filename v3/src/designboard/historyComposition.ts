import { FIXED, type Artboard, type ComponentNode, type Composition, type ContainerNode } from "./core/composition";
import { defaultParams, type ComponentDef } from "./core/manifest";
import { panel } from "./library/basic";
import { historyCount, historyPlay, historyTrack } from "./library/history/history.fichas";

/**
 * The history dock as a composition: one screen per size, as the app reads it
 * (v3/src/bench/history/history.composition.json in the plan). Each screen holds the bar's
 * ground (the board's panel) and a stack that lays out the three pieces in a row: play, the
 * track taking the room left, then the count. Moving a piece in the stack reorders it instead of
 * laying it over the others. Neither screen has a ground of its own or clips: the magnifier and
 * the tooltip rise above the bar.
 *
 * The bar is 72 px high, inset by the bench's side padding, as bench.css places it today. The
 * gap between pieces is `space.gap` (16 px): the app's 10 px has no token yet (see the PR that
 * made this a stack), so the closest one stands in.
 */

const DEFS = { panel, "history-play": historyPlay, "history-track": historyTrack, "history-count": historyCount } as unknown as Record<string, ComponentDef>;

function piece(screen: string, type: keyof typeof DEFS, name: string, x: number, y: number, w: number, h: number, anchor: ComponentNode["anchor"], params: Record<string, unknown> = {}): ComponentNode {
  return { kind: "component", id: `${screen}-${type}`, type, name, x, y, w, h, anchor, sizing: FIXED, params: { ...defaultParams(DEFS[type]), ...(params as object) } };
}

export const DOCK_HEIGHT = 72;
const PLAY = 44;
const COUNT_W = 176;
/** Between the two screens on the board, the 390 one under the 1440 one so both show when the board opens. */
const SCREEN_GAP = 48;

/** One screen of the bar: `inset` is the bench's side padding at that size (16 px, 12 px at 40 rem and under). */
function dockScreen(id: string, width: number, inset: number, y: number, minWidth?: number): Artboard {
  const inner = width - inset * 2;
  const row: ContainerNode = {
    kind: "container",
    id: `${id}-row`,
    name: "Fila del historial",
    x: inset,
    y: 0,
    w: inner,
    h: DOCK_HEIGHT,
    anchor: { h: "stretch", v: "stretch" },
    sizing: FIXED,
    // No padding: the row itself sits at the bench's side inset, and the pieces use the bar's whole height.
    layout: { mode: "flex", direction: "row", gap: "space.gap", padding: "", align: "center", justify: "start", wrap: false },
    clip: false,
    children: [
      piece(id, "history-play", "Reproducir", 0, 0, PLAY, PLAY, { h: "left", v: "center" }),
      {
        ...piece(id, "history-track", "Tira", 0, 0, inner - PLAY - COUNT_W, DOCK_HEIGHT, { h: "stretch", v: "stretch" }),
        sizing: { w: { mode: "fill" }, h: { mode: "fill" } },
      },
      piece(id, "history-count", "Recuento", 0, 0, COUNT_W, PLAY, { h: "right", v: "center" }),
    ],
  };
  const board: Artboard = {
    id,
    name: `Historial · ${width}`,
    width,
    height: DOCK_HEIGHT,
    x: 0,
    y,
    background: "",
    clip: false,
    layout: { mode: "free" },
    children: [
      // The bar's ground: only its top edge, the line between the bench and the history, with square corners.
      piece(id, "panel", "Fondo de la barra", 0, 0, width, DOCK_HEIGHT, { h: "stretch", v: "stretch" }, {
        background: "color.surface.raised",
        radius: "",
        border: true,
        borderTop: true,
        borderRight: false,
        borderBottom: false,
        borderLeft: false,
        borderColor: "color.border.subtle",
      }),
      row,
    ],
  };
  if (minWidth !== undefined) board.minWidth = minWidth;
  return board;
}

/** The two screens: 1440 from 641 px of app width up (above 40 rem), 390 below. */
export function historyComposition(): Composition {
  return {
    version: 2,
    name: "Historial del banco",
    tokens: "perfumeria",
    artboards: [dockScreen("history-1440", 1440, 16, 0, 641), dockScreen("history-390", 390, 12, DOCK_HEIGHT + SCREEN_GAP)],
  };
}
