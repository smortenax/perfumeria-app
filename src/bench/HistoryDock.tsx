import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import type { Line } from "../core/compose";
import { formatGrams } from "../core/display";
import type { Change } from "../core/model/formula";
import type { MaterialFamily } from "../data/catalog";
import { texts } from "../i18n/es";
import { familyLook } from "./family";
import { initials, massText, pouredText, pureText, weighingWarning } from "./format";
import { IconText, iconLength } from "./Icon";

const t = texts.history;

type Add = Extract<Change, { kind: "add" }>;

const CHIP = 28;
const GAP = 8;

function describe(change: Change, adds: ReadonlyMap<string, Add>): { title: string; sub: string } {
  switch (change.kind) {
    case "add":
      return {
        title: change.material.name,
        sub: pouredText(Ratio.of(change.massUg), change.fraction, change.diluent?.name, change.secondDiluent),
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

/** The dock's shape: rounded, with a bite at the top centre for the play button (P26). */
function dockPath(w: number): string {
  const c = w / 2;
  return [
    `M28.5 0.5 H${c - 26.5} A6 6 0 0 1 ${c - 20.5} 6.5 V18.5 A9 9 0 0 0 ${c - 11.5} 27.5`,
    `H${c + 11.5} A9 9 0 0 0 ${c + 20.5} 18.5 V6.5 A6 6 0 0 1 ${c + 26.5} 0.5`,
    `H${w - 28.5} A28 28 0 0 1 ${w - 0.5} 28.5 V79.5 A16 16 0 0 1 ${w - 16.5} 95.5`,
    `H16.5 A16 16 0 0 1 0.5 79.5 V28.5 A28 28 0 0 1 28.5 0.5 Z`,
  ].join(" ");
}

/**
 * The history as a dock (§10.1): every change in its order, even when a
 * material repeats; on hover it grows and says material and quantity; notes are
 * marks in it; the play sits in a bite of its top edge. As in the sketch (boceto 4).
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
  /** Each addition shows the family of its material (P48). */
  familyOf?: (key: string) => MaterialFamily | undefined;
}) {
  const box = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1408);
  const [areaWidth, setAreaWidth] = useState(1000);
  const [pointer, setPointer] = useState<number | null>(null);
  const [scroll, setScroll] = useState(0);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => {
      setWidth(box.current?.clientWidth ?? 1408);
      setAreaWidth(area.current?.clientWidth ?? 1000);
    });
    if (box.current) {
      observer.observe(box.current);
    }
    return () => observer.disconnect();
  }, []);

  const n = props.history.length;
  const content = n * (CHIP + GAP);
  const maxScroll = Math.max(0, content - areaWidth + 24);
  // A new change comes into view.
  useEffect(() => setScroll(maxScroll), [n, maxScroll]);

  const adds = new Map(props.history.filter((c): c is Add => c.kind === "add").map((c) => [c.id, c]));
  const end = props.frame ?? n;
  const centre = (i: number) => i * (CHIP + GAP) + CHIP / 2 - scroll;
  const scaleOf = (i: number) => (pointer === null ? 1 : 1 + 0.8 * Math.max(0, 1 - Math.abs(centre(i) - pointer) / 84));
  const hovered = pointer === null ? null : props.history.findIndex((_, i) => Math.abs(centre(i) - pointer) <= (CHIP + GAP) / 2);
  const tip = hovered !== null && hovered >= 0 ? describe(props.history[hovered], adds) : null;

  return (
    <div className="dock" ref={box}>
      <svg className="dock-shape" width={width} height="96" viewBox={`0 0 ${width} 96`} aria-hidden="true">
        <path d={dockPath(width)} />
      </svg>
      <div className="dock-inner">
        <div className="dock-label">
          <span className="dock-title">{t.title}</span>
          {props.frame === null ? (
            <span className="muted small">{t.count(n)}</span>
          ) : (
            <span className="frame small">
              {t.frame(props.frame, n)} ·{" "}
              <button type="button" className="link" onClick={() => props.onFrame(null)}>
                {t.toEnd}
              </button>
            </span>
          )}
        </div>
        <div
          className="dock-area"
          ref={area}
          onPointerMove={(e) => setPointer(e.clientX - e.currentTarget.getBoundingClientRect().left)}
          onPointerLeave={() => setPointer(null)}
          onWheel={(e) => setScroll(Math.max(0, Math.min(maxScroll, scroll + e.deltaY + e.deltaX)))}
        >
          {n === 0 && <span className="muted small dock-empty">{t.empty}</span>}
          <div className="dock-clip">
            <div className="dock-row" style={{ transform: `translateX(${-scroll}px)` }}>
              {props.history.map((change, i) => {
                const s = scaleOf(i);
                const shift = pointer === null ? 0 : (centre(i) - pointer) * (s - 1) * 0.35;
                const warning = change.kind === "add" ? weighingWarning(change.massUg) : null;
                const info = describe(change, adds);
                const icon = change.kind === "add" ? (props.iconOf?.(change.material.key) ?? { text: initials(change.material.name) }) : { text: "" };
                const look = change.kind === "add" ? familyLook(props.familyOf?.(change.material.key)) : null;
                const classes = [
                  "chip",
                  `chip-${change.kind}`,
                  change.id === props.selectedId ? "selected" : "",
                  i >= end ? "future" : "",
                  warning ? `warn-${warning.kind}` : "",
                  iconLength(icon.text, icon.mark) > 3 ? "chip-long" : "",
                  look?.className ?? "",
                ];
                return (
                  <button
                    type="button"
                    key={change.id}
                    className={classes.join(" ")}
                    aria-label={`${info.title}, ${info.sub}`}
                    title={look?.title}
                    style={{ ...look?.style, transform: `translateX(${shift}px) scale(${s})` }}
                    onClick={() => props.onSelect(change.id === props.selectedId ? null : change.id)}
                  >
                    {change.kind === "add" ? (
                      <IconText text={icon.text} mark={icon.mark} type={"type" in icon ? icon.type : undefined} />
                    ) : change.kind === "note" ? (
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 12.5V2M3 2.5h7l-1.6 2.6L10 7.7H3" />
                      </svg>
                    ) : change.kind === "reweigh" ? (
                      "⚖"
                    ) : change.kind === "remove" ? (
                      "✕"
                    ) : (
                      "±"
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {scroll > 0 && <button type="button" className="shade left" tabIndex={-1} aria-label={t.goStart} onClick={() => setScroll(0)} />}
          {scroll < maxScroll && <button type="button" className="shade right" tabIndex={-1} aria-label={t.goEnd} onClick={() => setScroll(maxScroll)} />}
          {tip && hovered !== null && hovered >= 0 && (
            <div className="dock-tip" style={{ left: centre(hovered) }}>
              <span className="tip-title">{tip.title}</span>
              <span className="tip-sub">{tip.sub}</span>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="play"
        style={{ left: width / 2 - 15 }}
        aria-label={props.playing ? t.pause : t.play}
        title={props.playing ? t.pause : t.play}
        disabled={n === 0}
        onClick={props.onTogglePlay}
      >
        {props.playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <rect x="2" y="1.5" width="3" height="9" rx="1" fill="currentColor" />
            <rect x="7" y="1.5" width="3" height="9" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3.5 1.8v8.4L10.2 6z" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
}

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
