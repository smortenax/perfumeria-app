// Copied from designboard 3f221ae (src/library/perfumeria/dialog/dialog.ficha.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { useId, type CSSProperties } from "react";
import type { ComponentDef } from "../../../core/manifest";
import { tokenVar } from "../../../core/tokens";
import { BenchRoot } from "../bench/BenchRoot";
import { Button } from "../button/Button";
import "../button/buttons.css";

/**
 * The bench's dialog: a title, a line of help, one field or none, an error when there is one, and
 * Cancel beside the action that accepts (primary, or danger when it deletes). Its look is `.modal`,
 * `.modal-body`, `.modal h2`, `.modal .help`, `.modal .field`, `.modal input` and `.modal-actions` in
 * v3/src/bench/bench.css (copied unchanged from perfumeria-app v3 at ee38168, see
 * ../bench/BenchRoot.tsx); its buttons are the app's Button, the board's copy in ../button.
 *
 * Modal is private to v3/src/bench/Dialogs.tsx, which imports the formulas, the arithmetic and the
 * database, and opens a native <dialog> with showModal() over the whole page. That cannot sit in a box
 * on the board, so this ficha writes Modal's markup with PromptDialog's and ConfirmDialog's bodies
 * (Dialogs.tsx lines 49 to 88, 145 to 154 and 171), the same classes, in a <div role="dialog">. The
 * words are sample text from the app's texts.
 *
 * Params reach it as inline style and as --radius-large, which bench.css reads. The radius (10 px,
 * the app's --radius-large), the body's gap (10 px), the input's height (36 px) and the buttons'
 * height (34 px) are numbers: the token file has none of them yet. The padding is the token space.inset,
 * which is the 16 px the app writes. The shadow stays in bench.css: there are no shadow tokens.
 */
export type DialogParams = {
  kind: string;
  danger: boolean;
  title: string;
  help: string;
  fieldLabel: string;
  value: string;
  error: string;
  cancelLabel: string;
  acceptLabel: string;
  background: string;
  border: string;
  titleSize: string;
  helpColor: string;
  padding: string;
  radius: number;
  gap: number;
  inputHeight: number;
  buttonHeight: number;
};

export function dialogStyle(p: DialogParams): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    maxHeight: "none",
    background: tokenVar(p.background),
    borderColor: tokenVar(p.border),
  };
}

export function PerfumeriaDialog({ params: p }: { params: DialogParams }) {
  const titleId = useId();
  const withField = p.kind === "prompt";
  const button = { minHeight: p.buttonHeight, height: p.buttonHeight };
  return (
    <BenchRoot style={{ "--radius-large": `${p.radius}px` } as CSSProperties}>
      <div className="modal" role="dialog" aria-labelledby={titleId} style={dialogStyle(p)}>
        <form className="modal-body" style={{ padding: tokenVar(p.padding, "0"), gap: p.gap }} onSubmit={(e) => e.preventDefault()}>
          <h2 id={titleId} style={{ fontSize: tokenVar(p.titleSize) }}>
            {p.title}
          </h2>
          {p.help && (
            <p className="help" style={{ color: tokenVar(p.helpColor) }}>
              {p.help}
            </p>
          )}
          {withField && (
            <label className="field">
              <span>{p.fieldLabel}</span>
              <input value={p.value} readOnly style={{ height: p.inputHeight }} />
            </label>
          )}
          {p.error && <p className="error">{p.error}</p>}
          <div className="modal-actions">
            <Button variant="secondary" tabIndex={-1} style={button}>
              {p.cancelLabel}
            </Button>
            <Button variant={p.danger ? "danger" : "primary"} tabIndex={-1} style={button}>
              {p.acceptLabel}
            </Button>
          </div>
        </form>
      </div>
    </BenchRoot>
  );
}

const sample = (label: string, value: string, help = "De muestra: en la app llega de sus textos.") => ({ kind: "text", label, default: value, help }) as const;

export const perfumeriaDialog: ComponentDef<DialogParams> = {
  type: "perfumeria-dialog",
  name: "Diálogo",
  source: "perfumeria-app",
  description: "Los diálogos del banco: título, una línea de ayuda, un campo o ninguno, y Cancelar junto a la acción (principal, o peligro si borra).",
  defaultSize: { w: 460, h: 220 },
  params: {
    kind: {
      kind: "select",
      label: "Tipo",
      variant: true,
      options: [
        { value: "prompt", label: "Con campo" },
        { value: "confirm", label: "Confirmación" },
      ],
      default: "prompt",
    },
    danger: { kind: "boolean", label: "Borra algo", default: false, help: "La acción usa el botón de peligro." },
    title: sample("Título", "Rename the bench"),
    help: sample("Ayuda", "", "De muestra. Vacío: sin línea de ayuda. En una confirmación, su texto."),
    fieldLabel: sample("Etiqueta del campo", "Name of the bench"),
    value: sample("Valor del campo", "Morning bench"),
    error: sample("Error", "", "De muestra. Vacío: sin error."),
    cancelLabel: sample("Cancelar", "Cancel"),
    acceptLabel: sample("Aceptar", "Rename", "De muestra: dice lo que hace («Rename», «Delete»), no «OK»."),
    background: { kind: "token", label: "Fondo", groups: ["color.surface"], default: "color.surface.raised" },
    border: { kind: "token", label: "Borde", groups: ["color.border"], default: "color.border.subtle" },
    titleSize: { kind: "token", label: "Tamaño del título", groups: ["font.size"], default: "font.size.lg" },
    helpColor: { kind: "token", label: "Color de la ayuda", groups: ["color.text"], default: "color.text.muted" },
    padding: { kind: "token", label: "Relleno", groups: ["space"], default: "space.inset" },
    radius: { kind: "number", label: "Radio", min: 0, max: 24, step: 1, default: 10, unit: "px", help: "Sin token aún (--radius-large en la app)." },
    gap: { kind: "number", label: "Separación", min: 0, max: 24, step: 1, default: 10, unit: "px", help: "Entre título, ayuda, campo y botones. Sin token aún." },
    inputHeight: { kind: "number", label: "Alto del campo", min: 24, max: 48, step: 1, default: 36, unit: "px", help: "Sin token aún. 24 px es el mínimo de WCAG 2.5.8." },
    buttonHeight: { kind: "number", label: "Alto de los botones", min: 24, max: 48, step: 1, default: 34, unit: "px", help: "Sin token aún. 24 px es el mínimo de WCAG 2.5.8." },
  },
  render: ({ params }) => <PerfumeriaDialog params={params} />,
};
