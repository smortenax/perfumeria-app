# Estado de la v2 del modelo de materiales

Se lee al empezar cada sesión y se actualiza al terminar (30 líneas como máximo).
Autoridad: [`decisiones-v2.md`](decisiones-v2.md). La v1 queda congelada en la etiqueta `glosario-v1`.
Rama `v2-materiales` (en el remoto). La etiqueta `glosario-v1` no se pudo subir desde la nube: se crea en local sobre `a18c440`.

## Fases

- [x] **Fase 0 — Arranque**: decisiones, estado, reglas de trabajo y `situacion` en `mis-productos.csv`.
- [x] **Fase 1 — Esquema y validador** (2026-10-02): 14 tablas, 14 reglas, `npm run validar:v2`.
- [ ] **Fase 2 — IFRA con la v2 de punta a punta, con siete materiales** (2026-10-03): hecha y
  **a la espera de que el usuario revise** [`comparacion-fase2.md`](comparacion-fase2.md).
- [ ] Fases 3 a 6: sin definir.

## Fase 2: qué hay hecho

- `scripts/v2/alta.py` escribe `datos/v2/` desde `docs/v2/altas/*.json`. Es determinista, saca los
  ids del registro y lee la v1 e IFRA sin tocarlos. Entrada: `2026-10-03-fase2.json`, con 7
  materiales, 7 productos y 4 documentos cotejados con su PDF. La lavanda es aceite esencial
  (decisión del usuario).
- `src/v2/to-ifra.ts` aplana a sustancias por autoridad y cobertura, y construye el `IfraData`.
  El tope del fabricante es una sustancia de su producto (D4).
- Motor (`src/core/ifra.ts`, aprobado): `upper` en una carga desconocida (D2), y «dentro» nunca
  con una carga desconocida.
- `MaterialRepository` (`src/data/repository.ts`): Bench la recibe; el lanzador elige v1 o v2 (`model`).
- Pruebas: `src/v2/to-ifra.test.ts` y `src/v2/comparacion.test.ts`, con F-001 y «Siete» en las dos versiones.

## Siguiente

- Que el usuario revise la comparación y responda a sus preguntas A (molécula sin documentos) y B (los 23 de la F-001).
