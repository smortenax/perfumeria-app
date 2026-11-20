// Copied from designboard 3f221ae (src/runtime/variables.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { applySet, type SetVariable, type Values, type Variable } from "../core/variables";

/**
 * The values of a prototype's variables while it is played. The file gives each variable its
 * starting value (`Composition.variables`); what connections set since lives here and is gone
 * when the provider goes.
 *
 * `ComposedScreen` keeps a store of its own when it is given `variables`. An app that draws
 * several screens (or a screen and its overlays) and wants them to share the values wraps them in
 * one `VariablesProvider`, as the board's *Vista app* does.
 */
export interface VariableStore {
  vars: readonly Variable[];
  /** What has been set while playing; a variable not in it has its starting value (`valueOf`). */
  values: Values;
  apply: (set: SetVariable) => void;
}

const VariablesContext = createContext<VariableStore | null>(null);

const NONE: readonly Variable[] = [];

export function VariablesProvider({ variables, children }: { variables: readonly Variable[] | undefined; children: ReactNode }) {
  const vars = variables ?? NONE;
  const [values, setValues] = useState<Values>({});
  const store = useMemo<VariableStore>(() => ({ vars, values, apply: (set) => setValues((now) => applySet(vars, now, set)) }), [vars, values]);
  return <VariablesContext.Provider value={store}>{children}</VariablesContext.Provider>;
}

export function useVariables(): VariableStore | null {
  return useContext(VariablesContext);
}
