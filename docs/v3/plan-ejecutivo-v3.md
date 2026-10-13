# Plan ejecutivo de la v3

*2026-10-07, revisado el 2026-10-13 con V3-8 y V3-9 (sin conexión), V3-10 (bancos de trabajo) y V3-11 (tu referencia de materiales y el buscador sin duplicados). Sale de `PLAN_V3.md` con las decisiones de [`decisiones-v3.md`](decisiones-v3.md) (V3-1: donde chocan, manda el plan). Cada paso dice cuándo está hecho, para que se pueda comprobar sin opinar. Va por fases y en orden; cada paso, un commit.*

**El orden manda** (el usuario, 2026-10-07): primero **los datos y el glosario de materiales** (fases 2 a 6), y solo después **la formulación** (fases 7 a 9). En sus palabras: «hay que establecer el tratado de datos y todo el glosario de materiales conforme antes de hacer nada de la formulacion».

**Cómo se lee:** «Hecho cuando» es la comprobación que cierra el paso. Si falla, el paso no está hecho. Entre paréntesis, el paso del §44 del plan al que corresponde.

**Sin conexión** (V3-8, V3-9): la app es una PWA y guarda **una copia de los datos en el navegador**, que PowerSync sincroniza con Supabase. La app lee y escribe siempre en esa copia; lo que haces sin red sube al volver. Hace falta red solo la primera vez, para entrar y descargar. Supabase sigue siendo el original.

**Lo que no cambia:** `src/core/` (el motor) solo se toca si una prueba demuestra que hace falta, como hasta ahora. La v2 llega al motor por un adaptador. Los datos los escribe un script, nunca a mano.

**Cómo se arranca:** en un chat de Claude Code aparte, con [`prompt-arranque-v3.md`](prompt-arranque-v3.md).

---

## Antes de empezar · Las preguntas que quedan

Se hacen **de una en una**, en este orden, y cada respuesta entra en [`decisiones-v3.md`](decisiones-v3.md) como V3-12, V3-13… con tus palabras. Las fases 0 y 1 no dependen de ellas; la fase 2, sí.

1. ~~**7.5 a 7.11**~~ (decididas: V3-12 a V3-18) de [`modelo-materiales-v3.md`](modelo-materiales-v3.md): los tipos, los duplicados, la ficha, los datos del laboratorio, varios CAS, los datos en disputa, la tenacidad y las familias. Cada una lleva sus opciones y la recomendación.
2. **Los bancos de trabajo** (V3-10; B.1 decidida: V3-19):

| # | Pregunta | Opciones | Recomiendo |
|---|---|---|---|
| ~~B.1~~ | ~~¿Una fórmula está en un banco o en varios?~~ | **Decidida (V3-19, 2026-10-13): cada fórmula, en un banco; unos marcadores la sacan a carpetas generales** | |
| **B.2** | **¿Cada fórmula lleva un papel dentro de su banco** (corazón, acorde de salida, final)? | **Una etiqueta libre y opcional.** **Una lista cerrada.** **Nada** | **La etiqueta libre.** Aún no hay vocabulario, y una lista cerrada se puede sacar después de las etiquetas que uses. Toca P45 («acorde o perfume al guardar»), que sigue abierta en `docs/a-futuro.md` |

---

## Fase 0 · Preparar

| Paso | Qué | Hecho cuando |
|---|---|---|
| 0.1 | Etiqueta `v2-final` en `main`, para poder volver a la v2 entera | La etiqueta está en GitHub |
| 0.2 | La v3 se hace en una rama propia, que tú decides cuándo fusionar | Rama creada (con tu permiso, como pide `CLAUDE.md`) |
| 0.3 | **Entorno en WSL:** el repo clonado dentro de WSL (en `~/`, no en `/mnt/c`, que es lento), Node 22 LTS y Docker Desktop con la integración de WSL activada (Supabase local y PowerSync local lo necesitan) | `npm ci && npm test` pasa en WSL, y `npx supabase --version` responde |
| 0.4 | `docs/v3/estado.md`, como el de la v2: qué está hecho y qué sigue, en 30 líneas | Existe y se actualiza al final de cada sesión |

**Tu app 0.2.1 instalada sigue funcionando** todo el tiempo: quitar Tauri del repo no la desinstala.

---

## Fase 1 · El esqueleto, sin datos (pasos 1 a 4)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 1.1 | **Quitar Tauri.** Se borran `src-tauri/`, las dependencias `@tauri-apps/*` y el script `tauri`. Solo cuatro archivos las usan (`src/bench/io.ts`, `library.ts`, `store.ts`, `zoom.ts`); pasan a una interfaz de guardado con una implementación provisional en el navegador, que ya existe para el desarrollo | `npm run build` y `npm test` pasan; `npm run dev` abre el banco en el navegador y la prueba de la F-001 sigue verde (paso 2) |
| 1.2 | **Supabase local:** `npx supabase init` y `npx supabase start`. Registro cerrado (`enable_signup = false`), tu usuario creado a mano. La publicación `powersync` y el rol de replicación que pide PowerSync, en una migración | Studio abre en `localhost:54323`. `.env.example` en el repo; `.env.local` fuera de Git |
| 1.3 | **Drizzle en el servidor:** `drizzle-orm`, `drizzle-kit` y `postgres`. El esquema de Postgres en `db/schema/`. `drizzle.config.ts` escribe el SQL en `supabase/migrations/` con el formato de nombres de Supabase. **Una sola carpeta de migraciones**: RLS y disparadores van en SQL en la misma carpeta | `drizzle-kit generate` crea un SQL y `npx supabase db reset` lo aplica limpio |
| 1.4 | **PowerSync local:** el servicio en Docker junto a Supabase local, como en el ejemplo oficial (`powersync-ja/self-host-demo`, `demos/supabase`). Su configuración y las reglas de sincronización, en `powersync/` dentro del repo | El servicio arranca y lee la publicación de Supabase |
| 1.5 | **La copia en el navegador:** `@powersync/web` y `@powersync/drizzle-driver`. El esquema del navegador (SQLite, con Drizzle) en `src/db/local/`. El conector: pide el token a la sesión de Supabase y sube la cola con `supabase-js` | Con una tabla de prueba: una fila escrita **con la red cortada** (herramientas del navegador) sigue ahí al recargar sin red, y aparece en Supabase al volver la red |
| 1.6 | **La PWA:** `vite-plugin-pwa`. La app se guarda en el navegador y coge la versión nueva cuando hay red | Con la red cortada, recargar abre la app. Tras publicar un cambio, la siguiente carga con red lo trae |
| 1.7 | **Inicio de sesión:** cliente `supabase-js` en `src/db/client.ts` y una pantalla de entrar con correo y contraseña. La sesión se guarda para abrir sin red | Entras y ves el lanzador; sin red, la app abre con tu sesión guardada; sin sesión, no |

---

## Bloque A · Los materiales y el glosario

## Fase 2 · El esquema de los materiales (pasos 5, 6 y 11)

Las tablas de materiales del plan, según [`modelo-materiales-v3.md`](modelo-materiales-v3.md) (segunda versión, sobre el plan). Las de fórmulas esperan a la fase 7. **Cada tabla se escribe dos veces con Drizzle**: en Postgres (`db/schema/`) y en el navegador (`src/db/local/`), y **cada una lleva su propio `id` uuid**, porque PowerSync no admite claves compuestas (V3-9).

| Paso | Tabla | Además de lo del plan |
|---|---|---|
| 2.1 | `materials` | `kind`: `molecule`, `natural`, `composition`, `provisional` o `frozen`, y la marca `solvent` (V3-12). `based_on_id`, tu versión de un común (V3-5), con su grado, proveedor y pureza (referencia §2). `aliases`, otros nombres para el buscador (V3-6). `category_id` y `form`, para el buscador (V3-13). El núcleo de la ficha, lo propio de cada tipo, `sources` y `confidence`, en columnas que admiten vacío (V3-14). `cas` y la lista `other_cas` (V3-16). `disputed_fields`, los campos en disputa (V3-17). `source_formula_id` en un `frozen`: de qué fórmula sale (V3-10) |
| 2.1b | `material_categories` (V3-13) | Común, la escribe el script: id, nombre y otros nombres. Solo agrupa para el buscador: ninguna fórmula ni regulación apunta a ella |
| 2.2 | `material_components` | Su propio `id` (V3-9). `amount_kind` (`exact`, `max`, `range`, `unknown`) con su comprobación: `range` exige mínimo ≤ máximo, `exact` y `max` exigen valor, `unknown` ninguno. Un material no se contiene a sí mismo |
| 2.3 | `regulations` | Nada: `kind` es `max`, `prohibited` o `requirement`, y la enmienda va en `source`. `max_value` es fracción del producto terminado |
| 2.4 | `lab_materials` | Usuario + material, con su propio `id` (V3-9): «lo que tengo» (V3-3). Sin cantidades |
| 2.4b | `material_doses` (V3-14) | Una fila por fuente: mínima, típica y máxima, **siempre con su base** (del concentrado, del producto terminado o «sin declarar»), con su autoridad y su fuente. Las columnas, las de `datos/v2/usos.csv`. Una marca `disputed` si la fila está en disputa (V3-17) |
| 2.5 | Perfil del usuario | El interruptor «solo lo que tengo», en los datos del usuario de Supabase Auth (sin tabla), con una copia en el navegador para cambiarlo sin red |

| Paso | Qué | Hecho cuando |
|---|---|---|
| 2.6 | **RLS** (lo que sube). Materiales, componentes y regulaciones: lees los comunes y los tuyos; escribes solo los tuyos. `lab_materials`: solo los tuyos. Categorías: las lees todas. Lo común solo lo escribe el script, con la clave de servicio | — |
| 2.6b | **Reglas de sincronización** (lo que baja), en `powersync/`: a todos, lo común; a cada uno, lo suyo. Repiten las de RLS, porque PowerSync no pasa por RLS al descargar | — |
| 2.7 | **Disparadores:** un material común solo contiene comunes; la composición de un `frozen` no se cambia; sin ciclos de composición ni de «basado en»; `updated_at` al día | — |
| 2.8 | **Pruebas de la base** (`npm run test:db`, contra Supabase y PowerSync locales, con dos usuarios) | A no ve nada de B, **ni le llega por la sincronización**; A no escribe en lo común; la versión de A de un material común no cambia el común |

---

## Fase 3 · El acceso a los datos y el núcleo (paso 10)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 3.1 | **Exactitud en la copia y en la sincronización:** `numeric` llega al navegador como texto, sin pérdida; `bigint` llega como entero, así que en el esquema del navegador las columnas exactas se declaran como texto. El dominio los convierte a `Ratio` y `bigint`; nunca pasan por un `number` de JavaScript. **Si un `bigint` no vuelve idéntico, las masas pasan a `numeric`** | Prueba de ida y vuelta por la sincronización, en los dos sentidos: `9007199254740993` µg y `0.000000000000000000000000000001` vuelven idénticos |
| 3.2 | **Repositorios** en `src/db/`, **siempre sobre la copia del navegador**, nunca directos a Supabase: cargar el catálogo (comunes y tuyos, con componentes y regulaciones), crear y editar tus materiales, marcar «lo tengo». Lo que se escribe va a la cola de subida | Pruebas sin red contra la copia; una prueba de subida contra Supabase local |
| 3.3 | **Adaptador** `src/db/to-ifra.ts`: del catálogo al `IfraData` que ya usa el motor, como hace hoy `src/v2/to-ifra.ts` desde los CSV. Incluye `expand()` recursivo (§24) con dónde se para según el tipo, el componente «Sin identificar», el requisito según su autoridad, la regla de `group_key` (la parte de cada miembro sobre su máximo, sumada, no pasa de 1) y la herencia de tu versión (V3-5) | Con un catálogo de prueba, sin base de datos, sale el mismo `IfraData` que de los CSV equivalentes |

---

## Fase 4 · La extracción de los datos de la v2 (pasos 7 y 12)

Un script, `scripts/v3/importar.ts`, de los CSV a Postgres. **Reutiliza `src/v2/load.ts` y `src/v2/validate.ts`: si `validar:v2` da un error, no importa nada.** El id de cada material se calcula a partir de su id de la v2, así que se puede repetir sin duplicar nada.

| Paso | Qué entra | Cómo |
|---|---|---|
| 4.1 | **Disolventes** | Los siete de la app ya son sustancias de la v2 (V3-12): el script les pone la marca `solvent`, y la clave `solv:` de las fórmulas apunta a ellas. Qué DPG es el de la app (M02736 o M02952), lo decides tú en `duplicados.csv` (4.8) |
| 4.2 | **Materiales** (4260) | `sustancia` → `molecule`, `natural` → `natural`, `base` → `composition` (V3-12). Especie, parte, proceso, quimiotipo, CAS, INCI y origen. Los otros CAS (V3-16), de `datos/ifra/51/naturales.csv` y del glosario de la v1 (`otros_cas`). Las listas parciales (9 materiales y 2 productos) llevan el componente «Sin identificar» |
| 4.3 | **Composición** (3140 cifras) | Solo de documentos `revisado` (D6). `source` = id y título del documento. Tipos: `tipico` → `exact`, `maximo` → `max`, `rango` → `range` |
| 4.4 | **Productos** (89), según V3-2 | Cada producto, un material común con su composición entera: la de su material general más la de su certificado, escrita por el script. Sus **topes** (13), regulaciones `manufacturer`. Las **concentraciones por defecto** (10) no tienen sitio en el plan: se quedan en el CSV |
| 4.5 | **IFRA 51** | De `datos/ifra/51/` y `grupo-miembros.csv`: una regulación por miembro y categoría, `group_key` = la referencia del estándar (con su subgrupo en el 097 y el 181), y la enmienda en `source`. El 089 y sus miembros comparten `group_key` |
| 4.6 | **Requisitos** | Un `requirement` por estándar y miembro, con autoridad `ifra`; si `condiciones.csv` dice que se cumple, con la autoridad y la fuente de esa fila |
| 4.7 | **Otros nombres** (V3-6) | Del glosario de la v1 (que sigue congelado: se lee, no se toca), unidos a la v2 por `v1-a-v2.csv`. La familia y el matiz del glosario de la v1 (V3-18): la familia, una de las nueve de P48; el matiz, a `facets` (propuesta, se confirma aquí). La tenacidad no tiene datos comunes. Lo del laboratorio va en tu cuenta (4.9) |
| 4.8 | **Categorías y duplicados** (V3-11, V3-13) | **Agrupar:** el script pone cada material en su categoría por regla (una molécula, por su CAS; un natural, por especie + parte, o por su CAS si no dice la especie) y escribe la lista en `datos/v3/categorias.csv` para que la revises; agrupar no mezcla datos. Hoy, 906 materiales comparten 210 CAS (modelo §9.2). **Fusionar:** el script **no fusiona nada solo**. Los candidatos (el mismo material dos veces; hoy 43 nombres en 120 materiales) van a `datos/v3/conflictos/duplicados.csv`; tú decides cada fila y el script aplica tus decisiones. El id de la v2 de un material fusionado apunta al que queda, en `datos/v3/fusiones.csv`, así que las fórmulas que lo usaban lo siguen encontrando |
| 4.9 | **Materiales del laboratorio, en tu cuenta** (V3-15) | `scripts/v3/importar-laboratorio.ts`, desde `materiales.sqlite` del laboratorio, que lee y no escribe. Escribe en tu cuenta (tu `owner_id`), no en lo común. El que ya es un común entra como tu versión (`based_on_id`) con tu núcleo, tus dosis y tus sinónimos; cuál es el común lo decides tú en `datos/v3/conflictos/laboratorio.csv` (hoy, 89 de los 103 con CAS casan por CAS con la v2). El que no casa, material tuyo nuevo. Tus frascos (`user_materials`), «lo que tengo». Su IFRA de segunda mano, texto «sin verificar» que no calcula. La cata y los ejes esperan a la capa del usuario. Lo que tiene un conflicto pendiente en el laboratorio entra marcado «en disputa» (V3-17) |

**Hecho cuando:** los recuentos coinciden con los CSV (menos las fusiones que decidiste), cada fusión tiene tu decisión en el CSV, una segunda ejecución no cambia ninguna fila, y el registro dice de qué commit salen los datos. **Y un navegador nuevo descarga el catálogo entero** con los mismos recuentos; se apunta cuánto ocupa y cuánto tarda esa primera descarga.

---

## Fase 5 · La equivalencia de los materiales

| Paso | Qué | Hecho cuando |
|---|---|---|
| 5.1 | Para **cada material** de la v2, el `IfraMaterial` que sale de la base de datos y el que sale de los CSV | Iguales, material a material. Cada diferencia se lista y se explica; **nunca se arregla tocando la prueba** |
| 5.2 | Para **cada material** del glosario de la v1, el buscador de la v3 lo encuentra por los mismos nombres que hoy | Iguales |
| 5.3 | **El buscador no repite** (V3-11) | Buscar «lemon» o «lavender» da una fila por categoría (V3-13), con sus formas y proveedores debajo, no diez. Ninguna fórmula guarda una categoría, siempre un material concreto. Ningún nombre sale dos veces en la misma lista sin algo que lo distinga |

---

## Fase 6 · El glosario en la web

| Paso | Qué | Hecho cuando |
|---|---|---|
| 6.1 | **Recorrer** todo lo común y lo tuyo, con filtros (tipo, común o tuyo, lo que tengo, estado IFRA) y el buscador | Encuentras un material por su nombre comercial, su sigla, su CAS o la grafía española |
| 6.2 | **La ficha**, la misma para todos: identidad, composición con su autoridad y fuente, y regulación. Con V3-14, el núcleo y la dosis, cada dato con su fuente y su base; la familia con su color y la tenacidad como texto con su fuente (V3-18); un dato en disputa sale «en disputa» (V3-17) | La ficha de un material común dice lo mismo que la de la v2 |
| 6.3 | **Crear tus materiales**, de cualquier tipo, con la misma ficha, sus regulaciones incluidas | Un material tuyo con su certificado da su IFRA como uno común |
| 6.4 | **Tu versión de un común** | Hereda todo, añade lo tuyo, el común no cambia y salen los dos |
| 6.5 | **Lo que tengo**: marcar de golpe o poco a poco | La lista se guarda y se ve en los filtros |
| 6.6 | Pantalla estrecha y sin *hover* | El glosario se usa en el móvil |
| 6.7 | **Sin red** | Con la red cortada: recorres, creas y editas tus materiales y marcas lo que tienes. Al volver la red, todo sube y se ve en otro navegador |

---

## Bloque B · La formulación

## Fase 7 · Las fórmulas: esquema y tus fórmulas (pasos 8, 9 y 13)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 7.1 | `formulas`: las del plan; `parent_id` a `NULL` si se borra la madre. `workbench_id`, obligatorio (V3-19): al crear una fórmula, eliges su banco o creas uno. Sus marcadores (V3-19), y su papel en el banco si B.2 lo pide. Una versión nueva nace en el banco de su madre | — |
| 7.1b | `workbenches` (V3-10): id, dueño, nombre y notas. Solo tuyos y sincronizados (RLS y reglas de sincronización, como en 2.6) | A no ve los bancos de B |
| 7.2 | `formula_events`: comprobación por tipo (`add` exige material, masa > 0, fracción en (0, 1] y diluyente si es < 1; `set_mass` y `remove`, un `target`; `reweigh`, bruto > tara; `note`, texto). **El orden lo da el `id` de cada evento**, un UUID v7 creado en el dispositivo, con su hora: dos equipos sin red no chocan, como sí harían con un `seq` consecutivo y `UNIQUE(formula_id, seq)` (§43 del plan; propuesta de la sesión por V3-9) | Dos copias añaden eventos sin red a la misma fórmula; al sincronizar, las dos ven el mismo historial |
| 7.3 | RLS: fórmulas, solo las tuyas; eventos, según su fórmula y **solo se añaden**. Disparador: un evento solo usa materiales comunes o tuyos | Pruebas con dos usuarios: A no ve las fórmulas de B, no añade un evento con un material de B, ni edita ni borra un evento |
| 7.4 | Leer tu biblioteca (`Documentos\Perfumería\Fórmulas`) desde tu equipo, con tu permiso | Copia de los archivos en la carpeta del proyecto |
| 7.5 | `scripts/v3/importar-formulas.ts`: cabecera → `formulas`, historial → `formula_events` en orden. Toda fórmula necesita banco (V3-19): el script propone uno para cada una (las subcarpetas de tu biblioteca, si las hay) en `datos/v3/conflictos/bancos.csv`, y lo decides tú. Las claves de la v2 de un material fusionado (4.8) se leen por `fusiones.csv`. Las claves: las de la v2, por el id que se calcula de ellas; `cas:`, por CAS; `prov:` y `own:`, un material provisional tuyo por nombre (P44); `vec:`, un material `frozen` tuyo con su composición; `solv:`, los disolventes; tus diluyentes propios, provisionales tuyos. Las versiones, unidas por `parent_id` | Para cada fórmula, `compose()` desde la base da la composición que guarda el archivo |
| 7.6 | Las **pruebas de referencia** (la F-001) y el **informe de tu biblioteca** (`biblioteca.tool.test.ts`, el de `comparacion-fase6.md`), con los datos de la base | El mismo informe IFRA, línea a línea; cada diferencia, explicada |

---

## Fase 8 · El banco en la web

| Paso | Qué | Hecho cuando |
|---|---|---|
| 8.1 | Lanzador y biblioteca desde la base: tus bancos y las carpetas generales de los marcadores (V3-19); dentro de un banco, las versiones agrupadas por la cadena de `parent_id` | Ves tus bancos, y en cada uno sus fórmulas agrupadas |
| 8.1b | **Los bancos de trabajo** (V3-10): la biblioteca enseña los bancos y las carpetas generales (V3-19); cada banco, sus fórmulas, con los acordes congelados y en qué fórmula se usan. Crear un banco, mover una fórmula a otro. Marcar una fórmula: sale además en la carpeta general de su marcador | Haces un acorde dentro del banco de un perfume, lo guardas como corazón y lo usas en la fórmula final: los dos salen en el mismo banco, y el corazón dice dónde se usa. Sin marcar, el corazón no sale en el buscador de otro banco; marcado «acorde», sí, y sale en la carpeta «Acordes» |
| 8.2 | El banco escribe un evento por acción: `add` con el `seq` siguiente, `set_mass`, `remove`, `reweigh` (la tara se propone desde el último repesado), `note`. Deshacer añade el evento contrario. El buscador, sobre el catálogo en memoria, **con el interruptor «solo lo que tengo»**, y con los acordes de su banco y los marcados «acorde» (V3-19) | Recreas la **F-001** desde cero y sus números coinciden con los del cuaderno (el criterio de `plan-desarrollo.md`) |
| 8.3 | Un **provisional** se crea desde el buscador con solo su nombre, y se completa luego en el glosario | — |
| 8.4 | El panel de IFRA, los gráficos y la ficha, sobre el nuevo `IfraData` | Las dos lecturas coinciden con el cálculo a mano en tres casos |
| 8.5 | Guardar una fórmula como material (`frozen`, §27), con su `source_formula_id`; se queda en el banco de su fórmula. Marcarla «acorde» la congela y la deja usar en todos los bancos (V3-19) | Cambiar la fórmula después no cambia el material |
| 8.6 | Pantalla estrecha y sin *hover* | El banco se usa en el móvil |
| 8.7 | **Sin red** | Con la red cortada, pesas una fórmula entera con IFRA. Al volver la red, el historial sube completo y sin duplicados |

---

## Fase 9 · Publicar y limpiar (pasos 14 y 15)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 9.1 | Proyecto de Supabase en la nube; `supabase db push` y el script de importación contra él. **Una instancia de PowerSync Cloud** (plan gratis) conectada a él, con las reglas de `powersync/`. Los dos planes gratis se desactivan tras una semana sin uso; la app sigue funcionando con su copia y se reactivan desde su panel | Los recuentos de la fase 4, en la nube y en un navegador nuevo |
| 9.2 | Alojar la web (un alojamiento estático para Vite; se elige en ese momento) | Entras desde el PC y desde el móvil, y la app queda instalada en los dos |
| 9.3 | **Copias:** volcado nocturno de la base a un repositorio privado con una acción de GitHub. El plan gratuito de Supabase no da copias descargables | Aparece una copia cada noche |
| 9.4 | Quitar los cargadores de CSV y JSON del tiempo de ejecución y el código de la v1 y la v2 que ya no se use. **Se quedan** `datos/`, `scripts/` y lo que usa el importador (`src/v2/load.ts`, `validate.ts`) | `npm test` pasa y la app no lee ningún CSV al arrancar |

**Nota:** el glosario en la web (fase 6) puede publicarse antes que el banco, si quieres usarlo ya: 9.1 a 9.3 no dependen de las fórmulas.

---

## Lo que queda aplazado por el plan, para que no se pierda

Del §46 del plan, más lo que la revisión encontró y V3-1 deja fuera:

- **Productos y lotes** como tablas, documentos con archivos.
- **Favoritas, última dilución y nombre del frasco** (`material_preferences`).
- **Concentración por defecto de un producto** (D12, 10 filas en `concentraciones.csv`).
- **Familias, uso habitual y duración en los gráficos.** En la ficha entran con el núcleo (V3-14).
- **De tu referencia, lo que V3-14 deja para después:** relaciones, descriptores por fuente, perfumes de referencia y física. **Y tu capa:** diluciones preparadas, cata y lectura, ejes estéticos.
- **Los matices de los bancos de trabajo** que añadirás (V3-10).
- ~~**Sin conexión.**~~ Ya no se aplaza: entra con V3-8 y V3-9 (fases 1, 3, 6 y 8).
- **Exportar al cuaderno** (Markdown y CSV).
- **Abrir la app a otros usuarios**, después de revisar las licencias de IFRA, el FIG y TGSC.
