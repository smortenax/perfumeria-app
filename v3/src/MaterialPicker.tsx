import { useEffect, useId, useRef, useState } from "react";
import { comboFieldProps, comboKey, optionId } from "./combobox";
import "./MaterialPicker.css";

/**
 * A material chosen by typing (F-01, F-03, picked 2026-11-02): one field and its results, a combobox as ARIA asks. The arrows
 * move the highlight, Enter or Tab picks it (the first, until the arrows move it), a click picks the row. Used where a
 * material is picked from a list of names: «Add strip» and «New dilution». The bench's add bar has its own rows (icons,
 * plants, bottles) and the same keys and roles, from the same module.
 */
export function MaterialPicker(props: {
  label: string;
  placeholder: string;
  options: readonly { readonly id: string; readonly name: string }[];
  onPick: (id: string) => void;
  /** At most this many results (30). */
  limit?: number;
}) {
  const [query, setQuery] = useState("");
  const [at, setAt] = useState(0);
  const listId = useId();
  const list = useRef<HTMLUListElement>(null);
  const q = query.trim().toLowerCase();
  const shown = props.options.filter((m) => m.name.toLowerCase().includes(q)).slice(0, props.limit ?? 30);
  const active = Math.min(at, Math.max(shown.length - 1, 0));
  useEffect(() => {
    list.current?.querySelector(`[id="${optionId(listId, active)}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [active, listId]);
  return (
    <div className="material-picker">
      <label className="field">
        {props.label}
        <input
          type="search"
          value={query}
          placeholder={props.placeholder}
          autoComplete="off"
          {...comboFieldProps(listId, true, shown.length, active)}
          onChange={(e) => {
            setQuery(e.target.value);
            setAt(0);
          }}
          onKeyDown={(e) => {
            const action = comboKey(e.key, active, shown.length, e.shiftKey);
            if (!action) return;
            if (action.kind === "move") {
              e.preventDefault();
              setAt(action.to);
            } else if (action.kind === "choose") {
              e.preventDefault();
              props.onPick(shown[action.at].id);
            } else if (query !== "") {
              // Escape empties the search first, as a search field does.
              e.preventDefault();
              setQuery("");
              setAt(0);
            }
          }}
        />
      </label>
      <ul ref={list} className="pick-list picker-list" role="listbox" id={listId} aria-label={props.label}>
        {shown.map((m, i) => (
          <li
            key={m.id}
            id={optionId(listId, i)}
            role="option"
            aria-selected={i === active}
            className={i === active ? "picker-option active" : "picker-option"}
            onMouseEnter={() => setAt(i)}
            // The focus stays in the field.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => props.onPick(m.id)}
          >
            {m.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
