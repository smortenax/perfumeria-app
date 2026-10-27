import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import type { Composition, Line } from "../core/compose";
import { formatGrams, formatPercent } from "../core/display";
import { readReweigh, type Reweigh, type ReweighMode } from "./reweigh";
import { maxUseWarning, recipe } from "./use-formula";
import { texts } from "./texts";

const t = texts.dialogs;

function Modal(props: {
  title: string;
  children: ReactNode;
  error: string | null;
  onCancel: () => void;
  onAccept: () => void;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={props.onCancel}>
      <form
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          props.onAccept();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            props.onCancel();
          }
        }}
      >
        <h2>{props.title}</h2>
        {props.children}
        {props.error && <p className="error">{props.error}</p>}
        <div className="modal-actions">
          <button type="button" onClick={props.onCancel}>
            {t.cancel}
          </button>
          <button type="submit" className="primary">
            {t.accept}
          </button>
        </div>
      </form>
    </div>
  );
}

/** One field. `submit` returns an error to show, or null when it is done. */
export function PromptDialog(props: {
  title: string;
  label: string;
  help?: string;
  initial?: string;
  submit: (value: string) => string | null;
  onClose: () => void;
}) {
  const [value, setValue] = useState(props.initial ?? "");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  return (
    <Modal
      title={props.title}
      error={error}
      onCancel={props.onClose}
      onAccept={() => {
        const problem = props.submit(value);
        if (problem) {
          setError(problem);
        } else {
          props.onClose();
        }
      }}
    >
      {props.help && <p className="help">{props.help}</p>}
      <label className="field">
        <span>{props.label}</span>
        <input ref={input} value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
    </Modal>
  );
}

/** Asking before something that cannot be undone (deleting a formula). */
export function ConfirmDialog(props: { title: string; text: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal
      title={props.title}
      error={null}
      onCancel={props.onClose}
      onAccept={() => {
        props.onConfirm();
        props.onClose();
      }}
    >
      <p className="help">{props.text}</p>
    </Modal>
  );
}

/** Choosing one of a few: the workbench a formula moves to (plan 8.1b). */
export function ChoiceDialog(props: {
  title: string;
  help?: string;
  options: ReadonlyArray<{ readonly id: string; readonly label: string }>;
  initial: string | null;
  onDone: (id: string) => void;
  onClose: () => void;
}) {
  const [chosen, setChosen] = useState<string | null>(props.initial);
  return (
    <Modal
      title={props.title}
      error={null}
      onCancel={props.onClose}
      onAccept={() => {
        if (chosen) props.onDone(chosen);
        props.onClose();
      }}
    >
      {props.help && <p className="help">{props.help}</p>}
      {props.options.map((o) => (
        <label key={o.id} className="radio">
          <input type="radio" checked={chosen === o.id} onChange={() => setChosen(o.id)} />
          <span>{o.label}</span>
        </label>
      ))}
    </Modal>
  );
}

/**
 * Choosing a formula from Formulación (V3-74, 2026-10-23): every formula of every bench, grouped by
 * bench (this one first), with a search over names and benches.
 */
export function FormulaPickerDialog(props: {
  title: string;
  help?: string;
  groups: ReadonlyArray<{ readonly name: string; readonly options: ReadonlyArray<{ readonly id: string; readonly label: string }> }>;
  onDone: (id: string) => void;
  onClose: () => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = fold(query.trim());
  const groups = props.groups
    .map((g) => ({ name: g.name, options: !q || fold(g.name).includes(q) ? g.options : g.options.filter((o) => fold(o.label).includes(q)) }))
    .filter((g) => g.options.length > 0);
  return (
    <Modal
      title={props.title}
      error={null}
      onCancel={props.onClose}
      onAccept={() => {
        if (chosen) props.onDone(chosen);
        props.onClose();
      }}
    >
      {props.help && <p className="help">{props.help}</p>}
      <label className="field">
        <span>{t.formulaPickerSearch}</span>
        <input ref={input} value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className="picker-list">
        {groups.length === 0 && <p className="help">{t.formulaPickerNoMatch}</p>}
        {groups.map((g) => (
          <fieldset key={g.name} className="picker-group">
            <legend>{g.name}</legend>
            {g.options.map((o) => (
              <label key={o.id} className="radio">
                <input type="radio" checked={chosen === o.id} onChange={() => setChosen(o.id)} onDoubleClick={() => (props.onDone(o.id), props.onClose())} />
                <span>{o.label}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </Modal>
  );
}

export interface SaveAsChoice {
  /** A new version of this formula, or a new formula of its own (P44). */
  readonly kind: "version" | "new";
  readonly name: string;
  /** null: no vial to ask about. */
  readonly sameVial: boolean | null;
  readonly tareUg: bigint | null;
  readonly capacityMl: Ratio | null;
}

/**
 * Guardar como (§3.2): a new version of this formula, named on its own, or a new
 * formula (P44); and the question of the vial.
 */
export function SaveAsDialog(props: {
  initialName: string;
  /** The name the new version takes: «Lejía v2». */
  versionName: string;
  hasVial: boolean;
  onDone: (choice: SaveAsChoice) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<SaveAsChoice["kind"]>("version");
  const [names, setNames] = useState({ version: props.versionName, new: props.initialName });
  const name = names[kind];
  const setName = (value: string) => setNames({ ...names, [kind]: value });
  const [sameVial, setSameVial] = useState(true);
  const [tare, setTare] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, [kind]);

  const accept = () => {
    if (name.trim() === "") {
      setError(t.saveAsName);
      return;
    }
    if (!props.hasVial) {
      props.onDone({ kind, name: name.trim(), sameVial: null, tareUg: null, capacityMl: null });
      return;
    }
    if (sameVial) {
      props.onDone({ kind, name: name.trim(), sameVial: true, tareUg: null, capacityMl: null });
      return;
    }
    try {
      const tareUg = parseMass(tare, "g");
      const capacityMl = capacity.trim() === "" ? null : Ratio.fromDecimal(capacity);
      props.onDone({ kind, name: name.trim(), sameVial: false, tareUg, capacityMl });
    } catch {
      setError(texts.grams.invalid);
    }
  };

  return (
    <Modal title={t.saveAsTitle} error={error} onCancel={props.onClose} onAccept={accept}>
      <fieldset className="field">
        <legend>{t.saveAsKind}</legend>
        <label className="radio">
          <input type="radio" checked={kind === "version"} onChange={() => setKind("version")} />
          {t.kindVersion}
        </label>
        <label className="radio">
          <input type="radio" checked={kind === "new"} onChange={() => setKind("new")} />
          {t.kindNew}
        </label>
        <p className="help">{kind === "version" ? t.kindVersionHelp : t.kindNewHelp}</p>
      </fieldset>
      <label className="field">
        <span>{t.saveAsName}</span>
        <input ref={input} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {props.hasVial && (
        <fieldset className="field">
          <legend>{t.saveAsSameVial}</legend>
          <label className="radio">
            <input type="radio" checked={sameVial} onChange={() => setSameVial(true)} />
            {t.sameVialYes}
          </label>
          <label className="radio">
            <input type="radio" checked={!sameVial} onChange={() => setSameVial(false)} />
            {t.sameVialNo}
          </label>
          {!sameVial && (
            <>
              <label className="field">
                <span>{t.newTare}</span>
                <input value={tare} onChange={(e) => setTare(e.target.value)} />
              </label>
              <label className="field">
                <span>{t.newCapacity}</span>
                <input value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </label>
            </>
          )}
        </fieldset>
      )}
    </Modal>
  );
}

/**
 * «Repesar…» (V3-57): when you decide, not on reopening. You say how you weigh: the whole bottle (the
 * app takes off its tare) or with the bottle tared on the scale (what you read is what is left).
 * Without a known tare, only the second.
 */
export function ReweighDialog(props: { tareUg: bigint | null; totalUg: Ratio | null; help: string; onDone: (r: Reweigh) => void; onClose: () => void }) {
  const t = texts.dialogs;
  const [mode, setMode] = useState<ReweighMode>(props.tareUg !== null ? "withBottle" : "tared");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), [mode]);
  return (
    <Modal
      title={t.reweighTitle}
      error={error}
      onCancel={props.onClose}
      onAccept={() => {
        const read = readReweigh(mode, value, props.tareUg, props.totalUg);
        if ("error" in read) {
          setError(read.error);
        } else {
          props.onDone(read);
          props.onClose();
        }
      }}
    >
      <p className="help">{props.help}</p>
      <label className="radio">
        <input type="radio" checked={mode === "withBottle"} disabled={props.tareUg === null} onChange={() => setMode("withBottle")} />
        <span>{props.tareUg === null ? t.reweighWithBottleNoTare : t.reweighWithBottle(Ratio.of(props.tareUg).div(Ratio.of(1_000_000n)).toFixed(3).replace(".", ","))}</span>
      </label>
      <label className="radio">
        <input type="radio" checked={mode === "tared"} onChange={() => setMode("tared")} />
        <span>{t.reweighTared}</span>
      </label>
      <label className="field">
        <span>{mode === "withBottle" ? t.grossLabel : t.netLabel}</span>
        <input ref={input} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
    </Modal>
  );
}

/**
 * «Usar la fórmula…» (V3-59): the whole formula and the exact recipe for what you need, as it is
 * (1:1, at its own concentration) or at another concentration, with the rest in alcohol. Nothing is
 * written: it is a recipe to weigh by.
 */
export function UseFormulaDialog(props: {
  composition: Composition;
  report: { readonly maxUse: Ratio; readonly partial: boolean } | null;
  /** The formula's own concentration (work batch over final batch); null when its batches are not known. */
  own: Ratio | null;
  describe: (line: Line) => string;
  onClose: () => void;
}) {
  const u = texts.useFormula;
  const [mode, setMode] = useState<"asIs" | "required">(props.own ? "asIs" : "required");
  const [grams, setGrams] = useState("50");
  const [percent, setPercent] = useState(props.own ? formatPercent(props.own, 2).replace(" %", "") : "20");
  let result: ReturnType<typeof recipe> | null = null;
  let problem: string | null = null;
  try {
    const totalUg = parseMass(grams, "g");
    const concentration = mode === "asIs" ? props.own! : Ratio.fromDecimal(percent.trim().replace(",", ".")).div(Ratio.of(100n));
    result = recipe(props.composition, totalUg, concentration);
  } catch {
    problem = u.unreadable;
  }
  const warning = result && mode === "required" ? maxUseWarning(result.concentration, props.report) : null;
  return (
    <Modal title={u.title} error={null} onCancel={props.onClose} onAccept={props.onClose}>
      <p className="help">{u.help}</p>
      <label className="radio">
        <input type="radio" checked={mode === "asIs"} disabled={!props.own} onChange={() => setMode("asIs")} />
        <span>{props.own ? u.asIs(formatPercent(props.own, 2)) : u.asIsUnknown}</span>
      </label>
      <label className="radio">
        <input type="radio" checked={mode === "required"} onChange={() => setMode("required")} />
        <span>{u.required}</span>
      </label>
      {mode === "required" && (
        <label className="field">
          <span>{u.concentration}</span>
          <input inputMode="decimal" value={percent} onChange={(e) => setPercent(e.target.value)} />
        </label>
      )}
      <label className="field">
        <span>{u.total}</span>
        <input inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} />
      </label>
      {problem && <p className="error">{problem}</p>}
      {result && (
        <table className="recipe">
          <tbody>
            {result.lines.map((l) => (
              <tr key={l.line.id}>
                <td>{props.describe(l.line)}</td>
                <td className="num">{formatGrams(Ratio.of(l.massUg), 3)}</td>
              </tr>
            ))}
            <tr className="sum">
              <td>{u.concentrate(formatPercent(result.concentration, 2))}</td>
              <td className="num">{formatGrams(Ratio.of(result.concentrateUg), 3)}</td>
            </tr>
            <tr>
              <td>{u.alcohol}</td>
              <td className="num">{formatGrams(Ratio.of(result.alcoholUg), 3)}</td>
            </tr>
            <tr className="sum">
              <td>{u.totalRow}</td>
              <td className="num">{formatGrams(Ratio.of(result.totalUg), 3)}</td>
            </tr>
          </tbody>
        </table>
      )}
      {warning && <p className={warning.kind === "over" ? "error" : "help"}>{warning.kind === "over" ? u.over(formatPercent(warning.maxUse, 2)) : u.partial}</p>}
    </Modal>
  );
}
