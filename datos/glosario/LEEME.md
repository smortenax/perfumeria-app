# El glosario de materiales

**Es el desplegable del buscador y la base de sus regulaciones (P37).** Tiene todos los CAS
de los que se tiene constancia, cada uno con su abreviatura y su estado frente a IFRA. Lo
genera [`scripts/generar_glosario.py`](../../scripts/generar_glosario.py) a partir de dos
cosas:
- **las filas del FIG con las abreviaturas del usuario**,
  [`origen/fig-materiales-codigos.csv`](origen/fig-materiales-codigos.csv). Es una iteración
  no final: al cambiarla, se vuelve a generar;
- **IFRA, 51.ª enmienda**, de [`../ifra/51/`](../ifra/51/LEEME.md).

**Nada del laboratorio entra aquí.** **No se edita a mano.** Las cuentas de abajo son las de
[`procedencia.json`](procedencia.json) del 2026-09-27.

> Information derived from the IFRA Fragrance Ingredient Glossary, developed by The
> International Fragrance Association.

## De dónde sale cada material

| `id` | Qué es | Cuántos |
|---|---|---|
| `fig:N` | la fila N del FIG, con la abreviatura del usuario | 3119 |
| `cas:CAS` | un CAS de un estándar de IFRA, o una base de Schiff, que el FIG no tiene | 194 |
| `ncs:nombre` | un natural del anexo de IFRA que no tiene fila en el FIG con ese nombre | 57 |

- **De los 3119 del FIG, 2310 no están en nada de IFRA** (`fuentes` = `fig`). Son los que
  faltan por documentar:
  - 1988 moléculas sin estándar propio;
  - 302 naturales sin dato;
  - 20 con una condición por familia.
- **La abreviatura** (`codigo`) es única en todo el glosario:
  - `codigo_origen` = `usuario` en las 3119 del FIG;
  - `codigo_origen` = `generado` en las 251 nuevas, con el mismo estilo y **provisionales**:
    45 llevan un número para no repetirse.

## `estado`: qué dice IFRA de cada material

Lo desconocido nunca se da por libre (§1.2).

| `estado` | Quiere decir | Cuántos |
|---|---|---|
| `prohibido` | su estándar lo prohíbe como tal | 121 |
| `con-techo` | su estándar le pone un techo en % en alguna categoría | 391 |
| `condicion` | una especificación, una variante prohibida o una familia: no es un % | 45 |
| `por-constituyentes` | sin estándar propio, pero el anexo le da constituyentes regulados | 523 |
| `sin-dato` | un natural sin estándar propio y fuera del anexo: no se sabe qué lleva | 302 |
| `sin-estandar` | no está en el índice de IFRA, que es completo: no tiene estándar propio | 1988 |

`condiciones` explica lo que no cabe en un %, con el estándar al lado: especificaciones,
variantes prohibidas, grupos de un estándar, el tope de la nota o la familia. **Una familia
se asigna por el nombre**, y así se dice:
- 089, cítricos, con las flores, las hojas y el petitgrain fuera;
- 184, pináceas;
- 188, ésteres alílicos.

## Los límites

`cat_1` a `cat_12` y `limite_nota` son los del estándar propio del material, con los mismos
valores que en `../ifra/51/estandares.csv`. Si un material tiene dos estándares, cuenta el
más estricto.

**Un natural sin estándar propio no lleva límites aquí.** Su techo sale de sus
constituyentes, y la app lo calcula exacto; así nunca se desfasa de los datos.

## Los constituyentes: [`material-constituyentes.csv`](material-constituyentes.csv)

3303 filas. Una fila es algo regulado que un material lleva por dentro:
- `variante`: el natural del anexo, o la base de Schiff, de donde sale;
- `estandar`: el estándar del constituyente;
- `concentracion_pct`: el % dentro del material;
- `fuente`: `anexo` o `bases-schiff`.

**`coincidencia`** dice cómo se unió el material con el anexo:
- **`nombre`**: el anexo tiene ese mismo natural. Lo cumplen 301 materiales;
- **`cas`**: solo coincide el CAS principal. Cuando ese CAS reúne varias variantes, se
  apuntan todas y **cuenta la peor**. Hay 293 materiales así.
  - Ejemplo: el «Lemon oil» del FIG puede ser el exprimido, la esencia o el destilado del
    anexo.

Los otros CAS de un natural del anexo solo cuentan si además coincide el nombre. Algunos de
esos CAS, como el de *Citrus limon*, sirven para varias variantes, y unirlos por CAS
mezclaría la esencia de petitgrain con la de limón.
