/**
 * What Designboard (smortenax/designboard) serves on the board for this app: the history dock's
 * pieces, Perfumería's tokens and naming rule, and the starter. The config itself is copied from
 * designboard with `npm run copy-runtime -- ../perfumeria-app/v3/src/designboard src/apps/perfumeria`
 * (V3-21: nothing here imports from outside v3/). Link this folder, v3/, in the board, or run it
 * with `DESIGNBOARD_APP=../perfumeria-app/v3 npm run dev`. The board writes
 * v3/designboard.composition.json, which HistoryDock reads (and follows live under `npm run dev`).
 */
export { default } from "./src/designboard/apps/perfumeria/designboard.config";
