# Estado de la v2 del modelo de materiales

Se lee al empezar cada sesión y se actualiza al terminar (30 líneas como máximo).
Autoridad: [`decisiones-v2.md`](decisiones-v2.md) (D1–D10). Plan: [`plan.md`](plan.md). La v1 está
congelada en la etiqueta `glosario-v1`; sus errores, en [`errores-v1.md`](errores-v1.md).

## Fases

- [x] **Fases 0 y 1** (2026-10-02): arranque, esquema y validador.
- [x] **Fase 2** (aprobada el 2026-10-03): IFRA con la v2 de punta a punta; D2 en el motor,
  `MaterialRepository` (v1/v2), D7 (`origen`) y D8 (sin dilución en el modelo).
- [ ] **Fase 3 — La F-001 entera en la v2**, por lotes (`docs/v2/lotes.json`, `alta.py --lote`).
  - **Cierre:** la F-001 se calcula entera con la v2 y su comparación con la v1 queda explicada,
    con la correspondencia de cada material elegida por el usuario.
  - [x] **3a y 3b**: 18 moléculas de Maese Lab y 15 de Olfatorium. 2 avisos de origen desconocido
    (linalol y alcohol feniletílico). AAG, de la familia STD 188; Sandalmysore Core, una base.
  - [x] **3c**: 13 naturales de Olfatorium, con las formas confirmadas una a una. Los 7 documentos
    de la v1 eran de otro proveedor (D9): placeholders de literatura. D10 (STD 089) en el motor.
    El 5-MOP de la bergamota FCF no está documentado, y no es miembro del 089.
- [ ] Fases 4 y 5: en `plan.md`, que guarda el usuario (no está en el repositorio). Fase 6: buscar en
  la v1 errores como los de `errores-v1.md`.

## Siguiente

- **Lote 3d**: los naturales de Maese Lab (castóreo, cade, láudano, olíbano, cacao, tinturas), y el
  cierre de la fase 3. **Al entrar el cade, modelar el STD 078**: suma los marcadores de PAH
  (benzopireno y 1,2-benzantraceno, 1 ppb entre los dos en el producto final) del estírax de pirólisis
  y del aceite de cade rectificado (y del alquitrán de abedul rectificado y el opopónax rectificado).
- La interfaz aún no enseña `combinedChecks`: un «no» por la suma de fototóxicos no dice cuál es.
- Niveles típicos del 089 en `docs/v2/niveles-tipicos-089.csv`: entran con sus materiales.
