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

## Pendientes

- **Las preguntas de «Antes de empezar» están cerradas** (V3-12 a V3-20), y la bandeja del laboratorio, llevada (V3-23 a V3-26).
- Después, la fase 0 del plan ejecutivo.
