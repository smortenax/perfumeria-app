// Copied from designboard c0e1d34 (src/runtime/ComposedScreen.tsx), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { layoutTree, reflowChildren, type Artboard } from "../core/composition";
import type { Library } from "../core/manifest";
import { tokenVar } from "../core/tokens";
import { cssLengthToPx, pxFromCss } from "./cssTokens";
import { LayerTree, layoutStyle } from "./layers";
import { LinkProvider, resolverFrom } from "./links";

/**
 * What an app uses at start-up: it reads a composition file and draws a screen from it with
 * its own components. This is the whole contract between the board and an app. The board
 * writes the file; the app's components and their logic stay as they are.
 *
 * Containers are drawn with the browser's own CSS (see `layers.tsx`), the same code the board
 * uses. The app must declare the product's tokens as CSS custom properties (`tokensToCss`, or
 * its own stylesheet under the same names, see `setTokenNaming`).
 */

/** Token path → px from a token map (`tokenMapFor`); missing or non-length tokens read 0. */
export function pxOf(tokens: ReadonlyMap<string, string>) {
  return (path: string) => cssLengthToPx(tokens.get(path) ?? "0");
}

/**
 * The screen at another width, every layer moved by its anchors (`reflowChildren`): what an app
 * gets when the room it gives a screen is not the width the screen was drawn at. The height stays.
 */
export function boardAtWidth(board: Artboard, width: number): Artboard {
  const w = Math.max(1, Math.round(width));
  if (w === board.width) return board;
  return { ...board, width: w, children: reflowChildren(board.children, { w: board.width, h: board.height }, { w, h: board.height }) };
}

/** The width of an element as the browser lays it out, kept up to date; `fallback` until measured. */
function useWidth(on: boolean, fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!on || !el) return;
    const read = () => setWidth(el.clientWidth || null);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [on]);
  return { ref, width: on ? (width ?? fallback) : fallback };
}

export function ComposedScreen({
  board: drawn,
  library,
  tokens,
  style,
  resolveLink,
  fit = "fixed",
}: {
  board: Artboard;
  library: Library;
  /**
   * Token path → resolved CSS value, used for first sizes before the browser has measured. Leave
   * it out when the app's tokens are CSS: the sizes are then read from the custom properties the
   * page declares on its root element (`pxFromCss`).
   */
  tokens?: ReadonlyMap<string, string>;
  style?: CSSProperties;
  /**
   * Turns a linked image's path (relative to the app's folder, "assets/vial.svg") into an
   * address the page can load. Without it the path is used as an address relative to the page,
   * which suits images served from the app's public folder.
   */
  resolveLink?: (path: string) => string;
  /**
   * "fixed" draws the screen at the width it was drawn at. "width" takes the width of the box the
   * app puts it in and moves every layer by its anchors to fit (a bar as wide as the bench).
   */
  fit?: "fixed" | "width";
}) {
  const fluid = fit === "width";
  const { ref, width } = useWidth(fluid, drawn.width);
  const board = fluid ? boardAtWidth(drawn, width) : drawn;
  const px = useMemo(() => (tokens ? pxOf(tokens) : pxFromCss()), [tokens]);
  const estimate = layoutTree(board, px);
  const screen = (
    <div
      ref={ref}
      className="composed-screen"
      data-mode={board.mode || undefined}
      style={{
        ...layoutStyle(board.layout),
        width: fluid ? "100%" : board.width,
        height: board.height,
        // A screen with no ground lets the app's own show through.
        background: board.background ? tokenVar(board.background, "#fff") : "transparent",
        overflow: board.clip === false ? "visible" : "hidden",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <LayerTree layers={board.children} parent={board.layout} library={library} estimate={estimate} />
    </div>
  );
  return resolveLink ? <LinkProvider resolver={resolverFrom(resolveLink)}>{screen}</LinkProvider> : screen;
}
