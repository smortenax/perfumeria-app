import { describe, expect, it } from "vitest";
import composed from "../../designboard.composition.json";
import { clampComposition, parseComposition, pickArtboard, type LayerNode } from "../designboard/core/composition";
import { makeLibrary, type ComponentDef } from "../designboard/core/manifest";
import { panel } from "../designboard/library/basic";
import { HISTORY_FICHAS } from "../designboard/library/history/history.fichas";

// The history's composition, as Designboard writes it (task C4): HistoryDock reads it at start-up.
const library = makeLibrary([panel, ...HISTORY_FICHAS] as unknown as ComponentDef[]);
const composition = clampComposition(parseComposition(JSON.stringify(composed)), library);
const types = (nodes: readonly LayerNode[]) => nodes.map((n) => (n.kind === "component" ? n.type : n.kind));

describe("the history's composition file", () => {
  it("uses only pieces the app has", () => {
    for (const board of composition.artboards) for (const type of types(board.children)) expect(library.has(type)).toBe(true);
  });

  it("picks the phone bar up to 40 rem and the desktop bar above", () => {
    expect(pickArtboard(composition, 390)?.width).toBe(390);
    expect(pickArtboard(composition, 640)?.width).toBe(390);
    expect(pickArtboard(composition, 641)?.width).toBe(1440);
    expect(pickArtboard(composition, 1920)?.width).toBe(1440);
  });

  it("keeps a chip edited below its floor at 24 px (WCAG 2.5.8)", () => {
    const edited = JSON.parse(JSON.stringify(composed)) as { artboards: { children: { type: string; params: Record<string, unknown> }[] }[] };
    for (const b of edited.artboards) for (const n of b.children) if (n.type === "history-track") n.params.chip = 10;
    const clamped = clampComposition(parseComposition(JSON.stringify(edited)), library);
    const track = clamped.artboards[0].children.find((n) => n.kind === "component" && n.type === "history-track");
    expect(track && track.kind === "component" ? track.params.chip : null).toBe(24);
  });
});
