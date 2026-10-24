# Decisiones de la v3

*Abierto el 2026-10-07. La autoridad de la v3 es `PLAN_V3.md` (en el repo, `docs-v3/PLAN_V3.md`) con lo que se decide aquí. Cada decisión cita el mensaje del usuario. Lo que propone la sesión va marcado como propuesta.*

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
| H7 · Retirar Tauri primero | ~~Como dice el plan (paso 1).~~ **Cambiado por V3-21:** la v2 de la raíz no se toca, y la v3 nace sin Tauri en `v3/`. **La app 0.2.1 que tienes instalada sigue funcionando** con sus archivos |

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

- ~~**La biblioteca es el espacio global:** todas tus fórmulas.~~ [Cambiado por V3-19 (2026-10-13): la biblioteca enseña los bancos y las carpetas generales de los marcadores.]
- **Un banco de trabajo es una carpeta tuya** que agrupa lo de un proyecto: el perfume final, sus versiones y los acordes que haces para él.
- **Un acorde guardado como corazón** (congelado como material, plan §27) se queda en el banco del perfume.
- **Los matices los añadirás más adelante.** Están apuntados en `docs/a-futuro.md`.

**Cómo se aplica** (propuesta de la sesión):

- **Una tabla `workbenches`** (id, dueño, nombre, notas), solo tuya y sincronizada (V3-9). Es una tabla más que las del §34 del plan, y la pides tú.
- **`formulas.workbench_id`**, ~~que puede ir vacío: una fórmula fuera de un banco sigue en la biblioteca~~ obligatorio (V3-19). Una versión nueva (`parent_id`) nace en el banco de su madre.
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
- **`material_doses` tiene las columnas de `datos/v2/usos.csv`** (magnitud, mínima, típica, máxima, unidad, base, autoridad, documento), que la v2 diseñó así y dejó vacía. [Ajustado por la sesión al escribir el esquema (fase 2, 2026-10-13): sin magnitud ni unidad. En la v2 la tabla guardaba el uso y la duración; en la v3 solo guarda dosis, en fracción, y la duración es la tenacidad (V3-18).]
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

## V3-16 · Varios CAS: el principal y una lista de otros, en el material (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, 7.9 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Cómo se guardan varios CAS de un material?

**Respuesta:** el usuario eligió en la tarjeta la opción «Lista en el material (Recomendado)» (2026-10-13 17:35): «cas, el principal, y other_cas, una lista, como aliases. El buscador y las categorías usan todos.»

**Cómo se aplica:**

- **`materials.cas`**, el principal, el que se enseña, y **`materials.other_cas`**, una lista de texto, sin tabla nueva.
- **El buscador** encuentra el material por cualquiera de ellos, y **la regla de categorías** (V3-13) agrupa por cualquiera.
- **El script** une un natural con su entrada de IFRA por cualquiera de sus CAS. IFRA da dos para 246 de sus 302 naturales (`datos/ifra/51/naturales.csv`, columnas `cas_principal` y `otros_cas`). Los otros CAS de los comunes salen de ahí y de `otros_cas` del glosario de la v1 (38 filas, que se lee y no se toca).

**Por qué** (la recomendación de la sesión que elegiste): es una columna, encaja con cómo da IFRA sus datos y sirve para lo único que se hace con el CAS, buscar y enseñar. IFRA limita por estándar, no por CAS.

## V3-17 · Los datos en disputa no viajan a la app: el dato sale marcado «en disputa» (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, 7.10 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Viajan a la app los datos en disputa?

**Respuesta:** el usuario eligió en la tarjeta la opción «No, solo la marca (Recomendado)» (2026-10-13 17:37): «El material lleva la lista de campos en disputa y la ficha dice «en disputa»; se resuelven en el laboratorio y el script reimporta.»

**Cómo se aplica:**

- **`materials.disputed_fields`**, una lista con los nombres de los campos que tienen un conflicto pendiente, y **una marca `disputed` en cada fila de `material_doses`** que lo tenga.
- **La ficha dice «en disputa»** junto al valor y no lo da por firme.
- **Los conflictos se resuelven en el laboratorio** (los 222 pendientes de tus materiales; referencia §6) o en los CSV del repo (lo común), y el script vuelve a importar.
- **Se llama «en disputa», no «provisional»**, para no confundirlo con el tipo `provisional` (propuesta de la sesión).

**Por qué** (la recomendación de la sesión que elegiste): los conflictos se resuelven donde se investiga, y la app solo necesita no dar por firme lo que no lo es. Pasar a una tabla `conflicts` más adelante es añadirla: la marca se queda.

## V3-18 · Las familias, las nueve de P48; la tenacidad, aplazada (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, 7.11 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md)): ¿Qué se hace con la tenacidad y las familias, las dos escalas abiertas de tu referencia (§5)?

**Respuesta:** el usuario eligió en la tarjeta la opción «Familias P48, tenacidad aplazada (Recomendado)» (2026-10-13 17:40): «En lo común, las 9 familias de P48 como lista cerrada (las 3119 de la v1); la tenacidad, texto con su fuente hasta decidir. Tu texto libre del lab, como texto en tu cuenta.»

**Cómo se aplica:**

- **`materials.family` es una de las nueve de P48**, una lista cerrada: Cítrico, Verde, Ozónico, Floral, Frutal, Especiado, Amaderado, Animal y Transformado (`datos/glosario/LEEME.md`), con el color de `datos/fuente/pieza-11-paleta.csv`. En lo común salen del glosario de la v1, que tiene familia en 3119 de sus 4347 filas.
- **La tenacidad, aplazada:** `materials.tenacity` es texto con su fuente («8 h, según TGSC»), nunca un número con el que ordenar, filtrar o calcular, hasta que se decida de dónde sale y si va en horas o por tramos (decisión abierta 1 de tu referencia).

**Consecuencias** (propuesta de la sesión):

- **Tu texto libre del laboratorio** («floral (jazmín)», 84 valores distintos en 108 materiales, `materiales.sqlite`) va en una columna de texto aparte, `family_detail`, en tu cuenta. La familia cerrada de tu versión la hereda del común.
- **El matiz de la v1** (la segunda familia de P48, en 2154 filas) va a `facets`. Se confirma al importar (fase 4, paso 4.7).

**Por qué** (la recomendación de la sesión que elegiste): en la app el vocabulario de familias ya estaba decidido (P48) y aplicado; la tenacidad es una pregunta de investigación del laboratorio, y como texto con su fuente no engaña.

## V3-19 · Cada fórmula vive en un banco; unos marcadores la sacan a carpetas generales (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, B.1 del [plan ejecutivo](plan-ejecutivo-v3.md)): ¿Una fórmula está en un banco de trabajo o en varios?

**Respuesta literal** (orko kill, 2026-10-13, escrita en la tarjeta):

> no lo tengo claro la idea de los bancos es que haya espacios de trabajo para forrmular un perfume o una idea de manera que todo eso no haga luego ruido en general, yo diria que quizas puede haber una variable extra o un tag para que las formulas sean encontradas entre bancos en casos concretos, por ejemplo si creo un acorde de flores en un banco para una formula este acorde quiero que acabe estando con el resto de acordes accesible para todas las formulas pero no necesariamente quiero que el resto de partes o formulas del workbench actual se compartan entre el resto, si todas las formulas que se crean en la app viven en el mismo sitio es muy caotico, la idea es compartimentalizar, podrian atribuirsele categorias o marcadores de manera que  acaben en una carpeta general: por ejemplo "perfume acabado" como categoria de que algo te salio bien o que es usable y "acorde" como mezcla que se presenta para usarse en otras formulas podrian estar viviendo, aparte de en su workbench en una carpeta que apile todos los archivos guardados con estos marcadores

**Lectura** (de la sesión; el usuario la confirmó en la tarjeta con la opción «Sí, sin «Sueltas»», 2026-10-13 17:53: «Lo mismo, pero toda fórmula tiene que estar en un banco: al crearla se elige o se crea uno.»):

1. **Un banco es un compartimento.** Lo que haces en él (versiones, pruebas, acordes) se queda dentro y no hace ruido fuera. **Una fórmula vive en un solo banco, y toda fórmula está en uno:** al crearla, eliges uno o creas otro.
2. **Unos marcadores sacan una fórmula de su banco sin moverla**: por ejemplo «acorde» y «perfume acabado». La fórmula marcada sigue en su banco y además sale en una carpeta general que reúne todas las que lo llevan («Acordes», «Perfumes acabados»).
3. **Un acorde marcado se usa en las fórmulas de cualquier banco**; uno sin marcar, solo dentro del suyo. Lo deduce la sesión de «accesible para todas las formulas pero no necesariamente [...] el resto de partes».
4. **La biblioteca deja de ser la lista de todo:** enseña los bancos y las carpetas generales. Cambia la lectura de V3-10.

**Cómo se aplica** (propuesta de la sesión, confirmada con la lectura):

- **`formulas.workbench_id`, obligatorio.** Una versión nueva (`parent_id`) nace en el banco de su madre.
- **Los marcadores, en la fórmula.** Si son una lista cerrada o etiquetas libres, y si llevan también el papel dentro del banco (corazón, salida), lo decide B.2.
- **Marcar una fórmula como «acorde» la congela como material** (plan §27), para poder usarla como ingrediente, y ese material sale en el buscador de todos los bancos. Un acorde congelado sin la marca sale solo en el buscador de su banco.
- **Al importar tu biblioteca de la v2**, toda fórmula necesita banco: el script propone uno para cada una (las subcarpetas, si las hay) en `datos/v3/conflictos/bancos.csv`, y lo decides tú.

**Por qué** (del mensaje): «si todas las formulas que se crean en la app viven en el mismo sitio es muy caotico, la idea es compartimentalizar».

## V3-20 · Los marcadores, una lista cerrada; el papel en el banco, una etiqueta libre (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, B.2 del [plan ejecutivo](plan-ejecutivo-v3.md), replanteada tras V3-19): ¿Cómo son los marcadores y el papel de una fórmula dentro de su banco?

**Respuesta:** el usuario eligió en la tarjeta la opción «Lista cerrada + papel libre (Recomendado)» (2026-10-13 18:10): «Marcadores fijos («acorde», «perfume acabado», se añaden más a petición) con su carpeta general; el papel en el banco («corazón», «salida»), etiqueta libre y opcional.»

**Cómo se aplica:**

- **`formulas.markers`**, una lista de valores fijos: `accord` («acorde») y `finished` («perfume acabado»). Cada uno tiene su carpeta general (V3-19). Un marcador nuevo entra cuando lo pidas, con su decisión.
- **`formulas.role`**, texto libre y opcional («corazón», «salida»): solo describe, y la app no hace nada con él.
- **Toca P45** («acorde o perfume al guardar», abierta en `docs/a-futuro.md`): el marcador lo decide. La galería, el icono y el visualizador por fórmula siguen a futuro.

**Por qué** (la recomendación de la sesión que elegiste): lo que hace actuar a la app («acorde» congela y comparte entre bancos) tiene que ser un valor fijo; el papel aún no tiene vocabulario, y una lista se puede sacar después de las etiquetas que uses.

## V3-21 · La v3 vive en su propia carpeta, sin nada que la ate a la v2 (decidida por el usuario el 2026-10-13)

**Respuestas literales** (orko kill, 2026-10-13), mientras la sesión empezaba la fase 1:

> 18:12: «paralelo a la parte de preguntas, puedes empezar a la migracion de la app creo que es importante empezar a desarrollar ya por pasos la app v3 para ver como va funcionando y si es posible de momento solo son planes»

> 18:16: «trabaja de manera que no haya conflicto con v2 y que v3 solo dependa de v2 en informacion y durante los primeros estados pero todo v3 debe poder existir en esa sola carpeta de v3 sin nada que vincule a v2 o la repo general»

> 18:20, sobre la lectura de la sesión: «v3 tiene que funcionar internamente en esa carpeta, y la documentacion y los materiales se van pasando ahi paulatinamente te diria que la parte de documentacion este un una carpeta de un orden diferente a v3 pero  distinta al resto de la app tambien , de todas maneras para toda la documentacion de v3 quiero que pase a la repo final de manera auditada por ejemplo no quierotodos los pdfs con la normativa ifra quiero que a v3 pase solo la informacion tratada del pdf en el apartado del registro vinculada al material a diferencia del funcionamineto actual que todo lo que esta de referencia se pierde entre los documentos de la app»

**Lectura** (de la sesión; el usuario la confirmó en la tarjeta con «Sí, así», 2026-10-13 18:21):

1. **`v3/` es la app, y funciona sola dentro de esa carpeta:** código, pruebas, migraciones, PowerSync y sus datos de referencia.
2. **La documentación de la v3, en una carpeta propia, `docs-v3/`**, al lado de `v3/` y aparte de `docs/` (la de la v1 y la v2). La documentación y los materiales pasan poco a poco.
3. **A la v3 solo pasa información tratada, y auditada:** la cifra, el límite o el dato, en el registro de su material y con su fuente citada (documento, página y frase). Los documentos de origen (los PDF de IFRA, los certificados) no pasan: se quedan donde están, y la cita dice de dónde sale cada dato.
4. **`v3/` y `docs-v3/` son lo que acabará siendo el repo final.** Nada en ellas apunta al resto.
5. **La v2 no se toca.** La app de la raíz, con Tauri, sigue igual. **La v3 depende de la v2 solo en información, y al principio.**

**Cómo se aplica** (propuesta de la sesión, confirmada con la lectura):

- **El motor se copia a `v3/`** una vez, con el commit de donde sale; desde ahí es de la v3, y solo cambia si una prueba lo pide.
- **La importación se parte en dos.** *Migrar:* scripts en `migracion-v3/`, en la raíz y fuera de `v3/`, leen la v2, la v1 y el laboratorio y escriben lo común, tratado y citado, en `v3/datos/`, por tandas. Cada tanda deja un informe (qué entró, de dónde, de qué commit) y no pasa sin tu visto bueno. Lo tuyo (laboratorio, fórmulas) va directo a tu cuenta. *Cargar:* un script dentro de `v3/` lleva `v3/datos/` a Supabase.
- **Lo que compara con la v2** (las equivalencias de la fase 5, el informe de tu biblioteca) vive en `migracion-v3/`, no en `v3/`.
- **Las rutas `datos/v3/…` de V3-13, V3-15 y V3-19** (conflictos, categorías, fusiones, bancos) pasan a `migracion-v3/…`: son de la migración, no de la app.
- **Cambia el paso 1 del plan** (V3-1, H7: «retirar Tauri primero»): no se retira Tauri del repo; la v3 nace sin él.

**Por qué** (del mensaje): «a diferencia del funcionamineto actual que todo lo que esta de referencia se pierde entre los documentos de la app».

## V3-22 · Supabase y PowerSync en local para desarrollar; el proyecto de la nube, enlazado (decidida por el usuario el 2026-10-13)

**Contexto:** el usuario pasó la dirección de su proyecto de Supabase (orko kill, 2026-10-13, durante la pregunta 7.8: «https://qizruaizjyvwbitpreoq.supabase.co este es el link de supa para que la app pueda empezar a montarse ya desde la v3»). Este PC no tiene Docker ni ninguna distribución de WSL (`wsl --list` y `docker --version`, 2026-10-13), y Supabase y PowerSync locales corren en Docker.

**Pregunta** (tarjeta del hilo): ¿Cómo se monta Supabase para desarrollar la v3?

**Respuesta:** el usuario eligió en la tarjeta la opción «Local + nube enlazada (Recomendado)» (2026-10-13 18:28): «Instalas Docker Desktop; Supabase y PowerSync locales para desarrollar, y tu proyecto de la nube recibe solo migraciones probadas. Mientras, adelanto 1.3 y 1.6.»

**Cómo se aplica:**

- **El usuario instala Docker Desktop para Windows**, que trae su propio WSL 2. **Se sigue trabajando en la carpeta de Windows**: no hace falta clonar el repo dentro de WSL. Cambia el paso 0.3.
- **Se desarrolla contra Supabase y PowerSync locales** (pasos 1.2 y 1.4), donde el esquema se borra y se repite sin riesgo.
- **El proyecto `qizruaizjyvwbitpreoq` se enlaza ya** (`supabase link`), y solo recibe migraciones que han pasado en local.
- **Las credenciales las pone el usuario:** el inicio de sesión en Supabase, la contraseña de la base de datos y las claves, en `v3/.env.local`, fuera de Git. Nunca en el chat.

**Por qué** (la recomendación de la sesión que elegiste): el esquema de la fase 2 se va a rehacer muchas veces, y en local se repite sin tocar el proyecto real.

## V3-23 · Cada ficha toma su propia entrada del anexo de IFRA (decidida por el usuario el 2026-10-13)

**De dónde sale:** la entrada del 2026-10-12 de la bandeja del laboratorio (`../Perfumery/app/entradas.md`): en el acorde `CuirESmarron`, el panel de IFRA da un máximo del 6,38 % por la isoforona al 0,2 % que la app atribuye al láudano (`v2:M03493`, «Labdanum gum»), cuando el frasco del usuario es un absoluto y tres documentos de proveedor de absoluto no la recogen. La entrada pide separar aceite, goma y absoluto, dar de alta el absoluto de Maese Lab y revisar de dónde sale la isoforona.

**Lo que se encontró** (la sesión, en los datos):

- **La isoforona al 0,2 % solo está en la entrada «Cistus oil» del anexo** (IFRA 51, `datos/ifra/51/naturales.csv`). La entrada «Cistus absolute» no la tiene (benzaldehído 0,6 %, alcohol cinámico 0,03 %, eugenol 0,06 %, geraniol 0,01 %).
- **El anexo tiene una entrada propia «Labdanum gum»**, solo con benzaldehído al 0,2 %. Su CAS principal es otro, y la regla D14 de la v2 no la encontró: a M03493 le dio el máximo de las 5 entradas con CAS 8016-26-0 (aceites, absoluto, concreto y oleorresina de cistus y láudano; `datos/v2/composicion.csv`, filas 1008 a 1016). De ahí la isoforona.
- **No es un caso suelto:** de los 228 materiales de la v2 con la composición «máximo de N entradas del anexo», 9 tienen entrada propia por nombre y no la usan (entre ellos el absoluto de clavo, el de lavandín grosso, el de azahar y el neroli).

**Pregunta** (tarjeta del hilo): ¿Cómo asigna la migración la composición del anexo de IFRA a cada ficha?

**Respuesta:** el usuario eligió en la tarjeta la opción «Su propia entrada (Recomendado)» (2026-10-13 20:14): «Cada ficha toma la entrada del anexo con su nombre; solo si no la tiene, el máximo de las de su CAS, diciendo de cuáles. Cambian 9 materiales (la goma de láudano pierde la isoforona).»

**Cómo se aplica:**

- **La migración (fase 4, paso 4.3)** da a cada ficha la entrada del anexo con su nombre. Solo si no la tiene, el máximo de las entradas que comparten su CAS, como la v2, y su fuente dice de qué entradas sale.
- **En la equivalencia (fase 5)** estos 9 materiales salen distintos de la v2 a propósito; la lista y el porqué, con esta decisión.
- **El resto de la entrada ya está decidido:** el aceite, la goma y el absoluto son fichas distintas de una categoría (V3-13); el absoluto de Maese Lab entra en tu cuenta como tu versión del absoluto común, y cuál es lo decides en `laboratorio.csv` (V3-15). Los tres documentos de proveedor que cita la entrada pasan, si se quiere, como fichas de producto con su cita (V3-2, V3-21).

**Quedaba abierta** (decidida en V3-28: como literatura) (propuesta de la sesión, para preguntarla aparte): los 219 materiales sin entrada propia llevan autoridad «anexo-ifra» con cifras de otras formas, y así pueden dar «dentro». Se parecen más a un supuesto (V3-7).

**Por qué** (la recomendación de la sesión que elegiste): es lo que pide V3-13, cada ficha con su composición; el máximo le pone a una goma y a un absoluto la isoforona de un aceite.

## V3-24 · El buscador encuentra también por la especie y por el INCI (decidida por el usuario el 2026-10-13)

**De dónde sale:** la entrada del 2026-10-11 de la bandeja del laboratorio: el cedro chino de Maese Lab (INCI *Cupressus Funebris Wood Oil*, CAS 85085-29-6) no aparecía en la app, y el usuario lo usa como provisional en las fórmulas del perfume para su padre. Pide darlo de alta, mirar si alguna de las claves «chinese» es ya este material y no confundirlo con el cade.

**Lo que se encontró** (la sesión, en los datos):

- **Ya está en la v2:** M01127, «Cedarwood oil, Chinese» (*Cupressus funebris* Endl., aceite esencial), con el CAS 1159574-01-2. El anexo de IFRA lo da con 1159574-01-2 de principal y **85085-29-6 como otro CAS** (`datos/ifra/51/naturales.csv`), y con sus constituyentes (alfa-bisabolol 0,6 %, alfa-cedreno 19,1 %, beta-cedreno 6 %). Tiene tres formas más: rectificado (M01128), terpenos (M01137) y CO2 (M04044). M01260, «Fir needle oil, Chinese», es otra planta.
- **No se encontraba** porque la v2 guarda un solo CAS por material y el buscador no mira ni la especie ni el INCI.

**Pregunta** (tarjeta del hilo): ¿Encuentra también el buscador un material por su especie y por su INCI?

**Respuesta:** el usuario eligió en la tarjeta la opción «Sí, por los dos (Recomendado)» (2026-10-13 20:18): «Además de nombre, otros nombres y CAS: la especie («funebris») y el INCI de la etiqueta («Cupressus Funebris Wood Oil»). Son columnas que ya tiene el material.»

**Cómo se aplica:**

- **El buscador mira** el nombre, los otros nombres (V3-6), todos los CAS (V3-16), la especie y el INCI. Sin columnas nuevas.
- **El resto de la entrada ya está decidido:** el otro CAS entra desde el anexo (V3-16); las cuatro formas, en una categoría (V3-13); tu frasco, en tu cuenta como tu versión del aceite común (V3-15). Mientras tanto, en la v2 sigues con tu provisional.

**Por qué** (la recomendación de la sesión que elegiste): con ella, «funebris» o el INCI de la etiqueta habrían encontrado el cedro chino.

## V3-25 · El estado de IFRA de una ficha es el suyo, con su condición, no el de la peor variante (decidida por el usuario el 2026-10-13)

**De dónde sale:** la entrada del 2026-10-11 de la bandeja del laboratorio: el buscador enseña el cade de Maese Lab («Aceite de cade (enebro)», `v2:P00054`) como **prohibido**, aunque el producto lleva el proceso «rectificado» y la condición del estándar 119. El 119 prohíbe solo el crudo y permite el rectificado con HAP ≤ 1 ppb en el producto terminado. Pide que el buscador y el panel usen la condición del producto y que enseñen la especificación de HAP como aviso.

**Lo que se encontró** (la sesión, en el código y los datos de la v2):

- **La etiqueta del buscador** (`cardOf` en `src/v2/to-ifra.ts`) dice «prohibido» en cuanto un estándar del material prohíbe algo sin tope, sin mirar si es solo una variante ni la condición del material. **El cálculo sí lo distingue:** para el 119 pide acreditar el rectificado.
- **La condición «rectificado» del cade** (M00054, `datos/v2/condiciones.csv`) tiene autoridad **consenso**: el usuario la dedujo de la página de la tienda. Por `CLAUDE.md` («El nombre que pone la tienda no es evidencia») y por §4.4 del modelo, cuenta como **supuesta**.

**Pregunta** (tarjeta del hilo): Si un estándar prohíbe una variante y permite otra con especificación, ¿qué estado de IFRA enseñan la ficha y el buscador?

**Respuesta:** el usuario eligió en la tarjeta la opción «El de la ficha (Recomendado)» (2026-10-13 20:23): «Prohibido» solo para la variante prohibida; el rectificado, «cumplido», «supuesto» o «sin acreditar» según su autoridad, con la especificación de HAP como aviso. La categoría no lleva estado propio.»

**Cómo se aplica:**

- **El estado que enseñan la ficha y el buscador sale de las regulaciones de esa ficha y de su condición**, igual que el cálculo. «Prohibido» solo cuando la ficha es la variante prohibida o la prohibición no tiene condiciones.
- **Un requisito sale según su autoridad** (§4.4 del modelo): «cumplido» es *acreditado* (lote o certificado con su fuente); «supuesto», literatura o consenso; «sin acreditar», *pendiente* (solo el anexo de IFRA).
- **La especificación** (en el 119, los HAP) sale como aviso en la ficha y en el panel.
- **La fila de una categoría no lleva estado propio** (V3-13): lo lleva cada ficha.
- **El cade del usuario saldrá «especificación supuesta»**, no «cumplida», hasta que haya un documento del fabricante que acredite el rectificado (el vacío 46 del laboratorio).

**Por qué** (la recomendación de la sesión que elegiste): es lo que ya hace el cálculo; con V3-13 cada ficha tiene sus límites, y su etiqueta tiene que ser la suya.

## V3-26 · La app enseña con qué commit se cargaron sus datos comunes (decidida por el usuario el 2026-10-13)

**De dónde sale:** la entrada del 2026-10-04 de la bandeja del laboratorio: la v2 dice «Glosario generado el *fecha*», varios commits comparten fecha, y la habilidad `mezclas` del laboratorio, que repite la cuenta de IFRA con los datos de la app, no puede saber con qué datos se compiló la app que está abierta. Pide enseñar también el commit.

**Pregunta** (tarjeta del hilo): ¿Enseña la app con qué commit se cargaron sus datos comunes?

**Respuesta:** el usuario eligió en la tarjeta la opción «Sí, con una fila (Recomendado)» (2026-10-13 20:25): «El script de carga escribe en una tabla común de una fila el commit de v3/datos, la fecha y la tanda; el inicio y la ficha enseñan «Datos: abc1234 · fecha».»

**Cómo se aplica:**

- **Una tabla común de una fila, `data_version`** (commit de `v3/datos/`, fecha y tanda de la migración), que escribe el script de carga y se sincroniza como lo demás (V3-9).
- **El inicio y la ficha enseñan «Datos: `abc1234` · fecha».** Como cada tanda de la migración apunta de qué commit de la v2, la v1 o el laboratorio sale (V3-21), se puede seguir hasta el origen.

**Por qué** (la recomendación de la sesión que elegiste): con la sincronización, lo que hay que saber es con qué datos está tu copia, y la fecha sola no lo dice.

## La bandeja del laboratorio, llevada el 2026-10-13

*Las entradas pendientes de `../Perfumery/app/entradas.md`, y adónde fue cada una. Marcadas allí como llevadas por la sesión, porque el usuario lo pidió («márcalas tú y sigue con la fase 2», 2026-10-13), en el commit `fff8254` del laboratorio.*

| Entrada | Adónde |
|---|---|
| 2026-10-13 · Referencia de materiales para el PLAN_V3 | V3-11 a V3-18 |
| 2026-10-12 · El absoluto de láudano hereda constituyentes de aceite esencial | **V3-23**; el resto, por V3-13 y V3-15 |
| 2026-10-11 · Falta el cedro chino | **V3-24**: ya estaba en la v2 (M01127) con otro CAS; el resto, por V3-13, V3-15 y V3-16 |
| 2026-10-11 · El cade rectificado sale como «prohibido» | **V3-25** |
| 2026-10-07 · Aldambre cruzado con un CAS que no es el suyo | **Sin decisión nueva** (abajo) |
| 2026-10-04 · Que la app enseñe el commit de sus datos | **V3-26** |

**El Aldambre** (lo encontró la sesión): en los datos de la app, 947-05-7 es la oxaciclotridecan-2-ona (M00083 en la v2, `tl:947-05-7` en la v1), y bien; en la app no hay ningún «Aldambre». El cruce equivocado está en `diluciones.py` del laboratorio, que se corrige allí. La biblioteca del laboratorio ya lo tiene con 1725-03-7 (Synarome, molécula), con dos dosis de la web y un conflicto de identidad pendiente (TGSC marca 1725-03-7 «not for fragrance use»; la web avisa de que el ámbar gris de Synarome es otro producto, Ambrarome). Ninguno de los dos CAS tiene estándar de IFRA. En la v3 entra en tu cuenta como material tuyo nuevo, porque 1725-03-7 no está en lo común (V3-15), con sus dosis (V3-14) y la identidad «en disputa» (V3-17).

## V3-27 · Un límite expresado como un constituyente va como componente; tres niveles de precisión (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, fase 4): ¿Cómo se escribe un límite expresado como un constituyente (el 089: 0,0015 % de 5-MOP en el producto terminado, `datos/ifra/51/estandares.csv`)?

**Lo que hay** (medido en la v2): el 089 tiene un solo miembro, M00042, «Bergamot oil, furocoumarin free» (del cuaderno), y ninguna fila de composición declara su 5-MOP. Los estándares propios de los aceites fototóxicos (086 a 096) tienen 51 miembros, sumados como grupo combinado. La v2 no tiene el 5-MOP como sustancia.

**Respuesta literal** (orko kill, 2026-10-13, escrita en la tarjeta):

> de entrada como componente, luego se buscara un estandar para los principales componentes para que haya una base para todos que no requiera manualmente ajustarlos todos y el ultimo nivel de precision es cuando se da de alta los datos de ifra de algun material en concreto mediante la declaracion, donde entonces si se usa la version del material dada de alta el numero es certero

**Lectura** (de la sesión): tres niveles de precisión, de menos a más:

1. **De entrada, como componente:** el límite del 089 va en un material común «5-MOP», y cada miembro del 089 lo lleva como componente de cantidad desconocida, con la fuente «IFRA STD 089», hasta que un documento dé la cifra. El motor no lo da por «dentro» mientras tanto.
2. **Después, un valor de referencia para los componentes principales:** una base para todos los materiales que no obligue a ajustarlos uno a uno. Queda en `docs/a-futuro.md`.
3. **El más preciso, la declaración de IFRA de un material concreto:** dada de alta en su versión (V3-5, con autoridad de producto o lote), su cifra es la cierta y manda sobre las de los niveles anteriores.

**Cómo se aplica** (propuesta de la sesión):

- **La migración (paso 4.5)** crea el material común «5-MOP» (molécula, el nombre que da IFRA en el 089; sin CAS, porque los archivos de IFRA no lo dan para el 089) con su regulación del 089, y escribe el componente de cantidad desconocida en M00042. Sin columnas nuevas.
- **Lo que pierde:** si un aceite con estándar fototóxico propio (087, 092…) declara un día su 5-MOP, contará por las dos vías, más estricto de lo que pide IFRA y nunca menos. En los datos de la v2 no pasa con ninguno.

**Por qué** (la recomendación de la sesión que elegiste, con tu precisión de los niveles): no toca el esquema y hoy afecta a un material.

## V3-28 · Las cifras del anexo prestadas de otras formas entran como literatura (decidida por el usuario el 2026-10-13)

**Pregunta** (tarjeta del hilo, fase 4; la dejó abierta V3-23): las cifras del anexo que 219 materiales sin entrada propia toman de otras formas con su mismo CAS (regla D14 de la v2; medido sobre `datos/v2/composicion.csv`), ¿con qué autoridad entran?

**Respuesta:** el usuario eligió en la tarjeta la opción «Como literatura (Recomendado)» (2026-10-13 21:34): «Fuente «IFRA 51, anexo: entradas prestadas por CAS (…)»; como mucho «acotado», nunca «dentro» (V3-7). El techo sigue siendo su máximo.»

**Cómo se aplica:**

- **La migración (paso 4.3)** escribe esas filas con autoridad `literature` y la fuente «IFRA 51, anexo: entradas prestadas por CAS (…)», con las entradas de las que salen. Las de un material con entrada propia (V3-23) siguen con autoridad `ifra`.
- **Por V3-7**, dan como mucho «acotado»: para IFRA se cuenta su máximo, en el peor caso.
- **La declaración de IFRA de uno de esos materiales**, dada de alta en su versión, manda sobre ellas (V3-27, nivel 3).
- **En la equivalencia (fase 5)** estos 219 materiales salen distintos de la v2 a propósito.

**Por qué** (la recomendación de la sesión que elegiste): son cifras de otro material, no de este; con autoridad de IFRA darían un verde que nada prueba.

## V3-29 · Los aislados naturales sin documentos llevan «Sin identificar» (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, tanda 2 de la migración): los 4 aislados naturales cuyo producto no tiene documentos (geraniol, cumarina, eugenol y eucaliptol, del cuaderno; medido en `datos/v2/`), ¿llevan «Sin identificar» o son puros? En la v2 quedan pendientes por D7; en la v3, una molécula sin componentes es ella misma (§3.4).

**Respuesta:** el usuario eligió en la tarjeta la opción «Sin identificar (Recomendado)» (2026-10-13, poco antes de medianoche): «Componente de cantidad desconocida, fuente «aislado natural sin documentos de su producto (D7 de la v2)»: siguen pendientes, como en la v2, hasta que haya un documento.»

**Cómo se aplica:**

- **La migración (tanda 2)** les escribe el componente común «Sin identificar», de cantidad desconocida, con esa fuente. Siguen pendientes hasta que un documento de su producto diga lo que llevan; entonces manda su cifra (V3-27, nivel 3).
- **El mismo componente cierra las listas que no están completas** (§3.5): en la v2, los 5 contenedores con composición que ninguna fuente cubre entera (certificados parciales y listas solo de alérgenos). Los 12 certificados que no declaran ninguna sustancia regulada son de productos de moléculas, y una molécula sin componentes ya es pura.

**Por qué** (la recomendación de la sesión que elegiste): un aislado de una planta puede traer otros constituyentes regulados de ella, y lo desconocido nunca vale cero.

## V3-30 · Una molécula prohibida «como tal» lleva la prohibición y el techo (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, tanda 3 de la migración): cinco estándares de IFRA 51 (158, 179, 110, 112 y 154) prohíben la sustancia como ingrediente y le ponen techo cuando llega dentro de un natural. Su nota de prohibición dice que la sustancia «as such should not be used as fragrance ingredient» (`datos/ifra/51/estandares.csv`). En la v2 son 9 materiales: la 7-metoxicumarina, el safrol, el isosafrol, el dihidrosafrol, las tres asaronas, el cianuro de bencilo y la isoforona (`datos/v2/grupo-miembros.csv`). Esas moléculas salen en 165 filas de composición de naturales (`v3/datos/material_components.csv`, tanda 2). ¿Cómo entran?

**Respuesta:** el usuario eligió en la tarjeta la opción «Prohibida + techo (Recomendado)» (2026-10-14): «La molécula, y sus productos, lleva la prohibición y además el techo. Usada sola, da «prohibido». Cuando llega dentro de un natural, cuenta contra su techo. Cuesta un cambio pequeño en el adaptador (`v3/src/db/to-ifra.ts`, no en el motor), con su prueba: una prohibición con techo en el mismo estándar no deja «pendiente» al natural que la trae.»

**Cómo se aplica:**

- **La migración (tanda 3)** escribe a esas moléculas y a sus productos una fila `prohibited` para todas las categorías, además de sus techos. Reconoce el caso por la frase de IFRA en la nota de prohibición, no por una lista hecha a mano.
- **El adaptador:**
  - la molécula usada sola da «prohibido»;
  - dentro de un natural, cuenta contra el techo de su estándar, sin dejarlo pendiente;
  - dentro de cualquier otra cosa (una composición o una fórmula congelada que la lleva directamente), sigue pendiente, como antes (propuesta de la sesión: no hay techo para el uso «como tal», y lo desconocido nunca se pinta en verde).
- **La ficha** dice «prohibido» (V3-25).

**Por qué** (la recomendación de la sesión que elegiste): con solo el techo, la isoforona usada directamente daría «dentro» por debajo del 0,0013 % (STD 154, `limite_nota`), y eso contradice el texto de IFRA. Con solo la prohibición, las 165 filas de naturales quedarían pendientes y sin techo.

## V3-31 · Cuando IFRA prohíbe una variante, cada miembro entra por su especie y su proceso (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, tanda 3 de la migración): cuatro estándares de IFRA 51 prohíben una variante y ponen techo a otra (`datos/ifra/51/estandares.csv`, `nota_prohibicion` y `nota_restriccion`):

- el 097 prohíbe *Tagetes erecta*, y el techo es para *T. patula* y *T. minuta*;
- el 071 prohíbe el bálsamo del Perú crudo, y el techo es para sus extractos y destilados;
- el 078 prohíbe las gomas crudas de estoraque, y solo valen sus extractos y destilados;
- el 083 prohíbe el aceite de verbena, y solo vale el absoluto.

La tanda les ponía el techo a todos sus miembros. ¿Cómo entra cada uno?

**Respuesta:** el usuario eligió en la tarjeta la opción «Por especie y proceso (Recomendado)» (2026-10-14): «La variante prohibida lleva «prohibido» (las 4 de T. erecta). La permitida, su techo (27). Si los datos no dicen cuál es (7), lleva techo y además un requisito pendiente, «no es la variante prohibida», con la frase de IFRA, como el cade (V3-25): nunca «dentro» hasta que un documento lo acredite. La regla de cada estándar va escrita en el script, citando a IFRA, y la ves en el informe.»

**Cómo se aplica:**

- **La migración (tanda 3)** clasifica cada miembro por la especie y el proceso que tiene en la v2 (`datos/v2/materiales.csv`), con una regla por estándar:
  - 097, por la especie: *erecta* es la variante prohibida; *minuta* y *patula*, la permitida.
  - 071 y 078, por el proceso: con proceso (un extracto, un destilado, un absoluto, un aceite, un resinoide), la permitida.
  - 083: el absoluto es la permitida y el aceite, la prohibida.
  - En los cuatro, sin especie o proceso en los datos: no se sabe.
- **La variante prohibida** lleva una fila `prohibited` para todas las categorías, sin techo ni especificación.
- **La permitida** lleva su techo y, si la hay, la especificación del estándar.
- **Lo que no se sabe** lleva además un requisito: «No es la variante prohibida», seguido de la frase de IFRA. Queda pendiente hasta que un documento de su producto lo acredite (V3-25).
- **El informe de la tanda** pone la regla de cada estándar y cada miembro con su clase.

**Por qué** (la recomendación de la sesión que elegiste): con solo techos, *T. erecta* daba «requisito pendiente» en vez de «prohibido», y «Balsam, Peru», sin proceso en los datos, podía dar «dentro» siendo quizá el crudo. Lo desconocido nunca se pinta en verde.

## V3-32 · El IFRA de segunda mano del laboratorio, en un campo de texto (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, tanda 5 de la migración): ¿dónde se guarda el IFRA de segunda mano de tus materiales del laboratorio? V3-15 dice que entra como texto «sin verificar» que no calcula, y la regla 7 de tu referencia, que va sin número. Son 107 entradas en `ifra_entries` de `materiales.sqlite`, y el esquema no tenía dónde ponerlas.

**Respuesta:** el usuario eligió en la tarjeta la opción «Un campo de texto (Recomendado)» (2026-10-14): «Una columna nueva en el material, `ifra_unverified`, solo con texto: el tipo, el estándar y la condición, sin la cifra («Restricción, STD 068 · sin verificar»). La ficha lo enseña aparte del IFRA que calcula. Cuesta una migración pequeña, que llega a la copia del navegador y a los tipos, con su prueba.»

**Cómo se aplica:**

- **`materials.ifra_unverified`**, texto que admite vacío. Lo llena la tanda 5 en tus materiales. Lo común no lo lleva: su IFRA sale de los archivos de IFRA.
- **No calcula:** el adaptador (`src/db/to-ifra.ts`) no lo lee, y nunca lleva la cifra.
- **La ficha lo enseña aparte**, como «IFRA sin verificar» (fase 6).

**Por qué** (la recomendación de la sesión que elegiste): guarda el aviso del laboratorio sin mezclarlo con las fuentes ni con el IFRA comprobado.

## V3-33 · La composición del laboratorio queda aplazada (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, tanda 5 de la migración): ¿entra en la tanda 5 la composición de tus materiales del laboratorio? Son 239 filas de 31 materiales, de la web (162) y de TGSC (77), en `material_components` de `materiales.sqlite`. Una fila necesita que su componente sea un material. Solo 74 enlazan con uno: 18 con otro material del laboratorio y 56 por nombre con uno común. Las otras 165 son un nombre sin material.

**Respuesta:** el usuario eligió en la tarjeta la opción «Aplazada (Recomendado)» (2026-10-14): «No entra ahora. Tus versiones heredan la composición del común (anexo de IFRA y documentos). Los 10 materiales nuevos quedan «sin datos»: pendientes, nunca verdes. Lo apunto en a-futuro.md: entra cuando el laboratorio enlace cada componente con su molécula (regla 4 de tu referencia).»

**Cómo se aplica:**

- **La tanda 5 no lleva composición.** Tus versiones heredan la del común (V3-5). Tus materiales nuevos no llevan ninguna: un natural o una composición sin componentes queda «sin datos», y una molécula sin componentes es ella misma (§3.4).
- **En `docs/a-futuro.md`**, con lo que no hay que cerrar: que tus versiones puedan llevar sus propias filas sin tapar las del común, y que una lista a medias se cierre con «Sin identificar».

**Por qué** (la recomendación de la sesión que elegiste): una lista a medias no puede pasar por completa, y cerrarla con «Sin identificar» dejaría pendientes tus versiones aunque el común tenga una composición buena.

## V3-34 · La v3 empieza con materiales de la v3, completos: lo general es común y lo tuyo, tu versión (decidida por el usuario el 2026-10-14)

**De dónde sale:** al ver la app de la v3 con las tandas 1 a 4 cargadas (4344 materiales comunes de la v2).

**Mensaje literal** (orko kill, 2026-10-14):

> creo que hay un problema aqui, si se estan pasando todos los materiales igual que siempre no se esta usando sqlite ni el nuevo registro de los materiales, creo que esto es un error, la idea es que lo que haya en la nueva version ya sea con el material intencionado o dicho deotra manera no sirve de nada migrar materiales sueltos en un glosario como la app v2 a la v3 si hemos cambiado todo el funcionamiento de los materiales, estos materiales no estan linkeados a su tabla con todos sus atributos en su posicion de sqlite ni tienen todo el glosario que se amplio de descripcion de los materiales
> la idea es lo contrario que se usaran ya materiales todos definitivos con los parametros no personales de los mismos como descripcion general, y luego ir ampliando
> por ejemplo en la investigacion de materiales que se hizo:
> C:\Users\SERGI\Claude\Projects\Perfumery\fuentes\investigaciones\2026-10-11-voces-materiales\prompt-chat-laboratorio.md
> todos esos materiales tienen gran parte del glosario de la informacion de la manera en la que viviran en la tabla final del proyecto, es mejor tener unos materiales bien (se empieza arbitrariamente con los que yo tengo que son los que testeare en el laboratorio, la informacion general, la no personal se da de alta como fuente global absoluta de materiales y las partes que se refieren a mi version del material si se ponen en la parte que respecta a la "ampliacion" del material de usuario y finalmente tendria una app v3 con los materiales de categoria v3 no sirven materiales de categoria y tipaje de v2 en la v3, ensucian la app)

**Lectura** (de la sesión, en la tarjeta del hilo):

1. **La v3 empieza solo con materiales «de la v3»**, completos y con el registro de tu referencia (`esquema.sql` del laboratorio): núcleo, descriptores por fuente, relaciones, datos físicos, perfumes de referencia, dosis, fuentes y confianza. Nada del glosario de la v2 tal cual.
2. **Se empieza por los tuyos**, los del laboratorio, que son los que vas a probar en el banco.
3. **De cada uno, lo general entra en lo común** como fuente global. **Lo tuyo** (tu frasco, tu tienda, tu grado, tu cata, tus ejes) entra en tu cuenta como tu versión (V3-5), que la amplía.
4. **Después se amplía lo común** con más materiales, siempre con el registro completo.

**Confirmación y lo que añade** (orko kill, 2026-10-14, en la tarjeta):

> si  es asi creo que hay cosas que no estan en la tabla que falta añadir, que en la categorizacion inicial de los materiales si estaba los materiales tienene que tener en una de las casillas a parte, adicionalmente de la informacion ya buscada lo siguiente: abreviatura del material, siguiendo criterios de v2 pero que seran revisados a futuro y color de visualizacion de la app (dentro de las familias asignadas en la v2 ) desde la v1 el criterio de color en la visualizacion se rompio pero la idea es que en la 3 vuelva a estar disponible, el color y la abreviatura seran categorias futuramente ajustables por el usuario para sus materiales igual que el nombre (para facilitar el entendimiento seran editables desde la opcion de customizacion de materiales de la app)

**Lectura de lo que añade** (propuesta de la sesión, para confirmar en las decisiones que siguen):

- **Cada material lleva, en campos aparte, una abreviatura y un color de visualización**, además de lo investigado.
- **La abreviatura sigue el criterio de la v2**, que se revisará más adelante.
- **El color va dentro de la familia que tiene asignada** (las familias de la v2, P48, con su paleta). Se rompió desde la v1 y en la v3 vuelve.
- **El nombre, el color y la abreviatura los podrás ajustar en tus materiales** desde la personalización de materiales de la app. Es más adelante: hoy no hay que cerrar esa puerta.

**Lo que cambia:**

- **V3-15:** lo general del laboratorio pasa a lo común; lo tuyo sigue en tu cuenta.
- **V3-14:** los descriptores, las relaciones, los datos físicos y los perfumes de referencia entran ya, no después.
- **V3-2 y el plan de la fase 4** (pasos 4.2 a 4.8): los materiales y los productos de la v2 no entran como comunes. **Las tandas 1 a 4**, aprobadas y cargadas, salen de lo común. La lógica de IFRA de la tanda 3 (V3-30, V3-31) sigue sirviendo para los materiales nuevos.
- **V3-13:** las categorías se rehacen sobre los materiales nuevos.
- **La tanda 5** (sin aprobar) no se carga tal cual: se rehace con esta división.

**Lo que abre, de una en una:** dónde viven las sustancias reguladas que el cálculo de IFRA necesita; de dónde sale la composición general de tus materiales (V3-33); si entran las voces; qué es general y qué es tuyo, campo a campo; de dónde salen la abreviatura y el color, y qué tablas nuevas lleva el esquema.

## V3-35 · IFRA es una capa aparte y privada: el material dice qué es y qué lleva, y la app lo lee contra IFRA (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, la primera que abre V3-34): ¿dónde viven las sustancias reguladas que el cálculo de IFRA necesita y que todavía no son materiales completos de la v3? IFRA 51 tiene 263 estándares que regulan 455 CAS (`datos/ifra/51/estandar-cas.csv`), y su anexo de naturales, 1031 filas (`naturales.csv`). La recomendación de la sesión era una capa de IFRA oculta, en la misma tabla de los materiales.

**Respuesta literal** (orko kill, 2026-10-14, escrita en la tarjeta):

> si la idea es que ifra sea oculta no solo por eso sino porque si se acaba valorando que la parte de ifra sea un add on o una parte de pago de la app la idea es que el usuario no tenga un acceso sencillo de descargar los datos del glosario y hacerse con ellos o algo asi, que no vivan juntos dentro de toda la info de material, tambien sera util porque las variables de ifra para materiales de usuario pueden entrar en conflictos por lo tanto tiene que haber una separacion donde el material dice algo que la app lee como ifra y entonces computa el porcentaje exacto pero que no este viviendo en el mismo cuadro del propio material de la app de manera que esta informacion sea mas privada de alguna manera...

**Lectura** (de la sesión; el usuario la confirmó en la tarjeta con «Sí, así», 2026-10-14):

1. **IFRA es una capa separada, no parte de la ficha.** Los estándares, los límites, las sustancias reguladas y lo que IFRA dice que trae cada natural viven en sus propias tablas, sacadas solo de los archivos de IFRA.
2. **El material solo dice qué es y qué lleva:** su CAS, su identidad y su composición. La app lo lee contra la capa de IFRA y calcula el porcentaje exacto. La ficha no guarda límites.
3. **La capa es privada.** No sale en el glosario ni en el buscador, y no se descarga junto a los datos de los materiales.
4. **Por qué:** IFRA puede acabar siendo un complemento de pago; y tus datos de un material (el certificado de tu fabricante, tu versión) pueden chocar con los de IFRA, y la separación deja que la app los resuelva sin mezclarlos.
5. **El límite que no se cierra hoy:** la app funciona sin conexión (V3-8), y para calcular sin red los datos de IFRA tienen que estar en el equipo. En su propio canal se pueden dar solo a quien tenga el complemento. Protegerlos del todo exigiría calcular en el servidor, con conexión. Eso se decide más adelante.

**Cómo se aplica** (propuesta de la sesión, que se concreta en el esquema):

- **Los límites salen del material.** Hoy cuelgan de él (`regulations.material_id`) y bajan con lo común. Pasan a la capa de IFRA, enlazados por CAS y por estándar, con la lógica de V3-27, V3-30 y V3-31 dentro de la capa.
- **Lo que trae cada natural según IFRA** (el anexo) también es de la capa. La composición de la ficha (documentos, certificados) es del material.
- **Los límites del fabricante y de tu versión** (topes de un producto, tu certificado) son datos del material, no de IFRA. La app los suma con los de IFRA y manda el más estricto (§6.3 del modelo).
- **La capa baja por su propio canal** de sincronización, aparte de lo común, para poder darla solo a quien tenga el complemento.

**Por qué** (del mensaje): «que no vivan juntos dentro de toda la info de material» y «que esta informacion sea mas privada de alguna manera».

## V3-36 · Lo común y lo tuyo, como en tu biblioteca, y todo desde ya (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, abierta por V3-34): ¿qué va a lo común y qué a tu versión? La biblioteca del laboratorio ya separa una capa estándar (global, `owner_id` vacío, donde están tus 111 materiales) de una capa de usuario (las tablas `user_*`) (`../Perfumery/biblioteca/esquema.sql`).

**Respuesta:** el usuario eligió en la tarjeta la opción «La de tu biblioteca, toda ya (Recomendado)» (2026-10-14): «Lo estándar de esquema.sql va a lo común y las tablas user_* a tu versión, todo desde ahora: también tu cata, tus ejes y tus diluciones. Cuesta las tablas nuevas en el esquema de la v3 (descriptores, relaciones, referencias, física, cata, ejes y diluciones), cada una con su prueba.»

**Cómo se aplica:**

- **A lo común:**
  - el material: su identidad, su núcleo y los campos de su tipo;
  - los sinónimos (1049) y los datos físicos (108);
  - los descriptores por fuente (1173) y las relaciones (1156);
  - los perfumes de referencia (91) y las dosis por fuente (483);
  - los conflictos pendientes, como «en disputa» (V3-17).

  Las cifras, de `materiales.sqlite`.
- **A tu versión:** tu frasco (`user_materials`: tienda, producto, grado, casa declarada), tus diluciones preparadas (`user_bottles`), tu cata (`user_evaluations`), tus ejes (`user_material_axes`) y «lo que tengo».
- **Cambia V3-14** (los descriptores, las relaciones, la física y las referencias ya no esperan) **y el plan §46** (la capa del usuario entra con tus datos).
- **Aparte:** la composición del laboratorio (V3-33) y el IFRA de segunda mano. Este último no entra en la capa de IFRA, que sale solo de los archivos de IFRA (V3-35).
- **La correspondencia de cada material tuyo con la v2** (`migracion-v3/respuestas/laboratorio.csv`) se sigue usando. De ella salen la familia cerrada (P48), la abreviatura, el CAS que enlaza con IFRA y la composición de los documentos.

**Por qué** (la recomendación de la sesión que elegiste): es la división que el laboratorio ya probó con tus 111 materiales, y V3-34 pide que lo general sea la fuente global y lo tuyo, tu ampliación.

## V3-37 · La abreviatura de cada material es la tuya del glosario (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo; la abre V3-34, «abreviatura del material, siguiendo criterios de v2»): ¿de dónde sale la abreviatura de cada material de la v3? La v1 la tiene en `codigo` (`datos/glosario/materiales.csv`), única en todo el glosario: tuya en las 3119 filas del FIG y generada con tu estilo, como provisional, en 1206. El icono enseñaba la sigla comercial si la hay y, si no, la abreviatura (P39).

**Respuesta:** el usuario eligió en la tarjeta la opción «Tu abreviatura del glosario (Recomendado)» (2026-10-14): «La de la v1 (`codigo`) de su pareja en la v2: «LnO» para el aceite de lavanda. Se apunta si es tuya o generada (provisional). Si un material nuevo no tiene pareja, se genera con el mismo estilo y queda provisional. La sigla comercial (IBQ, HCA) va a otros nombres, y el icono la sigue prefiriendo (P39), algo que se ve en la fase 6.»

**Cómo se aplica:**

- **`materials.abbreviation`**, con su origen: la tuya del glosario, o generada (provisional).
- **Sale de la pareja de cada material en la v2** (`migracion-v3/respuestas/laboratorio.csv` y `datos/v2/v1-a-v2.csv`).
- **Un material sin pareja** lleva una generada con el mismo estilo, única y provisional.
- **La sigla comercial** va a los otros nombres. **El icono** prefiere la sigla comercial (P39) y termina con la letra del tipo de natural (P40); eso se ve en la fase 6.
- **Más adelante podrás cambiarla en tus materiales** (V3-34). El criterio se revisará.

**Por qué** (la recomendación de la sesión que elegiste): es tu abreviatura, la que ya usabas, y no se pierde cuando hay sigla comercial.

## V3-38 · El color de un material es el de su familia, y se puede fijar (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo; la abre V3-34, «color de visualizacion de la app (dentro de las familias asignadas en la v2)»): ¿cómo se guarda el color de visualización de cada material? La paleta de P48 da a cada familia un color claro y uno oscuro, uno por tema (`datos/fuente/pieza-11-paleta.csv`).

**Respuesta:** el usuario eligió en la tarjeta la opción «El de su familia, ajustable (Recomendado)» (2026-10-14): «Cada material común lleva su familia cerrada (P48), la de su pareja en la v1, y su color sale de la paleta de esa familia, en claro u oscuro según el tema. Hay un campo `color` aparte que solo se llena cuando alguien lo fija, como tú al personalizar tus materiales. Si un día cambia la paleta, cambian todos los que no fijaste.»

**Cómo se aplica:**

- **`materials.family`**, la familia cerrada de P48, de la pareja de cada material en la v1. Tu texto libre sigue en `family_detail` (V3-18).
- **La paleta viaja con la app**, en claro y oscuro, como dato de la v3. Su origen es `pieza-11-paleta.csv`.
- **`materials.color`** queda vacío salvo cuando alguien lo fija. Lo fijarás tú en tus materiales, desde la personalización (V3-34), y entonces manda sobre el de la familia.
- **Un material sin familia** no lleva color propio: se ve en neutro, nunca con un color inventado.

**Por qué** (la recomendación de la sesión que elegiste): un color por tema sale de la paleta sin convertir nada, y un cambio de paleta llega a todos los que no fijaste.

## V3-39 · Lo que declara el certificado de tu producto va a tu versión (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo; la abre V3-34): ¿dónde va lo que declara el certificado de tu producto? Solo 9 de tus materiales tienen composición sacada de un documento de su propio producto: 62 filas, todas de certificados IFRA del fabricante (`datos/v2/composicion.csv`, autoridad «producto»). La pregunta incluye los topes del fabricante. El resto de la composición de sus parejas viene del anexo de IFRA, que es de la capa de IFRA (V3-35).

**Respuesta:** el usuario eligió en la tarjeta la opción «A tu versión (Recomendado)» (2026-10-14): «Es el documento de tu frasco: entra en tu versión, con autoridad de producto, y para tu frasco manda sobre lo que dice el anexo (V3-5, §6.3). Otro usuario con el mismo producto no lo vería hasta que haya un catálogo común de productos, que apunto en a-futuro.md.»

**Cómo se aplica:**

- **La composición de esos certificados** entra en tu versión de cada material, con autoridad `product` y la cita del documento.
- **Los topes del fabricante** de tus productos también entran en tu versión. Son datos del material, no de IFRA (V3-35). La app los suma con IFRA y manda el más estricto.
- **Para tu frasco, el certificado manda** sobre lo que dice el anexo de IFRA de ese natural (V3-5, §6.3).
- **Un catálogo común de productos**, que serviría a cualquiera con el mismo frasco, queda en `docs/a-futuro.md`.

**Por qué** (la recomendación de la sesión que elegiste): el certificado es de tu frasco, y V3-34 saca los productos de lo común.

## V3-40 · Las voces entran por la biblioteca del laboratorio, cuando estén en ella (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo; la abre V3-34): ¿entran ahora las voces en los materiales de la v3? Son 107 JSON con lo que dice la gente que formula (`../Perfumery/fuentes/investigaciones/2026-10-11-voces-materiales/voces/`). Su propio prompt (`prompt-chat-laboratorio.md`) dice que aún no están en la biblioteca y que cómo entran como tercera fuente es una decisión pendiente del usuario en el laboratorio.

**Respuesta:** el usuario eligió en la tarjeta la opción «Por la biblioteca, después (Recomendado)» (2026-10-14): «La v3 lee la biblioteca del laboratorio. Las voces entran cuando el laboratorio decida cómo van en ella (su decisión pendiente «c») y las meta; entonces la v3 las toma como cualquier otra fuente. Así no hay dos caminos para el mismo dato. Lo apunto en a-futuro.md.»

**Cómo se aplica:** la migración no lee los JSON de las voces. Cuando estén en `materiales.sqlite`, entran como el resto de su fuente. Queda en `docs/a-futuro.md`.

**Por qué** (la recomendación de la sesión que elegiste): un solo camino para cada dato, y la decisión de cómo se guardan las voces es del laboratorio.

## V3-41 · La información de un material vive en su registro: un atributo por columna y una tabla por lista con fuente (decidida por el usuario el 2026-10-14)

**Mensajes literales** (orko kill, 2026-10-14):

> la parte de la biblioteca hay que separarla, hay unaparte que es la general descripcion del material esa puede entrar directamente dentro de los parametros del material en sqlite como en su "informacion general" que eso este dentro o fuera del banco de formulacion, si no es un costo muy grande diria que se queda porque muchso parametros de la formulacion en la parte de graficos beben directamente de estos datos de los materiales, es decir la informacion de un material completa, menos ifra debe vvir en el registro del material en un tablero de informacion ordenada en sqlite, no se exactemetne a nivle de procesado de datos cual es la manera correcta, si hay dudas consulta internet antes de deducir la manera pero la idea es que todos los materiales tengan una serie de "atributos" viviendo en ellos que conformen la descripcion de estos, cuando veas el banco de materiales estos atributos se repartiran de manera legible en la ficha, cuando uses el banco el banco usara el material;color para el color o el material;longevidad para la tabla de duracion de material...

> la idea es que dejen de existir 4000 jsons y todo este tratado de una manera de programacion correcta,

**Lo que se consultó** (la sesión, en la web, como pide el mensaje): la recomendación común es un diseño mixto.

- **Columnas con nombre y tipo** para los atributos que todas las fichas comparten y que se filtran, ordenan o dibujan.
- **Tablas aparte** para lo que tiene varias filas por material.
- **Nada de pares atributo-valor:** son lentos de consultar y no comprueban tipos.
- **JSON solo para lo raro que no se consulta.** En PowerSync un JSON llega como texto y se descompone en cada lectura.

Las fuentes: codefinity y openskillindex (atributo-valor), stanza.dev y leapcell (diseño mixto en Postgres), y la documentación de PowerSync (JSON y tablas sin procesar).

**Lectura** (de la sesión; el usuario la confirmó en la tarjeta con «Sí, así», 2026-10-14):

1. **Toda la información de un material, menos IFRA (V3-35), vive en su registro**, en la base de datos y en la copia SQLite de tu equipo. El banco la tiene sin conexión y la lee directamente: `material.color`, `material.tenacity`.
2. **La ficha es un tablero ordenado por bloques**, los de tu `esquema.sql`, con un atributo con nombre por columna:
   - identidad;
   - olor: familia y color, facetas, tu texto de familia;
   - comportamiento: piso, evolución, tenacidad, potencia, umbral, difusión, efecto;
   - uso;
   - seguridad;
   - física: estado, densidad, presión de vapor, solubilidad, fórmula, peso molecular…;
   - fuentes, confianza y «en disputa».
3. **Lo que tiene varias filas por material, cada fila con su fuente**, va en su tabla: sinónimos, descriptores, relaciones, perfumes de referencia y dosis.
4. **No hay un archivo ni un JSON por material, ni pares atributo-valor.** La migración lee las fuentes una sola vez y escribe filas; desde ahí, la fuente de la app es la base. Los CSV de `v3/datos/` son solo el paquete de carga de lo común, para que quede en Git qué entró y con qué cita. Los archivos de investigación del laboratorio siguen siendo del laboratorio.

**Cómo se aplica:** en el paso 4.2 del plan (el esquema nuevo). Con la ficha en columnas, el banco y sus gráficos leen los atributos del material sin pasar por otra capa.

## V3-42 · La tenacidad, en horas, con su escala y su fuente; la evolución, en cinco tramos (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, paso 4.2): ¿cómo se guarda la tenacidad, la longevidad que usará el banco para su tabla de duración? El laboratorio la tiene en horas en tira, con el material puro, escala TGSC (`tenacity_h` de `materiales.sqlite`): 94 de los 111 materiales, entre 2 y 600 h, y 29 con un conflicto pendiente. La evolución, 5 tramos con intensidad de 0 a 3, todavía no tiene ningún dato. V3-18 la dejó como texto hasta decidir de dónde sale y si va en horas o por tramos.

**Respuesta:** el usuario eligió en la tarjeta la opción «Horas, con escala y fuente (Recomendado)» (2026-10-14): «Un número en horas en tira, material puro y escala TGSC, con su fuente al lado. Lo tienen 94 materiales; los 29 en disputa salen «en disputa». El banco lo dibuja como orientación, nunca como medida exacta. La evolución tendrá sus 5 tramos de 0 a 3 como cinco números, vacíos hasta que se investiguen. Cambia V3-18.»

**Cómo se aplica:**

- **`materials.tenacity_hours`**, número de horas en tira, material puro, escala TGSC, con **`tenacity_source`** al lado. La base solo admite un número mayor que cero, o vacío.
- **Los que están en disputa** llevan `tenacity_hours` en `disputed_fields` (V3-17) y la ficha lo dice.
- **El banco lo dibuja como orientación**, con su escala, nunca como medida exacta.
- **La evolución, cinco columnas** de 0 a 3, una por tramo: 0–15 min, 15 min–2 h, 2–8 h, 8–24 h y más de 24 h. Quedan vacías hasta que se investigue.
- **Cambia V3-18:** la tenacidad deja de ser solo texto. La familia sigue como estaba.

**Por qué** (la recomendación de la sesión que elegiste): es la cifra que el laboratorio ya tiene, con una escala conocida, y el banco la necesita para dibujar.

## V3-43 · Lo que habla de tu material concreto va a tu versión, aunque esté en un texto general (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, tanda 7): ¿qué se hace con el texto de los campos generales que menciona tu tienda o tu frasco? Son 32 notas, 10 campos de isómeros, y la manipulación, la dilución recomendada y la procedencia de 5 aceites (`migracion-v3/tandas/7-materiales/informe.md`). Dicen cosas como «Olfatorium», «el kit» o «se compró».

**Respuesta literal** (orko kill, 2026-10-14, escrita en la tarjeta):

> esa informacion tiene que pertenecer a la parte de ficha de usuario, la informacion general del material que no lo vincula al mio forma parte del glosario general de materiales todas las especificaciones de mi material van al material de mi usuario

**Lectura** (de la sesión):

- **Dentro de un mismo texto se separa**: lo que habla de tu material concreto va a tu versión, y lo general se queda en lo común.
- **La separación la hace el script, frase a frase** (propuesta de la sesión). Las notas del laboratorio están escritas por líneas («Web: …», «TGSC: …»), y en cada línea se mezclan frases generales con frases de tu frasco.
  - **Una frase es tuya** si nombra a la tienda de tu frasco de ese material (`user_materials.supplier`) o habla de tu compra o de tu frasco: «el kit», «se compró», «la compra», «la etiqueta», «el usuario», «mi frasco», «mi lote».
  - **Lo demás es general**, incluidas otras tiendas y fabricantes, que son literatura.
  - **Cada línea conserva su encabezado** en los dos lados.
- **Se aplica a todos los campos de texto generales** de la tanda 7. El informe lista cada frase que pasa a tu versión, para que la revises antes de aprobar. Lo tuyo entra en tu versión, en el mismo campo, en la tanda de tu cuenta.

## V3-44 · Un estándar de clase, sin CAS en los archivos de IFRA, toma los miembros que le dio la v2 (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, tras la fase 5): tres estándares de IFRA abarcan una clase y no listan ningún CAS en sus archivos (`datos/ifra/51/estandar-cas.csv`):

- el 089, los aceites cítricos y otros con furocumarinas;
- el 184, «Pinacea derivatives»;
- el 188, «Allyl esters».

Como la capa lee por CAS (V3-35), no se aplicaban a nada. En tus materiales los perdían el allyl amyl glycolate (188), el cedro Atlas (184) y la bergamota sin bergaptenos (089). La v2 les daba 1, 7 y 18 miembros por nombre (`datos/v2/grupo-miembros.csv`, notas «D16, estándar de clase» y «el estándar le aplica por lo que es, aunque el índice no liste su CAS»).

**Respuesta:** el usuario eligió en la tarjeta la opción «Con los miembros de la v2 (Recomendado)» (2026-10-14): «Para esos tres estándares, la capa lleva los CAS de los materiales que la v2 les asignó por nombre (grupo-miembros: 1, 7 y 18), marcados como «miembro por nombre, según la v2» y con su cita. Los límites siguen saliendo solo de IFRA; solo la pertenencia viene de esa lectura. Cuesta una excepción documentada a «IFRA, solo de sus archivos» (P37), y solo para la pertenencia.»

**Cómo se aplica:**

- **La tanda 6 (la capa de IFRA)**, para cada estándar que no lista ningún CAS en los archivos de IFRA, escribe en `ifra_substances` el CAS de cada miembro que le dio la v2: el del material, o el principal de la sustancia. El subgrupo dice «miembro por nombre, según la v2 (V3-44)».
- **Los límites, las notas y las reglas siguen saliendo solo de los archivos de IFRA.** La excepción a P37 es solo para quién pertenece a esos estándares.

**Por qué** (la recomendación de la sesión que elegiste): sin ellos, esos materiales salían sin un límite que IFRA les pone, y podían dar «dentro» sin serlo.

## V3-45 · Los códigos de la v1 que no son la abreviatura no entran; las abreviaturas se revisarán (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, fase 5.2): el buscador de la v3 no encuentra tus materiales por 17 códigos que tenían en la v1: los de otras filas de la v1 de su pareja, que no quedaron como abreviatura (V3-37 deja una). Por ejemplo, PcO del patchouli (la v3 tiene PtO), OE del Iso E Super (tiene OT) y LaO del láudano (tiene LaA). 13 son tuyos y 4 generados. ¿Van a otros nombres, solo los tuyos, o fuera?

**Respuesta literal** (orko kill, 2026-10-14, escrita en la tarjeta):

> los codigos de materiales de momento se pueden quedar asi la cosa es que de todas formas hay muchos que tientn que cambiar (por ejemplo se usa su nombre quimico en vez de nombre comercial para la abreviacion y eso confunde)

**Lectura** (de la sesión):

- **Los códigos se quedan como están:** cada material lleva su abreviatura (V3-37) y los otros códigos de la v1 de su pareja no van a otros nombres. El buscador no los encuentra, y la fase 5.2 lo cuenta como esperado.
- **Muchas abreviaturas tendrán que cambiar:** algunas salen del nombre químico en vez del comercial, y eso confunde. Queda para más adelante (`docs/a-futuro.md`), con el «el criterio se revisará» de V3-37.

**Y sobre los CAS** (la misma tarjeta, segunda pregunta): 7 CAS de la v1 que no estaban en tu material de la v3 (`migracion-v3/conflictos/cas-de-la-v1.csv`). El usuario eligió «Acepto todas (Recomendado)»: los 6 cuya fila de la v1 se llama como tu material van a `other_cas`, y el del Aldambre (947-05-7, «Oxacyclotridecan-2-one») queda fuera. **Después, el del olíbano, fuera** (tarjeta siguiente, «Fuera (Recomendado)»): 8016-36-2 es el CAS de la entrada genérica «Olibanum oil» del anexo. Con él, la v3 tomaría esa entrada y no la de sacra (V3-23), y su IFRA cambiaría (sin carvona; tuyona del 0,3 % al 0,5 %). La recomendación lo pasó por alto; desde entonces, un CAS que haría candidata a otra entrada del anexo se recomienda «fuera». Las respuestas, en `migracion-v3/respuestas/cas-de-la-v1.csv`. No es una decisión nueva: aplica V3-16, que la tanda 7 no había aplicado entera. Ahora también entran los CAS de la entrada propia de cada natural en el anexo, la de su nombre, como la elige el adaptador (V3-23). Esa forma de leer V3-16 es propuesta de la sesión.

## V3-46 · Los huecos del glosario se aceptan de momento y van a una ficha de mejoras (decidida por el usuario el 2026-10-14)

**De dónde sale:** la sesión pidió aprobar la tanda 7 rehecha (V3-16) y, sobre ella, la tanda 9.

**Respuesta literal** (orko kill, 2026-10-14, en el hilo):

> si de momento acepto para materiales vacios como seuderal y otros sin registro de familia se documenta en una ficha de mejoras de app:glosario materiales que se revisitara para ir teniendo los materiales al orden necesario

**Lectura** (de la sesión):

- **Las tandas 7 y 9 quedan aprobadas tal como están**, con sus huecos («de momento acepto»).
- **Los huecos van a una ficha de mejoras del glosario de materiales:** los materiales casi vacíos, como Suederal, los que no tienen familia y los demás. Se volverá a ella para ir poniendo los materiales en orden.

**Cómo se aplica** (propuesta de la sesión):

- **La ficha es `docs-v3/mejoras-glosario-materiales.md`**. La escribe `migracion-v3/mejoras-glosario.ts` desde lo común aprobado, y no se edita a mano. Para cada material dice lo que le falta del registro general: CAS o especie, abreviatura, familia, nivel, tenacidad, intensidad, evolución, descriptores, dosis y estado físico.
- **Al volver a ella, se ejecuta otra vez** y dice lo que sigue faltando.
- **Cada hueco se llena con su fuente**, por una tanda que apruebas, como el resto de los datos.

## V3-47 · La ficha de un material, de momento, es una hoja de datos normal; la diseñada, con el AOM (decidida por el usuario el 2026-10-14)

**Respuesta literal** (orko kill, 2026-10-14, en el hilo, antes de la fase 6):

> creo que el tema de visualizacion de datos aun tengo que trabajarlo un poco de momento creo que lo mejor es que se usen data sheets normales como placeholders pero en un futuro hare una tabla que este diseñada donde no todo sea texto sino que se visualizen los datos, pero antes hace falta tener datos suficientes para entender, probablemente se tengan que establecer sets de iconos y demas pero para eso hay que tener todos los datos en bruto y cuando diseñe el AOM mapa agregado de olores de multiples variables, podre hacer las fichas de materiales acorde

**Lectura** (de la sesión; el usuario la confirmó en la tarjeta con «Sí, así (Recomendado)», 2026-10-14):

- **En la fase 6, la ficha de un material es una hoja de datos normal**, provisional. Va por secciones con «campo: valor» y tablas: identidad, olor y uso, física, composición, IFRA, dosis, descriptores, relaciones y perfumes. Cada cifra va con su fuente y su base, y lo desconocido dice «no lo dice» (§1.2). Tu versión enseña lo que añade al común. Sin iconos, gráficos ni diseño propio.
- **Más adelante, una ficha diseñada**, donde no todo sea texto y los datos se vean. Antes hace falta tener todos los datos en bruto y, seguramente, juegos de iconos. Las fichas se harán acordes al **AOM**, el mapa agregado de olores de múltiples variables, cuando el usuario lo diseñe.

**Cómo se aplica** (propuesta de la sesión, confirmada con la lectura):

- **El plan no cambia de contenido:** el paso 6.2 pide los mismos datos; solo cambia cómo se enseñan.
- **La puerta que queda abierta:** un atributo por columna (V3-41), y ningún dato se guarda ya formateado para enseñarlo. La hoja se arma desde una lista de campos, así que la ficha diseñada sustituirá la vista sin tocar los datos. Entra en `docs/a-futuro.md`, junto al glosario visual (P15, P33, P34).

## V3-48 · Los materiales de tus fórmulas que no son de tus 111, uno a uno (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, paso 7.5): tus 30 fórmulas usan 190 materiales distintos. 134 llegan a uno de tus 111 comunes, 3 son disolventes, 7 son provisionales por nombre y 13 son acordes congelados. Los otros **33 son materiales de la v2 que no están entre tus 111** (V3-34) y aparecen en 27 de las 30 fórmulas. ¿Qué se hace con ellos?

**Respuesta:** el usuario eligió en la tarjeta la opción «Uno a uno en un CSV (Recomendado)» (2026-10-14): «El script propone para cada uno, en conflictos/materiales-formulas.csv: que es uno de tus 111 (por CAS o nombre, con el motivo), o un provisional tuyo nuevo con su nombre y su CAS. Tú lo decides. Ninguna fórmula pierde un material y nada se junta en silencio.»

**Cómo se aplica** (propuesta de la sesión):

- **Los provisionales por nombre** de tus fórmulas (`prov:`) entran en el mismo CSV: algunos ya son uno de tus 111 (Suederal, Cedro chino…).
- **Una fórmula apunta a tu versión** del material (tu frasco, con tu certificado, V3-39), no al común, cuando la tienes. Sin versión, al común.
- **Los disolventes** (`solv:`) van a tus comunes disolventes (Etanol, DPG, IPM).
- **Los acordes congelados** (`vec:`) entran como material congelado tuyo con su composición (plan 7.5), con sus materiales resueltos igual.

## V3-49 · Un acorde congelado sale de su fórmula, hasta el evento en que se congeló (decidida por el usuario el 2026-10-14)

**Pregunta** (tarjeta del hilo, paso 7.5): un acorde congelado (`vec:`) tiene proporciones como 17/1222, que no tienen decimal exacto, y la v3 no redondea cifras. ¿Cómo se guarda exacto? De tus 13 acordes, 10 son exactamente su fórmula de origen hasta su último evento; 3 no coinciden con ningún punto de su historial.

**Respuesta:** el usuario eligió en la tarjeta la opción «Desde su fórmula (Recomendado)» (2026-10-14): «El acorde apunta a su fórmula y al evento en que se congeló (source_formula_id, que ya existe, y una columna nueva source_event_id). Como el historial solo se añade, su composición no cambia nunca. Sirve para 10 de 13. Para los otros 3 se crea una fórmula "instantánea" en su banco («… (congelado)»), con un vertido por componente, que da exactamente su vector.»

**Cómo se aplica:**

- **`materials.source_event_id`**: el evento de su fórmula hasta el que se compone. La composición del acorde la da el motor, `compose()` de su fórmula hasta ese evento; no se guarda aparte.
- **Una fórmula de la que sale un acorde no se borra** mientras exista el acorde: su composición depende de ella. Cambia lo de V3-10, que la dejaba en `NULL` (propuesta de la sesión, porque se deduce de la respuesta).
- **Las fórmulas instantáneas** llevan el papel «congelado de la v2» y un vertido puro por componente, con masas enteras proporcionales a su vector.

## V3-50 · El glosario en rejilla con icono, y pestañas Propios, Generales, Fórmulas y Acordes (decidida por el usuario el 2026-10-14)

**Respuestas literales** (orko kill, 2026-10-14, en el hilo, con dos imágenes: un icono cuadrado de borde naranja con «34X» y unas pestañas redondeadas con borde):

> para los materiales cambia el formato en el que salen, en vez de en lista en grid con un icono (temporalmente sera este en el futuro tendra visual identitaria) el icono tiene que ser suficietnemetne granda para que debajo quepa la letra de manera visible para la diferencia de materiales, dos pestañas en la parte de lfiltros, un seleccionador como el de la derecha estilo tabs rota entre propios y generales

> una pestaña adicional que sean formulas para que no se mezcle todo

> y las pestañas estan encima de los materiales, donde pone 60 materiales no encima del buscador

**Lectura** (de la sesión):

- **Los materiales, en rejilla:** cada uno con un icono provisional (cuadrado, borde de color, su abreviatura dentro; sin abreviatura, sus iniciales con borde discontinuo) y su nombre debajo, legible. La identidad visual llegará después (V3-47).
- **Tres pestañas, justo encima de la rejilla** (bajo el buscador y los filtros): **Propios**, **Generales** y **Fórmulas**, al estilo de la imagen, con teclado (flechas, Inicio, Fin). Sustituyen al filtro «De quién». Se abre en Propios (propuesta de la sesión).
- **Fórmulas, aparte:** tus bancos con sus fórmulas, con sus versiones y marcadores. Se abren en el banco, en la fase 8.

**Después** (orko kill, 2026-10-14, en el hilo):

> la parte de acordes tambien puede tener su tab separada creo yo me refiero los que setan registrados como acorde

> se duplican en este caso coexisten en formulas y acordes

- **Una cuarta pestaña, Acordes:** las fórmulas marcadas «acorde», de todos los bancos, cada una con el suyo. Es la carpeta general de V3-19. **Coexisten:** un acorde sale en Acordes y también en Fórmulas, en su banco.

**Y** (orko kill, 2026-10-14, en el hilo):

> en la parte de formulas los bancos de trabajo funcionan como una agrupacion de forumulas, de manera que al hacer click en un banco de trabajo se despliegan todas pero pero en el estado normal estan plegadas dentro de un workbench que ocupa el mism o espacio que una formula

- **En Fórmulas, cada banco es una tarjeta del tamaño de una fórmula, plegada**, con cuántas fórmulas tiene; al pulsarla se despliegan sus fórmulas detrás de ella, en la misma rejilla, y al pulsarla otra vez se pliegan. Al buscar, un banco con lo encontrado se abre solo (propuesta de la sesión).

> se pueden despledar a 1/2x y por dos filas para ocupar menos, cada slot caben 4

- **Desplegadas, a la mitad y de cuatro en cuatro:** cada hueco de la rejilla lleva 2×2 fórmulas pequeñas (su icono y su nombre); un acorde, con un anillo alrededor del icono (propuesta de la sesión).

## V3-51 · Pulir los materiales es tarea de detalle; mala información es peor que falta de información (decidida por el usuario el 2026-10-15)

**Respuesta literal** (orko kill, 2026-10-15, en el hilo):

> es importante tener en cuenta los materiales que falta por rellenar, tambien hay que auditar algunos de los que ahora hay el pulir los materiales rellenarlos y referenciarlos es una tare titanica que es mejor hacerla como detalles creo yo, porque con la nueva version editar partes de un material es facil, por ejemplo me he dado cuenta que aldambre tiene sinonimos que no se corresponden por ejemplo dodecalactone/=aldambre no hace falta corregirlo ahora pero es ejemplo de que hay que auditar alguna informacion, mala informacion es peor que falta de informacion

**Lectura** (de la sesión):

- **Rellenar, auditar y referenciar los materiales se hace como detalle**, poco a poco, no en una tanda grande: en la v3, cambiar una parte de un material es fácil.
- **Mala información es peor que falta de información.** Lo dudoso se audita antes de fiarse de ello.
- **Dónde se apunta:** lo que falta, en la ficha de mejoras (V3-46); lo que está mal o es dudoso, en `migracion-v3/auditoria.csv`, que la ficha enseña en «A auditar». El primero: los sinónimos del Aldambre que no son suyos (dodecalactona…), venidos de una fila de la v1 que la v2 juntó con su pareja.

## V3-52 · El banco de la v2 se porta a la v3 (decidida por el usuario el 2026-10-15)

**Pregunta** (tarjeta del hilo, antes del paso 8.2): ¿se porta el banco de formulación de la v2 o se hace de nuevo? Son 45 archivos y unas 7.400 líneas; 16 leen los datos de la v2.

**Respuesta:** el usuario eligió en la tarjeta la opción «Portar el de la v2 (Recomendado)» (2026-10-15): «Copio su pantalla a v3/ (barra de añadir, frasco, composición, historial, panel de IFRA y gráficos) y la conecto a la base nueva: cada acción escribe un evento, y lee el catálogo y el IFRA de la v3. Trabajas igual que ahora y se reutiliza lo probado. Cuesta adaptar los 16 archivos que leen datos de la v2.»

**Cómo se aplica:** como el motor (`v3/src/core/`), el banco se copia a `v3/` y no importa nada de fuera (V3-21). Lo que leía de la v2 (su catálogo, su repositorio, su IFRA) pasa a leer la copia de la v3; lo que guardaba en archivos JSON pasa a eventos de la base (paso 8.2). Su aspecto sigue siendo provisional (V3-47).

## V3-53 · DEP, TEC, triacetina y benzoato de bencilo entran en lo común (decidida por el usuario el 2026-10-15)

**Pregunta** (tarjeta del hilo, antes del paso 8.2): el banco de la v2 ofrecía siete diluyentes; entre tus 111 comunes solo están Etanol, DPG e IPM. ¿Qué se hace con los otros cuatro?

**Respuesta:** el usuario eligió en la tarjeta la opción «Comunes, con su CAS (Recomendado)» (2026-10-15): «Entran en lo común por una tanda que apruebas, como disolventes, con su nombre y su CAS. La capa de IFRA los lee por CAS (el benzoato de bencilo tiene estándar). Cualquiera los puede usar.»

**Cómo se aplica:** la tanda 11 los añade a lo común con los datos que tenía la app de la v2 (sus nombres, su CAS y su sigla), cada uno en su categoría. Es una excepción acotada a V3-34, que la v3 no herede materiales de la v2: son cuatro disolventes que el banco ofrece.

## V3-54 · Los huecos del glosario se buscan en la web, material por material: fabricante y TGSC primero (decidida por el usuario el 2026-10-15)

**Pregunta** (sesión de la referencia ScentFriends): el usuario pide que «se buscaran los materiales uno por uno en la web y se añadieran descriptivos de los que faltan», porque las categorías de ScentFriends «no son las mismas que yo uso». ¿Qué se rellena y con qué fuentes?

**Respuestas** (tarjetas, 2026-10-15):

- **Alcance:** «Los huecos (Recomendado)»: «Solo lo que la ficha de mejoras marca como vacío: 11 sin familia, 14 sin tenacidad, 3 sin intensidad, 3 sin descriptores, 4 sin dosis, 4 sin estado físico y 1 sin especie. […] Cada dato, con su URL y traducido a tus familias y descriptores, en una tanda que tú apruebas.»
- **Fuentes:** «Fabricante y TGSC (Recomendado)»: «Para las bases […], la página o ficha del fabricante. Para las moléculas, The Good Scents Company, que da la tenacidad en horas en tira con la misma escala que ya usas (V3-42). Las tiendas (ScentFriends, Fraterworks, Perfumer's Apprentice) solo como segunda fuente, y donde las fuentes chocan, «en disputa». Lo que no se encuentre queda vacío.»

**Lectura** (de la sesión):

- **Solo los huecos de `mejoras-glosario-materiales.md`**, no lo que ya tiene dato. La abreviatura no se busca: es tuya (V3-45). La evolución por tramos tampoco: ninguna fuente la da así.
- **La familia se traduce a las nueve tuyas** (P48); la traducción es propuesta de la sesión, con la frase de la fuente al lado, y la decides al aprobar la tanda.
- **Cada dato lleva URL, la frase que lo dice y qué fuente es** (fabricante, TGSC o tienda). De las tiendas no se copia prosa: solo el dato y su frase corta. Mala información es peor que ninguna (V3-51): si no se encuentra, queda vacío.
- **Entra por una tanda**, escrita por script desde el CSV de la búsqueda, que apruebas.

## V3-55 · De ScentFriends: la hoja de pesada exportable y la etiqueta de dilución (apuntada por el usuario el 2026-10-15; cuándo, sin decidir)

**Literal** (2026-10-15): «ademas tambien tienen esta feature de exportacion que me parece bien, y un creador de diluciones en el que figura un boton para imprimir etiquetas que tambien es muy practico».

**Lectura** (de la sesión):

- **La exportación** es una hoja de laboratorio en PDF: cabecera con concentración, concentrado, alcohol, total y semáforo IFRA; una línea por material con nota, dilución, partes, objetivo en gramos, **real** (en blanco, para escribirlo) y una casilla. En la v3, la columna «real» puede salir ya rellena de los eventos del banco.
- **El creador de diluciones** calcula material y disolvente en gramos para una cantidad y un porcentaje (también desde una dilución previa), da los pasos e imprime una etiqueta (material, %, disolvente, fecha).
- **Propuesta de la sesión, sin decidir:** las dos, en la fase del banco, junto a la hoja de diluciones de cada fórmula.

## V3-56 · De ScentFriends entra lo propuesto; los alérgenos y el CLP, aparte (decidida por el usuario el 2026-10-15)

**Literal** (2026-10-15, a la lista de lo que servía de la referencia): «de acuerdo con las propuestas, aun asi hay algunas cosas trabajar en partes esta bien y muchas veces es estandar, igual que los % […]». Lo de las partes es V3-58 y V3-59.

**Lectura** (de la sesión):

- **Entran, después de portar el banco (V3-52):** la hoja de pesada exportable y el creador de diluciones con su etiqueta (V3-55), la hoja de diluciones de cada fórmula (qué preparar antes de pesar), el panel de avisos (IFRA, reparto por pisos, gramos de alcohol), el tipo de producto y la concentración arriba del banco y, del gráfico de evolución, solo la forma de dibujarlo, con tus datos (V3-42).
- **Los alérgenos de la UE, el Anexo III y la etiqueta CLP** quedan para una decisión aparte.
- **No entran:** su modo de pesada (solo marca casillas), los precios y el carrito, y sus textos y fichas.

## V3-57 · Repesar, cuando lo decide el usuario, con el frasco o con el frasco tarado (decidida por el usuario el 2026-10-15; cambia P12, §3.5)

**Literal** (2026-10-15):

> de acuerdo con las propuestas, aun asi hay algunas cosas trabajar en partes esta bien y muchas veces es estandar, igual que los % yo diria que hay que buscar una manera de incorporar eso a la app pero es complicado obviamente, el conflicto es, durante el trabajo normal se tiene que trabajar con la precision de los gramos y lo que se ponga de producto tiene que consercar la precision de la medida, sin embargo la parte de exportar la forumula en partes o en porcentages o para recomponer una formula lo ideal es que haya una informacion relativa no absoluta, entoces lo que propongo es que el sistema de repesado se rediseñe de manera que no se algo que te sale al reabrir la formula directamente sino una opcion de repesar o algo asi donde puedas poner el nuevo peso por si se ha usado el contenido de la formula, esencialmente haciendo lo de repesar pero a decision del usuario, tambien hay que dar la opcion de si se tiene en cuenta el flasco o no en la repesada, podria ser que se ponga el peso junto con el flasco o que el flasco este tarado y no se tenga que restar en este nuevo "repesar". la parte de la composicion por otro lado deberia tener tambien una pestaña de partes donde el uso de los ingredientes se pone en uso de entre 0 a 1000 partes de producto total, para quien esta familiarizado con este tipo de pesada, se redondea para que la cantidad se ajsute a la unidad minima, finalmente para acabar de completar todas las opciones que faltan en el menu desplegable de opciones de la derecha debe haber un boton mas que sea para usar la formula, usar la formula te abre una ventana flotante que te muestra la composicion entera de la formula y donde puedes configurar unos parametros para que te de la receta exacta dependiendo de tus necesidades, usa la formula en valores relativos para calcular cuanto te hace falta mezclar de cada materiales para un valor deseado, creo que esta parte deberia tener tanto la opcion de usar formulas en su estado normal como ademas usar formulas con un requerimiento, PE la formula como tal esta al 35% pero digamos que yo el perfume final no lo quiero al 30 lo quiero al 25%, en vez de seleccional que quiero usar la formula 1:1 lo que selecciono es que quiero usar la formula para un producto de 25% mezcla 75% alcohol, y por lo tanto se ajustara subiendo la cantidad de alcohol que se usa, tabmien puede hacer lo contrario pero si concentras mas la formula de lo que esta tendra un aviso para cuando pases el % definido por "uso maximo en fragancia final"...

**Lectura** (de la sesión):

- **El principio:** se trabaja y se guarda en gramos, con la precisión de la báscula; las partes y los % son vistas y salidas relativas, para exportar o recomponer. Nada de lo pesado se redondea.
- **Reabrir una fórmula ya no pide pesarla.** Repesar es una opción del menú («Repesar…», que ya existe en la v2), cuando has usado parte de lo que había. Cambia P12 (§3.5: «al reabrir una fórmula con vial, se pesa»); lo demás de §3.5 sigue: la app escala todo a lo que queda, lo apunta en el historial, rechaza un peso imposible (P52) y avisa de lo evaporado.
- **Al repesar eliges cómo pesas:** con el frasco (escribes el bruto y la app resta la tara) o con el frasco tarado en la báscula (escribes lo que queda y no se resta nada). Sin tara conocida, solo vale la segunda.
- **Para la prueba de mañana el banco sigue como en la v2** (V3-52); el cambio va justo después.

## V3-58 · La composición, también en partes de 1000 (decidida por el usuario el 2026-10-15)

**Literal:** el de V3-57 («una pestaña de partes donde el uso de los ingredientes se pone en uso de entre 0 a 1000 partes de producto total […] se redondea para que la cantidad se ajsute a la unidad minima»).

**Lectura** (de la sesión):

- **Una pestaña más en la composición:** junto a «materia aromática» y «frasco», «partes», con cada material en partes de 1000 del total. Es una vista: la fórmula sigue en gramos.
- **Cómo se redondea** (elegido por el usuario el 2026-10-19 en una tarjeta del hilo, «Unidad y décima»): a la unidad, y con una décima solo los materiales que quedarían por debajo de 1 («0,4»; «< 0,1» si ni eso).
- **Propuesta de la sesión:** las partes son de la materia aromática (sin disolventes), como la vista del olor; el encabezado lo dice. Es una pestaña más junto a «materia aromática» y «frasco».

## V3-59 · «Usar la fórmula»: la receta exacta para lo que necesitas (decidida por el usuario el 2026-10-15)

**Literal:** el de V3-57 (desde «finalmente para acabar de completar…»).

**Lectura** (de la sesión):

- **Un botón más en el menú «Opciones»:** «Usar la fórmula…». Abre una ventana flotante con la composición entera y unos parámetros; con las proporciones de la fórmula, calcula cuánto pesar de cada material para lo que pides.
- **Dos modos.** **Tal cual (1:1):** la misma fórmula, a otra cantidad. **Con un requisito:** a otra concentración. Por ejemplo, la fórmula está al 35 % (lote de trabajo entre lote final, §3.3) y la quieres al 25 %: la receta da el concentrado para un 25 % y sube el alcohol hasta el 75 %.
- **Se puede concentrar más de lo que está**, con un aviso al pasar el uso máximo de IFRA (la segunda lectura, §5: «hasta qué % se puede usar en un perfume»). Con datos de IFRA incompletos, el aviso dice «parcial» y nunca da por bueno (§1.2).
- **Los gramos de la receta, a la precisión de la báscula** (0,001 g); la receta es la base natural de la hoja de pesada (V3-55).

## V3-60 · Las catas, solo en la app; el diario del laboratorio, de archivo (cerrada con el usuario el 2026-10-18 en el proyecto LAB)

**Literal** (2026-10-19, a la lectura de abajo que le pasó la sesión, al no tener la sesión el hilo del proyecto LAB donde se cerró el 2026-10-18): «si ok a las 6». El resumen de entonces, en `catas-diseno.md` (decisión 1).

**Lectura** (de la sesión):

- **La app manda.** Las catas nuevas, solo en la app, en un apartado propio, «Catas».
- **`diario/` del laboratorio queda de archivo**; las 102 fichas en blanco dejan de usarse.
- **Las fichas rellenas se consultan como catas de legado**: `lab_evaluations` (tanda 8), de solo lectura, con su `sheet`. Su `status` alimenta la cola hasta que haya tiras cerradas.
- **Una cata apunta a un material tuyo y no escribe en él** (ni familia, ni descriptores, ni categorías).

## V3-61 · La ficha de cata, con pestañas por tiempo (cerrada con el usuario el 2026-10-18 en el proyecto LAB)

**Literal** (2026-10-19, a la lectura de abajo que le pasó la sesión, al no tener la sesión el hilo del proyecto LAB donde se cerró el 2026-10-18): «si ok a las 6». El resumen de entonces, en `catas-diseno.md` (decisión 2, versión 2).

**Lectura** (de la sesión):

- **Primero se migra la tradición de las hojas de forma usable**; cribar o bajar densidad, después.
- **Una pestaña por momento:** t0 · t5 · t30 · t60 · 24 h · días. t0, la apertura a ciegas, se guarda una vez y no se edita; t5, el desglose entero; de t30 en adelante, lo que cambia, empezando vacío. Un bloque sin tocar es «sin dato»; uno revisado sin cambios, «igual».
- **Controles:** texto (o el dictado del teclado) para lo descriptivo y las sinestésicas; casillas para las familias (Calkin y Jellinek, Ellena y las 9 de P48, además, no en su lugar); un polo por eje del efecto; un slider de intensidad de cerca; botones para las elecciones únicas; la batería con `sí · — · ? · n/r`; la curva en cuatro columnas.
- **Al cerrar, una vez por tira:** papel, efecto, versatilidad, modo de decaer, R1-R3, sesgos, afinidades, destinos y el cotejo, que solo se abre con la serie cerrada.
- **A ciegas:** mientras se cata se ve la etiqueta (A-D); el nombre, al cerrar la t5.

## V3-62 · Las catas, en columnas, con vocabularios por código fijo (cerrada con el usuario el 2026-10-18 en el proyecto LAB)

**Literal** (2026-10-19, a la lectura de abajo que le pasó la sesión, al no tener la sesión el hilo del proyecto LAB donde se cerró el 2026-10-18): «si ok a las 6». El resumen de entonces, en `catas-diseno.md` (decisión 3).

**Lectura** (de la sesión):

- **Tablas tuyas, con `user_id` y RLS:** `tasting_sessions`, `tasting_strips` (la fracción y el disolvente, copiados de `lab_dilutions`), `tasting_moments` (un atributo por columna, V3-41, con hijas para familias, batería y curva) y `tasting_closures`.
- **Lo que se elige de una lista, con un código fijo** validado por la base de datos; la etiqueta, aparte.
- **La tenacidad no se guarda:** sale, en horas (V3-42), del último momento que aún se nota de cerca. **Nada escribe en `materials`.**

## V3-63 · La primera versión de las catas: catar y cola (cerrada con el usuario el 2026-10-18 en el proyecto LAB)

**Literal** (2026-10-19, a la lectura de abajo que le pasó la sesión, al no tener la sesión el hilo del proyecto LAB donde se cerró el 2026-10-18): «si ok a las 6». El resumen de entonces, en `catas-diseno.md` (decisión 4).

**Lectura** (de la sesión):

- **Entra:** la sesión con hasta 4 tiras, las pestañas, los temporizadores con aviso con la app abierta, el cierre y el cotejo, el legado para consultar y la cola de pendientes (lo que tienes sin catar, agrupado por disolvente y dilución, con el progreso y los 12 del pedido del 2026-10-18 marcados).
- **Dictado:** el del teclado del móvil.
- **Aparcado:** la vista comparativa horizontal, la curva multilínea, el selector hex, el cotejo asistido y exportar a .md.
- **Cambio del usuario (2026-10-19), literal:** «en la parte de Por catar deberian aparecer los materiales idealmente los 161 no solo los 13 nuevos». La cola toma todos tus materiales (tus versiones y los tuyos), tengan o no «lo tengo»; los comunes, no. Propuesta de la sesión: los frascos se agrupan por su concentración habitual (un 9,98 % pesado va con los «≈10 %»), y cada línea dice la exacta.

## V3-64 · La cata vive en «Catas»; el material solo la enlaza (decidida por el usuario el 2026-10-19)

**Literal** (2026-10-19):

> before any evaluation i need to know where does the cata live, the ideal scenario is that there is a glossary of catas as it is now where you can consult all the progress but also that the evaluation is on its own linked to the materials in a way taht you can also searching through the materials start a new cata from the material browser (and it gets sent to the cata ui) and also have the cata linked on the material if its done, both of this steps are just relations so you can from a material get sent directly to the cata itself or to create a new cata, it does not mean that the whole cata sheet is inside the material udim

**Lectura** (de la sesión):

- **La cata vive en «Catas»**, con su glosario (Sesión, Cola, Catadas, Legado) para ver todo el progreso. Precisa V3-60.
- **El material solo la enlaza**, en los dos sentidos: en su ficha, una sección «Catas» con un enlace a cada cata (fecha, en curso o cerrada, tenacidad) y a la ficha del laboratorio si la hay; y «Nueva cata», que abre la cata en «Catas». La hoja de cata nunca va dentro del material.
- **Cada cata tiene su dirección** (`#cata/<id>`), y cada pestaña de «Catas» la suya (`#catas/cola`…), para poder enlazarlas.
- **Propuesta de la sesión:** «Nueva cata» pone la tira en la sesión abierta (o abre una); si el material ya tiene una tira abierta en ella, lleva a esa en vez de crear otra.

## V3-65 · Las diluciones, una parte propia de la app, vinculadas al material (decidida por el usuario el 2026-10-19; cuándo: después de cerrar las catas)

**Literal** (2026-10-19):

> creo que falta un nivel de complejidad de la app que solucionaria este problema y otros de dentro de la app de formulacion, crear la parte de diluciones en la app, de entrada muy sencillo pones los porcentajes pones los porcentajes la cantidad y te lo calcula, se ira mejorando con incluso recomendaciones por los materiales y demas. para que es tan util esto? porque estandarizara los materiales dados de alta como propios con las diluciones concretas que quedaran registradas, si uso material Labdanum y creo quna dilucion al 10% que resultla ser un 9,67% se guarda como 9,67%, habra que cambiar la parte de formulacion para que desde  este cambio te salgan los materiales que has registrado en diluciones como las diluciones "favoritas" esto tambien es util para cuando los materiales llevan multiples diluyentes etc todo esto se estandarizara entonces una vez seleccionas el material a parte de la opcion de poner tu el numero a mano tendras guardadas las diluciones que hayas registrado, esto tambien sera compatible con los estandares de dilucion en catas. entonces creo que lo de las diluciones de catas se pausa, se acaba el resto de incognitas de las catas y a posteriori se empieza a mirar la manera de implementar las diluciones en la app tambien de manera que se guarden vinculadas al material, no quiero que cada dilucion sea un material diferente de usuario sino que cada material tenga propiedad de las diluciones exactas con el % justo y el diluyente y al usar la app de formulacion en el apartado de la dilucion tengas las opciones, podria ser que a nivel visual en la app, al seleccionar el material justo encima de la parte de diluciones aparezcan pestañas: PE
> 10%, 50% y en la pestaña 10%, al hacer click te ponga en los parametros 10.70% , eth y en la del 50% por ejemplo pone 50%, 30eth, resto dpg,...

**Lectura** (de la sesión):

- **Una parte de diluciones en la app.** Para empezar, sencilla: pones el porcentaje y la cantidad, y te calcula cuánto pesar. Más adelante, con recomendaciones por material.
- **Cada dilución que haces queda registrada con su cifra exacta**: si buscabas un 10 % y te sale un 9,67 %, se guarda 9,67 %. Con su diluyente o sus diluyentes (p. ej. 50 %, 30 % de etanol y el resto DPG).
- **Es una propiedad del material, no un material nuevo.** Cada material tuyo tiene sus diluciones exactas.
- **En Formulación**, al elegir un material, encima de la dilución salen pestañas con tus diluciones de ese material («10 %», «50 %»); al tocar una, rellena los parámetros con lo exacto (10,70 % en etanol; 50 %, 30 % de etanol y el resto DPG). Escribir el número a mano sigue siendo posible.
- **Las catas usan los mismos frascos**: es el estándar de dilución de las catas.
- **Orden:** la dilución en las catas se pausa (la pregunta 1 de las catas abiertas); se cierran las demás incógnitas de las catas, y después se diseña esto.
- **Nota de la sesión:** hoy `lab_dilutions` guarda una fracción y el disolvente en texto; varios diluyentes con su parte no caben. Al diseñarlo se verá cómo encaja con el `add` de `formula_events`, que ya admite dos diluyentes.

## V3-66 · Las preguntas abiertas de las catas (decidida por el usuario el 2026-10-19)

**Literal** (2026-10-19), a las cinco preguntas de la sesión:

> se quitan los disolventes de las catas
> si desde la ficha de material nace importada
> vale dejamos  para mas tarde lo otro
> de momento el legado cuenta catado a efectos practicos esta
> las fichas en blanco de laboratorio se pueden borrar el nuevo formato en el que se guarde la app lo sustituira una vez se haga, dicho esto si estaria bien que quedara registro de las apps una vez que se hagan se buscara una manera, mas tarde de que en el ordenador acaben viviendo las fichas conforme se van haciendo
> lel tema de las diluciones
> las catas usan las diluciones creadas como base, dejan que escoger el % sea una opcion pero obciamente solo se pueden catar las dilciones entre las que existen, por lo tanto no hay un lugar libre sino se seleccionan de entre materiales que existen y dilciones que existen

**Lectura** (de la sesión):

- **Los disolventes no se catan:** salen de la cola y de «Añadir tira». Hecho.
- **Una cata que nace desde la ficha del material es «informada»** («importada» en el mensaje, que se lee como «informada», el sesgo de la hoja): se crea con ese sesgo marcado en el cierre, y se puede quitar. Hecho. A confirmar la lectura.
- **Los avisos con la app cerrada, para más tarde.**
- **El legado «catado (serie parcial)» cuenta como catado**, de momento.
- **Las fichas en blanco del laboratorio sobran**: el formato de la app las sustituye. Más tarde, buscar la manera de que las fichas hechas en la app queden también como registro en el ordenador según se hacen (enlaza con el «exportar a .md» aparcado en V3-63).
- **Confirmado (2026-10-19, «si ok a las 6»), lo que la sesión había decidido sola:** la intensidad de 1 a 5 con las palabras de la hoja; ninguna pestaña antes de la t0; las marcas de la cola con su motivo; la cola agrupada por concentración habitual; «Nueva cata» reutiliza la tira en curso del material; como máximo 4 tiras por sesión.
- **Las catas parten de las diluciones registradas** (V3-65): se elige el % entre los frascos que existen de ese material; no hay dilución libre. Hasta que exista la parte de diluciones, la tira sigue admitiendo «sin dilución».

## V3-67 · Las diluciones: cómo son (decidida por el usuario el 2026-10-19; desarrolla V3-65)

**Literal** (2026-10-19), a las diez preguntas de la sesión:

> 1vive en un apartado propio donde aparecen todas, pero a la vez todos tus propios materiales tienen tambien las diluciones dadas de alta en la ficha, por otro lado tambien esta el boton de dar de alta.
> 2si correcto los registros de texto puden ser estimados "al 10%" pero a la hora de la verdad el material y en la formulacion el 10% es 9,97,
> 3 quizas habria que replantear si usar solo 2 diluyentes esta bien, quizas la mejor opcion seria que el banco tenga un boton de añadir diluyentes por si hay casos de 3 diluyentes o no  se, me parece que casi siempre va a ser dos o menos pero es una flaqueza de diseño hacerlo universalmente asi,
> lo de corregir un flasco no se bien bien que dices
> puro no necesita diluciones se pone directamente puro desde la app y ya no hace falta que exista aqui 
> los 51 luego se pasan cuendo este todo planeado
> 9 me parece bien

Y, a las opciones de la 3, la 5, la 6 y la 10 (con la recomendación de la sesión en cada una): «si lanzalo todo asi de momento lo otro es mas de correccion si es necesario».

**Lectura** (de la sesión):

1. **Vive en un apartado propio, «Diluciones»,** con todas; cada material tuyo enseña las suyas en su ficha, con el botón de dar de alta.
2. **Cada frasco guarda el material, sus diluyentes (materiales de la app, no texto), lo pesado en µg y la fecha;** de lo pesado sale la cifra exacta (9,97 %), que es la que usan el material y la fórmula. El nombre puede ser aproximado («al 10 %»).
3. **Los diluyentes que hagan falta**, también en el banco (botón «añadir diluyente») y en la fórmula y el motor: hoy admiten dos. Es el cambio más grande; se hace una vez.
4. **La calculadora:** el % que quieres, la cantidad y los diluyentes → los gramos de cada uno; luego se apunta lo pesado y queda lo exacto. También desde otro frasco.
5. **Un frasco se puede corregir** (sus pesos): lo que ya lo usó conserva su cifra, porque cada fórmula y cada cata guardan la suya. Un frasco acabado se archiva: no sale en las pestañas y no se borra.
6. **En Formulación:** pestañas con tus frascos del material encima de la dilución; al tocar una, rellena lo exacto. La fórmula guarda las cifras (mandan) y el frasco del que salieron. Los frascos sustituyen a las favoritas del navegador.
7. **«Puro» no es una dilución:** se elige en la app y no se registra.
8. **Tus 51 frascos se pasan al final**, cuando todo esté hecho, por tanda.
9. **En las catas, la tira se elige entre tus frascos (o puro).**
10. **Para más tarde:** imprimir la etiqueta del frasco (V3-55) y las recomendaciones por material.

## V3-68 · Primero, cerrar cabos sueltos; después, la app en el móvil (decidida por el usuario el 2026-10-19)

**Literal** (2026-10-19): «el banco en el movil mas adelante, siguiente paso conectividad de movil para catas y para la app en general pero de momento centremonos en dejar todos los cabos sueltos para que sea usable en breves».

**Lectura** (de la sesión):

- **Ahora:** cerrar lo que queda suelto para que la app se pueda usar ya, en el ordenador.
- **Después:** la conectividad del móvil, para las catas y para toda la app (la nube: Supabase y PowerSync fuera de tu PC, y la app publicada).
- **Más adelante:** el banco en el móvil (8.6).

## V3-69 · La app publicada: Supabase y PowerSync en la nube, y la web en Cloudflare (decidida por el usuario el 2026-10-19 y el 20)

**Literal** (2026-10-19): «si puedes seguir ya yengo porwesync y alojamiento la que recomiendes si el plan decia una la del plan»; y, para copiar a la nube lo que solo estaba en su PC y quedarse con los 123 «lo tengo» de la nube, «vale» (2026-10-20).

**Lectura** (de la sesión):

- **Plan 9.1 y 9.2:** Supabase en la nube (`qizruaizjyvwbitpreoq`, «perfu-app»), con las migraciones subidas y los datos cargados (lo común y tu cuenta); PowerSync Cloud conectado con `powersync_role`, «Use Supabase Auth» y las reglas de `powersync/sync-config.yaml`.
- **El alojamiento (el plan no fijaba uno): Cloudflare**, propuesta de la sesión: sirve `dist/` como archivos estáticos (`v3/wrangler.jsonc`), en `https://perfumeria-v3.perfumeria-v3.workers.dev`. Se publica con `npm run build` y `npx wrangler deploy`.
- **La configuración de la versión publicada** va en `v3/.env.production.local`, fuera de Git (solo valores públicos).

## V3-70 · El sistema de datos de los materiales se rediseña: glosario (identidad y producto), tu frasco aparte e IFRA fuera del material (decidida por el usuario el 2026-10-21; los detalles, en iteración)

**Literal** (2026-10-21): «el sistema de datos se tiene que reorganizar ahora es muy caotico, de momento no se tocan los datos actuales lo que se hara es rediseñar primero el sistema de datos de la app y luego se creara un nuevo banco con las bases del nuevo sistema y se hara criba de los datos que portar de la app actual y de perfumate»; «toda la info base de un material puede estar en glosario hasta el fabricante pero solo es hasta que el usuario selecciona los materiales que tiene y desde su inventario [...] es en ese momento donde puede el usuario si quiere editar los constituyentes que tiene su material»; sobre la propuesta de tres niveles: «si me parece bien este esquema lo unico es buscar una manera infalible que la ifra este separade del producto en si [...] la base de datos es mucho mas limpia si los limites como tal no viven dentro, obciamente la informacion de lo que cada material aplica en constituyente si esta vinculkada directamente a cada material y se puede sobreescribir en el caso de que un usuario tenga una informacion diferente en su proveedor»; y «en general vamos a iterear sobre esta idea».

**Lectura** (de la sesión):

- **Los datos actuales no se tocan.** Se diseña un banco nuevo y se criban los datos de la app actual y de PerfuMate (rama `perfumate-db`).
- **Tres niveles, decididos:** identidad (lo que es) y producto (cómo lo vende un fabricante) son el glosario, común; tu frasco (inventario) es tuyo, y solo ahí se sobrescriben los constituyentes (tu GC-MS o la declaración de tu proveedor).
- **IFRA no vive en el material:** los límites, aparte; el material solo lleva su composición por CAS.
- **Propuestas de la sesión, sin decidir:** la clasificación por tipos de REACH, las afirmaciones por fuente con rango, las siete garantías de IFRA, el apartado «Apuntes» para los textos y los campos de cada cuadro. Están en los documentos «Sistema de datos de materiales: propuesta» (claude.ai/artifact/9MndRHDiSktzppUzsJvBQV) y «Glosario esquemático: qué hay en cada cuadro» (claude.ai/artifact/KQX55ZwNKioKcWr2VJtbXV).
- **Cambia, cuando se cierre el diseño:** V3-2, V3-5, V3-34, V3-36, V3-39, V3-41 y V3-43 (detalle en el segundo documento).

**Correcciones del usuario** (2026-10-21, 16:52): «multiconstituyente tiene categorias dentro un multiconstituyente como tal: o bien es un natural, o bien es una mezcla y te diria que lo que son creados o acordes [...] estan en otra categoria que es de los usuarios»; «las sustancias tienen que estar relacionadas directamente con la identidad y el producto y lo que sobrescriba el usuario va despues»; «en el glosario en lo general de todos los componentes tambien se intentara poner gsmc aunque sean genericos [...] el usuario puede crear en sus materiales una version que tenga otros constituyentes a raiz de la del glosario, pero no la tiene que crear de cero»; y «hay que hacer un esquema COMPLETO [...] lo que no se ponga aqui no estara en la app».

- **Decidido:** arriba, puro o multiconstituyente; lo multiconstituyente es natural o mezcla (un producto de reacción es mezcla). Acordes y fórmulas, fuera del glosario. Todo material del glosario con composición, aunque sea genérica. Tu material parte del del glosario y guarda tus cambios (constituyentes, alérgenos o cualquier campo).
- **Propuesta de la sesión, con siete preguntas abiertas:** el esquema completo en «Esquema completo de materiales» (claude.ai/artifact/1S97psgg1h8syxno6CfTg7).

**La regla de los tres tipos** (2026-10-21, 17:44): «mi intuicion es que la regla de los 3 tipos es mejor pero hay que ponerla aprueab»; tras la prueba con quince casos reales, «si me parece bien al final todo lo que tenga posibilidad de requerir desglose de constituyentes ira a mezcla no?», «y que no sea natural», «lo digo reduccionista para intentar establecer reglas claras».

- **Decidido (cambia el «puro o multiconstituyente» de arriba):** tres tipos y sin nivel intermedio, por este orden de preguntas: ¿es una molécula con fórmula y CAS? → **puro**, aunque traiga isómeros (van en el producto). ¿Sale directamente de una planta o un animal? → **natural**. Si no es ninguno de los dos y puede requerir desglose de constituyentes → **mezcla**.
- **Lectura de la sesión:** el puro se compone de sí mismo al 100 %; el natural y la mezcla llevan desglose. Una variante de un puro con un constituyente que importa (otra molécula, no otra proporción de isómeros) pasa a mezcla.
- **Propuesta de la sesión, sin confirmar:** la mezcla también lleva origen (sintético, biotecnológico) y puede tener CAS propio (productos de reacción, Clearwood); si IFRA lista ese CAS, el cálculo lo usa como sustancia.

**Más correcciones del usuario** (2026-10-21, 18:04): «en cuanto a bases comerciales si ambergris va al glosario comomezcla con fabricanta»; «todo lo que son acordes mezclas formulas etc esono esta en el glosario [...] dentro del apartado mezclas hay tambien la distincion de usuario que en este caso registra sus materiales, no se deben mezclar los de usuario como si fueran mezclas de un laboratorio»; «puro o con isomeros, creo que en este caso igual que los rectificados deben tener distinciones claras no una descripcion [...] tiene que afectar directamente a la identidad [...] un acompañante de la categoria puro al igual que extracto natural va acompañado por la categoria Absoluto y puede ir acompañado con rectificado como "modificadores de la categoria"»; «si puedes tener varios tuyos como material por ejemplo diferentes proveedores o por diferentes origenes [...] no es lo mismo usar mi jara de españa que mi jara de marruecos en una formula»; «si un material que compras lo introduces tu con el formulario pero el sistema ese es complejo de resolver y en todo caso vendra despues de resolver todo el sistema de datos»; y sobre el linalool natural: «la categoria primera o padre en el sistema seria si es puro o no [...] la clasificacion tiene que tener una jerarquia [...] el termino de naturales es para recoger el abanico de los diferentes tipos de extraccion».

- **Decidido:** las bases comerciales (Ambergris T Oliffac) entran en el glosario como mezcla, con su fabricante. Las mezclas del usuario (acordes, fórmulas, bases propias) no están en el glosario sino en sus materiales, y nunca se tratan como mezclas de un laboratorio. Se pueden tener varios materiales tuyos de un mismo material del glosario (por proveedor o por procedencia: la jara de España y la de Marruecos). El tipo manda primero en la jerarquía: un linalool de origen natural es puro, y el origen va después; «natural» recoge las formas de extracción.
- **Decidido:** cada tipo lleva **modificadores de la categoría**, de listas cerradas, que forman parte de la identidad y no son una descripción: en el natural, el proceso (absoluto, aceite esencial…) y el tratamiento (rectificado…); en el puro, la forma isomérica.
- **Decidido** (2026-10-21, 18:09, el usuario elige «Cinco formas» en la pregunta «¿Qué lista de formas isoméricas usa el modificador del puro?»): isómeros sin especificar, racémico, enantiómero, enriquecido en un isómero, isómero único. Hedione y Hedione HC son dos identidades con el mismo CAS y el mismo IFRA, y no dos productos de una. La cifra de la proporción va aparte, por fuente.
- **Más adelante:** el material que no está en el glosario, que el usuario da de alta con un formulario, se resuelve después del sistema de datos.
- **Por evaluar (intuición del usuario):** dos niveles de familia, uno general (las siete del usuario) y otro detallado con más matices; el general se calcularía sumando los porcentajes del detallado, no fijado a mano. Hacen falta reglas de consenso para las familias que llegan de cada fuente.

**La auditoría del esquema** (2026-10-21 y 22). Una auditoría externa que pasó el usuario (`esquema-materiales/auditoria-v1.md`) propuso 24 cambios; la sesión la contrastó con el código de la v3, y una segunda versión (`auditoria-v2.md`) dejó 11 puntos abiertos, que la sesión respondió en «Revisión de la auditoría del esquema» (claude.ai/artifact/5uwQq356V6WmQM5Jh3XabY). **Literal** (23:58): «vale perfecto pues ahora seria hacer el nuevo XRAy de los datos con las nuevas decisiones y se pasa la ultima evalucion, yo apruego las decisiones actializa la radiografia».

- **Decidido, los 24 cambios con la redacción de la v2:** `sustancias` sale de la regulación a un núcleo químico con la química de la molécula (fórmula, peso, SMILES, InChIKey, CID de PubChem); la composición, con cabecera y líneas; los datos por fuente pasan a `afirmaciones`, con tabla hija para las listas, condición en columnas, valor original y convertido y `derivada_de`; tus cambios y tu composición, en tablas gemelas de las del glosario; `tandas` con `tanda_id` en cada fila del glosario; `fusionado_en`; `clave_identidad` única; `enmiendas` y `categorias_ifra` como tablas; alérgenos por entradas y sustancias; `informes_ifra` con la foto de lo usado; la composición es la del producto (o de tu frasco) tal como está y la dilución es informativa; puros y naturales dentro de `materiales`, con comprobación por tipo; fuera las tablas de mezcla y `mis_mezclas`; la mezcla lleva `empresa_id` en `materiales`; acordes y «no lo tengo» como materiales tuyos, «no lo tengo» oculto y convertido en la misma fila al comprarlo; la fórmula lleva categoría, enmienda y concentración en producto (lo primero, porque hoy el motor solo calcula la categoría 4).
- **Decidido, los abiertos:** una sola `vocabularios` con clave (lista, id), `padre_id` y `color` (A11); nombre químico en la identidad y comercial en el producto, los dos buscables (A9); las cifras siguen como están: `numeric` en Postgres, texto en el móvil y fracción exacta en el motor, nunca leídas como decimal (A3, propuesta de la sesión frente a los enteros escalados de la v2); la ficha es una tabla que escribe el script y al móvil bajan la ficha, la composición resuelta, la regulación en uso y lo tuyo.
- **Aprobado con comprobación pendiente:** la regla contra el doble cómputo (dentro de un estándar, si el material entra por su CAS, sus constituyentes no suman a ese estándar), a contrastar con la guía de IFRA, F-001 y los 15 casos al construir el motor (A7); las familias en dos niveles con el general como suma de sus hijas, a probar con datos antes de fijarla (A10).
- **Abierto:** si un aceite con entrada propia de alérgeno se declara además por sus constituyentes; hay que leer el anexo del reglamento 2023/1545, que desde la sesión no se pudo abrir (A8). La escala de potencia sigue sin propuesta.
- **La evaluación de la radiografía v2** (2026-10-22, 00:09), que pasó el usuario, encontró tres fallos y cinco puntos más. Corregidos como **propuesta de la sesión**: la ficha va por material y producto, con la composición resuelta en una tabla nueva, `ficha_composicion`, que baja al móvil (si no, un frasco de Galaxolide al 50 % en IPM contaba el doble de Galaxolide); bajan también `productos`, `identificadores`, `atributos`, `escalas` y `topes_fabricante`; las columnas de vocabulario se unen por (lista, id) y las listas cortas son valores comprobados; `atributos` enseña sus columnas; `familia_principal` apunta al vocabulario; `alergenos_entradas` gana `condicion`. Quedan 47 tablas y una vista. **Decidido (17:16, tarjeta «¿La ★ de un dato va por material o por material y producto?», opción «Por material y producto»):** una ★ genérica por material y otra por cada producto con datos propios, con un índice único NULLS NOT DISTINCT (Postgres 17); la ficha de tu frasco toma la de su producto y, si falta, la genérica. El punto que pedía guardar las fracciones en partes por mil millones no se aplica: A3 se decidió con la propuesta de la sesión.

**El sistema nuevo, escrito** (2026-10-22). **Literal** (17:17): «vale ahora si considero ya hacer en nuevo sistema de materiales para ya, con una referencia clara que explique como funciona y finalmente se importara todo el scrapd de perfumate a ver como resulta».

- **Hecho:** lo común del esquema, en 33 tablas en un esquema de Postgres aparte, `common`, al lado de las de hoy, que no se tocan; la carga por tandas (`npm run datos:cargar-comun`) y la ficha que escribe el script. Referencia: `sistema-materiales.md`. Tanda 20 (la base: IFRA y tus familias reordenados) y tanda 21 (PerfuMate), **sin aprobar**; cómo resulta, en `migracion-v3/tandas/21-perfumate/resultado.md`.
- **Propuesta de la sesión, sin confirmar:** las tablas con nombre en inglés (el código va en inglés); si un material tiene una sola entrada en una fuente, lo que dice es del material aunque nombre un proveedor; las familias de PerfuMate bajo tus nueve según lo que cubre cada una en tu paleta; la especie de un natural, leída de sus sinónimos en latín o del anexo de IFRA; la ★ cuando hay una sola afirmación o todas concuerdan, y «en disputa» si no.

## V3-71 · Un idioma estándar, el inglés, para la app y sus datos; las familias, como las da cada fuente (decidida por el usuario el 2026-10-22)

**Respuesta literal** (orko kill, 2026-10-22 18:20):

> vale una cosa mas importante que no mencione tanto los materiales como la app en general las familias y demas tienene que tener un estandar de idioma sino luego da mucho problema, todo el texto de la app al ingles, lo sacado de perfumate tambien. luego en cuanto al modelo de materiales perfecto de momento guardamos las familias como hace en la fuente original cuando haya mas fuentes se acabara mirando cuantas se tienene que estandarizar en la misma y tambien si vale la pena simplificarlas en menor cantidad de tipos, de la misma manera que se paso de los 20+ tipos de FIG a los 7 tipos de la app en cualquier caso la traduccion de las familias pasa a luego la traduccion del idioma ahora y cuando este todo el estandar listo se mira de mudar todo al sistema

**Lectura** (la sesión, para que la confirmes):

- **El idioma estándar es el inglés**, para los datos (familias, vocabularios, atributos, descripciones) y para el texto de la app (la interfaz). Lo de PerfuMate entra tal como viene, en inglés. Cambia la regla de `v3/CLAUDE.md` («la interfaz, en español»). La documentación y la conversación siguen en español.
- **Las familias se guardan como las da la fuente**: las de PerfuMate son términos suyos, sin ponerlas bajo tus nueve. Cuando haya más fuentes, se verá cuáles se unen y si se simplifican en menos tipos (como de los más de 20 del FIG a los de la app). Eso deja abierta A10 (familias en dos niveles).
- **Primero, la traducción de la app; después, la estandarización de las familias; cuando el estándar esté listo, se muda todo al sistema nuevo** (lo de la app actual y tus datos).
- **Propuesta de la sesión:** tus nueve familias de la paleta (V3-38) no entran de momento en la lista común de familias del sistema nuevo; siguen en la app actual con su color. Tus propios nombres (el de un material tuyo, una nota, una fórmula) no se traducen: son tuyos.

## V3-72 · El orbe del material: una firma visual por material, en las listas y al frente de la ficha (propuesta de la sesión, 2026-10-22; prototipo, sin confirmar)

**Palabras literales del usuario** (orko kill, 2026-10-22, en el hilo de la auditoría de diseño):

> New feature, as a prototype: the material orb. It replaces the family pie chart on list rows and leads the material sheet (F-13 L3 on the V3-70 sheet).

> Before building beyond the prototype, record the orb as decision V3-n with the owner's words.

Y, recogido en la hoja de elecciones de la auditoría (designVault, `00-inbox/research/2026-10-22-perfumeria-audit-picks.md`, §4): «esto también sirve de guía a cómo hacer las fichas de materiales de una mejor manera, no como los listados de ahora que hay en la app, que son una tabla con letras».

**Lectura** (la sesión, para que la confirmes):

- **Qué es:** cada material tiene un orbe en un marco oscuro. Sus colores son tus nueve familias (V3-38), nunca el código de color de PerfuMate; la densidad del color, la potencia; el halo en el marco, la difusión; la luz de dentro, la luminosidad; el contorno, el tipo (puro = esfera; natural = borde orgánico; absoluto o resinoide = más); el peso, la nota; la deriva, la duración en tira (solo en la ficha).
- **Reglas:** lo desconocido nunca vale cero (sin dato, el orbe queda neutro y la ficha dice «no data»); el orbe es decorativo (`aria-hidden`) y lo que dibuja también se dice en texto; IFRA y seguridad nunca van en el orbe; en las catas, solo después de revelar el nombre.
- **Prototipo hecho** (rama `claude/design-audit-fixes`): el código del kit de la bóveda copiado en `v3/src/glossary/orb/` (sin importar nada de la bóveda); una imagen fija en la esquina de cada tarjeta del glosario y el orbe animado al frente de la ficha, con lo que dibuja en texto al lado. Lee los campos de hoy del glosario (familia, fuerza por rango, tipo, nivel, tenacidad) en un solo sitio, `fromCatalog.ts`, que pasará a leer las fichas de V3-70.
- **Abierto, para el usuario:** cómo se reparten las 24 familias de PerfuMate entre los nueve colores (V3-71 las guarda como las da la fuente) y de dónde sale la luminosidad (una marca de descriptor, como limpio, almizclado o aldehídico, o un valor tuyo por material). Hasta entonces el orbe no dibuja luminosidad ni difusión (la difusión de hoy es texto libre).
- **El orbe en la tarjeta, al revés (2026-10-23).** Palabras literales del usuario: «for the orb i think the other way around works better the orb in big size and on the corner overlapping hte orb the abreviation, or maybe even inside the orb on black letter the abrebiation as if it were written over the orb». Hecho, a prueba: el orbe ocupa el sitio del icono (96 px, sobre el blanco de la tarjeta, sin marco oscuro) y la abreviatura va escrita encima. Las letras son negras donde el orbe es lo bastante claro para 4,5:1; si no, blancas, y con un borde suave cuando ninguna llega en todo el orbe (`orb/orbInk.ts`, medido sobre la imagen pintada). En el glosario de prueba, 57 de 60 salen negras sin borde. «Lo tengo» pasa a ser un anillo del color de la familia; las iniciales (sin abreviatura), en cursiva. La otra opción, la abreviatura en una etiqueta en la esquina del orbe, se enseñó en captura y no se construyó.
- **No se construye más allá del prototipo** hasta que confirmes esta decisión.
- **Cambiado por V3-73 (2026-10-23):** las letras encima del orbe se quitan; el orbe va enmarcado, con el texto al lado.

## V3-73 · El rediseño «Molecule poster»: tokens, barra lateral, el orbe enmarcado y el banco en una sola página (decidida por el usuario el 2026-10-23)

**Palabras literales del usuario** (2026-10-23):

Sobre la barra de añadir (02:17):

> en la parte de las diluciones registradas claramente no son usables las pestañas estan mal puestas y creo que la mejor solucion es que apareciaran en botones al seleccionar los materiales de manera clara las diluciones en las que esta el materialcon la opcion solo de puro y la de escoger la dilucion con numeros aqui por ejmplo los principos de diseño se caen deberia estar a la derechel numero del peso 10% y debajo puro, a la derecha de eso para selecionar dos botones de las diluciones que tienes si hay mas un desplegable, un + a la derecha que te mande a crear una nueva dilucion si quieres hacer una nueva, a la derecha de eso el selector de diluyentes con opciones que permitan añadir la cantidadd de diluyentes que tiene la mezcla, y luego a la derecha el boton de agrgar, el tema de la estrella quizas ya sobra porque se dan de alta las diluciones que tienes que ya es un sistema mejor que la estrella... todo esto son cosas que con uso de referentes y principios de diseño en el vault la auditoria deberia cazar para temas de usabilidad....

Lo elegido en el prototipo del rediseño (03:20):

> Direction: Molecule poster · Type: Atkinson Hyperlegible Next · Navigation: Sidebar · Density: Comfortable · Orb on cards: Framed, text beside
> lo unico es que el verde de este formato no me acaba de gustar pero esta bien de mometno esto si es un upgrade drastico lo del color se puede dejar pasar y albunos otros upgrades tambien pueden venir pero de momento subit esto a todo mejoraria mucho
> […]
> las letras encima al menos por ahora no quedan bien asi que se queda marco
> luz por descriptores me gusta al final hay algunos que claramente les pega la luz y otros que no por ejemplo si es difusivo y algo como ethylin brassylate pues me cuadra que la tenga, aldehidico quizas tambien,,, hay que ver que parametro cuadra mas, dicho esto son las cosas mas nitpicking en realidad yo diria que prioridad es navegacion distribucion de espacios como se ve usabilidad... es lo que prima ahora

El banco (03:59):

> history si que quiero conservar el feature de antes donde salen los agregadosa abajo, en cuanto a composicion hay cosas que no se pueden perder aunque cambie la distribucion como el boton de añarid un material que ya esta en la composicion […]
> lo de usual use y material y demas creo que deberia quedarse solo en lo que adjunto tercera captura y vivir debajo del selector de materiales peara ver el usual use mientras agregas incluso en el movil, entoces la fila de history ocmo hasta ahora y en el movil se queda flotando en la parte de debajo de la pantalla aun cuando scrolleas, la parte de history se quita de lo azul y va a lo rojo la de los porcentajes de materiales debajo de la tabla de busqueda para que cuando pones la cantidad veas como se ajusta al uso y la parte de material en general sobra asi que lo azul queda solo charts y futuramente pondre el odor map que diseñe

Las familias (04:01): «lo de las familias on hold se resuelve mas adelante».

Portarlo (10:21): «seria ideal si puedes de momento portar todo el prototipo del revamp a la app y luego si hay mas cambios o retoques se llevan, esto ya seria un upggrade que ya queiro tener y todo lo nuevo se acabara haciendo a futuro».

**Lectura** (la sesión, para que la confirmes):

- **Estilo:** dirección «Molecule poster», letra Atkinson Hyperlegible Next (las cifras, en Geist Mono), navegación en barra lateral, densidad cómoda. Los valores salen de la bóveda de diseño (designVault, `50-tokens/products/perfumeria.json`, D-0010; antes D-0005) y la v3 tiene su copia en `src/theme/tokens.css`. **El verde del acento es provisional.**
- **El orbe va enmarcado, con el texto al lado:** cambia V3-72 (se quitan las letras encima del orbe; `orbInk.ts` desaparece). La luz por descriptores gusta; qué parámetro la da sigue abierto.
- **Las familias, en espera** (cómo van las de las fuentes en los colores).
- **La barra de añadir**, de izquierda a derecha: material; cantidad; el % de la dilución con «Puro» debajo; tus diluciones del material como dos botones y «Más» si hay más; un «+» para una dilución nueva; los diluyentes, con «+ Diluyente» para los que tenga la mezcla; «Añadir». **Sin estrella.**
- **El banco:** el historial sigue abajo, como estaba, y en el móvil flota abajo al desplazarse. La composición conserva «añadir otra vez» y lo demás. Lo que lleva la fórmula del material, su margen IFRA y su uso habitual viven bajo el selector de material, en vivo mientras se escribe la cantidad, también en el móvil. La tarjeta del material sale; la columna lateral, solo gráficos (con el veredicto de IFRA) y un hueco para tu mapa olfativo.
- **Hecho** (rama `claude/revamp-molecule-poster`, sin fusionar ni publicar): tokens y letra; barra lateral (se pliega; plegada en el banco) y, en el teléfono, la barra de abajo de F-03; Inicio con cifras grandes; Materiales con el orbe enmarcado y filtros en píldoras; la ficha con el orbe vivo y cuatro datos (familia, fuerza, duración en tira, nota); Formulación con la lista de bancos y el banco abierto al lado; Diluciones con la lista y el frasco al lado; Catas a todo el ancho; el banco en una sola página (cabecera, frasco y gramos en una fila, barra de añadir, composición y detalle de IFRA al lado del veredicto y los gráficos, historial fijo abajo) y los orbes en la composición, el historial y la barra.
- **Propuesta de la sesión:** el «+» de dilución abre «Diluciones · nueva» con el material elegido; el frasco y sus gramos, en una fila bajo la cabecera (el prototipo no los tenía); el detalle de IFRA, bajo la composición. En el teléfono se queda la barra de abajo de la auditoría (F-03), no la del prototipo.
- **Cambiado por V3-75 (2026-10-24):** el acento ya no es el verde provisional: es la tinta, y el color queda para las familias.

## V3-75 · La pasada de la bóveda del 2026-10-24: tus elecciones sobre la v3 publicada (decidida por el usuario el 2026-10-24)

**Palabras literales del usuario** (2026-10-24, en el hilo de la bóveda de diseño):

Lo elegido en la maqueta de decisiones (19:27):

> D1-pad · D2-button · D3-toast · D4-skeleton · D5-read16 · D6-ink · D7-wheel · D8-strip | fixes: tabs, play | look: mol/atk/side/comfy/ten

El historial (19:30):

> solo que para history hay que buscar 2 cosas por un lado que verticalmente ocupe menos y por otro lado que se vea mas unido como uuna lineaya sea por puntos abajo o algo asi, toma referencia el espacio y la distribucion de como estaba en la app v2 para lo que al espacio y donde estan los materiales se refiere history puede ir ala altura de materiales el play tambien y el recuento de cambios en un cuadrito a la derecha de manera que todo ocupe lo mismo que el espacio en vvertical que ocupan el propio hsitorial

Llevarlo a la app (19:46), tras preguntarle si aceptaba la regla del color (designVault D-0008):

> si acepto de momento el revamp puedes llevarlo a cabo ya? empezarlo

**Lectura** (la sesión, para que la confirmes). El informe es `design-audits/2026-10-24-perfumate-v3-vault-pass.md` del proyecto; la maqueta construida, claude.ai/artifact/5TiLmWrmfj7YcJ9Z9133Cx.

- **El historial del banco, en una fila** (D1 y tu mensaje de las 19:30): 72 px de alto; ▶ a la izquierda; los pasos unidos por una línea, con un punto debajo de cada uno, relleno hasta el paso que miras y hueco después; el recuento en un cuadrito a la derecha. El foco del teclado ya no queda debajo del historial.
- **El acento es la tinta** (D6): el color queda para las familias, y botones, selección, foco y errores van en tinta (designVault D-0008, aceptada). Cierra «el verde del acento es provisional» de V3-73.
- **Leer a 16 px** (D5): la ficha del material y las notas de una cata.
- **Los cuatro recuentos de Inicio, en una franja** (D8): un panel con líneas finas entre ellos.
- **Quitar una línea del banco y archivar un frasco lo dicen, con «Undo»** (D3): el aviso se queda hasta cerrarlo; en el banco dura mientras quitar esa línea sea el último cambio, y en Diluciones saca el frasco del archivo.
- **Las pestañas de Catas responden a las flechas, Inicio y Fin** (arreglo «tabs»), como ya hacían Materiales y la biblioteca.
- **Sin cambio en la app:** D2 (la fila de la composición ya se abre con un botón), «play» (▶ ya mide 44 px en la app) y D7 (el orden de las familias en los filtros sigue el de la paleta, V3-38). El aspecto («look») es el de V3-73; «ten» (diez familias en la maqueta) no se lleva: las familias siguen en espera (V3-73).
- **Siguiente:** D4, los estados de carga (esqueleto), primer uso y error de cada pantalla, en otra PR. Los errores irán en tinta con icono y palabras (D-0008); hoy son rojos.
- **Propuesta de la sesión:** el aviso es un componente propio (`src/Toast.tsx`), no el de React Aria que dice el borrador de la bóveda: añadir esa dependencia sería una decisión nueva. Las teclas de las pestañas son una función con pruebas (`src/tabs.ts`) que comparten las tres pantallas.

---

## Pendientes

- **Las preguntas de «Antes de empezar» están cerradas** (V3-12 a V3-20), y la bandeja del laboratorio, llevada (V3-23 a V3-26).
- Después, la fase 0 del plan ejecutivo.
