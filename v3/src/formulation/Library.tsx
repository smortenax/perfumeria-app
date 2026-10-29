import { type CSSProperties, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { formatGrams } from "../core/display";
import type { FormulaRecord } from "../db/formulas";
import { FamilyBar } from "../families/FamilyBar";
import type { LocalDatabase } from "../db/local/database";
import { normalize } from "../db/search";
import { byVersions, Formulas } from "../glossary/Glossary";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { Pills } from "../Pills";
import { tabAfterKey } from "../tabs";
import { type EventRow, type Preview, previewsOf, type Sort, SORTS, sortFormulas } from "./preview";
import { useFormulaChecks } from "./useFormulaChecks";
import { useMacerations } from "./useMacerations";
import { VersionTree } from "./VersionTree";
import { macerationState, startMaceration, todayIso } from "../db/macerations";
import { EmptyState } from "../EmptyState";

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
  local,
  onOpen,
  onNew,
  onNewBench,
  onDeleteBench,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  onOpen: (id: string) => void;
  onNew: (workbenchId: string) => void;
  onNewBench: (name: string) => void;
  onDeleteBench: (workbenchId: string) => void;
}) {
  const t = texts.library;
  // The steps of every formula, live, for what each row says (F1).
  const [events, setEvents] = useState<EventRow[]>([]);
  useEffect(() => {
    const abort = new AbortController();
    local.powerSync.watch(
      "SELECT id, formula_id AS formulaId, kind, material_id AS materialId, target, created_at AS createdAt FROM formula_events",
      [],
      { onResult: (r) => setEvents((r.rows?._array ?? []) as EventRow[]) },
      { signal: abort.signal },
    );
    return () => abort.abort();
  }, [local]);
  const previews = useMemo(() => previewsOf(data.formulas, events), [data.formulas, events]);
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
          <Benches data={data} local={local} previews={previews} query={query} onOpen={onOpen} onNew={onNew} onDeleteBench={onDeleteBench} />
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
  local,
  previews,
  query,
  onOpen,
  onNew,
  onDeleteBench,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  previews: ReadonlyMap<string, Preview>;
  query: string;
  onOpen: (id: string) => void;
  onNew: (workbenchId: string) => void;
  onDeleteBench: (workbenchId: string) => void;
}) {
  const t = texts.glossary;
  const l = texts.library;
  const [chosen, setChosen] = useState<string | null>(null);
  // The formula pointed at, in the rows or in the version tree (V3-77): both light up together.
  const [active, setActive] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("versions");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const words = normalize(query).split(/\s+/).filter((w) => w);
  const benchName = new Map(data.workbenches.map((b) => [b.id, b.name]));
  const shown = data.formulas.filter((f) => words.every((w) => normalize(`${f.name} ${benchName.get(f.workbenchId) ?? ""}`).includes(w)));
  // An empty workbench is listed too, unless searching: a new one is where its first formula is made.
  const benches = data.workbenches
    .filter((b) => shown.some((f) => f.workbenchId === b.id) || words.length === 0)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  // Open first: the one you chose, else the first that has formulas.
  const current = benches.find((b) => b.id === chosen) ?? benches.find((b) => shown.some((f) => f.workbenchId === b.id)) ?? benches[0] ?? null;
  const inside = sortFormulas(
    byVersions(shown.filter((f) => f.workbenchId === current?.id && (!favoritesOnly || f.markers.includes("favorite")))),
    sort,
    previews,
  );
  const all = data.formulas.filter((f) => f.workbenchId === current?.id).length;
  // Each formula of the open bench by families (F2) and its IFRA (F20), as the bench reads them.
  const checks = useFormulaChecks(local, data, inside.map((f) => f.id));
  // What is macerating (V3-83), with its day.
  const macerations = useMacerations(local);
  const macerating = new Map(macerations.map((m) => [m.formulaId, macerationState(m, todayIso()).day]));
  if (!current) return <p className="hint">{words.length ? t.noFormulas : t.noFormulasYet(false)}</p>;
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
        <div className="list-tools">
          <Pills label={l.sortBy} value={sort} options={SORTS.map((x) => ({ value: x, label: l.sorts[x] }))} onChange={(v) => setSort(v ?? "versions")} />
          <span className="pills">
            <button type="button" className="pill" aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(!favoritesOnly)}>
              {l.favoritesOnly}
            </button>
          </span>
        </div>
        {inside.length === 0 ? (
          words.length ? (
            <p className="hint">{t.noFormulas}</p>
          ) : favoritesOnly && all > 0 ? (
            <EmptyState title={t.noFavorites} text={t.noFavoritesText}>
              <button type="button" className="secondary" onClick={() => setFavoritesOnly(false)}>
                {t.showAll}
              </button>
            </EmptyState>
          ) : (
            <EmptyState title={t.emptyBench} text={t.emptyBenchText}>
              <button type="button" onClick={() => onNew(current.id)}>
                {t.newFormula}
              </button>
            </EmptyState>
          )
        ) : (
          <div className="bench-body">
          <ul className="formula-rows">
            {inside.map((f) => {
              const parent = f.parentId ? data.formulas.find((x) => x.id === f.parentId) : undefined;
              return (
                <li key={f.id} className="formula-row-wrap">
                  <button
                    type="button"
                    className={`formula-row${active === f.id ? " active" : ""}`}
                    style={{ "--depth": depth(f) } as CSSProperties}
                    onClick={() => onOpen(f.id)}
                    onMouseEnter={() => setActive(f.id)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(f.id)}
                    onBlur={() => setActive(null)}
                  >
                    <span className="formula-main">
                      <span className="formula-name">{f.name}</span>
                      {(parent || f.role) && <span className="formula-detail">{[parent ? t.versionFrom(parent.name) : null, f.role].filter((x) => x).join(" · ")}</span>}
                      <span className="formula-detail formula-preview">{previewText(f, previews.get(f.id))}</span>
                      <FamilyBar className="formula-families" shares={checks.get(f.id)?.families ?? []} />
                      {/* Its intention and its notes (F7), the first line of each. */}
                      {(f.intention.trim() || f.notes.trim()) && (
                        <span className="formula-detail formula-notes">{[f.intention, f.notes].map((x) => x.trim().split("\n")[0]).filter((x) => x).join(" · ")}</span>
                      )}
                    </span>
                    {checks.get(f.id) && checks.get(f.id)!.ifra !== "empty" && (
                      <span className={`ifra-label ifra-label-${checks.get(f.id)!.ifra}`}>{texts.ifraLabel[checks.get(f.id)!.ifra]}</span>
                    )}
                    {[...f.markers].sort((a, b) => MARKER_ORDER.indexOf(a) - MARKER_ORDER.indexOf(b)).map((m) => (
                      <span key={m} className="chip">
                        {t.markers[m]}
                      </span>
                    ))}
                    {macerating.has(f.id) && <span className="chip macerating-chip">⏱ {texts.maceration.day(macerating.get(f.id)!)}</span>}
                    <span className="formula-open" aria-hidden="true">
                      →
                    </span>
                  </button>
                  {/* Start macerating it (V3-83): optional, a clock on each formula of the list. */}
                  {!macerating.has(f.id) && (
                    <button
                      type="button"
                      className="tool macerate"
                      title={texts.maceration.startTitle(f.name)}
                      aria-label={texts.maceration.startTitle(f.name)}
                      onClick={() => void startMaceration(local.db, local.userId, f.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                        <circle cx="8" cy="8" r="6" />
                        <path d="M8 4.5V8l2.5 1.5" />
                      </svg>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <section className="version-panel" aria-labelledby="version-panel-title">
            <h4 className="version-title" id="version-panel-title">
              {texts.library.versions}
            </h4>
            <p className="hint">{texts.library.versionsHint}</p>
            <VersionTree formulas={inside} bench={current.name} active={active} onActive={setActive} onOpen={onOpen} />
          </section>
          </div>
        )}
      </section>
    </div>
  );
}

const MARKER_ORDER = ["favorite", "locked", "accord", "finished"];

/** «3 materials · final batch 3,000 g · changed 27 Oct 2026» (F1). */
function previewText(f: FormulaRecord, p: Preview | undefined): string {
  const l = texts.library;
  const batch = f.finalBatchUg ? l.finalBatch(formatGrams(Ratio.of(f.finalBatchUg))) : f.workBatchUg ? l.workBatch(formatGrams(Ratio.of(f.workBatchUg))) : null;
  const day = p?.lastChange ? new Date(p.lastChange) : null;
  const when = day && !Number.isNaN(day.getTime()) ? l.changed(day.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })) : null;
  return [l.materialsCount(p?.materials ?? 0), batch, when].filter((x) => x).join(" · ");
}
