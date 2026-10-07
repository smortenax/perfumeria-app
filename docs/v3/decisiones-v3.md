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
| M6 · Productos, lotes, topes, concentración por producto | Sin tabla `products` (§45). **Qué pasa con los 89 productos que ya hay es la decisión V3-2** |
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

**Huecos que el plan no contradice y que resuelvo dentro de sus tablas** (defaults de la sesión, sin tablas nuevas):

| Punto | Default |
|---|---|
| M1 · Sustancias y alias de CAS | **No hace falta tabla:** en la v2 las 3074 sustancias tienen un solo CAS cada una, todas `principal`. Una sustancia es un material de tipo `substance` |
| M3 · Grupos combinados (089) e isómeros de un estándar | `group_key` con una sola regla: **se suma la parte de cada miembro sobre su propio techo, y el grupo no pasa de 1**. Con techos iguales es lo mismo que sumar masas, así que vale para los dos casos |
| M4 · Condiciones (D11) | Dos valores más de `kind` en `regulations`: `requirement` (lo que pide el estándar) y `requirement_met` (quién dice que se cumple, con su autoridad y fuente). Producto o lote = probada; literatura o consenso = supuesta; sin fila = pendiente |
| M5 · Cobertura | **Una columna `coverage` en `materials`**, que calcula el script con la misma regla que hoy (`src/v2/to-ifra.ts`). Sin ella, el §31 del plan no se puede cumplir. Un material privado nace `unknown` |
| M8 · Enmienda | Una columna `amendment` en `regulations`. La Fase 7 de la v2 (la enmienda siguiente) la necesita |
| M10 · Origen (D7) | Columna `origin` en `materials` |
| M11 · Ids estables | `uuid` + columna `ref` con el id de la v2 (`M00001`). El script actualiza por `ref` |
| F8 · Disolventes | `kind = 'solvent'` para DPG, alcohol, IPM, DEP, TEC, triacetina y BB |
| H2 · Exactitud por la API | `numeric` y `bigint` viajan como texto; el dominio los convierte a `Ratio` y `bigint` |
| Fórmula congelada | Sus proporciones son fracciones exactas (1/3). En `numeric` se guardan con 30 decimales: el error es menor que 10⁻³⁰ de la mezcla. *Es la única concesión a «proporciones exactas», y la marco para que la veas* |
| Los demás de la revisión (H3–H6, H8, H9, H11–H13) | Como estaban en el §5.2 de la revisión |

**Tipos de material** (`materials.kind`, propuesta de la sesión): `substance`, `natural`, `base`, `solvent`, `provisional`, `frozen` (fórmula guardada como material).

---

## Pendientes, de una en una

### V3-2 · ¿Qué pasa con los productos de la v2? *(siguiente)*

Hoy hay 89 productos (con sus certificados), 13 topes de fabricante y 10 concentraciones por defecto. El plan no tiene productos.

| Opción | Qué pasa |
|---|---|
| **A · Cada producto entra como un material global propio** *(recomendada)* | Su certificado es su composición y su tope, una regulación `manufacturer` de ese material. No se pierde nada, y cuando haya `products` (§46) el paso es mecánico. Ej.: «PEPPER BLACK ABS PG (Firmenich 974644)» es un material aparte de «Pepper black absolute» |
| B · Sus cifras se pliegan en su material general | Más simple en el buscador, pero dos productos de un material chocan, y el tope de un fabricante pasaría a valer para todo el material (lo que la v2 corrigió) |
| C · Se quedan en los CSV hasta que exista `products` | No se pierden, pero la v3 empieza sin los certificados que ya revisaste |

Bloquea la importación de los productos, no el esqueleto. **Mientras tanto, sigo con A.**

### V3-3 · La capa de nombres y la visual

El buscador, los iconos, las familias y el uso habitual salen hoy del glosario de la v1 (congelado). El plan solo tiene `name`. Lo planteo cuando llegue la importación. **Default:** una tabla de nombres para que el buscador encuentre por nombre comercial, sigla y sinónimos desde el primer día; familias, uso y duración, cuando se rehagan los gráficos y la barra de uso.
