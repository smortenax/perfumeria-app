import { useId, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { formatDecimal } from "../core/display";
import { FamilyBar } from "../families/FamilyBar";
import { PALETTE } from "../families/palette";
import { texts as appTexts } from "../i18n/en";
import { STOPS, type Evaporation } from "./evaporation";
import { wholeShareText } from "./format";
import { texts } from "./texts";

const t = texts.evaporation;
const SIXTY = Ratio.of(60);
const DAY = Ratio.of(24);
/** The materials named in each list; the rest, counted. */
const NAMED = 4;

/**
 * A time to read: «Just applied», minutes under an hour, hours, and days beside them from two days;
 * `short`, without the days, for inside a list's brackets.
 */
export function timeText(hours: Ratio, short = false): string {
  if (hours.isZero()) return t.justApplied;
  if (hours.lt(Ratio.ONE)) return t.minutes(formatDecimal(hours.mul(SIXTY), 0));
  const h = formatDecimal(hours, hours.isInteger() ? 0 : 1);
  const days = hours.div(DAY);
  return short || hours.lt(Ratio.of(48)) ? t.hours(h) : t.days(h, formatDecimal(days, days.isInteger() ? 0 : 1));
}

const pct = wholeShareText;

const listed = (names: readonly string[]) => (names.length > NAMED ? `${names.slice(0, NAMED).join(", ")} ${t.andMore(names.length - NAMED)}` : names.join(", "));

/**
 * The evaporation slider (F5, V3-90), in the bench's side: from just applied to 600 h, what is still
 * on the blotter and its families, what is gone and what has no hours. Moving it changes nothing of the
 * formula. An orientation, said under it.
 */
export function EvaporationCard(props: { at: (hours: Ratio) => Evaporation | null }) {
  const [stop, setStop] = useState(0);
  const id = useId();
  const hours = STOPS[stop];
  const e = props.at(hours);
  if (!e) {
    return (
      <section className="card evaporation-card" aria-label={t.title}>
        <span className="chart-title">{t.title}</span>
        <p className="muted small">{t.empty}</p>
      </section>
    );
  }
  const shares = e.families.map((f) => ({ family: f.family, colour: f.family ? (PALETTE.get(f.family)?.light ?? null) : null, share: f.share }));
  const families = e.families.map((f) => `${f.family ? appTexts.sheet.families[f.family] : appTexts.familyBar.none} ${pct(f.share)}`).join(" · ");
  return (
    <section className="card evaporation-card" aria-label={t.title}>
      <span className="chart-title">{t.title}</span>
      <label className="evaporation-slider" htmlFor={id}>
        <span className="muted small">{t.slider}</span>
        <input
          id={id}
          type="range"
          min={0}
          max={STOPS.length - 1}
          step={1}
          value={stop}
          aria-valuetext={timeText(hours)}
          onChange={(ev) => setStop(Number(ev.target.value))}
        />
      </label>
      <span className="evaporation-scale" aria-hidden="true">
        <span>{t.justApplied}</span>
        <strong>{timeText(hours)}</strong>
        <span>{timeText(STOPS[STOPS.length - 1])}</span>
      </span>
      <div aria-live="polite" className="evaporation-now">
        {e.left.length > 0 ? (
          <>
            <FamilyBar shares={shares} />
            <p className="summary-line">{t.left(e.left.length, e.total, pct(e.leftShare))}</p>
            <p className="summary-line">{families}</p>
          </>
        ) : (
          <p className="summary-line">{t.nothingLeft(e.total)}</p>
        )}
        {e.gone.length > 0 && (
          <p className="small">
            <strong>{t.gone}</strong> {listed(e.gone.map((g) => `${g.name} (${timeText(g.hours, true)})`))}
          </p>
        )}
      </div>
      {e.unknown.length > 0 && (
        <p className="small evaporation-unknown">
          <strong>{t.noHours}</strong> {listed(e.unknown.map((u) => `${u.name} (${pct(u.share)})`))}
        </p>
      )}
      <p className="muted small">{t.orientation}</p>
    </section>
  );
}
