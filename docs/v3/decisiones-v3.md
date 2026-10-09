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
- **Sin conexión:** la v3 necesita conexión. El «offline completo» queda fuera, como dice el plan (§45). *Si con «uso offline» querías decir que tiene que seguir funcionando sin red, esto cambia.*

**Por qué** (del mensaje): se ha decidido por numerosas razones que las ideas nuevas funcionan mejor.

### Qué contesta esto de la revisión

| Decisión de la revisión | Queda |
|---|---|
| 1 · ¿Siguen vigentes las de la v2? | **Manda el plan** (V3-1) |
| 2 · Dónde viven los datos de referencia | **CSV en el repo → scripts → Postgres.** Es lo que dice el plan (§40) |
| 3 · Modelo de materiales | **El del plan: 5 tablas** |
| 4 · Sin conexión | **Hace falta conexión** (§45 del plan) |
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
| H1 · Sin conexión | Hace falta conexión |
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

## Pendientes

- Las preguntas del §7 de [`modelo-materiales-v3.md`](modelo-materiales-v3.md), de una en una. La siguiente: cómo se hace tu versión de un material común (7.2).
- Confirmar la lectura de «uso offline pero mediante hosting» (V3-1): que la v3 necesita conexión.
