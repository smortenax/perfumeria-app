import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { FormulaRecord, Workbench } from "../db/formulas";
import { switchBenches, switchFormulas } from "./switcher";
import { texts } from "./texts";

const s = texts.switcher;

type Mode = "benches" | "formulas";

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 4.5L6 7.5l3-3" />
  </svg>
);

/**
 * «Bench ▾ / Formula ▾» in the bench's head (audit 2026-10-24, F-02 L2): go to another formula or
 * version without going back to Formulation. The first menu lists the workbenches; choosing one shows
 * its formulas in the same pop-up, and only choosing a formula opens it. The second menu starts on
 * the formulas of the bench you are in. Arrows move through the list, Escape closes it.
 */
export function BenchSwitcher(props: {
  workbenches: readonly Workbench[];
  formulas: readonly FormulaRecord[];
  formulaId: string;
  benchId: string;
  /** The name as it is being typed in the head. */
  name: string;
  onOpen: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [browsing, setBrowsing] = useState(props.benchId);
  const [query, setQuery] = useState("");
  const wrap = useRef<HTMLElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const benchButton = useRef<HTMLButtonElement>(null);
  const formulaButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<Mode>("formulas");

  const benchName = props.workbenches.find((b) => b.id === props.benchId)?.name ?? "—";
  const browsingName = props.workbenches.find((b) => b.id === browsing)?.name ?? "—";

  const show = (next: Mode) => {
    setMode(next);
    setQuery("");
  };
  const open = (next: Mode) => {
    if (mode === next) return close();
    opener.current = next;
    setBrowsing(props.benchId);
    show(next);
  };
  const close = (refocus = true) => {
    setMode(null);
    if (refocus) (opener.current === "benches" ? benchButton : formulaButton).current?.focus();
  };

  // The search takes the keys as the pop-up opens, and again when it turns from benches to formulas.
  useEffect(() => {
    if (mode) search.current?.focus();
  }, [mode, browsing]);

  // A press outside closes it, without taking the focus from where it went.
  useEffect(() => {
    if (!mode) return;
    const outside = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  });

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const items = [search.current, ...(pop.current?.querySelectorAll<HTMLElement>("[data-item]") ?? [])].filter((x): x is HTMLElement => x !== null);
    // In the search, Home and End move the caret.
    if ((e.key === "Home" || e.key === "End") && document.activeElement === search.current) return;
    e.preventDefault();
    const at = items.indexOf(document.activeElement as HTMLElement);
    const last = items.length - 1;
    const next = e.key === "Home" ? 1 : e.key === "End" ? last : e.key === "ArrowDown" ? Math.min(at + 1, last) : Math.max(at - 1, 0);
    items[Math.min(next, last)]?.focus();
  };

  const benches = mode === "benches" ? switchBenches(props.workbenches, props.formulas, props.benchId, query) : [];
  const formulas = mode === "formulas" ? switchFormulas(props.formulas, browsing, props.formulaId, query) : [];
  const inBench = mode === "formulas" && props.formulas.some((f) => f.workbenchId === browsing);

  return (
    <nav className="bench-crumbs" aria-label={s.label} ref={wrap}>
      <button
        ref={benchButton}
        type="button"
        className="crumb"
        aria-label={s.bench(benchName)}
        aria-haspopup="dialog"
        aria-expanded={mode === "benches"}
        onClick={() => open("benches")}
      >
        <span className="crumb-text">{benchName}</span>
        <Chevron />
      </button>
      <span className="crumb-sep" aria-hidden="true">
        /
      </span>
      <button
        ref={formulaButton}
        type="button"
        className="crumb"
        aria-label={s.formula(props.name)}
        aria-haspopup="dialog"
        aria-expanded={mode === "formulas"}
        onClick={() => open("formulas")}
      >
        <span className="crumb-text">{props.name}</span>
        <Chevron />
      </button>
      {mode && (
        <div ref={pop} className="menu-pop switcher" role="dialog" aria-label={mode === "benches" ? s.allBenches : browsingName} onKeyDown={onKey}>
          <input ref={search} type="search" className="switcher-search" placeholder={s.search} aria-label={s.search} value={query} onChange={(e) => setQuery(e.target.value)} />
          {mode === "formulas" && (
            <div className="switcher-head">
              <button type="button" className="menuitem" data-item onClick={() => show("benches")}>
                <span className="switcher-branch" aria-hidden="true">‹ </span>
                {s.allBenches}
              </button>
              <span className="menu-note">{browsingName}</span>
            </div>
          )}
          <div className="switcher-list">
            {mode === "benches" &&
              (benches.length === 0 ? (
                <span className="menu-note">{s.noBenches}</span>
              ) : (
                benches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className="menuitem"
                    data-item
                    aria-current={b.current ? "true" : undefined}
                    onClick={() => {
                      setBrowsing(b.id);
                      show("formulas");
                    }}
                  >
                    <span className="switcher-name">{b.name}</span>
                    <span className="num key">{s.formulas(b.count)}</span>
                  </button>
                ))
              ))}
            {mode === "formulas" &&
              (formulas.length === 0 ? (
                <span className="menu-note">{inBench ? s.noFormulas : s.emptyBench}</span>
              ) : (
                formulas.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="menuitem"
                    data-item
                    aria-current={f.current ? "page" : undefined}
                    style={{ paddingLeft: `calc(10px + ${f.depth} * var(--switcher-step))` }}
                    onClick={() => (f.current ? close() : props.onOpen(f.id))}
                  >
                    {f.depth > 0 && (
                      <span className="switcher-branch" aria-hidden="true">
                        ↳{" "}
                      </span>
                    )}
                    <span className="switcher-name">{f.name}</span>
                    {f.favorite && (
                      <span className="switcher-star" aria-hidden="true">
                        {" "}★
                      </span>
                    )}
                    {f.current && <span className="key">{s.current}</span>}
                  </button>
                ))
              ))}
          </div>
        </div>
      )}
    </nav>
  );
}
