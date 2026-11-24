import { useEffect, useMemo, useRef, useState } from "react";
import type { PrinterAdapter } from "@thermal-label/marklife-web";
import { texts } from "../i18n/en";
import { Button } from "../Button";
import { tapeOf, TAPES, type Tape } from "./media";
import { drawTwoLines, pixelsOf } from "./render";
import { canReachPrinter, connectP15, printLabel } from "./printer";
import "./labels.css";

const t = texts.labels;
const u = texts.labelTest;
const TAPE_KEY = "perfumeria.labeltest.tape.v1";

/** «big | small», one label a line; blank lines skipped. */
export function parseRows(text: string): { big: string; small: string }[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l)
    .map((l) => {
      const at = l.indexOf("|");
      return at < 0 ? { big: l, small: "" } : { big: l.slice(0, at).trim(), small: l.slice(at + 1).trim() };
    });
}

/**
 * The label test page (V3-110; the user, 2026-11-24: «empieza con la página de prueba»): labels typed
 * by hand, two lines and no QR, drawn at the printer's own dots and sent to the P15 by Bluetooth. It
 * needs neither an account nor the app's data, so it can be tried with the printer before anything
 * else is built on it.
 */
export function LabelTest() {
  const [text, setText] = useState<string>(u.example);
  const [tape, setTape] = useState<Tape>(() => {
    try {
      return tapeOf(localStorage.getItem(TAPE_KEY) ?? "GAP_12X40");
    } catch {
      return tapeOf("GAP_12X40");
    }
  });
  const pickTape = (id: string) => {
    setTape(tapeOf(id));
    try {
      localStorage.setItem(TAPE_KEY, id);
    } catch {
      /* Chosen again next time. */
    }
  };
  const [flip, setFlip] = useState(false);
  const [printer, setPrinter] = useState<PrinterAdapter | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => parseRows(text), [text]);
  useEffect(() => () => void printer?.close(), [printer]);

  const connect = async () => {
    setStatus(null);
    try {
      setPrinter(await connectP15());
      setStatus(t.connected);
    } catch (e) {
      setStatus(t.failed(e instanceof Error ? e.message : String(e)));
    }
  };
  const print = async () => {
    if (!printer || rows.length === 0) return;
    setBusy(true);
    try {
      for (const [i, r] of rows.entries()) {
        setStatus(t.printing(i + 1, rows.length));
        await printLabel(printer, pixelsOf(drawTwoLines(r.big, r.small, tape).canvas), tape, flip);
      }
      setStatus(t.printed(rows.length));
    } catch (e) {
      setStatus(t.failed(e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="labels label-test">
      <h1>{u.title}</h1>
      <p className="hint">{u.intro}</p>
      <label className="label-test-rows">
        {u.rows}
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </label>
      <div className="labels-bar">
        <label className="labels-tape">
          {t.tape}
          <select value={tape.id} onChange={(e) => pickTape(e.target.value)}>
            {TAPES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.continuous ? t.continuous(x.width, x.length) : t.gap(x.width, x.length)}
              </option>
            ))}
          </select>
        </label>
        <label className="labels-flip">
          <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} />
          {t.flip}
        </label>
        {canReachPrinter() ? (
          <>
            {printer ? (
              <span className="labels-printer">{t.printerName(printer.model)}</span>
            ) : (
              <Button onClick={() => void connect()}>{t.connect}</Button>
            )}
            <Button variant="primary" disabled={!printer || busy || rows.length === 0} onClick={() => void print()}>
              {t.print(rows.length)}
            </Button>
          </>
        ) : (
          <p className="hint">{t.noBluetooth}</p>
        )}
        {status && (
          <span className="labels-status" role="status">
            {status}
          </span>
        )}
      </div>
      <ul className="label-test-list">
        {rows.map((r, i) => (
          <li key={i}>
            <TwoLinePreview big={r.big} small={r.small} tape={tape} />
          </li>
        ))}
      </ul>
    </main>
  );
}

/** One label at the printer's dots, shown at twice its size in millimetres, with the size each line came out. */
function TwoLinePreview({ big, small, tape }: { big: string; small: string; tape: Tape }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sizes, setSizes] = useState<{ big: number; small: number; cut: boolean } | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const out = drawTwoLines(big, small, tape, canvas);
      pixelsOf(canvas);
      setSizes({ big: out.bigSize, small: out.smallSize, cut: out.cut });
    };
    draw();
    void document.fonts?.ready.then(draw);
  }, [big, small, tape]);
  const mm = (dots: number) => (dots / 8).toFixed(1);
  return (
    <figure>
      <canvas ref={ref} className="label-preview" style={{ ["--label-dots" as string]: tape.length * 16 }} role="img" aria-label={`${big} · ${small}`} />
      {sizes && <figcaption className="hint">{sizes.cut ? u.cut : u.sizes(mm(sizes.big), mm(sizes.small))}</figcaption>}
    </figure>
  );
}
