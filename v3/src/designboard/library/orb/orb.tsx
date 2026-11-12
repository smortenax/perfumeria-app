// Copied from designboard 4aa3488 (src/library/orb/orb.tsx), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { ComponentDef } from "../../core/manifest";
import { MaterialOrb } from "./MaterialOrb";
import type { Note } from "./orbParams";

/**
 * The material orb from Perfumería v3, brought over unchanged (MaterialOrb, orbParams,
 * orbRenderer, orbShader come from design-vault `00-inbox/research/kit/material-orb`).
 * Only this ficha is new: it exposes what goes into the orb as board params.
 *
 * In the app these values come from the material's data; on the board you set them by hand
 * to see how each one changes the orb.
 */
type OrbP = {
  families: readonly { color: string; share: number }[];
  intensity: number;
  diffusion: number;
  luminosity: number;
  contour: number;
  note: string;
  mode: string;
  seed: number;
};

export const orb: ComponentDef<OrbP> = {
  type: "orb",
  name: "Orbe de material",
  source: "perfumeria-app",
  description: "El orbe real de Perfumería. Cada deslizador es un valor que en la app llega del material.",
  defaultSize: { w: 160, h: 160 },
  square: true,
  params: {
    families: {
      kind: "families",
      label: "Familias olfativas",
      max: 3,
      default: [
        { color: "#d9a441", share: 5 },
        { color: "#7fa36b", share: 3 },
        { color: "#9b6fb0", share: 2 },
      ],
      help: "Hasta tres colores con su peso. En la app vienen de las familias del material.",
    },
    intensity: { kind: "number", label: "Intensidad", min: 0, max: 1, step: 0.01, default: 0.6, help: "Densidad del color: lechoso a denso." },
    diffusion: { kind: "number", label: "Difusión", min: 0, max: 1, step: 0.01, default: 0.35, help: "Halo que se sale hacia el marco." },
    luminosity: { kind: "number", label: "Luminosidad", min: 0, max: 1, step: 0.01, default: 0.3, help: "Luz desde dentro." },
    contour: { kind: "number", label: "Contorno", min: 0, max: 1, step: 0.01, default: 0.5, help: "0 = esfera perfecta (molécula pura)." },
    note: {
      kind: "select",
      label: "Nota",
      options: [{ value: "top", label: "Salida" }, { value: "heart", label: "Corazón" }, { value: "base", label: "Fondo" }],
      default: "heart",
    },
    mode: { kind: "select", label: "Modo", options: [{ value: "live", label: "Animado" }, { value: "still", label: "Quieto" }], default: "live" },
    seed: { kind: "number", label: "Semilla del veteado", min: 0, max: 100, step: 1, default: 7 },
  },
  render: ({ params, width }) => (
    <MaterialOrb
      size={Math.max(16, Math.round(width))}
      mode={params.mode === "still" ? "still" : "live"}
      seed={params.seed}
      look={{
        families: params.families,
        intensity: params.intensity,
        diffusion: params.diffusion,
        luminosity: params.luminosity,
        contour: params.contour,
        note: params.note as Note,
      }}
    />
  ),
};
