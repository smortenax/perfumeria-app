import { useId, useState, type ReactNode } from "react";
import { explainLines } from "./explain-lines";

/**
 * «Explain»: what was said only on hover, a press away (plan 8.6: «pantalla estrecha y sin hover»). A small
 * «i» opens the text under what it explains, in the page, and closes it again; a phone has no hover and
 * a keyboard never reaches a title. The title stays for the mouse.
 *
 * A hook, so the button and the text can sit apart: the button beside what it explains, the text where
 * it has room. Call it before any early return.
 */
export function useExplain(label: string, lines: ReadonlyArray<string | null | undefined | false>): { button: ReactNode; panel: ReactNode } {
  const [open, setOpen] = useState(false);
  const id = useId();
  const shown = explainLines(lines);
  if (shown.length === 0) return { button: null, panel: null };
  return {
    button: (
      <button type="button" className="explain" aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}>
        i
      </button>
    ),
    panel: open ? (
      <span id={id} className="explain-text">
        {shown.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </span>
    ) : null,
  };
}
