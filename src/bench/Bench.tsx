import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { compose, replay, vectorOf, type Composition, type Line } from "../core/compose";
import { formatDecimal } from "../core/display";
import { checkIfra, type IfraReport } from "../core/ifra";
import { formulaFromJson, formulaToJson } from "../core/io/formula-json";
import type { Change, Formula, FormulaHeader } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { catalog } from "../data/provisional";
import { texts } from "../i18n/es";
import { AddBar, type AddBarHandle } from "./AddBar";
import { Bottle } from "./Bottle";
import { CompositionList } from "./CompositionList";
import { PromptDialog, SaveAsDialog, type SaveAsChoice } from "./Dialogs";
import { GramsPanel, Header } from "./Header";
import { ChangeDetail, HistoryDock } from "./HistoryDock";
import { IfraBox } from "./IfraBox";
import { confirmDialog, download, fileNameFor, inTauri, pickAndRead, pickSavePath, writeFile } from "./io";
import { benchReducer, emptyFormula, initialState, newId } from "./state";

type Add = Extract<Change, { kind: "add" }>;

type Dialog =
  | { kind: "mass"; line: Add }
  | { kind: "reweigh"; onOpen: boolean }
  | { kind: "note" }
  | { kind: "quick" }
  | { kind: "saveAs" };

export interface Opened {
  readonly formula: Formula;
  readonly path: string | null;
}

interface View {
  readonly composition: Composition | null;
  readonly report: IfraReport | null;
  readonly current: ReadonlyMap<string, Line>;
  readonly error: string | null;
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const reopensByWeighing = (formula: Formula) => formula.header.container?.tareUg != null && formula.history.length > 0;

/**
 * The formulation bench, provisional (plan, phase 4): everything the core does,
 * with the layout of §10.1, and no charts until their data exists.
 */
export function Bench(props: { initial: Opened; onExit: () => void }) {
  const [state, dispatch] = useReducer(benchReducer, props.initial, (o) => initialState(o.formula, o.path));
  const [session, setSession] = useState<Material[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(() =>
    reopensByWeighing(props.initial.formula) ? { kind: "reweigh", onOpen: true } : null,
  );
  const [status, setStatus] = useState("");
  const addBar = useRef<AddBarHandle>(null);
  const { formula, frame } = state;
  const dirty = !state.saved && formula.history.length > 0;

  const view: View = useMemo(() => {
    try {
      const upTo = frame ?? undefined;
      return {
        composition: compose(formula, upTo),
        report: checkIfra(formula, catalog.ifra, upTo),
        current: new Map(replay(formula).map((line) => [line.id, line])),
        error: null,
      };
    } catch (e) {
      return { composition: null, report: null, current: new Map(), error: message(e) };
    }
  }, [formula, frame]);

  // What cannot be kept quiet in the composition: materials without IFRA data (§5.5).
  const unchecked = useMemo(() => {
    const keys = new Set<string>();
    for (const part of view.composition?.parts ?? []) {
      const m = part.material;
      if (m.solvent && m.kind === "base") {
        continue;
      }
      const info = m.kind === "provisional" ? undefined : catalog.ifra.materials.get(m.key);
      if (!info || info.status === "unchecked" || (info.pending?.length ?? 0) > 0) {
        keys.add(m.key);
      }
    }
    return keys;
  }, [view.composition]);

  const setHeader = (header: FormulaHeader) => dispatch({ type: "header", header });
  const change = (c: Change) => {
    dispatch({ type: "change", change: c });
    setSelectedId(null);
  };

  const save = async () => {
    if (!inTauri()) {
      download(fileNameFor(formula.header.name), formulaToJson(formula));
      setStatus(texts.menu.downloaded);
      return;
    }
    const path = state.path ?? (await pickSavePath(fileNameFor(formula.header.name)));
    if (!path) {
      return;
    }
    try {
      await writeFile(path, formulaToJson(formula));
      dispatch({ type: "saved", path, formula });
      setStatus("");
    } catch (e) {
      setStatus(`${texts.menu.saveError}: ${message(e)}`);
    }
  };

  // Saving keeps everything, automatically, once the formula has a file (§6).
  useEffect(() => {
    if (!inTauri() || state.path === null || state.saved) {
      return;
    }
    const path = state.path;
    const target = state.formula;
    const timer = setTimeout(() => {
      writeFile(path, formulaToJson(target))
        .then(() => dispatch({ type: "saved", path, formula: target }))
        .catch((e) => setStatus(`${texts.menu.saveError}: ${message(e)}`));
    }, 800);
    return () => clearTimeout(timer);
  }, [state.formula, state.path, state.saved]);

  const saveAs = async (choice: SaveAsChoice) => {
    // The variation takes a copy of the history and goes on alone (§3.2).
    const variation: Formula = {
      header: {
        ...formula.header,
        name: choice.name,
        container: choice.sameVial === false ? { capacityMl: choice.capacityMl, tareUg: choice.tareUg } : formula.header.container,
      },
      history: formula.history,
    };
    if (!inTauri()) {
      download(fileNameFor(choice.name), formulaToJson(variation));
      dispatch({ type: "load", formula: variation, path: null });
      setStatus(texts.menu.downloaded);
      return;
    }
    const path = await pickSavePath(fileNameFor(choice.name));
    if (!path) {
      return;
    }
    try {
      await writeFile(path, formulaToJson(variation));
      if (choice.sameVial === true && state.path !== null && state.path !== path) {
        // Same vial: the original stays as a recipe without a vial, no longer reopened by weighing.
        await writeFile(state.path, formulaToJson({ ...formula, header: { ...formula.header, container: null } }));
      }
      dispatch({ type: "load", formula: variation, path });
      setSelectedId(null);
      setStatus("");
    } catch (e) {
      setStatus(`${texts.menu.saveError}: ${message(e)}`);
    }
  };

  const leave = async (then: () => void) => {
    if (!dirty || (await confirmDialog(texts.menu.discard))) {
      then();
    }
  };

  const openFile = () =>
    leave(async () => {
      const file = await pickAndRead();
      if (!file) {
        return;
      }
      try {
        const opened = formulaFromJson(file.text);
        dispatch({ type: "load", formula: opened, path: file.path });
        setSelectedId(null);
        setStatus("");
        if (reopensByWeighing(opened)) {
          setDialog({ kind: "reweigh", onOpen: true });
        }
      } catch (e) {
        setStatus(`${texts.launcher.openError}: ${message(e)}`);
      }
    });

  const formulaAsMaterial = async () => {
    const file = await pickAndRead();
    if (!file) {
      return;
    }
    try {
      const inner = formulaFromJson(file.text);
      const vector = vectorOf(inner);
      const material: Material = { key: vector.id, kind: "formula", name: inner.header.name || texts.bench.untitled, vector };
      setSession((s) => [...s.filter((m) => m.key !== material.key), material]);
      addBar.current?.select(material);
    } catch (e) {
      setStatus(`${texts.launcher.openError}: ${message(e)}`);
    }
  };

  const createProvisional = (name: string): Material => {
    const material: Material = { key: `prov:${newId()}`, kind: "provisional", name };
    setSession((s) => [...s, material]);
    return material;
  };

  const startReweigh = () => {
    if (formula.header.container?.tareUg == null) {
      setStatus(texts.dialogs.needTare);
      return;
    }
    setDialog({ kind: "reweigh", onOpen: false });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === "s") {
        e.preventDefault();
        void save();
      } else if (!typing && e.ctrlKey && key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "undo" });
      } else if (!typing && e.ctrlKey && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const selectedIndex = formula.history.findIndex((c) => c.id === selectedId);
  const selected = selectedIndex >= 0 ? formula.history[selectedIndex] : null;
  const total = view.composition?.totalUg ?? Ratio.ZERO;
  const workBatch = formula.header.workBatchUg;
  const fill = workBatch ? Number(total.div(Ratio.of(workBatch)).toFixed(4)) : null;
  const statusText =
    status ||
    (state.path === null ? texts.menu.unsaved : state.saved ? texts.menu.saved(state.path) : texts.menu.autosave);
  const tare = formula.header.container?.tareUg ?? null;

  return (
    <div className="bench">
      <aside className="bench-left">
        <button type="button" className="back square" title={texts.bench.back} onClick={() => void leave(props.onExit)}>
          ←
        </button>
        <Bottle name={formula.header.name || texts.bench.untitled} fill={fill} />
        <div className="placeholder">
          <h3>{texts.bench.visualizer}</h3>
          <p className="muted small">{texts.bench.visualizerNote}</p>
        </div>
      </aside>

      <main className="bench-center">
        <div className="top">
          <Header header={formula.header} onChange={setHeader} />
          <GramsPanel header={formula.header} totalUg={total} onChange={setHeader} />
        </div>
        <AddBar
          ref={addBar}
          entries={catalog.entries}
          sessionMaterials={session}
          onAdd={change}
          onQuickMaterial={() => setDialog({ kind: "quick" })}
          onFormulaAsMaterial={() => void formulaAsMaterial()}
          onCreateProvisional={createProvisional}
        />
        {view.error && (
          <p className="error">
            {texts.bench.computeError}: {view.error}
          </p>
        )}
        {selected && (
          <ChangeDetail
            change={selected}
            index={selectedIndex}
            history={formula.history}
            current={view.current}
            onEditMass={(line) => setDialog({ kind: "mass", line })}
            onRemove={(line) => change({ kind: "remove", id: newId(), target: line.id })}
            onFrame={(f) => dispatch({ type: "frame", frame: f })}
            onClose={() => setSelectedId(null)}
          />
        )}
        <div className="placeholder charts">
          <h3>{texts.bench.charts}</h3>
          <p className="muted small">{texts.bench.chartsNote}</p>
        </div>
      </main>

      <aside className="bench-right">
        <nav className="toolbar">
          <button type="button" onClick={() => void save()}>
            {texts.menu.save}
          </button>
          <button type="button" onClick={() => setDialog({ kind: "saveAs" })}>
            {texts.menu.saveAs}
          </button>
          <button type="button" onClick={() => void openFile()}>
            {texts.menu.open}
          </button>
          <button type="button" onClick={() => void leave(() => dispatch({ type: "load", formula: emptyFormula(texts.bench.untitled), path: null }))}>
            {texts.menu.newBench}
          </button>
          <button type="button" onClick={startReweigh}>
            {texts.menu.reweigh}
          </button>
          <button type="button" onClick={() => setDialog({ kind: "note" })}>
            {texts.menu.note}
          </button>
          <button type="button" disabled={formula.history.length === 0} onClick={() => dispatch({ type: "undo" })}>
            {texts.menu.undo}
          </button>
          <button type="button" disabled={state.redo.length === 0} onClick={() => dispatch({ type: "redo" })}>
            {texts.menu.redo}
          </button>
        </nav>
        <p className="status small" title={statusText}>
          {statusText}
        </p>
        <IfraBox report={view.report} empty={!view.composition || view.composition.parts.length === 0} />
        <CompositionList composition={view.composition} unchecked={unchecked} />
      </aside>

      <HistoryDock
        history={formula.history}
        frame={frame}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onFrame={(f) => dispatch({ type: "frame", frame: f })}
      />

      {dialog?.kind === "mass" && (
        <PromptDialog
          title={texts.dialogs.massTitle(dialog.line.material.name)}
          label={texts.dialogs.massLabel}
          initial={formatDecimal(Ratio.of(dialog.line.massUg).div(Ratio.of(1_000)), 3).replace(/,?0+$/, "")}
          submit={(value) => {
            try {
              change({ kind: "set-mass", id: newId(), target: dialog.line.id, massUg: parseMass(value, "mg") });
              return null;
            } catch {
              return texts.addBar.badQuantity;
            }
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "reweigh" && tare !== null && (
        <PromptDialog
          title={texts.dialogs.reweighTitle}
          label={texts.dialogs.grossLabel}
          help={(dialog.onOpen ? `${texts.dialogs.reweighOnOpen} ` : "") + texts.dialogs.reweighHelp}
          submit={(value) => {
            let grossUg: bigint;
            try {
              grossUg = parseMass(value, "g");
            } catch {
              return texts.grams.invalid;
            }
            if (grossUg <= tare) {
              return texts.dialogs.tooLight;
            }
            if (!view.composition || view.composition.totalUg.isZero()) {
              return texts.dialogs.nothingToReweigh;
            }
            change({ kind: "reweigh", id: newId(), grossUg, tareUg: tare });
            return null;
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "note" && (
        <PromptDialog
          title={texts.dialogs.noteTitle}
          label={texts.dialogs.noteLabel}
          submit={(value) => {
            if (value.trim() === "") {
              return texts.dialogs.emptyNote;
            }
            change({ kind: "note", id: newId(), text: value.trim() });
            return null;
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "quick" && (
        <PromptDialog
          title={texts.dialogs.quickTitle}
          label={texts.dialogs.quickLabel}
          submit={(value) => {
            if (value.trim() === "") {
              return texts.dialogs.quickLabel;
            }
            addBar.current?.select(createProvisional(value.trim()));
            return null;
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "saveAs" && (
        <SaveAsDialog
          initialName={formula.header.name}
          hasVial={formula.header.container !== null}
          onDone={(choice) => {
            setDialog(null);
            void saveAs(choice);
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
