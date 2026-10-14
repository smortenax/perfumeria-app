import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { type CatalogMaterial, MATERIAL_KINDS, type MaterialKind } from "../db/catalog";
import { normalize } from "../db/search";
import { listAll, search } from "../db/search";
import { texts } from "../i18n/es";
import { type Filters, type IfraState, keepOf, NO_FILTERS } from "./browse";
import type { GlossaryData } from "./useGlossary";

const PAGE = 60;
const IFRA_STATES = Object.keys(texts.ifraState) as IfraState[];
/** The tabs (V3-50): your materials, the general ones (each a filter of «whose»), and your formulas, apart so nothing mixes. */
const TABS = ["own", "common", "formulas", "accords"] as const;
type Tab = (typeof TABS)[number];

/** Marks or unmarks materials as what you have (V3-3); answers how many changed. */
export type Mark = (ids: readonly string[], have: boolean) => Promise<number>;

/**
 * The glossary (plan v3, step 6.1; V3-50): two tabs, yours and the general ones, with the search
 * and the filters; the materials in a grid, each with its icon (its abbreviation, for now; its
 * own visual identity later, V3-47) and its name under it. A category's materials go together
 * (V3-13). In marking mode (step 6.5) each tile is a box of «lo que tengo».
 */
export function Glossary({ data, onOpen, onNew, mark }: { data: GlossaryData; onOpen: (id: string) => void; onNew: () => void; mark: Mark }) {
  const t = texts.glossary;
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({ ...NO_FILTERS, owner: "own" });
  const [limit, setLimit] = useState(PAGE);
  const [message, setMessage] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const set = (change: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...change }));
    setLimit(PAGE);
    setMessage(null);
  };
  const [tab, setTab] = useState<Tab>("own");
  const choose = (next: Tab, focus = false) => {
    setTab(next);
    if (next === "own" || next === "common") set({ owner: next });
    else setMarking(false);
    if (focus) tabRefs.current[TABS.indexOf(next)]?.focus();
  };
  // The tabs answer the keyboard as ARIA's pattern asks: arrows, Home and End.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const at = TABS.indexOf(tab);
    const next = e.key === "ArrowRight" ? (at + 1) % TABS.length : e.key === "ArrowLeft" ? (at + TABS.length - 1) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    choose(TABS[next], true);
  };

  const rows = useMemo(() => {
    const keep = keepOf(filters, data.catalog.have, (id) => data.ifraStates.get(id)?.state ?? "no-data");
    return query.trim() ? search(data.index, query, limit, keep) : listAll(data.index, limit, keep);
  }, [data, query, filters, limit]);
  const materials = rows.flatMap((r) => r.members.map((m) => m.material));
  const markShown = (have: boolean) =>
    void mark(materials.map((m) => m.id), have).then(
      (n) => setMessage(t.marked(n)),
      (e: unknown) => setMessage(texts.editor.failed(e instanceof Error ? e.message : String(e))),
    );

  return (
    <section className="glossary">
      <div className="title-bar">
        <h2>{t.title}</h2>
        <span className="buttons">
          <button
            type="button"
            hidden={tab === "formulas" || tab === "accords"}
            className={marking ? "" : "secondary"}
            onClick={() => {
              setMarking((m) => !m);
              setMessage(null);
            }}
          >
            {marking ? t.markDone : t.markMode}
          </button>
          <button type="button" onClick={onNew}>
            {texts.editor.newMaterial}
          </button>
        </span>
      </div>
      <label className="search">
        {t.search}
        <input
          type="search"
          value={query}
          placeholder={tab === "formulas" || tab === "accords" ? t.formulasSearchHint : t.searchHint}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
            setMessage(null);
          }}
        />
      </label>
        {(tab === "own" || tab === "common") && (
        <div className="filters">
          <label>
            {t.kind}
            <select value={filters.kind ?? ""} onChange={(e) => set({ kind: (e.target.value || null) as MaterialKind | null })}>
              <option value="">{t.any}</option>
              {MATERIAL_KINDS.map((k) => (
                <option key={k} value={k}>
                  {texts.kinds[k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.ifra}
            <select value={filters.ifra ?? ""} onChange={(e) => set({ ifra: (e.target.value || null) as IfraState | null })}>
              <option value="">{t.any}</option>
              {IFRA_STATES.map((s) => (
                <option key={s} value={s}>
                  {texts.ifraState[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={filters.haveOnly} onChange={(e) => set({ haveOnly: e.target.checked })} />
            {t.haveOnly}
          </label>
        </div>
        )}
      <div className="tabs" role="tablist" aria-label={t.owner}>
        {TABS.map((x, i) => (
          <button
            key={x}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${x}`}
            aria-selected={tab === x}
            aria-controls="glossary-panel"
            tabIndex={tab === x ? 0 : -1}
            className="tab"
            onClick={() => choose(x)}
            onKeyDown={onTabKey}
          >
            {t.tabs[x]}
          </button>
        ))}
      </div>
      <div className="tab-panel" role="tabpanel" id="glossary-panel" aria-labelledby={`tab-${tab}`}>
        {tab === "formulas" || tab === "accords" ? (
          <Formulas data={data} query={query} accords={tab === "accords"} />
        ) : (
        <>
        <p className="hint">{materials.length ? t.foundMaterials(materials.length) : t.none}</p>
        {marking && (
          <div className="marking">
            <p className="hint">{t.markHint}</p>
            <span className="buttons">
              <button type="button" disabled={materials.length === 0} onClick={() => markShown(true)}>
                {t.markAll(materials.length)}
              </button>
              <button type="button" className="secondary" disabled={materials.length === 0} onClick={() => markShown(false)}>
                {t.unmarkAll(materials.length)}
              </button>
            </span>
            {message && <p className="hint">{message}</p>}
          </div>
        )}
        <ul className="grid">
          {materials.map((material) => (
            <li key={material.id}>
              <Tile material={material} data={data} onOpen={onOpen} marking={marking} mark={mark} />
            </li>
          ))}
        </ul>
        {rows.length === limit && (
          <button type="button" onClick={() => setLimit((l) => l + PAGE)}>
            {t.more}
          </button>
        )}
        </>
        )}
      </div>
    </section>
  );
}

/** The letters of a material without an abbreviation: its initials, shown as such (dashed). */
const initials = (name: string) =>
  name
    .split(/[\s,()-]+/)
    .filter((w) => /\p{L}|\d/u.test(w))
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");

/** One material's tile: its icon with its abbreviation, its name under it, and what tells it apart (V3-11). */
function Tile({ material, data, onOpen, marking, mark }: { material: CatalogMaterial; data: GlossaryData; onOpen: (id: string) => void; marking: boolean; mark: Mark }) {
  const t = texts.glossary;
  const state = data.ifraStates.get(material.id)?.state ?? "no-data";
  const base = material.basedOnId ? data.catalog.materials.get(material.basedOnId) : undefined;
  const abbreviation = material.abbreviation ?? base?.abbreviation ?? null;
  const have = data.catalog.have.has(material.id);
  const detail =
    material.ownerId === null
      ? [material.form, material.house].filter((x) => x).join(" · ")
      : ([material.supplier, material.product].filter((x) => x)[0] ?? texts.kinds[material.kind]);
  const content = (
    <>
      <span className={`icon${abbreviation ? "" : " no-abbr"}${have ? " have" : ""}`} aria-hidden="true">
        {abbreviation ?? initials(material.name)}
      </span>
      <span className="tile-name">{material.name}</span>
      {detail && <span className="tile-detail">{detail}</span>}
      <span className={`ifra ifra-${state}`} title={texts.ifraStateHelp[state]}>
        {texts.ifraState[state]}
      </span>
    </>
  );
  if (marking) {
    return (
      <label className="tile marking">
        <input type="checkbox" checked={have} onChange={() => void mark([material.id], !have)} aria-label={`${t.haveToggle}: ${material.name}`} />
        {content}
      </label>
    );
  }
  return (
    <button type="button" className="tile" onClick={() => onOpen(material.id)} aria-label={`${material.name}${have ? `, ${t.haveMark}` : ""}`}>
      {content}
    </button>
  );
}

/**
 * Your formulas (V3-50), by workbench (V3-19): each bench, with its formulas as tiles. They open in
 * the workbench, which comes with phase 8; for now they are shown, with their markers and versions.
 */
function Formulas({ data, query, accords }: { data: GlossaryData; query: string; accords: boolean }) {
  const t = texts.glossary;
  const words = normalize(query).split(/\s+/).filter((w) => w);
  const benchName = new Map(data.workbenches.map((b) => [b.id, b.name]));
  // «Acordes» is V3-19's general folder: the formulas marked as accords, from every workbench; they stay in theirs too.
  const shown = data.formulas.filter(
    (f) => (!accords || f.markers.includes("accord")) && words.every((w) => normalize(`${f.name} ${benchName.get(f.workbenchId) ?? ""}`).includes(w)),
  );
  if (accords) {
    return (
      <>
        <p className="hint">
          {shown.length ? t.foundAccords(shown.length) : t.noFormulas} {t.formulasLater}
        </p>
        <ul className="grid">
          {[...shown].sort((x, y) => x.name.localeCompare(y.name, "es")).map((f) => (
            <li key={f.id}>
              <FormulaTile formula={f} data={data} bench={benchName.get(f.workbenchId) ?? null} />
            </li>
          ))}
        </ul>
      </>
    );
  }
  const benches = data.workbenches.filter((b) => shown.some((f) => f.workbenchId === b.id));
  return (
    <>
      <p className="hint">
        {shown.length ? t.foundFormulas(shown.length) : t.noFormulas} {t.formulasLater}
      </p>
      {benches.map((b) => (
        <section key={b.id} className="bench">
          <h3>{b.name}</h3>
          <ul className="grid">
            {shown
              .filter((f) => f.workbenchId === b.id)
              .sort((x, y) => x.name.localeCompare(y.name, "es"))
              .map((f) => (
                <li key={f.id}>
                  <FormulaTile formula={f} data={data} bench={null} />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </>
  );
}

/** One formula's tile: its icon, its name, its workbench when shown outside it, its version and its markers. */
function FormulaTile({ formula: f, data, bench }: { formula: GlossaryData["formulas"][number]; data: GlossaryData; bench: string | null }) {
  const t = texts.glossary;
  const parent = f.parentId ? data.formulas.find((x) => x.id === f.parentId) : undefined;
  return (
    <div className="tile formula">
      <span className="icon formula-icon" aria-hidden="true">
        {initials(f.name)}
      </span>
      <span className="tile-name">{f.name}</span>
      {bench && <span className="tile-detail">{t.inBench(bench)}</span>}
      {parent && <span className="tile-detail">{t.versionFrom(parent.name)}</span>}
      {f.role && <span className="tile-detail">{f.role}</span>}
      {f.markers.map((m) => (
        <span key={m} className="ifra">
          {t.markers[m]}
        </span>
      ))}
    </div>
  );
}
