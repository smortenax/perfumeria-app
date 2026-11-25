/**
 * The tapes of the Marklife P15 (V3-110), as the driver's registry names them. Sizes in millimetres:
 * `width` across the tape, `length` along it. The P15's head is 96 dots at 203 dpi (8 dots per mm,
 * about 12 mm), whatever the tape: on 14 and 15 mm tape the print is 12 mm and centred.
 */
export interface Tape {
  /** Ours, for the picker: the driver's key, or the key and the length a continuous tape is cut at. */
  readonly id: string;
  readonly key: "GAP_12X40" | "GAP_14X40" | "GAP_15X30" | "GAP_15X50" | "CONTINUOUS_15MM";
  readonly width: number;
  /** Along the tape; for continuous tape, the length we cut each label to. */
  readonly length: number;
  readonly continuous: boolean;
}

export const TAPES: readonly Tape[] = [
  { id: "GAP_12X40", key: "GAP_12X40", width: 12, length: 40, continuous: false },
  { id: "GAP_14X40", key: "GAP_14X40", width: 14, length: 40, continuous: false },
  { id: "GAP_15X30", key: "GAP_15X30", width: 15, length: 30, continuous: false },
  { id: "GAP_15X50", key: "GAP_15X50", width: 15, length: 50, continuous: false },
  { id: "CONTINUOUS_15MM", key: "CONTINUOUS_15MM", width: 15, length: 40, continuous: true },
  // The name and the dilution big on one line need about 70 mm (the user, 2026-11-24: «nombre y dilución en grande en una línea»).
  { id: "CONTINUOUS_15MM_70", key: "CONTINUOUS_15MM", width: 15, length: 70, continuous: true },
];

export const DOTS_PER_MM = 8;
export const HEAD_DOTS = 96;

/**
 * How much shorter than a die-cut label the print is: 3 mm. The P15 starts a label a little past its
 * edge and, after printing, feeds to the next gap (`1D 0C`). A print as long as the label (40 mm on
 * 40 mm) ran into the gap, so the printer took the next gap as this one's end and skipped a whole
 * label, and from there every label came out shifted and some blank (the user, 2026-11-25: «en vez de
 * recolocarse pasa a la siguiente y eso hace que a veces se salte la cinta»). Session's estimate,
 * to adjust on the real tape.
 */
export const GAP_TRIM_MM = 3;

/** The print's length in dots: the label less GAP_TRIM_MM on die-cut tape; the cut length on continuous. */
export const printDots = (tape: Tape): number => (tape.continuous ? tape.length : tape.length - GAP_TRIM_MM) * DOTS_PER_MM;

export const tapeOf = (id: string): Tape => TAPES.find((t) => t.id === id) ?? TAPES[0];
