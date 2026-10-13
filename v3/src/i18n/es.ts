/** The interface's texts, in Spanish (CLAUDE.md: the interface reads them from here). */
export const texts = {
  app: {
    name: "Perfumería",
    version: "v3",
  },
  start: {
    title: "Esqueleto de la v3",
    lead: "La app funciona en el navegador. Todavía no tiene datos ni inicio de sesión.",
    stepsTitle: "Lo que viene",
    steps: [
      "La base de datos y la copia sin conexión.",
      "El glosario de materiales.",
      "La formulación.",
    ],
  },
} as const;
