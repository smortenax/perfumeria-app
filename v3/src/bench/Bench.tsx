import { useEffect, useMemo, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { compose, replay, type Composition, type Line } from "../core/compose";
import { formatDecimal, formatGrams, formatPercent } from "../core/display";
import { checkIfra, type IfraBase, type IfraReport } from "../core/ifra";
import { formulaToJson as toJsonWith } from "../core/io/formula-json";
import type { Change, Formula, FormulaHeader } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { addEvent, copyFormula, freezeFormula, type FormulaRecord, loadFormula, loadFormulas, loadFrozen, updateFormula, usableFrozen } from "../db/formulas";
import type { LocalDatabase } from "../db/local/database";
import { createMaterial } from "../db/materials";
import type { GlossaryData } from "../glossary/useGlossary";
import { casForm } from "./data/catalog";
import { texts } from "./texts";
import { AddBar, type AddBarHandle } from "./AddBar";
import { BottleFrame } from "./Bottle";
import { ProjectionCard, RepartoCard, VisualizerPlaceholder } from "./Charts";
import { ifraOfLines } from "./composition-ifra";
import { CompositionCard } from "./CompositionList";
import { PromptDialog, SaveAsDialog, type SaveAsChoice } from "./Dialogs";
import { GramsCard, IntentionCard, NameCard } from "./Header";
import { ChangeDetail, HistoryDock } from "./HistoryDock";
import { IfraPanel, IfraSummary } from "./IfraBox";
import { assumptionsOf } from "./assumptions";
import { specificationKeys } from "./ifra-explain";
import { download, fileNameFor } from "./io";
import { draftWarnings, MaterialCard } from "./MaterialCard";
import { eventOf } from "./events";
import { undoOf } from "./undo";
import { bandOf, ifraOfMaterial, pourKey, previewPour, type Pour } from "./usage-bar";
import { repositoryOfV3, v3IdOf } from "./v3-repository";
import "./bench.css";

type Add = Extract<Change, { kind: "add" }>;

type Dialog =
  | { kind: "mass"; line: Add }
  | { kind: "reweigh"; onOpen: boolean }
  | { kind: "note" }
  | { kind: "quick" }
  | { kind: "saveAs" }
  | { kind: "freeze" };

interface View {
  readonly composition: Composition | null;
  readonly report: IfraReport | null;
  readonly lines: readonly Line[];
  readonly current: ReadonlyMap<string, Line>;
  readonly error: string | null;
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const reopensByWeighing = (formula: Formula) => formula.header.container?.tareUg != null && formula.history.length > 0;
const newId = (): string => crypto.randomUUID();

interface BenchProps {
  readonly data: GlossaryData;
  readonly local: LocalDatabase;
  readonly formulaId: string;
  readonly onExit: () => void;
  readonly onOpen: (id: string) => void;
}

/**
 * The formulation bench, ported from the v2 (V3-52; plan 8.2): the same screen, with the formula
 * in the v3's copy. Every action is an event, written at once and synced when there is network
 * (V3-9): there is nothing to save. Undoing adds the opposite event (undo.ts). The header is the
 * formula's record. A provisional made in the bar is a material of yours (plan 8.3).
 */
export function Bench(props: BenchProps) {
  const { data, local, formulaId } = props;
  const repository = useMemo(() => repositoryOfV3(data), [data]);
  // The formula, read from the copy, again whenever the data changes (an event, a sync).
  const [loaded, setLoaded] = useState<{ formula: Formula; record: FormulaRecord; frozen: readonly Material[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([loadFormula(local.db, data.catalog, local.userId, formulaId), loadFormulas(local.db, local.userId)])
      .then(async ([formula, records]) => {
        const record = records.find((r) => r.id === formulaId);
        if (!record) throw new Error("not one of your formulas");
        const { materials } = await loadFrozen(local.db, data.catalog, local.userId, usableFrozen(data.catalog, records, local.userId, formulaId));
        if (live) setLoaded({ formula, record, frozen: materials });
      })
      .catch((e: unknown) => {
        console.error(e);
        if (live) setLoadError(message(e));
      });
    return () => {
      live = false;
    };
  }, [data, formulaId, local]);

  if (!loaded) {
    return (
      <div className="bench-root">
        <p className="compute-error">{loadError ?? texts.bench.loading}</p>
      </div>
    );
  }
  return (
    <div className="bench-root">
      <BenchScreen key={formulaId} {...props} formula={loaded.formula} record={loaded.record} frozen={loaded.frozen} repository={repository} />
    </div>
  );
}

function BenchScreen(props: BenchProps & { readonly formula: Formula; readonly record: FormulaRecord; readonly frozen: readonly Material[]; readonly repository: ReturnType<typeof repositoryOfV3> }) {
  const { formula, repository, local, formulaId } = props;
  const owner = local.userId;
  const ifra = props.data.ifra;
  /** Exported as the v2's file: a copy outside the app (there is nothing to save). */
  const formulaToJson = (f: Formula) => toJsonWith(f, { ifraAmendment: repository.source.amendment });
  const [session, setSession] = useState<Material[]>([]);
  // The material the card under the add bar shows: the last one chosen, kept after adding it (P57).
  const [cardMaterial, setCardMaterial] = useState<Material | null>(null);
  // What the add bar is writing, read (P57): IFRA is checked on it while it is typed; nothing is added.
  const [draft, setDraft] = useState<Pour | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(() => (reopensByWeighing(formula) ? { kind: "reweigh", onOpen: true } : null));
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState<number | null>(null);
  const [pending, setPending] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const addBar = useRef<AddBarHandle>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;

  /** Writes one after another, so that an event never overtakes the one before it (or the material it uses). */
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const write = (work: () => Promise<unknown>) => {
    setPending((n) => n + 1);
    const run = queue.current.then(work);
    queue.current = run
      .then(() => setError(null))
      .catch((e: unknown) => setError(`${texts.bench.writeError}: ${message(e)}`))
      .finally(() => setPending((n) => n - 1));
  };

  const view: View = useMemo(() => {
    try {
      const upTo = frame ?? undefined;
      return {
        composition: compose(formula, upTo),
        report: checkIfra(formula, ifra, upTo),
        lines: replay(formula, upTo),
        current: new Map(replay(formula).map((line) => [line.id, line])),
        error: null,
      };
    } catch (e) {
      return { composition: null, report: null, lines: [], current: new Map(), error: message(e) };
    }
  }, [formula, frame, ifra]);

  // The base of IFRA that the panel's switch chooses (P58, E4).
  const [chosenBase, setChosenBase] = useState<IfraBase | null>(null);
  const ifraBase = view.report ? (view.report.readings.some((r) => r.base === chosenBase) ? (chosenBase as IfraBase) : view.report.base) : undefined;

  const lineIfra = useMemo(() => {
    if (!view.composition || !view.report) return undefined;
    try {
      return ifraOfLines(formula, ifra, view.report, view.composition, ifraBase, frame ?? undefined);
    } catch {
      return undefined;
    }
  }, [formula, frame, view, ifraBase, ifra]);

  const cardIfra = useMemo(() => {
    if (!cardMaterial || !view.composition || !view.report) return null;
    try {
      return ifraOfMaterial(formula, ifra, view.composition, view.report, cardMaterial, frame ?? undefined, ifraBase);
    } catch {
      return null;
    }
  }, [formula, frame, view, cardMaterial, ifraBase, ifra]);

  const draftKey = pourKey(draft);
  const preview = useMemo(() => {
    if (!draft || !view.report || frame !== null) return null;
    try {
      return previewPour(formula, ifra, view.report, draft, ifraBase);
    } catch {
      return null;
    }
    // The key stands for the draft; the formula and the report for the rest.
  }, [draftKey, formula, view, frame, ifraBase, ifra]);
  const warning = preview ? draftWarnings(preview).join(". ") || null : null;

  const byKey = useMemo(() => new Map(repository.entries.map((e) => [e.material.key, e.material])), [repository]);
  const specifications = useMemo(() => specificationKeys(repository.details, (key) => repository.get(key)?.material.name), [repository]);
  const assumptions = useMemo(() => assumptionsOf(formula, (key) => repository.get(key)), [formula, repository]);
  const entryByKey = useMemo(() => new Map(repository.entries.map((e) => [e.material.key, e])), [repository]);
  const icons = useMemo(
    () => new Map(repository.entries.map((e) => [e.material.key, { text: e.icon, ...(e.iconMark ? { mark: e.iconMark } : {}), ...(e.iconType ? { type: e.iconType } : {}) }])),
    [repository],
  );
  const families = useMemo(() => new Map(repository.entries.filter((e) => e.family).map((e) => [e.material.key, e.family!])), [repository]);
  const familyOf = (key: string) => families.get(key);
  const chemical = useMemo(() => new Map(repository.entries.filter((e) => e.tradeName).map((e) => [e.material.key, e.chemicalName])), [repository]);
  const known = useMemo(() => [...props.frozen, ...session], [props.frozen, session]);

  /** The header is the formula's record: its changes are written to it. */
  const setHeader = (header: FormulaHeader) =>
    write(() =>
      updateFormula(local.db, owner, formulaId, {
        name: header.name,
        intention: header.intention,
        containerCapacityMl: header.container?.capacityMl ?? null,
        containerTareUg: header.container?.tareUg ?? null,
        workBatchUg: header.workBatchUg,
        finalBatchUg: header.finalBatchUg,
      }),
    );
  /** Every change is an event, written at once (plan 8.2). */
  const change = (c: Change) => {
    setNotice(null);
    setPlaying(false);
    setFrame(null);
    setSelectedId(null);
    redoable.current = [];
    write(() => addEvent(local.db, owner, formulaId, eventOf(c, v3IdOf(props.data))));
  };
  /** Undo adds the opposite event; what has none is said (undo.ts). */
  const undo = () => {
    const u = undoOf(formula);
    if ("event" in u) {
      setFrame(null);
      write(async () => {
        redoable.current.push(await addEvent(local.db, owner, formulaId, u.event));
      });
    } else setError(texts.bench.cannotUndo[u.refused]);
  };
  /**
   * Redo: a history is only added to, so redoing is undoing an undo. It is offered while the last
   * change is an undo made in this session; after redoing, the undo before it is no longer the last
   * change, so only the last undo can be redone. Any other change ends it.
   */
  const redoable = useRef<string[]>([]);
  const lastId = formula.history[formula.history.length - 1]?.id;
  const canRedo = redoable.current.length > 0 && lastId === redoable.current[redoable.current.length - 1];
  const redo = () => {
    if (!canRedo) return;
    const u = undoOf(formula);
    if (!("event" in u)) return setError(texts.bench.cannotUndo[u.refused]);
    setFrame(null);
    redoable.current = [];
    write(() => addEvent(local.db, owner, formulaId, u.event));
  };

  const exportJson = () => download(fileNameFor(formula.header.name), formulaToJson(formula));

  // The play (§3.4): from nothing, change by change, to the end.
  useEffect(() => {
    if (!playing) return;
    const n = formula.history.length;
    if (frameRef.current === null || frameRef.current >= n) setFrame(0);
    const timer = setInterval(() => {
      const next = (frameRef.current ?? 0) + 1;
      if (next > n) {
        setFrame(null);
        setPlaying(false);
      } else setFrame(next);
    }, 450);
    return () => clearInterval(timer);
  }, [playing, formula.history.length]);

  /** A version (with this one as its mother) or a new formula of its own, in the same workbench, with a copy of the history (P44). */
  const saveAs = (choice: SaveAsChoice) =>
    write(async () => {
      const id = await copyFormula(local.db, owner, formulaId, {
        name: choice.name,
        asVersion: choice.kind === "version",
        ...(choice.sameVial === false ? { containerCapacityMl: choice.capacityMl, containerTareUg: choice.tareUg } : {}),
      });
      props.onOpen(id);
    });

  // A provisional is known by its name (P44): written in the bar, it is a material of yours at once (plan 8.3).
  const createProvisional = (name: string): Material => {
    const fold = (t: string) => t.trim().toLowerCase();
    const existing = [...props.data.catalog.materials.values()].find((m) => m.ownerId !== null && m.kind === "provisional" && fold(m.name) === fold(name));
    if (existing) return { key: existing.id, kind: "provisional", name: existing.name };
    const before = session.find((m) => m.kind === "provisional" && fold(m.name) === fold(name));
    if (before) return before;
    const material: Material = { key: newId(), kind: "provisional", name: name.trim() };
    setSession((s) => [...s, material]);
    write(() => createMaterial(local.db, owner, { id: material.key, name: name.trim(), kind: "provisional" }));
    return material;
  };

  // A formula as a material (plan 8.5): frozen as it is, or as it was at the step the history shows.
  const frozenUpTo = frame !== null && frame > 0 ? formula.history[frame - 1] : null;
  const freeze = (name: string) =>
    write(async () => {
      await freezeFormula(local.db, owner, formulaId, { name, ...(frozenUpTo ? { eventId: frozenUpTo.id } : {}) });
      setNotice(texts.bench.frozen(name));
    });
  // Marked «acorde», it is used in every bench (V3-19); one with nothing frozen yet is frozen as it is.
  const accord = props.record.markers.includes("accord");
  const toggleAccord = () =>
    write(async () => {
      const markers = accord ? props.record.markers.filter((m) => m !== "accord") : [...props.record.markers, "accord" as const];
      await updateFormula(local.db, owner, formulaId, { markers });
      const hasFrozen = [...props.data.catalog.materials.values()].some((m) => m.kind === "frozen" && m.source?.formulaId === formulaId);
      if (!accord && !hasFrozen && (view.composition?.parts.length ?? 0) > 0) await freezeFormula(local.db, owner, formulaId, { name: formula.header.name });
      setNotice(accord ? texts.bench.unmarkedAccord : texts.bench.markedAccord);
    });

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
      if (!typing && e.ctrlKey && key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (!typing && e.ctrlKey && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (e.key === "Escape") {
        setMenuOpen(false);
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
  const status = error ?? (pending > 0 ? texts.bench.saving : (notice ?? texts.bench.savedLive));
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
            onBack={props.onExit}
          />
          <GramsCard header={formula.header} totalUg={total} onChange={setHeader} />
          <div className="top-right">
            <div className="head-row">
              <NameCard header={formula.header} status={status} statusIsError={error !== null} onChange={setHeader} />
              <IntentionCard header={formula.header} onChange={setHeader} />
            </div>
            <AddBar
              ref={addBar}
              entries={repository.entries}
              sessionMaterials={known}
              have={props.data.catalog.have}
              onAdd={change}
              onSelect={setCardMaterial}
              onDraft={setDraft}
              warning={warning}
              onQuickMaterial={() => setDialog({ kind: "quick" })}
              onCreateProvisional={createProvisional}
            />
            <MaterialCard
              material={cardMaterial}
              entry={cardMaterial ? entryByKey.get(cardMaterial.key) : undefined}
              composition={view.composition}
              ifra={cardIfra}
              band={bandOf(cardMaterial ? entryByKey.get(cardMaterial.key)?.usage : undefined)}
              draft={preview}
              data={ifra}
            />
          </div>
        </div>
        {view.error && (
          <p className="compute-error">
            {texts.bench.computeError}: {view.error}
          </p>
        )}
        {/* Lower area, left to right (P57): the visualizer; the share of the matter over the projection; the IFRA panel. */}
        <div className="lower">
          <VisualizerPlaceholder />
          <div className="charts">
            <RepartoCard composition={view.composition} familyOf={familyOf} />
            <ProjectionCard />
          </div>
          <IfraPanel report={view.report} empty={empty} {...(ifraBase ? { base: ifraBase } : {})} onBase={setChosenBase} specifications={specifications} assumptions={assumptions} />
        </div>
      </div>

      <div className="side">
        <div className="ifra-row">
          <IfraSummary report={view.report} empty={empty} {...(ifraBase ? { base: ifraBase } : {})} />
          <button type="button" className="tool menu-btn" aria-label={texts.menu.options} title={texts.menu.options} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M3 5h12M3 9h12M3 13h12" />
            </svg>
          </button>
          {menuOpen && (
            <div className="menu-pop options">
              <button type="button" className="menuitem" onClick={menuAction(() => setDialog({ kind: "saveAs" }))}>
                <span>{texts.menu.saveAs}</span>
              </button>
              <button type="button" className="menuitem" disabled={empty} onClick={menuAction(() => setDialog({ kind: "freeze" }))}>
                <span>{texts.menu.freeze}</span>
              </button>
              <button type="button" className="menuitem" onClick={menuAction(toggleAccord)}>
                <span>{accord ? texts.menu.unmarkAccord : texts.menu.markAccord}</span>
              </button>
              <button type="button" className="menuitem" onClick={menuAction(exportJson)}>
                <span>{texts.bench.exportJson}</span>
              </button>
              <div className="menu-sep" />
              <button type="button" className="menuitem" onClick={menuAction(startReweigh)}>
                <span>{texts.menu.reweigh}</span>
              </button>
              <button type="button" className="menuitem" onClick={menuAction(() => setDialog({ kind: "note" }))}>
                <span>{texts.menu.note}</span>
              </button>
              <div className="menu-sep" />
              <button type="button" className="menuitem" disabled={formula.history.length === 0} onClick={menuAction(undo)}>
                <span>{texts.menu.undo}</span>
                <span className="num key">Ctrl+Z</span>
              </button>
              <button type="button" className="menuitem" disabled={!canRedo} onClick={menuAction(redo)}>
                <span>{texts.menu.redo}</span>
                <span className="num key">Ctrl+Y</span>
              </button>
            </div>
          )}
        </div>
        <CompositionCard
          composition={view.composition}
          lines={view.lines}
          adds={adds}
          report={view.report}
          ifra={ifra}
          {...(lineIfra ? { lineIfra } : {})}
          {...(ifraBase ? { ifraBase } : {})}
          iconOf={(key) => icons.get(key)}
          chemicalOf={(key) => chemical.get(key)}
          glossaryNameOf={(key) => byKey.get(key)?.name}
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
        onFrame={setFrame}
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
          onFrame={setFrame}
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
            // A CAS is not a name (P56): the search finds it if the glossary has it.
            if (/^\s*\d{2,7}-\d{2}-\d{1,2}\s*$/.test(value)) {
              const cas = casForm(value);
              if (!cas) {
                return texts.addBar.casInvalid(value.trim());
              }
              return repository.entries.some((e) => e.cas === cas) ? texts.addBar.casKnown(cas) : texts.addBar.casMissing(cas);
            }
            addBar.current?.select(createProvisional(value.trim()));
            return null;
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "freeze" && (
        <PromptDialog
          title={texts.dialogs.freezeTitle}
          label={texts.dialogs.freezeLabel}
          initial={formula.header.name}
          help={texts.dialogs.freezeHelp(frozenUpTo ? String(frame) : null)}
          submit={(value) => {
            if (value.trim() === "") return texts.dialogs.freezeLabel;
            freeze(value.trim());
            return null;
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "saveAs" && (
        <SaveAsDialog
          initialName={formula.header.name}
          versionName={`${formula.header.name} v2`}
          hasVial={formula.header.container !== null}
          onDone={(choice) => {
            setDialog(null);
            saveAs(choice);
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
