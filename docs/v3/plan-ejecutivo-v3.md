# Plan ejecutivo de la v3

*2026-10-07. Sale de `PLAN_V3.md` con las decisiones de [`decisiones-v3.md`](decisiones-v3.md) (V3-1: donde chocan, manda el plan). Cada paso dice cuándo está hecho, para que se pueda comprobar sin opinar. Va por fases y en orden; cada paso, un commit.*

**Cómo se lee:** «Hecho cuando» es la comprobación que cierra el paso. Si falla, el paso no está hecho. Entre paréntesis, el paso del §44 del plan al que corresponde.

**Lo que no cambia:** `src/core/` (el motor) solo se toca si una prueba demuestra que hace falta, como hasta ahora. La v2 llega al motor por un adaptador. Los datos los escribe un script, nunca a mano.

---

## Fase 0 · Preparar

| Paso | Qué | Hecho cuando |
|---|---|---|
| 0.1 | Etiqueta `v2-final` en `main`, para poder volver a la v2 entera | La etiqueta está en GitHub |
| 0.2 | La v3 se hace en una rama propia, que tú decides cuándo fusionar | Rama creada (con tu permiso, como pide `CLAUDE.md`) |
| 0.3 | **Entorno en WSL:** el repo clonado dentro de WSL (en `~/`, no en `/mnt/c`, que es lento), Node 22 LTS y Docker Desktop con la integración de WSL activada (Supabase local lo necesita) | `npm ci && npm test` pasa en WSL, y `npx supabase --version` responde |
| 0.4 | `docs/v3/estado.md`, como el de la v2: qué está hecho y qué sigue, en 30 líneas | Existe y se actualiza al final de cada sesión |

**Tu app 0.2.1 instalada sigue funcionando** todo el tiempo: quitar Tauri del repo no la desinstala.

---

## Fase 1 · El esqueleto, sin datos (pasos 1 a 4)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 1.1 | **Quitar Tauri.** Se borran `src-tauri/`, las dependencias `@tauri-apps/*` y el script `tauri`. Solo cuatro archivos las usan (`src/bench/io.ts`, `library.ts`, `store.ts`, `zoom.ts`); pasan a una interfaz de guardado con una implementación provisional en el navegador, que ya existe para el desarrollo | `npm run build` y `npm test` pasan; `npm run dev` abre el banco en el navegador y la prueba de la F-001 sigue verde (paso 2) |
| 1.2 | **Supabase local:** `npx supabase init` y `npx supabase start`. Registro cerrado (`enable_signup = false`), tu usuario creado a mano | Studio abre en `localhost:54323`. `.env.example` en el repo; `.env.local` fuera de Git |
| 1.3 | **Drizzle:** `drizzle-orm`, `drizzle-kit` y `postgres`. El esquema en `db/schema/`. `drizzle.config.ts` escribe el SQL en `supabase/migrations/` con el formato de nombres de Supabase. **Una sola carpeta de migraciones**: RLS y disparadores van en SQL en la misma carpeta | `drizzle-kit generate` crea un SQL y `npx supabase db reset` lo aplica limpio |
| 1.4 | **Inicio de sesión:** cliente `supabase-js` en `src/db/client.ts` y una pantalla de entrar con correo y contraseña | Entras y ves el lanzador; sin sesión, no |

---

## Fase 2 · El esquema (pasos 5, 6, 8, 9 y 11)

Las cinco tablas del plan, con las columnas que añade `decisiones-v3.md` para cumplir lo que el propio plan pide.

| Paso | Tabla | Además de lo del plan |
|---|---|---|
| 2.1 | `materials` | `ref` (id de la v2, único), `kind` (`substance`, `natural`, `base`, `solvent`, `provisional`, `frozen`), `origin`, `coverage` (`complete_regulated`, `allergens_only`, `partial`, `unknown`; por defecto `unknown`) |
| 2.2 | `material_components` | `amount_kind` (`exact`, `max`, `range`, `unknown`) con su comprobación: `range` exige mínimo ≤ máximo, `exact` y `max` exigen valor, `unknown` ninguno. Un material no se contiene a sí mismo |
| 2.3 | `formulas` | Las del plan. `parent_id` a `NULL` si se borra la madre |
| 2.4 | `formula_events` | Comprobación por tipo: `add` exige material, masa > 0, fracción en (0, 1] y diluyente si es < 1; `set_mass` y `remove`, un `target`; `reweigh`, bruto > tara; `note`, texto. `UNIQUE(formula_id, seq)` |
| 2.5 | `regulations` | `amendment` (`51`). `kind`: `max`, `prohibited`, `requirement`, `requirement_met`. `max_value` es fracción del producto terminado (§1.1: con su base) |

| Paso | Qué | Hecho cuando |
|---|---|---|
| 2.6 | **RLS.** Materiales: lees los globales y los tuyos; escribes solo los tuyos. Componentes y regulaciones: según su material. Fórmulas: solo las tuyas. Eventos: según su fórmula, **solo se añaden** (sin políticas de editar ni borrar). Lo global solo lo escribe el script, con la clave de servicio | — |
| 2.7 | **Disparadores:** un material global solo contiene globales; un evento solo usa materiales globales o tuyos; la composición de un material `frozen` no se cambia; sin ciclos de composición; `updated_at` al día | — |
| 2.8 | **Pruebas de la base** (`npm run test:db`, contra Supabase local, con dos usuarios) | A no ve nada de B; A no puede añadir un evento con un material de B, ni editar ni borrar un evento, ni escribir un material global; un `add` inválido se rechaza |

---

## Fase 3 · El acceso a los datos y el núcleo (paso 10)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 3.1 | **Exactitud por la API:** `numeric` y `bigint` se leen con `::text` y se escriben como texto; el dominio los convierte a `Ratio` y `bigint`. Nunca pasan por un `number` de JavaScript | Prueba de ida y vuelta: `9007199254740993` µg y `0.000000000000000000000000000001` vuelven idénticos |
| 3.2 | **Repositorios** en `src/db/`: cargar el catálogo (globales, tuyos, componentes y regulaciones), cargar una fórmula, añadir un evento | Pruebas contra Supabase local |
| 3.3 | **Adaptador** `src/db/to-ifra.ts`: del catálogo al `IfraData` que ya usa el motor, como hace hoy `src/v2/to-ifra.ts` desde los CSV. Incluye `expand()` recursivo (§24) y la regla de `group_key` (la parte de cada miembro sobre su techo, sumada, no pasa de 1) | Con un catálogo de prueba, sin base de datos, sale el mismo `IfraData` que de los CSV equivalentes |

---

## Fase 4 · La extracción de los datos de la v2 (pasos 7 y 12)

Un script, `scripts/v3/importar.ts`, de los CSV a Postgres. **Reutiliza `src/v2/load.ts` y `src/v2/validate.ts`: si `validar:v2` da un error, no importa nada.** Actualiza por `ref`, así que se puede repetir.

| Paso | Qué entra | Cómo |
|---|---|---|
| 4.1 | **Disolventes** | Los siete de la app, `kind = 'solvent'` |
| 4.2 | **Materiales** (4260) | `sustancia` → `substance`, `natural` → `natural`, `base` → `base`, `formula` → `frozen`. `ref`, especie, parte, proceso, quimiotipo, CAS, INCI, origen. `coverage` calculada con la regla de hoy |
| 4.3 | **Composición** (3140 cifras) | Solo de documentos `revisado` (D6). `source` = id y título del documento. Tipos: `tipico` → `exact`, `maximo` → `max`, `rango` → `range` |
| 4.4 | **Productos** (89), según V3-2 (decidida: material propio) | Cada producto, un material global con `ref` = `P…`. Su composición: la de su material general, con su autoridad, más la de su certificado. Sus **topes** (13), regulaciones `manufacturer`. Las **concentraciones por defecto** (10) no tienen sitio en el plan: se quedan en el CSV |
| 4.5 | **IFRA 51** | De `datos/ifra/51/` y `grupo-miembros.csv`: una regulación por miembro y categoría, `group_key` = la referencia del estándar (con su subgrupo en el 097 y el 181), `amendment = '51'`. El 089 y sus miembros comparten `group_key` |
| 4.6 | **Condiciones** (D11) | `requirement` por estándar; `requirement_met` con la autoridad y la fuente de `condiciones.csv` |
| 4.7 | **Nombres** (V3-3) | Cuando se decida |

**Hecho cuando:** los recuentos coinciden con los CSV, una segunda ejecución no cambia ninguna fila, y el registro dice de qué commit salen los datos.

---

## Fase 5 · La equivalencia: la prueba que manda

| Paso | Qué | Hecho cuando |
|---|---|---|
| 5.1 | Para **cada material** de la v2, el `IfraMaterial` que sale de la base de datos y el que sale de los CSV | Iguales, material a material |
| 5.2 | Las **pruebas de referencia** (la F-001) y el **informe de tu biblioteca** (`biblioteca.tool.test.ts`, el de `comparacion-fase6.md`), con los datos de la base | El mismo informe IFRA, línea a línea. Cada diferencia se lista y se explica; **nunca se arregla tocando la prueba** |

---

## Fase 6 · Tus fórmulas (paso 13)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 6.1 | Leer tu biblioteca (`Documentos\Perfumería\Fórmulas`) desde tu equipo, con tu permiso | Copia de los archivos en la carpeta del proyecto |
| 6.2 | `scripts/v3/importar-formulas.ts`: cabecera → `formulas`, historial → `formula_events` en orden. Las claves: las de la v2, por `ref`; `cas:`, por CAS; `prov:` y `own:`, un material provisional tuyo por nombre (el mismo nombre es el mismo material, P44); `vec:`, un material `frozen` tuyo con su composición; `solv:`, los disolventes; tus diluyentes propios, provisionales tuyos. Las versiones de una familia, unidas por `parent_id` | Para cada fórmula, `compose()` desde la base da la composición que guarda el archivo, y el informe IFRA es el de la v2 |

---

## Fase 7 · El banco en la web

| Paso | Qué | Hecho cuando |
|---|---|---|
| 7.1 | Lanzador y biblioteca desde la base; las versiones, agrupadas por la cadena de `parent_id` | Ves tus fórmulas agrupadas |
| 7.2 | El banco escribe un evento por acción: `add` con el `seq` siguiente, `set_mass`, `remove`, `reweigh` (la tara se propone desde el último repesado), `note`. Deshacer añade el evento contrario. La búsqueda va sobre el catálogo en memoria | Recreas la **F-001** desde cero y sus números coinciden con los del cuaderno (el criterio de `plan-desarrollo.md`) |
| 7.3 | El panel de IFRA, los gráficos y la ficha, sobre el nuevo `IfraData` | Las dos lecturas coinciden con el cálculo a mano en tres casos |
| 7.4 | Guardar una fórmula como material (`frozen`, §27) | Cambiar la fórmula después no cambia el material |
| 7.5 | Pantalla estrecha y sin *hover* | El banco se usa en el móvil |

---

## Fase 8 · Publicar y limpiar (pasos 14 y 15)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 8.1 | Proyecto de Supabase en la nube; `supabase db push` y el script de importación contra él | Los recuentos de la Fase 4, en la nube |
| 8.2 | Alojar la web (un alojamiento estático para Vite; se elige en ese momento) | Entras desde el PC y desde el móvil |
| 8.3 | **Copias:** volcado nocturno de la base a un repositorio privado con una acción de GitHub. El plan gratuito de Supabase no da copias descargables | Aparece una copia cada noche |
| 8.4 | Quitar los cargadores de CSV y JSON del tiempo de ejecución y el código de la v1 y la v2 que ya no se use. **Se quedan** `datos/`, `scripts/` y lo que usa el importador (`src/v2/load.ts`, `validate.ts`) | `npm test` pasa y la app no lee ningún CSV al arrancar |

---

## Lo que queda aplazado por el plan, para que no se pierda

Del §46 del plan, más lo que la revisión encontró y V3-1 deja fuera:

- **Productos y lotes** como tablas, documentos con archivos.
- **Favoritas, última dilución y nombre del frasco** (`material_preferences`).
- **Concentración por defecto de un producto** (D12, 10 filas en `concentraciones.csv`).
- **Familias, uso habitual y duración** en la ficha y en los gráficos (V3-3).
- **Sin conexión.**
- **Exportar al cuaderno** (Markdown y CSV).
- **Abrir la app a otros usuarios**, después de revisar las licencias de IFRA, el FIG y TGSC.
