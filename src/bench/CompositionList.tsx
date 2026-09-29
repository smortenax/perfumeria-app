import { useState } from "react";
import type { Composition, Line, Part } from "../core/compose";
import { formatPercent } from "../core/display";
import type { IfraBase, IfraData, IfraReport } from "../core/ifra";
import type { Change } from "../core/model/formula";
import type { Material } from "../core/model/material";
import type { MaterialFamily } from "../data/catalog";
import { texts } from "../i18n/es";
import { describeLineIfra, detailOfLineIfra, type LineIfra } from "./composition-ifra";
import { familyLook, familyText } from "./family";
import { amountText, initials, pouredText, pureText, shareText, weighingWarning } from "./format";
import { IconText, iconLength } from "./Icon";

const t = texts.composition;

type Add = Extract<Change, { kind: "add" }>;
type Flag = { text: string; tone: "amber" | "grey" };
type View = "aromatic" | "bottle";

/**
 * The base the composition was last read in (P57): it stays for the session, across benches,
 * and is not written to disk. The aromatic matter is the way in, as the composition is the
 * view of the smell (P49).
 */
let rememberedView: View = "aromatic";

/**
 * The composition column (§10.1): a list ordered by %, product and % (P23),
 * with its base (§1.1): the aromatic matter by default, or the bottle (P57). Only what
 * cannot be kept quiet is marked (P23): what is not checked, what has no data, conditions
 * and weighing. Beside the %, the pure mass it stands for; on the left, a «+» that takes the
 * material to the add bar, for tweaking without typing it again. As in the sketch (boceto 4).
 *
 * P57: each line carries its material's icon in the colour of its family, so the name can be
 * cut without losing which material it is, and how much of its IFRA ceiling it carries, in
 * % and in grams (`lineIfra`, worked out once outside by `ifraOfLines`). A switch in the head
 * reads the % on the aromatic matter (the default) or on the bottle, where the diluents show
 * too; the base said in the head changes with it (§1.1).
 */
export function CompositionCard(props: {
  composition: Composition | null;
  lines: readonly Line[];
  adds: readonly Add[];
  report: IfraReport | null;
  ifra: IfraData;
  /** The IFRA of each material by its key, in `ifraBase` (P57): nothing is worked out here. */
  lineIfra?: ReadonlyMap<string, LineIfra>;
  /** The IFRA base `lineIfra` was worked out in, by default that of the report (P58): the panel will choose it. */
  ifraBase?: IfraBase;
  /** The icon of a material, as the search shows it; without it, the initials of its name (P57). */
  iconOf?: (key: string) => { text: string; mark?: string; type?: string } | undefined;
  /** The chemical name of a material named by its trade name (P38). */
  chemicalOf?: (key: string) => string | undefined;
  /** The glossary's name, said when the user knows the material by another (P56). */
  glossaryNameOf?: (key: string) => string | undefined;
  /** Each line shows the family of its material (P48). */
  familyOf?: (key: string) => MaterialFamily | undefined;
  /** Takes the material to the add bar, to add it again. */
  onAgain?: (material: Material) => void;
}) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [view, setViewState] = useState<View>(rememberedView);
  const setView = (next: View) => {
    rememberedView = next;
    setViewState(next);
  };
  const comp = props.composition;
  const aromatic = comp ? comp.parts.filter((p) => !p.material.solvent) : [];
  // In the bottle the diluents are lines too, and the % is over everything in it (§1.1).
  const shown = comp ? (view === "bottle" ? comp.parts : aromatic) : [];
  const baseUg = comp ? (view === "bottle" ? comp.totalUg : comp.aromaticUg) : null;

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

    const glossaryName = props.glossaryNameOf?.(m.key);
    if (glossaryName && glossaryName !== m.name) {
      lines.push([t.glossaryName, glossaryName]);
    }
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
    // A diluent is no aromatic matter: its share is the bottle's, the only one it has (P49, P57).
    lines.push([
      t.pure,
      m.solvent
        ? t.pureValueBottle(pureText(part.massUg), comp && !comp.totalUg.isZero() ? formatPercent(part.massUg.div(comp.totalUg), 2) : "")
        : t.pureValue(pureText(part.massUg), comp && !comp.aromaticUg.isZero() ? formatPercent(part.massUg.div(comp.aromaticUg), 2) : ""),
    ]);

    let ifraText: string;
    if (m.solvent && m.kind === "base" && !props.ifra.materials.has(m.key)) {
      // A diluent of the app with nothing to check: it is left out of the check, not unchecked (§5.2).
      ifraText = t.ifraDiluent;
    } else if (m.kind === "provisional") {
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
    // The margin and the closest ceiling, in the base they were worked out in (P57, P58).
    lines.push(...detailOfLineIfra(props.lineIfra?.get(m.key)));

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
        <span className="view-switch right" role="radiogroup" aria-label={t.viewLabel}>
          {(["aromatic", "bottle"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              className={view === v ? "on" : ""}
              title={v === "aromatic" ? t.viewAromaticHelp : t.viewBottleHelp}
              onClick={() => setView(v)}
            >
              {v === "aromatic" ? t.viewAromatic : t.viewBottle}
            </button>
          ))}
        </span>
        {/* Every number goes with its base (§1.1): the head says the one the list is in. */}
        <span className="composition-base muted tiny">{view === "aromatic" ? t.baseAromatic : t.baseBottle}</span>
      </div>
      <div className="composition-rows">
        {!comp || baseUg === null || shown.length === 0 ? (
          <p className="muted small empty">{t.empty}</p>
        ) : (
          shown.map((part) => {
            const { flags, lines } = describe(part);
            const share = shareText(part.massUg, baseUg);
            const isOpen = open.has(part.material.key);
            const look = familyLook(props.familyOf?.(part.material.key));
            // A material outside the glossary has no abbreviation: its initials, as in the history dock.
            const icon = props.iconOf?.(part.material.key) ?? { text: initials(part.material.name) };
            const ifra = describeLineIfra(props.lineIfra?.get(part.material.key));
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
                    <span
                      className={`code-chip ${iconLength(icon.text, icon.mark) > 4 ? "long " : ""}${look.className}`}
                      style={look.style}
                      title={look.title}
                    >
                      <IconText text={icon.text} mark={icon.mark} type={icon.type} />
                    </span>
                    <span className="row-main">
                      <span className="row-name" title={part.material.name}>
                        {part.material.name}
                      </span>
                      {flags.map((f) => (
                        <span key={f.text} className={`flag ${f.tone}`}>
                          {f.text}
                        </span>
                      ))}
                    </span>
                    <span className="num row-amount" title={t.amountHelp}>
                      {amountText(part.massUg)}
                    </span>
                    <span className="num row-share">{share.text}</span>
                    {ifra && (
                      <span className={`row-ifra ${ifra.tone}`} title={ifra.title}>
                        {ifra.share && (
                          <span className="num">
                            {t.ifraShort} {ifra.share}
                          </span>
                        )}
                        {ifra.share && ifra.room && " · "}
                        {ifra.room && <span className="num">{ifra.room}</span>}
                      </span>
                    )}
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
