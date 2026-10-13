# Estado de la v3

*Actualizado el 2026-10-14. Como máximo 30 líneas: qué está hecho y qué sigue.*

## Hecho

- Decisiones V3-1 a V3-31 (`decisiones-v3.md`). Las últimas: V3-27 (el 089 como componente 5-MOP), V3-28 (cifras prestadas del anexo, como literatura), V3-29 (aislados sin documentos: «Sin identificar»), V3-30 (prohibida «como tal»: prohibición y techo) y V3-31 (variante prohibida: por especie y proceso).
- **Fases 0 a 3, hechas y comprobadas** (cada commit dice cómo): `v3/` sola, Supabase y PowerSync locales en Docker, PWA, inicio de sesión sin red, esquema de materiales con RLS, sincronización (un bucket común y uno por usuario) y disparadores, cifras exactas de ida y vuelta (las masas pueden ser `bigint`), repositorios (`src/db/materials.ts`) y adaptador al motor (`src/db/to-ifra.ts`, con el estado de IFRA por ficha de V3-25). Faltan, para cuando se usen: el interruptor «solo lo que tengo» (2.5) y `source_formula_id` (fase 7).
- **Fase 4, en marcha.** La maquinaria, en `migracion-v3/` (su `LEEME.md`): migrar una tanda → informe → tu visto bueno → `aprobar.ts` → commit → `npm run datos:cargar` en `v3/`.
- **Tandas 1 a 3, aprobadas y cargadas** en Supabase local (`5802adb`): 4355 materiales comunes, 3145 filas de composición y 7451 regulaciones (IFRA 51 por miembro y categoría, V3-30, V3-31, y 13 topes de fabricante). Una segunda carga no cambia nada; la carga va en una sola transacción. Una copia nueva lo descarga todo en 0,6 s y ocupa 36,7 MB (medido en Node, en local, `db-tests/catalog-download.test.ts`).
- El adaptador (`src/db/to-ifra.ts`), con la tanda 3: una molécula prohibida «como tal» cuenta contra su techo dentro de un natural (V3-30); la ficha con techo y requisito enseña también el requisito (V3-25).
- Pruebas: `npm test` 194, `npm run test:db` 22. **La rama `v3` se fusionó en `main` el 2026-10-13, a petición del usuario** (`fdcf017`); se sigue trabajando en `v3`. La v2 entera, en la etiqueta `v2-final`.

## Sigue

1. **Tanda 4:** categorías y duplicados, con tus decisiones en CSV (cuál es el DPG de la app, M02736 o M02952; las fusiones).
2. Tanda 5 (el laboratorio, en tu cuenta). Después, la fase 5 (equivalencia con la v2).
3. **Tú, cuando quieras:** `npx supabase login` en `v3/` (enlazar la nube) y corregir en el laboratorio el cruce del Aldambre en `diluciones.py`.

## Arranque local (dentro de `v3/`, con Docker Desktop abierto)

`npm run db:start` · `npm run sync:start` · `npm run dev`; la primera vez, también `npm run env:local` y `npm run db:test-users`. Las migraciones nuevas, con `npx supabase migration up`: `db:reset` borra las cuentas.

## A tener en cuenta

- En desarrollo, PowerSync va por `/powersync` (proxy de Vite): el navegador integrado no deja a un SharedWorker pedir a otro origen.
- La API REST de Supabase da los `numeric` como número JSON (redondea): las cifras exactas se leen de PowerSync.
- Mensajes de commit corregidos en el siguiente: 1424463 (30 s, no media hora), cf43779 (176 pruebas, no 179), 01c172f (el estado entró en el commit siguiente), 5bd5120 (10 estándares con prohibición y techos, no 3; en add5908).
- `docs-v3/` aún cita `docs/a-futuro.md` y el laboratorio; el plan 8.2 aún dice «`seq` siguiente» (manda el UUID v7 de 7.2).
- Los bocetos del usuario: claude.ai/artifact/RXLX4e5WKR6xFNApMeyphj (fases 6 y 8).
