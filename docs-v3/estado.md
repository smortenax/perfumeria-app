# Estado de la v3

*Actualizado el 2026-10-13. Como máximo 30 líneas: qué está hecho y qué sigue.*

## Hecho

- Decisiones V3-1 a V3-28 (`decisiones-v3.md`). Las últimas: V3-23 a V3-26 (la bandeja del laboratorio, ya marcada allí, `fff8254`), V3-27 (el 089 como componente 5-MOP, tres niveles de precisión) y V3-28 (las cifras prestadas del anexo, como literatura).
- **Fases 0 a 3, hechas y comprobadas** (cada commit dice cómo): `v3/` sola, Supabase y PowerSync locales en Docker, PWA, inicio de sesión sin red, esquema de materiales con RLS, sincronización (un bucket común y uno por usuario) y disparadores, cifras exactas de ida y vuelta (las masas pueden ser `bigint`), repositorios (`src/db/materials.ts`) y adaptador al motor (`src/db/to-ifra.ts`, con el estado de IFRA por ficha de V3-25). Faltan, para cuando se usen: el interruptor «solo lo que tengo» (2.5) y `source_formula_id` (fase 7).
- **Fase 4, en marcha.** La maquinaria, en `migracion-v3/` (su `LEEME.md`): migrar una tanda → informe → tu visto bueno → `aprobar.ts` → commit → `npm run datos:cargar` en `v3/`.
- **Tanda 1 (materiales), aprobada y cargada** (`991f68a`): 4355 materiales comunes en Supabase local; una segunda carga no cambia nada; `data_version` = `991f68a`. Una copia nueva los descarga todos en 0,4 s y ocupa 18,5 MB (medido en Node, en local).
- Pruebas: `npm test` 192, `npm run test:db` 22. Rama `v3`; **nada fusionado en `main`**.

## Sigue

1. **Tanda 2, la composición** (pasos 4.3 y 4.4): solo documentos `revisado` (D6); cada ficha con su entrada del anexo (V3-23); las prestadas, como literatura (V3-28); el 5-MOP de la bergamota sin furocumarinas (V3-27); «Sin identificar» en las listas parciales (9 materiales y 2 productos); los productos, con la composición de su material más la de su certificado (V3-2). Plantear antes: ¿«Sin identificar» también en los aislados naturales sin documentos (lo que la v2 dejaba pendiente por D7)?
2. Tanda 3 (IFRA y topes), tanda 4 (categorías y duplicados, con tus decisiones; cuál es el DPG de la app) y tanda 5 (el laboratorio, en tu cuenta). Después, la fase 5.
3. **Tú, cuando quieras:** `npx supabase login` en `v3/` (enlazar la nube) y corregir en el laboratorio el cruce del Aldambre en `diluciones.py`.

## Arranque local (dentro de `v3/`, con Docker Desktop abierto)

`npm run db:start` · `npm run sync:start` · `npm run dev`; la primera vez, también `npm run env:local` y `npm run db:test-users`. Las migraciones nuevas, con `npx supabase migration up`: `db:reset` borra las cuentas.

## A tener en cuenta

- En desarrollo, PowerSync va por `/powersync` (proxy de Vite): el navegador integrado no deja a un SharedWorker pedir a otro origen.
- La API REST de Supabase da los `numeric` como número JSON (redondea): las cifras exactas se leen de PowerSync.
- Mensajes de commit corregidos en el siguiente: 1424463 (30 s, no media hora), cf43779 (176 pruebas, no 179), 01c172f (el estado entró en el commit siguiente).
- `docs-v3/` aún cita `docs/a-futuro.md` y el laboratorio; el plan 8.2 aún dice «`seq` siguiente» (manda el UUID v7 de 7.2).
- Los bocetos del usuario: claude.ai/artifact/RXLX4e5WKR6xFNApMeyphj (fases 6 y 8).
