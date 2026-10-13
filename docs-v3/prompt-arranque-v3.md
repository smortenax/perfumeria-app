Vamos a arrancar la v3 de perfumeria-app (smortenax/perfumeria-app). Todo lo decidido está en la rama `claude/project-thread-7fj8q8`, carpeta `docs-v3/`, y todavía no está en `main`. Parte de esa rama (`git fetch origin claude/project-thread-7fj8q8`) y no fusiones nada sin que te lo pida.

Lee primero, en este orden, y sigue la sección de la v3 de `CLAUDE.md`:
1. `docs-v3/estado.md`: qué está hecho y qué sigue.
2. `docs-v3/decisiones-v3.md`: V3-1 a V3-11, con mis palabras.
3. `docs-v3/modelo-materiales-v3.md` y `docs-v3/referencia-materiales-lab.md`, mi referencia de qué se registra de cada material.
4. `docs-v3/plan-ejecutivo-v3.md`: el orden de trabajo.
5. `docs-v3/PLAN_V3.md`: solo las secciones que necesites, buscándolas.

Lo primero es terminar las decisiones de «Antes de empezar» del plan ejecutivo: las preguntas 7.5 a 7.11 del modelo de materiales y B.1 y B.2 de los bancos de trabajo. De una en una: la pregunta, las opciones, tu recomendación y lo que cuesta dejarla abierta. Espera mi respuesta antes de pasar a la siguiente. Cada respuesta entra en `decisiones-v3.md` como V3-12, V3-13…, con mi frase literal, y se aplica al modelo y al plan. Commit y push por cada una.

Después, la fase 0 y la fase 1, paso a paso, cada uno con su «Hecho cuando». Pídeme permiso antes de poner la etiqueta `v2-final` en `main`. Si no estás en mi equipo (WSL), dime qué pasos tengo que hacer yo.

El laboratorio (`../Perfumery`, smortenax/perfumeria-lab) tiene `esquema.sql` y `materiales.sqlite` de mi referencia; los necesitarás para la pregunta 7.8 y la fase 4. Desde aquí no se escribe en él.

Reglas que no cambian:
- Si algo choca con una decisión, paras y me preguntas; no la reinterpretas.
- Los datos los escribe un script. Nada se fusiona en silencio: los duplicados van a un CSV de conflictos y los decido yo.
- La v1 está congelada (`datos/glosario/`, `scripts/generar_glosario.py`).
- `src/core/` solo cambia si una prueba demuestra que hace falta.
- Cada cifra lleva su fuente en la misma frase en que la das.
- Para leer mucho, subagentes Sonnet, de uno en uno.
- Al terminar cada sesión, actualiza `docs-v3/estado.md` (30 líneas como máximo) y haz commit.

Háblame en español.
