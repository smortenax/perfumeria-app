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

## Reglas duras del código (V3-111)

El usuario, 2026-11-25: «reglas duras con lo que respecta a los problemas encontrados para que no
se tenga que ir limpiando el codigo cada tanto». **`src/rules.node.test.ts` las vigila** dentro de
`npm test`. La deuda que había el 2026-11-25 está en `src/rules.baseline.json`: un archivo no puede
pasar de su cifra, y si la baja, se baja el tope en el mismo commit
(`RULES_WRITE=1 npx vitest run src/rules.node.test.ts`). **Subir un tope pide el sí del usuario,
citado en el commit.** Un archivo nuevo empieza con tope 0.

- **R1 · Diseño, desde los tokens.** Colores, tipografía, espacios, radios y medidas salen de
  `src/theme/tokens.css`. Nada de valores sueltos en el CSS (hex, `rgb()`, px o rem en `gap`,
  `padding` o `margin`) ni de `style={{…}}` con valores fijos: una medida que solo cambia en
  ejecución (un ancho calculado) va como variable CSS (`style={{ "--w": … }}`) y su regla, en el CSS.
- **R2 · Un selector, un archivo.** Cada pantalla tiene su CSS en su carpeta; lo común, en `theme/`.
  Una pantalla no importa el CSS de otra.
- **R3 · Unidades y redondeo, en un sitio.** Masas y porcentajes se leen con `core/arith/units` o
  `src/format/` (`percent.ts`, `mass.ts`) y se muestran con `core/display` o `src/format/numbers.ts`
  (`drawn` para dibujar, `fixedRatio`, `fixedNumber`, `dateTime`); nada de `toFixed`,
  `toLocaleString` ni `1_000_000n` fuera de ellos.
- **R4 · La memoria del navegador, en `src/storage.ts`.** Nadie más usa `localStorage`; cada clave
  está listada allí con lo que guarda. Lo que tenga que viajar entre dispositivos va a la base.
- **R5 · Cada carpeta, una pantalla.** Lo que comparten varias vive en `core/`, `db/`, `lib/` (lógica
  pura), `ui/` (piezas de interfaz), `families/`, `i18n/`, `theme/` o en la raíz de `src/`. Una
  pantalla abre otra por su componente de entrada, nunca por sus piezas; y lo común no importa
  pantallas (solo `App.tsx` y `Home.tsx`, que son el armazón).
- **R6 · Web y sola.** Nada de Tauri; nada importa ni lee fuera de `v3/`.
- **R7 · Archivos de 600 líneas como mucho.** Pasado eso se parte: el estado en un hook
  (`useAlgo.ts`), el dibujo en componentes. Los que ya pasaban solo pueden menguar.
- **R8 · Tres copias del esquema, iguales.** Una tabla o columna nueva entra a la vez en
  `db/schema/` (Postgres), `src/db/local/schema.ts` (navegador) y `powersync/sync-config.yaml`; lo
  que vive en un solo lado se declara en `LOCAL_ONLY` o `SERVER_ONLY` de la prueba.
- **R9 · Nada se fusiona en rojo.** La comprobación de cada PR (`.github/workflows/comprobar-v3.yml`)
  tiene que estar en verde antes de fusionar, porque fusionar publica (V3-99).
- **Los textos de la interfaz, solo en `src/i18n/`:** `en.ts` y, los del banco, `bench.ts`.
