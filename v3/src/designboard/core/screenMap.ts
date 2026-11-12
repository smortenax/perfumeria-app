// Copied from designboard 4aa3488 (src/core/screenMap.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { Artboard } from "./composition";

/**
 * The screen map: one artboard per route of an app, so the board starts from the screens the
 * app really has instead of a blank page.
 *
 * Routes come from the app's config, either listed by hand (`routes`) or read out of the source
 * of its router (`routesFrom`, see `extractHashRoutes`). Only hash routes are read, the kind
 * Perfumería uses: `hash === "#materiales"` and `/^#material\/([^/]+)(\/editar)?$/`.
 */

export interface RouteDef {
  /** Path with `:param` for each variable segment, e.g. "#material/:id/editar". */
  path: string;
  /** Name shown on the artboard. Defaults to the path. */
  label?: string;
}

const MAX_PATHS = 64;

/** Expands one regex source (without `^` and `$`) into plain paths: optional groups give two paths, `(a|b)` one each, `([^/]+)` a `:param`. */
function expand(src: string, counter: { n: number }): string[] {
  const at = src.indexOf("(");
  if (at < 0) return [src];
  // find the matching close paren
  let depth = 0;
  let close = -1;
  for (let i = at; i < src.length; i++) {
    if (src[i] === "\\") i++;
    else if (src[i] === "(") depth++;
    else if (src[i] === ")" && --depth === 0) {
      close = i;
      break;
    }
  }
  if (close < 0) return [src];
  const before = src.slice(0, at);
  let inner = src.slice(at + 1, close);
  let rest = src.slice(close + 1);
  const optional = rest.startsWith("?");
  if (optional) rest = rest.slice(1);
  let options: string[];
  if (inner.startsWith("?:")) options = expand(inner.slice(2), counter);
  else if (inner === "[^/]+") {
    counter.n++;
    options = [counter.n === 1 ? ":id" : `:id${counter.n}`];
  } else if (/^[\w-]+(\|[\w-]+)+$/.test(inner)) options = inner.split("|");
  else options = expand(inner, counter);
  const tails = expand(rest, counter);
  const out: string[] = [];
  for (const t of tails) {
    if (optional) out.push(before + t);
    for (const o of options) out.push(before + o + t);
  }
  return out.slice(0, MAX_PATHS);
}

function unescape(s: string): string {
  return s.replace(/\\\//g, "/").replace(/\\(.)/g, "$1");
}

/** Reads hash routes out of a router's source text. Duplicates are dropped; the order of the source is kept. */
export function extractHashRoutes(source: string): RouteDef[] {
  const found: string[] = [];
  const add = (p: string) => {
    if (!found.includes(p)) found.push(p);
  };
  for (const m of source.matchAll(/\/\^(#(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\n\\[])*?)\$\//g)) {
    for (const p of expand(m[1], { n: 0 })) add(unescape(p));
  }
  for (const m of source.matchAll(/hash\s*===\s*(["'])(#[^"']*)\1/g)) add(m[2]);
  return found.map((path) => ({ path }));
}

export function routeId(path: string): string {
  return "route-" + (path.replace(/^#/, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "inicio");
}

export interface MapOptions {
  width?: number;
  height?: number;
  /** Colour token path for the screens' ground. */
  background: string;
  /** Screens per row. */
  columns?: number;
  gap?: number;
}

/** Artboards for the routes that have none yet (matched by the artboard's `route`). Existing screens are never touched. */
export function screenMapArtboards(routes: readonly RouteDef[], existing: readonly Artboard[], opts: MapOptions): Artboard[] {
  const have = new Set(existing.map((b) => b.route).filter(Boolean));
  const missing = routes.filter((r) => !have.has(r.path));
  const w = opts.width ?? 1440;
  const h = opts.height ?? 900;
  const cols = Math.max(1, opts.columns ?? 4);
  const gap = opts.gap ?? 120;
  const startY = existing.length ? Math.max(...existing.map((b) => b.y + b.height)) + gap * 2 : 0;
  const ids = new Set(existing.map((b) => b.id));
  return missing.map((r, i) => {
    const base = routeId(r.path);
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    ids.add(id);
    return {
      id,
      name: `Ruta · ${r.label ?? (r.path || "#")}`,
      route: r.path,
      width: w,
      height: h,
      x: (i % cols) * (w + gap),
      y: startY + Math.floor(i / cols) * (h + gap),
      background: opts.background,
      layout: { mode: "free" as const },
      children: [],
    };
  });
}
