import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import { compose, replay, type Composition, type Line } from "../core/compose";
import { formatDecimal, formatPercent } from "../core/display";
import { checkIfra, type IfraBase, type IfraReport } from "../core/ifra";
import { formulaToJson as toJsonWith } from "../core/io/formula-json";
import type { Change, Formula, FormulaHeader } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { addEvent, copyFormula, deleteFormula, freezeFormula, FormulaInUse, type FormulaMarker, type FormulaRecord, loadFormula, loadFormulas, loadFrozen, moveFormula, renameWorkbench, updateFormula, usableFrozen, usesOfFormula } from "../db/formulas";
import type { LocalDatabase } from "../db/local/database";
import { createMaterial } from "../db/materials";
import type { GlossaryData } from "../glossary/useGlossary";
import { casForm } from "./data/catalog";
import { Toast } from "../Toast";
import { texts } from "./texts";
import { AddBar, type AddBarHandle } from "./AddBar";
import { BottleFrame } from "./Bottle";
import { OdourMapPlaceholder, ProjectionCard, RepartoCard } from "./Charts";
import { ifraOfLines } from "./composition-ifra";
import { CompositionCard } from "./CompositionList";
import { ChoiceDialog, ConfirmDialog, PromptDialog, ReweighDialog, SaveAsDialog, type SaveAsChoice, UseFormulaDialog } from "./Dialogs";
import { dilutionText } from "./format";
import { ownConcentration, recipe } from "./use-formula";
import { GramsCard, IntentionCard, NameCard, NotesCard } from "./Header";
import { familyShares } from "../families/bar";
import { FamilyBar } from "../families/FamilyBar";
import { ChangeDetail, HistoryDock } from "./HistoryDock";
import { IfraPanel, IfraSummary } from "./IfraBox";
import { assumptionsOf } from "./assumptions";
import { specificationKeys } from "./ifra-explain";
import { download, fileNameFor } from "./io";
import { draftWarnings, MaterialCard } from "./MaterialCard";
import { bottlesFor } from "./bottles";
import { eventOf, headerChanges } from "./events";
import { undoOf } from "./undo";
import { bandOf, ifraOfMaterial, pourKey, previewPour, type Pour } from "./usage-bar";
import { repositoryOfV3, v3IdOf } from "./v3-repository";
import { orbLookOf, orbScalesOf, seedOf } from "../glossary/orb/fromCatalog";
import { MaterialOrb } from "../glossary/orb/MaterialOrb";
import { DilutionPopup } from "../dilution/DilutionPopup";
import { formulaCsv, formulaFileName } from "../export/formula";
import { PrintFormula } from "../export/PrintFormula";
import { addToShopping, missingOf, removeFromShopping } from "../db/shopping";
import { texts as appTexts } from "../i18n/en";
import "./bench.css";

type Add = Extract<Change, { kind: "add" }>;

type Dialog =
  | { kind: "mass"; line: Add }
  | { kind: "reweigh" }
  | { kind: "useFormula" }
  | { kind: "note" }
  | { kind: "quick" }
  | { kind: "formulaAsMaterial" }
  | { kind: "saveAs" }
  | { kind: "freeze" }
  | { kind: "move" }
  | { kind: "role" }
  | { kind: "renameBench" }
  | { kind: "delete" };

interface View {
  readonly composition: Composition | null;
  readonly report: IfraReport | null;
  readonly lines: readonly Line[];
  readonly current: ReadonlyMap<string, Line>;
  readonly error: string | null;
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const newId = (): string => crypto.randomUUID();

/** Where this formula is used as a material (plan 8.1b). */
type Uses = Awaited<ReturnType<typeof usesOfFormula>>;

interface BenchProps {
  readonly data: GlossaryData;
  readonly local: LocalDatabase;
  readonly formulaId: string;
  readonly onExit: () => void;
  readonly onOpen: (id: string) => void;
  /** Whether it is the screen in front: kept open behind, its keys do nothing. */
  readonly active?: boolean;
  /** A material's sheet, in Materials. */
  readonly onOpenMaterial?: (id: string) => void;
}

/**
 * The formulation bench, ported from the v2 (V3-52; plan 8.2): the same screen, with the formula
 * in the v3's copy. Every action is an event, written at once and synced when there is network
 * (V3-9): there is nothing to save. Undoing adds the opposite event (undo.ts). The header is the
 * formula's record. A provisional made in the bar is a material of yours (plan 8.3).
 */
export function Bench(props: BenchProps) {
  const { data, local, formulaId } = props;
  // The bar's catalog, built again only when the catalog or IFRA change, not with every edit of a formula.
  const repository = useMemo(() => repositoryOfV3(data), [data.catalog, data.ifra, data.ifraStates]); // eslint-disable-line react-hooks/exhaustive-deps
  // Its history is watched here (useGlossary does not read it): a pour, a sync, and the formula is read again.
  const [tick, setTick] = useState(0);
  useEffect(
    () => local.powerSync.onChangeWithCallback({ onChange: () => setTick((t) => t + 1) }, { tables: ["formula_events", "formula_event_diluents"], throttleMs: 150 }),
    [local],
  );
  // The formula, read from the copy, again whenever its data changes (an event, its header, a sync).
  const [loaded, setLoaded] = useState<{ formula: Formula; record: FormulaRecord; frozen: readonly Material[]; uses: Uses } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([loadFormula(local.db, data.catalog, local.userId, formulaId), loadFormulas(local.db, local.userId)])
      .then(async ([formula, records]) => {
        const record = records.find((r) => r.id === formulaId);
        if (!record) throw new Error("not one of your formulas");
        const { materials } = await loadFrozen(local.db, data.catalog, local.userId, usableFrozen(data.catalog, records, local.userId, formulaId));
        const uses = await usesOfFormula(local.db, data.catalog, local.userId, formulaId);
        if (live) setLoaded({ formula, record, frozen: materials, uses });
      })
      .catch((e: unknown) => {
        console.error(e);
        if (live) setLoadError(message(e));
      });
    return () => {
      live = false;
    };
  }, [data, formulaId, local, tick]);

  if (!loaded) {
    return (
      <div className="bench-root">
        <p className="compute-error">{loadError ?? texts.bench.loading}</p>
      </div>
    );
  }
  return (
    <div className="bench-root">
      <BenchScreen key={formulaId} {...props} formula={loaded.formula} record={loaded.record} frozen={loaded.frozen} uses={loaded.uses} repository={repository} />
    </div>
  );
}

function BenchScreen(props: BenchProps & { readonly formula: Formula; readonly record: FormulaRecord; readonly frozen: readonly Material[]; readonly uses: Uses; readonly repository: ReturnType<typeof repositoryOfV3> }) {
  const { formula, repository, local, formulaId } = props;
  const owner = local.userId;
  const ifra = props.data.ifra;
  /** Exported as the v2's file: a copy outside the app (there is nothing to save). */
  const formulaToJson = (f: Formula) => toJsonWith(f, { ifraAmendment: repository.source.amendment });
  const [session, setSession] = useState<Material[]>([]);
  /**
   * The formulas that can be poured into this one (V3-19, 2026-10-19): those of its workbench and the
   * accords of any, not itself; each with its place and, when it is kept as a material already, that
   * material (the newest). The others are kept on choosing them.
   */
  const pourable = useMemo(() => {
    const benchName = new Map(props.data.workbenches.map((w) => [w.id, w.name]));
    const frozenOf = new Map<string, Material>();
    for (const m of props.frozen) {
      const source = props.data.catalog.materials.get(m.key)?.source?.formulaId;
      if (source) frozenOf.set(source, m);
    }
    return props.data.formulas
      .filter((f) => f.id !== formulaId && (f.workbenchId === props.record.workbenchId || f.markers.includes("accord")))
      .map((f) => ({ id: f.id, name: f.name, place: benchName.get(f.workbenchId) ?? "", material: frozenOf.get(f.id) ?? null }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [props.data, props.frozen, props.record.workbenchId, formulaId]);
  /** Where each formula kept as a material comes from: its workbench. */
  const placeOfFrozen = useMemo(() => {
    const benchName = new Map(props.data.workbenches.map((w) => [w.id, w.name]));
    const benchOf = new Map(props.data.formulas.map((f) => [f.id, benchName.get(f.workbenchId) ?? ""]));
    return new Map(props.frozen.map((m) => [m.key, benchOf.get(props.data.catalog.materials.get(m.key)?.source?.formulaId ?? "") ?? ""]));
  }, [props.data, props.frozen]);
  /** A formula kept as a material just now, to choose in the bar as soon as it is read back. */
  const [toChoose, setToChoose] = useState<string | null>(null);
  useEffect(() => {
    if (!toChoose) return;
    const m = props.frozen.find((x) => x.key === toChoose);
    if (m) {
      addBar.current?.select(m);
      setToChoose(null);
    }
  }, [toChoose, props.frozen]);
  // The material the card under the add bar shows: the last one chosen, kept after adding it (P57).
  const [cardMaterial, setCardMaterial] = useState<Material | null>(null);
  // What the add bar is writing, read (P57): IFRA is checked on it while it is typed; nothing is added.
  const [draft, setDraft] = useState<Pour | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Reopening no longer asks to weigh (V3-57): «Repesar…» is in the menu, for when you used some.
  const [dialog, setDialog] = useState<Dialog | null>(null);
  // «New dilution» from the add bar's «+» (V3-79): a pop-up over the bench, of this material.
  const [bottleFor, setBottleFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState<number | null>(null);
  const [pending, setPending] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  // Using the recipe writes down what you do not have on the shopping list, and says so with Undo (V3-79).
  const [shoppingNote, setShoppingNote] = useState<{ text: string; ids: string[] } | null>(null);
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
  // Each material as its orb, as in Materials and Dilutions (V3-73); a material outside the catalogue keeps its icon.
  const scales = useMemo(() => orbScalesOf(props.data.catalog), [props.data]);
  const orbOf = (size: number) => (key: string) => {
    const m = props.data.catalog.materials.get(key);
    return m ? <MaterialOrb look={orbLookOf(props.data.catalog, m, scales)} size={size} seed={seedOf(m.id)} /> : undefined;
  };
  const familyOf = (key: string) => families.get(key);
  // Its tier, or that of the common material it is based on (V3-5), for the list by notes (F3).
  const tierOf = (key: string) => {
    const m = props.data.catalog.materials.get(key);
    return m?.tier ?? (m?.basedOnId ? props.data.catalog.materials.get(m.basedOnId)?.tier : null) ?? null;
  };
  const chemical = useMemo(() => new Map(repository.entries.filter((e) => e.tradeName).map((e) => [e.material.key, e.chemicalName])), [repository]);
  const known = useMemo(() => [...props.frozen, ...session], [props.frozen, session]);

  /** The header is the formula's record: its changes are written to it. */
  // Only what changed is written: two edits in a row, before the copy brings back the first, would
  // otherwise write the whole header as it was and undo each other (seen in the test phase).
  // What is being typed in the name and the intention (the test phase: written on every key, the
  // field jumped and letters were lost). It is on screen at once and written when typing stops for
  // a moment, when the field is left or when the workbench is; an empty name is never written.
  const [typed, setTyped] = useState<{ readonly name?: string; readonly intention?: string }>({});
  const typedRef = useRef(typed);
  typedRef.current = typed;
  const savedRef = useRef(formula.header);
  savedRef.current = formula.header;
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownHeader: FormulaHeader = { ...formula.header, ...typed };
  const flushTyped = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = null;
    const t = typedRef.current;
    const changes: { name?: string; intention?: string } = {};
    if (t.name !== undefined && t.name.trim() !== "" && t.name !== savedRef.current.name) changes.name = t.name;
    if (t.intention !== undefined && t.intention !== savedRef.current.intention) changes.intention = t.intention;
    if (Object.keys(changes).length > 0) write(() => updateFormula(local.db, owner, formulaId, changes));
  };
  const typeHeader = (header: FormulaHeader) => {
    setTyped((t) => ({
      ...t,
      ...(header.name !== shownHeader.name ? { name: header.name } : {}),
      ...(header.intention !== shownHeader.intention ? { intention: header.intention } : {}),
    }));
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(flushTyped, 2000);
  };
  const doneTyping = () => {
    flushTyped();
    // Left empty, the name goes back to the one written.
    if (typedRef.current.name !== undefined && typedRef.current.name.trim() === "") setTyped(({ name: _, ...rest }) => rest);
  };
  // Once the copy holds what was typed, the typed copy goes; while typing on, it stays.
  useEffect(() => {
    setTyped((t) => {
      const keepName = t.name !== undefined && t.name !== formula.header.name;
      const keepIntention = t.intention !== undefined && t.intention !== formula.header.intention;
      if (keepName === (t.name !== undefined) && keepIntention === (t.intention !== undefined)) return t;
      return { ...(keepName ? { name: t.name } : {}), ...(keepIntention ? { intention: t.intention } : {}) };
    });
  }, [formula.header.name, formula.header.intention]);
  // Hidden or closed, what was typed is written.
  useEffect(() => {
    if (props.active === false) flushTyped();
  }, [props.active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => flushTyped(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const setHeader = (header: FormulaHeader) => {
    const changes = headerChanges(formula.header, header);
    if (Object.keys(changes).length > 0) write(() => updateFormula(local.db, owner, formulaId, changes));
  };
  /** Every change is an event, written at once (plan 8.2). */
  const change = (c: Change, dilutionId?: string | null, eventId?: string) => {
    setNotice(null);
    setRemoved(null);
    setPlaying(false);
    setFrame(null);
    setSelectedId(null);
    redoable.current = [];
    // A pour that is exactly one of your bottles says which (V3-67).
    write(() => addEvent(local.db, owner, formulaId, { ...eventOf(c, v3IdOf(props.data)), ...(dilutionId && c.kind === "add" ? { dilutionId } : {}) }, eventId));
  };
  /**
   * Taking a line away says so, with Undo (vault pass 2026-10-24, F-03). The toast lasts while that
   * removal is the last change: Undo then takes back exactly it, and any other change (or Ctrl+Z) ends it.
   */
  const [removed, setRemoved] = useState<{ eventId: string; text: string } | null>(null);
  const removeLine = (line: Add) => {
    const eventId = newId();
    change({ kind: "remove", id: newId(), target: line.id }, null, eventId);
    setRemoved({ eventId, text: texts.bench.removed(line.material.name, formula.header.name || texts.bench.untitled) });
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
  // «Export as CSV» and «Print or save as PDF» (V3-80): the whole formula, whatever step is being looked at.
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([formulaCsv(compose(formula))], { type: "text/csv;charset=utf-8" }));
    Object.assign(document.createElement("a"), { href: url, download: formulaFileName(formula.header.name || "formula", new Date().toISOString().slice(0, 10), "csv") }).click();
    URL.revokeObjectURL(url);
  };
  const [printing, setPrinting] = useState(false);
  const stopPrinting = useCallback(() => setPrinting(false), []);

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
  // Marked «perfume acabado», it shows in that general folder too (V3-19, plan 8.1b).
  const finished = props.record.markers.includes("finished");
  // Favorite and locked (F1): a locked formula takes no new step until it is unlocked.
  const favorite = props.record.markers.includes("favorite");
  const locked = props.record.markers.includes("locked");
  const toggleMarker = (marker: FormulaMarker, on: boolean, notice: string) =>
    write(async () => {
      const markers = on ? [...props.record.markers, marker] : props.record.markers.filter((m) => m !== marker);
      await updateFormula(local.db, owner, formulaId, { markers });
      setNotice(notice);
    });
  // Its role in a perfume (V3-20: free text, optional), its workbench's name, and deleting it.
  const benchOf = props.data.workbenches.find((w) => w.id === props.record.workbenchId);
  const setRole = (role: string) =>
    write(async () => {
      await updateFormula(local.db, owner, formulaId, { role: role.trim() || null });
      setNotice(role.trim() ? texts.bench.roleSet(role.trim()) : texts.bench.roleCleared);
    });
  const renameBench = (name: string) =>
    write(async () => {
      await renameWorkbench(local.db, owner, props.record.workbenchId, name);
      setNotice(texts.bench.benchRenamed(name.trim()));
    });
  // Not through the queue of writes: that one clears the message once its work is done, and a
  // refusal must stay in sight. It waits for what is queued, so nothing is written after it.
  const remove = async () => {
    await queue.current;
    try {
      await deleteFormula(local.db, props.data.catalog, owner, formulaId);
      props.onExit();
    } catch (e) {
      setError(e instanceof FormulaInUse ? texts.bench.inUse(e.materials) : `${texts.bench.writeError}: ${message(e)}`);
    }
  };
  const formulaName = (id: string) => props.data.formulas.find((f) => f.id === id)?.name ?? id;
  const usedIn = props.uses.flatMap((u) => u.formulaIds.map((id) => ({ material: u.material, id })));

  // To another workbench, with its versions (plan 8.1b).
  const moveTo = (workbenchId: string) =>
    write(async () => {
      const n = await moveFormula(local.db, owner, formulaId, workbenchId);
      setNotice(texts.bench.moved(props.data.workbenches.find((w) => w.id === workbenchId)?.name ?? "", n));
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

  /** Pours a formula as a material (2026-10-19): the one it is kept as, or kept now, as «Guardar como material» does. */
  const noteMissing = () => {
    const keys = (view.composition?.lines ?? []).map((l) => l.material.key).filter((k) => props.data.catalog.materials.has(k));
    const missing = missingOf(keys, props.data.catalog);
    if (missing.length === 0) return;
    void Promise.all(missing.map((materialId) => addToShopping(local.db, owner, { materialId, formulaId }))).then((results) => {
      const added = results.flatMap((r, i) => (r.added ? [{ id: r.id, name: props.data.catalog.materials.get(missing[i])?.name ?? "—" }] : []));
      if (added.length > 0) setShoppingNote({ text: appTexts.shopping.missingAdded(added.map((a) => a.name).join(", ")), ids: added.map((a) => a.id) });
    }, (e: unknown) => setError(String(e)));
  };

  const useFormulaAsMaterial = (id: string) => {
    const f = pourable.find((x) => x.id === id);
    if (!f) return;
    if (f.material) {
      addBar.current?.select(f.material);
      return;
    }
    write(async () => {
      setToChoose(await freezeFormula(local.db, owner, id, { name: f.name }));
    });
  };

  const startReweigh = () => {
    if (!view.composition || view.composition.totalUg.isZero()) {
      setError(texts.dialogs.nothingToReweigh);
      return;
    }
    setDialog({ kind: "reweigh" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (props.active === false) return;
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
  const status = error ?? (pending > 0 ? texts.bench.saving : Object.keys(typed).length > 0 ? texts.bench.unsaved : (notice ?? texts.bench.savedLive));
  const tare = formula.header.container?.tareUg ?? null;
  const adds = formula.history.slice(0, frame ?? formula.history.length).filter((c): c is Add => c.kind === "add");
  const empty = !view.composition || view.composition.parts.length === 0;
  // What the bottle holds, as % of it, for under the bottle (P49).
  const bottleTotal = view.composition && !view.composition.totalUg.isZero() ? view.composition.totalUg : null;

  return (
    <div className="bench">
      {/* The bench as one page that scrolls (V3-73): the head, the bottle and its grams, the add bar
          with what the chosen material carries under it, the composition beside the charts, and the
          history docked at the bottom. */}
      <header className="formula-head">
        <button
          type="button"
          className="back"
          aria-label={texts.bench.back}
          title={texts.bench.back}
          onClick={() => {
            flushTyped();
            props.onExit();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <NameCard header={shownHeader} status={status} statusIsError={error !== null} onChange={typeHeader} onDone={doneTyping} />
        <IntentionCard header={shownHeader} onChange={typeHeader} onDone={doneTyping} />
        <NotesCard notes={props.record.notes} onSave={(notes) => write(() => updateFormula(local.db, owner, formulaId, { notes }))} />
        <div className="head-actions">
          <button type="button" className="tool" aria-label={texts.menu.undo} title={`${texts.menu.undo} (Ctrl+Z)`} disabled={formula.history.length === 0} onClick={undo}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 4L3 8l4 4" />
              <path d="M3 8h8a4 4 0 0 1 0 8H9" />
            </svg>
          </button>
          <button type="button" className="tool" aria-label={texts.menu.redo} title={`${texts.menu.redo} (Ctrl+Y)`} disabled={!canRedo} onClick={redo}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4l4 4-4 4" />
              <path d="M15 8H7a4 4 0 0 0 0 8h2" />
            </svg>
          </button>
          <span className="options-wrap">
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
          <button type="button" className="menuitem" onClick={menuAction(() => toggleMarker("finished", !finished, finished ? texts.bench.unmarkedFinished : texts.bench.markedFinished))}>
            <span>{finished ? texts.menu.unmarkFinished : texts.menu.markFinished}</span>
          </button>
          <button type="button" className="menuitem" onClick={menuAction(() => toggleMarker("favorite", !favorite, favorite ? texts.bench.unmarkedFavorite : texts.bench.markedFavorite))}>
            <span>{favorite ? texts.menu.unmarkFavorite : texts.menu.markFavorite}</span>
          </button>
          <button type="button" className="menuitem" onClick={menuAction(() => toggleMarker("locked", !locked, locked ? texts.bench.unlocked : texts.bench.lockedNow))}>
            <span>{locked ? texts.menu.unlock : texts.menu.lock}</span>
          </button>
          <button type="button" className="menuitem" disabled={props.data.workbenches.length < 2} onClick={menuAction(() => setDialog({ kind: "move" }))}>
            <span>{texts.menu.move}</span>
          </button>
          <button type="button" className="menuitem" onClick={menuAction(() => setDialog({ kind: "role" }))}>
            <span>{texts.menu.role}</span>
          </button>
          <button type="button" className="menuitem" onClick={menuAction(() => setDialog({ kind: "renameBench" }))}>
            <span>{texts.menu.renameBench}</span>
          </button>
          <button type="button" className="menuitem" onClick={menuAction(exportJson)}>
            <span>{texts.bench.exportJson}</span>
          </button>
          <button type="button" className="menuitem" disabled={empty} onClick={menuAction(exportCsv)}>
            <span>{texts.bench.exportCsv}</span>
          </button>
          <button type="button" className="menuitem" disabled={empty} onClick={menuAction(() => setPrinting(true))}>
            <span>{texts.bench.print}</span>
          </button>
          <div className="menu-sep" />
          <button type="button" className="menuitem" disabled={empty} onClick={menuAction(() => {
            setDialog({ kind: "useFormula" });
            noteMissing();
          })}>
            <span>{texts.menu.useFormula}</span>
          </button>
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
          {/* Where it is used as a material (plan 8.1b: «el corazón dice dónde se usa»). */}
          {props.uses.length > 0 && (
            <>
              <div className="menu-sep" />
              <span className="menu-note">{usedIn.length ? texts.menu.usedIn : texts.menu.notUsedYet(props.uses.map((u) => u.material))}</span>
              {usedIn.map((u) => (
                <button key={`${u.material}:${u.id}`} type="button" className="menuitem" onClick={menuAction(() => props.onOpen(u.id))}>
                  <span>{texts.menu.openUse(formulaName(u.id), u.material)}</span>
                </button>
              ))}
            </>
          )}
          <div className="menu-sep" />
          <button type="button" className="menuitem danger" onClick={menuAction(() => setDialog({ kind: "delete" }))}>
            <span>{texts.menu.delete}</span>
          </button>
        </div>
      )}
          </span>
        </div>
      </header>
      <FamilyBar className="bench-families" shares={familyShares(view.composition?.parts ?? [], props.data.catalog)} />
      {locked && (
        <p className="locked-note" role="status">
          {texts.bench.lockedNote}{" "}
          <button type="button" className="link" onClick={() => toggleMarker("locked", false, texts.bench.unlocked)}>
            {texts.menu.unlock}
          </button>
        </p>
      )}

      <div className="card weigh-row">
        <BottleFrame
          name={shownHeader.name || texts.bench.untitled}
          fill={fill}
          aromatic={bottleTotal ? { name: texts.composition.aromatic, share: formatPercent(view.composition!.aromaticUg.div(bottleTotal), 2) } : null}
          solvents={
            bottleTotal
              ? view.composition!.parts.filter((p) => p.material.solvent).map((p) => ({ name: p.material.name, share: formatPercent(p.massUg.div(bottleTotal), 2) }))
              : []
          }
        />
        <GramsCard header={shownHeader} totalUg={total} onChange={setHeader} />
      </div>

      <AddBar
        ref={addBar}
        entries={repository.entries}
        sessionMaterials={known}
        have={props.data.catalog.have}
        onAdd={change}
        bottles={(key) => bottlesFor(props.data, key)}
        onSelect={setCardMaterial}
        onDraft={setDraft}
        warning={warning}
        onQuickMaterial={() => setDialog({ kind: "quick" })}
        onFormulaAsMaterial={() => setDialog({ kind: "formulaAsMaterial" })}
        pendingFormulas={pourable.filter((f) => !f.material).map((f) => ({ id: f.id, name: f.name, place: f.place }))}
        onUseFormula={useFormulaAsMaterial}
        formulaPlace={(key) => placeOfFrozen.get(key)}
        onCreateProvisional={createProvisional}
        orbOf={orbOf(24)}
        onNewBottle={(key: string) => {
          flushTyped();
          setBottleFor(key);
        }}
        insight={
          <MaterialCard
            inline
            material={cardMaterial}
            entry={cardMaterial ? entryByKey.get(cardMaterial.key) : undefined}
            composition={view.composition}
            ifra={cardIfra}
            band={bandOf(cardMaterial ? entryByKey.get(cardMaterial.key)?.usage : undefined)}
            draft={preview}
            data={ifra}
            onOpenSheet={cardMaterial && props.onOpenMaterial && entryByKey.has(cardMaterial.key) ? () => props.onOpenMaterial!(cardMaterial.key) : undefined}
          />
        }
      />
      {view.error && (
        <p className="compute-error">
          {texts.bench.computeError}: {view.error}
        </p>
      )}

      <div className="bench-grid">
        <div className="bench-col">
          <CompositionCard
            composition={view.composition}
            lines={view.lines}
            adds={adds}
            report={view.report}
            ifra={ifra}
            {...(lineIfra ? { lineIfra } : {})}
            {...(ifraBase ? { ifraBase } : {})}
            iconOf={(key) => icons.get(key)}
            orbOf={orbOf(28)}
            chemicalOf={(key) => chemical.get(key)}
            glossaryNameOf={(key) => byKey.get(key)?.name}
            familyOf={familyOf}
            tierOf={tierOf}
            onAgain={(m) => addBar.current?.select(m)}
          />
          <IfraPanel report={view.report} empty={empty} {...(ifraBase ? { base: ifraBase } : {})} onBase={setChosenBase} specifications={specifications} assumptions={assumptions} />
        </div>
        {/* The side holds the verdict and the charts only (V3-73), with room for the odour map. */}
        <aside className="side">
          <IfraSummary report={view.report} empty={empty} {...(ifraBase ? { base: ifraBase } : {})} />
          <RepartoCard composition={view.composition} familyOf={familyOf} />
          <ProjectionCard />
          <OdourMapPlaceholder />
        </aside>
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
        orbOf={orbOf(28)}
        familyOf={familyOf}
      >
        <Toast
          docked
          message={removed && removed.eventId === lastId ? removed.text : null}
          onUndo={undo}
          onClose={() => setRemoved(null)}
        />
      </HistoryDock>

      {selected && (
        <ChangeDetail
          change={selected}
          index={selectedIndex}
          history={formula.history}
          current={view.current}
          onEditMass={(line) => setDialog({ kind: "mass", line })}
          onRemove={removeLine}
          onFrame={setFrame}
          onClose={() => setSelectedId(null)}
        />
      )}

      <Toast
        message={shoppingNote?.text ?? null}
        onUndo={() => {
          const ids = shoppingNote?.ids ?? [];
          setShoppingNote(null);
          void Promise.all(ids.map((id) => removeFromShopping(local.db, owner, id))).catch((e: unknown) => setError(String(e)));
        }}
        onClose={() => setShoppingNote(null)}
      />
      {printing && !empty && (
        <PrintFormula
          name={formula.header.name}
          bench={props.data.workbenches.find((w) => w.id === props.record.workbenchId)?.name ?? null}
          composition={compose(formula)}
          weighing={(() => {
            const own = ownConcentration(formula.header.workBatchUg, formula.header.finalBatchUg);
            if (!own || !formula.header.finalBatchUg) return null;
            try {
              return recipe(compose(formula), formula.header.finalBatchUg, own);
            } catch {
              return null;
            }
          })()}
          onDone={stopPrinting}
        />
      )}
      {bottleFor !== null && (
        <DilutionPopup
          data={props.data}
          local={props.local}
          materialId={bottleFor}
          onDone={(id) => {
            setBottleFor(null);
            addBar.current?.pickBottle(id);
          }}
          onClose={() => {
            setBottleFor(null);
            addBar.current?.focus();
          }}
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
      {dialog?.kind === "reweigh" && (
        <ReweighDialog
          tareUg={tare}
          totalUg={view.composition?.totalUg ?? null}
          help={texts.dialogs.reweighHelp}
          onDone={({ grossUg, tareUg }) => change({ kind: "reweigh", id: newId(), grossUg, tareUg })}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "useFormula" && !empty && (
        // The whole formula, whatever step of the history is being looked at.
        <UseFormulaDialog
          composition={compose(formula)}
          report={checkIfra(formula, ifra)}
          own={ownConcentration(formula.header.workBatchUg, formula.header.finalBatchUg)}
          describe={(line) =>
            line.fraction.eq(Ratio.ONE)
              ? `${line.material.name} · ${texts.useFormula.pure}`
              : `${line.material.name} · ${texts.useFormula.diluted(dilutionText(line.fraction), [line.diluent, line.secondDiluent?.material, ...(line.moreDiluents ?? []).map((d) => d.material)].flatMap((m) => (m ? [m.name] : [])).join(" + "))}`
          }
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
      {dialog?.kind === "role" && (
        <PromptDialog
          title={texts.dialogs.roleTitle}
          label={texts.dialogs.roleLabel}
          help={texts.dialogs.roleHelp}
          initial={props.record.role ?? ""}
          submit={(value) => {
            setRole(value);
            return null;
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "renameBench" && (
        <PromptDialog
          title={texts.dialogs.renameBenchTitle}
          label={texts.dialogs.renameBenchLabel}
          initial={benchOf?.name ?? ""}
          submit={(value) => {
            if (value.trim() === "") return texts.dialogs.renameBenchLabel;
            renameBench(value);
            return null;
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog title={texts.dialogs.deleteTitle} text={texts.dialogs.deleteText(formula.header.name, formula.history.length)} onConfirm={() => void remove()} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "formulaAsMaterial" && (
        <ChoiceDialog
          title={texts.dialogs.formulaAsMaterialTitle}
          help={pourable.length ? texts.dialogs.formulaAsMaterialHelp : texts.dialogs.formulaAsMaterialNone}
          options={pourable.map((f) => ({
            id: f.id,
            label: `${f.name} · ${f.place}${!f.material ? ` (${texts.dialogs.keptNow})` : f.material.name !== f.name ? ` (${texts.dialogs.keptAs(f.material.name)})` : ""}`,
          }))}
          initial={null}
          onDone={useFormulaAsMaterial}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "move" && (
        <ChoiceDialog
          title={texts.dialogs.moveTitle}
          help={texts.dialogs.moveHelp}
          options={props.data.workbenches.map((w) => ({ id: w.id, label: w.id === props.record.workbenchId ? `${w.name} ${texts.dialogs.current}` : w.name }))}
          initial={props.record.workbenchId}
          onDone={(id) => {
            if (id !== props.record.workbenchId) moveTo(id);
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
