// Before anything that draws a composition: the board's runtime names tokens as this app does.
import "../designboard/naming";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Ratio } from "../core/arith/ratio";
import type { Line } from "../core/compose";
import { formatGrams } from "../core/display";
import type { Change } from "../core/model/formula";
import type { MaterialFamily } from "./data/catalog";
import { texts } from "./texts";
import { familyText } from "./family";
import { initials, massText, pouredText, pureText, weighingWarning } from "./format";
import composed from "../../designboard.composition.json";
import { clampComposition, parseComposition, pickArtboard, type Artboard } from "../designboard/core/composition";
import { defaultParams, makeLibrary, type ComponentDef } from "../designboard/core/manifest";
import { ComposedScreen } from "../designboard/runtime/ComposedScreen";
import { panel } from "../designboard/library/basic";
import { HistoryProvider } from "../designboard/library/history/HistoryContext";
import { HISTORY_FICHAS } from "../designboard/library/history/history.fichas";
import type { HistoryData, HistoryItem, HistoryLabels } from "../designboard/library/history/history";

const t = texts.history;

type Add = Extract<Change, { kind: "add" }>;


function describe(change: Change, adds: ReadonlyMap<string, Add>): { title: string; sub: string } {
  switch (change.kind) {
    case "add":
      return {
        title: change.material.name,
        sub: pouredText(Ratio.of(change.massUg), change.fraction, change.diluent?.name, change.secondDiluent, change.moreDiluents),
      };
    case "set-mass":
      return { title: adds.get(change.target)?.material.name ?? "?", sub: t.setMass("", massText(Ratio.of(change.massUg))).replace(/^: /, "") };
    case "remove":
      return { title: adds.get(change.target)?.material.name ?? "?", sub: t.removeOf("").replace(/^: /, "") };
    case "reweigh":
      return { title: texts.menu.reweigh.replace("…", ""), sub: t.reweigh(formatGrams(Ratio.of(change.grossUg), 3)) };
    case "note":
      return { title: t.note, sub: `«${change.text}»` };
  }
}

/** What goes under a chip: what was poured, or the mass it was changed to. */
function amountOf(change: Change): string | null {
  if (change.kind === "add") return `+${massText(Ratio.of(change.massUg))}`;
  if (change.kind === "set-mass") return `→ ${massText(Ratio.of(change.massUg))}`;
  return null;
}

/** The fichas the composition may use: the bar's ground and the three pieces (Designboard, task C2). */
const LIBRARY = makeLibrary([panel, ...HISTORY_FICHAS] as unknown as ComponentDef[]);

/**
 * The composition the board wrote (v3/designboard.composition.json), with every param inside its
 * ficha's limits. A file that cannot be read gives null, and the bar falls back to the fichas'
 * defaults (never an empty bar).
 */
function readComposition() {
  try {
    return clampComposition(parseComposition(JSON.stringify(composed)), LIBRARY);
  } catch (error) {
    console.warn("designboard.composition.json could not be read; the history uses its defaults.", error);
    return null;
  }
}
const COMPOSITION = readComposition();

/** The bar without a composition: play, track and count in a row, each with its ficha's defaults. */
function fallbackBoard(width: number): Artboard {
  const node = (type: string, x: number, y: number, w: number, h: number, anchor: { h: "left" | "right" | "stretch"; v: "center" | "stretch" }) => ({
    kind: "component" as const,
    id: `fallback-${type}`,
    type,
    name: type,
    x,
    y,
    w,
    h,
    anchor,
    sizing: { w: { mode: "fixed" as const }, h: { mode: "fixed" as const } },
    params: defaultParams(LIBRARY.get(type)!),
  });
  return {
    id: "fallback",
    name: "History",
    width,
    height: 72,
    x: 0,
    y: 0,
    background: "",
    clip: false,
    layout: { mode: "free" },
    children: [
      { ...node("panel", 0, 0, width, 72, { h: "stretch", v: "stretch" }), params: { ...defaultParams(panel as unknown as ComponentDef), background: "color.surface.raised", border: true, borderColor: "color.border.subtle" } },
      node("history-play", 16, 14, 44, 44, { h: "left", v: "center" }),
      node("history-track", 70, 0, width - 272, 72, { h: "stretch", v: "stretch" }),
      node("history-count", width - 192, 14, 176, 44, { h: "right", v: "center" }),
    ],
  };
}

const LABELS: HistoryLabels = {
  title: t.title,
  changes: t.changes,
  asWeighed: t.asWeighed,
  ofCount: t.ofCount,
  toEnd: t.toEnd,
  play: t.play,
  pause: t.pause,
  goStart: t.goStart,
  goEnd: t.goEnd,
  empty: t.empty,
};

/** The width the bar is given, kept up to date. */
function useBoxWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1440 : window.innerWidth));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setWidth(el.clientWidth || window.innerWidth);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

/**
 * The history as a dock (§10.1): every change in its order, even when a material repeats; on
 * hover it grows and says material and quantity; notes are marks in it. Docked at the bottom of
 * the window while the bench scrolls (V3-73).
 *
 * Since task C4 its look comes from Designboard: the composition file places the play button,
 * the track and the count, and sets their sizes and colours with the product's tokens. This
 * wrapper keeps the same API as before (Bench.tsx does not change): it turns the history into
 * the items the pieces read, provides them, picks the screen for the width (390 up to 40 rem,
 * 1440 above) and draws it as wide as the bench.
 */
export function HistoryDock(props: {
  history: readonly Change[];
  frame: number | null;
  selectedId: string | null;
  playing: boolean;
  onSelect: (id: string | null) => void;
  onFrame: (frame: number | null) => void;
  onTogglePlay: () => void;
  /** The material's icon in the glossary: its trade abbreviation or its code (P37, P39). */
  iconOf?: (key: string) => { text: string; mark?: string; type?: string } | undefined;
  /** The material's orb (V3-73); without one, its icon. */
  orbOf?: (key: string) => ReactNode;
  /** Each addition shows the family of its material (P48). */
  familyOf?: (key: string) => MaterialFamily | undefined;
  /** What rides just above the history: the bench's toast (vault pass F-03). */
  children?: ReactNode;
}) {
  const { ref, width } = useBoxWidth();
  const { history, iconOf, orbOf, familyOf } = props;

  const items = useMemo<HistoryItem[]>(() => {
    const adds = new Map(history.filter((c): c is Add => c.kind === "add").map((c) => [c.id, c]));
    return history.map((change) => {
      const info = describe(change, adds);
      const item: HistoryItem = { id: change.id, kind: change.kind, title: info.title, sub: info.sub, amount: amountOf(change) };
      if (change.kind === "add") {
        item.warning = weighingWarning(change.massUg)?.kind ?? null;
        item.icon = iconOf?.(change.material.key) ?? { text: initials(change.material.name) };
        const orb = orbOf?.(change.material.key);
        // The bench's orbs are drawn at the chip's size it asks for (orbOf(28)); the size the track offers is not used yet.
        if (orb) item.orb = () => orb;
        const family = familyOf?.(change.material.key);
        if (family) item.family = { colour: family.family.colour, title: familyText(family) };
      }
      return item;
    });
  }, [history, iconOf, orbOf, familyOf]);

  const data: HistoryData = {
    items,
    frame: props.frame,
    selectedId: props.selectedId,
    playing: props.playing,
    onSelect: props.onSelect,
    onFrame: props.onFrame,
    onTogglePlay: props.onTogglePlay,
    labels: LABELS,
  };

  const board = (COMPOSITION && pickArtboard(COMPOSITION, width)) ?? fallbackBoard(width);

  return (
    <div className="history-bar" ref={ref} style={{ "--dock-h": `${board.height}px` } as CSSProperties}>
      <HistoryProvider value={data}>
        <ComposedScreen board={board} library={LIBRARY} tokens={EMPTY_TOKENS} fit="width" />
      </HistoryProvider>
      {props.children}
    </div>
  );
}

/** First sizes before the browser measures: the bar lays out in free mode, so none are needed. */
const EMPTY_TOKENS: ReadonlyMap<string, string> = new Map();

/** What one change is, and what can be done with it: over the dock. */
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
  const info = describe(change, adds);
  return (
    <div className="change-detail">
      <p className="detail-title">
        <span className="num muted">{props.index + 1}.</span> <strong>{info.title}</strong> · {info.sub}
      </p>
      {change.kind === "add" && line && (
        <p className="small">
          {t.pure(pureText(line.massUg.mul(line.fraction)))}
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
    </div>
  );
}
