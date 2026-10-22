# perfumeria v3 — instrucciones de trabajo

Esta carpeta es **la app entera de la v3** (V3-21): funciona en el navegador, sin conexión,
con una copia de los datos sincronizada con Supabase (V3-8, V3-9). Su documentación y sus
decisiones están en `docs-v3/`, al lado de esta carpeta: **`docs-v3/decisiones-v3.md` y
`docs-v3/plan-ejecutivo-v3.md` mandan**, y al empezar cada sesión se lee `docs-v3/estado.md`.

## Sola dentro de su carpeta

- **Nada de aquí importa ni lee archivos de fuera de `v3/`.** Comprobación: una copia de `v3/`
  sola, en otra carpeta, pasa `npm ci && npm test`.
- **La v2 del repo no se toca desde aquí.** De ella solo llega información, y al principio:
  `migracion-v3/` (fuera de esta carpeta) escribe en `datos/` lo tratado y citado (documento,
  página, frase), por tandas que aprueba el usuario. Los documentos de origen no entran.
- **`datos/` no se edita a mano:** lo escribe la migración, con la cita de cada dato.

## El motor

- **`src/core/` es la copia del motor de la v2** (ver `src/core/LEEME.md`). Solo cambia si una
  prueba demuestra que hace falta, y se explica en el commit.
- **Una prueba de referencia que falla no se arregla tocando la prueba.** Se explica por qué el
  resultado anterior era incorrecto.
- **Aritmética exacta:** masas en enteros y proporciones exactas; se redondea solo al mostrar.
  Todo número lleva su base. Lo desconocido nunca vale cero ni se pinta en verde.

## Cómo se trabaja

- **Código, identificadores, comentarios, la interfaz y los datos, en inglés** (V3-71: un solo
  idioma estándar). La interfaz lee sus textos de `src/i18n/`. La documentación, en español.
- **Comandos, dentro de `v3/`:** `npm run dev`, `npm run build`, `npm test`.
- **Commit y push por cada paso terminado**, con su «Hecho cuando» comprobado. En Windows:
  mensaje a un archivo y `git commit -F`; archivos en UTF-8 y con finales de línea LF.
- **Las claves nunca van a Git:** `.env.local`, fuera del repositorio; `.env.example`, con los
  nombres y sin valores.
- Si una tarea choca con una decisión, se para y se pregunta.
