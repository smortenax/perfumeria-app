// Copied from designboard 3f221ae (src/runtime/variantSwitch.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { findNode, type Artboard, type LayerNode } from "../core/composition";
import type { Library } from "../core/manifest";
import { variantProps } from "../core/variants";

/**
 * The variants a prototype has switched (Figma's "change to"): which variant values each
 * component shows instead of the ones in the file, while the screen is on. Nothing is written to
 * the composition: the switch lasts as long as the screen is drawn.
 *
 * A click, a key or a delay switches for good (`held`); a hover or a press switches while it
 * lasts (`passing`) and the component goes back to what it showed when it ends.
 */
export interface VariantSwitches {
  /** Target layer id → the values set by clicks, keys and delays, later ones over earlier ones. */
  held: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** Switches that last while a hover or press does, in the order they began. */
  passing: readonly { from: string; target: string; values: Readonly<Record<string, string>> }[];
}

export const NO_SWITCHES: VariantSwitches = { held: {}, passing: [] };

/**
 * The state after the layer `from` fires a variant change on `target`. `transient` is true for
 * a hover or a press, which is the only kind that ends.
 */
export function switchVariant(s: VariantSwitches, from: string, target: string, values: Readonly<Record<string, string>>, phase: "start" | "end", transient: boolean): VariantSwitches {
  if (transient) {
    const rest = s.passing.filter((p) => p.from !== from);
    if (phase === "end") return rest.length === s.passing.length ? s : { ...s, passing: rest };
    return { ...s, passing: [...rest, { from, target, values }] };
  }
  if (phase === "end") return s;
  return { ...s, held: { ...s.held, [target]: { ...s.held[target], ...values } } };
}

/** The variant values a layer shows over its own, or undefined when nothing switched it. */
export function switchedVariant(s: VariantSwitches, target: string): Record<string, string> | undefined {
  const passing = s.passing.filter((p) => p.target === target);
  if (!s.held[target] && !passing.length) return undefined;
  return Object.assign({}, s.held[target], ...passing.map((p) => p.values));
}

interface VariantSwitcher {
  switches: VariantSwitches;
  fire: (from: string, target: string, values: Readonly<Record<string, string>>, phase: "start" | "end", transient: boolean) => void;
  /** Every component back to the file's variants (a connection with `resetVariants`). */
  reset: () => void;
}

/** Keeps only the values a component's ficha offers for its variant properties; the target is looked for on these screens. */
export type VariantCleaner = (target: string, values: Readonly<Record<string, string>>) => Record<string, string>;

/** A cleaner for the components of these screens, read with this library. */
export function variantCleaner(boards: readonly Artboard[], library: Library): VariantCleaner {
  return (target, values) => {
    let node: LayerNode | undefined;
    for (const b of boards) {
      node = findNode(b, target)?.node;
      if (node) break;
    }
    const def = node?.kind === "component" ? library.get(node.type) : undefined;
    const props = def ? variantProps(def) : [];
    return Object.fromEntries(Object.entries(values).filter(([k, v]) => props.some((p) => p.key === k && p.def.options.some((o) => o.value === v))));
  };
}

const VariantContext = createContext<VariantSwitcher | null>(null);

/**
 * Keeps the switched variants. `ComposedScreen` provides one unless one is already around it; an
 * app that wraps its screens in one keeps a changed variant when a screen is left and shown again,
 * as Figma does (the board's *Vista app* does so). The board's canvas has none, so layers there
 * show the file. `clean` leaves only the values the target's ficha offers (`variantCleaner`), so
 * a value it does not know (a hand-edited file, a ficha that changed) never hides an earlier one.
 */
export function VariantProvider({ clean, children }: { clean?: VariantCleaner; children: ReactNode }) {
  const [switches, setSwitches] = useState(NO_SWITCHES);
  const value = useMemo<VariantSwitcher>(
    () => ({
      switches,
      fire: (from, target, values, phase, transient) => setSwitches((s) => switchVariant(s, from, target, clean ? clean(target, values) : values, phase, transient)),
      reset: () => setSwitches(NO_SWITCHES),
    }),
    [switches, clean],
  );
  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>;
}

export function useVariantSwitcher(): VariantSwitcher | null {
  return useContext(VariantContext);
}
