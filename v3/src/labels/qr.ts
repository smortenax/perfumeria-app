import qrcode from "qrcode-generator";

/** A QR code as rows of dark (true) and light modules, without its quiet zone. */
export type QrMatrix = readonly (readonly boolean[])[];

const ALPHANUMERIC = /^[0-9A-Z $%*+\-./:]*$/;

/**
 * The smallest QR that holds the text, at correction level M (15 % of it can be lost: a label rubbed
 * by a wet glove still reads). Alphanumeric when the text allows it, which keeps «PF1:D:<id>» at
 * version 2.
 */
export function qrMatrix(text: string): QrMatrix {
  const qr = qrcode(0, "M");
  qr.addData(text, ALPHANUMERIC.test(text) ? "Alphanumeric" : "Byte");
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}
