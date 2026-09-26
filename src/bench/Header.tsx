import { useEffect, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { formatDecimal, formatGrams } from "../core/display";
import type { FormulaHeader } from "../core/model/formula";
import { texts } from "../i18n/es";

const g = texts.grams;

/** The name, big, and the file it lives in (§10.1: «solo nombre y fecha»). */
export function NameCard(props: { header: FormulaHeader; status: string; statusIsError: boolean; onChange: (header: FormulaHeader) => void }) {
  return (
    <div className="card name-card">
      <input
        className="formula-name"
        value={props.header.name}
        placeholder={texts.bench.namePlaceholder}
        onChange={(e) => props.onChange({ ...props.header, name: e.target.value })}
      />
      <span className={props.statusIsError ? "num status error" : "num status"}>{props.status}</span>
    </div>
  );
}

/** The intention (§3.3). */
export function IntentionCard(props: { header: FormulaHeader; onChange: (header: FormulaHeader) => void }) {
  return (
    <label className="card intention-card">
      <span className="label">{texts.bench.intention}</span>
      <textarea
        value={props.header.intention}
        placeholder={texts.bench.intentionPlaceholder}
        onChange={(e) => props.onChange({ ...props.header, intention: e.target.value })}
      />
    </label>
  );
}

/** A figure in grams that becomes a field when pressed; Enter or leaving it takes it. */
function EditableGrams(props: { value: bigint | null; empty: string; emptyClass?: string; onCommit: (value: bigint | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [bad, setBad] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) {
      input.current?.focus();
      input.current?.select();
    }
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        className={props.value === null ? `value empty ${props.emptyClass ?? ""}` : "value num"}
        title={g.edit}
        onClick={() => {
          setText(props.value === null ? "" : formatDecimal(Ratio.of(props.value).div(Ratio.of(1_000_000)), 3));
          setBad(false);
          setEditing(true);
        }}
      >
        {props.value === null ? props.empty : formatGrams(Ratio.of(props.value), 3)}
      </button>
    );
  }
  const commit = () => {
    try {
      props.onCommit(text.trim() === "" ? null : parseMass(text, "g"));
      setEditing(false);
    } catch {
      setBad(true);
    }
  };
  return (
    <input
      ref={input}
      className={bad ? "value-input num bad" : "value-input num"}
      value={text}
      title={bad ? g.invalid : g.edit}
      inputMode="decimal"
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit();
        } else if (e.key === "Escape") {
          setEditing(false);
        }
      }}
    />
  );
}

/**
 * The grams, condensed to the right of the header (§10.1): the bottle's weight,
 * the work batch, what is in the bottle and the final batch, on which IFRA is
 * measured (§3.3).
 */
export function GramsCard(props: { header: FormulaHeader; totalUg: Ratio; onChange: (header: FormulaHeader) => void }) {
  const { header, onChange } = props;
  const container = header.container ?? { capacityMl: null, tareUg: null };
  const tare = container.tareUg;
  const setTare = (tareUg: bigint | null) =>
    onChange({ ...header, container: tareUg === null && container.capacityMl === null ? null : { ...container, tareUg } });
  return (
    <div className="card grams-card">
      <div className="grams-block">
        <span className="label">{g.frameWeight}</span>
        <span className="grams-line">
          <span>{g.tare}</span>
          <EditableGrams value={tare} empty={g.unweighed} emptyClass="amber" onCommit={setTare} />
        </span>
        <span className="grams-line">
          <span>{g.gross}</span>
          <span className={tare === null ? "value empty" : "value num"}>
            {tare === null ? g.onReopen : formatGrams(Ratio.of(tare).add(props.totalUg), 3)}
          </span>
        </span>
      </div>
      <div className="grams-block">
        <span className="label">{g.workBatch}</span>
        <EditableGrams value={header.workBatchUg} empty={g.none} onCommit={(v) => onChange({ ...header, workBatchUg: v })} />
      </div>
      <div className="grams-block">
        <span className="label">{g.inBottle}</span>
        <span className="value num strong">{formatGrams(props.totalUg, 3)}</span>
      </div>
      <div className="grams-block">
        <span className="label">{g.finalBatch}</span>
        <span className="grams-final">
          <EditableGrams value={header.finalBatchUg} empty={g.none} onCommit={(v) => onChange({ ...header, finalBatchUg: v })} />
          <span className="pill">{g.ifra}</span>
        </span>
      </div>
    </div>
  );
}
