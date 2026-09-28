import { texts } from "../i18n/es";

/** One part of what the bottle holds: the aromatic matter, or a solvent, with its % of the bottle. */
export interface BottlePart {
  readonly name: string;
  readonly share: string;
}

/**
 * The bottle, big, at the top left (§10.1): it fills by mass over the work
 * batch (P23), with the name as its label. The back button sits in a bite of
 * the frame (P26). Under it, what it holds: the aromatic matter and each solvent,
 * as % of the bottle (P49). Drawn as in the sketch (boceto 4).
 */
export function BottleFrame(props: { name: string; fill: number | null; aromatic: BottlePart | null; solvents: readonly BottlePart[]; onBack: () => void }) {
  const fill = props.fill === null ? 0 : Math.max(0, Math.min(1, props.fill));
  const offset = (1 - fill) * 156;
  const label = props.name.length > 12 ? `${props.name.slice(0, 11)}…` : props.name;
  const fontSize = Math.max(13, Math.min(27, 150 / Math.max(label.length, 1) * 1.7));
  return (
    <div className="bottle-frame">
      <svg width="208" height="284" viewBox="0 0 208 284" aria-hidden="true" className="frame-shape">
        <path d="M58.5 0.5 H195.5 A12 12 0 0 1 207.5 12.5 V271.5 A12 12 0 0 1 195.5 283.5 H12.5 A12 12 0 0 1 0.5 271.5 V58.5 A8 8 0 0 1 8.5 50.5 H38.5 A12 12 0 0 0 50.5 38.5 V8.5 A8 8 0 0 1 58.5 0.5 Z" />
      </svg>
      <div className="bottle-inner">
        <svg width="108" height="200" viewBox="0 0 140 260" role="img" aria-label={props.name}>
          <defs>
            <clipPath id="glass">
              <path d="M54 86 L86 86 C86 96 124 98 124 118 L124 240 Q124 256 108 256 L32 256 Q16 256 16 240 L16 118 C16 98 54 96 54 86 Z" />
            </clipPath>
          </defs>
          <path d="M54 86 L86 86 C86 96 124 98 124 118 L124 240 Q124 256 108 256 L32 256 Q16 256 16 240 L16 118 C16 98 54 96 54 86 Z" fill="#ECEAE4" />
          <g clipPath="url(#glass)">
            <rect x="0" y="100" width="140" height="170" fill="#C8C3B4" style={{ transform: `translateY(${offset}px)`, transition: "transform 200ms ease" }} />
            <line x1="0" y1="100" x2="140" y2="100" stroke="#A8A395" strokeWidth="1.6" style={{ transform: `translateY(${offset}px)`, transition: "transform 200ms ease" }} />
          </g>
          <rect x="65" y="80" width="10" height="150" rx="5" fill="none" stroke="#A8A395" strokeWidth="1.4" />
          <line x1="26" y1="124" x2="26" y2="236" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" />
          <path d="M54 86 L86 86 C86 96 124 98 124 118 L124 240 Q124 256 108 256 L32 256 Q16 256 16 240 L16 118 C16 98 54 96 54 86 Z" fill="none" stroke="#8C8A82" strokeWidth="1.6" />
          <rect x="54" y="72" width="32" height="15" fill="#ECEAE4" stroke="#8C8A82" strokeWidth="1.4" />
          <rect x="44" y="42" width="52" height="31" rx="5" fill="#6B6A64" />
          <line x1="48" y1="51" x2="92" y2="51" stroke="#57564F" strokeWidth="1.4" />
          <line x1="48" y1="57" x2="92" y2="57" stroke="#57564F" strokeWidth="1.4" />
          <line x1="48" y1="63" x2="92" y2="63" stroke="#57564F" strokeWidth="1.4" />
          <rect x="50" y="2" width="40" height="44" rx="18" fill="#3F3E39" />
          <rect x="22" y="148" width="96" height="60" rx="6" fill="#FFFFFF" stroke="#8C8A82" strokeWidth="1.4" />
          <text x="70" y={178 + fontSize / 3} textAnchor="middle" fontSize={fontSize} fontWeight="600" fill="#1D1D1B">
            {label}
          </text>
        </svg>
        <span className="num fill-note">
          {props.fill === null ? texts.bench.noWorkBatch : texts.bench.fillOf(`${Math.round(props.fill * 100)} %`)}
        </span>
        {props.aromatic && (
          <span className="bottle-split">
            <span className="aromatic">
              {props.aromatic.name} <span className="num">{props.aromatic.share}</span>
            </span>
            {props.solvents.length > 0 && (
              <span>
                {props.solvents.map((s, i) => (
                  <span key={s.name}>
                    {i > 0 && " · "}
                    {s.name} <span className="num">{s.share}</span>
                  </span>
                ))}
              </span>
            )}
          </span>
        )}
      </div>
      <button type="button" className="back" aria-label={texts.bench.back} title={texts.bench.back} onClick={props.onBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 3L5 8l5 5" />
        </svg>
      </button>
    </div>
  );
}
