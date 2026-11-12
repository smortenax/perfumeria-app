// Copied from designboard 4aa3488 (src/library/perfumeria/history/sample.tsx), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { ReactNode } from "react";
import { MaterialOrb } from "../../orb/MaterialOrb";
import { HistoryProvider } from "./HistoryContext";
import type { HistoryData, HistoryItem, HistoryLabels } from "./history";

/**
 * Example data for the board, where the app is not running: a history of 9 changes (6 additions,
 * a note, a reweigh and a change of mass), as the plan asks. The words are the app's own
 * (v3/src/bench/texts.ts, `history`, at 322e353); the family colours are the light ones of
 * v3/datos/family_palette.csv. Nothing here is a design value: it is data the app would pass.
 */

export const LABELS: HistoryLabels = {
  title: "History",
  changes: (n) => (n === 1 ? "change" : "changes"),
  asWeighed: " · as weighed",
  ofCount: (of) => `of ${of}`,
  toEnd: "at the end",
  play: "Play the history",
  pause: "Pause",
  goStart: "Go to the start of the history",
  goEnd: "Go to the end of the history",
  empty: "Each addition will appear here, in its order.",
};

const FAMILY = {
  citrus: { colour: "#c3b503", title: "Citrus" },
  floral: { colour: "#c475aa", title: "Floral" },
  woody: { colour: "#923002", title: "Woody" },
  animal: { colour: "#d22c50", title: "Animal" },
  green: { colour: "#43cd99", title: "Green" },
  gourmand: { colour: "#d4a373", title: "Gourmand" },
} as const;

/** An addition with its orb drawn from its family colours, still, as the bench shows it. */
function add(id: string, name: string, icon: HistoryItem["icon"], amount: string, sub: string, families: (keyof typeof FAMILY)[], seed: number, warning?: HistoryItem["warning"]): HistoryItem {
  const colours = families.map((f, i) => ({ color: FAMILY[f].colour, share: families.length - i }));
  return {
    id,
    kind: "add",
    title: name,
    sub,
    amount: `+${amount}`,
    warning: warning ?? null,
    icon,
    family: FAMILY[families[0]],
    orb: (size: number) => (
      <MaterialOrb size={Math.max(16, Math.round(size))} mode="still" seed={seed} look={{ families: colours, intensity: 0.6, diffusion: 0.3, luminosity: 0.3, contour: 0.5, note: "heart" }} />
    ),
  };
}

export const SAMPLE_ITEMS: readonly HistoryItem[] = [
  add("c1", "Bergamot oil", { text: "BeO", type: "O", typeTitle: "oil" }, "1.2 g", "1.2 g, neat", ["citrus", "green"], 3),
  add("c2", "Hedione", { text: "He" }, "2.4 g", "2.4 g, neat", ["floral"], 11),
  add("c3", "Iso E Super", { text: "IES" }, "1.8 g", "1.8 g, neat", ["woody"], 19),
  { id: "c4", kind: "note", title: "Note", sub: "«Top too sharp; more woods»", amount: null },
  add("c5", "Ambroxan", { text: "Ax" }, "15 mg", "15 mg at 10% in DPG", ["animal", "woody"], 23, "error"),
  { id: "c6", kind: "reweigh", title: "Reweigh", sub: "Reweighed: 18.412 g gross", amount: null },
  add("c7", "Vanillin", { text: "Va" }, "320 mg", "320 mg at 10% in DPG", ["gourmand"], 29),
  { id: "c8", kind: "set-mass", title: "Hedione", sub: "mass changed to 2.1 g", amount: "→ 2.1 g" },
  add("c9", "Galbanum", { text: "Gb", mark: "²" }, "40 mg", "40 mg at 1% in DPG", ["green"], 31),
];

/** The examples the board's top bar offers for the history. */
export const SAMPLES = [
  { value: "history-end", label: "Historial: al final" },
  { value: "history-frame-4", label: "Historial: en el cambio 4" },
  { value: "history-hover", label: "Historial: lupa en el cambio 5" },
  { value: "history-empty", label: "Historial: vacío" },
] as const;

const noop = () => {};

/** The history an example stands for. */
export function sampleHistory(sample: string): HistoryData {
  const base: HistoryData = { items: SAMPLE_ITEMS, frame: null, selectedId: null, playing: false, onSelect: noop, onFrame: noop, onTogglePlay: noop, labels: LABELS };
  switch (sample) {
    case "history-frame-4":
      return { ...base, frame: 4, selectedId: "c2" };
    case "history-hover":
      return { ...base, hoverIndex: 4 };
    case "history-empty":
      return { ...base, items: [] };
    default:
      return base;
  }
}

/** The fichas' preview: the example history around the piece. */
export function HistorySample({ sample, children }: { sample: string; children: ReactNode }) {
  return <HistoryProvider value={sampleHistory(sample)}>{children}</HistoryProvider>;
}
