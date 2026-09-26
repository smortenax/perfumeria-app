/**
 * A material's icon text: its trade abbreviation or its code, with the small mark
 * that tells apart the CAS sharing one abbreviation, as in ⁶IBQ and ²IBQ (P39).
 */
export function IconText(props: { text: string; mark?: string | undefined }) {
  return (
    <>
      {props.mark && <sup className="icon-mark">{props.mark}</sup>}
      {props.text}
    </>
  );
}

/** How long an icon reads, to shrink the ones that do not fit. */
export const iconLength = (text: string, mark?: string) => text.length + (mark ? mark.length * 0.6 : 0);
