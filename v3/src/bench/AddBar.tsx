import { useEffect, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass, parsePercent, type MassUnit } from "../core/arith/units";
import type { Change, SecondDiluent } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { casForm, normalize, searchCatalog, type CatalogEntry, type IfraState, type MaterialFamily, type Weighing } from "./data/catalog";
import { defaultOption, formLabel, makerIndex, plantIndex } from "./data/plants";
import { texts } from "./texts";
import {
  addOwnDiluent,
  APP_DILUENTS,
  diluentMaterial,
  diluentOptions,
  isPure,
  knownMix,
  ownDiluents,
  ownName as userNameOf,
  percentOptions,
  prefsOf,
  rememberLast,
  rememberName,
  sameDilution,
  type DiluentId,
  type Dilution,
  type MaterialPrefs,
} from "./prefs";
import { proposedWeighing } from "./assumptions";
import { familyLook } from "./family";
import { dilutionText, initials } from "./format";
import { IconText } from "./Icon";
import { FamilyIcon, MaterialChip } from "./FamilyIcon";
import { newId } from "./state";
import { pourKey, type Pour } from "./usage-bar";
import { type BottleChoice, percentCell } from "./bottles";

const t = texts.addBar;

export interface AddBarHandle {
  select(material: Material): void;
  focus(): void;
  /** A bottle just made in the pop-up (V3-79): put it in the bar once it is in the list, and go back to the «+». */
  pickBottle(id: string): void;
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
  /** A formula not yet kept as a material (2026-10-19): choosing it keeps it, and it is poured as one. */
  | { kind: "formula"; id: string; name: string; place: string }
  /** What was typed cannot be a material: a CAS that is not in the glossary (P56). */
  | { kind: "note"; text: string };

type MaterialResult = Extract<Result, { kind: "material" }>;

const samePercent = (a: string, b: string) => a.replace(",", ".") === b.replace(",", ".");

/**
 * A mixture of two diluents in the bar, while its switch is on (2026-10-08), as its cells say it:
 * the material's %, beside it the % of the first diluent (the upper one), and the second diluent,
 * which takes the rest.
 */
interface Mix {
  readonly percent: string;
  readonly firstPercent: string;
  readonly first: DiluentId;
  readonly second: DiluentId;
}

const mixFrom = (d: Dilution): Mix | null =>
  d.mix ? { percent: d.percent, firstPercent: d.mix.percent, first: d.diluent, second: d.mix.diluent } : null;

const mixDilution = (m: Mix): Dilution => ({ percent: m.percent, diluent: m.first, mix: { percent: m.firstPercent, diluent: m.second } });

/** A diluent added to a mixture beyond the two (V3-67): its diluent and its % of what is poured. */
interface Extra {
  readonly id: DiluentId;
  readonly percent: string;
}

/**
 * The mixture read as `add` reads it: the fraction of pure matter and the diluents; or what is wrong,
 * and in which cell. The extra diluents (V3-67) carry their %, as the upper one; the lower one takes the rest.
 */
function readMix(
  m: Mix,
  extras: readonly Extra[] = [],
): { fraction: Ratio; diluent: Material; secondDiluent: SecondDiluent; moreDiluents?: SecondDiluent[] } | { error: string; at?: 0 | 1 } {
  const first = diluentMaterial(m.first);
  const second = diluentMaterial(m.second);
  if (!first || !second || first.key === second.key) {
    return { error: t.badDiluent };
  }
  const more: SecondDiluent[] = [];
  for (const x of extras) {
    const material = diluentMaterial(x.id);
    if (!material || [first.key, second.key, ...more.map((d) => d.material.key)].includes(material.key)) {
      return { error: t.badDiluent };
    }
    try {
      const share = parsePercent(x.percent);
      if (share.eq(Ratio.ONE)) throw new RangeError();
      more.push({ material, fraction: share });
    } catch {
      return { error: t.badMixPercent(material.name) };
    }
  }
  let fraction: Ratio;
  try {
    fraction = parsePercent(m.percent);
  } catch {
    return { error: t.badPercent, at: 0 };
  }
  if (fraction.eq(Ratio.ONE)) {
    return { error: t.mixPure, at: 0 };
  }
  let share: Ratio;
  try {
    share = parsePercent(m.firstPercent);
  } catch {
    return { error: t.badMixPercent(first.name), at: 1 };
  }
  const rest = Ratio.ONE.sub(fraction).sub(share).sub(Ratio.sum(more.map((d) => d.fraction)));
  if (rest.sign() <= 0) {
    return { error: t.noRest(second.name), at: 1 };
  }
  return { fraction, diluent: first, secondDiluent: { material: second, fraction: rest }, ...(more.length ? { moreDiluents: more } : {}) };
}

/** What is left for the lower diluent, while every % can be read; null while not. */
function restOf(m: Mix, extras: readonly Extra[] = []): Ratio | null {
  try {
    return Ratio.ONE.sub(parsePercent(m.percent))
      .sub(parsePercent(m.firstPercent))
      .sub(Ratio.sum(extras.map((x) => parsePercent(x.percent))));
  } catch {
    return null;
  }
}

/** Whether a pour is exactly one of your bottles (V3-67): then it says it came from it. */
function isBottle(b: BottleChoice, fraction: Ratio, diluents: readonly { key: string; share: Ratio }[]): boolean {
  if (!b.fraction.eq(fraction) || b.diluents.length !== diluents.length) return false;
  return b.diluents.every((d) => {
    const key = diluentMaterial(d.id)?.key;
    return diluents.some((x) => x.key === key && x.share.eq(d.share));
  });
}

function Switch(props: { checked: boolean; label: string; title?: string; className?: string; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      tabIndex={-1}
      className={props.className ? `switch ${props.className}` : "switch"}
      title={props.title}
      onClick={() => props.onChange(!props.checked)}
    >
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
 * of diluent (P26). With the switch of two diluents on, the two cells are written in: the
 * material's % and the upper diluent's; the lower diluent takes the rest, shown where «Puro» was.
 */
export function AddBar(props: {
  ref?: Ref<AddBarHandle>;
  entries: readonly CatalogEntry[];
  sessionMaterials: readonly Material[];
  /** «Lo que tengo» (V3-3): with it, the switch «solo lo que tengo» (plan 8.2); without it, no switch. */
  have?: ReadonlySet<string>;
  /** A pour; with the bottle of yours it is exactly, when it is one (V3-67). */
  onAdd: (change: Change, dilutionId?: string | null) => void;
  /** Your bottles of a material (V3-67): a tab each above the dilution; none, no tabs. */
  bottles?: (materialKey: string) => readonly BottleChoice[];
  onQuickMaterial: () => void;
  /** «Fórmula como material…» in the «+» menu (2026-10-19): a list of the formulas that can be poured here. */
  onFormulaAsMaterial?: () => void;
  /** Formulas that can be poured here but are not kept as a material yet: found with «Fórmulas» on (2026-10-19). */
  pendingFormulas?: readonly { readonly id: string; readonly name: string; readonly place: string }[];
  /** Keeps one of them as a material and chooses it in the bar. */
  onUseFormula?: (formulaId: string) => void;
  /** Where each formula kept as a material comes from («· Cuir»), to tell apart those with the same name. */
  formulaPlace?: (materialKey: string) => string | undefined;
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
  /** What the formula carries of the chosen material, its margin and its usual use: under the material (V3-73). */
  insight?: ReactNode;
  /** The material's orb, as everywhere else in the app (V3-73); without one, its icon. */
  orbOf?: (key: string) => ReactNode;
  /** Opens a new dilution of the material in Dilutions (V3-73: «un +»); without it, the «+» is off. */
  onNewBottle?: (materialKey: string) => void;
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
  const [diluent, setDiluent] = useState<DiluentId>("dpg");
  const [mix, setMix] = useState<Mix | null>(null);
  /** The diluents of a mixture beyond the two (V3-67, «añadir diluyente»). */
  const [extras, setExtras] = useState<Extra[]>([]);
  /** The bottle of yours pressed last: the pour says it came from it while it still is it. */
  const [bottle, setBottle] = useState<BottleChoice | null>(null);
  const [mine, setMine] = useState(true);
  const [formulas, setFormulas] = useState(true);
  const [onlyHave, setOnlyHave] = useState(false);
  const [menu, setMenu] = useState(false);
  /** The slot whose diluent menu is open (0 the top one, 1 the bottom one, 2 + i the extra i), or null. */
  const [otherOpen, setOtherOpen] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  /** The last % written, for when «Neat» is let go. */
  const [lastPercent, setLastPercent] = useState("10");
  const [ownName, setOwnName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const percentRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const byKey = useMemo(() => new Map(props.entries.map((e) => [e.material.key, e])), [props.entries]);
  // The forms of every plant, in chip order (P54).
  const plants = useMemo(() => plantIndex(props.entries), [props.entries]);
  // The manufacturers' products of each general material (P62).
  const makers = useMemo(() => makerIndex(props.entries), [props.entries]);

  // One field for the material's % and «Neat» under it (V3-73: the add bar the user drew).
  const pure = !mix && isPure(percent);
  const percentText = mix ? mix.percent : pure ? "" : percent;
  const focusPercent = () => percentRef.current?.focus();
  /** Whatever the user changes by hand, the pour is no longer exactly one of their bottles. */
  const edited = () => {
    setBottle(null);
    setError(null);
  };
  const typePercent = (text: string) => {
    edited();
    if (mix) {
      setMix({ ...mix, percent: text });
    } else {
      setPercent(text);
      if (!isPure(text)) setLastPercent(text);
    }
  };
  const toggleNeat = () => {
    edited();
    if (pure) {
      setPercent(lastPercent || percentOptions(prefs).find((p) => !isPure(p)) || "10");
      return;
    }
    if (mix) setLastPercent(mix.percent || lastPercent);
    setMix(null);
    setExtras([]);
    setPercent("100");
  };

  // The diluents as chips (V3-73): one; or, with more, the top one and the extras with their %, the
  // bottom one taking the rest (2026-10-08, V3-67). A slot is 0 for the top one, 1 for the bottom
  // one and 2 + i for the extra i.
  const diluentChips: Array<{ slot: number; id: DiluentId; percent: string | null }> = mix
    ? [{ slot: 0, id: mix.first, percent: mix.firstPercent }, ...extras.map((x, i) => ({ slot: 2 + i, id: x.id, percent: x.percent })), { slot: 1, id: mix.second, percent: null }]
    : [{ slot: 0, id: diluent, percent: null }];
  const inUse = diluentChips.map((c) => c.id);
  const allDiluents: Array<{ id: DiluentId; name: string; own: boolean }> = [
    ...APP_DILUENTS.map((id) => ({ id: id as DiluentId, name: diluentMaterial(id)?.name ?? id, own: false })),
    ...ownDiluents().map((d) => ({ id: d.id, name: d.name, own: true })),
  ];
  const others = allDiluents.filter((d) => !inUse.includes(d.id));
  const nameOf = (id: DiluentId) => diluentMaterial(id)?.name ?? id;

  const typeChip = (slot: number, text: string) => {
    edited();
    if (!mix) return;
    if (slot === 0) setMix({ ...mix, firstPercent: text });
    else setExtras(extras.map((x, i) => (i === slot - 2 ? { ...x, percent: text } : x)));
  };
  const addDiluent = () => {
    edited();
    const next = others[0]?.id;
    if (!next) return;
    if (!mix) {
      setMix({ percent: percentText, firstPercent: "", first: diluent, second: next });
    } else {
      setExtras([...extras, { id: next, percent: "" }]);
    }
  };
  const removeChip = (slot: number) => {
    edited();
    if (!mix) return;
    if (extras.length === 0) {
      setDiluent(slot === 0 ? mix.second : mix.first);
      setPercent(mix.percent || lastPercent || "10");
      setMix(null);
    } else if (slot >= 2) {
      setExtras(extras.filter((_, i) => i !== slot - 2));
    } else if (slot === 0) {
      setMix({ ...mix, first: extras[0].id, firstPercent: extras[0].percent });
      setExtras(extras.slice(1));
    } else {
      setMix({ ...mix, second: extras[extras.length - 1].id });
      setExtras(extras.slice(0, -1));
    }
  };
  const pickDiluent = (id: DiluentId) => {
    edited();
    const slot = otherOpen;
    if (slot === null) return;
    if (!mix) setDiluent(id);
    else if (slot === 0) setMix({ ...mix, first: id });
    else if (slot === 1) setMix({ ...mix, second: id });
    else setExtras(extras.map((x, i) => (i === slot - 2 ? { ...x, id } : x)));
    setOtherOpen(null);
    setOwnName("");
  };

  // A menu takes the focus when it opens, so the arrows go on inside it.
  useEffect(() => {
    if (otherOpen !== null) otherRef.current?.querySelector<HTMLElement>("button, input")?.focus();
  }, [otherOpen]);
  useEffect(() => {
    if (moreOpen) moreRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, [moreOpen]);

  const current: Dilution = mix ? mixDilution(mix) : { percent, diluent };
  // The bar says when the dilution is the one used last with this material.
  const isLast = prefs.last !== undefined && (mix ? sameDilution(prefs.last, current) : samePercent(prefs.last.percent, percent));


  const results: Result[] = useMemo(() => {
    // Spaces as the provisional key takes them: «sandalmysore  core» is «Sandalmysore Core» (P44).
    const q = normalize(query.trim().replace(/\s+/g, " "));
    if (selected || q === "") {
      return [];
    }
    const had = onlyHave ? props.have : undefined;
    const pool = (mine ? props.entries : props.entries.filter((e) => e.group !== "own")).filter((e) => !had || had.has(e.material.key) || e.group === "diluent");
    // «Mis materiales» takes in the provisional ones too, remembered from the library (P44).
    const session: Result[] = props.sessionMaterials
      .filter((m) => (m.kind === "formula" ? formulas : mine) && normalize(m.name).includes(q))
      .map((m) => ({
        kind: "material",
        material: m,
        tag: m.kind === "formula" ? [t.formulaTag, props.formulaPlace?.(m.key)].filter((x) => x).join(" · ") : "provisional",
        cas: "",
      }));
    // The formulas not kept as a material yet, when «Fórmulas» is on: choosing one keeps it (2026-10-19).
    const pendingFormulas: Result[] = formulas
      ? (props.pendingFormulas ?? []).filter((f) => normalize(f.name).includes(q)).map((f) => ({ kind: "formula", id: f.id, name: f.name, place: f.place }))
      : [];
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
      tag: e.group === "diluent" ? "diluyente" : e.unreviewed ? t.unreviewed : null,
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
    const all = [...session, ...pendingFormulas, ...found];
    const exact = all.some((r) => r.kind === "material" && normalize(r.material.name) === q);
    // A CAS is not a name: one the glossary does not have is not made a material (P56).
    if (/^\s*\d{2,7}-\d{2}-\d{1,2}\s*$/.test(query)) {
      const cas = casForm(query);
      return all.length > 0 ? all : [{ kind: "note", text: cas ? t.casMissing(cas) : t.casInvalid(query.trim()) }];
    }
    return exact ? all : [...all, { kind: "create", name: query.trim() }];
  }, [query, selected, mine, formulas, onlyHave, props.have, props.entries, props.sessionMaterials, props.pendingFormulas, plants]);

  /** What a row stands for now: a plant's row, the option its chip is on. */
  const onChip = (r: Result): Result => (r.kind === "material" && r.plant ? r.plant.options[chips[r.plant.key] ?? r.plant.at] : r);

  const select = (material: Material) => {
    const p = prefsOf(material.key);
    setSelected(material);
    setQuery(material.name);
    setOpen(false);
    setHighlight(0);
    setError(null);
    setPrefs(p);
    // What the user chose last wins; without it, the product says what it is weighed at (D12), and the bar says it assumed it.
    const weighing = proposedWeighing(entryOf.get(material.key), material.solvent, p.last !== undefined);
    setAssumed(weighing ?? null);
    // A solvent goes pure; so does a formula the first time, since it already carries its diluent (§3.6).
    const proposed = material.solvent ? "100" : (weighing?.percent ?? p.last?.percent ?? (material.kind === "formula" ? "100" : percentOptions(p)[0]));
    setPercent(proposed);
    setLastPercent(isPure(proposed) ? (percentOptions(p).find((x) => !isPure(x)) ?? "10") : proposed);
    setDiluent(weighing?.diluent || (p.last?.diluent ?? diluentOptions(p)[0]));
    // Last used in a mixture, it opens in the mixture (2026-10-08).
    const lastMix = knownMix(p.last);
    setMix(lastMix && mixFrom(lastMix));
    setExtras([]);
    setBottle(null);
    setOtherOpen(null);
    setMoreOpen(false);
    props.onSelect?.(material);
  };

  /** Your bottles of the chosen material (V3-67), and what pressing one does: its exact figures in the cells. */
  const bottles = selected && props.bottles ? props.bottles(selected.key) : [];
  const useBottle = (b: BottleChoice) => {
    setError(null);
    setOtherOpen(null);
    setMoreOpen(false);
    setBottle(b);
    const [first, second, ...more] = b.diluents;
    if (!second) {
      setMix(null);
      setExtras([]);
      setPercent(percentCell(b.fraction));
      setDiluent(first.id);
      return;
    }
    // The upper diluent and the extra ones carry their %; the lower one takes the rest, which is its share.
    setMix({ percent: percentCell(b.fraction), firstPercent: percentCell(first.share), first: first.id, second: second.id });
    setExtras(more.map((d) => ({ id: d.id, percent: percentCell(d.share) })));
  };

  // The bottle made in the pop-up arrives with the next catalog: until then it waits here.
  const pendingBottle = useRef<string | null>(null);
  const newBottleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const id = pendingBottle.current;
    const b = id ? bottles.find((x) => x.id === id) : undefined;
    if (!b) return;
    pendingBottle.current = null;
    useBottle(b);
    newBottleRef.current?.focus();
  });

  useImperativeHandle(props.ref, () => ({
    pickBottle(id: string) {
      pendingBottle.current = id;
      newBottleRef.current?.focus();
    },
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
    if (result.kind === "formula") {
      setQuery("");
      setOpen(false);
      props.onUseFormula?.(result.id);
    } else if (result.kind === "create") {
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
    let diluentUsed: Material | null;
    let secondDiluent: SecondDiluent | undefined;
    let moreDiluents: SecondDiluent[] | undefined;
    if (mix) {
      const read = readMix(mix, extras);
      if ("error" in read) {
        setError(read.error);
        focusPercent();
        return;
      }
      ({ fraction, diluent: diluentUsed, secondDiluent, moreDiluents } = read);
    } else {
      try {
        fraction = parsePercent(percentText);
      } catch {
        setError(t.badPercent);
        return;
      }
      diluentUsed = fraction.eq(Ratio.ONE) ? null : diluentMaterial(diluent);
      if (!fraction.eq(Ratio.ONE) && !diluentUsed) {
        setError(t.badDiluent);
        return;
      }
    }
    const shares = diluentUsed
      ? [
          { key: diluentUsed.key, share: Ratio.ONE.sub(fraction).sub(Ratio.sum([secondDiluent, ...(moreDiluents ?? [])].flatMap((d) => (d ? [d.fraction] : [])))) },
          ...[secondDiluent, ...(moreDiluents ?? [])].flatMap((d) => (d ? [{ key: d.material.key, share: d.fraction }] : [])),
        ]
      : [];
    props.onAdd(
      {
        kind: "add",
        id: newId(),
        material: selected,
        massUg,
        fraction,
        diluent: diluentUsed,
        ...(secondDiluent ? { secondDiluent } : {}),
        ...(moreDiluents?.length ? { moreDiluents } : {}),
      },
      bottle && isBottle(bottle, fraction, shares) ? bottle.id : null,
    );
    rememberLast(selected.key, mix ? mixDilution(mix) : { percent: percentText, diluent });
    setSelected(null);
    setQuery("");
    setQuantity("");
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
      if (mix) {
        const read = readMix(mix, extras);
        return "error" in read ? null : { material: selected, massUg, ...read };
      }
      const fraction = parsePercent(percent);
      const used = fraction.eq(Ratio.ONE) ? null : diluentMaterial(diluent);
      return !fraction.eq(Ratio.ONE) && !used ? null : { material: selected, massUg, fraction, diluent: used };
    } catch {
      return null;
    }
  }, [selected, quantity, unit, percent, diluent, mix, extras]);
  const draftKey = pourKey(draft);
  const onDraft = props.onDraft;
  useEffect(() => {
    onDraft?.(draft);
    // Only when the pour changes: the key stands for all of it.
  }, [draftKey]);

  const rest = mix ? restOf(mix, extras) : null;
  const chosenEntry = selected ? byKey.get(selected.key) : undefined;
  /** Enter adds from any field of the dilution. */
  const addOnEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };
  const bottleButton = (b: BottleChoice) => (
    <button
      key={b.id}
      type="button"
      className="bottle-choice"
      aria-pressed={bottle?.id === b.id}
      title={t.bottleHelp(`${percentCell(b.fraction)} %`, b.diluents.map((d) => nameOf(d.id)).join(" + "))}
      onClick={() => {
        setMoreOpen(false);
        if (bottle?.id === b.id) setBottle(null);
        else useBottle(b);
      }}
    >
      <b>{b.label}</b>
      <small className="num">
        {percentCell(b.fraction)} % · {b.diluents.map((d) => nameOf(d.id)).join(" + ")}
      </small>
    </button>
  );

  return (
    <div className="card add-form">
      <div className="material">
        <div className="field-label">
          <label htmlFor="add-material">{t.material}</label>
          {/* A small «+» beside the label: a new material or a formula as one (P49). */}
          <span className="more">
            <button type="button" className="tool plus" title={t.more} aria-label={t.more} aria-expanded={menu} onClick={() => setMenu(!menu)}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M8 3v10M3 8h10" />
              </svg>
            </button>
            {menu && (
              <span
                className="menu-pop"
                onMouseLeave={() => setMenu(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setMenu(false);
                  }
                }}
              >
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
                {props.onFormulaAsMaterial && (
                  <button
                    type="button"
                    className="menuitem"
                    onClick={() => {
                      setMenu(false);
                      props.onFormulaAsMaterial?.();
                    }}
                  >
                    {t.formulaAsMaterial}
                  </button>
                )}
              </span>
            )}
          </span>
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
          {/* The chosen material whole, its icon and its name, over the field (audit F-04); typing replaces it. */}
          {selected && (
            <MaterialChip
              className="chosen-chip"
              orb={props.orbOf?.(selected.key)}
              name={selected.name}
              icon={chosenEntry ? { text: chosenEntry.icon, mark: chosenEntry.iconMark, type: chosenEntry.iconType } : { text: initials(selected.name) }}
              family={chosenEntry?.family}
            />
          )}
          {selected && (
            <button type="button" className="release" aria-label={t.release} title={t.release} onClick={release}>
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
              <span className="hint">{t.pickHint}</span>
              <span className="muted">{t.include}</span>
              <Switch checked={mine} label={t.mine} onChange={setMine} />
              <Switch checked={formulas} label={t.formulas} onChange={setFormulas} />
              {props.have && <Switch checked={onlyHave} label={t.have} onChange={setOnlyHave} />}
            </li>
            {results.map((row, i) => {
              const r = onChip(row);
              const plant = row.kind === "material" ? row.plant : undefined;
              return (
              <li
                key={row.kind === "create" ? "create" : row.kind === "note" ? "note" : row.kind === "formula" ? `formula:${row.id}` : (plant?.key ?? row.material.key)}
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
                ) : r.kind === "formula" ? (
                  <span className="result-name">
                    <span className="primary">{r.name}</span>
                    <span className="pill">{[t.formulaTag, r.place].join(" · ")}</span>
                    <span className="muted tiny"> {t.keptOnChoosing}</span>
                  </span>
                ) : (
                  <>
                    {r.icon &&
                      (() => {
                        // The icon carries the family's colour, and says it on hover (P48).
                        const look = familyLook(r.family);
                        const title = r.code && r.code !== r.icon ? `${r.code} · ${look.title}` : look.title;
                        return <FamilyIcon icon={{ text: r.icon, mark: r.iconMark, type: r.iconType }} family={r.family} title={title} />;
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
        {/* Under the material, live while the amount is typed: what the formula carries of it, its IFRA
            margin and its usual use (V3-73: «debajo del selector de materiales… incluso en el móvil»). */}
        {props.insight}
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
            placeholder="0"
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
          <button type="button" className="unit num" title={t.changeUnit} aria-label={`${t.changeUnit}: ${unit}`} onClick={() => setUnit(unit === "mg" ? "g" : "mg")}>
            {unit}
          </button>
        </div>
      </div>

      <div className="dilution">
        <label className="field-label" htmlFor="add-percent">
          {t.dilution}
          {isLast && !bottle && <span className="hint">{t.src.last}</span>}
        </label>
        <div className={pure ? "field percent-field off" : "field percent-field"}>
          <input
            id="add-percent"
            ref={percentRef}
            className="num"
            value={percentText}
            placeholder="–"
            inputMode="decimal"
            autoComplete="off"
            aria-describedby={!mix && assumed && samePercent(assumed.percent, percent) ? "add-assumed" : undefined}
            onChange={(e) => typePercent(e.target.value)}
            onKeyDown={addOnEnter}
          />
          <span className="unit-label">%</span>
        </div>
        <button type="button" className="neat-toggle" aria-pressed={pure} onClick={toggleNeat}>
          {t.pureButton}
        </button>
        {!mix && assumed && samePercent(assumed.percent, percent) && (
          <span id="add-assumed" className="dilution-note muted tiny" title={`${t.assumedHelp} ${assumed.source}`}>
            {t.assumed(assumed.percent.replace(".", ","), assumed.why, assumed.diluent.toUpperCase())}
          </span>
        )}
      </div>

      <div className="bottles-col">
        <span className="field-label">{t.yourBottles}</span>
        <div className="bottle-row-choices">
          {!selected ? (
            <span className="muted small bottle-none">{t.chooseFirst}</span>
          ) : bottles.length === 0 ? (
            <span className="muted small bottle-none">{t.noBottles}</span>
          ) : (
            bottles.slice(0, 2).map(bottleButton)
          )}
          {bottles.length > 2 && (
            <span className="more-bottles">
              <button
                type="button"
                className={bottles.slice(2).some((b) => b.id === bottle?.id) ? "more-btn on" : "more-btn"}
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen(!moreOpen)}
              >
                {t.moreBottles(bottles.length - 2)}
              </button>
              {moreOpen && (
                <div
                  ref={moreRef}
                  className="menu-pop bottle-menu"
                  role="group"
                  aria-label={t.bottles}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setMoreOpen(false);
                    }
                  }}
                >
                  {bottles.slice(2).map(bottleButton)}
                </div>
              )}
            </span>
          )}
          <button
            ref={newBottleRef}
            type="button"
            className="tool new-bottle"
            aria-label={t.newBottle}
            title={t.newBottle}
            disabled={!selected || !props.onNewBottle}
            onClick={() => selected && props.onNewBottle?.(selected.key)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </button>
        </div>
      </div>

      <div className="diluents-col">
        <span className="field-label">{bottle ? t.diluentsFromBottle : t.diluents}</span>
        <div className="diluent-chips" role="group" aria-label={t.diluentGroup}>
          {pure ? (
            <span className="muted small diluent-none">{t.neatNoDiluent}</span>
          ) : (
            <>
              {diluentChips.map((c) => (
                <span key={c.slot} className="diluent-chip">
                  <span className="other-wrap">
                    <button
                      type="button"
                      className="diluent-name"
                      title={t.changeDiluent}
                      aria-expanded={otherOpen === c.slot}
                      onClick={() => setOtherOpen(otherOpen === c.slot ? null : c.slot)}
                    >
                      {nameOf(c.id)}
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                        <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {otherOpen === c.slot && (
                      <div
                        className="menu-pop diluent-menu"
                        ref={otherRef}
                        role="menu"
                        aria-label={t.otherDiluent}
                        onKeyDown={(e) => {
                          const items = [...(otherRef.current?.querySelectorAll<HTMLElement>("button, input") ?? [])];
                          const at = items.indexOf(document.activeElement as HTMLElement);
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setOtherOpen(null);
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
                  </span>
                  {mix &&
                    (c.percent !== null ? (
                      <label className="diluent-percent num">
                        <input
                          value={c.percent}
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="–"
                          aria-label={t.mixFirstPercent(nameOf(c.id))}
                          onChange={(e) => typeChip(c.slot, e.target.value)}
                          onKeyDown={addOnEnter}
                        />
                        %
                      </label>
                    ) : (
                      <span className={rest !== null && rest.sign() <= 0 ? "diluent-rest over" : "diluent-rest"} title={t.mixRestHelp(nameOf(c.id))}>
                        {rest === null ? t.theRest : t.mixRest(rest.sign() > 0 ? dilutionText(rest) : "0 %")}
                      </span>
                    ))}
                  {mix && (
                    <button type="button" className="diluent-remove" aria-label={t.removeDiluent(nameOf(c.id))} title={t.removeDiluent(nameOf(c.id))} onClick={() => removeChip(c.slot)}>
                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
                      </svg>
                    </button>
                  )}
                </span>
              ))}
              {others.length > 0 && (
                <button type="button" className="add-diluent" onClick={addDiluent}>
                  {t.addDiluent}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="add-go">
        <button type="button" className="add-btn" onClick={() => add()}>
          {t.add}
        </button>
      </div>
      {error ? <span className="add-error" role="alert">{error}</span> : props.warning && <span className="add-error add-warning" role="status">{props.warning}</span>}
    </div>
  );
}
