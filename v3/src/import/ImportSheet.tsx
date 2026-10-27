import { useMemo, useRef, useState } from "react";
import type { LocalDatabase } from "../db/local/database";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { FailureNote } from "../FailureNote";
import { confirmImport } from "./confirm";
import { matchSheet, targetOf } from "./match";
import { FIELDS, guessColumns, readSheet, rowsOf, type Columns, type Field } from "./read";
import "../dilution/dilutions.css";

const t = texts.importSheet;

/**
 * «Import a sheet» (V3-80, F19): pasted rows or a .csv become a list to review. Each row shows what
 * the sheet says and what the glossary has; you choose the material or leave the row out, and only
 * «Confirm» writes: each chosen material becomes yours with «I have it».
 */
export function ImportSheet({ data, local, onDone, onCancel }: { data: GlossaryData; local: LocalDatabase; onDone: () => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const sheet = useMemo(() => readSheet(text), [text]);
  const [columns, setColumns] = useState<Columns | null>(null);
  const cols = columns ?? guessColumns(sheet.header);
  const live = useMemo(() => matchSheet(rowsOf(sheet, cols), data.catalog, data.index), [sheet, cols, data]);
  // While «Confirm» writes, the list stays as you left it: each write reloads the glossary.
  const frozen = useRef(live);
  const [saving, setSaving] = useState<{ done: number; total: number } | null>(null);
  const matches = saving ? frozen.current : live;
  // The choice of each row, by its line: a material id, or null to leave it out. Found rows start chosen.
  const [chosen, setChosen] = useState<ReadonlyMap<number, string | null>>(new Map());
  const choiceOf = (line: number, fallback: string | null) => (chosen.has(line) ? chosen.get(line)! : fallback);
  const picks = matches
    .map((m) => ({ m, id: choiceOf(m.row.line, m.status === "found" && !m.alreadyYours ? m.candidates[0].id : null) }))
    .filter((p): p is { m: (typeof matches)[number]; id: string } => p.id !== null);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const load = (next: string) => {
    setText(next);
    setColumns(null);
    setChosen(new Map());
    setMessage(null);
  };
  const confirm = () => {
    frozen.current = live;
    const seen = new Set<string>();
    const choices = picks
      .map((p) => ({ ...targetOf(p.id, data.catalog), shop: p.m.row.shop, product: p.m.row.product }))
      .filter((c) => !seen.has(c.materialId) && seen.add(c.materialId));
    setSaving({ done: 0, total: choices.length });
    void confirmImport(local.db, local.userId, choices, (done) => setSaving({ done, total: choices.length }))
      .then((r) => {
        setMessage(t.done(r.created, r.marked));
        setText("");
        setChosen(new Map());
      }, (e: unknown) => setFailure(t.failed(e instanceof Error ? e.message : String(e))))
      .finally(() => setSaving(null));
  };
  const name = (id: string) => data.catalog.materials.get(id)?.name ?? "—";

  return (
    <section className="dilutions import-sheet">
      <div className="title-bar">
        <h2 className="page-title">{t.title}</h2>
        <span className="buttons">
          <button type="button" className="secondary" onClick={message ? onDone : onCancel}>
            {t.cancel}
          </button>
        </span>
      </div>
      <p className="hint">{t.hint}</p>
      {message && (
        <p className="hint" role="status">
          {message}
        </p>
      )}
      <label className="field">
        {t.paste}
        <textarea rows={5} value={text} onChange={(e) => load(e.target.value)} spellCheck={false} />
      </label>
      <label className="field">
        {t.file}
        <input type="file" accept=".csv,.tsv,.txt,text/csv" onChange={(e) => void e.target.files?.[0]?.text().then(load)} />
      </label>

      {sheet.header.length > 0 && (
        <fieldset>
          <legend>{t.columns}</legend>
          <div className="pair">
            {FIELDS.map((f: Field) => (
              <label key={f} className="field">
                {t.field[f]}
                <select
                  value={cols[f] ?? ""}
                  onChange={(e) => {
                    setColumns({ ...cols, [f]: e.target.value === "" ? null : Number(e.target.value) });
                    setChosen(new Map());
                  }}
                >
                  <option value="">{t.noColumn}</option>
                  {sheet.header.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `#${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {matches.length > 0 && (
        <>
          <p className="hint">{t.count(matches.length, picks.length)}</p>
          <table className="import-list">
            <thead>
              <tr>
                <th>{t.line}</th>
                <th>{t.sheetSays}</th>
                <th>{t.found}</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => {
                const value = choiceOf(m.row.line, m.status === "found" && !m.alreadyYours ? m.candidates[0].id : null);
                return (
                  <tr key={m.row.line} className={`import-${m.status}`}>
                    <td>{m.row.line}</td>
                    <td>
                      <strong>{m.row.name || m.row.product}</strong>
                      <span className="hint"> {[m.row.cas, m.row.product !== m.row.name ? m.row.product : "", m.row.shop, m.row.note].filter((x) => x).join(" · ")}</span>
                    </td>
                    <td>
                      <span className={`status-chip import-${m.status}`}>{t.status[m.status]}</span>
                      {m.by && <span className="hint"> {t.by[m.by]}</span>}
                      {m.alreadyYours && <span className="hint"> · {t.alreadyYours}</span>}
                      {m.candidates.length > 0 && (
                        <select
                          aria-label={`${t.found} ${m.row.line}`}
                          value={value ?? ""}
                          onChange={(e) => setChosen(new Map(chosen).set(m.row.line, e.target.value || null))}
                        >
                          <option value="">{t.skip}</option>
                          {m.candidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {name(c.id)}
                              {c.cas ? ` · ${c.cas}` : ""} · {c.ownerId === null ? t.common : t.yours}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {matches.some((m) => m.status === "missing") && <p className="hint">{t.missingNote}</p>}
          <div className="actions">
            <button type="button" disabled={saving !== null || picks.length === 0} onClick={confirm}>
              {t.confirm}
            </button>
            {saving && (
              <span className="hint" role="status">
                {t.saving(saving.done, saving.total)}
              </span>
            )}
          </div>
        </>
      )}
      <FailureNote message={failure} onClose={() => setFailure(null)} floating />
    </section>
  );
}
