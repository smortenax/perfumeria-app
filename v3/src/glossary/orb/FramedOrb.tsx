import type { ReactNode } from "react";
import { texts } from "../../i18n/en";
import type { OrbMarks } from "./fromCatalog";
import "./framedOrb.css";

const m = texts.glossary.orb.marks;
const NOTES = ["top", "heart", "base"] as const;
/** From this size the marks are named: on the sheet's orb, not on Materials' tiles. */
const NAMED_FROM = 160;

/**
 * The orb with marks on its frame, so it reads without a key (F4, V3-91): on its right edge the three
 * notes, top to base, with its own lit; under it, on the frame's band, the strength in segments and the
 * hours on a blotter on a log bar up to 600 h; on the large orb, the note again as a named row. What the data does not say is drawn dashed: never empty as
 * if it were zero, never lit. Decorative like the orb: the page says the same in words.
 */
export function FramedOrb({ marks, size, children }: { marks: OrbMarks; size: number; children: ReactNode }) {
  const named = size >= NAMED_FROM;
  return (
    <span className={named ? "orb-framed named" : "orb-framed"} style={{ ["--orb-size" as string]: `${size}px` }} aria-hidden="true">
      <span className="orb-body">
        {children}
        <span className={marks.note ? "orb-notes" : "orb-notes unknown"}>
          {NOTES.map((n) => (
            <i key={n} className={marks.note === n ? "on" : undefined} />
          ))}
        </span>
      </span>
      <span className="orb-band">
        {/* On the large orb the note has its row too, named: the notch alone would be a key to learn. */}
        {named && (
          <span className={marks.note ? "orb-strength orb-note-row" : "orb-strength orb-note-row unknown"}>
            {NOTES.map((n) => (
              <i key={n} className={marks.note === n ? "on" : undefined} />
            ))}
            <span className="orb-mark-label">{marks.note ? m.notes[marks.note] : m.unknown}</span>
          </span>
        )}
        <span className={marks.strength ? "orb-strength" : "orb-strength unknown"}>
          {Array.from({ length: marks.strength?.of ?? 4 }, (_, i) => (
            <i key={i} className={marks.strength && i < marks.strength.level ? "on" : undefined} />
          ))}
          {named && <span className="orb-mark-label">{marks.strength ? m.strength : m.unknown}</span>}
        </span>
        <span className={marks.hours ? "orb-hours" : "orb-hours unknown"}>
          <span className="orb-hours-track">{marks.hours && <i style={{ width: `${marks.hours.at * 100}%` }} />}</span>
          {named && <span className="orb-mark-label">{marks.hours ? m.hours(String(marks.hours.value)) : m.unknown}</span>}
        </span>
      </span>
    </span>
  );
}
