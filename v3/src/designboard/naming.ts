/**
 * Tells the board's runtime how this app names its tokens in CSS (--surface-raised,
 * --size-text-md, --font-body), once, before any piece computes a `var(...)`. Imported for its
 * effect, first, by every module that draws a composition: some pieces compute their variables
 * when their module loads.
 */
import { setTokenNaming } from "./core/tokens";
import { perfumeriaCssVar } from "./tokenNames";

setTokenNaming(perfumeriaCssVar);
