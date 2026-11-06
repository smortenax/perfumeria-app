import type { Ratio } from "../core/arith/ratio";
import { formatPercent } from "../core/display";
import { texts } from "../i18n/en";
import type { Against } from "./lines";

const t = texts.planner;
const share = (r: Ratio | null, none: string) => (r === null ? <span className="muted">{none}</span> : formatPercent(r, 1));

/**
 * The bench's side (V3-98: the plan is the formula's template): each planned material, its share of
 * the planned parts against its share of the aromatic matter weighed, and what is weighed without
 * being planned. Shown only when the formula has a plan.
 */
export function AgainstPlanCard(props: { rows: readonly Against[]; onOpen: () => void }) {
  if (props.rows.length === 0) return null;
  return (
    <section className="card against-plan" aria-label={t.against}>
      <span className="chart-title">{t.against}</span>
      <p className="muted small">{t.againstHelp}</p>
      <table>
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col" className="num">
              {t.planned}
            </th>
            <th scope="col" className="num">
              {t.weighed}
            </th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => (
            <tr key={r.key}>
              <th scope="row">{r.name}</th>
              <td className="num">{share(r.planned, t.notPlanned)}</td>
              <td className="num">{share(r.weighed, t.notWeighed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="link" onClick={props.onOpen}>
        {t.open}
      </button>
    </section>
  );
}
