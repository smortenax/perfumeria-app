import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { compose, replay, vectorOf, type Composition, type Line } from "../core/compose";
import { formatDecimal, formatGrams, formatPercent } from "../core/display";
import { checkIfra, type IfraReport } from "../core/ifra";
import { formulaFromJson, formulaToJson as toJsonWith } from "../core/io/formula-json";
import type { Change, Formula, FormulaHeader } from "../core/model/formula";
import { provisionalKey, type Material } from "../core/model/material";
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
import { confirmDialog, download, fileNameFor, guardClose, inTauri, pickAndRead, writeFile } from "./io";
import { libraryDir, placeFormula, readLibrary, rememberedProvisionals } from "./library";
import { nextVersionNumber, versionName } from "./library-groups";
import { pushRecent, recentKeys } from "./prefs";
import { benchReducer, emptyFormula, initialState, newId } from "./state";

type Add = Extract<Change, { kind: "add" }>;

type Dialog =
  | { kind: "mass"; line: Add }
  | { kind: "reweigh"; onOpen: boolean }
  | { kind: "note" }
  | { kind: "quick" }
  | { kind: "saveAs"; versionName: string; next: number };

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
/** A new formula starts on its own: without the version of the one it came from (P44). */
const withoutVersion = (h: FormulaHeader): FormulaHeader => ({
  name: h.name,
  intention: h.intention,
  container: h.container,
  workBatchUg: h.workBatchUg,
  finalBatchUg: h.finalBatchUg,
});

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
  const latest = useRef(state);
  latest.current = state;

  // Where the formula is written, and which formula it is: loading another one starts a
  // new generation, so a write still queued for the old one never lands on the new (P44).
  const pathRef = useRef<string | null>(props.initial.path);
  const generation = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const load = (next: Formula, path: string | null) => {
    generation.current += 1;
    pathRef.current = path;
    setPlaying(false);
    dispatch({ type: "load", formula: next, path });
    setSelectedId(null);
    setError(null);
  };

  /** Runs file work one piece after another, so two writes never cross. */
  const enqueue = <T,>(work: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(work);
    queue.current = run.catch(() => undefined);
    return run;
  };

  /**
   * Writes the formula to its file (§6, P44): a new one in the library the first time,
   * renamed when the formula changes name. False, with the error shown, if it failed.
   */
  const persist = (target: Formula): Promise<boolean> => {
    const gen = generation.current;
    return enqueue(async () => {
      if (gen !== generation.current) {
        return true;
      }
      const path = await placeFormula(target.header.name, pathRef.current);
      pathRef.current = path;
      await writeFile(path, formulaToJson(target));
      if (gen === generation.current) {
        dispatch({ type: "saved", path, formula: target });
        setError(null);
      }
      return true;
    }).catch((e) => {
      setError(`${texts.menu.saveError}: ${message(e)}`);
      return false;
    });
  };

  /** Saves now whatever is pending. A formula with nothing added yet has nothing to save. */
  const flush = (): Promise<boolean> => {
    const now = latest.current;
    if (now.saved || (now.path === null && now.formula.history.length === 0)) {
      return enqueue(async () => true);
    }
    return persist(now.formula);
  };

  // Closing the window saves first, and asks only if that failed (§6, P44). flush reads
  // everything through refs, so the first one serves for the whole bench.
  useEffect(
    () =>
      guardClose(
        () => !latest.current.saved && latest.current.formula.history.length > 0,
        async () => (await flush()) || confirmDialog(texts.menu.discardOnClose),
      ),
    [],
  );

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
  // The family of each material, with its colour (P48).
  const families = useMemo(
    () => new Map(catalog.entries.filter((e) => e.family).map((e) => [e.material.key, e.family!])),
    [],
  );
  const familyOf = (key: string) => families.get(key);
  // Beside a trade name, the chemical one (P38).
  const chemical = useMemo(
    () => new Map(catalog.entries.filter((e) => e.tradeName).map((e) => [e.material.key, e.chemicalName])),
    [],
  );
  // The formulas used as materials in this one stay at hand after reopening it: an accord
  // can be added again by its name, without opening its file (§3.6).
  const known = useMemo(() => {
    const inside = formula.history.flatMap((c) => (c.kind === "add" && c.material.kind === "formula" ? [c.material] : []));
    return [...session, ...inside.filter((m, i) => !session.some((s) => s.key === m.key) && inside.findIndex((o) => o.key === m.key) === i)];
  }, [session, formula.history]);
  const recentMaterials = recent
    .map((key) => byKey.get(key) ?? known.find((m) => m.key === key))
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

  // Ctrl+S saves at once what would be saved in a moment anyway.
  const save = async () => {
    if (!inTauri()) {
      download(fileNameFor(formula.header.name), formulaToJson(formula));
      setError(texts.menu.downloaded);
      return;
    }
    await flush();
  };

  // Saving keeps everything, automatically (§6), in the library from the first change (P44).
  useEffect(() => {
    if (!inTauri() || state.saved || (state.path === null && state.formula.history.length === 0)) {
      return;
    }
    const target = state.formula;
    const timer = setTimeout(() => void persist(target), 800);
    return () => clearTimeout(timer);
    // persist is the same work on every render: what matters is what changed.
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

  // The name and number a new version would take: the next of its family (P44).
  const openSaveAs = async () => {
    const header = latest.current.formula.header;
    const known = header.version?.number ?? 1;
    let next = known + 1;
    if (inTauri() && header.version) {
      try {
        next = nextVersionNumber(await readLibrary(), header.version.family, known);
      } catch {
        // Without the library, the number after this one; the file name never repeats anyway.
      }
    }
    setDialog({ kind: "saveAs", versionName: versionName(header.name || texts.bench.untitled, next), next });
  };

  const saveAs = async (choice: SaveAsChoice, next: number) => {
    const source = latest.current.formula;
    // A new version joins the family of this one, which becomes its v1 if it had none (P44).
    const family = source.header.version?.family ?? newId();
    const from = source.header.version?.number ?? 1;
    const joins = choice.kind === "version" && !source.header.version;
    const base = choice.kind === "version" ? { ...source.header, version: { family, number: next, from } } : withoutVersion(source.header);
    // The variation takes a copy of the history and goes on alone (§3.2).
    const variation: Formula = {
      header: {
        ...base,
        name: choice.name,
        container: choice.sameVial === false ? { capacityMl: choice.capacityMl, tareUg: choice.tareUg } : source.header.container,
      },
      history: source.history,
    };
    if (!inTauri()) {
      download(fileNameFor(choice.name), formulaToJson(variation));
      load(variation, null);
      setError(texts.menu.downloaded);
      return;
    }
    // The original is saved first, as it is; then the variation gets its own file (P44).
    if (!(await flush())) {
      return;
    }
    try {
      const path = await enqueue(async () => {
        const original = pathRef.current;
        if (original !== null && (joins || choice.sameVial === true)) {
          const recipe = latest.current.formula;
          const header: FormulaHeader = {
            ...recipe.header,
            ...(joins ? { version: { family, number: 1, from: null } } : {}),
            // Same vial: the original stays as a recipe without a vial, no longer reopened by weighing.
            ...(choice.sameVial === true ? { container: null } : {}),
          };
          await writeFile(original, formulaToJson({ ...recipe, header }));
        }
        const target = await placeFormula(choice.name, null);
        await writeFile(target, formulaToJson(variation));
        return target;
      });
      load(variation, path);
    } catch (e) {
      setError(`${texts.menu.saveError}: ${message(e)}`);
    }
  };

  // Leaving saves first (P44); only if that fails, it asks before losing anything.
  const leave = async (then: () => void) => {
    const kept = inTauri() ? await flush() : !dirty;
    if (kept || (await confirmDialog(inTauri() ? texts.menu.discardOnFail : texts.menu.discard))) {
      then();
    }
  };

  const openFile = () =>
    leave(async () => {
      const file = await pickAndRead(inTauri() ? await libraryDir() : undefined);
      if (!file) {
        return;
      }
      try {
        const opened = formulaFromJson(file.text);
        load(opened, file.path);
        if (reopensByWeighing(opened)) {
          setDialog({ kind: "reweigh", onOpen: true });
        }
      } catch (e) {
        setError(`${texts.launcher.openError}: ${message(e)}`);
      }
    });

  const formulaAsMaterial = async () => {
    const file = await pickAndRead(inTauri() ? await libraryDir() : undefined);
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

  // A provisional is known by its name (P44): writing it again is the same material.
  const createProvisional = (name: string): Material => {
    const key = provisionalKey(name);
    const material = session.find((m) => m.key === key) ?? { key, kind: "provisional", name };
    setSession((s) => (s.some((m) => m.key === key) ? s : [...s, material]));
    return material;
  };

  // The search offers the provisionals of the whole library, each formula carrying its own (P44).
  useEffect(() => {
    if (!inTauri()) {
      return;
    }
    rememberedProvisionals()
      .then((known) => setSession((s) => [...s, ...known.filter((k) => !s.some((m) => m.key === k.key))]))
      .catch(() => undefined);
  }, []);

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
    error ??
    (state.path === null
      ? inTauri()
        ? texts.bench.savesOnAdd
        : texts.bench.unsaved
      : state.saved
        ? texts.bench.savedAs(baseName(state.path))
        : texts.bench.saving);
  const tare = formula.header.container?.tareUg ?? null;
  const adds = formula.history.slice(0, frame ?? formula.history.length).filter((c): c is Add => c.kind === "add");
  const empty = !view.composition || view.composition.parts.length === 0;
  // What the bottle holds, as % of it, for under the bottle (P49).
  const bottleTotal = view.composition && !view.composition.totalUg.isZero() ? view.composition.totalUg : null;

  return (
    <div className="bench">
      <div className="main">
        <div className="top">
          <BottleFrame
            name={formula.header.name || texts.bench.untitled}
            fill={fill}
            aromatic={bottleTotal ? { name: texts.composition.aromatic, share: formatPercent(view.composition!.aromaticUg.div(bottleTotal), 2) } : null}
            solvents={
              bottleTotal
                ? view.composition!.parts.filter((p) => p.material.solvent).map((p) => ({ name: p.material.name, share: formatPercent(p.massUg.div(bottleTotal), 2) }))
                : []
            }
            onBack={() => void leave(props.onExit)}
          />
          <GramsCard header={formula.header} totalUg={total} onChange={setHeader} />
          <div className="top-right">
            <div className="head-row">
              <NameCard header={formula.header} status={status} statusIsError={error !== null} onChange={setHeader} />
              <IntentionCard header={formula.header} onChange={setHeader} />
            </div>
            <AddBar
              ref={addBar}
              entries={catalog.entries}
              sessionMaterials={known}
              onAdd={addChange}
              onQuickMaterial={() => setDialog({ kind: "quick" })}
              onFormulaAsMaterial={() => void formulaAsMaterial()}
              onCreateProvisional={createProvisional}
            />
            <Recents materials={recentMaterials} onPick={(m) => addBar.current?.select(m)} />
          </div>
        </div>
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
              <RepartoCard composition={view.composition} familyOf={familyOf} />
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
              <button type="button" className="menuitem" onClick={menuAction(() => void openSaveAs())}>
                <span>{texts.menu.saveAs}</span>
              </button>
              <button type="button" className="menuitem" onClick={menuAction(() => void openFile())}>
                <span>{texts.menu.open}</span>
              </button>
              <button
                type="button"
                className="menuitem"
                onClick={menuAction(() => void leave(() => load(emptyFormula(texts.bench.untitled), null)))}
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
          familyOf={familyOf}
          onAgain={(m) => addBar.current?.select(m)}
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
        familyOf={familyOf}
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
          help={
            (dialog.onOpen ? `${texts.dialogs.reweighOnOpen} ` : "") +
            texts.dialogs.reweighHelp +
            (view.composition && !view.composition.totalUg.isZero()
              ? ` ${texts.dialogs.grossRange(formatGrams(Ratio.of(tare), 3), formatGrams(Ratio.of(tare).add(view.composition.totalUg), 3))}`
              : "")
          }
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
            // Reweighing only finds what is left: the bottle cannot weigh more than it held (§3.5).
            // A gross typed in mg, the way the bench weighs, would make it thousands of times heavier.
            const most = Ratio.of(tare).add(view.composition.totalUg);
            if (Ratio.of(grossUg).gt(most)) {
              return texts.dialogs.tooHeavy(formatGrams(most, 3));
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
          versionName={dialog.versionName}
          hasVial={formula.header.container !== null}
          onDone={(choice) => {
            setDialog(null);
            void saveAs(choice, dialog.next);
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
