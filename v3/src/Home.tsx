import type { Tastings } from "./db/tastings";
import type { GlossaryData } from "./glossary/useGlossary";
import { buildQueue } from "./tasting/logic";
import { texts } from "./i18n/es";

/**
 * The landing (plan v3, step 8.1): the parts of the app (and «Catas», V3-60), side by side, each opened from here;
 * from either one, «Inicio» comes back. What each holds is said in numbers from your copy.
 */
export function Home({
  data,
  tastings,
  onMaterials,
  onFormulation,
  onTasting,
  onDilutions,
}: {
  data: GlossaryData | null;
  tastings: Tastings | null;
  onMaterials: () => void;
  onFormulation: () => void;
  onTasting: () => void;
  onDilutions: () => void;
}) {
  const t = texts.home;
  const own = data ? [...data.catalog.materials.values()].filter((m) => m.ownerId !== null).length : null;
  const common = data ? data.catalog.materials.size - (own ?? 0) : null;
  const queue = data && tastings ? buildQueue(data.catalog, tastings) : null;
  const openSessions = tastings ? tastings.sessions.filter((s) => !s.endedAt).length : 0;
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
        <li>
          <button type="button" className="launch-card" onClick={onTasting}>
            <span className="launch-icon tasting" aria-hidden="true">
              C
            </span>
            <span className="launch-name">{texts.tasting.title}</span>
            <span className="launch-detail">{queue ? texts.tasting.homeDetail(queue.pending, openSessions) : texts.glossary.loading}</span>
          </button>
        </li>
        <li>
          <button type="button" className="launch-card" onClick={onDilutions}>
            <span className="launch-icon dilution" aria-hidden="true">
              D
            </span>
            <span className="launch-name">{texts.dilutions.title}</span>
            <span className="launch-detail">
              {data ? texts.dilutions.homeDetail([...data.catalog.dilutions.values()].reduce((n, l) => n + l.filter((d) => !d.archivedAt).length, 0)) : texts.glossary.loading}
            </span>
          </button>
        </li>
      </ul>
    </section>
  );
}
