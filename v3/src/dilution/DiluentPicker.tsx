import { chipName, CHIPS_UP_TO } from "./diluentName";

/**
 * Which diluent, as chips (audit F-09 L2), the same gesture as in the bench's add bar: one press, the
 * chosen one pressed. A long list stays a select, so it does not fill the window.
 */
export function DiluentPicker(props: {
  label: string;
  diluents: readonly { readonly id: string; readonly name: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (props.diluents.length > CHIPS_UP_TO) {
    return (
      <select aria-label={props.label} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.diluents.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    );
  }
  return (
    <span className="pills diluent-pills" role="group" aria-label={props.label}>
      {props.diluents.map((d) => (
        <button key={d.id} type="button" className="pill" aria-pressed={props.value === d.id} aria-label={d.name} onClick={() => props.onChange(d.id)}>
          {chipName(d.name)}
        </button>
      ))}
    </span>
  );
}
