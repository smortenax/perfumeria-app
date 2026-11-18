import { useEffect, useMemo, useRef, useState } from "react";
import type { PrinterAdapter } from "@thermal-label/marklife-web";
import type { Dilution } from "../db/catalog";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { Button } from "../Button";
import { dilutionLabel, labelSheet, type LabelContent } from "./content";
import { xlsxOf } from "./xlsx";
import { tapeOf, TAPES } from "./media";
import { drawLabel, pixelsOf } from "./render";
import { canReachPrinter, connectP15, printLabel } from "./printer";
import "./labels.css";

const t = texts.labels;
const TAPE_KEY = "perfumeria.labels.tape.v1";
const FLIP_KEY = "perfumeria.labels.flip.v1";

const readTape = () => {
  try {
    return tapeOf(localStorage.getItem(TAPE_KEY) ?? "");
  } catch {
    return TAPES[0];
  }
};

/**
 * «Labels» in Dilutions (V3-105): pick bottles, see each label as it will print, and send them one
 * after another to a Marklife P15 by Bluetooth. Each label carries a QR with the bottle's code, for
 * the bench's scanner.
 */
export function Labels({ data, all }: { data: GlossaryData; all: readonly { materialId: string; d: Dilution }[] }) {
  const [tape, setTape] = useState(readTape);
  const [flip, setFlip] = useState(() => {
    try {
      return localStorage.getItem(FLIP_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [printer, setPrinter] = useState<PrinterAdapter | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const stop = useRef(false);

  const materialOf = (id: string) => data.catalog.materials.get(id);
  const rows = useMemo(() => {
    const name = (id: string) => data.catalog.materials.get(id)?.name ?? "—";
    const q = query.trim().toLowerCase();
    return all
      .filter((x) => !x.d.archivedAt)
      .map((x) => ({ ...x, label: dilutionLabel(materialOf, x.materialId, x.d) }))
      .filter((x) => !q || `${name(x.materialId)} ${x.label.strength} ${x.label.footer}`.toLowerCase().includes(q))
      .sort((a, b) => a.label.title.localeCompare(b.label.title, "es") || (b.d.madeOn ?? "").localeCompare(a.d.madeOn ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, data, query]);
  const picked = rows.filter((x) => chosen.has(x.d.id));

  const toggle = (id: string) =>
    setChosen((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const pickTape = (key: string) => {
    const next = tapeOf(key);
    setTape(next);
    try {
      localStorage.setItem(TAPE_KEY, next.key);
    } catch {
      /* Without storage, the tape is chosen again next time. */
    }
  };

  const pickFlip = (on: boolean) => {
    setFlip(on);
    try {
      localStorage.setItem(FLIP_KEY, on ? "1" : "0");
    } catch {
      /* Chosen again next time. */
    }
  };
  /** The chosen bottles (or, with none chosen, every one shown) as a sheet for the Marklife app's Excel import. */
  const downloadSheet = () => {
    const list = picked.length > 0 ? picked : rows;
    const bytes = xlsxOf(labelSheet(list.map((x) => x.label)));
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `labels-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(t.sheetSaved(list.length));
  };
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
    if (!printer || picked.length === 0) return;
    setBusy(true);
    stop.current = false;
    try {
      for (const [i, x] of picked.entries()) {
        if (stop.current) {
          setStatus(t.stopped(i, picked.length));
          return;
        }
        setStatus(t.printing(i + 1, picked.length));
        await printLabel(printer, pixelsOf(drawLabel(x.label, tape)), tape, flip);
      }
      setStatus(t.printed(picked.length));
    } catch (e) {
      setStatus(t.failed(e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => () => void printer?.close(), [printer]);

  return (
    <div className="labels">
      <div className="labels-bar">
        <label className="labels-tape">
          {t.tape}
          <select value={tape.key} onChange={(e) => pickTape(e.target.value)}>
            {TAPES.map((x) => (
              <option key={x.key} value={x.key}>
                {x.continuous ? t.continuous(x.width, x.length) : t.gap(x.width, x.length)}
              </option>
            ))}
          </select>
        </label>
        <label className="labels-flip">
          <input type="checkbox" checked={flip} onChange={(e) => pickFlip(e.target.checked)} />
          {t.flip}
        </label>
        {canReachPrinter() ? (
          <>
            {printer ? (
              <span className="labels-printer">{t.printerName(printer.model)}</span>
            ) : (
              <Button onClick={() => void connect()}>{t.connect}</Button>
            )}
            <Button variant="primary" disabled={!printer || busy || picked.length === 0} onClick={() => void print()}>
              {t.print(picked.length)}
            </Button>
            {busy && <Button onClick={() => (stop.current = true)}>{t.stop}</Button>}
          </>
        ) : (
          <p className="hint">{t.noBluetooth}</p>
        )}
        <Button disabled={rows.length === 0} onClick={downloadSheet} title={t.sheetHint}>
          {t.sheet(picked.length > 0 ? picked.length : rows.length)}
        </Button>
        {status && (
          <span className="labels-status" role="status">
            {status}
          </span>
        )}
      </div>

      <div className="labels-pick">
        <input type="search" value={query} placeholder={t.searchHint} aria-label={t.search} onChange={(e) => setQuery(e.target.value)} />
        <Button onClick={() => setChosen(new Set([...chosen, ...rows.map((x) => x.d.id)]))}>{t.all(rows.length)}</Button>
        <Button disabled={chosen.size === 0} onClick={() => setChosen(new Set())}>
          {t.none}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="hint">{t.nothing}</p>
      ) : (
        <ul className="labels-list">
          {rows.map((x) => (
            <li key={x.d.id}>
              <label>
                <input type="checkbox" checked={chosen.has(x.d.id)} onChange={() => toggle(x.d.id)} />
                <LabelPreview content={x.label} tape={tape} />
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One label drawn at the printer's dots and shown at twice its size in millimetres. */
function LabelPreview({ content, tape }: { content: LabelContent; tape: ReturnType<typeof tapeOf> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => pixelsOf(drawLabel(content, tape, canvas));
    draw();
    // The font may arrive after the first drawing: draw again once it has.
    void document.fonts?.ready.then(draw);
  }, [content, tape]);
  return <canvas ref={ref} className="label-preview" role="img" aria-label={`${content.title} · ${content.strength} · ${content.footer}`} />;
}
