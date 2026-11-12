// Copied from designboard 4aa3488 (src/core/links.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { ComponentDef, Params } from "./manifest";
import type { LayerNode } from "./composition";
import { hasChildren, isComponent } from "./composition";

/**
 * Linked images. A slot normally holds the image itself (a data URL). A *linked* slot holds a
 * reference to a file in the app's folder instead, `link:assets/vial.svg`, and the board
 * draws whatever the file holds now. The composition file stays small, and a redrawn file shows
 * up without importing it again.
 *
 * Paths are relative to the folder that holds the composition file, written with "/".
 */

export const LINK_PREFIX = "link:";

export function isLink(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(LINK_PREFIX) && value.length > LINK_PREFIX.length;
}

export function makeLink(path: string): string {
  return LINK_PREFIX + path;
}

/** The file path a link points at. */
export function linkPath(value: string): string {
  return value.slice(LINK_PREFIX.length);
}

/**
 * `file` relative to `folder` with "/" separators, or null when it is not inside the folder.
 * Windows paths compare without regard to case, as the file system does.
 */
export function relativeTo(folder: string, file: string): string | null {
  const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");
  const f = norm(folder);
  const p = norm(file);
  const windows = /^[a-zA-Z]:/.test(f);
  const head = windows ? f.toLowerCase() : f;
  const full = windows ? p.toLowerCase() : p;
  if (!full.startsWith(head + "/")) return null;
  const rel = p.slice(f.length + 1);
  return rel.split("/").some((part) => part === ".." || part === "") ? null : rel;
}

const MIME: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  ico: "image/x-icon",
};

export function mimeOf(path: string): string {
  return MIME[path.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}

export function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${mime};base64,${btoa(bin)}`;
}

/** Params with every linked slot value swapped for what `resolve` gives (the image to draw). */
export function resolveSlots(def: ComponentDef, params: Params, resolve: (path: string) => string): Params {
  let out: Params | null = null;
  for (const [key, p] of Object.entries(def.params)) {
    const v = params[key];
    if (p.kind === "slot" && isLink(v)) (out ??= { ...params })[key] = resolve(linkPath(v));
  }
  return out ?? params;
}

/** Every linked path used by a list of layers, at any depth. */
export function collectLinks(layers: readonly LayerNode[], into: Set<string> = new Set()): Set<string> {
  for (const n of layers) {
    if (isComponent(n)) {
      for (const v of Object.values(n.params)) if (isLink(v)) into.add(linkPath(v));
    } else if (hasChildren(n)) collectLinks(n.children, into);
  }
  return into;
}
