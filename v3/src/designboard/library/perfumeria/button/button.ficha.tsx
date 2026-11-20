// Copied from designboard 3f221ae (src/library/perfumeria/button/button.ficha.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { CSSProperties } from "react";
import type { ComponentDef } from "../../../core/manifest";
import { tokenVar } from "../../../core/tokens";
import { Button, type ButtonVariant } from "./Button";
import "./buttons.css";

/**
 * Perfumería's button (primary, secondary, danger), used on the bench for its dialogs and its way
 * back when a formula does not load. Button.tsx and buttons.css are copied unchanged from
 * perfumeria-app v3 at ee38168 (`v3/src/Button.tsx`, `v3/src/theme/buttons.css`); only this ficha
 * is new. Made with the `exportar-como-ficha` skill.
 *
 * The ficha changes nothing inside the component: it passes `style` and `disabled`, which the
 * button already takes, and declares around it what buttons.css reads but the token file does not
 * name (`--red`, `--red-bg`, aliases the app sets in App.css and bench.css).
 *
 * Colours are empty by default: the variant's own look from buttons.css, with its hover. A colour
 * chosen on the board replaces it in every state, hover included.
 *
 * The height (40 px) and side padding (14 px) are numbers, not tokens: Perfumería's token file has
 * no control height or control padding yet. They are proposed to the vault in the PR that added
 * this ficha; once the file has them they become token params.
 */
export type ButtonParams = {
  variant: string;
  label: string;
  disabled: boolean;
  icon: string;
  background: string;
  border: string;
  textColor: string;
  radius: string;
  fontSize: string;
  minHeight: number;
  padding: number;
};

const VARIANTS: readonly ButtonVariant[] = ["primary", "secondary", "danger"];

/** The style the ficha hands the button: only what a param sets, so the rest stays buttons.css's. */
export function buttonStyle(p: ButtonParams): CSSProperties {
  const s: CSSProperties = {
    width: "100%",
    height: "100%",
    minHeight: p.minHeight,
    padding: `0 ${p.padding}px`,
    borderRadius: tokenVar(p.radius, "0"),
    fontSize: "inherit",
  };
  if (p.background) s.background = tokenVar(p.background);
  if (p.border) s.borderColor = tokenVar(p.border);
  if (p.textColor) s.color = tokenVar(p.textColor);
  return s;
}

/** An SVG the owner gave, drawn in the button's text colour. */
function Icon({ src }: { src: string }) {
  const mask = `url("${src.replace(/"/g, "%22")}") center / contain no-repeat`;
  return <span aria-hidden="true" style={{ display: "block", flex: "none", width: "1.125em", height: "1.125em", background: "currentColor", WebkitMask: mask, mask }} />;
}

export function PerfumeriaButton({ params }: { params: ButtonParams }) {
  const variant = (VARIANTS as readonly string[]).includes(params.variant) ? (params.variant as ButtonVariant) : "secondary";
  // Read while drawing, so the app's token names apply (see setTokenNaming).
  const around = {
    display: "flex",
    width: "100%",
    height: "100%",
    fontFamily: tokenVar("font.family.body", "system-ui"),
    fontSize: tokenVar(params.fontSize, "inherit"),
    "--red": tokenVar("color.status.red.default"),
    "--red-bg": tokenVar("color.status.red.bg"),
  } as CSSProperties;
  return (
    <span style={around}>
      <Button variant={variant} disabled={params.disabled} style={buttonStyle(params)}>
        {params.icon && <Icon src={params.icon} />}
        {params.label}
      </Button>
    </span>
  );
}

const colour = (label: string, groups: readonly string[]) =>
  ({ kind: "token", label, groups, default: "", none: "Del estilo", help: "Vacío: el color de la variante, con su hover." }) as const;

export const perfumeriaButton: ComponentDef<ButtonParams> = {
  type: "perfumeria-button",
  name: "Botón",
  source: "perfumeria-app",
  description: "Los tres botones de Perfumería: principal (tinta), secundario (papel con borde) y peligro (borde rojo). En el banco, los de sus diálogos.",
  defaultSize: { w: 120, h: 40 },
  params: {
    variant: {
      kind: "select",
      label: "Variante",
      variant: true,
      options: [
        { value: "primary", label: "Principal" },
        { value: "secondary", label: "Secundario" },
        { value: "danger", label: "Peligro" },
      ],
      default: "secondary",
    },
    label: { kind: "text", label: "Texto", default: "Save", help: "De muestra: en la app, el texto llega de sus textos (V3-71)." },
    disabled: { kind: "boolean", label: "Desactivado", default: false },
    icon: { kind: "slot", label: "Icono", accept: "svg", default: "", help: "Opcional, antes del texto. Toma el color del texto." },
    background: colour("Fondo", ["color.surface", "color.accent", "color.status"]),
    border: colour("Borde", ["color.border", "color.accent", "color.status"]),
    textColor: colour("Color del texto", ["color.text", "color.accent", "color.status"]),
    radius: { kind: "token", label: "Radio", groups: ["radius"], default: "radius.control", none: "Sin radio" },
    fontSize: { kind: "token", label: "Tamaño de letra", groups: ["font.size"], default: "font.size.lg", help: "En la app la hereda de su sitio; 16 px es la del documento." },
    minHeight: { kind: "number", label: "Alto mínimo", min: 24, max: 64, step: 1, default: 40, unit: "px", help: "Sin token aún. 24 px es el mínimo de WCAG 2.5.8; el objetivo de la app (size.target) es 44." },
    padding: { kind: "number", label: "Relleno lateral", min: 0, max: 32, step: 1, default: 14, unit: "px", help: "Sin token aún." },
  },
  render: ({ params }) => <PerfumeriaButton params={params} />,
};
