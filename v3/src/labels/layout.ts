import { HEAD_DOTS, printDots, type Tape } from "./media";

/** Where things go on a label, in printer dots, laid out landscape (the driver turns it to the head). */
export interface LabelLayout {
  readonly width: number;
  readonly height: number;
  /** The QR's top-left corner and the side of one module, in dots (whole dots, so every module prints crisp). */
  readonly qr: { readonly x: number; readonly y: number; readonly module: number; readonly side: number };
  readonly text: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
}

/** Blank at each end of a die-cut label, where the gap may wander: 1.5 mm. */
const END_MARGIN = 12;
/** The light border a QR needs to be found: 2 modules (the standard asks 4; 2 reads on a phone and saves room). */
const QUIET_MODULES = 2;
const GAP = 6;

export function layoutFor(tape: Tape, qrModules: number): LabelLayout {
  const width = printDots(tape);
  const height = HEAD_DOTS;
  const module = Math.max(1, Math.floor(height / (qrModules + 2 * QUIET_MODULES)));
  const side = module * qrModules;
  const qr = { x: END_MARGIN + module * QUIET_MODULES, y: Math.floor((height - side) / 2), module, side };
  const textX = qr.x + side + module * QUIET_MODULES + GAP;
  return { width, height, qr, text: { x: textX, y: 4, width: width - END_MARGIN - textX, height: height - 8 } };
}

/**
 * The largest font size, from `max` down to `min`, at which `text` fits `width`; at `min`, the text
 * cut with «…» until it fits. `measure` is the canvas's (or a test's) width of a text at a size.
 */
export function fitText(text: string, width: number, max: number, min: number, measure: (text: string, size: number) => number): { text: string; size: number } {
  for (let size = max; size >= min; size--) if (measure(text, size) <= width) return { text, size };
  let cut = text;
  while (cut.length > 1 && measure(`${cut}…`, min) > width) cut = cut.slice(0, -1);
  return { text: `${cut.trimEnd()}…`, size: min };
}
