import { useEffect, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { formatDecimal, formatGrams } from "../core/display";
import type { FormulaHeader } from "../core/model/formula";
import { texts } from "../i18n/es";

const t = texts.grams;

/** Name and intention (§3.3). */
export function Header(props: { header: FormulaHeader; onChange: (header: FormulaHeader) => void }) {
  const { header, onChange } = props;
  return (
    <header className="bench-header">
      <input
        className="formula-name"
        value={header.name}
        placeholder={texts.bench.namePlaceholder}
        onChange={(e) => onChange({ ...header, name: e.target.value })}
      />
      <textarea
        className="formula-intention"
        rows={2}
        value={header.intention}
        placeholder={texts.bench.intentionPlaceholder}
        onChange={(e) => onChange({ ...header, intention: e.target.value })}
      />
    </header>
  );
}

/** A figure typed in the user's units; it takes effect on Enter or on leaving the field. */
function Field(props: {
  label: string;
  value: string;
  parse: (text: string) => void;
}) {
  const [text, setText] = useState(props.value);
  const [bad, setBad] = useState(false);
  useEffect(() => {
    setText(props.value);
    setBad(false);
  }, [props.value]);
  const commit = () => {
    try {
      props.parse(text);
      setBad(false);
    } catch {
      setBad(true);
    }
  };
  return (
    <label className={bad ? "gram-field bad" : "gram-field"} title={bad ? t.invalid : undefined}>
      <span>{props.label}</span>
      <input
        value={text}
        inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit();
          }
        }}
      />
    </label>
  );
}

const gramsText = (ug: bigint | null): string => (ug === null ? "" : formatDecimal(Ratio.of(ug).div(Ratio.of(1_000_000)), 3));
const optionalMass = (text: string): bigint | null => (text.trim() === "" ? null : parseMass(text, "g"));

/**
 * The grams, condensed to the right of the header (§10.1): what is only needed
 * at the start. IFRA is measured on the final batch (§3.3).
 */
export function GramsPanel(props: { header: FormulaHeader; totalUg: Ratio; onChange: (header: FormulaHeader) => void }) {
  const { header, onChange } = props;
  const container = header.container ?? { capacityMl: null, tareUg: null };
  const setContainer = (next: typeof container) =>
    onChange({ ...header, container: next.capacityMl === null && next.tareUg === null ? null : next });
  const tare = container.tareUg;
  return (
    <section className="grams">
      <h3>{t.title}</h3>
      <div className="grams-grid">
        <Field
          label={t.capacity}
          value={container.capacityMl === null ? "" : formatDecimal(container.capacityMl, 2).replace(/,?0+$/, "")}
          parse={(text) => setContainer({ ...container, capacityMl: text.trim() === "" ? null : Ratio.fromDecimal(text) })}
        />
        <Field label={t.tare} value={gramsText(tare)} parse={(text) => setContainer({ ...container, tareUg: optionalMass(text) })} />
        <div className="gram-field readonly">
          <span>{t.gross}</span>
          <output>{tare === null ? t.none : formatGrams(Ratio.of(tare).add(props.totalUg), 3)}</output>
        </div>
        <Field label={t.workBatch} value={gramsText(header.workBatchUg)} parse={(text) => onChange({ ...header, workBatchUg: optionalMass(text) })} />
        <div className="gram-field readonly">
          <span>{t.inBottle}</span>
          <output>{formatGrams(props.totalUg, 3)}</output>
        </div>
        <Field label={t.finalBatch} value={gramsText(header.finalBatchUg)} parse={(text) => onChange({ ...header, finalBatchUg: optionalMass(text) })} />
      </div>
    </section>
  );
}
