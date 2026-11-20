// Copied from designboard 3f221ae (src/apps/perfumeria/designboard.config.ts), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
/**
 * Perfumería's config for the history dock. It is kept here and copied into the app with the
 * runtime (`npm run copy-runtime -- ../perfumeria-app/v3/src/designboard src/apps/perfumeria`);
 * the app's `v3/designboard.config.ts` re-exports the copy. Serve it from here with
 *
 *   DESIGNBOARD_APP=src/apps/perfumeria npm run dev
 *
 * or from the app with `DESIGNBOARD_APP=../perfumeria-app/v3`.
 *
 * The fichas are in `src/library/perfumeria/` (the history's pieces, the button, the amount field,
 * the bench's card and dialog, and the toast); the orb is the
 * board's copy of the app's.
 */
import { defineBoardConfig } from "../../adapter/config";
import { panel, text } from "../../library/basic";
import { orb } from "../../library/orb/orb";
import { perfumeriaButton } from "../../library/perfumeria/button/button.ficha";
import { perfumeriaCard } from "../../library/perfumeria/card/card.ficha";
import { perfumeriaDialog } from "../../library/perfumeria/dialog/dialog.ficha";
import { perfumeriaField } from "../../library/perfumeria/field/field.ficha";
import { perfumeriaToast } from "../../library/perfumeria/toast/toast.ficha";
import { HISTORY_FICHAS } from "../../library/perfumeria/history/history.fichas";
import type { ComponentDef } from "../../core/manifest";
import perfumeria from "../../tokens/perfumeria.json";
import { historyComposition } from "./historyComposition";
import { perfumeriaCssVar } from "./tokenNames";
// The faces the app loads in v3/src/main.tsx, the same packages.
import atkinson from "@fontsource-variable/atkinson-hyperlegible-next?inline";
import geistMono from "@fontsource-variable/geist-mono?inline";

export default defineBoardConfig({
  app: "perfumeria",
  label: "Perfumería",
  components: [panel, text, ...HISTORY_FICHAS, perfumeriaButton, perfumeriaField, perfumeriaCard, perfumeriaDialog, perfumeriaToast, orb] as unknown as ComponentDef[],
  tokens: perfumeria,
  // The app's own names: --surface-raised, --size-text-md, --font-body, --orb-frame…
  cssVarOf: perfumeriaCssVar,
  starter: historyComposition,
  background: "color.surface.base",
  // The app's body (v3/src/App.css :root and body): the body font, the default ink, line height 1.5.
  root: { font: "font.family.body", color: "color.text.default", lineHeight: 1.5 },
  fonts: { "Atkinson Hyperlegible Next": atkinson, "Geist Mono": geistMono },
});
