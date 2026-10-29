import { type ReactNode, useEffect, useState } from "react";
import { texts } from "./i18n/en";

/** The screens a skeleton can stand for: the shape of what is coming, not its data. */
export type SkeletonShape = "home" | "grid" | "list" | "bench";

/** A loading that ends within this is never drawn: a flash of grey reads as a glitch (D4, kb-hci-02). */
const SHOW_AFTER_MS = 1000;

/**
 * What a screen shows while it loads (V3-75, D4-skeleton): nothing for the first second, then grey
 * blocks shaped like the screen, with the words for a screen reader. Below them, what it waits for.
 */
export function Loading({ what, shape, note }: { readonly what: string; readonly shape: SkeletonShape; readonly note?: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShown(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="screen-loading">
      <span className="sr-only" role="status">
        {texts.states.loading(what)}
      </span>
      {shown && (
        <>
          <div className={`skeleton skeleton-${shape}`} aria-hidden="true">
            {SHAPES[shape]}
          </div>
          {note && <p className="hint">{note}</p>}
        </>
      )}
    </div>
  );
}

const bar = (width: string, height = 12) => <span className="sk" style={{ width, height }} />;
const card = (key: number) => (
  <div key={key} className="sk-card">
    <div className="sk-row">
      <span className="sk sk-orb" />
      <div className="sk-lines">
        {bar("40%", 10)}
        {bar("80%", 14)}
        {bar("55%", 10)}
      </div>
    </div>
  </div>
);
const rows = (n: number) => (
  <div className="sk-card">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="sk-row">
        <span className="sk sk-dot" />
        {bar("38%")}
        <span className="sk-push">{bar("18%")}</span>
      </div>
    ))}
  </div>
);
const blocks = (n: number) =>
  Array.from({ length: n }, (_, i) => (
    <div key={i} className="sk-card sk-block">
      {bar("30%", 10)}
      {bar("90%")}
      {bar("65%")}
    </div>
  ));
const SHAPES: Record<SkeletonShape, ReactNode> = {
  home: <div className="sk-tiles">{blocks(4)}</div>,
  grid: <div className="sk-grid">{Array.from({ length: 8 }, (_, i) => card(i))}</div>,
  list: rows(8),
  bench: (
    <>
      <div className="sk-card">
        {bar("100%", 44)}
        {bar("50%")}
      </div>
      <div className="sk-split">
        {rows(9)}
        <div className="sk-side">{blocks(2)}</div>
      </div>
    </>
  ),
};

/**
 * What a screen says when it could not load (V3-75, D4): inside its frame, what failed in words and
 * what to do, with a «!» in ink; never red, which is a family's colour (designVault D-0008).
 */
export function LoadError({ title, text, children }: { readonly title: string; readonly text: string; readonly children?: ReactNode }) {
  return (
    <div className="load-error" role="alert">
      <span className="load-error-mark" aria-hidden="true">
        !
      </span>
      <div className="load-error-body">
        <p className="empty-title">{title}</p>
        <p className="hint">{text}</p>
        {children && <div className="buttons">{children}</div>}
      </div>
    </div>
  );
}
