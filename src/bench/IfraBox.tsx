import { useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { formatPercent } from "../core/display";
import type { IfraReport } from "../core/ifra";
import { texts } from "../i18n/es";

const t = texts.ifra;

/**
 * The IFRA box: two lines, the two readings (§5.4, P23). Never green with
 * something unknown (§5.5); a bounded load is not "within" (P31); on hover,
 * the range from what is known to the worst case (P31).
 */
export function IfraBox(props: { report: IfraReport | null; empty: boolean }) {
  const [open, setOpen] = useState(false);
  const { report } = props;
  if (!report || props.empty) {
    return (
      <section className="ifra">
        <h3>{t.title}</h3>
        <p className="muted">{t.nothing}</p>
      </section>
    );
  }

  const bounded = report.checks.some((c) => c.verdict === "bounded");
  const asIs =
    report.asIs === "no"
      ? { cls: "bad", text: t.no }
      : report.asIs === "unknown"
        ? { cls: "unknown", text: t.unknown }
        : bounded
          ? { cls: "bounded", text: t.yesBounded }
          : { cls: "good", text: t.yes };
  const maxUse = report.maxUse.eq(Ratio.ONE) ? t.noCeiling : t.upTo(formatPercent(report.maxUse, 2));
  const range = report.maxUseKnown.eq(report.maxUse)
    ? undefined
    : t.range(formatPercent(report.maxUse, 2), formatPercent(report.maxUseKnown, 2));
  const pct = (ug: Ratio) => formatPercent(ug.div(report.finalUg), 3);

  return (
    <section className="ifra">
      <h3>{t.title}</h3>
      <div className="ifra-line">
        <span>{t.asIsQuestion}</span>
        <strong className={`verdict ${asIs.cls}`}>{asIs.text}</strong>
      </div>
      <div className="ifra-line" title={range}>
        <span>{t.maxUseQuestion}</span>
        <strong className={report.partial ? "verdict unknown" : "verdict neutral"}>
          {maxUse}
          {report.partial && <small> · {t.knownOnly}</small>}
        </strong>
      </div>
      {report.finalAssumed && <p className="muted small">{t.finalAssumed}</p>}
      <button type="button" className="link" onClick={() => setOpen(!open)}>
        {open ? t.hideDetails : t.details}
      </button>
      {open && (
        <div className="ifra-details">
          {report.checks.length > 0 && (
            <ul className="checks">
              {report.checks.map((c) => (
                <li key={c.substance.key}>
                  <div className="check-line">
                    <span className="check-name">{c.substance.name}</span>
                    <span className={`badge ${c.verdict}`}>{t.verdict[c.verdict]}</span>
                    <span className="num" title={c.worstUg.eq(c.knownUg) ? undefined : t.range(pct(c.knownUg), pct(c.worstUg))}>
                      {c.worstUg.eq(c.knownUg) ? pct(c.knownUg) : `${pct(c.knownUg)} – ${pct(c.worstUg)}`}
                    </span>
                  </div>
                  <div className="muted small">
                    {t.ceiling} {formatPercent(c.substance.limit, 2)}
                    {c.unknownFrom.length > 0 && ` · ${t.from} ${c.unknownFrom.join(", ")}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {report.unchecked.length > 0 && (
            <div>
              <h4>{t.unchecked}</h4>
              <p className="small">{report.unchecked.join(" · ")}</p>
            </div>
          )}
          {report.pending.length > 0 && (
            <div>
              <h4>{t.pending}</h4>
              <ul className="small">
                {report.pending.map((p, i) => (
                  <li key={i}>
                    <strong>{p.material}</strong>: {p.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.conditions.length > 0 && (
            <div>
              <h4>{t.conditions}</h4>
              <ul className="small">
                {report.conditions.map((c, i) => (
                  <li key={i}>
                    <strong>{c.material}</strong>: {c.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
