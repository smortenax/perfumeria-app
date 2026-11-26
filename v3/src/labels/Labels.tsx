import { useEffect, useMemo, useRef, useState } from "react";
import type { Dilution } from "../db/catalog";
import type { GlossaryData } from "../db/useGlossary";
import { texts } from "../i18n/en";
import { Button } from "../Button";
import { dilutionLabel, linesOf, type LabelContent } from "./content";
import type { tapeOf } from "./media";
import { drawTwoLines, pixelsOf } from "./render";
import { PrinterButtons, PrinterStatus, TapeControls } from "./PrinterControls";
import { usePrinter } from "./usePrinter";
import { readJobs, removeJob, type PrintJob } from "./jobs";
import { canReachPrinter } from "./printer";
import "./labels.css";

const t = texts.labels;

const drawn = (l: LabelContent, tape: ReturnType<typeof tapeOf>, canvas?: HTMLCanvasElement) => {
  const { big, small } = linesOf(l);
  return drawTwoLines(big, small, tape, canvas).canvas;
};

/**
 * «Labels» in Dilutions (V3-110): pick bottles, see each label as it will print, and send them one
 * after another to a Marklife P15 by Bluetooth. Each batch saved in «Add & weigh» has its own «Print»,
 * from the print text kept apart when it was saved (jobs.ts; the user, 2026-11-24: «cada batch de
 * diluciones tenga un boton que sea imprimir una vez finalizado el batch»).
 */
export function Labels({ data, all }: { data: GlossaryData; all: readonly { materialId: string; d: Dilution }[] }) {
  const p = usePrinter();
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [jobs, setJobs] = useState<PrintJob[]>(readJobs);
  const tape = p.tape;

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
  return (
    <div className="labels">
      <div className="labels-bar">
        <TapeControls p={p} />
        <PrinterButtons p={p}>
          <Button variant="primary" disabled={!p.printer || p.busy || picked.length === 0} onClick={() => void p.print(picked.map((x) => linesOf(x.label)))}>
            {t.print(picked.length)}
          </Button>
        </PrinterButtons>
        <PrinterStatus p={p} />
      </div>

      {jobs.length > 0 && (
        <section className="labels-batches" aria-label={t.batches}>
          <h3>{t.batches}</h3>
          <ul>
            {jobs.map((j) => (
              <li key={j.id}>
                <details>
                  <summary className="labels-batch-name">{t.batch(j.day, j.savedAt, j.lines.length)}</summary>
                  <ul className="labels-batch-lines">
                    {j.lines.map((l, i) => (
                      <li key={i}>
                        <strong>{l.big}</strong> {l.small}
                      </li>
                    ))}
                  </ul>
                </details>
                {canReachPrinter() && (
                  <Button variant="primary" disabled={p.busy} onClick={() => void p.print(j.lines)}>
                    {t.print(j.lines.length)}
                  </Button>
                )}
                <Button onClick={() => setJobs(removeJob(j.id))}>{t.removeBatch}</Button>
              </li>
            ))}
          </ul>
        </section>
      )}

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
    const draw = () => pixelsOf(drawn(content, tape, canvas));
    draw();
    // The font may arrive after the first drawing: draw again once it has.
    void document.fonts?.ready.then(draw);
  }, [content, tape]);
  return <canvas ref={ref} className="label-preview" role="img" aria-label={`${content.title} · ${content.strength} · ${content.footer}`} />;
}
