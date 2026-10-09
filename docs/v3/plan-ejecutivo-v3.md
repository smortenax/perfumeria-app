# Plan ejecutivo de la v3

*2026-10-07. Sale de `PLAN_V3.md` con las decisiones de [`decisiones-v3.md`](decisiones-v3.md) (V3-1: donde chocan, manda el plan). Cada paso dice cuándo está hecho, para que se pueda comprobar sin opinar. Va por fases y en orden; cada paso, un commit.*

**El orden manda** (el usuario, 2026-10-07): primero **los datos y el glosario de materiales** (fases 2 a 6), y solo después **la formulación** (fases 7 a 9). En sus palabras: «hay que establecer el tratado de datos y todo el glosario de materiales conforme antes de hacer nada de la formulacion».

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

## Bloque A · Los materiales y el glosario

## Fase 2 · El esquema de los materiales (pasos 5, 6 y 11)

Las tablas de materiales del plan, según [`modelo-materiales-v3.md`](modelo-materiales-v3.md) (segunda versión, sobre el plan). Las de fórmulas esperan a la fase 7.

| Paso | Tabla | Además de lo del plan |
|---|---|---|
| 2.1 | `materials` | `kind`: `substance`, `mixture`, `solvent`, `provisional`, `frozen` (V3-4). `based_on_id`, tu versión de un común (V3-5). Según 7.3: `aliases` (otros nombres para el buscador) |
| 2.2 | `material_components` | `amount_kind` (`exact`, `max`, `range`, `unknown`) con su comprobación: `range` exige mínimo ≤ máximo, `exact` y `max` exigen valor, `unknown` ninguno. Un material no se contiene a sí mismo |
| 2.3 | `regulations` | Nada: `kind` es `max`, `prohibited` o `requirement`, y la enmienda va en `source`. `max_value` es fracción del producto terminado |
| 2.4 | `lab_materials` | Usuario + material: «lo que tengo» (V3-3). Sin cantidades |
| 2.5 | Perfil del usuario | El interruptor «solo lo que tengo», en los datos del usuario de Supabase Auth (sin tabla) |

| Paso | Qué | Hecho cuando |
|---|---|---|
| 2.6 | **RLS.** Materiales, componentes y regulaciones: lees los comunes y los tuyos; escribes solo los tuyos. `lab_materials`: solo los tuyos. Lo común solo lo escribe el script, con la clave de servicio | — |
| 2.7 | **Disparadores:** un material común solo contiene comunes; la composición de un `frozen` no se cambia; sin ciclos de composición ni de «basado en»; `updated_at` al día | — |
| 2.8 | **Pruebas de la base** (`npm run test:db`, contra Supabase local, con dos usuarios) | A no ve nada de B; A no escribe en lo común; la versión de A de un material común no cambia el común |

---

## Fase 3 · El acceso a los datos y el núcleo (paso 10)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 3.1 | **Exactitud por la API:** `numeric` y `bigint` se leen con `::text` y se escriben como texto; el dominio los convierte a `Ratio` y `bigint`. Nunca pasan por un `number` de JavaScript | Prueba de ida y vuelta: `9007199254740993` µg y `0.000000000000000000000000000001` vuelven idénticos |
| 3.2 | **Repositorios** en `src/db/`: cargar el catálogo (comunes y tuyos, con componentes y regulaciones), crear y editar tus materiales, marcar «lo tengo» | Pruebas contra Supabase local |
| 3.3 | **Adaptador** `src/db/to-ifra.ts`: del catálogo al `IfraData` que ya usa el motor, como hace hoy `src/v2/to-ifra.ts` desde los CSV. Incluye `expand()` recursivo (§24) con dónde se para según el tipo, el componente «Sin identificar», el requisito según su autoridad, la regla de `group_key` (la parte de cada miembro sobre su máximo, sumada, no pasa de 1) y la herencia de tu versión (V3-5) | Con un catálogo de prueba, sin base de datos, sale el mismo `IfraData` que de los CSV equivalentes |

---

## Fase 4 · La extracción de los datos de la v2 (pasos 7 y 12)

Un script, `scripts/v3/importar.ts`, de los CSV a Postgres. **Reutiliza `src/v2/load.ts` y `src/v2/validate.ts`: si `validar:v2` da un error, no importa nada.** El id de cada material se calcula a partir de su id de la v2, así que se puede repetir sin duplicar nada.

| Paso | Qué entra | Cómo |
|---|---|---|
| 4.1 | **Disolventes** | Los siete de la app, `kind = 'solvent'` |
| 4.2 | **Materiales** (4260) | `sustancia` → `substance`; `natural` y `base` → `mixture`. Especie, parte, proceso, quimiotipo, CAS, INCI y origen. Las listas parciales (9 materiales y 2 productos) llevan el componente «Sin identificar» |
| 4.3 | **Composición** (3140 cifras) | Solo de documentos `revisado` (D6). `source` = id y título del documento. Tipos: `tipico` → `exact`, `maximo` → `max`, `rango` → `range` |
| 4.4 | **Productos** (89), según V3-2 | Cada producto, un material común con su composición entera: la de su material general más la de su certificado, escrita por el script. Sus **topes** (13), regulaciones `manufacturer`. Las **concentraciones por defecto** (10) no tienen sitio en el plan: se quedan en el CSV |
| 4.5 | **IFRA 51** | De `datos/ifra/51/` y `grupo-miembros.csv`: una regulación por miembro y categoría, `group_key` = la referencia del estándar (con su subgrupo en el 097 y el 181), y la enmienda en `source`. El 089 y sus miembros comparten `group_key` |
| 4.6 | **Requisitos** | Un `requirement` por estándar y miembro, con autoridad `ifra`; si `condiciones.csv` dice que se cumple, con la autoridad y la fuente de esa fila |
| 4.7 | **Otros nombres**, según 7.3 | Del glosario de la v1 (que sigue congelado: se lee, no se toca), unidos a la v2 por `v1-a-v2.csv`. Familias, uso y duración no entran al principio |

**Hecho cuando:** los recuentos coinciden con los CSV, una segunda ejecución no cambia ninguna fila, y el registro dice de qué commit salen los datos.

---

## Fase 5 · La equivalencia de los materiales

| Paso | Qué | Hecho cuando |
|---|---|---|
| 5.1 | Para **cada material** de la v2, el `IfraMaterial` que sale de la base de datos y el que sale de los CSV | Iguales, material a material. Cada diferencia se lista y se explica; **nunca se arregla tocando la prueba** |
| 5.2 | Según 7.3: para **cada material** del glosario de la v1, el buscador de la v3 lo encuentra por los mismos nombres que hoy | Iguales |

---

## Fase 6 · El glosario en la web

| Paso | Qué | Hecho cuando |
|---|---|---|
| 6.1 | **Recorrer** todo lo común y lo tuyo, con filtros (tipo, común o tuyo, lo que tengo, estado IFRA) y el buscador | Encuentras un material por su nombre comercial, su sigla, su CAS o la grafía española |
| 6.2 | **La ficha**, la misma para todos: identidad, composición con su autoridad y fuente, y regulación | La ficha de un material común dice lo mismo que la de la v2 |
| 6.3 | **Crear tus materiales**, de cualquier tipo, con la misma ficha, sus regulaciones incluidas | Un material tuyo con su certificado da su IFRA como uno común |
| 6.4 | **Tu versión de un común** | Hereda todo, añade lo tuyo, el común no cambia y salen los dos |
| 6.5 | **Lo que tengo**: marcar de golpe o poco a poco | La lista se guarda y se ve en los filtros |
| 6.6 | Pantalla estrecha y sin *hover* | El glosario se usa en el móvil |

---

## Bloque B · La formulación

## Fase 7 · Las fórmulas: esquema y tus fórmulas (pasos 8, 9 y 13)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 7.1 | `formulas`: las del plan; `parent_id` a `NULL` si se borra la madre | — |
| 7.2 | `formula_events`: comprobación por tipo (`add` exige material, masa > 0, fracción en (0, 1] y diluyente si es < 1; `set_mass` y `remove`, un `target`; `reweigh`, bruto > tara; `note`, texto) y `UNIQUE(formula_id, seq)` | — |
| 7.3 | RLS: fórmulas, solo las tuyas; eventos, según su fórmula y **solo se añaden**. Disparador: un evento solo usa materiales comunes o tuyos | Pruebas con dos usuarios: A no ve las fórmulas de B, no añade un evento con un material de B, ni edita ni borra un evento |
| 7.4 | Leer tu biblioteca (`Documentos\Perfumería\Fórmulas`) desde tu equipo, con tu permiso | Copia de los archivos en la carpeta del proyecto |
| 7.5 | `scripts/v3/importar-formulas.ts`: cabecera → `formulas`, historial → `formula_events` en orden. Las claves: las de la v2, por el id que se calcula de ellas; `cas:`, por CAS; `prov:` y `own:`, un material provisional tuyo por nombre (P44); `vec:`, un material `frozen` tuyo con su composición; `solv:`, los disolventes; tus diluyentes propios, provisionales tuyos. Las versiones, unidas por `parent_id` | Para cada fórmula, `compose()` desde la base da la composición que guarda el archivo |
| 7.6 | Las **pruebas de referencia** (la F-001) y el **informe de tu biblioteca** (`biblioteca.tool.test.ts`, el de `comparacion-fase6.md`), con los datos de la base | El mismo informe IFRA, línea a línea; cada diferencia, explicada |

---

## Fase 8 · El banco en la web

| Paso | Qué | Hecho cuando |
|---|---|---|
| 8.1 | Lanzador y biblioteca desde la base; las versiones, agrupadas por la cadena de `parent_id` | Ves tus fórmulas agrupadas |
| 8.2 | El banco escribe un evento por acción: `add` con el `seq` siguiente, `set_mass`, `remove`, `reweigh` (la tara se propone desde el último repesado), `note`. Deshacer añade el evento contrario. El buscador, sobre el catálogo en memoria, **con el interruptor «solo lo que tengo»** | Recreas la **F-001** desde cero y sus números coinciden con los del cuaderno (el criterio de `plan-desarrollo.md`) |
| 8.3 | Un **provisional** se crea desde el buscador con solo su nombre, y se completa luego en el glosario | — |
| 8.4 | El panel de IFRA, los gráficos y la ficha, sobre el nuevo `IfraData` | Las dos lecturas coinciden con el cálculo a mano en tres casos |
| 8.5 | Guardar una fórmula como material (`frozen`, §27) | Cambiar la fórmula después no cambia el material |
| 8.6 | Pantalla estrecha y sin *hover* | El banco se usa en el móvil |

---

## Fase 9 · Publicar y limpiar (pasos 14 y 15)

| Paso | Qué | Hecho cuando |
|---|---|---|
| 9.1 | Proyecto de Supabase en la nube; `supabase db push` y el script de importación contra él | Los recuentos de la fase 4, en la nube |
| 9.2 | Alojar la web (un alojamiento estático para Vite; se elige en ese momento) | Entras desde el PC y desde el móvil |
| 9.3 | **Copias:** volcado nocturno de la base a un repositorio privado con una acción de GitHub. El plan gratuito de Supabase no da copias descargables | Aparece una copia cada noche |
| 9.4 | Quitar los cargadores de CSV y JSON del tiempo de ejecución y el código de la v1 y la v2 que ya no se use. **Se quedan** `datos/`, `scripts/` y lo que usa el importador (`src/v2/load.ts`, `validate.ts`) | `npm test` pasa y la app no lee ningún CSV al arrancar |

**Nota:** el glosario en la web (fase 6) puede publicarse antes que el banco, si quieres usarlo ya: 9.1 a 9.3 no dependen de las fórmulas.

---

## Lo que queda aplazado por el plan, para que no se pierda

Del §46 del plan, más lo que la revisión encontró y V3-1 deja fuera:

- **Productos y lotes** como tablas, documentos con archivos.
- **Favoritas, última dilución y nombre del frasco** (`material_preferences`).
- **Concentración por defecto de un producto** (D12, 10 filas en `concentraciones.csv`).
- **Familias, uso habitual y duración** (en la ficha y en los gráficos).
- **Sin conexión.**
- **Exportar al cuaderno** (Markdown y CSV).
- **Abrir la app a otros usuarios**, después de revisar las licencias de IFRA, el FIG y TGSC.
