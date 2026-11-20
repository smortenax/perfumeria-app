// Copied from designboard 3f221ae (src/library/perfumeria/bench/BenchRoot.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { CSSProperties, ReactNode } from "react";
import { tokenVar } from "../../../core/tokens";
import "./bench.css";

/**
 * The bench's styles hold for what is inside `.bench-root` (v3/src/bench/bench.css, copied unchanged
 * from perfumeria-app v3 at ee38168). The app's own bench root fills the window (position: fixed,
 * inset 0); this one is a plain box the size of the ficha, so the inline style undoes the window part
 * and keeps the rest: the bench's aliases (--panel, --line, --ink…), its font and its focus ring.
 *
 * bench.css also reads names that App.css declares on :root (--font-sans, --text-md…). App.css cannot
 * come onto the board (it styles bare buttons and inputs for the whole page), so they are declared
 * here from tokens, read while rendering so the app's naming rule applies. --radius-large and
 * --radius-pill have no token yet: the fichas that need them set them from a number param.
 */
export function BenchRoot({ style, children }: { style?: CSSProperties; children: ReactNode }) {
  const root = {
    "--font-sans": tokenVar("font.family.body", "system-ui"),
    "--font-mono": tokenVar("font.family.figures", "monospace"),
    "--text-xs": tokenVar("font.size.xs"),
    "--text-sm": tokenVar("font.size.sm"),
    "--text-md": tokenVar("font.size.md"),
    "--text-lg": tokenVar("font.size.lg"),
    "--text-xl": tokenVar("font.size.xl"),
    "--text-2xl": tokenVar("font.size.2xl"),
    position: "relative",
    inset: "auto",
    zIndex: "auto",
    overflow: "visible",
    background: "transparent",
    width: "100%",
    height: "100%",
    ...style,
  } as CSSProperties;
  return (
    <div className="bench-root" style={root}>
      {children}
    </div>
  );
}

/** Only the set ones: an empty token param leaves the bench's own value. */
export function setIf(style: CSSProperties, prop: keyof CSSProperties, path: string): void {
  if (path) (style as Record<string, string>)[prop] = tokenVar(path);
}
