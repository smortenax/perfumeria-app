import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { texts } from "../i18n/es";

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
