import { useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass, parsePercent, type MassUnit } from "../core/arith/units";
import type { Change } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import { normalize, searchCatalog, type CatalogEntry } from "../data/catalog";
import { texts } from "../i18n/es";
import {
  diluentOptions,
  percentOptions,
  prefsOf,
  pushRecent,
  recentKeys,
  rememberLast,
  sameDilution,
  toggleFavorite,
  type DiluentId,
  type MaterialPrefs,
} from "./prefs";
import { newId } from "./state";

const t = texts.addBar;

export interface AddBarHandle {
  select(material: Material): void;
  focus(): void;
}

type Group = keyof typeof t.groups;
type Result = { kind: "material"; material: Material; group: Group; cas: string } | { kind: "create"; name: string };

function cycle<T>(options: readonly T[], current: T, step: number, same: (a: T, b: T) => boolean): T {
  const i = options.findIndex((o) => same(o, current));
  const from = i < 0 ? (step > 0 ? -1 : 0) : i;
  return options[(from + step + options.length) % options.length];
}

const samePercent = (a: string, b: string) => a.replace(",", ".") === b.replace(",", ".");

function groupOf(material: Material, fallback: Group): Group {
  if (material.kind === "provisional" || material.kind === "formula") {
    return material.kind;
  }
  return fallback;
}

/**
 * The add bar (§4), left to right: more, search, quantity, dilution, add, star.
 * Everything by keyboard: Enter moves on, Ctrl+Enter adds at once with the
 * dilution already set, the arrows change the dilution; the mouse is only
 * needed for the star.
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
  const [editingPercent, setEditingPercent] = useState(false);
  const [diluent, setDiluent] = useState<DiluentId>("dpg");
  const [mine, setMine] = useState(true);
  const [formulas, setFormulas] = useState(true);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(() => recentKeys());

  const searchRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const percentRef = useRef<HTMLButtonElement>(null);

  const percents = useMemo(() => {
    const options = percentOptions(prefs);
    // A diluent is not diluted in another: it goes pure unless the user says otherwise.
    return selected?.solvent ? ["100", ...options.filter((p) => !samePercent(p, "100"))] : options;
  }, [prefs, selected]);
  const diluents = useMemo(() => diluentOptions(prefs), [prefs]);

  const byKey = useMemo(() => new Map(props.entries.map((e) => [e.material.key, e])), [props.entries]);

  const results: Result[] = useMemo(() => {
    const q = normalize(query.trim());
    if (selected || q === "") {
      return [];
    }
    const pool = mine ? props.entries : props.entries.filter((e) => e.group !== "own");
    const session: Result[] = props.sessionMaterials
      .filter((m) => (formulas || m.kind !== "formula") && normalize(m.name).includes(q))
      .map((m) => ({ kind: "material", material: m, group: groupOf(m, "provisional"), cas: "" }));
    const found: Result[] = searchCatalog(pool, query, 10).map((e) => ({ kind: "material", material: e.material, group: e.group, cas: e.cas }));
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
    setPrefs(p);
    setPercent(material.solvent ? "100" : percentOptions(p)[0]);
    setDiluent(diluentOptions(p)[0]);
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

  const add = () => {
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
      fraction = parsePercent(percent);
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
    rememberLast(selected.key, { percent, diluent });
    setRecent(pushRecent(selected.key));
    setSelected(null);
    setQuery("");
    setQuantity("");
    setEditingPercent(false);
    setError(null);
    searchRef.current?.focus();
  };

  const current = { percent, diluent };
  const isFavorite = prefs.favorites.some((f) => sameDilution(f, current));
  const recentMaterials = recent
    .map((key) => byKey.get(key)?.material ?? props.sessionMaterials.find((m) => m.key === key))
    .filter((m): m is Material => m !== undefined);

  return (
    <section className="add-bar">
      <div className="add-row first">
        <div className="more">
          <button type="button" className="square" title={t.more} onClick={() => setMenu(!menu)} tabIndex={-1}>
            ＋
          </button>
          {menu && (
            <div className="menu-pop" onMouseLeave={() => setMenu(false)}>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  props.onQuickMaterial();
                }}
              >
                {t.quickMaterial}
              </button>
              <button
                type="button"
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

        <div className="search">
          <input
            ref={searchRef}
            value={query}
            placeholder={t.search}
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
                      <span className="result-name">{r.material.name}</span>
                      <span className={`tag tag-${r.group}`}>{t.groups[r.group]}</span>
                      {r.cas && <span className="cas">{r.cas}</span>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="toggles">
            <label>
              <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} tabIndex={-1} />
              {t.mine}
            </label>
            <label>
              <input type="checkbox" checked={formulas} onChange={(e) => setFormulas(e.target.checked)} tabIndex={-1} />
              {t.formulas}
            </label>
          </div>
        </div>
      </div>

      <div className="add-row second">
        <label className="quantity">
          <span>{t.quantity}</span>
          <div className="with-unit">
            <input
              ref={quantityRef}
              value={quantity}
              inputMode="decimal"
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  add();
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  percentRef.current?.focus();
                }
              }}
            />
            <button type="button" className="unit" tabIndex={-1} onClick={() => setUnit(unit === "mg" ? "g" : "mg")}>
              {unit}
            </button>
          </div>
        </label>

        <div className="dilution">
          <span>{t.dilution}</span>
          <div className="selectors">
            {editingPercent ? (
              <input
                className="percent-input"
                autoFocus
                value={percent}
                aria-label={t.customPercent}
                onChange={(e) => setPercent(e.target.value)}
                onBlur={() => setEditingPercent(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setEditingPercent(false);
                    add();
                  } else if (e.key === "Escape") {
                    setEditingPercent(false);
                  }
                }}
              />
            ) : (
              <div className="selector">
                <button type="button" tabIndex={-1} onClick={() => setPercent(cycle(percents, percent, -1, samePercent))}>
                  ‹
                </button>
                <button
                  type="button"
                  ref={percentRef}
                  className="value"
                  title={t.customPercent}
                  onDoubleClick={() => setEditingPercent(true)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                      e.preventDefault();
                      setPercent(cycle(percents, percent, 1, samePercent));
                    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                      e.preventDefault();
                      setPercent(cycle(percents, percent, -1, samePercent));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    } else if (/^[0-9.,]$/.test(e.key)) {
                      e.preventDefault();
                      setPercent(e.key);
                      setEditingPercent(true);
                    }
                  }}
                >
                  {percent} %
                </button>
                <button type="button" tabIndex={-1} onClick={() => setPercent(cycle(percents, percent, 1, samePercent))}>
                  ›
                </button>
              </div>
            )}
            <div className="selector" title={t.diluent}>
              <button type="button" tabIndex={-1} onClick={() => setDiluent(cycle(diluents, diluent, -1, (a, b) => a === b))}>
                ‹
              </button>
              <button
                type="button"
                className="value"
                onKeyDown={(e) => {
                  if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) {
                    e.preventDefault();
                    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
                    setDiluent(cycle(diluents, diluent, step, (a, b) => a === b));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
              >
                {DILUENTS[diluent].name}
              </button>
              <button type="button" tabIndex={-1} onClick={() => setDiluent(cycle(diluents, diluent, 1, (a, b) => a === b))}>
                ›
              </button>
            </div>
          </div>
        </div>

        <button type="button" className="primary add" onClick={add}>
          {t.add}
        </button>
        <button
          type="button"
          className={isFavorite ? "square star on" : "square star"}
          title={isFavorite ? t.unfavorite : t.favorite}
          disabled={!selected}
          tabIndex={-1}
          onClick={() => selected && setPrefs(toggleFavorite(selected.key, current))}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      <p className="keys">{t.keys}</p>

      {recentMaterials.length > 0 && (
        <div className="recent">
          <span>{t.recent}</span>
          {recentMaterials.map((m) => (
            <button
              type="button"
              key={m.key}
              tabIndex={-1}
              onClick={() => {
                select(m);
                quantityRef.current?.focus();
              }}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
