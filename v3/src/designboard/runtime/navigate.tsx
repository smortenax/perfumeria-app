// Copied from designboard 3f221ae (src/runtime/navigate.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { createContext, useContext, type ReactNode } from "react";
import { actionOf, type Connection } from "../core/composition";

/**
 * What a connected layer does in an app (see `core/connections.ts`). `ComposedScreen` provides
 * it from its `onNavigate` or `onAction` prop; on the board nothing provides it, so a click there
 * only selects the layer.
 *
 * `phase` is "start" when the trigger fires (the click, the pointer coming in, the delay running
 * out) and "end" when a hover ends, so an overlay shown on hover can close again. `from` is the
 * layer's box on the page and `layer` its id, which stays the same when the file is edited or read
 * again (the connection object does not).
 */
export type Act = (connection: Connection, phase: "start" | "end", from: DOMRect | null, layer: string) => void;

/** @deprecated The first contract: a screen id on a click. Still accepted by `ComposedScreen` as `onNavigate`. */
export type Navigate = (to: string) => void;

const ActContext = createContext<Act | null>(null);

export function ActProvider({ act, children }: { act: Act | null; children: ReactNode }) {
  return <ActContext.Provider value={act}>{children}</ActContext.Provider>;
}

export function useAct(): Act | null {
  return useContext(ActContext);
}

/** @deprecated The first contract: the navigation a click on a connected layer makes, or null where nothing handles it. */
export function useNavigate(): Navigate | null {
  const act = useAct();
  return act ? (to) => act({ to }, "start", null, "") : null;
}

/** An `Act` from the first contract: only a navigation that starts, as a screen id. */
export function actFromNavigate(navigate: Navigate): Act {
  return (c, phase) => {
    if (phase === "start" && actionOf(c) === "navigate" && c.to) navigate(c.to);
  };
}

/** Kept for apps that wrap a screen themselves with the first contract. */
export function NavigateProvider({ navigate, children }: { navigate: Navigate | null; children: ReactNode }) {
  return <ActProvider act={navigate ? actFromNavigate(navigate) : null}>{children}</ActProvider>;
}
