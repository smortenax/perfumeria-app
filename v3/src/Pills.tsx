/**
 * A short set of choices shown as pills instead of a browser select (V3-73): every option in view, one
 * press to change, the chosen one marked (aria-pressed). For a handful of options; a long list keeps
 * its select.
 */
export function Pills<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: readonly { readonly value: T | null; readonly label: string }[];
  onChange: (value: T | null) => void;
}) {
  return (
    <div className="pills-field" role="group" aria-label={label}>
      <span className="field-label" aria-hidden="true">
        {label}
      </span>
      <span className="pills">
        {options.map((o) => (
          <button key={o.value ?? ""} type="button" className="pill" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </span>
    </div>
  );
}
