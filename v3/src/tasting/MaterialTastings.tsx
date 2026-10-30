import type { Tastings } from "../db/tastings";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { legacyTasted, tenacity } from "./logic";

const t = texts.tasting;
const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/**
 * A material's tastings, on its sheet (the user, 2026-10-19): only links. The tasting lives in
 * «Catas»; from here you go to each one, or start a new one, which opens there.
 */
export function MaterialTastings({
  data,
  tastings,
  materialId,
  onOpenStrip,
  onNew,
  onLegacy,
}: {
  data: GlossaryData;
  tastings: Tastings | null;
  materialId: string;
  onOpenStrip: (id: string) => void;
  onNew: () => void;
  onLegacy: () => void;
}) {
  const strips = (tastings?.strips ?? []).filter((s) => s.materialId === materialId).sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));
  const legacy = data.catalog.evaluations.get(materialId);
  // A sheet of the lab with its text (batch 18), tasted or not: it is linked.
  const hasLegacy = legacyTasted(legacy?.status) || (legacy?.sheet ?? "").includes("\n");
  return (
    <section className="sheet-section material-tastings">
      <h3>{t.title}</h3>
      {strips.length === 0 && !hasLegacy && <p className="unknown">{t.notTastedYet}</p>}
      {strips.length > 0 && (
        <ul>
          {strips.map((s) => {
            const ten = tenacity(s, (tastings?.moments ?? []).filter((m) => m.stripId === s.id));
            return (
              <li key={s.id}>
                <button type="button" className="link" onClick={() => onOpenStrip(s.id)}>
                  {t.materialTasting(when(s.appliedAt), s.closedAt !== null)}
                </button>
                {ten && <span className="hint"> · {t.tenacity.toLowerCase()} {ten.atLeast ? "≥ " : ""}{ten.hours.toFixed(1)} h</span>}
              </li>
            );
          })}
        </ul>
      )}
      {hasLegacy && (
        <p>
          <button type="button" className="link" onClick={onLegacy}>
            {t.legacySheet(legacy?.status ?? "")}
          </button>
        </p>
      )}
      <button type="button" onClick={onNew}>
        {t.newTasting}
      </button>
    </section>
  );
}
