import { describe, expect, it } from "vitest";
import composed from "../../designboard.composition.json";
import config from "../../designboard.config";
import { allNodes, clampComposition, parseComposition, pickArtboard } from "../designboard/core/composition";
import { makeLibrary } from "../designboard/core/manifest";

// The history's composition, as Designboard writes it (task C4): HistoryDock reads it at start-up.
const library = makeLibrary(config.components);
const composition = clampComposition(parseComposition(composed), library);

describe("the history's composition file", () => {
  it("uses only pieces the app has", () => {
    for (const board of composition.artboards) for (const n of allNodes(board.children)) if (n.kind === "component") expect(library.has(n.type)).toBe(true);
  });

  it("picks the phone bar up to 40 rem and the desktop bar above", () => {
    expect(pickArtboard(composition, 390)?.width).toBe(390);
    expect(pickArtboard(composition, 640)?.width).toBe(390);
    expect(pickArtboard(composition, 641)?.width).toBe(1440);
    expect(pickArtboard(composition, 1920)?.width).toBe(1440);
  });

  it("keeps a chip edited below its floor at 24 px (WCAG 2.5.8)", () => {
    const edited = parseComposition(JSON.parse(JSON.stringify(composed)));
    for (const b of edited.artboards) for (const n of allNodes(b.children)) if (n.kind === "component" && n.type === "history-track") n.params = { ...n.params, chip: 10 };
    const clamped = clampComposition(edited, library);
    const track = allNodes(clamped.artboards[0].children).find((n) => n.kind === "component" && n.type === "history-track");
    expect(track && track.kind === "component" ? track.params.chip : null).toBe(24);
  });
});
