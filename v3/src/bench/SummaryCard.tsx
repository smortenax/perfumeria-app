import { Ratio } from "../core/arith/ratio";
import { formatPercent } from "../core/display";
import { texts as appTexts } from "../i18n/en";
import type { FormulaSummary } from "./summary";
import { texts } from "./texts";

const t = texts.summary;
const ONE_PERCENT = Ratio.of(1, 100);
const ALMOST_ALL = Ratio.of(99, 100);
/** From here a share would round to 100 %. */
const ROUNDS_TO_ALL = Ratio.of(199, 200);
/**
 * A share to read, whole. One that is there but under 1 % reads «<1 %», never «0 %»; one short of all,
 * «>99 %», never «100 %»: what is missing is never rounded away.
 */
const pct = (r: Ratio) =>
  !r.isZero() && r.lt(ONE_PERCENT)
    ? `<${formatPercent(ONE_PERCENT, 0)}`
    : r.lt(Ratio.ONE) && !r.lt(ROUNDS_TO_ALL)
      ? `>${formatPercent(ALMOST_ALL, 0)}`
      : formatPercent(r, 0);
/** The materials named under the confidence; the rest, counted. */
const NAMED = 4;

/**
 * The formula summed up (F6, V3-89), under the IFRA verdict: its families, which note leads, and how far
 * to trust that, with the materials that lack the data named. Computed, never written by a model.
 */
export function SummaryCard({ summary }: { summary: FormulaSummary | null }) {
  if (!summary) {
    return (
      <section className="card summary-card" aria-label={t.title}>
        <span className="chart-title">{t.title}</span>
        <p className="muted small">{t.empty}</p>
      </section>
    );
  }
  const s = summary;
  const noFamily = Ratio.ONE.sub(s.coverage.family);
  const noNote = Ratio.ONE.sub(s.coverage.note);
  const families = [
    ...s.families.map((f) => `${appTexts.sheet.families[f.family]} ${pct(f.share)}`),
    ...(s.familyCount > s.families.length ? [t.moreFamilies(s.familyCount - s.families.length)] : []),
    ...(noFamily.isZero() ? [] : [t.noFamily(pct(noFamily))]),
  ];
  // Only the notes that are there: a «top 0 %» beside «no note 88 %» would read as no top, when the
  // matter without a note may well be top.
  const notes = [
    ...(["top", "heart", "base"] as const).filter((n) => !s.notes[n].isZero()).map((n) => `${t.note[n]} ${pct(s.notes[n])}`),
    ...(noNote.isZero() ? [] : [t.noNote(pct(noNote))]),
  ];
  const lacks = (l: readonly string[]) => (l.length === 2 ? t.lacks.both : t.lacks[l[0]]);
  return (
    <section className="card summary-card" aria-label={t.title}>
      <span className="chart-title">{t.title}</span>
      <p className="summary-line">{families.join(" · ")}</p>
      <p className="summary-line">
        <strong>{s.lead ? t.lead[s.lead] : t.noLead}</strong>: {notes.join(" · ")}
      </p>
      <p className="muted small">{t.base}</p>
      <div className={`summary-confidence confidence-${s.confidence}`}>
        <strong>{t.confidence[s.confidence]}</strong>
        <ul>
          <li>{t.familyKnown(pct(s.coverage.family))}</li>
          <li>{t.noteKnown(pct(s.coverage.note))}</li>
          {s.missing.length > 0 && (
            <li>
              {t.missing(s.missing.length)}{" "}
              {s.missing
                .slice(0, NAMED)
                .map((m) => `${m.name} (${pct(m.share)}, ${lacks(m.lacks)})`)
                .join("; ")}
              {s.missing.length > NAMED && ` ${t.andMore(s.missing.length - NAMED)}`}
            </li>
          )}
        </ul>
        <p className="muted small">{t.rule}</p>
      </div>
    </section>
  );
}
