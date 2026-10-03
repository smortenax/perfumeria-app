import { useEffect, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent, type Ref, type RefObject } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass, parsePercent, type MassUnit } from "../core/arith/units";
import type { Change } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { casForm, normalize, searchCatalog, type CatalogEntry, type IfraState, type MaterialFamily, type Weighing } from "../data/catalog";
import { defaultOption, formLabel, makerIndex, plantIndex } from "../data/plants";
import { texts } from "../i18n/es";
import {
  addOwnDiluent,
  APP_DILUENTS,
  diluentMaterial,
  diluentOptions,
  isPure,
  ownDiluents,
  ownName as userNameOf,
  percentOptions,
  prefsOf,
  rememberLast,
  rememberName,
  sameDilution,
  toggleFavorite,
  type DiluentId,
  type MaterialPrefs,
} from "./prefs";
import { proposedWeighing } from "./assumptions";
import { familyLook } from "./family";
import { IconText } from "./Icon";
import { newId } from "./state";
import { pourKey, type Pour } from "./usage-bar";

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
      iconType?: string;
      family?: MaterialFamily;
      /** The shop's name it was found by, when its own names do not say what was typed. */
      shopName?: string;
      /** The glossary's name, when the user knows it by another (P56). */
      glossaryName?: string;
      /** The other name of the bottle that was typed: it becomes the user's name (P56). */
      bottleName?: string | null;
      /** The tick of P62: the material is documented by its manufacturer's certificate; the maker's name. */
      documented?: string;
      /** A natural's form and variant, as its chip says them (P54). */
      form?: string;
      variant?: string;
      /**
       * The row of a plant (P54): its forms, one chip each, and the one it starts on. The fields above
       * are those of that option; the chip the user moves to is in the bar's state.
       */
      plant?: { readonly key: string; readonly name: string; readonly options: readonly MaterialResult[]; readonly at: number };
    }
  | { kind: "create"; name: string }
  /** What was typed cannot be a material: a CAS that is not in the glossary (P56). */
  | { kind: "note"; text: string };

type MaterialResult = Extract<Result, { kind: "material" }>;

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
 * The chips of a plant's row (P54): one per form, in order, and under the row, while it is the active
 * one, the variants of the form it is on. A form with one option is chosen with a click; one with
 * variants is marked first, and its variant (or the form again) is chosen. A form with no IFRA data
 * has a dashed border (§1.2).
 */
function PlantChips(props: {
  plant: NonNullable<MaterialResult["plant"]>;
  on: Result;
  active: boolean;
  onMark: (at: number) => void;
  onChoose: (r: Result) => void;
}) {
  const { plant, on } = props;
  const form = on.kind === "material" ? on.form : undefined;
  const forms = [...new Set(plant.options.map((o) => o.form ?? ""))];
  const variants = plant.options.map((o, at) => ({ o, at })).filter(({ o }) => o.form === form);
  const press = (e: { preventDefault(): void; stopPropagation(): void }, act: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    act();
  };
  return (
    <>
      {forms.length > 1 && (
      <span className="plant-forms">
        {forms.map((f) => {
          const at = plant.options.findIndex((o) => (o.form ?? "") === f);
          const first = plant.options[at];
          const several = plant.options.filter((o) => (o.form ?? "") === f).length > 1;
          return (
            <button
              key={f}
              type="button"
              tabIndex={-1}
              className={["form-chip", f === form ? "on" : "", first.state === "sin-dato" ? "nodata" : ""].join(" ").trim()}
              title={`${first.code ?? ""} · ${first.material.name}`}
              onMouseDown={(e) => press(e, () => (several && f !== form ? props.onMark(at) : props.onChoose(f === form ? on : first)))}
            >
              {formLabel(f)}
            </button>
          );
        })}
      </span>
      )}
      {props.active && variants.length > 1 && (
        <span className="plant-variants">
          {variants.map(({ o, at }) => (
            <button
              key={o.material.key}
              type="button"
              tabIndex={-1}
              className={["form-chip", on.kind === "material" && o.material.key === on.material.key ? "on" : "", o.state === "sin-dato" ? "nodata" : ""].join(" ").trim()}
              title={`${o.code ?? ""} · ${o.material.name}`}
              onMouseEnter={() => props.onMark(at)}
              onMouseDown={(e) => press(e, () => props.onChoose(o))}
            >
              {o.variant || t.plainVariant}
            </button>
          ))}
        </span>
      )}
    </>
  );
}

/**
 * The add bar (§4), as in the sketch (boceto 4), left to right: material,
 * quantity, dilution, add, star. The «+» sits by the label of the material, and
 * the switches of what it takes in show under it while searching (P49). Everything by keyboard: Intro or Tab
 * pick the material; Intro moves on; Ctrl+Intro adds with the dilution already
 * set; the arrows choose among the options of % (two cells and «Puro», P53) and
 * of diluent (P26).
 */
export function AddBar(props: {
  ref?: Ref<AddBarHandle>;
  entries: readonly CatalogEntry[];
  sessionMaterials: readonly Material[];
  onAdd: (change: Change) => void;
  onQuickMaterial: () => void;
  onFormulaAsMaterial: () => void;
  onCreateProvisional: (name: string) => Material;
  /** A material took the user's name for it (P56): the formula names it so too. */
  onNamed?: () => void;
  /**
   * The material chosen in the bar, or null when the user lets it go (P57). Adding does not
   * call it: the card of the material keeps it, to see what the formula now carries.
   */
  onSelect?: (material: Material | null) => void;
  /**
   * What is being written, read (P57): the material, the mass in micrograms, the fraction of pure
   * matter and the diluent, or null while it cannot be read. Called only when the pour changes,
   * and nothing is added until «Añadir».
   */
  onDraft?: (pour: Pour | null) => void;
  /** What adding the draft would break in IFRA, to say beside the bar; null when nothing. */
  warning?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Material | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  /** The chip each plant's row is on, when the user moved it (P54): the index into its options. */
  const [chips, setChips] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<MassUnit>("mg");
  const [prefs, setPrefs] = useState<MaterialPrefs>({ favorites: [] });
  const [assumed, setAssumed] = useState<Weighing | null>(null);
  const entryOf = useMemo(() => new Map(props.entries.map((e) => [e.material.key, e])), [props.entries]);
  const [percent, setPercent] = useState("10");
  /** The cell being written in, and what it says so far. */
  const [editing, setEditing] = useState<{ at: number; text: string } | null>(null);
  const [diluent, setDiluent] = useState<DiluentId>("dpg");
  const [customAt, setCustomAt] = useState(0);
  const [mine, setMine] = useState(true);
  const [formulas, setFormulas] = useState(true);
  const [menu, setMenu] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [ownName, setOwnName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const percentRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];
  const pureRef = useRef<HTMLButtonElement>(null);
  const diluentRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];
  const otherRef = useRef<HTMLDivElement>(null);

  const byKey = useMemo(() => new Map(props.entries.map((e) => [e.material.key, e])), [props.entries]);
  // The forms of every plant, in chip order (P54).
  const plants = useMemo(() => plantIndex(props.entries), [props.entries]);
  // The manufacturers' products of each general material (P62).
  const makers = useMemo(() => makerIndex(props.entries), [props.entries]);

  // Two cells of % side by side and a wide «Puro» under them (P53): favourites first, then
  // the last one used, then 10 % and 50 %; DPG and alcohol (§4).
  const percentPool = uniquePercents(percentOptions(prefs)).slice(0, 2);
  const pure = isPure(percent);
  const cells = [...percentPool];
  if (!pure && !percentPool.some((p) => samePercent(p, percent))) {
    // A % written by hand stays in the cell where it was written.
    cells[Math.min(customAt, cells.length)] = percent;
  }
  // -1 is «Puro».
  const checkedCell = pure ? -1 : Math.max(0, cells.findIndex((p) => samePercent(p, percent)));
  const focusPercent = () => (checkedCell < 0 ? pureRef : percentRefs[checkedCell]).current?.focus();

  /** What was written in a cell takes that cell's place; 100 is «Puro». */
  const commitEdit = (): string | null => {
    const typed = editing?.text.trim() ?? "";
    if (editing !== null && typed !== "") {
      setPercent(typed);
      setCustomAt(editing.at);
    }
    setEditing(null);
    return typed === "" ? null : typed;
  };

  // The arrows move among the three: the two cells side by side, «Puro» under them (P53).
  const percentKeys = (e: KeyboardEvent, at: number) => {
    const go = (percentText: string, ref: RefObject<HTMLButtonElement | null>) => {
      e.preventDefault();
      setPercent(percentText);
      ref.current?.focus();
    };
    if (e.key === "ArrowLeft" && at === 1) {
      go(cells[0], percentRefs[0]);
    } else if (e.key === "ArrowRight" && at === 0 && cells[1] !== undefined) {
      go(cells[1], percentRefs[1]);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      diluentRefs[checkedDiluent].current?.focus();
    } else if (e.key === "ArrowDown" && at >= 0) {
      go("100", pureRef);
    } else if (e.key === "ArrowUp" && at < 0 && cells[0] !== undefined) {
      go(cells[0], percentRefs[0]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      add();
    } else if (e.key === "F2") {
      e.preventDefault();
      setEditing({ at: Math.max(0, at), text: at < 0 ? "" : cells[at] });
    } else if (/^[0-9.,]$/.test(e.key)) {
      e.preventDefault();
      setEditing({ at: Math.max(0, at), text: e.key });
    }
  };
  // Another diluent chosen from the menu takes the second place while it is chosen (§4).
  const top = diluentOptions(prefs).slice(0, 2);
  const diluents = top.includes(diluent) ? top : [top[0], diluent];
  const checkedDiluent = Math.max(0, diluents.indexOf(diluent));
  const others: Array<{ id: DiluentId; name: string; own: boolean }> = [
    ...APP_DILUENTS.map((id) => ({ id, name: diluentMaterial(id)?.name ?? id, own: false })),
    ...ownDiluents().map((d) => ({ id: d.id, name: d.name, own: true })),
  ].filter((d) => !diluents.includes(d.id));

  const [focusDiluent, setFocusDiluent] = useState(false);
  const pickDiluent = (id: DiluentId) => {
    setDiluent(id);
    setOtherOpen(false);
    setOwnName("");
    setFocusDiluent(true);
  };

  // The chosen one sits in its place once drawn: focus it, so the arrows go on from there.
  useEffect(() => {
    if (focusDiluent) {
      diluentRefs[checkedDiluent].current?.focus();
      setFocusDiluent(false);
    }
  }, [focusDiluent, checkedDiluent, diluentRefs]);

  const openOther = () => setOtherOpen(true);

  // The menu takes the focus when it opens, so the arrows go on inside it.
  useEffect(() => {
    if (otherOpen) {
      otherRef.current?.querySelector<HTMLElement>("button, input")?.focus();
    }
  }, [otherOpen]);
  const source = prefs.favorites.some((f) => samePercent(f.percent, percent))
    ? "favorite"
    : prefs.last && samePercent(prefs.last.percent, percent)
      ? "last"
      : "base";

  const results: Result[] = useMemo(() => {
    // Spaces as the provisional key takes them: «sandalmysore  core» is «Sandalmysore Core» (P44).
    const q = normalize(query.trim().replace(/\s+/g, " "));
    if (selected || q === "") {
      return [];
    }
    const pool = mine ? props.entries : props.entries.filter((e) => e.group !== "own");
    // «Mis materiales» takes in the provisional ones too, remembered from the library (P44).
    const session: Result[] = props.sessionMaterials
      .filter((m) => (m.kind === "formula" ? formulas : mine) && normalize(m.name).includes(q))
      .map((m) => ({ kind: "material", material: m, tag: m.kind === "formula" ? "fórmula" : "provisional", cas: "" }));
    const words = q.split(" ");
    const says = (name: string) => words.every((w) => normalize(name).includes(w));
    const shopName = (e: CatalogEntry) =>
      e.shopNames && !says(`${e.material.name} ${e.chemicalName} ${e.code} ${e.cas}`) ? e.shopNames.find(says) : undefined;
    // Found by another name of the bottle («dartanol»), that is the user's name for it;
    // by the glossary's own name, the user's is dropped; by code or CAS, it stays (P56).
    const bottleName = (e: CatalogEntry): string | null | undefined => {
      if (says(e.material.name)) {
        return null;
      }
      return e.aliases?.find(says);
    };
    const toResult = (e: CatalogEntry): MaterialResult => ({
      kind: "material",
      material: userNameOf(e.material.key) ? { ...e.material, name: userNameOf(e.material.key)! } : e.material,
      ...(userNameOf(e.material.key) && userNameOf(e.material.key) !== e.material.name ? { glossaryName: e.material.name } : {}),
      bottleName: bottleName(e),
      tag: e.group === "diluent" ? "diluyente" : null,
      cas: e.cas,
      code: e.code,
      icon: e.icon,
      ...(e.iconMark ? { iconMark: e.iconMark } : {}),
      ...(e.iconType ? { iconType: e.iconType } : {}),
      ...(e.state ? { state: e.state } : {}),
      ...(e.standardName ? { standardName: e.standardName } : {}),
      ...(e.tradeName ? { chemicalName: e.chemicalName } : {}),
      ...(e.tradeCode ? { tradeCode: e.tradeCode } : {}),
      ...(e.family ? { family: e.family } : {}),
      ...(shopName(e) ? { shopName: shopName(e) } : {}),
      ...(e.plant ? { form: e.plant.form, variant: e.plant.variant } : {}),
      ...(e.documented ? { documented: e.maker?.name ?? "" } : {}),
    });
    // The naturals of one plant are one row, with a chip per form (P54); the rest, one row each.
    const used = (key: string) => props.sessionMaterials.some((m) => m.key === key) || prefsOf(key).last !== undefined;
    const found: Result[] = [];
    const folded = new Set<string>();
    for (const e of searchCatalog(pool, query, 30)) {
      // A general material and its manufacturers' products are one row, a chip per maker (P62); the
      // user's product goes first, since it is the one documented.
      const generalKey = e.maker?.general ?? (makers.has(e.material.key) ? e.material.key : undefined);
      const made = generalKey && !e.plant ? makers.get(generalKey) : undefined;
      if (made && generalKey) {
        const key = `maker:${generalKey}`;
        if (folded.has(key)) {
          continue;
        }
        folded.add(key);
        const options = made.map((o) => ({ ...toResult(o), form: o.maker ? o.maker.name : "general", variant: "" }));
        const at = e.maker ? made.indexOf(e) : 1;
        const general = made[0];
        found.push({ ...options[at], plant: { key, name: userNameOf(general.material.key) ?? general.material.name, options, at } });
        if (found.length >= 10) {
          break;
        }
        continue;
      }
      const forms = e.plant ? plants.get(e.plant.key) : undefined;
      if (forms && e.plant) {
        if (folded.has(e.plant.key)) {
          continue;
        }
        folded.add(e.plant.key);
        const options = forms.map(toResult);
        const at = defaultOption(forms, e, words, shopName(e) !== undefined, used);
        found.push({ ...options[at], plant: { key: e.plant.key, name: e.plant.name, options, at } });
      } else {
        found.push(toResult(e));
      }
      if (found.length >= 10) {
        break;
      }
    }
    const all = [...session, ...found];
    const exact = all.some((r) => r.kind === "material" && normalize(r.material.name) === q);
    // A CAS is not a name: one the glossary does not have is not made a material (P56).
    if (/^\s*\d{2,7}-\d{2}-\d{1,2}\s*$/.test(query)) {
      const cas = casForm(query);
      return all.length > 0 ? all : [{ kind: "note", text: cas ? t.casMissing(cas) : t.casInvalid(query.trim()) }];
    }
    return exact ? all : [...all, { kind: "create", name: query.trim() }];
  }, [query, selected, mine, formulas, props.entries, props.sessionMaterials, plants]);

  /** What a row stands for now: a plant's row, the option its chip is on. */
  const onChip = (r: Result): Result => (r.kind === "material" && r.plant ? r.plant.options[chips[r.plant.key] ?? r.plant.at] : r);

  const select = (material: Material) => {
    const p = prefsOf(material.key);
    setSelected(material);
    setQuery(material.name);
    setOpen(false);
    setHighlight(0);
    setError(null);
    setEditing(null);
    setPrefs(p);
    // What the user chose last wins; without it, the product says what it is weighed at (D12), and the bar says it assumed it.
    const weighing = proposedWeighing(entryOf.get(material.key), material.solvent, p.last !== undefined);
    setAssumed(weighing ?? null);
    // A solvent goes pure; so does a formula the first time, since it already carries its diluent (§3.6).
    setPercent(material.solvent ? "100" : (weighing?.percent ?? p.last?.percent ?? (material.kind === "formula" ? "100" : percentOptions(p)[0])));
    setDiluent(weighing?.diluent || (p.last?.diluent ?? diluentOptions(p)[0]));
    props.onSelect?.(material);
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

  /** The plant of the highlighted row, or null. */
  const rowPlant = () => {
    const r = results[Math.min(highlight, results.length - 1)];
    return r?.kind === "material" && r.plant ? r.plant : null;
  };

  const choose = (result: Result) => {
    if (result.kind === "note") {
      return;
    }
    if (result.kind === "create") {
      select(props.onCreateProvisional(result.name));
    } else if (result.bottleName !== undefined && result.material.kind === "base") {
      // The name it was found by is the user's from now on (P56).
      const key = result.material.key;
      rememberName(key, result.bottleName);
      const glossary = byKey.get(key)?.material.name ?? result.material.name;
      select({ ...result.material, name: result.bottleName ?? glossary });
      props.onNamed?.();
    } else {
      select(result.material);
    }
    quantityRef.current?.focus();
  };

  const release = () => {
    setSelected(null);
    setQuery("");
    searchRef.current?.focus();
    props.onSelect?.(null);
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
    const diluentUsed = fraction.eq(Ratio.ONE) ? null : diluentMaterial(diluent);
    if (!fraction.eq(Ratio.ONE) && !diluentUsed) {
      setError(t.badDiluent);
      return;
    }
    props.onAdd({
      kind: "add",
      id: newId(),
      material: selected,
      massUg,
      fraction,
      diluent: diluentUsed,
    });
    rememberLast(selected.key, { percent: percentText, diluent });
    setSelected(null);
    setQuery("");
    setQuantity("");
    setEditing(null);
    setError(null);
    searchRef.current?.focus();
  };

  // The pour as written so far, read as `add` would read it: null while anything is unreadable.
  const draft: Pour | null = useMemo(() => {
    if (!selected) {
      return null;
    }
    try {
      const massUg = parseMass(quantity, unit);
      const fraction = parsePercent(percent);
      const used = fraction.eq(Ratio.ONE) ? null : diluentMaterial(diluent);
      return !fraction.eq(Ratio.ONE) && !used ? null : { material: selected, massUg, fraction, diluent: used };
    } catch {
      return null;
    }
  }, [selected, quantity, unit, percent, diluent]);
  const draftKey = pourKey(draft);
  const onDraft = props.onDraft;
  useEffect(() => {
    onDraft?.(draft);
    // Only when the pour changes: the key stands for all of it.
  }, [draftKey]);

  const current = { percent, diluent };
  const isFavorite = prefs.favorites.some((f) => sameDilution(f, current));
  const cas = selected ? byKey.get(selected.key)?.cas : undefined;

  return (
    <div className="card add-form">
      <div className="material">
        <div className="field-label">
          <label htmlFor="add-material">{t.material}</label>
          {/* A small «+» beside the label: a new material or a formula as one (P49). */}
          <span className="more">
            <button type="button" className="tool plus" title={t.more} aria-label={t.more} tabIndex={-1} onClick={() => setMenu(!menu)}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M8 3v10M3 8h10" />
              </svg>
            </button>
            {menu && (
              <span className="menu-pop" onMouseLeave={() => setMenu(false)}>
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
              </span>
            )}
          </span>
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
              setChips({});
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
              } else if (
                (e.key === "ArrowLeft" || e.key === "ArrowRight") &&
                open &&
                rowPlant() !== null &&
                e.currentTarget.selectionStart === query.length &&
                e.currentTarget.selectionEnd === query.length
              ) {
                // On a plant's row, with the caret at the end, the side arrows move along its forms (P54).
                e.preventDefault();
                const plant = rowPlant()!;
                const n = plant.options.length;
                const now = chips[plant.key] ?? plant.at;
                setChips({ ...chips, [plant.key]: (now + (e.key === "ArrowRight" ? 1 : n - 1)) % n });
              } else if ((e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) && results.length > 0) {
                e.preventDefault();
                choose(onChip(results[Math.min(highlight, results.length - 1)]));
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
            {/* What the search takes in, while searching (P49). Pressing a switch keeps the focus in the bar. */}
            <li className="results-switches" onMouseDown={(e) => e.preventDefault()}>
              <span className="muted">{t.include}</span>
              <Switch checked={mine} label={t.mine} onChange={setMine} />
              <Switch checked={formulas} label={t.formulas} onChange={setFormulas} />
            </li>
            {results.map((row, i) => {
              const r = onChip(row);
              const plant = row.kind === "material" ? row.plant : undefined;
              return (
              <li
                key={row.kind === "create" ? "create" : row.kind === "note" ? "note" : (plant?.key ?? row.material.key)}
                className={[i === highlight ? "active" : "", plant ? "plant-row" : ""].join(" ").trim() || undefined}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(r);
                }}
              >
                {r.kind === "note" ? (
                  <span className="muted">{r.text}</span>
                ) : r.kind === "create" ? (
                  <span className="create">{t.createProvisional(r.name)}</span>
                ) : (
                  <>
                    {r.icon &&
                      (() => {
                        // The icon carries the family's colour, and says it on hover (P48).
                        const look = familyLook(r.family);
                        const title = r.code && r.code !== r.icon ? `${r.code} · ${look.title}` : look.title;
                        return (
                          <span className={`code-chip ${look.className}`} style={look.style} title={title}>
                            <IconText text={r.icon} mark={r.iconMark} type={r.iconType} />
                          </span>
                        );
                      })()}
                    <span className="result-name">
                      <span className="primary">
                        {plant ? plant.name : r.material.name}
                        {r.kind === "material" && r.documented !== undefined && (
                          <span className="documented" title={t.documented(r.documented)}>
                            ✓
                          </span>
                        )}
                        {r.tradeCode && (
                          <span className="trade-code">
                            <IconText text={r.tradeCode} mark={r.iconMark} />
                          </span>
                        )}
                      </span>
                      {r.chemicalName && <span className="chemical">{r.chemicalName}</span>}
                      {r.glossaryName && <span className="chemical">{t.inGlossary(r.glossaryName)}</span>}
                      {r.shopName && <span className="chemical">{t.inShop(r.shopName)}</span>}
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
                    {plant && <PlantChips plant={plant} on={r} active={i === highlight} onMark={(at) => setChips({ ...chips, [plant.key]: at })} onChoose={choose} />}
                  </>
                )}
              </li>
              );
            })}
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
                focusPercent();
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
        {assumed && samePercent(assumed.percent, percent) && (
          <div className="dilution-note muted tiny" title={`${t.assumedHelp} ${assumed.source}`}>
            {t.assumed(assumed.percent.replace(".", ","), assumed.why, assumed.diluent.toUpperCase())}
          </div>
        )}
        <div className="dilution-group" role="group" aria-label={t.dilution}>
          <div className="percent-grid" role="radiogroup" aria-label={t.percentGroup}>
            {cells.map((p, i) =>
              editing !== null && editing.at === i ? (
                <input
                  key={`edit-${i}`}
                  className="cell-input num"
                  autoFocus
                  value={editing.text}
                  aria-label={t.customPercent}
                  onChange={(e) => setEditing({ at: i, text: e.target.value })}
                  onBlur={() => commitEdit()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const typed = commitEdit();
                      if (typed !== null) {
                        add(typed);
                      }
                    } else if (e.key === "Escape") {
                      setEditing(null);
                    }
                  }}
                />
              ) : (
                <button
                  key={`${i}-${p}`}
                  type="button"
                  ref={percentRefs[i]}
                  role="radio"
                  aria-checked={i === checkedCell}
                  tabIndex={i === checkedCell ? 0 : -1}
                  className={i === checkedCell ? "cell num checked" : "cell num"}
                  title={t.customPercent}
                  onClick={() => setPercent(p)}
                  onDoubleClick={() => setEditing({ at: i, text: p })}
                  onKeyDown={(e) => percentKeys(e, i)}
                >
                  {p} %
                </button>
              ),
            )}
            <button
              type="button"
              ref={pureRef}
              role="radio"
              aria-checked={pure}
              tabIndex={pure ? 0 : -1}
              className={pure ? "cell pure checked" : "cell pure"}
              onClick={() => setPercent("100")}
              onKeyDown={(e) => percentKeys(e, -1)}
            >
              {t.pureButton}
            </button>
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
                    focusPercent();
                  } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    openOther();
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
              >
                {diluentMaterial(d)?.name ?? d}
              </button>
            ))}
          </div>
          <div className="other-wrap">
            <button
              type="button"
              className="other"
              title={t.otherDiluent}
              aria-label={t.otherDiluent}
              aria-expanded={otherOpen}
              tabIndex={-1}
              onClick={() => (otherOpen ? setOtherOpen(false) : openOther())}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <circle cx="2.5" cy="6" r="1.1" fill="currentColor" />
                <circle cx="6" cy="6" r="1.1" fill="currentColor" />
                <circle cx="9.5" cy="6" r="1.1" fill="currentColor" />
              </svg>
            </button>
            {otherOpen && (
              <div
                className="menu-pop diluent-menu"
                ref={otherRef}
                role="menu"
                aria-label={t.otherDiluent}
                onKeyDown={(e) => {
                  const items = [...(otherRef.current?.querySelectorAll<HTMLElement>("button, input") ?? [])];
                  const at = items.indexOf(document.activeElement as HTMLElement);
                  if (e.key === "Escape" || (e.key === "ArrowLeft" && (e.target as HTMLElement).tagName !== "INPUT")) {
                    e.preventDefault();
                    setOtherOpen(false);
                    diluentRefs[checkedDiluent].current?.focus();
                  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
                  }
                }}
              >
                {others.map((d) => (
                  <button key={d.id} type="button" className="menuitem" role="menuitem" onClick={() => pickDiluent(d.id)}>
                    {d.name}
                    {d.own && <span className="muted tiny"> · {t.provisionalDiluent}</span>}
                  </button>
                ))}
                <input
                  className="own-diluent"
                  value={ownName}
                  placeholder={t.ownDiluent}
                  aria-label={t.ownDiluent}
                  onChange={(e) => setOwnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && ownName.trim() !== "") {
                      e.preventDefault();
                      pickDiluent(addOwnDiluent(ownName));
                    }
                  }}
                />
              </div>
            )}
          </div>
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
      {error ? <span className="add-error">{error}</span> : props.warning && <span className="add-error add-warning" role="status">{props.warning}</span>}
    </div>
  );
}
