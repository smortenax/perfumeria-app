import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { formatGrams } from "../core/display";
import { texts } from "./texts";

/**
 * Repesar, when you decide (V3-57): with the bottle on the scale (the app takes off its tare) or with
 * the bottle already tared on it (what you read is what is left). Either is the engine's reweigh: a
 * gross and a tare, the tare 0 when the scale took it.
 */
export type ReweighMode = "withBottle" | "tared";

export interface Reweigh {
  readonly grossUg: bigint;
  readonly tareUg: bigint;
}

/** What is typed, read as a reweighing; or what is wrong with it. Without a known tare, only «tared». */
export function readReweigh(mode: ReweighMode, text: string, tareUg: bigint | null, totalUg: Ratio | null): Reweigh | { error: string } {
  const t = texts.dialogs;
  if (mode === "withBottle" && tareUg === null) return { error: t.needTare };
  if (!totalUg || totalUg.isZero()) return { error: t.nothingToReweigh };
  let readUg: bigint;
  try {
    readUg = parseMass(text, "g");
  } catch {
    return { error: texts.grams.invalid };
  }
  const tare = mode === "withBottle" ? (tareUg as bigint) : 0n;
  if (readUg <= tare) return { error: mode === "withBottle" ? t.tooLight : texts.grams.invalid };
  // Reweighing only finds what is left: the bottle cannot hold more than it held (§3.5). A figure
  // typed in mg, as the bench weighs, would make it thousands of times heavier.
  const most = Ratio.of(tare).add(totalUg);
  if (Ratio.of(readUg).gt(most)) return { error: t.tooHeavy(formatGrams(most, 3)) };
  return { grossUg: readUg, tareUg: tare };
}
