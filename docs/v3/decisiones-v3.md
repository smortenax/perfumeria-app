# Decisiones de la v3

*Abierto el 2026-10-07. La autoridad de la v3 es `PLAN_V3.md` (en el repo, `docs/v3/PLAN_V3.md`) con lo que se decide aquí. Cada decisión cita el mensaje del usuario. Lo que propone la sesión va marcado como propuesta.*

---

## V3-1 · Donde chocan, manda el plan v3 sobre la v2 (decidida por el usuario el 2026-10-07)

**Pregunta** (revisión del plan, §5.1, decisión 1): ¿siguen vigentes en la v3 las decisiones de la v2 (D1–D16 y `docs/decisiones.md`)?

**Respuesta literal** (orko kill, 2026-10-07 15:44):

> si todas las decisiones conflictivas mande v3 sobre v2 se ha hecho a drede el crear una estructura de datos, que antes no existia una plataforma el cambio de ejecutable a uso offline pero mediante hosting... se ha decidido por numerosas razone que funciona mejor las nuevas ideas

**Lectura** (la sesión, para que la confirmes):

- **En todo choque entre el plan y una decisión anterior, gana el plan.** Es a propósito: una base de datos que antes no existía, una plataforma web y el paso del ejecutable a una app alojada.
- **Lo que el plan no contradice sigue vigente**, sobre todo lo que el propio plan conserva: lo desconocido nunca vale cero, la aritmética exacta, la jerarquía de autoridad, el historial manda, la dilución no crea material. También las reglas de cómo se migran los datos (scripts deterministas, conflictos que decide el usuario, `validar:v2`), que el plan recoge en su §40.
- ~~**Sin conexión:** la v3 necesita conexión. El «offline completo» queda fuera, como dice el plan (§45).~~ [Corregido el 2026-10-13: era una lectura equivocada. La v3 funciona entera sin conexión (V3-8).]

**Por qué** (del mensaje): se ha decidido por numerosas razones que las ideas nuevas funcionan mejor.

### Qué contesta esto de la revisión

| Decisión de la revisión | Queda |
|---|---|
| 1 · ¿Siguen vigentes las de la v2? | **Manda el plan** (V3-1) |
| 2 · Dónde viven los datos de referencia | **CSV en el repo → scripts → Postgres.** Es lo que dice el plan (§40) |
| 3 · Modelo de materiales | **El del plan: 5 tablas** |
| 4 · Sin conexión | ~~Hace falta conexión~~ **Todo funciona sin conexión** (V3-8) |
| 5 · Quién la usa | Sin decidir. **Default de la sesión:** solo tú, con el registro cerrado, hasta revisar las licencias de los datos. No cierra ninguna puerta |

---

## Cómo queda cada punto de la revisión con V3-1

**Fuera por decisión** (el plan lo excluye o lo resuelve de otro modo):

| Punto | Cómo queda |
|---|---|
| M2 · IFRA por grupo | `regulations` por material, como dice el plan. El script escribe una fila por miembro del estándar desde los archivos de IFRA, así que **nadie copia un techo a mano**. Los miembros de un mismo estándar comparten `group_key` (ver M3) |
| M6 · Productos, lotes, topes, concentración por producto | Sin tabla `products` (§45). Los 89 productos que ya hay entran como **material global propio** (V3-2) |
| M7 · Documentos | Sin tabla: `source` en texto. **D6 se cumple al importar**: el script solo trae cifras de documentos `revisado` |
| M9 · Tipos de cifra | Los del plan. `tipico` → `exact`, `maximo` → `max`, `rango` → `range`. D2 sigue en el motor por la autoridad |
| F2 · Versiones | Solo `parent_id`. La biblioteca agrupa siguiendo la cadena hasta la fórmula raíz; el número de versión sale del orden |
| F3 · Fórmula como material | Material privado con su composición fija (§27). Se expande recursivamente (§24) |
| F4 · Deshacer | El historial no se borra (§12, §13). Deshacer añade el evento contrario: un `remove` de la última adición o un `set_mass` a la masa anterior |
| F5 · Favoritas, última dilución, nombre del frasco | Aplazadas (§46, `material_preferences`). **La barra empieza sin ellas.** Los diluyentes propios son materiales provisionales privados |
| F6 · Enmienda en la fórmula | Sin columna en la fórmula; la enmienda va en la regulación (ver abajo) |
| F7 · Archivos JSON y cuaderno | Sin archivos; las fórmulas viven en la base de datos |
| H1 · Sin conexión | ~~Hace falta conexión~~ **Sale de esta tabla:** todo funciona sin conexión (V3-8) |
| H7 · Retirar Tauri primero | Como dice el plan (paso 1). **La app 0.2.1 que tienes instalada sigue funcionando** con sus archivos: quitar Tauri del repo no la desinstala |

**Huecos que el plan no contradice:** *sustituido el 2026-10-07.* La primera versión los resolvía con columnas sacadas de la v2 (`ref`, `coverage`, `amendment`, `requirement_met`). El usuario pidió partir del plan v3 en su plenitud, y la segunda versión de [`modelo-materiales-v3.md`](modelo-materiales-v3.md) los resuelve con las tablas del plan. Se quedan de aquella tabla:
- `numeric` y `bigint` viajan como texto por la API;
- la fórmula congelada se guarda con 30 decimales;
- los defaults H3–H6, H8, H9 y H11–H13 de la revisión.

---

## V3-2 · Cada producto de la v2 entra como un material global propio (decidida por el usuario el 2026-10-07)

**Pregunta** (tarjeta del hilo): ¿Cómo entran en la v3 los 89 productos de la v2, con sus certificados y topes?

**Respuesta:** el usuario eligió en la tarjeta la opción «Material propio» (2026-10-07 19:22): «Cada producto es un material global aparte, con su certificado y su tope; no se pierde nada.»

**Cómo se aplica:** cada producto es un material global, con el id calculado a partir del suyo de la v2 (`P…`). Su composición es la de su material general, con su autoridad, más la de su certificado. Su tope de fabricante es una regulación `manufacturer` de ese material. Las 10 concentraciones por defecto (D12) no tienen sitio en el plan y se quedan en el CSV.

**Por qué** (de la tarjeta): conserva los certificados ya revisados sin añadir tablas, y pasar a una tabla de productos más adelante es mecánico.

## V3-3 · El glosario de materiales, y va antes que la formulación (decidida por el usuario el 2026-10-07)

**Respuestas literales** (orko kill, 2026-10-07):

> 19:52: «tiene que haber un glosario de materiales, ese glosario sera para cada usuario el computo global no solo de todo el listado de materiales compartidos y que la app registra sino que tambien sera donde ellos pueden agregar las especificaciones de ifra por cada uno de sus materiales, pueden agregar ellos materiales propios y dotarlos de los mismo parametros que los que la app plantea... [...] una opcion para que si el usuario lo prefiere seleccione el los materiales que tiene con un buscador [...] con esta opcion activada el buscador solo da como resultados los materiales que el usuario tiene durante la formulación [...] el usuario puede ajustar el glopsario que viene con la app a su medida(sin modificar el glosario comun) todos los cambios o adecuaciones de los materiales no sustituyen el estandar de la app pero amplian como materiales del usuario»

> 20:54: «el glosario es un paso previo a la formulacion en si, en cuanto al plan lo que supone es que hay que establecer el tratado de datos y todo el glosario de materiales conforme antes de hacer nada de la formulacion, y para la app el glosario en si es solo una visualizacion y la capacidad de que el usuario se personalice los materiales [...] la creacion del banco de datos y de como se haran sigue siendo la prioridad al empezar con la app»

**Lectura:**

- La app tiene un **glosario**: lo común más lo tuyo, con la misma ficha para todo.
- Puedes **crear materiales con los mismos parámetros**, IFRA incluido, y **hacer tu versión de uno común** sin cambiarlo.
- Tienes la lista de **«lo que tengo»**, con el interruptor que limita el buscador del banco a ella.
- **Orden:** primero la base de datos y los datos del glosario, después el glosario en la web, y solo después la formulación (`plan-ejecutivo-v3.md`, bloques A y B).
- El detalle del modelo, **en revisión contigo**, está en [`modelo-materiales-v3.md`](modelo-materiales-v3.md).

**Consecuencias en el esquema** (propuesta de la sesión):

- Tu versión de un común y los nombres por los que se busca: preguntas 7.2 y 7.3 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md). Las tablas de nombres y de perfil de la primera versión **se retiran**: el plan no las tiene.
- `lab_materials` para «lo que tengo». El plan dice «no habrá `user_materials`»; esto es otra cosa, tu selección, y tu mensaje es posterior.
- El interruptor, en tus datos de usuario.
- Sustituye el «sin inventario» de la v2 (P6) sin hacerlo inventario: no hay cantidades.

## V3-4 · Cinco tipos de material (decidida por el usuario el 2026-10-09)

> **Cambiada por V3-12 (2026-10-13):** los tipos son los de tu referencia, más `frozen`, y el disolvente es una marca aparte.

**Pregunta** (tarjeta del hilo, 7.1 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Qué tipos de material tiene la v3?

**Respuesta:** el usuario eligió en la tarjeta la opción «Cinco» (2026-10-09 13:27): «Sustancia, mezcla (natural o base), disolvente, provisional y fórmula congelada: solo los que cambian el cálculo.»

**Cómo se aplica:** `materials.kind` es uno de estos cinco:

| Tipo | Qué hace la app con él |
|---|---|
| `substance` | Sin componentes, es ella misma |
| `mixture` | Sin componentes, su contenido es desconocido |
| `solvent` | No cuenta como materia aromática |
| `provisional` | Todo desconocido |
| `frozen` | Composición fija |

Un natural se reconoce porque tiene especie. De la v2: `sustancia` → `substance`; `natural` y `base` → `mixture`.

**Por qué** (de la tarjeta): el plan no enumera tipos, y estos cinco son los que la app trata distinto.

## V3-5 · Tu versión de un material común es un vínculo (decidida por el usuario el 2026-10-09)

**Pregunta** (tarjeta del hilo, 7.2 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Cómo se hace tu versión de un material común?

**Respuesta:** el usuario eligió en la tarjeta la opción «Vínculo» (2026-10-09 13:28): «Tu material apunta al común y hereda lo suyo; una columna más, y los cambios de IFRA del común te llegan solos.»

**Cómo se aplica:** `materials.based_on_id`. Tu versión hereda la composición, las regulaciones y los datos del común, y añade los tuyos:

- **las cifras**, por autoridad;
- **los límites**, sumados: manda el más estricto.

Un material común solo puede basarse en otro común, y no hay ciclos. Los productos de V3-2 no lo usan: el script les escribe la composición entera.

**Por qué** (de la tarjeta): un límite nuevo de IFRA no puede perderse en una copia vieja.

## V3-6 · El buscador encuentra por varios nombres (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, 7.3 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Por qué nombres encuentra el buscador un material?

**Respuesta:** el usuario eligió en la tarjeta la opción «Varios nombres» (2026-10-13 11:09): «Además del nombre, cada material lleva sus otros nombres (comercial, sigla, sinónimos); encuentras Hedione o IBQ como hoy.»

**Cómo se aplica:** una columna `materials.aliases`, una lista de texto, sin tabla nueva.

- **Comunes:** los otros nombres salen del glosario de la v1 (que no se toca), unidos a la v2 por `v1-a-v2.csv`.
- **Tuyos:** los pones tú.
- ~~**Fuera al principio:** familias, uso y duración.~~ [Cambiado por V3-14 (2026-10-13): el núcleo de la ficha y la dosis entran desde el principio.]

**Por qué** (de la tarjeta): nadie busca «6-sec-Butylquinoline». Hoy se encuentra por IBQ, y es una sola columna más.

## V3-7 · Una cifra de literatura o consenso nunca da «dentro» (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, 7.4 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Mantener la regla D2: una cifra de literatura o consenso nunca da «dentro»?

**Respuesta:** el usuario eligió en la tarjeta la opción «Sí» (2026-10-13 11:25): «Una cifra de literatura o consenso da como mucho «acotada». Solo un lote, un certificado o el anexo de IFRA dan «dentro».»

**Cómo se aplica:** la regla D2 de la v2 pasa a la v3 tal cual. La autoridad de cada fila de `material_components` decide el veredicto: con `literature` o `consensus`, como mucho «acotada», y para IFRA se usa el máximo de su fuente. El motor ya la hace, y el esquema no cambia.

**Por qué** (de la tarjeta): sin ella, una cifra de consenso daría un verde que nada prueba.

## V3-8 · La app funciona entera sin conexión, en el navegador (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo): ¿Confirmas que la v3 funciona solo con conexión a internet?

**Respuesta literal** (orko kill, 2026-10-13 12:11):

> el plan era que sea uso de navegador pero todas las funciones sin conexion a internet, la app funciona en local con auto host o algo asi pero todos los cambios se hacen enuna web por lo tanto no hay que encargarse de versiones y launchers o app stores

**Lectura** (la sesión, para que la confirmes):

- La app se usa **en el navegador** y **todas sus funciones van sin red**: el banco, la biblioteca, el glosario, IFRA y tus materiales.
- **Se actualiza sola desde la web**, sin instaladores, versiones que repartir ni tiendas de apps. Es una app web instalable (PWA): la primera vez se descarga del sitio y queda guardada en el navegador, y cuando hay red coge la versión nueva.
- **Cambia el plan escrito.** Su §45 deja fuera «SQLite WASM», «offline completo» y «sincronización local/cloud»; con este mensaje entran. Corrige la lectura de V3-1, que decía que hacía falta conexión.

**Por qué** (del mensaje): no hay que encargarse de versiones, launchers ni tiendas de apps.

**Dónde viven los datos sin red:** lo decide V3-9.

## V3-9 · Una copia en el navegador, sincronizada con Supabase (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo): ¿Dónde guarda la app tus datos para funcionar sin conexión?

**Respuesta:** el usuario eligió en la tarjeta la opción «Copia sincronizada» (2026-10-13 12:29): «Todo vive en el navegador y se sincroniza con Supabase cuando hay red. Sirve en varios equipos, y se añade PowerSync.»

**Cómo se aplica:**

- **La app es una PWA:** se descarga del sitio, queda guardada en el navegador y coge la versión nueva cuando hay red.
- **Los datos viven en una base SQLite dentro del navegador**, que PowerSync sincroniza con Supabase. La app lee y escribe siempre en esa copia; lo que escribes sin red espera en una cola y sube al volver.
- **Supabase sigue siendo el original.** El script escribe ahí lo común, y RLS comprueba todo lo que sube. Lo que baja a cada usuario lo deciden las reglas de sincronización de PowerSync, que repiten las de RLS.
- **Hace falta red la primera vez:** para entrar y para la primera descarga. Después, todo funciona sin ella.
- **Coste:** el plan gratis de PowerSync para empezar. Se desactiva tras una semana sin uso, como el de Supabase, pero la app sigue funcionando con su copia. El de pago empieza en 49 $ al mes. En local, PowerSync corre en Docker junto a Supabase.

**Consecuencias en el esquema** (propuesta de la sesión):

- **Cada tabla que se sincroniza lleva su propio `id` (uuid)**, también `material_components` y `lab_materials`. PowerSync no admite claves compuestas.
- **El esquema se escribe dos veces con Drizzle:** Postgres en el servidor y SQLite en el navegador.
- **Las cifras exactas:** `numeric` llega al navegador como texto, sin pérdida. `bigint` llega como entero, así que en el navegador se declara como texto y una prueba de ida y vuelta lo comprueba.
- **El orden del historial lo da el id de cada evento** (un UUID v7, que lleva la hora del dispositivo), no un `seq` consecutivo. Así dos equipos sin red no chocan. Cambia la `UNIQUE(formula_id, seq)` del §43 del plan.
- **Si editas el mismo material tuyo en dos equipos sin red, gana el último que sube.** El historial de una fórmula no tiene ese problema, porque solo se añade.

**Por qué** (de la tarjeta): mantiene el Supabase del plan, deja abiertos el móvil y el producto, y sin red funciona igual.

**Fuentes:** [precios de PowerSync](https://powersync.com/pricing), [guía de PowerSync con Supabase](https://docs.powersync.com/integrations/supabase/guide), [tipos](https://docs.powersync.com/sync/types), [ids](https://docs.powersync.com/sync/advanced/client-id), [Drizzle en PowerSync](https://docs.powersync.com/client-sdk-references/javascript-web/javascript-orm/drizzle), [pausas de Supabase](https://supabase.com/docs/guides/platform/free-project-pausing). Consultadas el 2026-10-13.

## V3-10 · Bancos de trabajo para agrupar las fórmulas de un perfume (decidida por el usuario el 2026-10-13)

**Respuesta literal** (orko kill, 2026-10-13 14:55):

> dentro de la app creo que deberia haber un espacio global donde estan las formulas pero yambien una especia de carpetas que formen a modo de bancos de trabajo, sobretodo si voy a trabajar en una formula en concreto y hago un acorde para esta misma y lo guardo como corazon para ese perfume estaria bien que este en el mismo banco de trabajo que la formula final del perfume hay algunos matices mas pero creo que los ire añadiendo a futuro

**Lectura** (la sesión, para que la confirmes):

- **La biblioteca es el espacio global:** todas tus fórmulas.
- **Un banco de trabajo es una carpeta tuya** que agrupa lo de un proyecto: el perfume final, sus versiones y los acordes que haces para él.
- **Un acorde guardado como corazón** (congelado como material, plan §27) se queda en el banco del perfume.
- **Los matices los añadirás más adelante.** Están apuntados en `docs/a-futuro.md`.

**Cómo se aplica** (propuesta de la sesión):

- **Una tabla `workbenches`** (id, dueño, nombre, notas), solo tuya y sincronizada (V3-9). Es una tabla más que las del §34 del plan, y la pides tú.
- **`formulas.workbench_id`**, que puede ir vacío: una fórmula fuera de un banco sigue en la biblioteca. Una versión nueva (`parent_id`) nace en el banco de su madre.
- **`materials.source_formula_id`** en un material `frozen`: de qué fórmula sale. Así el banco enseña el acorde y en qué fórmula se usa.
- **Pendiente:** las preguntas B.1 y B.2 del [plan ejecutivo](plan-ejecutivo-v3.md).

## V3-11 · Qué se registra de un material, y un buscador sin duplicados (decidida por el usuario el 2026-10-13)

**Respuesta literal** (orko kill, 2026-10-13 14:55), con el archivo [`referencia-materiales-lab.md`](referencia-materiales-lab.md):

> un par de cosas mas sobre v2 que tienen que mejorarse a v3 la busqueda de materiales a veces es confusa porque muchos son duplicados de si mismos paso un plan de que registrar sobre los materiales en lo que seria la database global de v3

**Lectura** (la sesión, para que la confirmes):

- **El buscador de la v3 no enseña el mismo material varias veces.** Medido en la v2: 210 CAS los comparten 906 materiales, y 43 nombres, 120 ([`modelo-materiales-v3.md`](modelo-materiales-v3.md) §9.2).
- **Tu referencia dice qué se registra de cada material** en la base común.
- **Donde choca con lo decidido** (V3-4, V3-6, P37), no se reinterpreta: van las preguntas 7.5 a 7.11 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md), de una en una. El cruce completo está en su §9.1.

## V3-12 · Los tipos de tu referencia, más `frozen`; el disolvente, una marca aparte (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, 7.5 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Qué tipos tiene un material en la v3?

**Respuesta:** el usuario eligió en la tarjeta la opción «Referencia + frozen (Recomendado)» (2026-10-13 17:05): «molecule, natural, composition, provisional y frozen; el disolvente, una marca sí/no aparte de la función. Cambia V3-4.»

**Cómo se aplica:** `materials.kind` es uno de estos cinco, y sustituye la tabla de V3-4:

| Tipo | Lo define | Qué hace la app con él |
|---|---|---|
| `molecule` | Su química | Sin componentes, es ella misma |
| `natural` | Su origen: especie, parte, método | Sin componentes, su contenido es desconocido |
| `composition` | Su receta: la base de una casa, o una tuya | Sin componentes, su contenido es desconocido |
| `provisional` | Solo un nombre | Todo desconocido |
| `frozen` | Una fórmula tuya congelada (plan §27) | Composición fija |

- **El disolvente es una marca, `materials.solvent` (sí o no)**, aparte del tipo y de la función estética. Lo marcado no cuenta como materia aromática. Así lo hace ya el motor (`solvent?: boolean` en `src/core/model/material.ts`), y un disolvente con estándar de IFRA cuenta como cualquier material (`lookup` en `src/core/ifra.ts`).
- **Las reglas de clasificación de tu referencia (§1) valen:** decide la química, no cómo se vende; un semisintético sacado de un natural es `natural`; la dilución no es un tipo.
- **De la v2:** `sustancia` → `molecule`, `natural` → `natural`, `base` → `composition`.

**Consecuencias** (propuesta de la sesión):

- **Los siete disolventes de la app ya están en la v2 como sustancias** (`datos/v2/materiales.csv`): benzoato de bencilo (M01446), IPM (M02733), DPG (M02736, y M02952 «isomer unspecified»), TEC (M03278), DEP (M03304), alcohol etílico (M03145) y triacetina (M02710). No se crean materiales nuevos: el script marca esas moléculas como disolvente, y la clave `solv:` de las fórmulas apunta a ellas. **Cuál de los dos DPG es el de la app lo decides tú**, en el CSV de duplicados (plan ejecutivo, 4.8).
- El benzoato de bencilo está en el estándar IFRA_STD_009 (`datos/ifra/51/estandar-cas.csv`): pesado como diluyente, cuenta contra su límite, como ya hace el motor.
- La función estética (estructura, modificador, fijador…) es un campo de la ficha: pregunta 7.7.

**Por qué** (la recomendación de la sesión que elegiste): es tu modelo, probado con 111 materiales, y el cálculo no cambia. Separa el natural de la base, que en tu referencia llevan campos distintos.

## V3-13 · El buscador agrupa por categorías; cada ficha concreta lleva su composición y sus límites (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, 7.6 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Cómo deja de salir diez veces el mismo material en el buscador?

**Respuesta literal** (orko kill, 2026-10-13, escrita en la tarjeta):

> se agrupan de diferentes maneras, sinteticos que tienen diferente laboratorio pueden compartir categoria y luego tener opciones de proveedor  donde se cada proveedor obviamente tendra variaciones en composicion y se podria dar el ccaso que cada uno difiere de las categorias ifra dependiendo de los valores que lleva cada fabricante de acuerdo a su ficha de conformidad, de manera similar a como se hicieron con los diferentes tipos de extracciones naturales: lavanda existe como categoria y se concreta si es aceite absoluto extraccion de co2... cada uno es una ficha diferente pero el buscador no tiene que enseñarlas todas a la vez como materiales diferentes porque no es practico, un matix claro lo que pasa aqui no es que se compacten todos los materiales per se en la ficha sino que aunque cada uno sea basicamente el mismo material tienen matices para lo que al computo de la app respecta, la busqueda es accesible para el usuario pero la app tienen que rigurosamente saber que material esta tratando y los limites del mismo

Y sobre el material general (punto 5 de la lectura), 2026-10-13 17:19:

> y si a lo de  material generico en el sentido que hedione tendra dadas unas categorias generales ya aunquen no  apliques un fabricante concreto

**Lectura** (de la sesión; el usuario la confirmó en la tarjeta con «Sí, así», 2026-10-13 17:18):

1. **Se agrupa, no se fusiona.** Cada material concreto es una ficha propia, con su composición y sus límites: para el cálculo, cada uno tiene sus matices.
2. **El grupo se arma distinto según el material:**
   - **una molécula:** la categoría (Hedione) y debajo las opciones de cada fabricante o proveedor, cada una con su composición y su IFRA según su certificado de conformidad;
   - **un natural:** la categoría (lavanda) y debajo su forma (aceite esencial, absoluto, extracto de CO2…); cada forma puede tener sus proveedores.
3. **El buscador enseña la categoría**, no todas las fichas a la vez; al abrirla eliges la concreta.
4. **La fórmula guarda siempre el material concreto**, nunca la categoría, y el IFRA se calcula con sus cifras y sus límites. Lo deduce la sesión de «la app tienen que rigurosamente saber que material esta tratando».
5. **El material general también es una ficha concreta** (Hedione sin fabricante, aceite de lavanda sin proveedor), con sus límites generales por categoría de IFRA, de los archivos de IFRA. Se usa cuando no aplicas un fabricante concreto. Lo propuso la sesión y el usuario lo confirmó (segunda cita). Sus cifras de composición, si son de literatura, nunca dan «dentro» (V3-7).

**Cómo se aplica** (propuesta de la sesión, confirmada con la lectura):

- **Una tabla común, `material_categories`** (id, nombre, otros nombres), y **`materials.category_id`**. Es una tabla más que las del §34 del plan: la categoría de un natural («lavanda») no es un material que se pese, así que no puede ser una fila de `materials`. Sustituye al `standard_id` que proponía el modelo.
- **El segundo nivel sale de campos del material:** la forma de un natural (`materials.form`, de tu referencia) y el fabricante o la tienda de un producto (columnas `fabricante` y `tienda` de `datos/v2/productos.csv`).
- **Tu versión de un común (V3-5) va en la categoría del común.** Un material tuyo puede ir en una categoría común o en ninguna.
- **El script agrupa por regla:** una molécula, por su CAS; un natural, por especie + parte, o por su CAS si no dice la especie (581 de 1183 naturales no la dicen; [`modelo-materiales-v3.md`](modelo-materiales-v3.md) §9.2). Agrupar no mezcla datos, así que tú revisas la lista después, en `datos/v3/categorias.csv`.
- **Fusionar sí mezcla datos:** solo con tu visto bueno, fila a fila, en `datos/v3/conflictos/duplicados.csv` (V3-11).

**Por qué** (del mensaje): «la busqueda es accesible para el usuario pero la app tienen que rigurosamente saber que material esta tratando y los limites del mismo».

**Encaja con** la entrada del laboratorio del 2026-10-12, que pide separar el aceite, la goma y el absoluto de láudano, cada uno con sus constituyentes: tres fichas de una categoría. La entrada se lleva con las demás de la bandeja.

## V3-14 · El núcleo de la ficha y la dosis entran desde el principio (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, 7.7 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Entra el núcleo de la ficha desde el principio?

**Respuesta:** el usuario eligió en la tarjeta la opción «Núcleo y dosis (Recomendado)» (2026-10-13 17:29): «Los campos del núcleo en columnas que admiten vacío, con su fuente; la dosis en material_doses, con su base. Relaciones, descriptores, perfumes de referencia y física, después.»

**Cómo se aplica:**

- **El núcleo de tu referencia (§3), en columnas de `materials` que admiten vacío:** familia, facetas, piso, evolución, tenacidad, potencia, umbral, difusión, efecto en la mezcla, función (estructura, modificador, traza, fijador, puente, booster) y dilución recomendada. El disolvente no es una función: es la marca de V3-12.
- **La dosis, en `material_doses`:** una fila por fuente, con mínima, típica y máxima, **siempre con su base** (del concentrado, del producto terminado o «sin declarar»), su autoridad y su fuente.
- **Después, en otra fase:** relaciones, descriptores por fuente, perfumes de referencia y física.
- **Cambia V3-6** en lo que dejaba fuera al principio (familias, uso y duración).

**Consecuencias** (propuesta de la sesión):

- **Los campos propios de cada tipo** de tu referencia (§3) entran también, vacíos si no se saben: casa, código y qué quiere oler (composición); origen de síntesis e isómeros (molécula); la forma (natural) ya entró con V3-13.
- **La fuente y la confianza, como en tu referencia:** `sources`, con etiquetas cortas, y `confidence` (alta, media, baja), por material. Un campo vacío sale «no lo dice».
- **`material_doses` tiene las columnas de `datos/v2/usos.csv`** (magnitud, mínima, típica, máxima, unidad, base, autoridad, documento), que la v2 diseñó así y dejó vacía.
- **Qué datos llenan el núcleo** lo deciden 7.8 (tus 111 materiales) y 7.11 (tenacidad y familias). Hoy, el glosario de la v1 tiene familia en 3119 de sus 4347 filas, matiz en 2154 y uso mínimo y máximo en 691 (`datos/glosario/materiales.csv`).

**Por qué** (la recomendación de la sesión que elegiste): es lo que pediste registrar, una columna vacía no cuesta nada y la dosis ya tenía diseño. Las otras cuatro tablas se diseñan cuando el glosario funcione.

## V3-15 · Lo del laboratorio entra en tu cuenta, no en lo común (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, 7.8 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Entran en la base común los 111 materiales del laboratorio?

**Respuesta literal** (orko kill, 2026-10-13, escrita en la tarjeta):

> todo lo de laboratorio puede entrar a la app como si yo fuese usuario para probar las funciones de user, es decir todo lo de lab se trata como si yo estuviera consumiendo la app no se comparte para otros usuarios pero existe para mi base

**Lectura** (de la sesión; el usuario la confirmó en la tarjeta con «Sí, así», 2026-10-13 17:34):

1. **Todo lo del laboratorio entra, como tuyo y no como común:** tus materiales privados (`owner_id` = tú). Nadie más lo ve y lo común no cambia. Sirve para probar las funciones de usuario con datos reales.
2. **Cambia P37:** lo del laboratorio entra en la app, en tu cuenta. **P35 sigue valiendo para lo común:** tus valoraciones no pasan a lo común.

**Cómo se aplica** (propuesta de la sesión, confirmada con la lectura):

- **Un material del laboratorio que ya es un común entra como tu versión de ese común** (V3-5, `based_on_id`): hereda su composición y su IFRA, y añade tu núcleo, tus dosis y tus sinónimos. De los 103 con CAS, 89 casan por CAS con la v2 (medido sobre `materiales.sqlite` y `datos/v2/materiales.csv`). **Cuál es el común lo decides tú** en `datos/v3/conflictos/laboratorio.csv`, porque por CAS un natural casa con varias formas.
- **El que no casa entra como material tuyo nuevo.**
- **Tus frascos (`user_materials`, 110 filas) marcan «lo que tengo».**
- **El IFRA de segunda mano entra como texto «sin verificar», sin número, y no calcula** (regla 7 de tu referencia). El IFRA que calcula es el del común, que sale de los archivos de IFRA.
- **Tu cata y tus ejes** (`user_evaluations`, 107 filas) entran cuando exista la capa del usuario, aplazada (plan §46).
- **Los 222 conflictos pendientes** del laboratorio: pregunta 7.10.
- **El script lee el laboratorio y no escribe en él.** Escribe en tu cuenta (tu `owner_id`), no con la clave de lo común.

**Por qué** (del mensaje): para probar las funciones de usuario; «no se comparte para otros usuarios pero existe para mi base».

## Pendientes

- **Las preguntas 7.9 a 7.11** de [`modelo-materiales-v3.md`](modelo-materiales-v3.md) **y B.1 y B.2** del [plan ejecutivo](plan-ejecutivo-v3.md), de una en una, en el chat que arrancó con [`prompt-arranque-v3.md`](prompt-arranque-v3.md).
- Después, la fase 0 del plan ejecutivo.
