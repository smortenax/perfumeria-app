import type { FormulaRecord, Workbench } from "../db/formulas";
import { normalize } from "../db/search";
import { byVersions } from "../glossary/Glossary";

/**
 * What the bench's head offers to go to without leaving it (audit 2026-10-24, F-02 L2): «Bench ▾ /
 * Formula ▾». The first menu lists the workbenches, as Formulation does; the second, the formulas of
 * one workbench with their versions under each mother, as its list does (byVersions).
 */

export interface SwitchBench {
  readonly id: string;
  readonly name: string;
  readonly count: number;
  readonly current: boolean;
}

export interface SwitchFormula {
  readonly id: string;
  readonly name: string;
  /** 0 for a first formula; 1 for its versions, and so on. */
  readonly depth: number;
  readonly current: boolean;
  readonly favorite: boolean;
}

const matches = (query: string) => {
  const words = normalize(query).split(/\s+/).filter((w) => w);
  return (text: string) => words.every((w) => normalize(text).includes(w));
};

/** The workbenches by name, as Formulation lists them, each with how many formulas it holds. */
export function switchBenches(workbenches: readonly Workbench[], formulas: readonly FormulaRecord[], currentBenchId: string, query = ""): SwitchBench[] {
  const shown = matches(query);
  return workbenches
    .filter((b) => shown(b.name))
    .map((b) => ({ id: b.id, name: b.name, count: formulas.filter((f) => f.workbenchId === b.id).length, current: b.id === currentBenchId }))
    .sort((a, b) => a.name.localeCompare(b.name, "es") || (a.id < b.id ? -1 : 1));
}

/**
 * A workbench's formulas, each mother followed by its versions. The depth is read over the whole bench,
 * so a version found by the search keeps its place under its mother even when she is not shown.
 */
export function switchFormulas(formulas: readonly FormulaRecord[], benchId: string, currentId: string, query = ""): SwitchFormula[] {
  const all = formulas.filter((f) => f.workbenchId === benchId);
  const ordered = byVersions(all);
  // byVersions finds no first formula in a loop of parents: those go last, so none is left out.
  const placed = new Set(ordered.map((f) => f.id));
  const inside = [...ordered, ...all.filter((f) => !placed.has(f.id))];
  const byId = new Map(inside.map((f) => [f.id, f]));
  const depth = (f: FormulaRecord) => {
    let d = 0;
    // A loop of parents (which the database should never hold) stops at the bench's size.
    for (let p = f.parentId; p && byId.has(p) && d < inside.length; d++) p = byId.get(p)!.parentId;
    return d;
  };
  const shown = matches(query);
  return inside
    .filter((f) => shown(f.name))
    .map((f) => ({ id: f.id, name: f.name, depth: depth(f), current: f.id === currentId, favorite: f.markers.includes("favorite") }));
}
