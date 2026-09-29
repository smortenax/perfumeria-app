import { useState } from "react";
import type { Composition, Line, Part } from "../core/compose";
import { formatPercent } from "../core/display";
import type { IfraData, IfraReport } from "../core/ifra";
import type { Change } from "../core/model/formula";
import type { Material } from "../core/model/material";
import type { MaterialFamily } from "../data/catalog";
import { texts } from "../i18n/es";
import { familyLook, familyText } from "./family";
import { amountText, pouredText, pureText, shareText, weighingWarning } from "./format";

const t = texts.composition;

type Add = Extract<Change, { kind: "add" }>;
type Flag = { text: string; tone: "amber" | "grey" };

/**
 * The composition column (§10.1): a list ordered by %, product and % (P23),
 * with its base (§1.1): the aromatic matter, never the bottle, which goes under
 * the bottle (P49). Only what cannot be kept quiet is marked (P23): what is
 * not checked, what has no data, conditions and weighing. Beside the %, the pure
 * mass it stands for; on the left, a «+» that takes the material to the add bar,
 * for tweaking without typing it again. As in the sketch (boceto 4).
 */
export function CompositionCard(props: {
  composition: Composition | null;
  lines: readonly Line[];
  adds: readonly Add[];
  report: IfraReport | null;
  ifra: IfraData;
  /** The chemical name of a material named by its trade name (P38). */
  chemicalOf?: (key: string) => string | undefined;
  /** Each line shows the family of its material (P48). */
  familyOf?: (key: string) => MaterialFamily | undefined;
  /** Takes the material to the add bar, to add it again. */
  onAgain?: (material: Material) => void;
}) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const comp = props.composition;
  const aromatic = comp ? comp.parts.filter((p) => !p.material.solvent) : [];

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

    const chemicalName = props.chemicalOf?.(m.key);
    if (chemicalName) {
      lines.push([t.chemical, chemicalName]);
    }
    lines.push([t.family, familyText(props.familyOf?.(m.key))]);
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
        c.substance.limit.isZero()
          ? t.ifraProhibited(c.substance.name)
          : t.ifraCeiling(formatPercent(c.substance.limit, 2), formatPercent(c.worstUg.div(props.report!.finalUg).div(c.substance.limit), 0)),
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
            // Of the aromatic matter only (P49): the bottle's split goes under the bottle.
            const share = shareText(part.massUg, comp.aromaticUg);
            const isOpen = open.has(part.material.key);
            return (
              <div key={part.material.key}>
                <div className="row-line">
                  {props.onAgain && (
                    <button
                      type="button"
                      className="again"
                      title={t.again(part.material.name)}
                      aria-label={t.again(part.material.name)}
                      onClick={() => props.onAgain?.(part.material)}
                    >
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M8 3v10M3 8h10" />
                      </svg>
                    </button>
                  )}
                  <button type="button" className="row" aria-expanded={isOpen} title={share.exact} onClick={() => toggle(part.material.key)}>
                    {(() => {
                      const look = familyLook(props.familyOf?.(part.material.key));
                      return <span className={`fam-mark ${look.className}`} style={look.style} title={look.title} />;
                    })()}
                    <span className="row-name">{part.material.name}</span>
                    {flags.map((f) => (
                      <span key={f.text} className={`flag ${f.tone}`}>
                        {f.text}
                      </span>
                    ))}
                    <span className="num row-amount" title={t.amountHelp}>
                      {amountText(part.massUg)}
                    </span>
                    <span className="num row-share">{share.text}</span>
                  </button>
                </div>
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
    </div>
  );
}
