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
  const diluents = oneChipEach(props.diluents, props.value);
  if (diluents.length > CHIPS_UP_TO) {
    return (
      <select aria-label={props.label} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {diluents.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    );
  }
  return (
    <span className="pills diluent-pills" role="group" aria-label={props.label}>
      {diluents.map((d) => (
        <button key={d.id} type="button" className="pill" aria-pressed={props.value === d.id} aria-label={d.name} onClick={() => props.onChange(d.id)}>
          {chipName(d.name)}
        </button>
      ))}
    </span>
  );
}

/**
 * One chip per name (F-07, picked 2026-11-02): your version of DPG and the common DPG were two chips that read the same. The one
 * chosen stays; otherwise the first in the list.
 */
export function oneChipEach<D extends { readonly id: string; readonly name: string }>(diluents: readonly D[], chosen: string): D[] {
  const seen = new Map<string, D>();
  for (const d of diluents) {
    const k = chipName(d.name);
    if (!seen.has(k) || d.id === chosen) seen.set(k, d);
  }
  return [...seen.values()];
}
