/**
 * Family colours as text (audit F-01): a family's colour is light enough for an edge or a tint, but
 * its letters need 4.5:1 against what is behind them (WCAG 1.4.3). The text keeps the family's hue
 * and only its OkLCh lightness goes down, so the letters still read as the family's colour.
 */

type Rgb = readonly [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function parseHex(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** Relative luminance, as WCAG defines it. */
function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The contrast ratio of two colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(parseHex(a)), luminance(parseHex(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Two colours mixed in sRGB, as CSS color-mix(in srgb, a share%, b). */
export function mix(a: string, share: number, b: string): string {
  const [p, q] = [parseHex(a), parseHex(b)];
  return toHex([0, 1, 2].map((i) => p[i] * share + q[i] * (1 - share)) as unknown as Rgb);
}

function toOklch(rgb: Rgb): [number, number, number] {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

/** OkLCh to linear sRGB; null when the colour falls outside sRGB. */
function fromOklch(L: number, C: number, h: number): Rgb | null {
  const A = C * Math.cos(h);
  const B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4) ? (rgb.map((c) => toGamma(Math.min(1, Math.max(0, c)))) as unknown as Rgb) : null;
}

/** The colour at a lightness, with its hue, and with as much of its chroma as sRGB holds there. */
function atLightness(L: number, C: number, h: number): string {
  let lo = 0;
  let hi = C;
  let best = fromOklch(L, 0, h) as Rgb;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const rgb = fromOklch(L, mid, h);
    if (rgb) [lo, best] = [mid, rgb];
    else hi = mid;
  }
  const full = fromOklch(L, C, h);
  return toHex(full ?? best);
}

/**
 * The colour as text on each background, at least `min` against all of them: the colour itself
 * when it already reads, else the lightest of its darker versions (same hue) that does.
 */
export function readableOn(colour: string, backgrounds: readonly string[], min = 4.5): string {
  const reads = (c: string) => backgrounds.every((b) => contrastRatio(c, b) >= min);
  if (reads(colour)) return colour;
  const [L, C, h] = toOklch(parseHex(colour));
  let lo = 0;
  let hi = L;
  let best = atLightness(0, C, h);
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const candidate = atLightness(mid, C, h);
    if (reads(candidate)) [lo, best] = [mid, candidate];
    else hi = mid;
  }
  // Rounding to whole sRGB steps can cost a hair of contrast: step down until it reads.
  for (let L2 = lo; !reads(best) && L2 > 0; L2 -= 0.005) best = atLightness(L2, C, h);
  return best;
}
