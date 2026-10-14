import type { GlossaryData } from "./glossary/useGlossary";
import { texts } from "./i18n/es";

/**
 * The landing (plan v3, step 8.1): the two parts of the app, side by side, each opened from here;
 * from either one, «Inicio» comes back. What each holds is said in numbers from your copy.
 */
export function Home({ data, onMaterials, onFormulation }: { data: GlossaryData | null; onMaterials: () => void; onFormulation: () => void }) {
  const t = texts.home;
  const own = data ? [...data.catalog.materials.values()].filter((m) => m.ownerId !== null).length : null;
  const common = data ? data.catalog.materials.size - (own ?? 0) : null;
  return (
    <section className="home">
      <h2>{t.title}</h2>
      <ul className="launch">
        <li>
          <button type="button" className="launch-card" onClick={onMaterials}>
            <span className="launch-icon" aria-hidden="true">
              M
            </span>
            <span className="launch-name">{t.materials}</span>
            <span className="launch-detail">{data ? t.materialsDetail(own!, common!) : texts.glossary.loading}</span>
          </button>
        </li>
        <li>
          <button type="button" className="launch-card" onClick={onFormulation}>
            <span className="launch-icon formula" aria-hidden="true">
              F
            </span>
            <span className="launch-name">{t.formulation}</span>
            <span className="launch-detail">{data ? t.formulationDetail(data.workbenches.length, data.formulas.length) : texts.glossary.loading}</span>
          </button>
        </li>
      </ul>
    </section>
  );
}
