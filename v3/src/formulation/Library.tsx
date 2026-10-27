import { type KeyboardEvent, useRef, useState } from "react";
import type { FormulaRecord } from "../db/formulas";
import { normalize } from "../db/search";
import { byVersions, Formulas } from "../glossary/Glossary";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { tabAfterKey } from "../tabs";

/** The library's tabs (V3-19): your workbenches, and the general folders of the markers. */
const TABS = ["benches", "accords", "finished"] as const;
type Tab = (typeof TABS)[number];
const MARKER = { benches: null, accords: "accord", finished: "finished" } as const;

/**
 * Formulation's library (plan v3, step 8.1; V3-10, V3-19): your workbenches, folded, each with its
 * formulas and their versions together; and the general folders of the markers, «Acordes» and
 * «Perfumes acabados», with the marked formulas of every workbench. A formula opens in the
 * workbench (step 8.2).
 */
export function Library({
  data,
  onOpen,
  onNew,
  onNewBench,
  onDeleteBench,
}: {
  data: GlossaryData;
  onOpen: (id: string) => void;
  onNew: (workbenchId: string) => void;
  onNewBench: (name: string) => void;
  onDeleteBench: (workbenchId: string) => void;
}) {
  const t = texts.library;
  const [tab, setTab] = useState<Tab>("benches");
  const [query, setQuery] = useState("");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = tabAfterKey(e.key, TABS.indexOf(tab), TABS.length);
    if (next === null) return;
    e.preventDefault();
    setTab(TABS[next]);
    refs.current[next]?.focus();
  };
  return (
    <section className="glossary library">
      <div className="title-bar">
        <h2 className="page-title">{t.title}</h2>
        <span className="buttons">
          <button
            type="button"
            onClick={() => {
              const name = window.prompt(t.newBenchName)?.trim();
              if (name) onNewBench(name);
            }}
          >
            {t.newBench}
          </button>
        </span>
      </div>
      <div className="tools">
        <label className="search">
          {texts.glossary.search}
          <input type="search" value={query} placeholder={texts.glossary.formulasSearchHint} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <div className="tabs" role="tablist" aria-label={t.title}>
        {TABS.map((x, i) => (
          <button
            key={x}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`library-tab-${x}`}
            aria-selected={tab === x}
            aria-controls="library-panel"
            tabIndex={tab === x ? 0 : -1}
            className="tab"
            onClick={() => setTab(x)}
            onKeyDown={onKey}
          >
            {t.tabs[x]}
          </button>
        ))}
      </div>
      <div className="tab-panel" role="tabpanel" id="library-panel" aria-labelledby={`library-tab-${tab}`}>
        {tab === "benches" ? (
          <Benches data={data} query={query} onOpen={onOpen} onNew={onNew} onDeleteBench={onDeleteBench} />
        ) : (
          <Formulas data={data} query={query} marker={MARKER[tab]} onOpen={onOpen} />
        )}
      </div>
    </section>
  );
}

/**
 * The workbenches as a list, the chosen one open beside it with its formulas and their versions in
 * rows (V3-73, after the revamp prototype): the width is used, and «New formula» sits in the open
 * bench's head instead of on every folder's corner.
 */
function Benches({
  data,
  query,
  onOpen,
  onNew,
  onDeleteBench,
}: {
  data: GlossaryData;
  query: string;
  onOpen: (id: string) => void;
  onNew: (workbenchId: string) => void;
  onDeleteBench: (workbenchId: string) => void;
}) {
  const t = texts.glossary;
  const [chosen, setChosen] = useState<string | null>(null);
  const words = normalize(query).split(/\s+/).filter((w) => w);
  const benchName = new Map(data.workbenches.map((b) => [b.id, b.name]));
  const shown = data.formulas.filter((f) => words.every((w) => normalize(`${f.name} ${benchName.get(f.workbenchId) ?? ""}`).includes(w)));
  // An empty workbench is listed too, unless searching: a new one is where its first formula is made.
  const benches = data.workbenches
    .filter((b) => shown.some((f) => f.workbenchId === b.id) || words.length === 0)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  // Open first: the one you chose, else the first that has formulas.
  const current = benches.find((b) => b.id === chosen) ?? benches.find((b) => shown.some((f) => f.workbenchId === b.id)) ?? benches[0] ?? null;
  if (!current) return <p className="hint">{words.length ? t.noFormulas : t.noFormulasYet(false)}</p>;
  const inside = byVersions(shown.filter((f) => f.workbenchId === current.id));
  const all = data.formulas.filter((f) => f.workbenchId === current.id).length;
  const depth = (f: FormulaRecord) => {
    let d = 0;
    for (let p = f.parentId; p && d < 8; d++) p = data.formulas.find((x) => x.id === p)?.parentId ?? null;
    return d;
  };
  return (
    <div className="split">
      <nav className="bench-list" aria-label={texts.library.tabs.benches}>
        {benches.map((b) => {
          const n = data.formulas.filter((f) => f.workbenchId === b.id).length;
          return (
            <button key={b.id} type="button" aria-current={b.id === current.id ? "true" : undefined} onClick={() => setChosen(b.id)}>
              <span className="bench-name">{b.name}</span>
              <span className="count">{texts.library.formulasCount(n)}</span>
            </button>
          );
        })}
      </nav>
      <section className="bench-view" aria-label={current.name}>
        <div className="bench-head">
          <div>
            <h3 className="bench-title">{current.name}</h3>
            <span className="hint">{texts.library.formulasCount(all)}</span>
          </div>
          <span className="buttons">
            {all === 0 && (
              <button type="button" className="secondary" onClick={() => onDeleteBench(current.id)}>
                {t.deleteBench}
              </button>
            )}
            <button type="button" onClick={() => onNew(current.id)}>
              {t.newFormula}
            </button>
          </span>
        </div>
        {inside.length === 0 ? (
          <p className="hint">{words.length ? t.noFormulas : t.noFormulasYet(true)}</p>
        ) : (
          <ul className="formula-rows">
            {inside.map((f) => {
              const parent = f.parentId ? data.formulas.find((x) => x.id === f.parentId) : undefined;
              return (
                <li key={f.id}>
                  <button type="button" className="formula-row" style={{ paddingLeft: `calc(var(--space-inset) + ${depth(f) * 1.25}rem)` }} onClick={() => onOpen(f.id)}>
                    <span className="formula-main">
                      <span className="formula-name">{f.name}</span>
                      {(parent || f.role) && <span className="formula-detail">{[parent ? t.versionFrom(parent.name) : null, f.role].filter((x) => x).join(" · ")}</span>}
                      {/* Its intention and its notes (F7), the first line of each. */}
                      {(f.intention.trim() || f.notes.trim()) && (
                        <span className="formula-detail formula-notes">{[f.intention, f.notes].map((x) => x.trim().split("\n")[0]).filter((x) => x).join(" · ")}</span>
                      )}
                    </span>
                    {f.markers.map((m) => (
                      <span key={m} className="chip">
                        {t.markers[m]}
                      </span>
                    ))}
                    <span className="formula-open" aria-hidden="true">
                      →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
