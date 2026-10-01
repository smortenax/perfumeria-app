# El glosario de materiales

**Es el desplegable del buscador y la base de sus regulaciones (P37).** Tiene todos los CAS
de los que se tiene constancia, cada uno con su abreviatura y su estado frente a IFRA. Lo
genera [`scripts/generar_glosario.py`](../../scripts/generar_glosario.py) a partir de:
- **las filas del FIG con las abreviaturas del usuario**,
  [`origen/fig-materiales-codigos.csv`](origen/fig-materiales-codigos.csv). Es una iteración
  no final: al cambiarla, se vuelve a generar;
- **IFRA, 51.ª enmienda**, de [`../ifra/51/`](../ifra/51/LEEME.md): los estándares, el anexo
  de naturales y las bases de Schiff;
- **la Transparency List de IFRA, 2025**, de
  [`../ifra/transparencia-2025/`](../ifra/transparencia-2025/LEEME.md): el listado entero
  de ingredientes;
- **los nombres comerciales**, de
  [`origen/nombres-comerciales.csv`](origen/nombres-comerciales.csv);
- **del laboratorio, solo su categorización propia** (P48): la familia de cada fila del FIG
  y qué filas son naturales, de [`../fuente/`](../fuente/procedencia.json);
- **los usos habituales auditados**, de
  [`origen/usos-habituales.csv`](origen/usos-habituales.csv) (abajo).

**Ningún material del usuario entra aquí.** **No se edita a mano.** Las cuentas de abajo son
las de [`procedencia.json`](procedencia.json) del 2026-09-30.

> Information derived from the IFRA Fragrance Ingredient Glossary, developed by The
> International Fragrance Association.

## De dónde sale cada material

| `id` | Qué es | Cuántos |
|---|---|---|
| `fig:N` | la fila N del FIG, con la abreviatura del usuario | 3119 |
| `cas:CAS` | un CAS de un estándar de IFRA, o una base de Schiff, que el FIG no tiene | 193 |
| `ncs:nombre` | un natural del anexo de IFRA que no tiene fila en el FIG con ese nombre | 57 |
| `tl:CAS` o `tl:nombre` | un ingrediente de la Transparency List que no estaba en nada de lo anterior | 945 |
| `cat:CAS` | un material que solo conoce el catálogo de una casa: [`origen/materiales-de-catalogos.csv`](origen/materiales-de-catalogos.csv), con la página | 3 |
| `tienda:CAS` | una molécula que solo conoce una tienda donde compra el usuario (P55) | 8 |

En total son 4325. **Una fila del FIG es un natural** si el usuario le dio tipo, si el anexo
de IFRA tiene su CAS, o si el laboratorio la cuenta como natural (P48). Así, una goma o un
bálsamo sin tipo no pasa por molécula, que saldría libre (§1.2).

La Transparency List se une así con lo anterior:
- una molécula, por su CAS;
- un natural, por su nombre, o por ser el único de su CAS y de su tipo;
- su nombre, si es distinto, queda en `nombres_transparencia` y también se busca;
- de los naturales, `categoria_iso` apunta la categoría ISO 9235 que dan IFRA o el anexo.

- **354 materiales del FIG no están en nada de IFRA**: ni en sus estándares, ni en su
  anexo, ni en la lista de 2025. **`fuera_de_ifra` dice por qué**: el mismo compuesto u otra
  estereoquímica de uno que IFRA lista, otra forma de un natural que sí lista, o que no
  aparece en la lista de 2025. Ver
  [el ejercicio inverso](../../docs/investigacion/2026-09-27-fig-fuera-de-ifra/README.md).
- **`ifra-alcance`**, en `fuentes`: una molécula que IFRA no lista, pero que es la misma
  que una regulada, con otro CAS o con otra estereoquímica. **Hereda su estándar**, porque
  IFRA cubre su sustancia con cualquier CAS; el motivo va en `condiciones`. Salen de
  [`origen/equivalencias.csv`](origen/equivalencias.csv), que genera
  [`scripts/relacionar_moleculas.py`](../../scripts/relacionar_moleculas.py). Son 7.
- **La abreviatura** (`codigo`) es única en todo el glosario:
  - `codigo_origen` = `usuario` en las 3119 del FIG;
  - `codigo_origen` = `generado` en las 1206 nuevas, con el mismo estilo y **provisionales**.
    331 llevan un número para no repetirse.

## La familia y su color (P48)

**Es la categorización propia del laboratorio** (frente 6, parte B), no la del FIG: interpreta
sus tres descriptores y los contrasta con catálogos de las casas. Ocho familias con color y
un gris, «Transformado», para los olores de calor, fermentación o corte. Llega con
[`scripts/importar_datos.py`](../../scripts/importar_datos.py): la paleta está en
[`../fuente/pieza-11-paleta.csv`](../fuente/pieza-11-paleta.csv).

| Columna | Qué es |
|---|---|
| `familia` | la familia de la fila: Cítrico, Verde, Ozónico, Floral, Frutal, Especiado, Amaderado, Animal o Transformado |
| `matiz` | la segunda familia, si la hay |
| `confianza_familia` | alta, media o baja, según el laboratorio |

**Solo las 3119 filas del FIG tienen familia.** Las demás quedan en blanco: **un hueco, nunca
el gris**, que es una familia.

## Los nombres de uso de PubChem, para buscar

`sinonimos_pubchem` lleva hasta 20 nombres por molécula, de PubChem, filtrados como los
candidatos de los nombres comerciales: sin códigos, números de registro ni nombres
sistemáticos largos. Los nombres químicos cortos se quedan, porque es como se teclean:
«4-Ethylphenol» (P52). Un CAS escrito con ceros de más, «0123-07-09», también se encuentra si
su cifra de control cuadra. **Solo sirven para encontrar**: «Diphenyl oxide» lleva al éter difenílico. Salen
de [`origen/sinonimos-pubchem.csv`](origen/sinonimos-pubchem.csv), que escribe
[`scripts/sinonimos_pubchem.py`](../../scripts/sinonimos_pubchem.py) desde su caché. Los datos
de PubChem son de uso libre.

## Los nombres de las tiendas, para buscar (P55)

`nombres_proveedores` lleva los nombres con que venden cada material **Olfatorium, Maese Lab y
Perfumiarz**, las tiendas donde compra el usuario: «Ambroxan KAO», «Aceite Esencial de Tomillo
Mastichina». **Solo sirven para encontrar**, y el desplegable dice «en tienda: …» cuando el nombre
del glosario no se parece a lo escrito. Salen de
[`origen/nombres-proveedores.csv`](origen/nombres-proveedores.csv), que escribe
[`scripts/nombres_proveedores.py`](../../scripts/nombres_proveedores.py) desde la caché de
[`scripts/traer_proveedores.py`](../../scripts/traer_proveedores.py). Se une así:

- **por el CAS**, tal como lo da la tienda, con la cifra de control comprobada;
- si no está, **por otro CAS del mismo natural en el anexo de IFRA**: la lavanda de Maese Lab
  viene con 90063-37-9, y el anexo lo da como otro CAS de la de 8000-28-0;
- si no, **por la especie de su INCI**: «Thymus Mastichina Herb Oil» es la «Marjoram oil,
  Spanish» del anexo;
- si no, un natural, **por el nombre de uso que PubChem da a su CAS**: el 84929-41-9 de la
  pimienta negra es «Black pepper», que es la «Pepper, black, oil» del FIG. Primero con la
  parte de la planta; si no, sin ella, y solo si queda un natural;
- un natural solo se une a las filas de su forma: el nombre de un absoluto no va al aceite.

Perfumiarz no dice si algo es natural o molécula: lo dice su INCI, químico o botánico, y sin
INCI no se da por sabido. **Una molécula que nada conoce entra como material nuevo**, `tienda:CAS`, con la tienda como
fuente. **Un natural que no se une no entra**: el FIG suele tenerlo con otro CAS, y saldría
doble. Queda en [`proveedores-sin-unir.csv`](proveedores-sin-unir.csv) para resolverlo.

A 2026-09-29: 1183 filas de 754 CAS, de Olfatorium (160 productos con CAS), Maese Lab (387) y
Perfumiarz (513). **923 materiales llevan nombre de tienda**; 8 son nuevos y 45 filas de las
tiendas quedan sin unir.

## El uso habitual, para la franja de la ficha (plan E6)

Seis columnas, **todas en % del concentrado** (la base de la franja de la ficha) y **en blanco
donde el lote no cubre el material: un hueco, nunca cero** (§1.2). Salen de
[`origen/usos-habituales.csv`](origen/usos-habituales.csv), que escribe
[`scripts/usos_habituales.py`](../../scripts/usos_habituales.py) desde dos lotes: el U-001, auditado a mano
([auditoría](../../docs/investigacion/2026-09-30-usos-y-constituyentes/auditorias/U-001.md)), y el U-002,
que trae [`scripts/traer_usos.py`](../../scripts/traer_usos.py) de TGSC y PerfumersWorld por CAS (su
`auditoria` sale por regla, no a ojo: [resumen](../../docs/investigacion/2026-09-30-usos-y-constituyentes/lotes/U-002-resumen.md)).
Además, los **lotes de búsqueda** U-004 y U-005 (P60: una búsqueda web por material, leída del
resumen del buscador): todo lo de la búsqueda de un material cuenta como **una sola fuente**,
«Búsqueda web (dominios)». Los lotes se juntan por material. La regla, con sus pasos, está en el
docstring del script.

| Columna | Qué es |
|---|---|
| `uso_min` | mediana de los mínimos de las filas aceptadas de papel `habitual` o `habitual y techo` (PerfumersWorld) y base `concentrado` |
| `uso_max` | mediana de sus máximos habituales: el máximo de una fila `habitual`, y el medio («Average») de la cita en una de PerfumersWorld |
| `uso_consenso` | `consenso` con dos o más fuentes en la franja; `recomendacion` con una sola |
| `uso_fuentes` | los nombres cortos de esas fuentes, separados por « \| » |
| `uso_techo` | el máximo más alto de las filas de papel `techo` o `habitual y techo` (lo que alguien llega a usar: no es un límite de seguridad ni de IFRA) |
| `uso_techo_fuente` | de qué fuente sale ese techo |

Las filas de base `producto` o `desconocida` no entran en la franja ni se convierten. **A
2026-10-01, con U-005 entero, son 386 materiales con franja**: **87 con `consenso` y 299
con `recomendacion`**. Hay **1.703 con techo de uso**; los 1.333 que solo tienen techo salen en
la ficha como «solo techo», con su fuente, sin franja (P59 A).

Un natural que una tienda vende diluido puede traer el CAS del disolvente (el absoluto de cacao
al 10 % de Maese Lab, con el del etanol): no se une al disolvente, sino por su especie, o queda
en `proveedores-sin-unir.csv`.

## Los nombres comerciales, por encima (P38)

**IFRA da la profundidad química; el nombre comercial da el acceso cómodo.** Los dos valen en
la búsqueda. Donde hay nombre comercial, la app lo enseña primero, con su sigla, y el químico
al lado. La capa sale de
[`origen/nombres-comerciales.csv`](origen/nombres-comerciales.csv), una fila por CAS, y se
aplica a todo material con ese CAS. **364 materiales llevan nombre comercial y 27, sigla.**
Cómo se hizo, y lo que queda por mirar, en
[la investigación del 2026-09-27](../../docs/investigacion/2026-09-27-nombres-comerciales/README.md).

| Columna | Qué es |
|---|---|
| `nombre_comercial` | el nombre con el que se conoce en el sector: Hedione, Iso E Super, Isobutyl quinoline |
| `sigla_comercial` | la sigla de uso: IBQ, HCA, HHCB |
| `otros_nombres_comerciales` | los de otras casas para el mismo CAS, separados por ` \| ` |
| `casa_comercial` | la casa dueña del nombre, si lo es de una |
| `fuente_comercial` | de dónde sale cada uno: PubChem (con su CID), IFRA (*commercial name*) o «uso del sector» |
| `confianza_comercial` | alta, media o baja. Lo que solo es «uso del sector» llega como mucho a media |
| `icono` | lo que dice el icono del material: la sigla comercial, o si no la abreviatura (P39) |
| `icono_distintivo` | cuando una sigla nombra a más de un CAS, lo que los separa, sacado del nombre químico: el 6 de ⁶IBQ. Si dos dan el mismo, el segundo por orden de CAS lleva prima: ²IBQ y ²′IBQ |
| `icono_tipo` | la letra del tipo de natural con que acaba la abreviatura, que el icono dibuja como carácter propio: A absoluto, O aceite, E extracto, C concreto, T tintura, R resinoide, L oleorresina, P terpenos, D destilado (P40) |

Los sinónimos de PubChem se traen con
[`scripts/buscar_sinonimos.py`](../../scripts/buscar_sinonimos.py) a `.cache/`, fuera de Git.

## `estado`: qué dice IFRA de cada material

Lo desconocido nunca se da por libre (§1.2).

| `estado` | Quiere decir | Cuántos |
|---|---|---|
| `prohibido` | su estándar lo prohíbe como tal | 121 |
| `con-techo` | su estándar le pone un techo en % en alguna categoría | 417 |
| `condicion` | una especificación, una variante prohibida o una familia: no es un % | 47 |
| `por-constituyentes` | sin estándar propio, pero el anexo le da constituyentes regulados | 523 |
| `sin-dato` | un natural sin estándar propio y fuera del anexo: no se sabe qué lleva | 553 |
| `sin-estandar` | no está en el índice de IFRA, que es completo: no tiene estándar propio | 2664 |

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

3540 filas. Una fila es algo regulado que un material lleva por dentro:
- `variante`: el natural del anexo, o la base de Schiff, de donde sale;
- `estandar`: el estándar del constituyente;
- `concentracion_pct`: el % dentro del material;
- `fuente`: `anexo` o `bases-schiff`.

**`coincidencia`** dice cómo se unió el material con el anexo:
- **`nombre`**: el anexo tiene ese mismo natural. Lo cumplen 313 materiales. Si el FIG
  repite la fila, con el mismo nombre y CAS («Cistus oil», CtO y CuO), las dos se unen así;
- **`cas`**: solo coincide el CAS principal. Cuando ese CAS reúne varias variantes, se
  apuntan todas y **cuenta la peor**. Hay 281 materiales así.
  - Ejemplo: el «Lemon oil» del FIG puede ser el exprimido, la esencia o el destilado del
    anexo.

- **`proveedor`** (P59, 2026-10-01): lo que declaran los proveedores en sus listas de alérgenos y
  fichas de seguridad, ya auditado ([el frente C](../../docs/investigacion/2026-09-30-usos-y-constituyentes/README.md)).
  Sale de [`origen/constituyentes-proveedores.csv`](origen/constituyentes-proveedores.csv), que
  escribe [`scripts/constituyentes_proveedores.py`](../../scripts/constituyentes_proveedores.py):
  entre fuentes cuenta la cifra más alta. **Solo entra donde el anexo no da ese estándar para ese
  material**, y no cambia su `estado`: un natural «sin dato» sigue avisando de que puede llevar
  otras sustancias con techo. Son 270 filas de 84 materiales.

Los otros CAS de un natural del anexo solo cuentan si además coincide el nombre. Algunos de
esos CAS, como el de *Citrus limon*, sirven para varias variantes, y unirlos por CAS
mezclaría la esencia de petitgrain con la de limón.
