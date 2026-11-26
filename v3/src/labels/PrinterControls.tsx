import type { ReactNode } from "react";
import { texts } from "../i18n/en";
import { Button } from "../Button";
import { TAPES } from "./media";
import { canReachPrinter } from "./printer";
import type { Printer } from "./usePrinter";

const t = texts.labels;

/** The tape and «Turn upside down»: what a label is printed on, remembered in this browser. */
export function TapeControls({ p }: { p: Printer }) {
  return (
    <>
      <label className="labels-tape">
        {t.tape}
        <select value={p.tape.id} onChange={(e) => p.pickTape(e.target.value)}>
          {TAPES.map((x) => (
            <option key={x.id} value={x.id}>
              {x.continuous ? t.continuous(x.width, x.length) : t.gap(x.width, x.length)}
            </option>
          ))}
        </select>
      </label>
      <label className="labels-flip">
        <input type="checkbox" checked={p.flip} onChange={(e) => p.pickFlip(e.target.checked)} />
        {t.flip}
      </label>
    </>
  );
}

/**
 * The printer's own buttons, beside what a screen prints: connect, feed to the next label, stop, the
 * rest of a broken run and what happened. Without Web Bluetooth, the hint of where it works.
 */
export function PrinterButtons({ p, children }: { p: Printer; children?: ReactNode }) {
  if (!canReachPrinter()) return <p className="hint">{t.noBluetooth}</p>;
  return (
    <>
      {p.printer ? <span className="labels-printer">{t.printerName(p.printer.model)}</span> : <Button onClick={() => void p.connect()}>{t.connect}</Button>}
      {children}
      {!p.tape.continuous && (
        <Button disabled={!p.printer || p.busy} title={t.alignHint} onClick={() => void p.align()}>
          {t.align}
        </Button>
      )}
      {p.busy && <Button onClick={p.halt}>{t.stop}</Button>}
      {!p.busy && p.left.length > 0 && <Button onClick={() => void p.print(p.left)}>{t.remaining(p.left.length)}</Button>}
    </>
  );
}

export function PrinterStatus({ p }: { p: Printer }) {
  return p.status ? (
    <span className="labels-status" role="status">
      {p.status}
    </span>
  ) : null;
}
