import type { KeyboardEvent, Ref } from "react";
import "./MassInput.css";

/**
 * A box to write a percentage in, with «%» at its right end (2026-11-26, inventario B4): the sister of MassInput, with its
 * look and no unit to switch. One piece for the % of «Add & weigh», «New dilution», the bottle's form and the bench's add bar,
 * which before wrote the «%» three ways (beside the box, painted by CSS, in the label). It hands back what is typed as it is:
 * the screen reads it with format/percent.ts.
 */
export function PercentInput(props: {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  id?: string;
  /** The look of the box where it sits: «weigh-cell n» in a dilution row. */
  className?: string;
  /** «box» (by default), or «bench»: the add bar's field (`.field.percent-field`, `.unit-label` in bench/bench.css). */
  look?: "box" | "bench";
  /** The bench's field when the material goes in pure: drawn off. */
  off?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const bench = props.look === "bench";
  return (
    <span className={bench ? `field percent-field${props.off ? " off" : ""}` : "mass-input"}>
      <input
        id={props.id}
        ref={props.inputRef}
        className={bench ? "num" : props.className ? `mass-box ${props.className}` : "mass-box"}
        inputMode="decimal"
        autoComplete="off"
        value={props.value}
        placeholder={props.placeholder}
        aria-label={props["aria-label"]}
        aria-describedby={props["aria-describedby"]}
        onChange={(e) => props.onChange(e.target.value)}
        onKeyDown={props.onKeyDown}
      />
      <span className={bench ? "unit-label" : "mass-suffix"} aria-hidden="true">
        %
      </span>
    </span>
  );
}
