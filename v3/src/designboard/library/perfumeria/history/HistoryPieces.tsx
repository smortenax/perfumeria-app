// Copied from designboard 4aa3488 (src/library/perfumeria/history/HistoryPieces.tsx), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { CSSProperties, ReactNode } from "react";
import { tokenVar } from "../../../core/tokens";
import { useHistoryData } from "./HistoryContext";
import type { HistoryItem } from "./history";
import { useHistoryDock } from "./useHistoryDock";
import "./history.css";

/**
 * The three pieces of Perfumería's history dock, from the JSX of HistoryDock.tsx (322e353). Each
 * reads the history from its context and its look from its params; none keeps state of its own
 * beyond the track's hook. The words come from the app's texts through the context.
 */

/**
 * Tokens the pieces use but do not offer as params (the plan's split): states and quiet text.
 * Computed while drawing, never when the module loads, so the app's token names apply even when
 * `setTokenNaming` runs after this module is imported.
 */
const fixedVars = () => ({
  "--pfh-font": tokenVar("font.family.body", "system-ui"),
  "--pfh-ink": tokenVar("color.text.default", "#111418"),
  "--pfh-muted": tokenVar("color.text.muted", "#4c5662"),
  "--pfh-line-strong": tokenVar("color.border.control", "#7b8591"),
  "--pfh-note-bg": tokenVar("color.surface.sunken", "#eef1f4"),
  "--pfh-other-bg": tokenVar("color.surface.chip", "#e2e8ee"),
  "--pfh-amber-line": tokenVar("color.status.amber.line", "#e3cda0"),
  "--pfh-red": tokenVar("color.status.red.default", "#a32d2d"),
  "--pfh-tip-sub": tokenVar("color.border.subtle", "#c8d0d9"),
  "--pfh-chip-text": tokenVar("font.size.xs", "12px"),
  "--pfh-empty-size": tokenVar("font.size.sm", "13px"),
  "--pfh-tip-size": tokenVar("font.size.sm", "13px"),
}) as CSSProperties;

/** An SVG the owner gave, drawn in the current colour; empty gives the app's own glyph. */
function Glyph({ src, fallback }: { src: string; fallback: ReactNode }) {
  if (!src) return <>{fallback}</>;
  return <span className="pfh-glyph" aria-hidden="true" style={{ "--pfh-glyph": `url("${src.replace(/"/g, "%22")}")` } as CSSProperties} />;
}

/** A material's icon text (Icon.tsx's IconText): the mark before a shared abbreviation and the kind letter, leaning back. */
function IconText({ icon }: { icon: NonNullable<HistoryItem["icon"]> }) {
  const { text, type } = icon;
  const at = type ? text.search(new RegExp(`${type}\\d*$`)) : -1;
  return (
    <>
      {icon.mark && <sup className="pfh-icon-mark">{icon.mark}</sup>}
      {at < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, at)}
          <span className="pfh-type-mark" title={icon.typeTitle}>
            {type}
          </span>
          {text.slice(at + 1)}
        </>
      )}
    </>
  );
}

const iconLength = (text: string, mark?: string) => text.length + (mark ? mark.length * 0.6 : 0);

// ── Play ────────────────────────────────────────────────────────────────

export type PlayParams = {
  background: string;
  border: string;
  radius: string;
  iconColor: string;
  playIcon: string;
  pauseIcon: string;
};

export function HistoryPlay({ params }: { params: PlayParams }) {
  const h = useHistoryData();
  if (!h) return null;
  const label = h.playing ? h.labels.pause : h.labels.play;
  return (
    <button
      type="button"
      className="pfh-play"
      aria-label={label}
      title={label}
      disabled={h.items.length === 0}
      onClick={h.onTogglePlay}
      style={{
        background: tokenVar(params.background, "#f8f9fa"),
        border: `1px solid ${tokenVar(params.border, "#7b8591")}`,
        borderRadius: tokenVar(params.radius, "8px"),
        color: tokenVar(params.iconColor, "#111418"),
      }}
    >
      {h.playing ? (
        <Glyph
          src={params.pauseIcon}
          fallback={
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <rect x="2" y="1.5" width="3" height="9" rx="1" fill="currentColor" />
              <rect x="7" y="1.5" width="3" height="9" rx="1" fill="currentColor" />
            </svg>
          }
        />
      ) : (
        <Glyph
          src={params.playIcon}
          fallback={
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3.5 1.8v8.4L10.2 6z" fill="currentColor" />
            </svg>
          }
        />
      )}
    </button>
  );
}

// ── Track ───────────────────────────────────────────────────────────────

export type TrackParams = {
  chip: number;
  slot: number;
  gap: number;
  magnify: number;
  reach: number;
  mark: string;
  amounts: boolean;
  future: number;
  radius: string;
  chipBackground: string;
  chipBorder: string;
  line: string;
  lineDone: string;
  selected: string;
  amountSize: string;
  amountColor: string;
  tipBackground: string;
  tipText: string;
  shades: boolean;
  noteIcon: string;
  reweighIcon: string;
  removeIcon: string;
  setMassIcon: string;
};

export function HistoryTrack({ params }: { params: TrackParams }) {
  const h = useHistoryData();
  const items = h?.items ?? [];
  const n = items.length;
  const dock = useHistoryDock(n, { chip: params.chip, slot: params.slot, gap: params.gap, magnify: params.magnify, reach: params.reach }, h?.hoverIndex);
  if (!h) return null;

  const end = h.frame ?? n;
  const tip = dock.hovered >= 0 ? items[dock.hovered] : null;
  const vars = {
    ...fixedVars(),
    "--pfh-chip": `${params.chip}px`,
    "--pfh-slot": `${dock.geometry.slot}px`,
    "--pfh-gap": `${params.gap}px`,
    "--pfh-radius": tokenVar(params.radius, "8px"),
    "--pfh-chip-bg": tokenVar(params.chipBackground, "#f8f9fa"),
    "--pfh-chip-line": tokenVar(params.chipBorder, "#c8d0d9"),
    "--pfh-line": tokenVar(params.line, "#c8d0d9"),
    "--pfh-done": tokenVar(params.lineDone, "#111418"),
    "--pfh-selected": tokenVar(params.selected, "#111418"),
    "--pfh-amount-size": tokenVar(params.amountSize, "12px"),
    "--pfh-amount": tokenVar(params.amountColor, "#4c5662"),
    "--pfh-tip-bg": tokenVar(params.tipBackground, "#111418"),
    "--pfh-tip-text": tokenVar(params.tipText, "#fff"),
    "--pfh-future": String(params.future),
  } as CSSProperties;

  return (
    <div
      className="pfh-track"
      ref={dock.area}
      style={vars}
      onPointerMove={(e) => dock.setPointer(e.clientX - e.currentTarget.getBoundingClientRect().left)}
      onPointerLeave={() => dock.setPointer(null)}
      onWheel={(e) => dock.setScroll(dock.scroll + e.deltaY + e.deltaX)}
    >
      {n === 0 && <span className="pfh-empty">{h.labels.empty}</span>}
      <div className="pfh-clip">
        <div className="pfh-row" style={{ transform: `translateX(${-dock.scroll}px)` }}>
          {items.map((item, i) => {
            const s = dock.scale(i);
            const shift = dock.shift(i);
            const future = i >= end;
            const orb = item.kind === "add" && params.mark === "orb" ? item.orb?.(params.chip) : undefined;
            const tinted = item.kind === "add" && !orb && params.mark !== "letters" && item.family;
            const icon = item.icon ?? { text: "" };
            const classes = [
              "pfh-chip",
              `k-${item.kind}`,
              item.id === h.selectedId ? "selected" : "",
              future ? "future" : "",
              item.warning ? `warn-${item.warning}` : "",
              iconLength(icon.text, icon.mark) > 3 ? "long" : "",
              orb ? "orb" : "",
              tinted ? "fam" : "",
            ];
            const style = { transform: `translateX(${shift}px) scale(${s})`, ...(tinted ? { "--fam": item.family!.colour } : {}) } as CSSProperties;
            return (
              <div key={item.id} className={`pfh-slot${future ? " future" : " done"}${i === end - 1 ? " last" : ""}`}>
                <button
                  type="button"
                  className={classes.filter(Boolean).join(" ")}
                  aria-label={`${item.title}, ${item.sub}`}
                  title={tinted ? item.family!.title : undefined}
                  style={style}
                  onClick={() => h.onSelect(item.id === h.selectedId ? null : item.id)}
                >
                  {orb ? (
                    orb
                  ) : item.kind === "add" ? (
                    <IconText icon={icon} />
                  ) : item.kind === "note" ? (
                    <Glyph
                      src={params.noteIcon}
                      fallback={
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 12.5V2M3 2.5h7l-1.6 2.6L10 7.7H3" />
                        </svg>
                      }
                    />
                  ) : item.kind === "reweigh" ? (
                    <Glyph src={params.reweighIcon} fallback="⚖" />
                  ) : item.kind === "remove" ? (
                    <Glyph src={params.removeIcon} fallback="✕" />
                  ) : (
                    <Glyph src={params.setMassIcon} fallback="±" />
                  )}
                </button>
                <span className="pfh-tick" aria-hidden="true">
                  <i />
                </span>
                {params.amounts && item.amount && (
                  <span className="pfh-amount" aria-hidden="true" style={{ transform: `translateX(${shift}px)` }}>
                    {item.amount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {params.shades && dock.scroll > 0 && <button type="button" className="pfh-shade left" aria-label={h.labels.goStart} onClick={() => dock.setScroll(0)} />}
      {params.shades && dock.scroll < dock.maxScroll && (
        <button type="button" className="pfh-shade right" aria-label={h.labels.goEnd} onClick={() => dock.setScroll(dock.maxScroll)} />
      )}
      {tip && (
        <div className="pfh-tip" style={{ left: dock.centre(dock.hovered) }}>
          <span className="pfh-tip-title">{tip.title}</span>
          <span className="pfh-tip-sub">{tip.sub}</span>
        </div>
      )}
    </div>
  );
}

// ── Count ───────────────────────────────────────────────────────────────

export type CountParams = {
  background: string;
  border: string;
  radius: string;
  titleSize: string;
  numberSize: string;
  numberFamily: string;
  layout: string;
  asWeighed: boolean;
};

export function HistoryCount({ params }: { params: CountParams }) {
  const h = useHistoryData();
  if (!h) return null;
  const n = h.items.length;
  const number = (value: number) => (
    <span className="pfh-count-n" style={{ fontSize: tokenVar(params.numberSize, "14px"), fontFamily: tokenVar(params.numberFamily, "inherit"), color: tokenVar("color.text.default", "#111418") }}>
      {value}
    </span>
  );
  return (
    <div
      className={params.layout === "inline" ? "pfh-count inline" : "pfh-count"}
      style={{
        background: tokenVar(params.background, "#eef1f4"),
        border: `1px solid ${tokenVar(params.border, "#c8d0d9")}`,
        borderRadius: tokenVar(params.radius, "8px"),
        color: tokenVar("color.text.muted", "#4c5662"),
        fontFamily: tokenVar("font.family.body", "system-ui"),
      }}
    >
      <span className="pfh-count-title" style={{ fontSize: tokenVar(params.titleSize, "12px") }}>
        {h.labels.title}
      </span>
      {h.frame === null ? (
        <span style={{ fontSize: tokenVar("font.size.sm", "13px") }}>
          {number(n)} {h.labels.changes(n)}
          {params.asWeighed && <span>{h.labels.asWeighed}</span>}
        </span>
      ) : (
        <span style={{ fontSize: tokenVar("font.size.sm", "13px") }}>
          {number(h.frame)} {h.labels.ofCount(n)} ·{" "}
          <button type="button" className="pfh-link" onClick={() => h.onFrame(null)}>
            {h.labels.toEnd}
          </button>
        </span>
      )}
    </div>
  );
}
