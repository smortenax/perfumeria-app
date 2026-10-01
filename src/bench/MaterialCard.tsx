import { Ratio } from "../core/arith/ratio";
import type { Composition } from "../core/compose";
import { formatMilligrams, formatPercent } from "../core/display";
import type { IfraData } from "../core/ifra";
import type { Material } from "../core/model/material";
import type { CatalogEntry } from "../data/catalog";
import { texts } from "../i18n/es";
import { familyLook } from "./family";
import { roomText } from "./composition-ifra";
import { amountText, initials, massText, shareText } from "./format";
import { IconText, iconLength } from "./Icon";
import { carriedOf, USAGE_DECADES, usagePosition } from "./material-card";
import type { Cap, MaterialIfra, Preview, UsageBand } from "./usage-bar";
import { bandOverIfra } from "./usage-bar";

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

const ifraT = texts.composition;

type Tone = "neutral" | "amber" | "red";

/**
 * «Margen IFRA» (P57): what still fits of the material poured pure, in mg, counting what the other
 * materials already add to the same substances, in the base of the report (P58). Never a figure
 * when it cannot be checked (§1.2); amber when it could be optimistic; red with nothing left.
 */
function MarginBox(props: { ifra: MaterialIfra | null }) {
  const { ifra } = props;
  if (!ifra) {
    return (
      <div className="mc-box" title={t.noData}>
        <span className="mc-box-label">{t.margin}</span>
        <span className="num mc-box-value">{t.noValue}</span>
        <span className="mc-box-note">{t.noData}</span>
      </div>
    );
  }
  if (ifra.status === "unknown") {
    return (
      <div className="mc-box filled tone-amber" title={t.uncheckedHelp}>
        <span className="mc-box-label">{t.margin}</span>
        <span className="mc-box-value small">{t.unchecked}</span>
      </div>
    );
  }
  const none = ifra.marginUg !== null && ifra.marginUg.isZero();
  const tone: Tone = none ? "red" : ifra.partial ? "amber" : "neutral";
  const base = ifraT.ifraBases[ifra.base];
  const value =
    ifra.marginUg === null ? t.marginNoCeiling : none ? t.marginNone : t.marginRoom(`${ifra.partial ? "≤ " : ""}${roomText(ifra.marginUg)}`);
  return (
    <div className={`mc-box filled tone-${tone}`} title={[t.marginHelp(base), ifra.partial ? t.partialCap : null].filter(Boolean).join(". ")}>
      <span className="mc-box-label">{t.margin}</span>
      <span className="num mc-box-value small">{value}</span>
      <span className="mc-box-note">{base}</span>
    </div>
  );
}

/** A place on the strip, 0 to 1: a share of zero is the left edge, since a log scale has no zero. */
const placeOf = (share: Ratio | null): number | null => (share === null ? null : share.isZero() ? 0 : usagePosition(share));

/** What the strip draws at one of its marks: where, and what it says on hover. */
interface Mark {
  readonly at: number;
  readonly title: string;
  readonly tone: Tone;
}

/** A ceiling of the strip as a mark, or null when the material has none or it has no place on the strip. */
function capMark(
  cap: Cap | null,
  title: (share: string, mass: string, substance: string, base: string) => string,
  ifra: Extract<MaterialIfra, { status: "ok" }>,
  substanceName: (key: string) => string,
): Mark | null {
  const at = cap ? placeOf(cap.share) : null;
  if (!cap || cap.share === null || at === null) {
    return null;
  }
  const share = cap.share.isZero() ? t.zeroCap : formatPercent(cap.share, 3);
  const text = [title(share, massText(cap.totalUg), substanceName(cap.limitedBy), ifraT.ifraBases[ifra.base]), ifra.partial ? t.partialCap : null]
    .filter(Boolean)
    .join(". ");
  return { at, title: text, tone: cap.share.isZero() ? "red" : ifra.partial ? "amber" : "neutral" };
}

/**
 * «Uso habitual»: a strip from 0,001 % to 100 % of the aromatic matter on a log scale, with four
 * variables (P57, P59): the band of the recommended use, tinted softly (it says «sin dato» until
 * the data comes); the IFRA ceiling of the material alone, a triangle from above; the IFRA ceiling
 * with what the others add, a triangle from below; and what the formula carries, a bar. While
 * typing, a fourth mark, hollow, shows where the pour would leave it. No ceiling, no triangles;
 * unknown, a notice, never green (§1.2).
 */
function UsageBox(props: {
  band: UsageBand | undefined;
  ifra: MaterialIfra | null;
  holds: { at: number; title: string } | null;
  draft: Mark | null;
  substanceName: (key: string) => string;
}) {
  const { band, ifra, holds, draft } = props;
  const ok = ifra?.status === "ok" ? ifra : null;
  const solo = ok ? capMark(ok.solo, t.soloTitle, ok, props.substanceName) : null;
  const all = ok ? capMark(ok.aggregate, t.allTitle, ok, props.substanceName) : null;
  const low = band?.min ? placeOf(band.min) : null;
  const high = band ? placeOf(band.max) : null;
  const lowText = band?.min ? formatPercent(band.min, 3) : null;
  const bandText = band ? t.band(lowText, formatPercent(band.max, 3)) : null;
  const recommendation = band?.recommendation === true;
  const bandTitle = band ? t.bandTitle(lowText, formatPercent(band.max, 3), band.fuente, recommendation) : null;
  // The use ceiling is a small diamond of its own, apart from IFRA's triangles.
  const ceilingAt = band?.ceiling ? placeOf(band.ceiling.value) : null;
  const ceilingTitle = band?.ceiling ? t.ceilingTitle(formatPercent(band.ceiling.value, 3), band.ceiling.fuente) : null;
  const overIfra = bandOverIfra(band, ifra);
  const label = [t.usage, bandTitle ?? t.noData, overIfra ? t.overIfra : null, ceilingTitle, solo?.title, all?.title, holds?.title, draft?.title].filter(Boolean).join(". ");
  return (
    <div className="mc-box usage" title={t.usageHelp}>
      <span className="mc-box-head">
        <span className="mc-box-label">{t.usage}</span>
        <span className={overIfra ? "mc-box-note over-ifra" : "mc-box-note"} title={overIfra ? `${t.overIfra} ${bandTitle ?? ""}` : (bandTitle ?? undefined)}>
          {overIfra ? "⚑ " : ""}
          {bandText ?? t.noData}
        </span>
      </span>
      <span className={band ? "usage-strip with-band" : "usage-strip"} role="img" aria-label={label}>
        {/* A tick each decade: six of them from 0,001 % to 100 %. */}
        {Array.from({ length: USAGE_DECADES + 1 }, (_, i) => (
          <span key={i} className="usage-tick" style={{ left: `${(i / USAGE_DECADES) * 100}%` }} />
        ))}
        {band && high !== null && (
          <span
            className={recommendation ? "usage-band recommendation" : "usage-band"}
            style={{ left: `${(low ?? 0) * 100}%`, width: `${(high - (low ?? 0)) * 100}%` }}
            title={bandTitle ?? undefined}
          />
        )}
        {ceilingAt !== null && <span className="usage-ceiling" style={{ left: `${ceilingAt * 100}%` }} title={ceilingTitle ?? undefined} />}
        {holds && <span className="usage-mark" style={{ left: `${holds.at * 100}%` }} title={holds.title} />}
        {draft && <span className={`usage-mark draft tone-${draft.tone}`} style={{ left: `${draft.at * 100}%` }} title={draft.title} />}
        {solo && <span className={`usage-cap solo tone-${solo.tone}`} style={{ left: `${solo.at * 100}%` }} title={solo.title} />}
        {all && <span className={`usage-cap all tone-${all.tone}`} style={{ left: `${all.at * 100}%` }} title={all.title} />}
      </span>
      <span className="usage-scale" aria-hidden="true">
        <span>{t.usageFrom}</span>
        <span className="usage-base">{t.usageBase}</span>
        <span>{t.usageTo}</span>
      </span>
      <span className="usage-legend">
        {ifra?.status === "unknown" ? (
          <span className="legend-unchecked" title={t.uncheckedHelp}>
            {t.unchecked}
          </span>
        ) : (
          <>
            {solo && (
              <span>
                <i className="sw solo" />
                {t.legendSolo}
              </span>
            )}
            {all && (
              <span>
                <i className="sw all" />
                {t.legendAll}
              </span>
            )}
            {ceilingAt !== null && (
              <span title={ceilingTitle ?? undefined}>
                <i className="sw ceiling" />
                {t.legendCeiling}
              </span>
            )}
            {holds && (
              <span>
                <i className="sw holds" />
                {t.legendHolds}
              </span>
            )}
            {draft && (
              <span>
                <i className={`sw draft tone-${draft.tone}`} />
                {t.legendDraft}
              </span>
            )}
          </>
        )}
      </span>
    </div>
  );
}

/** What the pour being typed would break, worded (P57): empty when nothing. */
export function draftWarnings(draft: Preview): string[] {
  const names = (list: Preview["breaks"]) => list.map((b) => b.name).join(", ");
  return [
    ...(draft.breaks.length > 0 ? [t.draftBreaks(names(draft.breaks))] : []),
    ...(draft.worsens.length > 0 ? [t.draftWorsens(names(draft.worsens))] : []),
  ];
}

/**
 * The card of the material chosen in the add bar (P57), under it and as wide: who it is, what the
 * formula carries of it, and, as marked holes until their data comes, its IFRA margin and its
 * usual use (E5, E6). It keeps the material after it is added, to see what it changed.
 */
export function MaterialCard(props: {
  material: Material | null;
  entry?: CatalogEntry | undefined;
  composition: Composition | null;
  /** The IFRA of the material in the formula as it stands (P57); null while it could not be worked out. */
  ifra?: MaterialIfra | null;
  /** The band of the recommended use, when the data brings it (E6, P59). */
  band?: UsageBand | undefined;
  /** What adding the pour being typed would do (P57); null when nothing is being typed. */
  draft?: Preview | null;
  /** IFRA data, for the names of the substances. */
  data: IfraData;
}) {
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
  // The fourth mark (P57): where the pour being typed would leave the material, red if it breaks a ceiling.
  const { draft } = props;
  const draftAt = draft ? placeOf(draft.share) : null;
  const draftBroken = draft ? draft.breaks.length > 0 || draft.worsens.length > 0 : false;
  const draftMark: Mark | null =
    draft && draft.share !== null && draftAt !== null
      ? {
          at: draftAt,
          tone: draftBroken ? "red" : props.ifra?.status === "ok" && props.ifra.partial ? "amber" : "neutral",
          title: [t.draftTitle(formatPercent(draft.share, 3)), ...draftWarnings(draft)].join(". "),
        }
      : null;
  const substanceName = (key: string) => props.data.substances.get(key)?.name ?? key;
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
      <MarginBox ifra={props.ifra ?? null} />
      <UsageBox band={props.band} ifra={props.ifra ?? null} holds={holds} draft={draftMark} substanceName={substanceName} />
    </div>
  );
}
