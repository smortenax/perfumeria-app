/**
 * What Designboard (smortenax/designboard) needs to serve this app's history dock on the board
 * (task C4). Run the board from its own folder with
 *
 *   DESIGNBOARD_APP=../perfumeria-app/v3 npm run dev
 *
 * Everything it imports is inside v3/ (V3-21): the board's runtime is copied in src/designboard/.
 * The board writes v3/designboard.composition.json, which HistoryDock reads (and follows live
 * under `npm run dev`). Link this folder, v3/, in the board's desktop app.
 */
import { defineBoardConfig } from "./src/designboard/adapter/config";
import type { ComponentDef } from "./src/designboard/core/manifest";
import { panel } from "./src/designboard/library/basic";
import { HISTORY_FICHAS } from "./src/designboard/library/history/history.fichas";
import { perfumeriaCssVar } from "./src/designboard/tokenNames";
import tokens from "./src/designboard/perfumeria.tokens.json";
import { historyComposition } from "./src/designboard/historyComposition";

export default defineBoardConfig({
  app: "perfumeria-v3",
  label: "Perfumería v3 · historial",
  components: [panel, ...HISTORY_FICHAS] as unknown as ComponentDef[],
  tokens,
  cssVarOf: perfumeriaCssVar,
  // The board opens on it when there is no file, and the app falls back to it (starterComposition).
  starter: historyComposition,
  background: "color.surface.base",
});
