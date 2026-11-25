import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { texts } from "../i18n/en";
import { Button } from "../Button";

/**
 * The app's dialogs, shared by every screen (moved out of the bench, 2026-11-25): the native modal,
 * a group of choices, one field, and a confirmation.
 */
const t = texts.dialog;

export function Modal(props: {
  title: string;
  children: ReactNode;
  error: string | null;
  onCancel: () => void;
  onAccept: () => void;
  /** What it accepts deletes: the button says so (audit F-11). */
  danger?: boolean;
  /** Room for two columns: the bench picker (audit F-01). */
  wide?: boolean;
  /** What the accept button says («Create», «Delete»), not «OK» (F-02, picked 2026-11-02). */
  acceptLabel?: string;
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
  // The bench's styles hold the dialog's: outside the bench, a host that draws no box carries them (F-02).
  return (
    <div className="bench-root dialog-host">
    <dialog
      ref={dialog}
      className={props.wide ? "modal wide" : "modal"}
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
            {props.acceptLabel ?? t.accept}
          </Button>
        </div>
      </form>
    </dialog>
    </div>
  );
}

/**
 * One of a few, as rows to press (audit F-08 L2), like the bottles of the add bar. Each row is a real
 * radio, hidden, so that the arrows, Space and a screen reader work as with any radio.
 */
export function Choices<T extends string>(props: {
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
  acceptLabel?: string;
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
      acceptLabel={props.acceptLabel}
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
export function ConfirmDialog(props: { title: string; text: string; danger?: boolean; acceptLabel?: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal
      title={props.title}
      danger={props.danger}
      acceptLabel={props.acceptLabel}
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
