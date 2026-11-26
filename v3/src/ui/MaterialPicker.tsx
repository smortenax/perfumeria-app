import { useEffect, useId, useRef, useState } from "react";
import { comboFieldProps, comboKey, optionId } from "../combobox";
import type { PickOption } from "../db/material-search";
import { searchCatalog } from "../lib/search";
import "./MaterialPicker.css";

/**
 * A material chosen by typing (F-01, F-03, picked 2026-11-02): one field and its results, a combobox as ARIA asks. The arrows
 * move the highlight, Enter or Tab picks it (the first, until the arrows move it), a click picks the row. Used wherever a
 * material is picked from a list: «Add & weigh», «New dilution», «Add strip», the planner.
 *
 * It ranks as the bench's add bar does (2026-11-26; the user: «el buscador de diluciones … no funciona igual ni se basa en la
 * lista de la misma manera que el buscar materiales en la formulacion»): the same `searchCatalog` over the same fields
 * (db/material-search.ts): every word, in any order, in a name, other name, bottle, abbreviation, CAS, species or INCI, with or
 * without accents; then names written close to it. With nothing typed, the options in their order.
 */
export function MaterialPicker(props: {
  label: string;
  placeholder: string;
  options: readonly PickOption[];
  onPick: (id: string) => void;
  /** At most this many results (30). */
  limit?: number;
  /** The list only once something is typed (the last row of «Add & weigh», V3-96). */
  quietWhenEmpty?: boolean;
  /** The label as the field's accessible name only. */
  hideLabel?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [at, setAt] = useState(0);
  const listId = useId();
  const list = useRef<HTMLUListElement>(null);
  const limit = props.limit ?? 30;
  const shown = query.trim() ? searchCatalog(props.options, query, limit) : props.quietWhenEmpty ? [] : props.options.slice(0, limit);
  const active = Math.min(at, Math.max(shown.length - 1, 0));
  useEffect(() => {
    list.current?.querySelector(`[id="${optionId(listId, active)}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [active, listId]);
  return (
    <div className="material-picker">
      <label className="field">
        {props.hideLabel ? <span className="sr-only">{props.label}</span> : props.label}
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
            <span className="picker-name">{m.name}</span>
            {m.detail && <span className="picker-detail">{m.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
