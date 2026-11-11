import type { Ratio } from "../core/arith/ratio";
import { formatDecimal } from "../core/display";

/** Parts as written: «18», «0.5», never «0.500». */
export const partsText = (parts: Ratio) =>
  formatDecimal(parts, parts.isInteger() ? 0 : 3)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
