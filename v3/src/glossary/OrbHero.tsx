import type { Catalog, CatalogMaterial } from "../db/catalog";
import { familyOf } from "../families/palette";
import { texts } from "../i18n/en";
import { orbLookOf, orbScalesOf, seedOf } from "./orb/fromCatalog";
import { MaterialOrb } from "./orb/MaterialOrb";

/**
 * The head of a material's sheet: its orb, live, and beside it in words what each part of the orb
 * draws (picks 2026-10-22 §4; prototype ahead of the sheet's redesign, F-13 L3). The orb is decorative
 * (aria-hidden): everything it shows is in the list, and what the data does not say reads so.
 */
export function OrbHero({ catalog, material }: { catalog: Catalog; material: CatalogMaterial }) {
  const t = texts.glossary.orb;
  const look = orbLookOf(catalog, material, orbScalesOf(catalog));
  const base = material.basedOnId ? catalog.materials.get(material.basedOnId) : undefined;
  const family = familyOf(catalog, material);
  const strength = material.strength ?? base?.strength ?? null;
  const tier = material.tier ?? base?.tier ?? null;
  const kind = material.ownerId !== null && base ? base.kind : material.kind;
  const rows: Array<[string, string | null]> = [
    [t.family, family ? texts.sheet.families[family] : null],
    [t.intensity, strength ? `${texts.sheet.strengths[strength]} (${t.byRank})` : null],
    [t.contour, texts.kinds[kind]],
    [t.note, tier ? texts.sheet.tiers[tier] : null],
    [t.drift, look.durationHours !== undefined ? t.hours(String(look.durationHours).replace(".", ",")) : null],
  ];
  return (
    <section className="orb-hero">
      <MaterialOrb look={look} size={170} mode="live" seed={seedOf(material.id)} />
      <div className="orb-facts">
        <dl>
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={value ? undefined : "unknown"}>{value ?? t.noData}</dd>
            </div>
          ))}
          <div>
            <dt>{t.diffusion}</dt>
            <dd className="unknown">{t.notYet}</dd>
          </div>
          <div>
            <dt>{t.luminosity}</dt>
            <dd className="unknown">{t.notYet}</dd>
          </div>
        </dl>
        <p className="hint">{t.prototype}</p>
      </div>
    </section>
  );
}
