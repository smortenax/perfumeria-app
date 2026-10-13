# Estado de la v3

*Actualizado el 2026-10-13. Como máximo 30 líneas: qué está hecho y qué sigue.*

## Hecho

- Decisiones V3-1 a V3-22 (`decisiones-v3.md`). Cerradas las preguntas de «Antes de empezar»: tipos (V3-12), categorías en el buscador (V3-13), núcleo y dosis (V3-14), el laboratorio en tu cuenta (V3-15), varios CAS (V3-16), datos en disputa (V3-17), familias de P48 (V3-18), bancos y marcadores (V3-19, V3-20).
- **V3-21:** la app vive en `v3/`, su documentación en `docs-v3/`, el puente en `migracion-v3/`; la v2 de la raíz no se toca. **V3-22:** Supabase y PowerSync locales (Docker) y la nube enlazada.
- **Fase 0:** etiqueta `v2-final` en GitHub (572924b); rama `v3`. Falta 0.3: Docker Desktop.
- **Fase 1:** 1.1 hecho (`v3/` sola: 158 pruebas, F-001 verde, compila suelta en otra carpeta). 1.6 hecho (PWA: abre sin servidor y coge la versión nueva). 1.2 y 1.3 escritos: Supabase iniciado con el registro cerrado, Drizzle, migraciones de PowerSync y de una tabla de prueba; **sin comprobar**, necesitan Docker.

## Sigue

1. **Tú:** instalar Docker Desktop y comprobar `docker run hello-world`.
2. Comprobar 1.2 (Studio en `localhost:54323`, tu usuario creado a mano) y 1.3 (`npm run db:reset` limpio).
3. 1.4 PowerSync local, 1.5 la copia en el navegador, 1.7 el inicio de sesión. Enlazar la nube (`supabase link`): el inicio de sesión y la contraseña los pones tú.
4. Las cinco entradas pendientes de la bandeja del laboratorio (láudano, cedro chino, cade, Aldambre, commit de los datos), a `decisiones-v3.md`.

## Dónde está

- Rama `v3` (sale de `claude/project-thread-7fj8q8`). **Nada fusionado en `main`.**
- `docs-v3/` aún cita `docs/a-futuro.md` y el laboratorio: se resuelve al pasar la documentación (V3-21).
- El paso 8.2 del plan aún dice «`add` con el `seq` siguiente»; el orden lo da el UUID v7 (7.2). Corregir al llegar.
- Los bocetos del usuario, en un artefacto (claude.ai/artifact/RXLX4e5WKR6xFNApMeyphj): referencia para la interfaz (fases 6 y 8).
