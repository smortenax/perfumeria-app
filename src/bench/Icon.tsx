import { texts } from "../i18n/es";

/**
 * A material's icon text: its trade abbreviation or its code. Two signs are not
 * letters, and are drawn so (P39, P40):
 * - the small mark before an abbreviation shared by several CAS: ⁶IBQ, ²IBQ;
 * - the letter of the kind of natural at the end of a code, leaning back: LeA.
 */
export function IconText(props: { text: string; mark?: string | undefined; type?: string | undefined }) {
  const { text, type } = props;
  // The kind closes the code, before any number that tells two codes apart («ASO2»).
  const at = type ? text.search(new RegExp(`${type}\\d*$`)) : -1;
  return (
    <>
      {props.mark && <sup className="icon-mark">{props.mark}</sup>}
      {at < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, at)}
          <span className="type-mark" title={texts.naturalKind[type as keyof typeof texts.naturalKind] ?? undefined}>
            {type}
          </span>
          {text.slice(at + 1)}
        </>
      )}
    </>
  );
}

/** How long an icon reads, to shrink the ones that do not fit. */
export const iconLength = (text: string, mark?: string) => text.length + (mark ? mark.length * 0.6 : 0);
