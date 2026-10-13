# Estado de la v3

*Actualizado el 2026-10-13. Como máximo 30 líneas: qué está hecho y qué sigue.*

## Hecho

- Decisiones V3-1 a V3-26 (`decisiones-v3.md`): cerradas las de «Antes de empezar» (V3-12 a V3-20); la bandeja del laboratorio, llevada (V3-23 a V3-26); V3-21, la app en `v3/`, su documentación en `docs-v3/`, el puente en `migracion-v3/`, la v2 de la raíz intacta; V3-22, Supabase y PowerSync locales en Docker.
- **Fase 0:** etiqueta `v2-final` (572924b); rama `v3`; Docker Desktop 4.95.0 en este PC.
- **Fase 1, comprobada paso a paso** (cada commit dice cómo): 1.1 `v3/` sola (compila y pasa las pruebas copiada a otra carpeta); 1.2 Supabase local con el registro cerrado; 1.3 Drizzle y `db:reset` limpio; 1.4 PowerSync 1.27.0 replicando; 1.5 la copia en el navegador sube y baja, también tras cortar los servidores; 1.6 la PWA; 1.7 entrar, abrir sin red con la sesión guardada (también caducada) y salir. La versión compilada abre con todo apagado. Tu cuenta, creada en el Studio local.
- Arranque local: `npm run db:start`, `npm run env:local`, `npm run db:test-users`, `npm run sync:start`, `npm run dev` (dentro de `v3/`).

## Sigue

1. **Tú, cuando quieras:** `npx supabase login` dentro de `v3/`, para enlazar la nube (V3-22). A la nube no sube nada hasta que el esquema de la fase 2 esté probado.
2. **Tú:** marcar como llevadas las entradas de la bandeja en el laboratorio (o decirme que lo haga). Y corregir allí el cruce del Aldambre en `diluciones.py`.
3. Pregunta abierta de V3-23: la autoridad de las cifras del anexo prestadas de otras formas (219 materiales).
4. Fase 2: el esquema de los materiales. La tabla de prueba `sync_probe` y su panel se van entonces.

## A tener en cuenta

- En desarrollo, PowerSync va por `/powersync` (proxy de Vite): el navegador integrado de la app de escritorio no deja a un SharedWorker pedir a otro origen. Con ese proxy, al caer PowerSync la página tarda en dejar de decir «Conectado».
- El commit 1424463 dice «media hora larga» de reintentos al renovar una sesión sin red: son 30 segundos (`AUTO_REFRESH_TICK_DURATION_MS` de supabase-js).
- `docs-v3/` aún cita `docs/a-futuro.md` y el laboratorio; el plan 8.2 aún dice «`seq` siguiente» (manda el UUID v7 de 7.2).
- Los bocetos del usuario, en un artefacto (claude.ai/artifact/RXLX4e5WKR6xFNApMeyphj): referencia para las fases 6 y 8.
- Rama `v3`; **nada fusionado en `main`**.
