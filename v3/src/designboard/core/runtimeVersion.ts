// Copied from designboard 4aa3488 (src/core/runtimeVersion.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
/**
 * The version of the runtime an app copies (`npm run copy-runtime`): what `ComposedScreen` and
 * the composition format promise. Bump it when a file written by this board could draw
 * differently, or not at all, with an older copy: a new field the runtime reads, a change in how
 * layers are laid out, a param the pieces now understand. The board writes it into every file it
 * saves (`runtime`), and an app warns when its copy is not the one the file was written with
 * (`runtimeMismatch`).
 */
export const RUNTIME_VERSION = "1.0";
