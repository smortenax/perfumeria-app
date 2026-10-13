/** The interface's texts, in Spanish (CLAUDE.md: the interface reads them from here). */
export const texts = {
  app: {
    name: "Perfumería",
    version: "v3",
    loading: "Abriendo…",
    signOut: "Salir",
  },
  signIn: {
    title: "Entrar",
    email: "Correo",
    password: "Contraseña",
    submit: "Entrar",
    working: "Entrando…",
    closed: "El registro está cerrado: las cuentas se crean a mano.",
    failed: "No se ha podido entrar",
  },
  start: {
    title: "Esqueleto de la v3",
    lead: "La app funciona en el navegador, también sin conexión. Todavía no tiene datos.",
    stepsTitle: "Lo que viene",
    steps: ["El glosario de materiales.", "La formulación."],
  },
  probe: {
    title: "Prueba de sincronización",
    lead: "Cada nota se guarda primero en este navegador y sube a Supabase cuando hay conexión.",
    note: "Nota",
    add: "Añadir",
    empty: "Todavía no hay notas.",
    connected: "Conectado con el servidor",
    offline: "Sin conexión con el servidor: se trabaja con la copia de este navegador",
    pending: (n: number) => (n === 1 ? "1 cambio pendiente de subir" : `${n} cambios pendientes de subir`),
    rejected: (n: number) =>
      n === 1 ? "1 cambio rechazado por Supabase, guardado aquí" : `${n} cambios rechazados por Supabase, guardados aquí`,
  },
} as const;
