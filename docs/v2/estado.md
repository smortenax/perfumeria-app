# Estado de la v2 del modelo de materiales

Se lee al empezar cada sesión y se actualiza al terminar (30 líneas como máximo).
Autoridad: [`decisiones-v2.md`](decisiones-v2.md) (D1–D7). La v1 está congelada en la etiqueta
`glosario-v1` (sobre `a18c440`, en el remoto); sus errores, en [`errores-v1.md`](errores-v1.md).

## Fases

- [x] **Fase 0 — Arranque**.
- [x] **Fase 1 — Esquema y validador** (2026-10-02).
- [x] **Fase 2 — IFRA con la v2 de punta a punta, con siete materiales** (aprobada el 2026-10-03):
  `scripts/v2/alta.py`, `src/v2/to-ifra.ts`, D2 en el motor, `MaterialRepository` con un ajuste
  v1/v2 y [`comparacion-fase2.md`](comparacion-fase2.md). Después, la D7 (molécula sin documentos)
  con el campo `origen` y `impurezas-conocidas.csv` (vacía).
- [ ] **Fase 3 — La F-001 entera en la v2**, por lotes de alta (`docs/v2/altas/`).
  - **Cierre:** la F-001 se calcula entera con la v2, y la comparación con la v1 queda explicada,
    con la correspondencia de cada material elegida por el usuario.
  - Sus 24 materiales están todos en `mis-productos.csv` (`en-uso`): no hubo que añadir ninguno.
- [ ] Fases 4 y 5: sin definir.
- [ ] Fase 6: buscar en la v1 errores como los de `errores-v1.md`.

## Siguiente: el lote 3a

- Propuesta, pendiente de confirmar: **3a**, las 16 moléculas (Hedione, Dartanol, Iso E Super,
  Diphenyl Oxide, Florosa, alcohol feniletílico, Cashmeran, Ebanol, ionona alfa, Polysantol,
  Sandalmysore Core, Mayol, IBQ, Ethylene Brassylate, AAG y dihidromircenol), cada una con su
  `origen`. **3b**, los 8 naturales (cedro Atlas, pachulí, tintura de tonka, tintura de ámbar gris,
  absoluto de tabaco, resinoides de estírax y benjuí), con la forma que diga el usuario.
- Antes de cada lote: el usuario elige la correspondencia v1 de cada material.
