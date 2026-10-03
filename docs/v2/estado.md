# Estado de la v2 del modelo de materiales

Se lee al empezar cada sesión y se actualiza al terminar (30 líneas como máximo).
Autoridad: [`decisiones-v2.md`](decisiones-v2.md) (D1–D11). La v1 está congelada en la etiqueta
`glosario-v1`; sus errores, en [`errores-v1.md`](errores-v1.md).

## Fases

- [x] **Fases 0 a 2** (hasta el 2026-10-03): esquema, validador, IFRA de punta a punta, D2, D7 y D8.
- [x] **Fase 3 — La F-001 entera en la v2** (2026-10-03): lotes 3a a 3d, 60 materiales. La F-001 se
  calcula entera con la v2 y su comparación con la v1, con las correspondencias que el usuario eligió,
  está en [`comparacion-fase3.md`](comparacion-fase3.md), **a la espera de su revisión**.
- [ ] **Fase 4 — Los 32 productos de Perfumiarz**, en dos lotes: 23 documentados y 9 parciales o sin
  documentos. Las sustancias de los certificados salen de `docs/proveedores/productos-sustancias.csv`.
  Los topes van por producto (D4).
- [ ] **Fase 5 — La v2 por defecto en la app.** Lo que solo está en la v1 aparece como «v1, sin
  revisar». Las fórmulas se migran al abrirlas, con registro-ids y comprobación de CAS. La ficha
  enseña la autoridad y el documento de cada cifra. **Requisito:** la interfaz explica cada «no»,
  incluido el grupo combinado de fototóxicos (D10) con sus miembros y su suma (`combinedChecks`), y
  marca las condiciones supuestas (D11).
- [ ] **Fase 6 — El resto del glosario**, por clase, en lotes de 300 como máximo, con los conflictos
  agrupados por tipo. Nada entra con más autoridad que su fuente. Buscar los errores de `errores-v1.md`.

## Pendiente de revisión del usuario

- La regla de condiciones (D11) deja **pendientes** las especificaciones sin afirmación: linalol (187),
  cedro (184), AAG (188), estírax (078), metil ionona (063). Probada: musgo de roble de IFF (067). Supuesta:
  cade (119). Sin commit hasta que lo vea.
- Lote 3d: el cade (supuesto rectificado), el láudano, el cacao, el olíbano (aceite de Boswellia sacra), las
  tinturas de ámbar gris y de haba tonka (su cumarina, pendiente) y la esencia de trufa (base).
