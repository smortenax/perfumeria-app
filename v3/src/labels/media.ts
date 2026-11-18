/**
 * The tapes of the Marklife P15 (V3-105), as the driver's registry names them. Sizes in millimetres:
 * `width` across the tape, `length` along it. The P15's head is 96 dots at 203 dpi (8 dots per mm,
 * about 12 mm), whatever the tape: on 14 and 15 mm tape the print is 12 mm and centred.
 */
export interface Tape {
  readonly key: "GAP_12X40" | "GAP_14X40" | "GAP_15X30" | "GAP_15X50" | "CONTINUOUS_15MM";
  readonly width: number;
  /** Along the tape; for continuous tape, the length we cut each label to. */
  readonly length: number;
  readonly continuous: boolean;
}

export const TAPES: readonly Tape[] = [
  { key: "GAP_12X40", width: 12, length: 40, continuous: false },
  { key: "GAP_14X40", width: 14, length: 40, continuous: false },
  { key: "GAP_15X30", width: 15, length: 30, continuous: false },
  { key: "GAP_15X50", width: 15, length: 50, continuous: false },
  { key: "CONTINUOUS_15MM", width: 15, length: 40, continuous: true },
];

export const DOTS_PER_MM = 8;
export const HEAD_DOTS = 96;

export const tapeOf = (key: string): Tape => TAPES.find((t) => t.key === key) ?? TAPES[0];
