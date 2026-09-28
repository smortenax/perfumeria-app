import { Ratio } from "../core/arith/ratio";
import { formatGrams, formatPercent } from "../core/display";
import type { IfraReport, SubstanceCheck } from "../core/ifra";
import { texts } from "../i18n/es";

const t = texts.ifra;

/**
 * The IFRA box: two lines, the two readings (§5.4, P23). Never green with
 * something unknown (§5.5); a bounded load is its own state (P31). On hover of
 * the second reading, the range from what is known to the worst case (P31).
 */
export function IfraSummary(props: { report: IfraReport | null; empty: boolean; open: boolean; onToggle: () => void }) {
  const { report } = props;
  const hasData = report !== null && !props.empty;
  const bounded = hasData && report.checks.some((c) => c.verdict === "bounded");
  const asIs = !hasData ? "—" : report.asIs === "no" ? t.no : report.asIs === "unknown" ? t.unknown : t.yes;
  const asIsClass = !hasData ? "" : report.asIs === "no" ? "bad" : report.asIs === "unknown" ? "unknown" : bounded ? "bounded" : "";
  const maxUse = !hasData ? "—" : formatPercent(report.maxUse, report.maxUse.eq(Ratio.ONE) ? 0 : 2);
  // What sets the second reading, so a figure under 100 % says why.
  const limiting = hasData && report.maxUse.lt(Ratio.ONE) ? report.checks.find((c) => c.maxUse.eq(report.maxUse)) : undefined;
  const range =
    hasData && !report.maxUseKnown.eq(report.maxUse) ? t.range(formatPercent(report.maxUse, 2), formatPercent(report.maxUseKnown, 2)) : undefined;
  return (
    <button type="button" className="card ifra-summary" aria-expanded={props.open} onClick={props.onToggle}>
      <span className="ifra-head">
        <span className="ifra-title">{t.title}</span>
        <span className="muted small">{t.category}</span>
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
      {limiting && <span className="ifra-limit muted tiny">{t.limitedBy(limiting.substance.name)}</span>}
    </button>
  );
}

function CeilingRow(props: { check: SubstanceCheck; finalUg: Ratio }) {
  const { check, finalUg } = props;
  const pct = (ug: Ratio) => formatPercent(ug.div(finalUg), 3).replace(" %", "");
  // A prohibited substance has a ceiling of zero: any amount is over it.
  const banned = check.substance.limit.isZero();
  const limit = banned ? t.prohibited : formatPercent(check.substance.limit, 2);
  const value = check.worstUg.eq(check.knownUg) ? pct(check.knownUg) : `${pct(check.knownUg)}–${pct(check.worstUg)}`;
  const used = banned ? null : check.worstUg.div(finalUg).div(check.substance.limit);
  const width = used ? Math.min(100, Number(used.toFixed(4)) * 100) : 100;
  return (
    <div className="ceiling-row" title={check.worstUg.eq(check.knownUg) ? undefined : t.range(`${pct(check.knownUg)} %`, `${pct(check.worstUg)} %`)}>
      <span className="ceiling-name">{check.substance.name}</span>
      <span className="num ceiling-value">{t.of(value, limit)}</span>
      <span className="ceiling-bar">
        <span className={`fill ${check.verdict}`} style={{ width: `${width}%` }} />
      </span>
      <span className={`num ceiling-use ${check.verdict}`}>{used ? formatPercent(used, 0) : "—"}</span>
    </div>
  );
}

/** The detail, over the composition: ceilings, what is unchecked, pending and conditions. */
export function IfraDetail(props: { report: IfraReport; onClose: () => void }) {
  const { report } = props;
  const grams = formatGrams(report.finalBatchUg, 3);
  return (
    <div className="ifra-detail">
      <div className="detail-head">
        <span className="detail-title">{t.detailTitle}</span>
        <span className="muted small">{report.finalAssumed ? t.detailBaseAssumed(grams) : t.detailBase(grams)}</span>
        <button type="button" className="close" aria-label={t.close} title={t.close} onClick={props.onClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
          </svg>
        </button>
      </div>
      {report.checks.length === 0 && report.unchecked.length === 0 && report.pending.length === 0 && report.conditions.length === 0 && (
        <p className="muted small">{t.nothing}</p>
      )}
      {report.checks.length > 0 && (
        <div className="detail-section">
          <div className="section-title">{t.ceilings(report.checks.length)}</div>
          {report.checks.map((check) => (
            <CeilingRow key={check.substance.key} check={check} finalUg={report.finalUg} />
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
  );
}
