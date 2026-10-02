# Estado de la v2 del modelo de materiales

Se lee al empezar cada sesión y se actualiza al terminar (30 líneas como máximo).
Autoridad: [`decisiones-v2.md`](decisiones-v2.md) (D1–D8). El plan de las fases, en [`plan.md`](plan.md). La v1 está congelada en la etiqueta
`glosario-v1` (sobre `a18c440`, en el remoto); sus errores, en [`errores-v1.md`](errores-v1.md).

## Fases

- [x] **Fase 0 — Arranque**.
- [x] **Fase 1 — Esquema y validador** (2026-10-02).
- [x] **Fase 2 — IFRA con la v2 de punta a punta, con siete materiales** (aprobada el 2026-10-03):
  `scripts/v2/alta.py`, `src/v2/to-ifra.ts`, D2 en el motor, `MaterialRepository` con un ajuste
  v1/v2 y [`comparacion-fase2.md`](comparacion-fase2.md). Después, la D7 (molécula sin documentos)
  con el campo `origen` y `impurezas-conocidas.csv` (vacía).
- [ ] **Fase 3 — La F-001 entera en la v2**, por lotes (`docs/v2/lotes.json`, `alta.py --lote`).
  - **Cierre:** la F-001 se calcula entera con la v2, y la comparación con la v1 queda explicada,
    con la correspondencia de cada material elegida por el usuario.
  - [x] **Lote 3a** (2026-10-03): Maese Lab, en uso, moléculas. 18 altas, 2 excluidos (láudano y
    cacao, naturales) y el geraniol, que ya estaba. Prueba de banco: `src/v2/lote3a.test.ts`.
  - [x] **Lote 3b** (2026-10-03): Olfatorium, en uso, moléculas. 15 altas, 1 excluida (cilantro,
    natural) y el linalol, que ya estaba. Prueba de banco: `src/v2/lote3b.test.ts`.
  - D8 aplicada: `productos.csv` ya no lleva dilución. Origen de cada molécula confirmado por el
    usuario (propuestas en `docs/v2/origenes-propuestos.csv`); 4 `desconocido`, con aviso.
- [ ] Fases 4 y 5: ver [`plan.md`](plan.md). Fase 6: buscar en la v1 errores como los de `errores-v1.md`.

## Siguiente

- El lote 3c, que define el usuario (tienda y clase): quedan los naturales de las dos tiendas y de
  Perfumiarz. Las 4 moléculas con origen `desconocido` (linalol, C11 MOA, alcohol feniletílico,
  Sandalmysore Core) esperan que se averigüe.
