import { Ratio } from "../core/arith/ratio";
import type { Composition } from "../core/compose";
import { formatMilligrams, formatPercent } from "../core/display";
import type { Material } from "../core/model/material";
import type { CatalogEntry } from "../data/catalog";
import { texts } from "../i18n/es";
import { familyLook } from "./family";
import { amountText, initials, shareText } from "./format";
import { IconText, iconLength } from "./Icon";
import { carriedOf, USAGE_DECADES, usagePosition } from "./material-card";

const t = texts.materialCard;
const search = texts.addBar;

/**
 * The material with its abbreviation in the colour of its family, as the search shows it (P48),
 * and its names, CAS and state against IFRA, with the search's own pills and texts (§4, P56).
 */
function Identity(props: { material: Material; entry: CatalogEntry | undefined }) {
  const { material, entry } = props;
  // A material outside the glossary has no abbreviation: its initials, as in the history dock.
  const icon = entry ? { text: entry.icon, mark: entry.iconMark, type: entry.iconType } : { text: initials(material.name), mark: undefined, type: undefined };
  const look = familyLook(entry?.family);
  const chipTitle = entry && entry.code !== entry.icon ? `${entry.code} · ${look.title}` : look.title;
  // Under the user's name, the glossary's when it is another (P56); after it, the chemical name
  // that stays beside a trade name (P38), which is the first to be cut when the line is short.
  const glossaryName = entry && entry.material.name !== material.name ? entry.material.name : undefined;
  const names = [glossaryName ? search.inGlossary(glossaryName) : undefined, entry?.tradeName ? entry.chemicalName : undefined]
    .filter((name): name is string => name !== undefined)
    .join(" · ");
  const cas = entry?.cas ?? material.cas;
  const tag = material.kind === "formula" ? t.kind.formula : material.kind === "provisional" ? t.kind.provisional : entry?.group === "diluent" ? t.kind.diluent : null;
  const long = iconLength(icon.text, icon.mark) > 4;
  return (
    <div className="mc-identity">
      <span className={`code-chip ${long ? "long " : ""}${look.className}`} style={look.style} title={chipTitle}>
        <IconText text={icon.text} mark={icon.mark} type={icon.type} />
      </span>
      <span className="mc-names">
        <span className="mc-name" title={material.name}>
          {material.name}
        </span>
        {names && (
          <span className="mc-sub" title={names}>
            {names}
          </span>
        )}
        <span className="mc-ids">
          {cas && <span className="num cas">{cas}</span>}
          {tag && <span className="pill">{tag}</span>}
          {entry?.state && (
            <span className={`state state-${entry.state}`} title={search.stateHelp[entry.state]}>
              {search.state[entry.state]}
            </span>
          )}
        </span>
      </span>
    </div>
  );
}

/** «Margen IFRA», with its final design and no data yet: a marked hole, never a figure that looks like one (§1.2). */
function MarginBox() {
  return (
    <div className="mc-box" title={t.marginHelp}>
      <span className="mc-box-label">{t.margin}</span>
      <span className="num mc-box-value">{t.noValue}</span>
      <span className="mc-box-note">{t.noData}</span>
    </div>
  );
}

/**
 * «Uso habitual»: a strip from 0,001 % to 100 % of the aromatic matter on a log scale, with a mark
 * for what the formula carries. The band of the usual use goes on the strip once there is data;
 * until then it says so (P57, P59).
 */
function UsageBox(props: { mark: { at: number; title: string } | null }) {
  return (
    <div className="mc-box usage" title={t.usageHelp}>
      <span className="mc-box-head">
        <span className="mc-box-label">{t.usage}</span>
        <span className="mc-box-note">{t.noData}</span>
      </span>
      <span className="usage-strip" role="img" aria-label={[t.usage, t.noData, props.mark?.title].filter(Boolean).join(". ")}>
        {/* A tick each decade: six of them from 0,001 % to 100 %. */}
        {Array.from({ length: USAGE_DECADES + 1 }, (_, i) => (
          <span key={i} className="usage-tick" style={{ left: `${(i / USAGE_DECADES) * 100}%` }} />
        ))}
        {props.mark && <span className="usage-mark" style={{ left: `${props.mark.at * 100}%` }} title={props.mark.title} />}
      </span>
      <span className="usage-scale" aria-hidden="true">
        <span>{t.usageFrom}</span>
        <span className="usage-base">{t.usageBase}</span>
        <span>{t.usageTo}</span>
      </span>
    </div>
  );
}

/**
 * The card of the material chosen in the add bar (P57), under it and as wide: who it is, what the
 * formula carries of it, and, as marked holes until their data comes, its IFRA margin and its
 * usual use (E5, E6). It keeps the material after it is added, to see what it changed.
 */
export function MaterialCard(props: { material: Material | null; entry?: CatalogEntry | undefined; composition: Composition | null }) {
  const { material } = props;
  if (!material) {
    return (
      <div className="card material-card idle">
        <span className="muted small">{t.choose}</span>
      </div>
    );
  }
  const carried = carriedOf(props.composition, material);
  // Nothing carried is a known zero, said plainly: «0 mg», «0 %», not «0 ppm» of the trace format.
  const mass = carried.pureUg.isZero() ? formatMilligrams(Ratio.ZERO) : amountText(carried.pureUg);
  const share = carried.countedUg.isZero()
    ? { text: formatPercent(Ratio.ZERO, 0), exact: formatPercent(Ratio.ZERO, 0) }
    : shareText(carried.countedUg, carried.baseUg);
  // Where the formula stands on the strip: of the aromatic matter only, which is the strip's base.
  const at = carried.base === "aromatic" && !carried.baseUg.isZero() ? usagePosition(carried.countedUg.div(carried.baseUg)) : null;
  const holds = at === null ? null : { at, title: t.holds(share.text) };
  return (
    <div className="card material-card">
      <Identity material={material} entry={props.entry} />
      <div className="mc-carried">
        <span className="label">{t.inFormula}</span>
        <span className="num mc-mass" title={texts.composition.amountHelp}>
          {mass}
        </span>
        <span className="mc-share" title={share.exact}>
          {carried.base === "aromatic" ? t.ofAromatic(share.text) : t.ofBottle(share.text)}
        </span>
      </div>
      <MarginBox />
      <UsageBox mark={holds} />
    </div>
  );
}
