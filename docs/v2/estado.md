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
  - [x] **Lotes 3a y 3b** (2026-10-03): moléculas de Maese Lab (18) y de Olfatorium (15), con
    pruebas de banco. D8 aplicada; origen confirmado (2 avisos `desconocido`: linalol y alcohol
    feniletílico). AAG, miembro de la familia STD 188; Sandalmysore Core, una base.
  - [ ] **Lote 3c** (en curso): naturales de Olfatorium en uso, más pachulí y cilantro: 13 por
    entrar. `alta.py --lote 3c`: 37 conflictos sin respuesta (13 `forma`, con la evidencia de la
    tienda y `docs/v2/formas-propuestas.csv`; 11 `v1-correspondencia`; 7 `documento-ajeno`; 5
    `ifra-distinto`; 1 `sin-fila-v1`). Respuestas en `datos/v2/respuestas/3c.csv`.
- [ ] Fases 4 y 5: [`plan.md`](plan.md), que guarda el usuario (no estaba en el repositorio el
  2026-10-03). Fase 6: buscar en la v1 errores como los de `errores-v1.md`.

## Siguiente

- Las respuestas del 3c; después el 3d (naturales de Maese Lab) y el cierre de la fase 3.
