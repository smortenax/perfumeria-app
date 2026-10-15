import { type KeyboardEvent, useRef, useState } from "react";
import { Formulas } from "../glossary/Glossary";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/es";

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
}: {
  data: GlossaryData;
  onOpen: (id: string) => void;
  onNew: (workbenchId: string) => void;
  onNewBench: (name: string) => void;
}) {
  const t = texts.library;
  const [tab, setTab] = useState<Tab>("benches");
  const [query, setQuery] = useState("");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const at = TABS.indexOf(tab);
    const next = e.key === "ArrowRight" ? (at + 1) % TABS.length : e.key === "ArrowLeft" ? (at + TABS.length - 1) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    setTab(TABS[next]);
    refs.current[next]?.focus();
  };
  return (
    <section className="glossary library">
      <div className="title-bar">
        <h2>{t.title}</h2>
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
      <label className="search">
        {texts.glossary.search}
        <input type="search" value={query} placeholder={texts.glossary.formulasSearchHint} onChange={(e) => setQuery(e.target.value)} />
      </label>
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
        <Formulas data={data} query={query} marker={MARKER[tab]} onOpen={onOpen} {...(tab === "benches" ? { onNew } : {})} />
      </div>
    </section>
  );
}
