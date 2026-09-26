import { texts } from "../i18n/es";

/**
 * The bottle fills by mass, over the work batch (§10.1, P23): 5 g of 10 g is
 * half full. It is a picture, not a measure, so it needs no density.
 */
export function Bottle(props: { name: string; fill: number | null }) {
  const fill = props.fill === null ? 0 : Math.max(0, Math.min(1, props.fill));
  const bodyTop = 104;
  const bodyHeight = 176;
  const level = bodyTop + bodyHeight * (1 - fill);
  const label = props.name.length > 16 ? `${props.name.slice(0, 15)}…` : props.name;
  return (
    <figure className="bottle">
      <svg viewBox="0 0 200 300" role="img" aria-label={props.name}>
        <defs>
          <clipPath id="bottle-body">
            <rect x="36" y={bodyTop} width="128" height={bodyHeight} rx="24" />
          </clipPath>
        </defs>
        <rect className="bottle-bulb" x="82" y="8" width="36" height="46" rx="14" />
        <rect className="bottle-collar" x="72" y="52" width="56" height="20" rx="5" />
        <rect className="bottle-glass" x="84" y="70" width="32" height="40" rx="4" />
        <rect className="bottle-glass" x="36" y={bodyTop} width="128" height={bodyHeight} rx="24" />
        <rect className="bottle-liquid" clipPath="url(#bottle-body)" x="36" y={level} width="128" height={bodyTop + bodyHeight - level} />
        <rect className="bottle-label" x="52" y="168" width="96" height="54" rx="6" />
        <text className="bottle-label-text" x="100" y="200" textAnchor="middle">
          {label}
        </text>
      </svg>
      {props.fill === null && <figcaption>{texts.bench.bottleEmpty}</figcaption>}
    </figure>
  );
}
