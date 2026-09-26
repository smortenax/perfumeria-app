import { useState } from "react";
import { Ratio } from "../core/arith/ratio";
import type { Composition, Line, Part } from "../core/compose";
import { formatGrams, formatPercent } from "../core/display";
import type { IfraData, IfraReport } from "../core/ifra";
import type { Change } from "../core/model/formula";
import { texts } from "../i18n/es";
import { pouredText, pureText, shareText, weighingWarning } from "./format";

const t = texts.composition;

type Add = Extract<Change, { kind: "add" }>;
type Flag = { text: string; tone: "amber" | "grey" };

/**
 * The composition column (§10.1): a list ordered by %, product and % (P23),
 * with its base (§1.1). Only what cannot be kept quiet is marked (P23): what is
 * not checked, what has no data, conditions and weighing. The solvents and the
 * total go at the foot. As in the sketch (boceto 4).
 */
export function CompositionCard(props: {
  composition: Composition | null;
  lines: readonly Line[];
  adds: readonly Add[];
  report: IfraReport | null;
  ifra: IfraData;
}) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const comp = props.composition;
  const aromatic = comp ? comp.parts.filter((p) => !p.material.solvent) : [];
  const solvents = comp ? comp.parts.filter((p) => p.material.solvent) : [];

  const toggle = (key: string) => {
    const next = new Set(open);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setOpen(next);
  };

  const describe = (part: Part): { flags: Flag[]; lines: Array<[string, string]> } => {
    const m = part.material;
    const info = m.kind === "provisional" ? undefined : props.ifra.materials.get(m.key);
    const flags: Flag[] = [];
    const lines: Array<[string, string]> = [];

    const own = props.lines.filter((l) => l.material.key === m.key);
    lines.push([
      t.poured,
      own.length === 0
        ? t.insideFormula
        : own.map((l) => pouredText(l.massUg, l.fraction, l.diluent?.name)).join(" · "),
    ]);
    const aromaticShare = comp && !comp.aromaticUg.isZero() ? formatPercent(part.massUg.div(comp.aromaticUg), 2) : "";
    lines.push([t.pure, t.pureValue(pureText(part.massUg), aromaticShare)]);

    let ifraText: string;
    if (m.kind === "provisional") {
      ifraText = t.ifraProvisional;
      flags.push({ text: t.flags.unchecked, tone: "amber" });
    } else if (!info || info.status === "unchecked") {
      ifraText = t.ifraUnchecked;
      flags.push({ text: t.flags.unchecked, tone: "amber" });
    } else {
      const ownChecks = (props.report?.checks ?? []).filter((c) => info.substances.some((s) => s.key === c.substance.key && s.fraction !== null));
      const parts = ownChecks.map((c) =>
        t.ifraCeiling(formatPercent(c.substance.limit, 2), formatPercent(c.worstUg.div(props.report!.finalUg).div(c.substance.limit), 0)),
      );
      if (parts.length === 0) {
        parts.push(t.ifraFree);
      }
      ifraText = [...parts, ...(info.pending ?? []), ...info.conditions].join(" · ");
      if (info.pending?.length) {
        flags.push({ text: t.flags.pending, tone: "amber" });
      }
      if ((props.report?.checks ?? []).some((c) => c.unknownFrom.includes(m.name))) {
        flags.push({ text: t.flags.noData, tone: "amber" });
      }
      if (info.conditions.length > 0) {
        flags.push({ text: t.flags.condition, tone: "grey" });
      }
    }
    lines.push([t.ifra, ifraText]);

    const warnings = props.adds
      .filter((a) => a.material.key === m.key)
      .map((a) => weighingWarning(a.massUg))
      .filter((w): w is NonNullable<typeof w> => w !== null);
    if (warnings.length > 0) {
      const worst = warnings.find((w) => w.kind === "unweighable") ?? warnings[0];
      flags.push({ text: worst.kind === "unweighable" ? t.flags.unweighable : worst.text.replace(/^.*±/, "±").replace(/ \(.*$/, ""), tone: "grey" });
      lines.push([t.weighing, warnings.map((w) => w.text).join(" · ")]);
    }
    return { flags, lines };
  };

  return (
    <div className="card composition">
      <div className="composition-head">
        <span className="composition-title">{t.title}</span>
        <span className="muted small">{t.count(aromatic.length)}</span>
        <span className="muted tiny right">{t.base}</span>
      </div>
      <div className="composition-rows">
        {!comp || aromatic.length === 0 ? (
          <p className="muted small empty">{t.empty}</p>
        ) : (
          aromatic.map((part) => {
            const { flags, lines } = describe(part);
            const share = shareText(part.massUg, comp.totalUg);
            const isOpen = open.has(part.material.key);
            return (
              <div key={part.material.key}>
                <button type="button" className="row" aria-expanded={isOpen} title={share.exact} onClick={() => toggle(part.material.key)}>
                  <span className="row-name">{part.material.name}</span>
                  {flags.map((f) => (
                    <span key={f.text} className={`flag ${f.tone}`}>
                      {f.text}
                    </span>
                  ))}
                  <span className="num row-share">{share.text}</span>
                </button>
                {isOpen && (
                  <div className="row-detail">
                    {lines.map(([k, v]) => (
                      <div key={k} className="detail-line">
                        <span className="detail-key">{k}</span>
                        <span className="detail-value">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="composition-foot">
        <div className="foot-main">
          <span>{t.aromatic}</span>
          <span className="num">{comp && !comp.totalUg.isZero() ? formatPercent(comp.aromaticUg.div(comp.totalUg), 2) : "—"}</span>
        </div>
        <div className="foot-sub">
          {comp &&
            !comp.totalUg.isZero() &&
            solvents.map((s) => (
              <span key={s.material.key}>
                {s.material.name} <span className="num">{formatPercent(s.massUg.div(comp.totalUg), 2)}</span>
              </span>
            ))}
          <span className="right muted">
            {t.total} <span className="num">{formatGrams(comp?.totalUg ?? Ratio.ZERO, 3)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
