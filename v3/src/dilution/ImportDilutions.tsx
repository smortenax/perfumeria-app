import { useId, useMemo, useState } from "react";
import { Button } from "../Button";
import type { GlossaryData } from "../db/useGlossary";
import { texts } from "../i18n/en";
import { shortName } from "./grid";
import { matchDilutionPlan, readDilutionPlan, weighRowsOf, withChoice, type PlanMatch } from "./plan-import";
import type { WeighRow } from "./weigh";

const t = texts.dilutions.importPlan;

/**
 * «Import planned dilutions» (the user's inbox, 2026-11-25): a table of the bottles to make (the lab's
 * columns, plan-import.ts) becomes rows of «Add & weigh», grouped by bottle size. Each line shows what
 * the file says and what it found among yours; a missing material or diluent is picked here. Only
 * «Add to weigh» changes anything, and only the draft: nothing is saved until the rows are weighed.
 */
export function ImportDilutions({ data, userId, newKey, onAdd, onCancel }: { data: GlossaryData; userId: string; newKey: () => string; onAdd: (rows: WeighRow[]) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const read = useMemo(() => (text.trim() ? readDilutionPlan(text) : null), [text]);
  const found = useMemo(() => (read?.ok ? matchDilutionPlan(read.rows, data.catalog, userId) : []), [read, data, userId]);
  const [choices, setChoices] = useState<ReadonlyMap<number, { materialId?: string; diluentId?: string }>>(new Map());
  const matches: PlanMatch[] = found.map((m) => (choices.has(m.planned.line) ? withChoice(data.catalog, m, choices.get(m.planned.line)!) : m));
  const ready = matches.filter((m) => m.problems.length === 0);
  const ids = { file: useId(), paste: useId() };
  const mine = useMemo(() => [...data.catalog.materials.values()].filter((m) => m.ownerId !== null && !m.solvent).sort((a, b) => a.name.localeCompare(b.name, "es")), [data]);
  const solvents = useMemo(() => [...data.catalog.materials.values()].filter((m) => m.solvent).sort((a, b) => a.name.localeCompare(b.name, "es")), [data]);
  const choose = (line: number, patch: { materialId?: string; diluentId?: string }) => setChoices((c) => new Map(c).set(line, { ...c.get(line), ...patch }));
  const load = (next: string) => {
    setText(next);
    setChoices(new Map());
  };
  const nameOf = (id: string | null) => (id ? (data.catalog.materials.get(id)?.name ?? "—") : null);
  const bottleOf = (id: string | null) => (id ? [...data.catalog.dilutions.values()].flat().find((d) => d.id === id) : undefined);

  return (
    <section
      className="weigh-import"
      aria-label={t.title}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void e.dataTransfer.files[0]?.text().then(load);
      }}
    >
      <h4 className="weigh-title">{t.title}</h4>
      <p className="weigh-hint">{t.hint}</p>
      <label className="field" htmlFor={ids.file}>
        {t.file} <span className="hint">{t.drop}</span>
      </label>
      <input id={ids.file} type="file" accept=".csv,.tsv,.txt,text/csv" onChange={(e) => void e.target.files?.[0]?.text().then(load)} />
      <label className="field" htmlFor={ids.paste}>
        {t.paste}
      </label>
      <textarea id={ids.paste} rows={3} value={text} onChange={(e) => load(e.target.value)} spellCheck={false} />

      {read && !read.ok && (
        <p className="import-problem" role="alert">
          {t.missingColumns(read.missing.join(", "))}
        </p>
      )}
      {read?.ok && (
        <>
          <p className="hint" role="status">
            {t.count(matches.length, ready.length)}
          </p>
          <div className="import-plan-table">
            <table className="import-list">
              <thead>
                <tr>
                  <th scope="col" className="num">
                    {t.col.line}
                  </th>
                  <th scope="col">{t.col.material}</th>
                  <th scope="col" className="num">
                    {t.col.percent}
                  </th>
                  <th scope="col" className="num">
                    {t.col.bottle}
                  </th>
                  <th scope="col">{t.col.diluent}</th>
                  <th scope="col">{t.col.status}</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const p = m.planned;
                  const source = bottleOf(m.sourceId);
                  return (
                    <tr key={p.line} className={m.problems.length ? "import-off" : undefined}>
                      <td className="num">{p.line}</td>
                      <td>
                        {p.material}
                        {m.materialId ? (
                          nameOf(m.materialId) !== p.material && <span className="hint"> → {nameOf(m.materialId)}</span>
                        ) : (
                          <select aria-label={t.pickMaterial(p.material)} value="" onChange={(e) => e.target.value && choose(p.line, { materialId: e.target.value })}>
                            <option value="">{t.pick}</option>
                            {(m.candidates.length ? m.candidates.map((id) => data.catalog.materials.get(id)!).filter(Boolean) : mine).map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {source && <span className="hint"> · {t.fromBottle(p.fromPct)}</span>}
                      </td>
                      <td className="num">{p.fractionPct} %</td>
                      <td className="num">{[p.bottleMl ? `${p.bottleMl} ml` : null, p.batchG ? `${p.batchG} g` : null].filter(Boolean).join(" · ") || "—"}</td>
                      <td>
                        {m.diluentId ? (
                          shortName(data.catalog.materials.get(m.diluentId))
                        ) : (
                          <select aria-label={t.pickDiluent(p.diluent)} value="" onChange={(e) => e.target.value && choose(p.line, { diluentId: e.target.value })}>
                            <option value="">{p.diluent || t.pick}</option>
                            {solvents.map((x) => (
                              <option key={x.id} value={x.id}>
                                {shortName(x)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        {m.problems.length === 0 ? (
                          <span className="status-chip import-found">{t.ok}</span>
                        ) : (
                          <span className="hint import-problem">{m.problems.map((x) => t.problem[x](p)).join(" · ")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {matches.some((m) => m.problems.includes("source")) && <p className="hint">{t.sourceNote}</p>}
        </>
      )}
      <div className="actions">
        <Button variant="secondary" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button variant="primary" disabled={ready.length === 0} onClick={() => onAdd(weighRowsOf(ready, newKey))}>
          {t.add(ready.length)}
        </Button>
      </div>
    </section>
  );
}
