# Estado de la v3

*Actualizado el 2026-10-13. Como máximo 30 líneas: qué está hecho y qué sigue.*

## Hecho

- Decisiones V3-1 a V3-26 (`decisiones-v3.md`): cerradas las de «Antes de empezar» (V3-12 a V3-20); la bandeja del laboratorio, llevada (V3-23 a V3-26); V3-21, la app en `v3/`, su documentación en `docs-v3/`, el puente en `migracion-v3/`, la v2 de la raíz intacta; V3-22, Supabase y PowerSync locales en Docker.
- **Fase 0:** etiqueta `v2-final` (572924b); rama `v3`; Docker Desktop 4.95.0 en este PC.
- **Fase 1, comprobada paso a paso** (cada commit dice cómo): 1.1 `v3/` sola (compila y pasa las pruebas copiada a otra carpeta); 1.2 Supabase local con el registro cerrado; 1.3 Drizzle y `db:reset` limpio; 1.4 PowerSync 1.27.0 replicando; 1.5 la copia en el navegador sube y baja, también tras cortar los servidores; 1.6 la PWA; 1.7 entrar, abrir sin red con la sesión guardada (también caducada) y salir. La versión compilada abre con todo apagado. Tu cuenta, creada en el Studio local.
- **Fase 2, hecha:** las tablas de los materiales (`v3/db/schema/materials.ts`), RLS, reglas de sincronización (un bucket común y uno por usuario), disparadores y `npm run test:db` (18 pruebas con dos usuarios, tres veces seguidas). Fuera la tabla de prueba; la página inicial enseña el estado de los datos. Faltan, para cuando se usen: el interruptor «solo lo que tengo» (2.5, sin tabla, fases 6 y 8) y `source_formula_id` (fase 7, con `formulas`).
- Arranque local: `npm run db:start`, `npm run env:local`, `npm run db:test-users`, `npm run sync:start`, `npm run dev` (dentro de `v3/`).

## Sigue

1. **Fase 3:** exactitud de ida y vuelta por la sincronización (3.1), repositorios sobre la copia del navegador (3.2) y el adaptador al motor (3.3).
2. **Tú, cuando quieras:** `npx supabase login` dentro de `v3/`, para enlazar la nube (V3-22). No sube nada hasta que lo pidas.
3. **Tú:** corregir en el laboratorio el cruce del Aldambre en `diluciones.py`.
4. Pregunta abierta de V3-23: la autoridad de las cifras del anexo prestadas de otras formas (219 materiales).

## A tener en cuenta

- En desarrollo, PowerSync va por `/powersync` (proxy de Vite): el navegador integrado de la app de escritorio no deja a un SharedWorker pedir a otro origen. Con ese proxy, al caer PowerSync la página tarda en dejar de decir «Conectado».
- El commit 1424463 dice «media hora larga» de reintentos al renovar una sesión sin red: son 30 segundos (`AUTO_REFRESH_TICK_DURATION_MS` de supabase-js).
- **La API REST de Supabase da los `numeric` como número JSON** (redondea): ninguna cifra exacta se lee por ahí; la app lee de PowerSync, que los da como texto (para el 3.1).
- Las migraciones locales se aplican con `npx supabase migration up`; `db:reset` borra las cuentas.
- `docs-v3/` aún cita `docs/a-futuro.md` y el laboratorio; el plan 8.2 aún dice «`seq` siguiente» (manda el UUID v7 de 7.2).
- Los bocetos del usuario, en un artefacto (claude.ai/artifact/RXLX4e5WKR6xFNApMeyphj): referencia para las fases 6 y 8.
- Rama `v3`; **nada fusionado en `main`**.
