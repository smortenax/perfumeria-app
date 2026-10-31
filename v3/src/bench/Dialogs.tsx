import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import type { Composition, Line } from "../core/compose";
import { formatGrams, formatPercent } from "../core/display";
import { readReweigh, type Reweigh, type ReweighMode } from "./reweigh";
import { maxUseWarning, recipe } from "./use-formula";
import { texts } from "./texts";
import { Button } from "../Button";

const t = texts.dialogs;

function Modal(props: {
  title: string;
  children: ReactNode;
  error: string | null;
  onCancel: () => void;
  onAccept: () => void;
  /** What it accepts deletes: the button says so (audit F-11). */
  danger?: boolean;
}) {
  // A native dialog (audit F-13 L2): showModal() takes the focus in, to its first field, keeps it in and
  // makes the bench behind inert; Escape asks to cancel. The focus goes back to what opened it.
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  // Read while rendering: a field's own focus (its effect runs first) would hide the opener.
  const [opener] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null));
  // Closed by this component, not by the browser: then its «close» is not a cancel.
  const leaving = useRef(false);
  // A layout effect, so that it is open before the fields' own effects focus them.
  useLayoutEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    return () => {
      leaving.current = true;
      if (d?.open) d.close();
      opener?.focus();
    };
  }, [opener]);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        props.onCancel();
      }}
      // A browser may close it without asking (Escape pressed twice): that is a cancel too.
      onClose={() => {
        if (!leaving.current) props.onCancel();
      }}
      // A press on the backdrop lands on the dialog itself, outside its body. Its default would take the
      // focus to the page under it, away from the opener it has just gone back to.
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        props.onCancel();
      }}
    >
      <form
        className="modal-body"
        onSubmit={(e) => {
          e.preventDefault();
          props.onAccept();
        }}
      >
        <h2 id={titleId}>{props.title}</h2>
        {props.children}
        {props.error && <p className="error">{props.error}</p>}
        <div className="modal-actions">
          <Button variant="secondary" onClick={props.onCancel}>
            {t.cancel}
          </Button>
          <Button type="submit" variant={props.danger ? "danger" : "primary"}>
            {t.accept}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

/**
 * One of a few, as rows to press (audit F-08 L2), like the bottles of the add bar. Each row is a real
 * radio, hidden, so that the arrows, Space and a screen reader work as with any radio.
 */
function Choices<T extends string>(props: {
  value: T | null;
  options: ReadonlyArray<{ readonly value: T; readonly label: ReactNode; readonly disabled?: boolean }>;
  onChange: (value: T) => void;
  /** A double press chooses and accepts. */
  onPick?: (value: T) => void;
}) {
  const name = useId();
  return (
    <div className="choices">
      {props.options.map((o) => (
        <label key={o.value} className="choice" onDoubleClick={props.onPick && !o.disabled ? () => props.onPick!(o.value) : undefined}>
          <input type="radio" name={name} checked={props.value === o.value} disabled={o.disabled} onChange={() => props.onChange(o.value)} />
          <span className="choice-label">{o.label}</span>
        </label>
      ))}
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
export function ConfirmDialog(props: { title: string; text: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal
      title={props.title}
      danger={props.danger}
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
      <Choices value={chosen} options={props.options.map((o) => ({ value: o.id, label: o.label }))} onChange={setChosen} />
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
            <Choices
              value={chosen}
              options={g.options.map((o) => ({ value: o.id, label: o.label }))}
              onChange={setChosen}
              onPick={(id) => (props.onDone(id), props.onClose())}
            />
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
        <Choices
          value={kind}
          options={[
            { value: "version", label: t.kindVersion },
            { value: "new", label: t.kindNew },
          ]}
          onChange={setKind}
        />
        <p className="help">{kind === "version" ? t.kindVersionHelp : t.kindNewHelp}</p>
      </fieldset>
      <label className="field">
        <span>{t.saveAsName}</span>
        <input ref={input} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {props.hasVial && (
        <fieldset className="field">
          <legend>{t.saveAsSameVial}</legend>
          <Choices
            value={sameVial ? "yes" : "no"}
            options={[
              { value: "yes", label: t.sameVialYes },
              { value: "no", label: t.sameVialNo },
            ]}
            onChange={(v) => setSameVial(v === "yes")}
          />
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
      <Choices
        value={mode}
        options={[
          {
            value: "withBottle",
            label: props.tareUg === null ? t.reweighWithBottleNoTare : t.reweighWithBottle(Ratio.of(props.tareUg).div(Ratio.of(1_000_000n)).toFixed(3)),
            disabled: props.tareUg === null,
          },
          { value: "tared", label: t.reweighTared },
        ]}
        onChange={setMode}
      />
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
      <Choices
        value={mode}
        options={[
          { value: "asIs", label: props.own ? u.asIs(formatPercent(props.own, 2)) : u.asIsUnknown, disabled: !props.own },
          { value: "required", label: u.required },
        ]}
        onChange={setMode}
      />
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
