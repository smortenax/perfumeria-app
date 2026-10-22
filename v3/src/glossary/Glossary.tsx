import { type CSSProperties, type KeyboardEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { type CatalogMaterial, MATERIAL_KINDS, type MaterialKind } from "../db/catalog";
import { normalize } from "../db/search";
import type { FormulaMarker, FormulaRecord } from "../db/formulas";
import { listAll, search } from "../db/search";
import { coloursOf, textColourOf } from "../families/palette";
import { paletteMarkdown, paletteOf } from "./palette-export";
import { texts } from "../i18n/en";
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
export function Glossary({
  data,
  onOpen,
  onNew,
  mark,
  onOpenFormula,
}: {
  data: GlossaryData;
  onOpen: (id: string) => void;
  onNew: () => void;
  mark: Mark;
  onOpenFormula?: (id: string) => void;
}) {
  const t = texts.glossary;
  const [query, setQuery] = useState("");
  // A new account opens on the common materials: an empty «Own» tab is not a first screen (audit F-08).
  const [first] = useState<"own" | "common">(() => ([...data.catalog.materials.values()].some((m) => m.ownerId !== null) ? "own" : "common"));
  const [filters, setFilters] = useState<Filters>({ ...NO_FILTERS, owner: first });
  const [limit, setLimit] = useState(PAGE);
  const [message, setMessage] = useState<string | null>(null);
  // «Exportar paleta»: your materials by their names, copied or as a Markdown file.
  const [paletteNote, setPaletteNote] = useState<string | null>(null);
  const palette = () => paletteMarkdown(paletteOf(data.catalog), new Date());
  const copyPalette = async () => {
    const text = palette();
    const copied = await navigator.clipboard
      ?.writeText(text)
      .then(() => true)
      .catch(() => false);
    // Where the clipboard API is not allowed (some embedded browsers), the old way: a selected text.
    const done = copied || copyBySelection(text);
    setPaletteNote(done ? t.paletteCopied(paletteOf(data.catalog).length) : t.paletteNoClipboard);
  };
  const downloadPalette = () => {
    const url = URL.createObjectURL(new Blob([palette()], { type: "text/markdown;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `my-palette-${new Date().toISOString().slice(0, 10)}.md` });
    a.click();
    URL.revokeObjectURL(url);
    setPaletteNote(t.paletteDownloaded(paletteOf(data.catalog).length));
  };
  const [marking, setMarking] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const set = (change: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...change }));
    setLimit(PAGE);
    setMessage(null);
  };
  const [tab, setTab] = useState<Tab>(first);
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
  // «Nothing yet» and «no matches» are two states (audit F-08): only the second offers to clear.
  const searching = query.trim() !== "" || filters.kind !== null || filters.ifra !== null || filters.haveOnly;
  const clear = () => {
    setQuery("");
    set({ kind: null, ifra: null, haveOnly: false });
  };
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
          <button type="button" className="secondary" hidden={tab !== "own"} onClick={() => void copyPalette()}>
            {t.copyPalette}
          </button>
          <button type="button" className="secondary" hidden={tab !== "own"} onClick={downloadPalette}>
            {t.downloadPalette}
          </button>
          <button type="button" onClick={onNew}>
            {texts.editor.newMaterial}
          </button>
        </span>
      </div>
      {paletteNote && tab === "own" && <p className="hint">{paletteNote}</p>}
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
          <Formulas data={data} query={query} marker={tab === "accords" ? "accord" : null} {...(onOpenFormula ? { onOpen: onOpenFormula } : {})} />
        ) : (
        <>
        {materials.length ? (
          <p className="hint">{t.foundMaterials(materials.length)}</p>
        ) : searching ? (
          <p className="hint">
            {t.none}{" "}
            <button type="button" className="link" onClick={clear}>
              {t.clearFilters}
            </button>
          </p>
        ) : (
          <p className="hint">{tab === "own" ? t.noOwnYet : t.noCommonYet}</p>
        )}
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
  // Its family's colour, light or dark with the theme, or the one fixed for it (V3-38); else neutral.
  const colours = coloursOf(data.catalog, material);
  const detail =
    material.ownerId === null
      ? [material.form, material.house].filter((x) => x).join(" · ")
      : ([material.supplier, material.product].filter((x) => x)[0] ?? texts.kinds[material.kind]);
  const content = (
    <>
      <span
        className={`icon${abbreviation ? "" : " no-abbr"}${have ? " have" : ""}${colours ? " fam" : ""}`}
        style={colours ? ({ "--fam-light": colours.light, "--fam-dark": colours.dark, "--fam-text": textColourOf(colours.light) } as CSSProperties) : undefined}
        aria-hidden="true"
      >
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
 * Your formulas (V3-50), by workbench (V3-19): each bench, with its formulas as tiles. A formula
 * opens in the workbench (plan 8.2); an open bench offers a new formula in it.
 */
export function Formulas({
  data,
  query,
  marker,
  onOpen,
  onNew,
  onDeleteBench,
}: {
  data: GlossaryData;
  query: string;
  marker: FormulaMarker | null;
  onOpen?: (id: string) => void;
  onNew?: (workbenchId: string) => void;
  /** An empty workbench can go (its formulas, none, would stop it). */
  onDeleteBench?: (workbenchId: string) => void;
}) {
  const accords = marker !== null;
  const t = texts.glossary;
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const words = normalize(query).split(/\s+/).filter((w) => w);
  const benchName = new Map(data.workbenches.map((b) => [b.id, b.name]));
  // «Acordes» is V3-19's general folder: the formulas marked as accords, from every workbench; they stay in theirs too.
  const shown = data.formulas.filter(
    (f) => (!marker || f.markers.includes(marker)) && words.every((w) => normalize(`${f.name} ${benchName.get(f.workbenchId) ?? ""}`).includes(w)),
  );
  if (accords) {
    return (
      <>
        <p className="hint">
          {shown.length ? `${marker === "accord" ? t.foundAccords(shown.length) : t.foundFormulas(shown.length)} ${t.formulasLater}` : words.length ? t.noFormulas : t.noMarked}
        </p>
        <ul className="grid">
          {[...shown].sort((x, y) => x.name.localeCompare(y.name, "es")).map((f) => (
            <li key={f.id}>
              <FormulaTile formula={f} data={data} bench={benchName.get(f.workbenchId) ?? null} {...(onOpen ? { onOpen } : {})} />
            </li>
          ))}
        </ul>
      </>
    );
  }
  // An empty workbench is shown too, unless searching: a new one is where its first formula is made.
  const benches = data.workbenches.filter((b) => shown.some((f) => f.workbenchId === b.id) || (words.length === 0 && onNew));
  return (
    <>
      <p className="hint">
        {shown.length ? `${t.foundFormulas(shown.length)} ${t.formulasLater}` : words.length ? t.noFormulas : t.noFormulasYet(data.workbenches.length > 0)}
      </p>
      {/* Each workbench, a tile the size of a formula, folded; open, its formulas follow it in the grid (V3-50). */}
      <ul className="grid">
        {benches.map((b) => {
          const inside = byVersions(shown.filter((f) => f.workbenchId === b.id));
          // While searching, a bench with what was found opens by itself.
          const isOpen = open.has(b.id) || words.length > 0;
          // «Nueva fórmula» as a tile only while the last slot has room; else only the «+» on the workbench (2026-10-21).
          const newTile = onNew && inside.length % 4 !== 0;
          return [
            <li key={b.id} className="bench-li">
              {onNew && (
                // Always there, whatever the workbench holds (the user, 2026-10-21: «poner el + en el lateral de la carpeta»).
                <button type="button" className="bench-new" title={t.newFormulaIn(b.name)} aria-label={t.newFormulaIn(b.name)} onClick={() => onNew(b.id)}>
                  +
                </button>
              )}
              <button
                type="button"
                className={`tile bench-tile${isOpen ? " open" : ""}`}
                aria-expanded={isOpen}
                onClick={() => setOpen((o) => (o.has(b.id) ? new Set([...o].filter((x) => x !== b.id)) : new Set([...o, b.id])))}
              >
                <span className="icon bench-icon" aria-hidden="true">
                  {data.formulas.filter((f) => f.workbenchId === b.id).length}
                </span>
                <span className="tile-name">{b.name}</span>
                <span className="tile-detail">{t.benchCount(inside.length)}</span>
              </button>
            </li>,
            // Open, its formulas at half size, four to a slot: two by two (V3-50).
            ...(isOpen
              ? slotsOf<Slot>([...inside, ...(newTile ? (["new"] as const) : []), ...(onDeleteBench && inside.length === 0 && !words.length ? (["delete"] as const) : [])]).map((four, i) => (
                  <li key={`${b.id}-${i}`} className="in-bench">
                    <ul className="quad">
                      {four.map((f) =>
                        f === "delete" ? (
                          <li key="delete">
                            <button type="button" className="tile formula mini delete-bench" onClick={() => onDeleteBench?.(b.id)}>
                              <span className="icon formula-icon" aria-hidden="true">
                                ×
                              </span>
                              <span className="tile-name">{t.deleteBench}</span>
                            </button>
                          </li>
                        ) : f !== "new" ? (
                          <li key={f.id}>
                            <FormulaTile formula={f} data={data} bench={null} mini {...(onOpen ? { onOpen } : {})} />
                          </li>
                        ) : (
                          <li key="new">
                            <button type="button" className="tile formula mini new-formula" onClick={() => onNew?.(b.id)}>
                              <span className="icon formula-icon" aria-hidden="true">
                                +
                              </span>
                              <span className="tile-name">{t.newFormula}</span>
                            </button>
                          </li>
                        ),
                      )}
                    </ul>
                  </li>
                ))
              : []),
          ];
        })}
      </ul>
    </>
  );
}

/** One formula's tile: its icon, its name, its workbench when shown outside it, its version and its markers. */
function FormulaTile({
  formula: f,
  data,
  bench,
  mini = false,
  onOpen,
}: {
  formula: GlossaryData["formulas"][number];
  data: GlossaryData;
  bench: string | null;
  mini?: boolean;
  onOpen?: (id: string) => void;
}) {
  const t = texts.glossary;
  const parent = f.parentId ? data.formulas.find((x) => x.id === f.parentId) : undefined;
  // Half size, inside an open workbench: its icon and its name; an accord, a dot (its full tile is in Acordes).
  if (mini) {
    return (
      <Clickable className="tile formula mini" title={f.name} onClick={onOpen && (() => onOpen(f.id))}>
        <span className={`icon formula-icon${f.markers.includes("accord") ? " accord" : ""}`} aria-hidden="true">
          {initials(f.name)}
        </span>
        <span className="tile-name">{f.name}</span>
      </Clickable>
    );
  }
  return (
    <Clickable className="tile formula" onClick={onOpen && (() => onOpen(f.id))}>
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
    </Clickable>
  );
}

/** Copies a text by selecting it: the way before the clipboard API, still allowed where that one is not. */
function copyBySelection(text: string): boolean {
  const area = Object.assign(document.createElement("textarea"), { value: text, readOnly: true });
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

/** A tile that opens what it shows when it can; else, only shown. */
function Clickable({ onClick, children, ...rest }: { className: string; title?: string; onClick?: (() => void) | undefined; children: ReactNode }) {
  return onClick ? (
    <button type="button" {...rest} onClick={onClick}>
      {children}
    </button>
  ) : (
    <div {...rest}>{children}</div>
  );
}

/** A slot of an open workbench: a formula, or its «new formula» and «delete workbench» tiles. */
type Slot = GlossaryData["formulas"][number] | "new" | "delete";

/** Four to a slot, two by two (V3-50). */
function slotsOf<T>(items: readonly T[]): T[][] {
  return Array.from({ length: Math.ceil(items.length / 4) }, (_, i) => items.slice(i * 4, i * 4 + 4));
}

/**
 * A workbench's formulas with their versions together (plan 8.1, P44): each mother, then the versions
 * that come from it, in the order of the chain of parent_id; the mothers by name.
 */
export function byVersions(list: readonly FormulaRecord[]): FormulaRecord[] {
  const ids = new Set(list.map((f) => f.id));
  const children = new Map<string, FormulaRecord[]>();
  for (const f of list) if (f.parentId && ids.has(f.parentId)) children.set(f.parentId, [...(children.get(f.parentId) ?? []), f]);
  const byName = (a: FormulaRecord, b: FormulaRecord) => a.name.localeCompare(b.name, "es") || (a.id < b.id ? -1 : 1);
  const out: FormulaRecord[] = [];
  const visit = (f: FormulaRecord) => {
    out.push(f);
    for (const c of [...(children.get(f.id) ?? [])].sort(byName)) visit(c);
  };
  for (const root of list.filter((f) => !f.parentId || !ids.has(f.parentId)).sort(byName)) visit(root);
  return out;
}
