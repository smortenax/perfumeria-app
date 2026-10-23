/**
 * The letters written over an orb (owner, 2026-10-23: «inside the orb on black letter the abbreviation
 * as if it were written over the orb»). Black when the orb under them is light enough for 4.5:1
 * (WCAG 1.4.3) everywhere but its darkest tenth; else white when that reads; else whichever reads
 * better, with a halo. Measured on the painted still, since the marbling decides it, not the family alone.
 */
export interface Ink {
  readonly ink: "dark" | "light";
  readonly halo: boolean;
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** The ink for RGBA pixels (as ImageData gives them). */
export function inkOn(pixels: ArrayLike<number>, min = 4.5): Ink {
  const lum: number[] = [];
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]].map((c) => toLinear(c / 255));
    lum.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }
  if (lum.length === 0) return { ink: "light", halo: true };
  lum.sort((a, b) => a - b);
  const darkest = lum[Math.floor(lum.length * 0.1)];
  const lightest = lum[Math.min(lum.length - 1, Math.floor(lum.length * 0.9))];
  const onBlack = (darkest + 0.05) / 0.05;
  const onWhite = 1.05 / (lightest + 0.05);
  if (onBlack >= min) return { ink: "dark", halo: false };
  if (onWhite >= min) return { ink: "light", halo: false };
  return { ink: onBlack >= onWhite ? "dark" : "light", halo: true };
}

/** The ink for the band of a painted orb where its letters sit (the middle, most of its width). */
export function inkOf(canvas: HTMLCanvasElement): Ink {
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  if (!ctx || w === 0) return { ink: "light", halo: true };
  return inkOn(ctx.getImageData(Math.round(w * 0.18), Math.round(h * 0.36), Math.round(w * 0.64), Math.round(h * 0.28)).data);
}
