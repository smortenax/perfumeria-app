// Copied from designboard 3f221ae (src/library/perfumeria/toast/toast.ficha.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { CSSProperties } from "react";
import type { ComponentDef } from "../../../core/manifest";
import { cssVarName, tokenVar } from "../../../core/tokens";
import { Toast } from "./Toast";
import "./toast.css";

/**
 * Perfumería's toast: what just happened, in one line, with Undo and Close. On the bench it rides
 * above the history after each change. Toast.tsx is copied unchanged from perfumeria-app v3 at
 * ee38168 (`v3/src/Toast.tsx`), with the texts file it imports (`v3/src/i18n/en.ts`, for «Undo» and
 * «Close»); toast.css is the toast's excerpt of `v3/src/App.css` (see its header).
 *
 * Toast takes no style, and its CSS reads the app's token names directly: the ink behind it is
 * --text-default, its text --surface-raised, its radius --radius-control, its size --size-text-md.
 * So a chosen token reaches it as those names redeclared on a wrapper (see toastVars), under the
 * app's naming rule.
 * Empty keeps the app's own.
 *
 * The paddings (6 px and 14 px), the buttons' 36 px and the shadow stay in toast.css: they are in rem
 * or mixed colours there, and the token file has no control padding, inner target or shadow yet.
 */
export type ToastParams = {
  message: string;
  undo: boolean;
  background: string;
  textColor: string;
  radius: string;
  fontSize: string;
};

/**
 * Two wrappers, so a choice never reads itself: the outer one takes each chosen token under a name of
 * its own (--pft-*), the inner one redeclares the app's names from those. Declared on one element,
 * «ink = paper, paper = ink» would be a cycle and draw neither.
 */
export function toastVars(p: ToastParams): { outer: CSSProperties; inner: CSSProperties } {
  const outer: Record<string, string> = { width: "100%", height: "100%" };
  const inner: Record<string, string> = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    fontFamily: tokenVar("font.family.body", "system-ui"),
  };
  const pass = (param: string, appToken: string, own: string) => {
    if (!param) return;
    outer[own] = tokenVar(param);
    inner[cssVarName(appToken)] = `var(${own})`;
  };
  pass(p.background, "color.text.default", "--pft-background");
  pass(p.textColor, "color.surface.raised", "--pft-text");
  pass(p.radius, "radius.control", "--pft-radius");
  pass(p.fontSize, "font.size.md", "--pft-size");
  return { outer: outer as CSSProperties, inner: inner as CSSProperties };
}

const none = () => {};

export function PerfumeriaToast({ params }: { params: ToastParams }) {
  const { outer, inner } = toastVars(params);
  return (
    <div style={outer}>
      <div style={inner}>
        <Toast message={params.message || null} onUndo={params.undo ? none : undefined} onClose={none} />
      </div>
    </div>
  );
}

const keep = (label: string, groups: readonly string[], help?: string) =>
  ({ kind: "token", label, groups, default: "", none: "El de la app", help: help ?? "Vacío: el de la app." }) as const;

export const perfumeriaToast: ComponentDef<ToastParams> = {
  type: "perfumeria-toast",
  name: "Aviso con deshacer",
  source: "perfumeria-app",
  description: "Lo que acaba de pasar, en una línea, con Deshacer y Cerrar. En el banco sale sobre el historial tras cada cambio.",
  defaultSize: { w: 460, h: 48 },
  params: {
    message: { kind: "text", label: "Mensaje", default: "Added Hedione, 1.2 g", help: "De muestra: en la app lo dice el cambio que acaba de pasar." },
    undo: { kind: "boolean", label: "Con Deshacer", default: true },
    background: keep("Fondo", ["color.text", "color.surface", "color.accent"], "Vacío: la tinta de la app (color.text.default)."),
    textColor: keep("Color del texto", ["color.text", "color.surface"], "Vacío: el papel de la app (color.surface.raised)."),
    radius: keep("Radio", ["radius"], "Vacío: radius.control."),
    fontSize: keep("Tamaño de letra", ["font.size"], "Vacío: font.size.md."),
  },
  render: ({ params }) => <PerfumeriaToast params={params} />,
};
