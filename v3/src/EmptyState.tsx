import type { ReactNode } from "react";

/**
 * An empty list says what it is and what to do with it (audit 2026-10-24, F-07): a title, one
 * sentence and, when there is one, the action that fills it.
 */
export function EmptyState(props: { readonly title: string; readonly text?: string; readonly children?: ReactNode }) {
  return (
    <div className="empty-state" role="status">
      <p className="empty-title">{props.title}</p>
      {props.text && <p className="hint">{props.text}</p>}
      {props.children && <div className="buttons">{props.children}</div>}
    </div>
  );
}
