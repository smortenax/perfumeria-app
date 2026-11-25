import { useEffect, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import type { Composition, Line } from "../core/compose";
import { formatGrams, formatPercent } from "../core/display";
import { readReweigh, type Reweigh, type ReweighMode } from "./reweigh";
import { maxUseWarning, recipe } from "../lib/recipe";
import { texts } from "./texts";
import type { FormulaRecord, Workbench } from "../db/formulas";
import { switchBenches, switchFormulas } from "./switcher";
import { Choices, Modal } from "../ui/Dialog";

const t = texts.dialogs;

/**
 * Benches on the left and, on the right, the formulas of the one chosen, each version under its mother,
 * as Formulación shows them (audit F-01 L2); a search over both on top. To choose a bench only (moving a
 * formula), without the right column. Two columns where there is room, one over the other on a phone.
 */
function BenchPicker(props: {
  workbenches: readonly Workbench[];
  formulas: readonly FormulaRecord[];
  /** The bench to open on: the one you are in. */
  benchId: string;
  /** Only these formulas can be chosen; null, a bench and no formula. */
  choosable: ReadonlySet<string> | null;
  /** A word after a formula's name («saved now»). */
  noteOf?: (id: string) => string;
  bench: string | null;
  onBench: (id: string) => void;
  formula?: string | null;
  onFormula?: (id: string) => void;
  /** A double press on a formula chooses and accepts. */
  onPick?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const choosable = props.choosable;
  const usable = choosable ? props.formulas.filter((f) => choosable.has(f.id)) : props.formulas;
  // A bench shows when its name matches or, choosing formulas, one of its formulas does.
  const all = switchBenches(props.workbenches, usable, props.benchId);
  const byName = new Set(switchBenches(props.workbenches, usable, props.benchId, query).map((b) => b.id));
  const benches = all.filter((b) => byName.has(b.id) || (choosable !== null && query.trim() !== "" && switchFormulas(usable, b.id, "", query).length > 0));
  const open = props.bench ?? props.benchId;
  // In a bench found by its name, every formula; else only those the search finds.
  const formulas = choosable === null ? [] : switchFormulas(usable, open, "", byName.has(open) ? "" : query);
  return (
    <div className="bench-picker">
      <label className="field">
        <span>{choosable ? t.formulaPickerSearch : t.benchPickerSearch}</span>
        <input ref={input} type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className={choosable ? "picker-columns" : "picker-columns one"}>
        <fieldset className="picker-group">
          <legend>{t.benches}</legend>
          {benches.length === 0 ? (
            <p className="help">{t.formulaPickerNoMatch}</p>
          ) : (
            <Choices
              value={open}
              options={benches.map((b) => ({ value: b.id, label: `${b.name}${b.current ? ` ${t.current}` : ""} · ${t.formulasIn(b.count)}` }))}
              onChange={props.onBench}
            />
          )}
        </fieldset>
        {choosable && (
          <fieldset className="picker-group">
            <legend>{props.workbenches.find((w) => w.id === open)?.name ?? "—"}</legend>
            {formulas.length === 0 ? (
              <p className="help">{t.noFormulasHere}</p>
            ) : (
              <Choices
                value={props.formula ?? null}
                options={formulas.map((f) => ({
                  value: f.id,
                  label: (
                    <span className="picker-formula" style={{ paddingLeft: `${f.depth}rem` }}>
                      {f.depth > 0 && <span aria-hidden="true">↳ </span>}
                      {f.name}
                      {props.noteOf?.(f.id) && <span className="muted"> ({props.noteOf(f.id)})</span>}
                    </span>
                  ),
                }))}
                onChange={(id) => props.onFormula?.(id)}
                {...(props.onPick ? { onPick: props.onPick } : {})}
              />
            )}
          </fieldset>
        )}
      </div>
    </div>
  );
}

/**
 * Choosing a formula from Formulación (V3-74, 2026-10-23): every formula of every bench, in the bench
 * picker (audit F-01 L2), opening on this bench.
 */
export function FormulaPickerDialog(props: {
  title: string;
  help?: string;
  workbenches: readonly Workbench[];
  formulas: readonly FormulaRecord[];
  benchId: string;
  choosable: ReadonlySet<string>;
  noteOf: (id: string) => string;
  onDone: (id: string) => void;
  onClose: () => void;
}) {
  const [bench, setBench] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <Modal
      title={props.title}
      error={null}
      wide
      onCancel={props.onClose}
      onAccept={() => {
        if (chosen) props.onDone(chosen);
        props.onClose();
      }}
    >
      {props.help && <p className="help">{props.help}</p>}
      <BenchPicker
        workbenches={props.workbenches}
        formulas={props.formulas}
        benchId={props.benchId}
        choosable={props.choosable}
        noteOf={props.noteOf}
        bench={bench}
        onBench={(id) => {
          setBench(id);
          setChosen(null);
        }}
        formula={chosen}
        onFormula={setChosen}
        onPick={(id) => (props.onDone(id), props.onClose())}
      />
    </Modal>
  );
}

/** Choosing a bench, in the bench picker without formulas (audit F-01 L2): where a formula moves to. */
export function BenchChoiceDialog(props: {
  title: string;
  help?: string;
  workbenches: readonly Workbench[];
  formulas: readonly FormulaRecord[];
  benchId: string;
  onDone: (id: string) => void;
  onClose: () => void;
}) {
  const [bench, setBench] = useState<string | null>(null);
  return (
    <Modal
      title={props.title}
      error={null}
      onCancel={props.onClose}
      onAccept={() => {
        if (bench) props.onDone(bench);
        props.onClose();
      }}
    >
      {props.help && <p className="help">{props.help}</p>}
      <BenchPicker workbenches={props.workbenches} formulas={props.formulas} benchId={props.benchId} choosable={null} bench={bench} onBench={setBench} />
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
