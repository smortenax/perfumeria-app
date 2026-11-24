import type { LabelContent } from "./content";
import { fitText, layoutFor } from "./layout";
import type { Tape } from "./media";
import { qrMatrix } from "./qr";

const FONT = '"Atkinson Hyperlegible Next Variable", "Atkinson Hyperlegible Next", "Segoe UI", sans-serif';

/**
 * Draws one label in black on white, at the printer's own dots (8 per mm), landscape: QR on the left,
 * the material, its strength and the CAS and date on the right. The canvas is the preview and its
 * pixels are what goes to the printer.
 */
export function drawLabel(content: LabelContent, tape: Tape, canvas: HTMLCanvasElement = document.createElement("canvas")): HTMLCanvasElement {
  const matrix = qrMatrix(content.code);
  const layout = layoutFor(tape, matrix.length);
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas in this browser.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.fillStyle = "#000";
  const { x, y, module } = layout.qr;
  matrix.forEach((row, r) => row.forEach((dark, c) => dark && ctx.fillRect(x + c * module, y + r * module, module, module)));

  const measure = (weight: number) => (text: string, size: number) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    return ctx.measureText(text).width;
  };
  // On a short label the CAS and the date go on two lines rather than be cut: the date is read, too.
  const footer = content.footer && measure(500)(content.footer, 12) > layout.text.width ? content.footer.split(" · ") : [content.footer];
  const lines = [
    { text: content.title, weight: 700, max: 30, min: 14 },
    { text: content.strength, weight: 600, max: 24, min: 12 },
    ...footer.map((text) => ({ text, weight: 500, max: footer.length > 1 ? 14 : 17, min: 11 })),
  ].filter((l) => l.text);
  const fitted = lines.map((l) => ({ ...l, ...fitText(l.text, layout.text.width, l.max, l.min, measure(l.weight)) }));
  // Spread the lines down the label: each one's height is its size; what is left goes between them.
  const used = fitted.reduce((sum, l) => sum + l.size, 0);
  const gap = fitted.length > 1 ? Math.max(2, (layout.text.height - used) / (fitted.length - 1)) : 0;
  let top = layout.text.y + (fitted.length > 1 ? 0 : (layout.text.height - used) / 2);
  ctx.textBaseline = "top";
  for (const l of fitted) {
    ctx.font = `${l.weight} ${l.size}px ${FONT}`;
    ctx.fillText(l.text, layout.text.x, Math.round(top));
    top += l.size + gap;
  }
  return canvas;
}

/** Blank at each end of a label, where a die-cut gap may wander (1.5 mm), and above and below the text. */
const END = 12;
const EDGE = 6;

/**
 * Two lines, no QR (the user, 2026-11-24: «nombre y dilución en grande en una línea, cas y fecha más
 * pequeña letra debajo y todo en la misma etiqueta»): the first line as big as the label lets it, the
 * second small, at the bottom. A line that does not fit even at its smallest is cut with «…», never
 * spilled off the label. The returned sizes are in dots (8 a millimetre).
 */
export function drawTwoLines(
  big: string,
  small: string,
  tape: Tape,
  canvas: HTMLCanvasElement = document.createElement("canvas"),
): { canvas: HTMLCanvasElement; bigSize: number; smallSize: number; cut: boolean } {
  const width = tape.length * 8;
  const height = 96;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas in this browser.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  const measure = (weight: number) => (text: string, size: number) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    return ctx.measureText(text).width;
  };
  const room = width - 2 * END;
  const lower = small ? fitText(small, room, 20, 12, measure(500)) : null;
  // The first line takes what the second leaves: the label's height less the second line and a gap.
  const top = big ? fitText(big, room, Math.min(48, height - 2 * EDGE - (lower ? lower.size + 8 : 0)), 12, measure(700)) : null;
  ctx.textBaseline = "top";
  if (top) {
    ctx.font = `700 ${top.size}px ${FONT}`;
    ctx.fillText(top.text, END, lower ? EDGE : Math.round((height - top.size) / 2));
  }
  if (lower) {
    ctx.font = `500 ${lower.size}px ${FONT}`;
    ctx.fillText(lower.text, END, height - EDGE - lower.size);
  }
  return { canvas, bigSize: top?.size ?? 0, smallSize: lower?.size ?? 0, cut: (!!top && top.text !== big) || (!!lower && lower.text !== small) };
}

/**
 * The pixels of a drawn label, as the driver takes them (RGBA), already pure black or white: the
 * grey edges of the letters are decided here, so the driver's dithering has nothing to scatter and
 * the QR stays crisp. The canvas shows the same.
 */
export function pixelsOf(canvas: HTMLCanvasElement): { width: number; height: number; data: Uint8Array } {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas in this browser.");
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  blackAndWhite(image.data);
  ctx.putImageData(image, 0, 0);
  return { width: image.width, height: image.height, data: new Uint8Array(image.data.buffer.slice(0)) };
}

/** Every pixel to black or white, by its lightness (below 160 of 255, black). */
export function blackAndWhite(rgba: Uint8ClampedArray): void {
  for (let i = 0; i < rgba.length; i += 4) {
    const light = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
    const v = light < 160 ? 0 : 255;
    rgba[i] = rgba[i + 1] = rgba[i + 2] = v;
    rgba[i + 3] = 255;
  }
}
