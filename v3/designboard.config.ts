/**
 * What Designboard (smortenax/designboard) needs to serve this app's history dock on the board
 * (task C4). Run the board from its own folder with
 *
 *   DESIGNBOARD_APP=../perfumeria-app/v3 npm run dev
 *
 * Everything it imports is inside v3/ (V3-21): the board's runtime is copied in src/designboard/.
 * The board writes v3/designboard.composition.json, which HistoryDock reads.
 */
// First: the copied runtime names tokens as this app does (--surface-raised…) before any piece loads.
import "./src/designboard/naming";
import { defineBoardConfig } from "./src/designboard/adapter/config";
import { parseComposition } from "./src/designboard/core/composition";
import type { ComponentDef } from "./src/designboard/core/manifest";
import { panel } from "./src/designboard/library/basic";
import { HISTORY_FICHAS } from "./src/designboard/library/history/history.fichas";
import { perfumeriaCssVar } from "./src/designboard/tokenNames";
import tokens from "./src/designboard/perfumeria.tokens.json";
import composition from "./designboard.composition.json";

export default defineBoardConfig({
  app: "perfumeria-v3",
  label: "Perfumería v3 · historial",
  components: [panel, ...HISTORY_FICHAS] as unknown as ComponentDef[],
  tokens,
  cssVarOf: perfumeriaCssVar,
  starter: () => parseComposition(JSON.stringify(composition)),
  background: "color.surface.base",
});
