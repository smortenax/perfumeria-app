import { Ratio } from "../core/arith/ratio";
import type { Line } from "../core/compose";
import { formatGrams } from "../core/display";
import type { Change } from "../core/model/formula";
import { texts } from "../i18n/es";
import { dilutionText, initials, massText, weighingWarning } from "./format";

const t = texts.history;

type Add = Extract<Change, { kind: "add" }>;

function describe(change: Change, adds: ReadonlyMap<string, Add>): string {
  switch (change.kind) {
    case "add":
      return `${change.material.name} · ${t.line(
        massText(Ratio.of(change.massUg)),
        dilutionText(change.fraction),
        change.diluent ? t.inDiluent(change.diluent.name) : "",
      )}`;
    case "set-mass":
      return t.setMass(adds.get(change.target)?.material.name ?? "?", massText(Ratio.of(change.massUg)));
    case "remove":
      return t.removeOf(adds.get(change.target)?.material.name ?? "?");
    case "reweigh":
      return t.reweigh(formatGrams(Ratio.of(change.grossUg), 3));
    case "note":
      return `${t.note}: ${change.text}`;
  }
}

function chipText(change: Change): string {
  switch (change.kind) {
    case "add":
      return initials(change.material.name);
    case "set-mass":
      return "±";
    case "remove":
      return "✕";
    case "reweigh":
      return "⚖";
    case "note":
      return "✎";
  }
}

/**
 * The history as a dock (§10.1): every change in its order, even when a
 * material repeats. On hover it says material and quantity; notes are marks in it.
 */
export function HistoryDock(props: {
  history: readonly Change[];
  frame: number | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onFrame: (frame: number | null) => void;
}) {
  const adds = new Map(props.history.filter((c): c is Add => c.kind === "add").map((c) => [c.id, c]));
  const end = props.frame ?? props.history.length;
  return (
    <footer className="dock">
      <div className="dock-head">
        <h3>{texts.history.title}</h3>
        {props.frame !== null && (
          <span className="frame">
            {t.frame(props.frame, props.history.length)}
            <button type="button" className="link" onClick={() => props.onFrame(null)}>
              {t.toEnd}
            </button>
          </span>
        )}
      </div>
      {props.history.length === 0 ? (
        <p className="muted">{t.empty}</p>
      ) : (
        <ol className="dock-items">
          {props.history.map((change, i) => {
            const warning = change.kind === "add" ? weighingWarning(change.massUg) : null;
            const classes = [
              "chip",
              `chip-${change.kind}`,
              change.id === props.selectedId ? "selected" : "",
              i >= end ? "future" : "",
              warning ? `warn-${warning.kind}` : "",
            ];
            return (
              <li key={change.id}>
                <button
                  type="button"
                  className={classes.join(" ")}
                  title={describe(change, adds) + (warning ? ` · ${warning.text}` : "")}
                  onClick={() => props.onSelect(change.id === props.selectedId ? null : change.id)}
                >
                  {chipText(change)}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </footer>
  );
}

/** What one change is, and what can be done with it. */
export function ChangeDetail(props: {
  change: Change;
  index: number;
  history: readonly Change[];
  current: ReadonlyMap<string, Line>;
  onEditMass: (line: Add) => void;
  onRemove: (line: Add) => void;
  onFrame: (frame: number) => void;
  onClose: () => void;
}) {
  const { change } = props;
  const adds = new Map(props.history.filter((c): c is Add => c.kind === "add").map((c) => [c.id, c]));
  const line = change.kind === "add" ? props.current.get(change.id) : undefined;
  const warning = change.kind === "add" ? weighingWarning(change.massUg) : null;
  return (
    <section className="change-detail">
      <p className="detail-title">
        <strong>{props.index + 1}.</strong> {describe(change, adds)}
      </p>
      {change.kind === "add" && line && (
        <p className="small">
          {t.pure(massText(line.massUg.mul(line.fraction)))}
          {!line.massUg.eq(Ratio.of(change.massUg)) && ` · ${massText(line.massUg)}`}
        </p>
      )}
      {change.kind === "add" && !line && <p className="small muted">{t.removed}</p>}
      {warning && <p className={`small warn-${warning.kind}`}>{warning.text}</p>}
      <div className="detail-actions">
        {change.kind === "add" && line && (
          <>
            <button type="button" onClick={() => props.onEditMass(change)}>
              {t.editMass}
            </button>
            <button type="button" onClick={() => props.onRemove(change)}>
              {t.remove}
            </button>
          </>
        )}
        <button type="button" onClick={() => props.onFrame(props.index + 1)}>
          {t.seeHere}
        </button>
        <button type="button" className="link" onClick={props.onClose}>
          {t.close}
        </button>
      </div>
    </section>
  );
}
