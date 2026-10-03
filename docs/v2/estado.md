# Estado de la v2 del modelo de materiales

Se lee al empezar cada sesión y se actualiza al terminar (30 líneas como máximo).
Autoridad: [`decisiones-v2.md`](decisiones-v2.md) (D1–D10). La v1 está congelada en la etiqueta
`glosario-v1`; sus errores, en [`errores-v1.md`](errores-v1.md).

## Fases

- [x] **Fases 0 a 2** (hasta el 2026-10-03): esquema, validador, IFRA de punta a punta, D2, D7 y D8.
- [ ] **Fase 3 — La F-001 entera en la v2**, por lotes (`docs/v2/lotes.json`, `alta.py --lote`).
  Cierre: la F-001 se calcula entera con la v2 y su comparación con la v1 queda explicada, con la
  correspondencia de cada material elegida por el usuario. Hechos 3a, 3b y 3c; **3d preparado** (abajo).
- [ ] **Fase 4 — Los 32 productos de Perfumiarz**, en dos lotes: 23 documentados y 9 parciales o sin
  documentos. Las sustancias de los certificados salen de `docs/proveedores/productos-sustancias.csv`.
  Los topes van por producto (D4).
- [ ] **Fase 5 — La v2 por defecto en la app.** Lo que solo está en la v1 aparece como «v1, sin
  revisar». Las fórmulas se migran al abrirlas, con registro-ids y comprobación de CAS. La ficha
  enseña la autoridad y el documento de cada cifra. **Requisito:** la interfaz explica cada «no»,
  incluido el grupo combinado de fototóxicos (D10) con sus miembros y su suma (`combinedChecks`).
- [ ] **Fase 6 — El resto del glosario**, por clase, en lotes de 300 como máximo, con los conflictos
  agrupados por tipo. Nada entra con más autoridad que su fuente. Buscar los errores de `errores-v1.md`.

## Siguiente: lote 3d (Maese Lab)

- Cade, láudano, cacao y olíbano; tintura de ámbar gris, tintura de haba tonka y esencia de trufa (base).
  `alta.py --lote 3d`: 11 conflictos sin respuesta (6 forma, 2 sin-fila-v1, 1 tipo, 2 v1-correspondencia).
  Falta la tintura de ámbar y la de tonka para cerrar la F-001. El lote no entra hasta contestar.
- **Cade:** nada acredita que sea rectificado (la tienda dice «100% natural»; el cuaderno, que lo acredita
  un certificado). Sin él, el STD 119 deja un pendiente: el crudo está prohibido. Con él, la especificación
  de PAH es una condición. El grupo de PAH (STD 078 y 119, 1 ppb) sigue como condición, sin cifras.
