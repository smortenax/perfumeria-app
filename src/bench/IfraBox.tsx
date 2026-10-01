import { useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { formatGrams, formatPercent } from "../core/display";
import type { IfraBase, IfraReport } from "../core/ifra";
import { texts } from "../i18n/es";
import { roomText, usedText } from "./composition-ifra";
import { materialRows, readingIn, substanceRows, type MaterialRow, type SubstanceRow } from "./ifra-panel";

const t = texts.ifra;

/**
 * The IFRA box: two lines, the two readings (§5.4, P23), and nothing to open: the detail
 * is the fixed panel of the lower area (P57). Reading 1 goes in the base of the panel's switch,
 * named in the head (P58). Never green with something unknown (§5.5); a bounded load is its own
 * state (P31). On hover of the second reading, the range from what is known to the worst case (P31).
 */
export function IfraSummary(props: { report: IfraReport | null; empty: boolean; base?: IfraBase }) {
  const { report } = props;
  const hasData = report !== null && !props.empty;
  const reading = hasData ? readingIn(report, props.base) : null;
  const bounded = reading !== null && reading.checks.some((c) => c.verdict === "bounded");
  const asIs = !reading ? "—" : reading.asIs === "no" ? t.no : reading.asIs === "unknown" ? t.unknown : t.yes;
  const asIsClass = !reading ? "" : reading.asIs === "no" ? "bad" : reading.asIs === "unknown" ? "unknown" : bounded ? "bounded" : "";
  const maxUse = !hasData ? "—" : maxUseText(report);
  // What sets the second reading, so a figure under 100 % says why.
  const limiting = hasData && report.maxUse.lt(Ratio.ONE) ? report.checks.find((c) => c.maxUse.eq(report.maxUse)) : undefined;
  const range =
    hasData && !report.maxUseKnown.eq(report.maxUse) ? t.range(formatPercent(report.maxUse, 2), formatPercent(report.maxUseKnown, 2)) : undefined;
  return (
    <div className={limiting ? "card ifra-summary with-limit" : "card ifra-summary"}>
      <span className="ifra-head">
        <span className="ifra-title">{t.title}</span>
        <span className="muted small" title={reading ? t.baseHelp[reading.base] : undefined}>
          {reading ? `${t.category} · ${t.baseShort[reading.base]}` : t.category}
        </span>
        {hasData && report.partial && (
          <span className="status-pill amber">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <circle cx="6" cy="6" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 1.2a4.8 4.8 0 0 1 0 9.6z" fill="currentColor" />
            </svg>
            {t.knownOnly}
          </span>
        )}
        {hasData && !report.partial && bounded && <span className="status-pill blue">{t.bounded}</span>}
      </span>
      <span className="ifra-line">
        <span className="question">{t.asIsQuestion}</span>
        <span className={`answer ${asIsClass}`}>{asIs}</span>
      </span>
      <span className="ifra-line" title={range}>
        <span className="question">{t.maxUseQuestion}</span>
        <span className="answer num">{maxUse}</span>
      </span>
      {limiting && (
        <span className="ifra-limit muted tiny" title={limiting.substance.name}>
          {t.limitedBy(limiting.substance.name)}
        </span>
      )}
    </div>
  );
}

/**
 * Reading 2 to read (§5.4, §1.2). With something unchecked it is a bound, never a value: what is
 * unknown can only lower it, so «≤ X %»; and when nothing known bounds it, it cannot be said at all
 * («Sin comprobar»), never «100 %», which reads as free (2026-10-01, castoreum).
 */
function maxUseText(report: IfraReport): string {
  const whole = report.maxUse.eq(Ratio.ONE);
  if (report.partial) {
    return whole ? t.unknown : `≤ ${formatPercent(report.maxUse, 2)}`;
  }
  return formatPercent(report.maxUse, whole ? 0 : 2);
}

const pctOf = (share: Ratio) => formatPercent(share, 3).replace(" %", "");

/** A ceiling as a figure to read: its %, or «prohibida». */
const limitText = (limit: Ratio) => (limit.isZero() ? t.prohibited : formatPercent(limit, 2));

/** The fill of a bar: the share of the ceiling, up to the end; full for a prohibited substance that is there. */
const widthOf = (used: Ratio | null) => (used === null ? 100 : Math.min(100, Number(used.toFixed(4)) * 100));

/**
 * One substance (§5.4, §10.3): its name and CAS, its share of the product against its ceiling, the
 * bar, and what still fits of it. On hover, where it comes from, material by material. With
 * something unchecked in the bottle what still fits is a bound, «≤», never a value (§1.2).
 */
function SubstanceItem(props: { row: SubstanceRow; partial: boolean }) {
  const { row, partial } = props;
  const value = row.worstShare.eq(row.knownShare) ? pctOf(row.knownShare) : `${pctOf(row.knownShare)}–${pctOf(row.worstShare)}`;
  const exhausted = row.roomUg !== null && row.roomUg.isZero();
  const mass = row.roomUg === null || exhausted ? "" : `${partial ? "≤ " : ""}${roomText(row.roomUg)}`;
  const room = row.roomUg === null ? t.noCeiling : exhausted ? t.noRoom : t.room(mass);
  const help = [
    t.sourcesHelp,
    ...row.sources.map((s) => t.sourceLine(s.name, formatPercent(s.worstShare, 3), formatPercent(s.part, 0))),
    row.roomUg === null ? t.noCeilingHelp(row.name) : exhausted ? t.noRoomHelp(row.name) : t.roomHelp(mass, row.name),
  ];
  if (!row.worstShare.eq(row.knownShare)) {
    help.push(t.range(`${pctOf(row.knownShare)} %`, `${pctOf(row.worstShare)} %`));
  }
  return (
    <div className="ceiling-row" title={help.join("\n")}>
      <span className="ceiling-name">{row.name}</span>
      <span className="num ceiling-value">{t.of(value, limitText(row.limit))}</span>
      <span className="ceiling-bar">
        <span className={`fill ${row.verdict}`} style={{ width: `${widthOf(row.used)}%` }} />
      </span>
      <span className={`num ceiling-use ${row.verdict}`}>{row.used ? usedText(row.used) : "—"}</span>
      <span className="ceiling-cas muted tiny num">{row.cas.length > 0 ? t.casLine(row.cas.join(", ")) : ""}</span>
      <span className={`num ceiling-room tiny ${exhausted ? "exceeds" : "muted"}`}>{room}</span>
    </div>
  );
}

/** One material seen by material (§5.4): what it alone uses of each ceiling it loads. */
function MaterialItem(props: { row: MaterialRow }) {
  const { row } = props;
  return (
    <div className="material-ceilings">
      <div className="ceiling-material">{row.name}</div>
      {row.items.map((item) => (
        <div
          key={item.key}
          className="ceiling-row sub"
          title={t.itemHelp(row.name, item.used ? usedText(item.used) : t.prohibited, item.name, t.verdict[item.verdict])}
        >
          <span className="ceiling-name">{item.name}</span>
          <span className="num ceiling-value">{t.of(pctOf(item.worstShare), limitText(item.limit))}</span>
          <span className="ceiling-bar">
            <span className={`fill ${item.verdict}`} style={{ width: `${widthOf(item.used)}%` }} />
          </span>
          <span className={`num ceiling-use ${item.verdict}`}>{item.used ? usedText(item.used) : "—"}</span>
        </div>
      ))}
    </div>
  );
}

type PanelView = "substance" | "material";
// The view of the panel lasts the session, as the composition's does; it is not written to disk.
let rememberedView: PanelView = "substance";

/**
 * The IFRA panel (P57, E4): fixed in the lower area, because the composition and IFRA are read one
 * against the other all the time. The switch of bases, «Ahora» and «Al completar» (P58), when the
 * header has both: what it chooses goes to the box, the composition and the card as well. Then the
 * second reading with its base, and the ceilings by substance (CAS, what still fits, and on hover
 * where it comes from) or by material; what is unchecked, pending and conditions. It scrolls
 * inside when it is long. With nothing in the bottle it has an empty state of its own.
 */
export function IfraPanel(props: { report: IfraReport | null; empty: boolean; base?: IfraBase; onBase: (base: IfraBase) => void }) {
  const { report } = props;
  const [view, setView] = useState<PanelView>(rememberedView);
  const hasData = report !== null && !props.empty;
  const reading = report ? readingIn(report, props.base) : null;
  const pick = (v: PanelView) => {
    rememberedView = v;
    setView(v);
  };
  const maxUse = hasData ? formatPercent(report.maxUse, report.maxUse.eq(Ratio.ONE) ? 0 : 2) : "";
  const cannotSay = hasData && report.partial && report.maxUse.eq(Ratio.ONE);
  const substances = hasData && view === "substance" ? substanceRows(report, reading?.base) : [];
  const materials = hasData && view === "material" ? materialRows(report, reading?.base) : [];
  return (
    <section className="card ifra-panel" aria-label={t.detailTitle}>
      <div className="detail-head">
        <span className="detail-title">{t.detailTitle}</span>
        {report && reading && report.readings.length > 1 ? (
          <span className="view-switch right" role="radiogroup" aria-label={t.baseSwitch}>
            {report.readings.map((r) => (
              <button
                key={r.base}
                type="button"
                role="radio"
                aria-checked={r.base === reading.base}
                className={r.base === reading.base ? "on" : ""}
                title={t.baseHelp[r.base]}
                onClick={() => props.onBase(r.base)}
              >
                {t.bases[r.base]}
              </button>
            ))}
          </span>
        ) : (
          reading && (
            <span className="muted small right" title={t.baseHelp[reading.base]}>
              {t.bases[reading.base]}
            </span>
          )
        )}
      </div>
      {hasData && reading && <div className="panel-base muted tiny">{t.baseLine[reading.base](formatGrams(report.finalBatchUg, 3))}</div>}
      {!hasData ? (
        <p className="muted small panel-empty">{t.panelEmpty}</p>
      ) : (
        <div className="panel-body">
          <p className="second-reading small" title={t.maxUseQuestion}>
            {cannotSay ? t.secondReadingUnknown : report.partial ? t.secondReadingPartial(maxUse) : t.secondReading(maxUse)}
          </p>
          {report.checks.length === 0 && report.unchecked.length === 0 && report.pending.length === 0 && report.conditions.length === 0 && (
            <p className="muted small">{t.nothing}</p>
          )}
          {report.checks.length > 0 && (
            <div className="detail-section">
              <div className="section-title with-switch">
                <span>{view === "substance" ? t.ceilings(report.checks.length) : t.materialsTitle(materials.length)}</span>
                <span className="view-switch right" role="radiogroup" aria-label={t.viewSwitch}>
                  {(["substance", "material"] as const).map((v) => (
                    <button key={v} type="button" role="radio" aria-checked={v === view} className={v === view ? "on" : ""} onClick={() => pick(v)}>
                      {t.views[v]}
                    </button>
                  ))}
                </span>
              </div>
              {substances.map((row) => (
                <SubstanceItem key={row.key} row={row} partial={report.partial} />
              ))}
              {materials.map((row) => (
                <MaterialItem key={row.key} row={row} />
              ))}
            </div>
          )}
          {report.unchecked.length > 0 && (
            <div className="detail-section">
              <div className="section-title amber">{t.unchecked(report.unchecked.length)}</div>
              {report.unchecked.map((name) => (
                <div key={name} className="detail-item">
                  <strong>{name}.</strong> {t.uncheckedWhy}
                </div>
              ))}
            </div>
          )}
          {report.pending.length > 0 && (
            <div className="detail-section">
              <div className="section-title amber">{t.pending(report.pending.length)}</div>
              {report.pending.map((p, i) => (
                <div key={i} className="detail-item">
                  <strong>{p.material}.</strong> {p.text}
                </div>
              ))}
            </div>
          )}
          {report.conditions.length > 0 && (
            <div className="detail-section">
              <div className="section-title">{t.conditions(report.conditions.length)}</div>
              {report.conditions.map((cond, i) => (
                <div key={i} className="detail-item">
                  <strong>{cond.material}.</strong> {cond.text}
                </div>
              ))}
            </div>
          )}
          <div className="detail-source">{t.source}</div>
        </div>
      )}
    </section>
  );
}
