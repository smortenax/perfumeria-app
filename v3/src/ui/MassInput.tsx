import { useState, useSyncExternalStore, type KeyboardEvent, type Ref } from "react";
import type { MassUnit } from "../core/arith/units";
import { convertMassText } from "../format/mass";
import { texts } from "../i18n/en";
import "./MassInput.css";

const t = texts.massInput;

/**
 * The unit the masses are written in, one for the whole app while it is open: switched in a dilution, the add bar
 * follows, and the other way round. mg to start (the user, 2026-11-26: «que el peso base este en mg asi me ahorro
 * bastantes puntos y ceros»).
 */
let shared: MassUnit = "mg";
const listeners = new Set<() => void>();
export function useMassUnit(): [MassUnit, (unit: MassUnit) => void] {
  const unit = useSyncExternalStore(
    (listen) => {
      listeners.add(listen);
      return () => listeners.delete(listen);
    },
    () => shared,
  );
  return [
    unit,
    (next) => {
      shared = next;
      listeners.forEach((l) => l());
    },
  ];
}

/**
 * What the box shows: what was typed, while it still says the mass the caller holds («1.0» g stays «1.0», not «1»);
 * otherwise the caller's text, written in the unit shown.
 */
export function massShown(value: string, base: MassUnit, unit: MassUnit, draft: { readonly text: string; readonly unit: MassUnit } | null): string {
  if (draft && draft.unit === unit && convertMassText(draft.text, unit, base) === value) return draft.text;
  return convertMassText(value, base, unit);
}

/** The other unit of the scale: what the button switches to. */
export const otherUnit = (unit: MassUnit): MassUnit => (unit === "mg" ? "g" : "mg");

/**
 * A box to write a mass in, with its unit beside it as a button that switches mg ↔ g (2026-11-26; the user: «los boxes de
 * poner numeros deberia ser un sistema … donde puedas poner si lo escoges en g o mg (con selector)»). One piece for the
 * bench's add bar and every weight of the dilutions: the same keys, the same button, the same reading of what is typed.
 *
 * The caller keeps the text in one unit, `base` (the draft of «Add & weigh» is in mg, a bottle's form in g), and never
 * sees the other: the box shows it in `unit` and hands back the text in `base`, exact (format/mass.ts). Switching the unit
 * rewrites what is written («1030» mg → «1.03» g); it is the same mass. Without `unit`/`onUnit`, it follows `useMassUnit`.
 */
export function MassInput(props: {
  /** The text, in `base`. */
  value: string;
  base: MassUnit;
  onChange: (text: string) => void;
  /** The unit it is shown in; with `onUnit`, chosen by the caller (one for a whole screen). */
  unit?: MassUnit;
  onUnit?: (unit: MassUnit) => void;
  /** A figure in `base` shown faint when the box is empty, or a word. */
  placeholder?: string;
  /** The figure to reach, in `base`: it stays small above the box once something is written (P-UX-04). */
  goal?: string | null;
  "aria-label"?: string;
  id?: string;
  title?: string;
  /** The look of the box where it sits: «weigh-cell n» in a dilution row. */
  className?: string;
  /**
   * «box» (by default): the unit button inside the box, for the rows and forms of the dilutions (MassInput.css). «bench»:
   * the bench's amount field, as Designboard draws it (`.field.quantity-field`, `.unit` in bench/bench.css): the same piece
   * with the add bar's look.
   */
  look?: "box" | "bench";
  inputRef?: Ref<HTMLInputElement>;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [appUnit, setAppUnit] = useMassUnit();
  const unit = props.onUnit ? (props.unit ?? props.base) : appUnit;
  const [draft, setDraft] = useState<{ text: string; unit: MassUnit } | null>(null);
  const shownOf = (text: string) => convertMassText(text, props.base, unit);
  const baseOf = (text: string) => convertMassText(text, unit, props.base);
  const text = massShown(props.value, props.base, unit, draft);
  const setUnit = (next: MassUnit) => {
    setDraft(null);
    if (props.onUnit) props.onUnit(next);
    else setAppUnit(next);
  };
  const next = otherUnit(unit);
  const bench = props.look === "bench";
  return (
    <span className={bench ? "field quantity-field" : "mass-input"}>
      {props.goal && props.value.trim() && (
        <span className="mass-goal" aria-hidden="true">
          {shownOf(props.goal)}
        </span>
      )}
      <input
        id={props.id}
        ref={props.inputRef}
        className={bench ? "num" : props.className ? `mass-box ${props.className}` : "mass-box"}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        placeholder={props.placeholder === undefined ? unit : shownOf(props.placeholder)}
        aria-label={props["aria-label"] ? `${props["aria-label"]}, ${t.unitName[unit]}${props.goal ? `; ${t.toPut(shownOf(props.goal))}` : ""}` : undefined}
        title={props.title}
        onChange={(e) => {
          setDraft({ text: e.target.value, unit });
          props.onChange(baseOf(e.target.value));
        }}
        onKeyDown={props.onKeyDown}
      />
      <button
        type="button"
        className={bench ? "unit num" : "mass-unit"}
        title={t.switchTo(next)}
        aria-label={t.switchAria(unit, next)}
        // The focus stays in the box: the unit is chosen without leaving the figure.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setUnit(next)}
      >
        {unit}
      </button>
    </span>
  );
}
