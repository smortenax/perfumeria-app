// Copied from designboard 4aa3488 (src/apps/perfumeria/designboard.config.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
/**
 * Perfumería's config for the pilot of the history dock (task C2). It is the file the app will
 * hold as its own `designboard.config.ts` once it takes the pieces in; until then it lives here,
 * because the app is not changed from this repo. Serve it with
 *
 *   DESIGNBOARD_APP=src/apps/perfumeria npm run dev
 *
 * The fichas are in `src/library/perfumeria/history/`; the orb is the board's copy of the app's.
 */
import { defineBoardConfig } from "../../adapter/config";
import { panel } from "../../library/basic";
import { orb } from "../../library/orb/orb";
import { HISTORY_FICHAS } from "../../library/perfumeria/history/history.fichas";
import type { ComponentDef } from "../../core/manifest";
import perfumeria from "../../tokens/perfumeria.json";
import { historyComposition } from "./historyComposition";
import { perfumeriaCssVar } from "./tokenNames";

export default defineBoardConfig({
  app: "perfumeria",
  label: "Perfumería · historial",
  components: [panel, ...HISTORY_FICHAS, orb] as unknown as ComponentDef[],
  tokens: perfumeria,
  // The app's own names: --surface-raised, --size-text-md, --font-body, --orb-frame…
  cssVarOf: perfumeriaCssVar,
  starter: historyComposition,
  background: "color.surface.base",
});
