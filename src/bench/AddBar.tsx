import { useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass, parsePercent, type MassUnit } from "../core/arith/units";
import type { Change } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import { normalize, searchCatalog, type CatalogEntry, type IfraState } from "../data/catalog";
import { texts } from "../i18n/es";
import { diluentOptions, percentOptions, prefsOf, rememberLast, sameDilution, toggleFavorite, type DiluentId, type MaterialPrefs } from "./prefs";
import { IconText } from "./Icon";
import { newId } from "./state";

const t = texts.addBar;

export interface AddBarHandle {
  select(material: Material): void;
  focus(): void;
}

type Result =
  | {
      kind: "material";
      material: Material;
      tag: string | null;
      cas: string;
      code?: string;
      state?: IfraState;
      standardName?: string;
      /** Beside a trade name, the chemical one (P38). */
      chemicalName?: string;
      tradeCode?: string;
      icon?: string;
      iconMark?: string;
    }
  | { kind: "create"; name: string };

const samePercent = (a: string, b: string) => a.replace(",", ".") === b.replace(",", ".");

function uniquePercents(items: readonly string[]): string[] {
  return items.filter((p, i) => items.findIndex((q) => samePercent(p, q)) === i);
}

function Switch(props: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={props.checked} tabIndex={-1} className="switch" onClick={() => props.onChange(!props.checked)}>
      <span className={props.checked ? "track on" : "track"}>
        <span className="knob" />
      </span>
      {props.label}
    </button>
  );
}

/**
 * The add bar (§4), as in the sketch (boceto 4), left to right: more, include,
 * material, quantity, dilution, add, star. Everything by keyboard: Intro or Tab
 * pick the material; Intro moves on; Ctrl+Intro adds with the dilution already
 * set; the arrows choose among the two options of % and of diluent (P26).
 */
export function AddBar(props: {
  ref?: Ref<AddBarHandle>;
  entries: readonly CatalogEntry[];
  sessionMaterials: readonly Material[];
  onAdd: (change: Change) => void;
  onQuickMaterial: () => void;
  onFormulaAsMaterial: () => void;
  onCreateProvisional: (name: string) => Material;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Material | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<MassUnit>("mg");
  const [prefs, setPrefs] = useState<MaterialPrefs>({ favorites: [] });
  const [percent, setPercent] = useState("10");
  const [editing, setEditing] = useState<string | null>(null);
  const [diluent, setDiluent] = useState<DiluentId>("dpg");
  const [mine, setMine] = useState(true);
  const [formulas, setFormulas] = useState(true);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const percentRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];
  const diluentRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];

  const byKey = useMemo(() => new Map(props.entries.map((e) => [e.material.key, e])), [props.entries]);

  // Two options of each (§4): favourites first, then the last one used, then 10 % and 1 %, DPG and alcohol.
  const percentPool = uniquePercents(selected?.solvent ? ["100", ...percentOptions(prefs)] : percentOptions(prefs)).slice(0, 2);
  const cells = percentPool.some((p) => samePercent(p, percent)) ? percentPool : [percent, ...percentPool].slice(0, 2);
  const checkedCell = Math.max(0, cells.findIndex((p) => samePercent(p, percent)));
  const diluents = diluentOptions(prefs).slice(0, 2);
  const checkedDiluent = Math.max(0, diluents.indexOf(diluent));
  const source = prefs.favorites.some((f) => samePercent(f.percent, percent))
    ? "favorite"
    : prefs.last && samePercent(prefs.last.percent, percent)
      ? "last"
      : "base";

  const results: Result[] = useMemo(() => {
    const q = normalize(query.trim());
    if (selected || q === "") {
      return [];
    }
    const pool = mine ? props.entries : props.entries.filter((e) => e.group !== "own");
    const session: Result[] = props.sessionMaterials
      .filter((m) => (formulas || m.kind !== "formula") && normalize(m.name).includes(q))
      .map((m) => ({ kind: "material", material: m, tag: m.kind === "formula" ? "fórmula" : "provisional", cas: "" }));
    const found: Result[] = searchCatalog(pool, query, 10).map((e) => ({
      kind: "material",
      material: e.material,
      tag: e.group === "diluent" ? "diluyente" : null,
      cas: e.cas,
      code: e.code,
      icon: e.icon,
      ...(e.iconMark ? { iconMark: e.iconMark } : {}),
      ...(e.state ? { state: e.state } : {}),
      ...(e.standardName ? { standardName: e.standardName } : {}),
      ...(e.tradeName ? { chemicalName: e.chemicalName } : {}),
      ...(e.tradeCode ? { tradeCode: e.tradeCode } : {}),
    }));
    const all = [...session, ...found];
    const exact = all.some((r) => r.kind === "material" && normalize(r.material.name) === q);
    return exact ? all : [...all, { kind: "create", name: query.trim() }];
  }, [query, selected, mine, formulas, props.entries, props.sessionMaterials]);

  const select = (material: Material) => {
    const p = prefsOf(material.key);
    setSelected(material);
    setQuery(material.name);
    setOpen(false);
    setHighlight(0);
    setError(null);
    setEditing(null);
    setPrefs(p);
    setPercent(material.solvent ? "100" : (p.last?.percent ?? percentOptions(p)[0]));
    setDiluent(p.last?.diluent ?? diluentOptions(p)[0]);
  };

  useImperativeHandle(props.ref, () => ({
    select(material: Material) {
      select(material);
      quantityRef.current?.focus();
    },
    focus() {
      searchRef.current?.focus();
    },
  }));

  const choose = (result: Result) => {
    select(result.kind === "create" ? props.onCreateProvisional(result.name) : result.material);
    quantityRef.current?.focus();
  };

  const release = () => {
    setSelected(null);
    setQuery("");
    searchRef.current?.focus();
  };

  const add = (percentText = percent) => {
    if (!selected) {
      setError(t.noMaterial);
      searchRef.current?.focus();
      return;
    }
    let massUg: bigint;
    try {
      massUg = parseMass(quantity, unit);
    } catch {
      setError(t.badQuantity);
      quantityRef.current?.focus();
      return;
    }
    let fraction: Ratio;
    try {
      fraction = parsePercent(percentText);
    } catch {
      setError(t.badPercent);
      return;
    }
    props.onAdd({
      kind: "add",
      id: newId(),
      material: selected,
      massUg,
      fraction,
      diluent: fraction.eq(Ratio.ONE) ? null : DILUENTS[diluent],
    });
    rememberLast(selected.key, { percent: percentText, diluent });
    setSelected(null);
    setQuery("");
    setQuantity("");
    setEditing(null);
    setError(null);
    searchRef.current?.focus();
  };

  const current = { percent, diluent };
  const isFavorite = prefs.favorites.some((f) => sameDilution(f, current));
  const cas = selected ? byKey.get(selected.key)?.cas : undefined;

  return (
    <div className="card add-form">
      <div className="more">
        <button type="button" className="tool plus" title={t.more} aria-label={t.more} tabIndex={-1} onClick={() => setMenu(!menu)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M8 3v10M3 8h10" />
          </svg>
        </button>
        {menu && (
          <div className="menu-pop" onMouseLeave={() => setMenu(false)}>
            <button
              type="button"
              className="menuitem"
              onClick={() => {
                setMenu(false);
                props.onQuickMaterial();
              }}
            >
              {t.quickMaterial}
            </button>
            <button
              type="button"
              className="menuitem"
              onClick={() => {
                setMenu(false);
                props.onFormulaAsMaterial();
              }}
            >
              {t.formulaAsMaterial}
            </button>
          </div>
        )}
      </div>

      <div className="include">
        <span className="field-label">{t.include}</span>
        <div className="switches">
          <Switch checked={mine} label={t.mine} onChange={setMine} />
          <Switch checked={formulas} label={t.formulas} onChange={setFormulas} />
        </div>
      </div>

      <div className="material">
        <div className="field-label">
          <label htmlFor="add-material">{t.material}</label>
          <span className="hint">{t.pickHint}</span>
        </div>
        <div className={selected ? "field material-field chosen" : "field material-field"}>
          <input
            id="add-material"
            ref={searchRef}
            value={query}
            placeholder={t.search}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && results.length > 0) {
                e.preventDefault();
                setHighlight((highlight + 1) % results.length);
              } else if (e.key === "ArrowUp" && results.length > 0) {
                e.preventDefault();
                setHighlight((highlight - 1 + results.length) % results.length);
              } else if ((e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) && results.length > 0) {
                e.preventDefault();
                choose(results[Math.min(highlight, results.length - 1)]);
              } else if (e.key === "Enter" && selected) {
                e.preventDefault();
                quantityRef.current?.focus();
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          {cas && <span className="num cas">{cas}</span>}
          {selected && (
            <button type="button" className="release" tabIndex={-1} aria-label={t.release} title={t.release} onClick={release}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
              </svg>
            </button>
          )}
        </div>
        {open && results.length > 0 && (
          <ul className="results">
            {results.map((r, i) => (
              <li
                key={r.kind === "create" ? "create" : r.material.key}
                className={i === highlight ? "active" : undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(r);
                }}
              >
                {r.kind === "create" ? (
                  <span className="create">{t.createProvisional(r.name)}</span>
                ) : (
                  <>
                    {r.icon && (
                      <span className="code-chip" title={r.code && r.code !== r.icon ? r.code : undefined}>
                        <IconText text={r.icon} mark={r.iconMark} />
                      </span>
                    )}
                    <span className="result-name">
                      <span className="primary">
                        {r.material.name}
                        {r.tradeCode && (
                          <span className="trade-code">
                            <IconText text={r.tradeCode} mark={r.iconMark} />
                          </span>
                        )}
                      </span>
                      {r.chemicalName && <span className="chemical">{r.chemicalName}</span>}
                      {r.standardName && (
                        <span className="standard">
                          {r.standardName} · {t.standard}
                        </span>
                      )}
                    </span>
                    {r.tag && <span className="pill">{r.tag}</span>}
                    {r.state && (
                      <span className={`state state-${r.state}`} title={t.stateHelp[r.state]}>
                        {t.state[r.state]}
                      </span>
                    )}
                    {r.cas && <span className="num cas">{r.cas}</span>}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="quantity">
        <label className="field-label" htmlFor="add-quantity">
          {t.quantity(unit)}
        </label>
        <div className="field quantity-field">
          <input
            id="add-quantity"
            ref={quantityRef}
            className="num"
            value={quantity}
            inputMode="decimal"
            autoComplete="off"
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                add();
              } else if (e.key === "Enter") {
                e.preventDefault();
                percentRefs[checkedCell].current?.focus();
              }
            }}
          />
          <button type="button" className="unit num" tabIndex={-1} title={t.changeUnit} onClick={() => setUnit(unit === "mg" ? "g" : "mg")}>
            {unit}
          </button>
        </div>
      </div>

      <div className="dilution">
        <div className="field-label">
          <span>{t.dilution}</span>
          <span className="hint">{t.src[source]}</span>
        </div>
        <div className="dilution-group" role="group" aria-label={t.dilution}>
          <div className="radio-col percent-col" role="radiogroup" aria-label={t.percentGroup}>
            {cells.map((p, i) =>
              editing !== null && i === checkedCell ? (
                <input
                  key="edit"
                  className="cell-input num"
                  autoFocus
                  value={editing}
                  aria-label={t.customPercent}
                  onChange={(e) => setEditing(e.target.value)}
                  onBlur={() => {
                    if (editing.trim() !== "") {
                      setPercent(editing.trim());
                    }
                    setEditing(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const typed = editing.trim();
                      setPercent(typed);
                      setEditing(null);
                      add(typed);
                    } else if (e.key === "Escape") {
                      setEditing(null);
                    }
                  }}
                />
              ) : (
                <button
                  key={p}
                  type="button"
                  ref={percentRefs[i]}
                  role="radio"
                  aria-checked={i === checkedCell}
                  tabIndex={i === checkedCell ? 0 : -1}
                  className={i === checkedCell ? "cell num checked" : "cell num"}
                  title={t.customPercent}
                  onClick={() => setPercent(p)}
                  onDoubleClick={() => setEditing(p)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      const other = 1 - i;
                      if (cells[other] !== undefined) {
                        setPercent(cells[other]);
                        percentRefs[other].current?.focus();
                      }
                    } else if (e.key === "ArrowRight") {
                      e.preventDefault();
                      diluentRefs[checkedDiluent].current?.focus();
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    } else if (e.key === "F2") {
                      e.preventDefault();
                      setEditing(p);
                    } else if (/^[0-9.,]$/.test(e.key)) {
                      e.preventDefault();
                      setEditing(e.key);
                    }
                  }}
                >
                  {p} %
                </button>
              ),
            )}
          </div>
          <div className="radio-col diluent-col" role="radiogroup" aria-label={t.diluentGroup}>
            {diluents.map((d, i) => (
              <button
                key={d}
                type="button"
                ref={diluentRefs[i]}
                role="radio"
                aria-checked={i === checkedDiluent}
                tabIndex={i === checkedDiluent ? 0 : -1}
                className={i === checkedDiluent ? "cell checked" : "cell"}
                onClick={() => setDiluent(d)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const other = 1 - i;
                    if (diluents[other] !== undefined) {
                      setDiluent(diluents[other]);
                      diluentRefs[other].current?.focus();
                    }
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    percentRefs[checkedCell].current?.focus();
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
              >
                {DILUENTS[d].name}
              </button>
            ))}
          </div>
          <button type="button" className="other" disabled title={t.otherDiluent} aria-label={t.otherDiluent}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <circle cx="2.5" cy="6" r="1.1" fill="currentColor" />
              <circle cx="6" cy="6" r="1.1" fill="currentColor" />
              <circle cx="9.5" cy="6" r="1.1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      <button type="button" className="add-btn" onClick={() => add()}>
        {t.add}
      </button>
      <button
        type="button"
        className={isFavorite ? "tool star on" : "tool star"}
        title={isFavorite ? t.unfavorite : t.favorite}
        aria-label={isFavorite ? t.unfavorite : t.favorite}
        aria-pressed={isFavorite}
        disabled={!selected}
        tabIndex={-1}
        onClick={() => selected && setPrefs(toggleFavorite(selected.key, current))}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {error && <span className="add-error">{error}</span>}
    </div>
  );
}
