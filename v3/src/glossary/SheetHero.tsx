import type { ReactNode } from "react";
import { type Catalog, type CatalogMaterial, STRENGTHS, TIERS } from "../db/catalog";
import { coloursOf, familyOf } from "../families/palette";
import { texts } from "../i18n/en";
import { orbLookOf, orbScalesOf, seedOf } from "./orb/fromCatalog";
import { MaterialOrb } from "./orb/MaterialOrb";

/** A duration on a blotter on a log scale, 1 hour to 30 days. */
const MAX_HOURS = 24 * 30;
const durationAt = (h: number) => Math.max(0, Math.min(1, Math.log(Math.max(h, 1)) / Math.log(MAX_HOURS))) * 100;

/**
 * The head of a material's sheet (V3-73, after the revamp prototype): its orb, live and framed, with
 * what each part of it draws said in words under it; beside it, the name, its chips, the four facts
 * that tell materials apart (family, strength, duration on a blotter, note) and the actions. The orb
 * is decorative (aria-hidden): everything it shows is in the words, and what the data does not say
 * reads so (§1.2).
 */
export function SheetHero({ catalog, material, name, chips, actions }: { catalog: Catalog; material: CatalogMaterial; name: string; chips: ReactNode; actions: ReactNode }) {
  const t = texts.glossary.orb;
  const h = texts.glossary.hero;
  const look = orbLookOf(catalog, material, orbScalesOf(catalog));
  const base = material.basedOnId ? catalog.materials.get(material.basedOnId) : undefined;
  const family = familyOf(catalog, material);
  const colours = coloursOf(catalog, material);
  const strength = material.strength ?? base?.strength ?? null;
  const tier = material.tier ?? base?.tier ?? null;
  const kind = material.ownerId !== null && base ? base.kind : material.kind;
  const hours = look.durationHours;
  const facts: Array<[string, string | null]> = [
    [t.family, family ? texts.sheet.families[family] : null],
    [t.intensity, strength ? `${texts.sheet.strengths[strength]} (${t.byRank})` : null],
    [t.contour, texts.kinds[kind]],
    [t.note, tier ? texts.sheet.tiers[tier] : null],
    [t.drift, hours !== undefined ? t.hours(String(hours).replace(".", ",")) : null],
    [t.diffusion, null],
    [t.luminosity, null],
  ];
  return (
    <section className="sheet-hero">
      <div className="hero-orb">
        <MaterialOrb look={look} size={220} mode="live" seed={seedOf(material.id)} expectColor={colours?.light} />
        <dl className="orb-facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={value ? undefined : "unknown"}>{value ?? t.noData}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="hero-info">
        <h2 className="page-title">{name}</h2>
        <div className="chips">{chips}</div>
        <div className="glance">
          <div>
            <h3>{h.family}</h3>
            {family ? (
              <span className="big">
                {colours && <span className="dot" style={{ background: colours.light }} aria-hidden="true" />} {texts.sheet.families[family]}
              </span>
            ) : (
              <span className="unknown">{texts.sheet.unknown}</span>
            )}
          </div>
          <div>
            <h3>{h.strength}</h3>
            {strength ? (
              <>
                <span className="big">{texts.sheet.strengths[strength]}</span>
                <span className="meter" role="img" aria-label={h.strengthOf(texts.sheet.strengths[strength])}>
                  {STRENGTHS.map((s, i) => (
                    <i key={s} className={i <= STRENGTHS.indexOf(strength) ? "on" : ""} />
                  ))}
                </span>
              </>
            ) : (
              <span className="unknown">{texts.sheet.unknown}</span>
            )}
          </div>
          <div>
            <h3>{h.strip}</h3>
            {hours !== undefined ? (
              <>
                <span className="big num">{h.duration(hours)}</span>
                <span className="dur" role="img" aria-label={h.durationOn(h.duration(hours))}>
                  <span className="track" />
                  <span className="fill" style={{ width: `${durationAt(hours)}%` }} />
                  <span className="tick start" style={{ left: 0 }}>1 h</span>
                  <span className="tick" style={{ left: `${durationAt(24)}%` }}>1 day</span>
                  <span className="tick" style={{ left: `${durationAt(168)}%` }}>1 week</span>
                </span>
                <span className="dur-cap">{h.logScale}</span>
              </>
            ) : (
              <span className="unknown">{texts.sheet.unknown}</span>
            )}
          </div>
          <div>
            <h3>{h.note}</h3>
            <span className="notes-row" role="img" aria-label={tier ? texts.sheet.tiers[tier] : texts.sheet.unknown}>
              {TIERS.map((x) => (
                <span key={x} className={x === tier ? "on" : ""}>
                  {texts.sheet.tiers[x]}
                </span>
              ))}
            </span>
          </div>
        </div>
        <div className="hero-actions">{actions}</div>
      </div>
    </section>
  );
}
