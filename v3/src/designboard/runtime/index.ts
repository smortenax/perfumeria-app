// Copied from designboard 4aa3488 (src/runtime/index.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
/**
 * Everything an app needs to draw what the board composed. An app copies this folder and the core
 * files it uses with `npm run copy-runtime -- <dest>` and imports from the copy's `runtime/index`.
 */
export { ComposedScreen, boardAtWidth, pxOf } from "./ComposedScreen";
export { cssLengthToPx, pxFromCss } from "./cssTokens";
export { LinkProvider, resolverFrom, type LinkResolver } from "./links";
export { blankComposition, starterComposition, type StarterSource } from "./starter";
export { CompositionSource, readComposition, useComposition, type CompositionState, type UseCompositionOptions, type UseCompositionResult } from "./useComposition";
export { clampComposition, parseComposition, pickArtboard, runtimeMismatch, serializeComposition, type Artboard, type Composition } from "../core/composition";
export { makeLibrary, type ComponentDef, type Library } from "../core/manifest";
export { cssVarName, setTokenNaming, tokenVar, type CssVarOf } from "../core/tokens";
export { RUNTIME_VERSION } from "../core/runtimeVersion";
