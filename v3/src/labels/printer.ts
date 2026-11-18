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
