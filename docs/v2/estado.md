# Estado de la v2 del modelo de materiales

Se lee al empezar cada sesión y se actualiza al terminar (30 líneas como máximo).
Autoridad: [`decisiones-v2.md`](decisiones-v2.md). La v1 queda congelada en la etiqueta `glosario-v1`.
Rama local `v2-materiales`; se sube a `claude/gracious-bell-day7am`.

## Fases

- [x] **Fase 0 — Arranque**: decisiones, estado, reglas de trabajo y `situacion` en `mis-productos.csv`.
- [x] **Fase 1 — Esquema y validador** (2026-10-02)
- [ ] Fase 2
- [ ] Fase 3
- [ ] Fase 4
- [ ] Fase 5
- [ ] Fase 6

## Fase 1: qué hay hecho

- Esquema de 14 tablas en [`datos/v2/LEEME.md`](../../datos/v2/LEEME.md); los CSV están vacíos (solo cabeceras).
- `src/v2/model.ts`, `load.ts` y `validate.ts`. `npm run validar:v2` (`scripts/validar_v2.ts`)
  imprime el recuento por regla y los 30 primeros errores, y el resto va a `datos/v2/validacion.txt`.
- 14 reglas (13 errores y el aviso `duplicado`), cada una con su prueba que pasa y que falla
  en `src/v2/fixtures/`.
- No se ha tocado `src/core/` ni `datos/glosario/`. No se ha migrado ningún material.

## Siguiente

- Definir el contenido de las fases 2 a 6, que hoy solo están numeradas.
- La etiqueta `glosario-v1` sigue solo en local.
