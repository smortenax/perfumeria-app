import type { Change, Formula, FormulaHeader } from "../core/model/formula";

/**
 * The bench works on one formula. Its history is the formula (§3.4): editing is
 * adding changes, and undo takes the last one back (§3.1). The header is not
 * part of the history.
 */
export interface BenchState {
  readonly formula: Formula;
  /** Changes taken back by undo, most recent last. A new change clears them. */
  readonly redo: readonly Change[];
  /** Where the formula lives on disk; null until it is first saved. */
  readonly path: string | null;
  readonly saved: boolean;
  /** Showing the composition up to this frame; null is the end of the history. */
  readonly frame: number | null;
}

export type BenchAction =
  | { type: "load"; formula: Formula; path: string | null }
  | { type: "header"; header: FormulaHeader }
  | { type: "change"; change: Change }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "saved"; path: string; formula: Formula }
  | { type: "frame"; frame: number | null };

export const emptyFormula = (name: string): Formula => ({
  header: { name, intention: "", container: null, workBatchUg: null, finalBatchUg: null },
  history: [],
});

export const initialState = (formula: Formula, path: string | null): BenchState => ({
  formula,
  redo: [],
  path,
  saved: path !== null,
  frame: null,
});

export function benchReducer(state: BenchState, action: BenchAction): BenchState {
  const { formula } = state;
  switch (action.type) {
    case "load":
      return initialState(action.formula, action.path);
    case "header":
      return { ...state, formula: { ...formula, header: action.header }, saved: false };
    case "change":
      return {
        ...state,
        formula: { ...formula, history: [...formula.history, action.change] },
        redo: [],
        saved: false,
        frame: null,
      };
    case "undo": {
      const last = formula.history[formula.history.length - 1];
      if (!last) {
        return state;
      }
      return {
        ...state,
        formula: { ...formula, history: formula.history.slice(0, -1) },
        redo: [...state.redo, last],
        saved: false,
        frame: null,
      };
    }
    case "redo": {
      const next = state.redo[state.redo.length - 1];
      if (!next) {
        return state;
      }
      return {
        ...state,
        formula: { ...formula, history: [...formula.history, next] },
        redo: state.redo.slice(0, -1),
        saved: false,
        frame: null,
      };
    }
    case "saved":
      // Saved only if nothing changed while the file was being written.
      return { ...state, path: action.path, saved: state.formula === action.formula };
    case "frame":
      return { ...state, frame: action.frame };
  }
}

export const newId = (): string => crypto.randomUUID();
