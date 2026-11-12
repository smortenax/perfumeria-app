// Copied from designboard 4aa3488 (src/runtime/cssTokens.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { cssVarName } from "../core/tokens";

/**
 * Sizes from the page's own stylesheet, for an app whose tokens are CSS (`tokens.css`) rather than
 * a token file it can hand to `ComposedScreen`. Only the first layout estimate uses them; the
 * browser's own layout takes over once it has measured.
 */

/** A CSS length in px: "16px" → 16, "1.5rem" → 24 with a 16 px root, "12" → 12. Anything else (a colour, `calc()`) is 0. */
export function cssLengthToPx(value: string, rootFontPx = 16): number {
  const m = /^\s*(-?\d*\.?\d+)(px|rem|em)?\s*$/i.exec(value);
  if (!m) return 0;
  const n = Number.parseFloat(m[1]);
  const unit = (m[2] ?? "px").toLowerCase();
  return unit === "px" ? n : n * rootFontPx;
}

/**
 * Token path → px, read from the custom properties the page declares on `el` (the document's root
 * element by default), under the current naming rule (`setTokenNaming`). A token the page does
 * not declare reads 0. Outside a browser every token reads 0.
 */
export function pxFromCss(el?: Element): (path: string) => number {
  if (typeof window === "undefined" || typeof document === "undefined" || !window.getComputedStyle) return () => 0;
  const target = el ?? document.documentElement;
  const style = window.getComputedStyle(target);
  const rootFont = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
  const seen = new Map<string, number>();
  return (path) => {
    let px = seen.get(path);
    if (px === undefined) {
      px = cssLengthToPx(style.getPropertyValue(cssVarName(path)), rootFont);
      seen.set(path, px);
    }
    return px;
  };
}
