# Auditoría del esquema de materiales · v2

Oct 22, 2026 · @S Mort

## Estado del consenso

Tras tres rondas, los 24 cambios están aceptados como dirección y quedan 11 puntos abiertos. Ninguno cuestiona la arquitectura: son cinco decisiones tuyas, dos comprobaciones en fuentes primarias, una regla por escribir, dos preguntas que ya estaban pendientes en V3-70 y una discrepancia con tu revisión. Esta v2 sustituye a la auditoría y a las dos revisiones; lo que no está aquí, no cuenta.

| Ronda | Qué hizo | Resultado |
| --- | --- | --- |
| 1 · Auditoría | Leyó el dibujo y el esquema, sin el código | 24 cambios propuestos |
| 2 · Tu revisión | Contrastó con el código de la v3 y con PowerSync | 19 aceptados tal cual, 5 con matiz; 3 errores de recuento; 5 cosas que la auditoría no ve |
| 3 · Revisión de la revisión | Contrasta la ronda 2 | Acepta todo salvo un punto; añade 3 reglas y una forma de cerrar dos matices |

**Cómo sigue:** en la ronda 4 respondes en la columna «Tu respuesta» de los puntos abiertos. Lo que marques «De acuerdo» pasa a cerrado; lo demás, con tu motivo, va a la v3. Se para cuando no quede nada abierto.

## Revisión de la revisión

Tu revisión acierta en todo lo que corrige, porque parte del código de la v3 y la auditoría solo vio el dibujo. La acepto salvo en un punto (familias en tablas propias); lo que sigue son tres añadidos, una forma de cerrar dos de sus matices y esa discrepancia.

### Lo que acepto sin cambios

- **Los 3 errores de recuento.** Ya corregidos en la v1: 45 tablas y 2 vistas antes de esta ronda.
- **F4 y F5 no eran fallos de la app.** El motor de la v3 ya suma por estándar y trata aparte prohibiciones y especificaciones. El cambio queda como «que el esquema nuevo no lo pierda».
- **S1 y S3: atribución errónea.** La tabla por tipo era propuesta de la sesión, no tu decisión, y tu frase sobre las mezclas hablaba del glosario, no de tus acordes.
- **La ficha es una tabla, no una vista materializada.** PowerSync replica desde la replicación lógica de Postgres, y una vista materializada no pasa por ella. La ficha la reescribe el script al aprobar cada tanda.
- **Al móvil bajan la ficha y la composición resuelta**, no las afirmaciones crudas. Añado lo que también necesita el motor sin conexión: los límites de las enmiendas y categorías en uso y tus propias tablas.
- **La prueba de referencia F-001 no se toca al migrar.** Si falla, se explica por qué el resultado anterior era incorrecto.
- **La dilución de tu frasco sigue la regla P14:** tu composición es la del frasco tal como lo tienes; la cifra de dilución es informativa.
- **F1 es lo más urgente:** hoy el motor solo lee la categoría 4.

### Lo que añado

1. **El número exacto no llega al móvil.** Postgres guarda `numeric` sin error, pero SQLite no tiene decimal exacto y el motor en JavaScript calcula en coma flotante. Propuesta: enteros escalados en todas partes. Las masas ya van en µg; las fracciones, en partes por mil millones (0,006 se guarda como 6.000.000). Se pasa a % solo en pantalla.
2. **Regla contra el doble cómputo (tu punto 8).** Dentro de un mismo estándar, si el material entra por su propio CAS, sus constituyentes no suman a ese estándar; para los demás estándares siguen contando. Hay que contrastarla con la guía de IFRA sobre contribuciones de otras fuentes antes de programarla.
3. **El recuento final cambia.** Con la ficha como tabla, el esquema queda en 46 tablas y 1 vista (`mi_ficha`).

### Cómo cierro dos de tus matices

- **Clave de la mezcla (tus puntos 2 y 5).** En vez de sacar la clave del producto, `materiales` lleva `empresa_id`, obligatorio cuando el tipo es mezcla y vacío en los demás. La clave queda `mezcla:empresa:nombre`. Así «la mezcla entra con su fabricante» es una restricción de la base, no una comprobación de la tanda, y la mezcla tiene clave aunque aún no tenga producto.
- **Clave del natural con tratamientos.** De acuerdo: la escribe el script o un disparador, que ordena los tratamientos antes de unirlos. Una columna generada no puede leer otra tabla.

### Lo que sigue sin comprobar

- **Alérgenos (tu punto 3).** Dos fuentes especializadas dicen que un aceite con entrada propia se declara por sí mismo y además por sus constituyentes ([Phoenix Cosmetic Safety](https://phoenixcosmeticsafety.com/blogs/regulatory-compliance/fragrance-allergen-labelling-eu-2026-2028), [Registrar Corp](https://www.registrarcorp.com/blog/cosmetics/eu-26-vs-82-fragrance-allergens/)). No he podido leer el anexo en EUR-Lex: la página no devolvió el texto. Queda abierto (A8).

### Donde no coincido

- **Familias y descriptores en tablas propias (tu respuesta a P9).** Con tablas propias, `equivalencias` tendría que apuntar a una tabla distinta según la lista, o duplicarse por vocabulario. Una sola `vocabularios` con clave compuesta (lista, id) ya impide mezclar listas, y tiene `padre_id` y `color`, que es lo único extra que piden las familias. Propongo mantenerla única (A11).

## Puntos cerrados

Los 24 cambios quedan aceptados con esta redacción final. Donde dice «A#», la forma exacta depende de un punto abierto, pero la dirección ya no se discute.

| # | Cambio | Resolución final | Depende de |
| --- | --- | --- | --- |
| P1 | Sustancias como núcleo | `sustancias` sale de regulación y guarda la química (fórmula, peso, SMILES, InChIKey, CID). IFRA sigue uniéndose solo por CAS | — |
| P2 | Cabecera de composición | `composiciones` + `composicion_lineas` | — |
| P3 | Listas en afirmaciones | `afirmacion_terminos` para atributos de lista | A5 |
| P4 | Tus cambios como dato | `mis_afirmaciones` con la forma de `afirmaciones` | A2 |
| P5 | Condición en columnas | Dilución, disolvente, temperatura, presión, soporte | — |
| P6 | Tandas | Ampliar lo que ya existe en la v3 (`tandas.csv`, `data_version`) con `tanda_id` en cada fila del glosario | — |
| P7 | `fusionado_en` | Redirección del material fusionado; nunca se borra | — |
| P8 | Clave de identidad | Única; la escribe el script o un disparador. La de mezcla, `mezcla:empresa:nombre` | A6 |
| P9 | Vocabulario por lista | Clave compuesta (lista, id); si familias y descriptores van aparte, se decide en A11 | A11 |
| P10 | Unidad única | Fracción en toda la base, con representación exacta en servidor y móvil | A3 |
| P11 | Enmiendas y categorías | Tablas `enmiendas` y `categorias_ifra` | — |
| P12 | Alérgenos por entradas | `alergenos_entradas` + `alergeno_sustancias` | A8 |
| P13 | Foto del informe | `informes_ifra` guarda lo que se usó; el veredicto se sigue calculando cada vez | — |
| P14 | Dilución de fábrica | La composición es la del producto (o de tu frasco) tal como está; la dilución es informativa | — |
| P15 | Copia por dato | `derivada_de` en cada afirmación | — |
| S1 | Puros y naturales en `materiales` | Una tabla con comprobación por tipo | A1 |
| S2 | Quitar las tablas de mezcla | Se quitan; el fabricante pasa a `materiales.empresa_id` para las mezclas | A6 |
| S3 | Acordes y «no lo tengo» | Acordes como material tuyo; «no lo tengo» según decidas | A4 |
| S4 | CAS fuera de `identificadores` | Solo INCI, FEMA, EINECS y sinónimos | — |
| F1 | Categoría, enmienda y concentración en la fórmula | Campos en `formulas`; primera tarea, porque hoy solo se calcula la categoría 4 | — |
| F2 | El material como sustancia | `materiales.sustancia_id`, con regla contra el doble cómputo | A7 |
| F3 | CAS de IFRA resuelto | `ifra_sustancias.sustancia_id` | — |
| F4 | Tipo de estándar | Ya lo hace el motor de la v3; el esquema lo conserva | — |
| F5 | Sumar por estándar | Ya lo hace el motor de la v3; el esquema lo conserva | — |

## Puntos abiertos para la ronda 4

Once puntos, cada uno con una propuesta concreta. Todos los cierras tú salvo A7 y A8; A7 y A8 se cierran comprobando una fuente, y su casilla sirve para aprobar quién lo comprueba.

| # | Punto | Propuesta | Quién lo cierra | Tu respuesta |
| --- | --- | --- | --- | --- |
| A1 | Puros y naturales dentro de `materiales` | Sí, con comprobación por tipo | Tú |  |
| A2 | Lo tuyo en tablas gemelas (`mis_afirmaciones`, `mis_composiciones`) | Sí: se copia la forma, no se juntan las tablas | Tú |  |
| A3 | Cómo guardar cifras exactas en servidor y móvil | Enteros escalados: masas en µg, fracciones en partes por mil millones. La alternativa es texto y una librería decimal en el motor | Tú |  |
| A4 | «No lo tengo» como material tuyo | Sí, oculto en tu lista salvo que lo pidas. Al comprarlo se rellena la compra en la misma fila y cambia el estado, así las fórmulas que lo usan no se rompen | Tú |  |
| A5 | Listas con tabla hija (`afirmacion_terminos`) | Sí: un JSON no deja comprobar que la familia existe | Tú |  |
| A6 | Clave de la mezcla | `materiales.empresa_id`, obligatorio solo en mezclas; clave `mezcla:empresa:nombre` | Tú |  |
| A7 | Regla contra el doble cómputo | Dentro de un estándar, si el material entra por su CAS, sus constituyentes no suman a ese estándar | Comprobar en la guía de IFRA y contra F-001 |  |
| A8 | Aceite con entrada propia y sus constituyentes | Se declaran los dos, según dos fuentes secundarias | Leer el anexo III del reglamento 2023/1545 |  |
| A9 | Nombre de la identidad | Químico en la identidad, comercial en el producto; los dos buscables por `identificadores` | Tú (pendiente de V3-70) |  |
| A10 | Familias en dos niveles y escala de potencia | Familias con padre; el % general es la suma de los % de sus hijas, por fuente, y el consenso se calcula sobre esa suma. La escala de potencia sigue sin proponer | Tú (pendiente de V3-70) |  |
| A11 | Familias y descriptores en tablas propias | No: una sola `vocabularios` con clave (lista, id), `padre_id` y `color`; así `equivalencias` sigue siendo una tabla | Tú (discrepancia con tu revisión) |  |

## Esquema consolidado v2

El esquema queda en 46 tablas y 1 vista, frente a 42 tablas y 3 vistas del modelo base. Respecto a la v1 de la auditoría cambian cuatro cosas: la ficha es una tabla, `materiales` lleva `empresa_id` para las mezclas, `verificacion_ifra` se calcula en la app e `informes_ifra` guarda las fotos.

| Zona | Tablas | Vistas | Baja al móvil |
| --- | --- | --- | --- |
| Apoyo (6) | `fuentes`, `empresas`, `vocabularios`, `equivalencias`, `escalas`, `tandas` | — | `vocabularios`, `empresas` |
| Núcleo químico (2) | `sustancias`, `sustancia_alias` | — | `sustancias` |
| Glosario (15) | `materiales`, `natural_tratamientos`, `identificadores`, `productos`, `documentos`, `topes_fabricante`, `composiciones`, `composicion_lineas`, `atributos`, `afirmaciones`, `afirmacion_terminos`, `relaciones`, `perfumes_referencia`, `apuntes`, `ficha` | — | `ficha`, con la composición resuelta de cada material |
| Regulación (9) | `enmiendas`, `categorias_ifra`, `ifra_estandares`, `ifra_sustancias`, `ifra_limites`, `ifra_anexo`, `ifra_reglas`, `alergenos_entradas`, `alergeno_sustancias` | — (el cálculo IFRA corre en la app) | Todo salvo `ifra_anexo`, solo de las enmiendas en uso; el anexo ya va dentro de la composición resuelta |
| Lo tuyo (14) | `mis_materiales`, `mis_afirmaciones`, `mi_afirmacion_terminos`, `mis_composiciones`, `mi_composicion_lineas`, `mis_documentos`, `mis_limites`, `mis_apuntes`, `diluciones`, `catas`, `evaluaciones`, `formulas`, `formula_eventos`, `informes_ifra` | `mi_ficha` | Todo, filtrado por `owner_id` |

Las afirmaciones crudas, sus fuentes y sus disputas se consultan con conexión. La columna «Baja al móvil» es propuesta de esta ronda sobre tu punto 2; cuenta como cerrada si no la discutes.

## Reglas nuevas de la v2

Se suman a las reglas de integridad de la v1. Las marcadas con un punto abierto entran en cuanto se cierre.

| Regla | Cómo se impone | Origen |
| --- | --- | --- |
| Cifras exactas en servidor y móvil: masas en µg y fracciones en partes por mil millones, enteros | Tipo entero en las columnas; conversión a % solo en pantalla | Ronda 3 (A3) |
| Una mezcla del glosario tiene empresa | Comprobación: `empresa_id` obligatorio cuando `tipo = mezcla`, vacío en los demás | Rondas 2 y 3 (A6) |
| La clave del natural ordena sus tratamientos | La escribe el script o un disparador, nunca la app | Ronda 2 |
| Sin doble cómputo dentro de un estándar | En el motor: si el material entra por su CAS, sus constituyentes no suman a ese estándar | Rondas 2 y 3 (A7) |
| La ficha solo la escribe el script | Escritura de `ficha` solo con el rol del script, al aprobar una tanda | Ronda 2 |
| Tu composición es la de tu frasco tal como lo tienes | Igual que P14; la dilución de tu frasco es informativa | Ronda 2 |
| La prueba F-001 no se cambia al migrar | Si falla, se documenta por qué el resultado anterior era incorrecto | Ronda 2 |
| «No lo tengo» se convierte, no se duplica | Al comprar, la misma fila de `mis_materiales` cambia de estado y recibe la compra | Ronda 3 (A4) |

## Fuentes

- [Auditoría del esquema de materiales (v1)](https://claude.ai/artifact/FioqJSATXxMW96trVgacvu)
- Tu «Revisión de la auditoría del esquema» y el código de la v3 que cita (`v3/src/bench/data/catalog.ts`, `v3/datos/tandas.csv`)
- [PowerSync · vistas y replicación (pg\_ivm)](https://www.powersync.com/blog/using-pg-ivm-to-enable-joins-in-powersync), citado en tu revisión
- [Phoenix Cosmetic Safety · alérgenos UE 2026 y 2028](https://phoenixcosmeticsafety.com/blogs/regulatory-compliance/fragrance-allergen-labelling-eu-2026-2028)
- [Registrar Corp · de 26 a 82 alérgenos](https://www.registrarcorp.com/blog/cosmetics/eu-26-vs-82-fragrance-allergens/)
- [Reglamento (UE) 2023/1545 en EUR-Lex](https://eur-lex.europa.eu/eli/reg/2023/1545/oj/eng) (no se pudo leer el anexo en esta ronda)
