// Copied from designboard 4aa3488 (src/apps/perfumeria/tokenNames.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
/**
 * How Perfumería v3 names its tokens in CSS (v3/src/theme/tokens.css at 322e353), so the board
 * declares and reads the same custom properties the app does:
 *
 * - colours drop "color.": color.surface.raised → --surface-raised, color.accent.default → --accent-default;
 *   a status colour's default drops ".default": color.status.red.default → --status-red;
 * - font sizes are "--size-text-*": font.size.md → --size-text-md;
 * - families are "--font-*": font.family.body → --font-body;
 * - the rest keeps the path: radius.control → --radius-control, size.target → --size-target.
 */
export function perfumeriaCssVar(path: string): string {
  if (path.startsWith("font.size.")) return "--size-text-" + path.slice("font.size.".length).replace(/\./g, "-");
  if (path.startsWith("font.family.")) return "--font-" + path.slice("font.family.".length).replace(/\./g, "-");
  let p = path.startsWith("color.") ? path.slice("color.".length) : path;
  p = p.replace(/^(status\.[^.]+)\.default$/, "$1");
  return "--" + p.replace(/\./g, "-");
}
