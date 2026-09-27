import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { compose, replay, vectorOf, type Composition, type Line } from "../core/compose";
import { formatDecimal } from "../core/display";
import { checkIfra, type IfraReport } from "../core/ifra";
import { formulaFromJson, formulaToJson as toJsonWith } from "../core/io/formula-json";
import type { Change, Formula, FormulaHeader } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { catalog } from "../data/provisional";
import { texts } from "../i18n/es";
import { AddBar, type AddBarHandle } from "./AddBar";
import { BottleFrame } from "./Bottle";
import { PyramidCard, ProjectionCard, Recents, RepartoCard, VisualizerPlaceholder } from "./Charts";
import { CompositionCard } from "./CompositionList";
import { PromptDialog, SaveAsDialog, type SaveAsChoice } from "./Dialogs";
import { GramsCard, IntentionCard, NameCard } from "./Header";
import { ChangeDetail, HistoryDock } from "./HistoryDock";
import { IfraDetail, IfraSummary } from "./IfraBox";
import { confirmDialog, download, fileNameFor, guardClose, inTauri, pickAndRead, pickSavePath, writeFile } from "./io";
import { pushRecent, recentKeys } from "./prefs";
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
  readonly lines: readonly Line[];
  readonly current: ReadonlyMap<string, Line>;
  readonly error: string | null;
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const reopensByWeighing = (formula: Formula) => formula.header.container?.tareUg != null && formula.history.length > 0;
const baseName = (path: string) => path.split(/[\\/]/).pop() ?? path;
/** Every file says with which IFRA amendment it was checked (P44). */
const formulaToJson = (formula: Formula) => toJsonWith(formula, { ifraAmendment: catalog.source.amendment });

/**
 * The formulation bench, provisional (plan, phase 4): everything the core does,
 * with the spaces and proportions of the sketch (boceto 4, P36). The charts
 * without data keep their place until the data comes.
 */
export function Bench(props: { initial: Opened; onExit: () => void }) {
  const [state, dispatch] = useReducer(benchReducer, props.initial, (o) => initialState(o.formula, o.path));
  const [session, setSession] = useState<Material[]>([]);
  const [recent, setRecent] = useState<string[]>(() => recentKeys());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(() =>
    reopensByWeighing(props.initial.formula) ? { kind: "reweigh", onOpen: true } : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ifraOpen, setIfraOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const addBar = useRef<AddBarHandle>(null);
  const { formula, frame } = state;
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const dirty = !state.saved && formula.history.length > 0;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Closing the window never loses a change without asking (§6).
  useEffect(() => guardClose(() => dirtyRef.current, texts.menu.discardOnClose), []);

  const view: View = useMemo(() => {
    try {
      const upTo = frame ?? undefined;
      return {
        composition: compose(formula, upTo),
        report: checkIfra(formula, catalog.ifra, upTo),
        lines: replay(formula, upTo),
        current: new Map(replay(formula).map((line) => [line.id, line])),
        error: null,
      };
    } catch (e) {
      return { composition: null, report: null, lines: [], current: new Map(), error: message(e) };
    }
  }, [formula, frame]);

  const byKey = useMemo(() => new Map(catalog.entries.map((e) => [e.material.key, e.material])), []);
  const icons = useMemo(
    () =>
      new Map(
        catalog.entries.map((e) => [
          e.material.key,
          { text: e.icon, ...(e.iconMark ? { mark: e.iconMark } : {}), ...(e.iconType ? { type: e.iconType } : {}) },
        ]),
      ),
    [],
  );
  // Beside a trade name, the chemical one (P38).
  const chemical = useMemo(
    () => new Map(catalog.entries.filter((e) => e.tradeName).map((e) => [e.material.key, e.chemicalName])),
    [],
  );
  const recentMaterials = recent
    .map((key) => byKey.get(key) ?? session.find((m) => m.key === key))
    .filter((m): m is Material => m !== undefined);

  const setHeader = (header: FormulaHeader) => dispatch({ type: "header", header });
  const change = (c: Change) => {
    setPlaying(false);
    dispatch({ type: "change", change: c });
    setSelectedId(null);
  };
  const addChange = (c: Change) => {
    change(c);
    if (c.kind === "add") {
      setRecent(pushRecent(c.material.key));
    }
  };

  const save = async () => {
    if (!inTauri()) {
      download(fileNameFor(formula.header.name), formulaToJson(formula));
      setError(texts.menu.downloaded);
      return;
    }
    const path = state.path ?? (await pickSavePath(fileNameFor(formula.header.name)));
    if (!path) {
      return;
    }
    try {
      await writeFile(path, formulaToJson(formula));
      dispatch({ type: "saved", path, formula });
      setError(null);
    } catch (e) {
      setError(`${texts.menu.saveError}: ${message(e)}`);
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
        .catch((e) => setError(`${texts.menu.saveError}: ${message(e)}`));
    }, 800);
    return () => clearTimeout(timer);
  }, [state.formula, state.path, state.saved]);

  // The play (§3.4): from nothing, change by change, to the end.
  useEffect(() => {
    if (!playing) {
      return;
    }
    const n = formula.history.length;
    if (frameRef.current === null || frameRef.current >= n) {
      dispatch({ type: "frame", frame: 0 });
    }
    const timer = setInterval(() => {
      const next = (frameRef.current ?? 0) + 1;
      if (next > n) {
        dispatch({ type: "frame", frame: null });
        setPlaying(false);
      } else {
        dispatch({ type: "frame", frame: next });
      }
    }, 450);
    return () => clearInterval(timer);
  }, [playing, formula.history.length]);

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
      setError(texts.menu.downloaded);
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
      setError(null);
    } catch (e) {
      setError(`${texts.menu.saveError}: ${message(e)}`);
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
        setPlaying(false);
        dispatch({ type: "load", formula: opened, path: file.path });
        setSelectedId(null);
        setError(null);
        if (reopensByWeighing(opened)) {
          setDialog({ kind: "reweigh", onOpen: true });
        }
      } catch (e) {
        setError(`${texts.launcher.openError}: ${message(e)}`);
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
      setError(`${texts.launcher.openError}: ${message(e)}`);
    }
  };

  const createProvisional = (name: string): Material => {
    const material: Material = { key: `prov:${newId()}`, kind: "provisional", name };
    setSession((s) => [...s, material]);
    return material;
  };

  const startReweigh = () => {
    if (formula.header.container?.tareUg == null) {
      setError(texts.dialogs.needTare);
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
      } else if (e.key === "Escape") {
        setMenuOpen(false);
        setIfraOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const menuAction = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  const selectedIndex = formula.history.findIndex((c) => c.id === selectedId);
  const selected = selectedIndex >= 0 ? formula.history[selectedIndex] : null;
  const total = view.composition?.totalUg ?? Ratio.ZERO;
  const workBatch = formula.header.workBatchUg;
  const fill = workBatch ? Number(total.div(Ratio.of(workBatch)).toFixed(4)) : null;
  const status =
    error ?? (state.path === null ? texts.bench.unsaved : state.saved ? texts.bench.savedAs(baseName(state.path)) : texts.bench.saving);
  const tare = formula.header.container?.tareUg ?? null;
  const adds = formula.history.slice(0, frame ?? formula.history.length).filter((c): c is Add => c.kind === "add");
  const empty = !view.composition || view.composition.parts.length === 0;

  return (
    <div className="bench">
      <div className="main">
        <div className="top">
          <BottleFrame name={formula.header.name || texts.bench.untitled} fill={fill} onBack={() => void leave(props.onExit)} />
          <div className="top-right">
            <div className="head-row">
              <div className="head-col">
                <NameCard header={formula.header} status={status} statusIsError={error !== null} onChange={setHeader} />
                <IntentionCard header={formula.header} onChange={setHeader} />
              </div>
              <GramsCard header={formula.header} totalUg={total} onChange={setHeader} />
            </div>
            <AddBar
              ref={addBar}
              entries={catalog.entries}
              sessionMaterials={session}
              onAdd={addChange}
              onQuickMaterial={() => setDialog({ kind: "quick" })}
              onFormulaAsMaterial={() => void formulaAsMaterial()}
              onCreateProvisional={createProvisional}
            />
          </div>
        </div>
        <Recents materials={recentMaterials} onPick={(m) => addBar.current?.select(m)} />
        {view.error && (
          <p className="compute-error">
            {texts.bench.computeError}: {view.error}
          </p>
        )}
        <div className="lower">
          <VisualizerPlaceholder />
          <div className="charts">
            <div className="charts-top">
              <PyramidCard />
              <RepartoCard composition={view.composition} />
            </div>
            <ProjectionCard />
          </div>
        </div>
      </div>

      <div className="side">
        <div className="ifra-row">
          <IfraSummary report={view.report} empty={empty} open={ifraOpen} onToggle={() => setIfraOpen(!ifraOpen)} />
          <button type="button" className="tool menu-btn" aria-label={texts.menu.options} title={texts.menu.options} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M3 5h12M3 9h12M3 13h12" />
            </svg>
          </button>
          {menuOpen && (
            <div className="menu-pop options">
              <button type="button" className="menuitem" onClick={menuAction(() => void save())}>
                <span>{texts.menu.save}</span>
                <span className="num key">Ctrl+S</span>
              </button>
              <button type="button" className="menuitem" onClick={menuAction(() => setDialog({ kind: "saveAs" }))}>
                <span>{texts.menu.saveAs}</span>
              </button>
              <button type="button" className="menuitem" onClick={menuAction(() => void openFile())}>
                <span>{texts.menu.open}</span>
              </button>
              <button
                type="button"
                className="menuitem"
                onClick={menuAction(() => void leave(() => dispatch({ type: "load", formula: emptyFormula(texts.bench.untitled), path: null })))}
              >
                <span>{texts.menu.newBench}</span>
              </button>
              <div className="menu-sep" />
              <button type="button" className="menuitem" onClick={menuAction(startReweigh)}>
                <span>{texts.menu.reweigh}</span>
              </button>
              <button type="button" className="menuitem" onClick={menuAction(() => setDialog({ kind: "note" }))}>
                <span>{texts.menu.note}</span>
              </button>
              <div className="menu-sep" />
              <button type="button" className="menuitem" disabled={formula.history.length === 0} onClick={menuAction(() => dispatch({ type: "undo" }))}>
                <span>{texts.menu.undo}</span>
                <span className="num key">Ctrl+Z</span>
              </button>
              <button type="button" className="menuitem" disabled={state.redo.length === 0} onClick={menuAction(() => dispatch({ type: "redo" }))}>
                <span>{texts.menu.redo}</span>
                <span className="num key">Ctrl+Y</span>
              </button>
            </div>
          )}
          {ifraOpen && view.report && !empty && <IfraDetail report={view.report} onClose={() => setIfraOpen(false)} />}
        </div>
        <CompositionCard
          composition={view.composition}
          lines={view.lines}
          adds={adds}
          report={view.report}
          ifra={catalog.ifra}
          chemicalOf={(key) => chemical.get(key)}
        />
      </div>

      <HistoryDock
        history={formula.history}
        frame={frame}
        selectedId={selectedId}
        playing={playing}
        onSelect={setSelectedId}
        onFrame={(f) => dispatch({ type: "frame", frame: f })}
        onTogglePlay={() => setPlaying(!playing)}
        iconOf={(key) => icons.get(key)}
      />

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
