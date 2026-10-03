# Decisiones de la v2 del modelo de materiales

Aprobadas por el usuario el 2026-10-02, al abrir la v2. Esta es la autoridad de la v2
(`CLAUDE.md`, «Trabajo en la v2»). Si una tarea choca con algo de aquí, se para y se pregunta.
Una decisión nueva entra con su porqué y de dónde sale.

## D1 — Identidad de un natural

Un natural se identifica por **especie + parte + proceso + quimiotipo**. El **CAS** y el **INCI**
son atributos, no la clave. La clave técnica es un id estable de `datos/v2/registro-ids.csv`,
asignado una vez y nunca recalculado.

## D2 — Un placeholder nunca da «dentro»

Un placeholder (autoridad `literatura` o `consenso`) **nunca da «dentro»** en IFRA. Como mucho
da **«acotado»**, usando el **máximo de su fuente**.

## D3 — Proveedor y lote

El proveedor se modela **a nivel de producto**. El **lote es un campo opcional** del producto.

## D4 — Tope del fabricante

El tope del fabricante es **del producto**, no de la sustancia. Si se **conoce su causa**, se
modela como **constituyente**.

## D5 — Alcance del modelo y de los datos

El **modelo** cubre **todas las categorías IFRA** y los **alérgenos UE**. Los **datos**, de
momento, **solo la categoría 4**.

## D6 — Fuentes de investigación

Las investigaciones pasan a `datos/fuentes/`, cada una con su **estado de revisión**. **Solo
entra en los datos lo revisado.**

## D7 — Molécula sin documentos de su producto

Decidida por el usuario el 2026-10-03, al revisar la comparación de la fase 2 (su pregunta A).

Una molécula sin documentos de su producto cuenta como **su sustancia pura, por convención**. La
ficha lo enseña como «pura por convención, sin documentos», y no deja pendiente.

**Excepción:** si su `origen` es `aislado-natural`, o si está en la lista de moléculas con
impurezas reguladas conocidas (`datos/v2/impurezas-conocidas.csv`, cada una con su documento),
deja un pendiente de «impurezas sin declarar».

**Por qué:** exigir documentos a cada molécula dejaría casi todo pendiente, y una síntesis pura es
el caso normal. Pero la comparación de la fase 2 enseñó que un aislado natural puede traer
impurezas reguladas, como el metileugenol que la v1 atribuía, por error, al linalol. Por eso la
convención se dice en la ficha y no se aplica a lo que se sabe que no la cumple.

Cada material `sustancia` lleva `origen` (`sintetico`, `aislado-natural` o `desconocido`), con su
fuente en las notas. `desconocido` sigue la convención.

## D8 — La dilución no es un dato del modelo

Decidida por el usuario el 2026-10-03.

La dilución no es un dato del material ni del producto. Se pone en la barra de la app al pesar
(porcentaje y diluyente), y **todo material y todas sus reglas van al 100 %**. `productos.csv` no
lleva `dilucion_pct` ni `id_diluyente`.

**Se mantiene** la regla de pasar a materia pura las cifras de un certificado de un producto
diluido (decisiones v1, P62): el certificado habla de lo que hay en el frasco, y el modelo guarda
materia pura.

**Por qué:** la dilución con que se compra un producto no cambia lo que es, y el usuario ya la
elige en la app cada vez que pesa. Guardarla en el modelo la duplicaba y la dejaba caducar.

## D9 — Documentos de otro proveedor

Decidida por el usuario el 2026-10-03, al cerrar el lote 3c. Sustituye el «no traer» de D3 para
estos casos. Un documento que la v1 colgaba de un material y que no es del producto del usuario es:

- **de otro material:** se descarta y se apunta en `errores-v1.md`;
- **de otro proveedor (el mismo material):** se trae como **placeholder**, con autoridad
  «literatura», contando su máximo (D2), si el documento está **revisado** (D6). La clasificación y
  la revisión van en `docs/v2/documentos-ajenos.csv`. Su cobertura es la que declara el documento
  (`parcial` el certificado, `solo-alergenos` la lista de alérgenos): no prueba que el lote del
  usuario no lleve más, así que no cierra la lista.

**Por qué:** una cifra de otro lote del mismo material es mejor cota que ninguna, pero no es un dato
del usuario. Los cuatro documentos de los lotes 3a y 3b que se descartaron con la regla vieja
(alfa-amil cinámico, Safraleine, Polysantol y Sandalmysore Core) serían de otro proveedor con este
criterio: no se han reabierto.

## D10 — Fototóxicos con furocumarinas (STD 089)

Decidida por el usuario el 2026-10-03. IFRA dice en el 089 y en el estándar de cada aceite que la
suma de los fototóxicos con furocumarinas, cada uno en % de su techo, no pasa del 100 %, y que el
estándar propio de un aceite vale cuando sus furocumarinas no se conocen.

- Son miembros del 089: los **ocho aceites con estándar propio** (086, 087, 088, 090, 091, 092, 093
  y 096), los **tres con nivel típico** (petitgrain de mandarina 50 ppm, tangerine oil cold pressed
  50 ppm y hoja de perejil 20 ppm; `docs/v2/niveles-tipicos-089.csv`) y **cualquier material con 5-MOP
  documentado**. Los demás cítricos, la naranja dulce y «Mandarin oil» incluidos, no.
- El **5-MOP** (techo de 0,0015 %, 15 ppm) es otro miembro del mismo grupo combinado. Cada aceite
  entra **por una vía, nunca por las dos**: por su estándar propio si su 5-MOP no se conoce, o por su
  5-MOP si está documentado.
- El motor suma el grupo (`IfraSubstance.combined`, `IfraReport.combinedChecks`) en el informe y en el
  margen. Los niveles típicos entran como composición con autoridad «anexo-ifra».

## D11 — Condiciones probadas, supuestas o pendientes

Decidida por el usuario el 2026-10-03, al preparar el cade (STD 119).

Una **condición** de IFRA (la especificación de un estándar: que el cade es rectificado, que los peróxidos son
bajos, que el atranol y el cloroatranol están bajo su límite, que una bergamota es FCF) tiene tres estados, según
`datos/v2/condiciones.csv` (`id_contenedor, estandar, condicion, autoridad, id_documento, notas`):

- **probada:** hay una fila con autoridad producto o lote y su documento revisado;
- **supuesta, no acreditada:** hay una fila con autoridad consenso o literatura, sin documento. **No bloquea y no
  deja el informe parcial**, pero la ficha y el informe lo dicen (`IfraMaterial.assumed`,
  `IfraReport.conditions[].assumed`);
- **pendiente:** no hay fila. Deja el informe parcial, como cualquier dato que falta.

El texto de un proceso («rectificado») describe el material, pero no prueba nada por sí solo (D1).

**Por qué:** el cade rectificado se infirió de la página de la tienda, sin documento: no es lo mismo que un
certificado, y el modelo tiene que poder decirlo sin dar la condición por probada ni bloquear al usuario.

## D12 — Qué concentración se usa: la del producto que se compra, y el máximo si es incierta (aprobada por el usuario)

Propuesta del 2026-10-03, corregida con el usuario el mismo día y **aprobada por él al empezar la Fase 5**. Se aplicó antes a la pimienta del 4a.

1. **El certificado es del producto tal como se compra** (diluido o no): sus cifras y su tope valen tal cual
   (`pct:100`) y la barra va al 100 % **de ese producto**. No hace falta saber su % de materia pura. La pimienta
   (Firmenich 974644, «PEPPER BLACK ABS PG» en su certificado) entra así, con la nota «cifras del producto tal como se
   compra; se pesa al 100 % del producto».
2. **El certificado es de otra concentración que la que se pesa**: se pasa a materia pura con el **mínimo** de materia
   pura que puede tener (la cifra en materia pura sale lo mayor posible) y su tope, multiplicado por ese mínimo
   (lo menor posible).
3. **Lo incierto es la concentración al pesar** (un «25-50 %»): la barra usa el **máximo** (50 %), el peor caso para IFRA.

**Por qué:** lo desconocido no vale cero ni se pinta en verde (§1.2, §5.5), y una cifra de certificado solo se
convierte cuando se sabe que es de otra concentración que la que se pesa.

### Rangos de una SDS, junto a D12 (aprobada por el usuario)

- La sustancia que **es el propio material** (Helional «≥50», Calone «99-100») o **su dilución** (Aldambre, 25-50 % en DPG)
  **no son composición** (D8): no entran como cifras. La dilución del Aldambre va a la barra con su máximo, el 50 % (punto 3).
- **Solo entra el rango de otra sustancia regulada** que la SDS liste: tipo `rango`, autoridad `producto` si la SDS es
  del producto, o `literatura` si es de otro proveedor (D9); cuenta su máximo y la cobertura queda `parcial` (una SDS lista
  solo lo clasificado).
- En el lote 4b no entra ningún rango.

## D13 — Una fórmula de la v1 migra al producto que tengo (aprobada por el usuario)

Decidida por el usuario el 2026-10-03, al preparar la Fase 5 con su biblioteca de fórmulas.

> La fórmula se migra al producto que tengo, no a la fila de la v1. Si en mi inventario (`mis-productos.csv`) hay un solo
> producto que corresponde al material de la v2, se migra a él; la discrepancia de forma o de CAS con la fila vieja es un
> error de la v1 (`errores-v1.md`, una línea por fila) y mi confirmación queda en la columna nueva, con esta regla como
> motivo y la fecha de hoy. Si tengo dos productos posibles, se pregunta.

Cómo se aplica (`datos/v2/v1-a-v2.csv`, columnas `id_producto`, `confirmado`, `motivo`):

- Una fila de la v1 enlazada con un material tiene **producto**: el único del material; si el material tiene dos, el que
  esté **en uso** (así lo dijo el usuario para el benjuí: solo el resinoide de Olfatorium); si hay más de uno en uso, no
  migra y se pregunta. La columna `id_producto` lo fija.
- Con **CAS igual** migra sin más. Con **CAS distinto o ausente** (una fila que el usuario confirmó, un material provisional,
  la clave de un certificado) migra solo si la fila lleva `confirmado` y `motivo`; si no, aviso y no se adivina.
- Las filas confirmadas salen de `docs/v2/enlaces-biblioteca.csv`, que `alta.py` vuelca. Lo que no está enlazado se queda en
  la v1 «sin revisar» y nunca migra a otro material.

## Jerarquía de autoridad

De mayor a menor; cuando dos fuentes chocan, manda la de más arriba:

1. **lote** (certificado del lote concreto)
2. **producto** (ficha o certificado del producto)
3. **anexo IFRA**
4. **literatura**
5. **consenso**
6. **desconocido**

`literatura` y `consenso` son las autoridades de los placeholders (D2). Lo **desconocido nunca
vale cero ni se pinta en verde** (decisiones v1, §1.2 y §5.5).

## Reglas que se derivan

- IFRA limita por **grupo regulador (estándar)**, no por CAS; las sustancias tienen alias de CAS.
- Cada cifra de composición lleva **valor, tipo** (`tipico`, `maximo`, `rango`), **autoridad** y
  **documento de origen**.
- El uso habitual y la duración son otra capa, con su base, y no se mezclan con IFRA.
- Los datos los escribe un script determinista. Cada conflicto va a
  `datos/v2/conflictos/<lote>.csv` y lo decide el usuario. `npm run validar:v2` pasa antes de
  cada commit de datos.
