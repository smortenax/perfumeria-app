# Estado de la v3

*Actualizado el 2026-10-14 (tarde). Como máximo 30 líneas: qué está hecho y qué sigue.*

## Hecho

- Decisiones V3-1 a V3-40 (`decisiones-v3.md`). **El giro del 2026-10-14 es V3-34:** la v3 no hereda el glosario de la v2; empieza con tus materiales del laboratorio, completos, con lo general en lo común y lo tuyo en tu versión (V3-36). IFRA, capa aparte y privada (V3-35); abreviatura del glosario (V3-37); color de la familia, ajustable (V3-38); certificados de tus productos, a tu versión (V3-39); voces, por la biblioteca, después (V3-40).
- **Fases 0 a 3, hechas y comprobadas:** `v3/` sola, Supabase y PowerSync locales en Docker, PWA, sesión sin red, esquema con RLS, sincronización, cifras exactas, repositorios y adaptador al motor (`src/db/to-ifra.ts`, con V3-25 y V3-30). `materials.ifra_unverified` (V3-32).
- **Fase 4, rehecha (plan, pasos 4.1 a 4.6). Paso 4.1 hecho** (`b5fad39`): lo de la v2 salió de lo común; Supabase local tiene 0 comunes, y tu copia lo descarga así. Las tandas 1 a 4 quedan como historia en `migracion-v3/tandas/`. V3-41: cada atributo en su columna y cada lista con fuente en su tabla. La tanda 5 (`fc79e1f`, sin aprobar) no se carga tal cual: su correspondencia con la v2 (`respuestas/laboratorio.csv`, aprobada) se reutiliza.
- Pruebas: `npm test` 194, `npm run test:db` 22. Tu cuenta local existe (la creaste tú). Una copia nueva vacía ocupa 24,5 MB: PowerSync guarda el historial de lo borrado hasta que se compacta (pendiente).

## Sigue

1. **4.2** el esquema nuevo (capa de IFRA con su canal, abreviatura, familia y color, descriptores, relaciones, referencias, física, frasco, diluciones, cata y ejes); **4.3** el adaptador sobre la capa.
2. **4.4 a 4.6**, las tandas: la capa de IFRA, tus materiales en lo común y tu versión en tu cuenta.
3. **Tú, cuando quieras:** `npx supabase login` en `v3/` (enlazar la nube) y corregir en el laboratorio el cruce del Aldambre en `diluciones.py`.

## Arranque local (dentro de `v3/`, con Docker Desktop abierto)

`npm run db:start` · `npm run sync:start` · `npm run dev`; la primera vez, también `npm run env:local` y `npm run db:test-users`. Las migraciones nuevas, con `npx supabase migration up`: `db:reset` borra las cuentas.

## A tener en cuenta

- En desarrollo, PowerSync va por `/powersync` (proxy de Vite): el navegador integrado no deja a un SharedWorker pedir a otro origen.
- La API REST de Supabase da los `numeric` como número JSON (redondea): las cifras exactas se leen de PowerSync.
- Mensajes de commit corregidos en el siguiente: 1424463 (30 s, no media hora), cf43779 (176 pruebas, no 179), 01c172f (el estado entró en el commit siguiente), 5bd5120 (10 estándares con prohibición y techos, no 3; en add5908).
- `docs-v3/` aún cita `docs/a-futuro.md` y el laboratorio; el plan 8.2 aún dice «`seq` siguiente» (manda el UUID v7 de 7.2).
- Los bocetos del usuario: claude.ai/artifact/RXLX4e5WKR6xFNApMeyphj (fases 6 y 8).
