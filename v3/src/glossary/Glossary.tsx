import { useMemo, useState } from "react";
import { type CatalogMaterial, MATERIAL_KINDS, type MaterialKind } from "../db/catalog";
import { listAll, search } from "../db/search";
import { texts } from "../i18n/es";
import { type Filters, type IfraState, keepOf, NO_FILTERS } from "./browse";
import type { GlossaryData } from "./useGlossary";

const PAGE = 30;
const IFRA_STATES = Object.keys(texts.ifraState) as IfraState[];

/** Marks or unmarks materials as what you have (V3-3); answers how many changed. */
export type Mark = (ids: readonly string[], have: boolean) => Promise<number>;

/**
 * The glossary (plan v3, step 6.1): one search box over the common materials and yours, with
 * filters. One row per category (V3-13), with its materials under it; each opens its sheet. In
 * marking mode (step 6.5), each line is a box of «lo que tengo», and what the search and the
 * filters show can be marked at once.
 */
export function Glossary({ data, onOpen, onNew, mark }: { data: GlossaryData; onOpen: (id: string) => void; onNew: () => void; mark: Mark }) {
  const t = texts.glossary;
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [limit, setLimit] = useState(PAGE);
  const [message, setMessage] = useState<string | null>(null);
  const set = (change: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...change }));
    setLimit(PAGE);
    setMessage(null);
  };

  const rows = useMemo(() => {
    const keep = keepOf(filters, data.catalog.have, (id) => data.ifraStates.get(id)?.state ?? "no-data");
    return query.trim() ? search(data.index, query, limit, keep) : listAll(data.index, limit, keep);
  }, [data, query, filters, limit]);
  const shown = rows.reduce((n, r) => n + r.members.length, 0);
  const [marking, setMarking] = useState(false);
  const markShown = (have: boolean) =>
    void mark(rows.flatMap((r) => r.members.map((m) => m.material.id)), have).then(
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
          placeholder={t.searchHint}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
            setMessage(null);
          }}
        />
      </label>
      <fieldset className="filters">
        <legend>{t.filters}</legend>
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
          {t.owner}
          <select value={filters.owner ?? ""} onChange={(e) => set({ owner: (e.target.value || null) as Filters["owner"] })}>
            <option value="">{t.any}</option>
            <option value="common">{t.common}</option>
            <option value="own">{t.own}</option>
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
      </fieldset>
      <p className="hint">{rows.length ? t.found(rows.length, shown) : t.none}</p>
      {marking && (
        <div className="marking">
          <p className="hint">{t.markHint}</p>
          <span className="buttons">
            <button type="button" disabled={shown === 0} onClick={() => markShown(true)}>
              {t.markAll(shown)}
            </button>
            <button type="button" className="secondary" disabled={shown === 0} onClick={() => markShown(false)}>
              {t.unmarkAll(shown)}
            </button>
          </span>
          {message && <p className="hint">{message}</p>}
        </div>
      )}
      <ul className="rows">
        {rows.map((row) => (
          <li key={row.key} className="row">
            {(row.members.length > 1 || row.members[0]?.material.name !== row.name) && <h3>{row.name}</h3>}
            <ul className="members">
              {row.members.map(({ material }) => (
                <li key={material.id}>
                  <Member material={material} data={data} onOpen={onOpen} marking={marking} mark={mark} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {rows.length === limit && (
        <button type="button" onClick={() => setLimit((l) => l + PAGE)}>
          {t.more}
        </button>
      )}
    </section>
  );
}

/** One material's line: what tells it apart from the others of its row (V3-11). */
function Member({ material, data, onOpen, marking, mark }: { material: CatalogMaterial; data: GlossaryData; onOpen: (id: string) => void; marking: boolean; mark: Mark }) {
  const t = texts.glossary;
  const state = data.ifraStates.get(material.id)?.state ?? "no-data";
  const base = material.basedOnId ? data.catalog.materials.get(material.basedOnId) : undefined;
  const abbreviation = material.abbreviation ?? base?.abbreviation ?? null;
  const whose =
    material.ownerId === null
      ? [t.common, material.form, material.house].filter((x) => x).join(" · ")
      : [t.own, material.supplier, material.product].filter((x) => x).join(" · ");
  const have = data.catalog.have.has(material.id);
  const line = (
    <>
      <span className="name">
        {abbreviation && <span className="abbr">{abbreviation}</span>}
        {material.name}
      </span>
      <span className="facts">
        {texts.kinds[material.kind]} · {whose}
        {have && <span className="have"> · {t.haveMark}</span>}
      </span>
      <span className={`ifra ifra-${state}`} title={texts.ifraStateHelp[state]}>
        {texts.ifraState[state]}
      </span>
    </>
  );
  if (marking) {
    return (
      <label className="member marking">
        <input type="checkbox" checked={have} onChange={() => void mark([material.id], !have)} aria-label={`${t.haveToggle}: ${material.name}`} />
        {line}
      </label>
    );
  }
  return (
    <button type="button" className="member" onClick={() => onOpen(material.id)}>
      {line}
    </button>
  );
}
