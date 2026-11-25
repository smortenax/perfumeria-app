import { MEDIA, ROTATE_DIRECTION, requestPrinters, type MarklifePrintOptions, type PrinterAdapter } from "@thermal-label/marklife-web";
import type { Tape } from "./media";

/** Web Bluetooth is in Chrome, Edge and Opera on computers and Android; not in Safari or on iPhone. */
export const canReachPrinter = (): boolean => typeof navigator !== "undefined" && "bluetooth" in navigator;

/**
 * Opens the browser's Bluetooth picker for the P15 (it has to follow a click) and connects. The
 * picker lists the printers whose name starts like a Marklife's («P15…»); we tell the driver it is a
 * P15 so that a renamed one is not asked about.
 */
export async function connectP15(): Promise<PrinterAdapter> {
  const map = await requestPrinters({ transport: "bluetooth-gatt", deviceKey: "P15" });
  const printer = Object.values(map)[0];
  if (!printer) throw new Error("No printer was chosen.");
  return printer;
}

/**
 * Prints one label, waiting for the printer to take it before the next. The label is drawn
 * landscape and turned a quarter to the head (the driver's direction for Marklife); `flip` turns it
 * the other way, for when it comes out upside down (not yet seen on a real P15).
 */
export async function printLabel(printer: PrinterAdapter, image: { width: number; height: number; data: Uint8Array }, tape: Tape, flip = false): Promise<void> {
  const media = tape.continuous ? { ...MEDIA[tape.key], heightMm: tape.length } : MEDIA[tape.key];
  const rotate = ((ROTATE_DIRECTION + (flip ? 180 : 0)) % 360) as 0 | 90 | 180 | 270;
  const options: MarklifePrintOptions = { rotate };
  await printer.print(image, media, options);
}

/**
 * How long the P15 takes to print a label after it has received it. The driver's `print` resolves once
 * the last packet is sent, not once the paper stops: the next label sent while the head still runs
 * came out cut in half (the user, 2026-11-25: «me he impreso una y se ha quedado a medias de la
 * siguiente»). No Marklife answers a status query yet, so the wait is by length: about 20 mm a second,
 * plus a second and a half to feed the gap and settle (session's estimate, conservative).
 */
export const settleMs = (tape: Tape): number => Math.round(tape.length * 50 + 1500);

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** How a run of labels ended: how many printed, and why it ended early, if it did. */
export type RunEnd = { readonly done: number; readonly why: "ok" | "stopped" | "lost" | "failed"; readonly message?: string };

/**
 * Prints labels one after another, each only once the one before has come out (settleMs), and checks
 * the Bluetooth link before each: a dropped link stops the run where it is, so the rest can be printed
 * once the printer is connected again, without printing the first ones twice.
 */
export async function printRun(
  printer: PrinterAdapter,
  labels: readonly { width: number; height: number; data: Uint8Array }[] | readonly (() => { width: number; height: number; data: Uint8Array })[],
  tape: Tape,
  flip: boolean,
  hooks: { readonly onLabel?: (i: number) => void; readonly stopped?: () => boolean; readonly wait?: (ms: number) => Promise<void> } = {},
): Promise<RunEnd> {
  const wait = hooks.wait ?? pause;
  for (let i = 0; i < labels.length; i++) {
    if (hooks.stopped?.()) return { done: i, why: "stopped" };
    if (!printer.connected) return { done: i, why: "lost" };
    hooks.onLabel?.(i);
    const label = labels[i];
    try {
      await printLabel(printer, typeof label === "function" ? label() : label, tape, flip);
    } catch (e) {
      return { done: i, why: printer.connected ? "failed" : "lost", message: e instanceof Error ? e.message : String(e) };
    }
    await wait(settleMs(tape));
  }
  return { done: labels.length, why: "ok" };
}
