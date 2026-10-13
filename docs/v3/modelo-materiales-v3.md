# Los materiales en la v3

*Segunda versión, 2026-10-07. La primera seguía el modelo de la v2 del repositorio. Esta parte de `PLAN_V3.md` y solo añade lo que tú has decidido después (V3-2, V3-3) o lo que el plan deja sin definir. Cada punto dice de dónde sale:*

- ***[Plan §n]***: lo dice el plan.
- ***[Tú]***: tus decisiones de hoy.
- ***[Propuesta]***: el plan no lo define y propongo algo; lo decides tú.

*Va numerado para que corrijas punto por punto.*

---

## 0 · Qué cambia respecto a la primera versión

| Primera versión (v2) | Ahora (plan v3) | De dónde |
|---|---|---|
| Seis tipos de la v2: sustancia, natural, base, disolvente, provisional, fórmula | Los de tu referencia, por lo que define al material, más la fórmula congelada; el disolvente es una marca (§2.3) | Tú (V3-12) |
| Un natural se identifica por especie + parte + proceso + quimiotipo (D1) | Son **atributos opcionales**. La identidad es el id | Plan §15 |
| Id estable de la v2 en una columna `ref` | **Sin columna**: el script deriva el id de la v3 del de la v2, siempre el mismo | Plan §35 |
| Cobertura de cada lista (columna con 4 valores) | **Sin columna**: la da el tipo, más un componente «Sin identificar» para las listas parciales (§3.5) | Plan §22, §31 |
| «Requisito cumplido» como clase aparte | Un solo `requirement`, cuya **autoridad** dice si está acreditado (§4.4) | Plan §29, §32 |
| Columna de enmienda de IFRA | La enmienda va en `source` | Plan §28 |
| Dos tablas: nombres comerciales y perfil (familia, uso, duración) | Los otros nombres, en `aliases` (§2.5); **el núcleo de la ficha y la dosis, desde el principio** (§2.7) | Tú (V3-6, V3-14) |
| Productos «basados en» su material general | Cada producto es **un material común con su composición entera**, que escribe el script | Tú (V3-2) + plan §17 |
| D7, pura por convención; D8 y D12, la dilución y el certificado tal como se compra | **No hacen falta como reglas**: salen del propio modelo (§3.4 y §3.6) | Plan §8, §24 |
| Uso habitual, duración, la base de cada número | La dosis por fuente, siempre con su base, y la tenacidad, en la ficha (§2.7) | Tú (V3-14) |
| Los cuatro estados, la jerarquía de autoridad, lo desconocido nunca cero | **Se quedan**: el plan los mantiene | Plan §31, §32 |
| Glosario, tu versión de un común, «lo que tengo» | Se quedan | Tú (V3-3) |
| Cada material, una fila en el buscador | **Categorías:** el buscador enseña la categoría, y debajo las fichas concretas (§2.6) | Tú (V3-13) |

---

## 1 · Las categorías del plan

- **1.1 · Fórmula y material son cosas distintas** *[Plan §27]*. Una fórmula es lo que estás formulando; un material es algo que se puede añadir. Para usar una fórmula como ingrediente se **congela**: se crea un material tuyo con su composición fija, y cambiar la fórmula después no lo cambia.
- **1.2 · Común o tuyo** *[Plan §16–18]*. Un material es común (`owner_id` vacío) o tuyo (`owner_id` = tú). Hay **una sola tabla** para los dos.

  | Comunes (ejemplos del plan, §36) | Tuyos |
  |---|---|
  | Geosmina, Linalool, Bergamot oil, DPG, Alcohol | Tu base almizclada, un material provisional, una fórmula congelada |

- **1.3 · Simple o compuesto** *[Plan §20]*. Un material puede contener otros materiales. Ninguno se contiene a sí mismo.
- **1.4 · Provisional** *[Plan §19]*. Un material tuyo del que solo sabes el nombre (`kind = provisional`). Se añade a una fórmula al momento, y lo que no se sabe de él sigue siendo desconocido, nunca cero ni libre.
- **1.5 · La dilución no crea materiales** *[Plan §8]*. «Geosmina al 1 % en DPG» es Geosmina, pesada así en una adición.

---

## 2 · El material

- **2.1 · Campos** *[Plan §15]*:
  - `name` y `kind`;
  - si se saben: `cas`, `species`, `part`, `process`, `chemotype`, `inci`, `origin`;
  - quién es su dueño: `owner_id`;
  - su categoría, `category_id`, y en un natural su forma, `form` (§2.6) *[Tú, V3-13]*;
  - el núcleo de la ficha, lo propio de su tipo, sus fuentes y su confianza, todo vacío si no se sabe (§2.7) *[Tú, V3-14]*.
- **2.2** El CAS, la especie y el resto son **datos del material, no su identidad** *[Plan §15]*. Dos materiales pueden compartir CAS (el aceite y el absoluto de una planta).
- **2.3 · Los tipos (`kind`)** *[Tú, V3-12, que cambia V3-4: los de tu referencia, más `frozen`]*. Por lo que define al material:

  | Tipo | Lo define | Qué hace la app con él |
  |---|---|---|
  | `molecule` | Su química. También una mezcla de isómeros (Iso E Super) o la cumarina natural | **Sin componentes, es ella misma**: pura |
  | `natural` | Su origen: especie, parte, método. También un semisintético sacado de un natural | **Sin componentes, su contenido es desconocido** |
  | `composition` | Su receta: la base de una casa, o una tuya | **Sin componentes, su contenido es desconocido** |
  | `provisional` | Solo un nombre | Todo desconocido |
  | `frozen` | Una fórmula congelada | Su composición no se puede editar |

  **El disolvente es una marca, `solvent` (sí o no)**, aparte del tipo y de la función: DPG, alcohol, IPM, DEP, TEC, triacetina y BB son moléculas con la marca. **Lo marcado no cuenta como materia aromática.** La dilución no es un tipo: es un estado del frasco.

- **2.4 · Los ids** *[Propuesta]*. Cada material tiene un id único. Para los que vienen de la v2, el script lo calcula a partir del suyo (`M00001`), así que **volver a importar da siempre los mismos ids** sin guardar una columna más.
- **2.5 · Nombres** *[Plan §15; Tú, V3-6]*. Un `name`, el que se enseña, y **una lista de otros nombres** (`aliases`): nombre comercial, sigla, sinónimos. El buscador encuentra por cualquiera de ellos y por el CAS, como hoy («Hedione», «IBQ»). Los de los comunes salen del glosario de la v1, que no se toca; los tuyos, los pones tú.

- **2.6 · Categorías: el buscador agrupa, la fórmula no** *[Tú, V3-13]*.
  - **Cada material concreto es una ficha propia**, con su composición y sus límites: el aceite, el absoluto y el CO2 de lavanda; la Hedione de cada proveedor.
  - **Una categoría los reúne para buscar** (`material_categories`: id, nombre, otros nombres): la molécula (Hedione), con sus proveedores debajo; la planta (lavanda), con sus formas, y cada forma con sus proveedores.
  - **El buscador enseña la categoría**; al abrirla eliges la ficha. **La fórmula guarda siempre el material concreto**, y el IFRA se calcula con el suyo.
  - **El material general también es una ficha concreta** (Hedione sin fabricante), con sus límites generales por categoría de IFRA. Se usa cuando no aplicas un fabricante; el producto de un fabricante puede diferir por su certificado de conformidad.
  - **Las categorías las escribe el script, por regla:** una molécula, por su CAS; un natural, por especie + parte, o por su CAS si no dice la especie *[Propuesta]*. Tu versión de un común va en la categoría del común; un material tuyo, en una común o en ninguna *[Propuesta]*.
  - **Agrupar no mezcla datos. Fusionar** dos fichas que son el mismo material, sí: solo con tu visto bueno, fila a fila *[V3-11]*.

- **2.7 · La ficha: el núcleo y la dosis** *[Tú, V3-14; los campos, de tu referencia §3]*.
  - **El núcleo**, en columnas de `materials` que admiten vacío: familia (`family`), facetas (`facets`), piso (`tier`), evolución (`evolution`), tenacidad (`tenacity`), potencia (`strength`), umbral (`threshold`), difusión (`diffusion`), efecto en la mezcla (`blend_effect`), función (`role`: estructura, modificador, traza, fijador, puente, booster) y dilución recomendada (`recommended_dilution`). El disolvente no es una función: es la marca de §2.3.
  - **Lo propio de cada tipo**, vacío si no se sabe *[Propuesta, por §9.1]*: casa (`house`), código (`code`) y qué quiere oler (`odor_target`) en una composición; origen de síntesis (`synthesis`) e isómeros (`isomers`) en una molécula; la forma (`form`, §2.6) en un natural.
  - **La fuente y la confianza**, como en tu referencia *[Propuesta]*: `sources`, etiquetas cortas, y `confidence` (alta, media, baja), por material.
  - **La dosis, en `material_doses`:** una fila por fuente, con mínima, típica y máxima, **siempre con su base** (del concentrado, del producto terminado o «sin declarar»), su autoridad y su fuente. Las columnas son las de `datos/v2/usos.csv`, que la v2 diseñó así y dejó vacía.
  - **Un campo vacío sale «no lo dice»**, nunca un valor por defecto.
  - **Después**, en otra fase: relaciones, descriptores por fuente, perfumes de referencia y física.
  - **Qué datos lo llenan:** en lo común, la pregunta 7.11 (tenacidad y familias); tus 111 materiales del laboratorio llenan la ficha de tus versiones, en tu cuenta (§6.5, V3-15). El glosario de la v1 tiene familia en 3119 de sus 4347 filas, matiz en 2154 y uso mínimo y máximo en 691 (`datos/glosario/materiales.csv`).

---

## 3 · La composición

- **3.1 · Una fila por componente** *[Plan §21]*: el material, el componente, la cantidad, la autoridad y la fuente. Cada fila lleva su propio id, porque la sincronización lo pide *[V3-9]*.
- **3.2 · La cantidad es de uno de cuatro tipos** *[Plan §22]*:
  - `exact`, una cifra;
  - `max`, «como mucho»;
  - `range`, entre dos;
  - `unknown`, lo lleva pero no se sabe cuánto.
- **3.3 · La mezcla no se abre; IFRA, sí** *[Plan §23, §24]*. En la fórmula ves los materiales que usaste. Para IFRA, la app los abre en sus componentes, y estos en los suyos, hasta el final.
- **3.4 · Dónde se para al abrir** *[Propuesta, por el tipo de §2.3]*:
  - **una molécula sin componentes** es ella misma (lo que la v2 llamaba «pura por convención»);
  - **un natural, una composición o un provisional sin componentes** son desconocidos, y cuentan en el peor caso.
- **3.5 · Una lista que no está completa** *[Propuesta]*. Cuando la fuente solo da parte de lo que hay (una ficha de seguridad lista solo lo clasificado), se añade un componente común, **«Sin identificar»**, con cantidad `unknown`. Así la app sabe que puede haber más y nunca da «dentro» por lo que falta.
  - Sin esto, una lista parcial se leería como completa. En la v2 son **9 materiales y 2 productos**.
  - Es lo que en la primera versión hacía la columna de cobertura, pero con las tablas del plan.
- **3.6 · En % del material tal como es** *[Plan §8]*. Si un producto se compra diluido y su certificado habla del producto tal cual, sus cifras son de ese producto y se pesa al 100 %. Es el material que es; la dilución con que tú lo pesas va en la adición.

---

## 4 · La regulación

- **4.1 · Una fila por regulación de un material** *[Plan §28]*: régimen, categoría, clase, máximo, grupo, requisito, autoridad y fuente.
- **4.2 · Dos regímenes** *[Plan §29]*:
  - `ifra`, los estándares;
  - `manufacturer`, el tope que un fabricante da para su producto. Los productos son materiales (V3-2), así que el tope es de ese material.
- **4.3 · Tres clases** *[Plan §29]*:
  - `max`, el máximo en el producto terminado, por categoría;
  - `prohibited`;
  - `requirement`, una especificación que cumplir (el cade, rectificado).
- **4.4 · Si un requisito se cumple** *[Propuesta, con la autoridad del plan §32]*:
  - con autoridad `ifra`, **pendiente** de acreditar;
  - con `product` o `lot` y su fuente, **acreditado**;
  - con `literature` o `consensus`, **supuesto**.
- **4.5 · El grupo (`group_key`)** *[Plan §28; la regla, propuesta]*. Los miembros de un mismo estándar comparten grupo: los isómeros de una sustancia, o los aceites fototóxicos del 089. En un grupo se suma la parte de cada miembro sobre su máximo, y el total no pasa de 1.
- **4.6 · De dónde salen las de IFRA** *[Plan §40]*. El script las escribe desde los archivos de IFRA: una por miembro y categoría. La app usa la 4, y la enmienda va en `source`.

---

## 5 · Autoridad y lo desconocido

- **5.1 · La autoridad de cada cifra, de más a menos** *[Plan §32]*:
  1. `lot`
  2. `product`
  3. `ifra`
  4. `literature`
  5. `consensus`

  Si dos chocan, manda la de arriba.
- **5.2 · Sin tabla de documentos** *[Plan §33]*. La fuente es un texto. El script solo trae cifras de documentos revisados.
- **5.3 · Lo desconocido nunca vale cero** *[Plan §31]*. Cada sustancia sale **dentro**, **acotada**, **sin comprobar** o **se pasa**, y el cálculo puede salir parcial.
- **5.4 · Una cifra de literatura o consenso nunca da «dentro», como mucho «acotada»** *[Tú, V3-7]*. Es la regla D2 de la v2, y se queda. Para comparar con IFRA se usa el máximo de su fuente. El plan no la menciona ni la contradice, y el motor ya la hace.

---

## 6 · El glosario: común y tuyo

- **6.1 · Lo común lo escribe solo el script**, desde los datos del repositorio. Todos lo leen y nadie lo cambia *[Plan §17, §40]*.
- **6.2 · Tus materiales** solo los ves tú. Llevan los mismos campos, componentes y regulaciones que los comunes *[Plan §18; Tú, V3-3]*.
- **6.3 · Tu versión de un material común** no cambia el común y sale junto a él *[Tú, V3-3]*. Es un material tuyo que **apunta al común** (`based_on_id`) *[Tú, V3-5]*:
  - **hereda** su composición, sus regulaciones y sus datos;
  - **añade lo tuyo**: tus cifras mandan sobre las del común por su autoridad (tu certificado de producto sobre el anexo), y tus límites se suman a los de IFRA, con el más estricto mandando;
  - **un cambio de IFRA en el común te llega solo**.
- **6.4 · «Lo que tengo»**: marcas los materiales que tienes, sin cantidades. Con el interruptor encendido, el buscador del banco solo te enseña esos *[Tú, V3-3]*.
  - Una tabla pequeña de usuario y material, con su propio id *[V3-9]*.
  - El plan solo excluye el «inventario avanzado» (§45).
- **6.5 · Lo del laboratorio, en tu cuenta** *[Tú, V3-15]*. Tus 111 materiales del laboratorio entran como tuyos, no como comunes: nadie más los ve.
  - El que ya es un común entra como **tu versión** de ese común (§6.3): hereda su composición y su IFRA y añade tu núcleo, tus dosis y tus sinónimos. Cuál es el común lo decides tú, en un CSV de conflictos *[Propuesta]*.
  - El que no casa, como **material tuyo nuevo**. Tus frascos marcan «lo que tengo» (§6.4) *[Propuesta]*.
  - **Su IFRA de segunda mano no calcula:** entra como texto «sin verificar» (regla 7 de tu referencia).
  - Tu cata y tus ejes, cuando exista la capa del usuario (aplazada, plan §46).

---

## 7 · Preguntas, de una en una

| # | Pregunta | Opciones | Recomiendo |
|---|---|---|---|
| ~~7.1~~ | ~~¿Valen los cinco tipos de §2.3?~~ | **Decidida (V3-4, 2026-10-09): los cinco** | |
| ~~7.2~~ | ~~¿Cómo se hace tu versión de un común?~~ | **Decidida (V3-5, 2026-10-09): vínculo** | |
| ~~7.3~~ | ~~¿Por qué nombres busca el buscador?~~ | **Decidida (V3-6, 2026-10-13): varios nombres** | |
| ~~7.4~~ | ~~¿Se queda la regla D2 (§5.4)?~~ | **Decidida (V3-7, 2026-10-13): sí** | |

El 2026-10-13 llegó tu referencia del laboratorio (§9), y abre estas preguntas. Van de una en una, en este orden:

| # | Pregunta | Opciones | Recomiendo |
|---|---|---|---|
| ~~7.5~~ | ~~¿Qué tipos tiene un material?~~ | **Decidida (V3-12, 2026-10-13): los de la referencia, más `frozen`; el disolvente, una marca** | |
| ~~7.6~~ | ~~¿Cómo deja de salir diez veces el mismo material?~~ | **Decidida (V3-13, 2026-10-13): categorías en el buscador; cada ficha concreta, con su composición y sus límites** | |
| ~~7.7~~ | ~~¿Entra el núcleo de la ficha desde el principio?~~ | **Decidida (V3-14, 2026-10-13): el núcleo y la dosis; el resto, después** | |
| ~~7.8~~ | ~~¿Entran en la base común los 111 materiales del laboratorio?~~ | **Decidida (V3-15, 2026-10-13): entran en tu cuenta, no en lo común** | |
| **7.9** | **¿Cómo se guardan varios CAS?** (el europeo y el americano de un natural) | **Una lista en el material**, como los otros nombres (V3-6). **Una tabla aparte** | **La lista.** Es una columna, como `aliases` |
| **7.10** | **¿Viajan a la app los datos en disputa?** | **No**: los conflictos se quedan en el repo y el laboratorio, y en la app el dato sale marcado «provisional». **Sí**, con su tabla `conflicts` | **No.** Los decides tú en el repo, como hasta ahora; la app solo necesita saber que el dato es provisional |
| **7.11** | **¿Qué se hace con la tenacidad y las familias?** (escalas abiertas, §5 de la referencia) | **Aplazar:** el campo existe, pero no se enseña como número ni como lista cerrada hasta decidir la fuente. **Decidir ahora** | **Aplazar.** Las fuentes chocan por más de diez veces; la pregunta es de investigación, del laboratorio |

---

## 8 · Qué entra de la v2

| De la v2 | En la v3 |
|---|---|
| 3070 sustancias | `molecule` (V3-12) |
| 1183 naturales | `natural` |
| 7 bases | `composition` |
| 89 productos | Materiales comunes: su composición es la de su material general más la de su certificado, escrita por el script (V3-2), en la categoría de su material general (V3-13). Sus 13 topes, `manufacturer` |
| 3140 cifras de composición | `material_components`, con su autoridad y su documento como fuente |
| 263 estándares de IFRA 51 y 2 condiciones | `regulations` |
| Los 7 disolventes de la app | Ya son sustancias de la v2: esas moléculas, con la marca `solvent` (V3-12) |
| **No entra al principio** | El color de las familias, las 10 concentraciones por defecto, los lotes, los documentos como tabla. El núcleo de la ficha y la dosis sí entran (V3-14), con los datos que decidan 7.8 y 7.11 |

---

## 9 · Tu referencia del laboratorio (2026-10-13)

*Tu archivo está en [`referencia-materiales-lab.md`](referencia-materiales-lab.md), tal como lo pasaste. Sus `esquema.sql` y `materiales.sqlite` están en el laboratorio, no aquí.*

### 9.1 · Cómo encaja con lo decidido

| Lo que dice la referencia | Lo decidido en la v3 | Queda |
|---|---|---|
| Tres tipos por lo que define al material: `molecule`, `natural`, `composition` (+ `provisional`). El disolvente es una molécula con función «disolvente» | V3-4: `substance`, `mixture`, `solvent`, `provisional`, `frozen` | **Decidida (V3-12):** los de la referencia, más `frozen`; el disolvente, una marca |
| Estándar (lo común) y versión (tu frasco: proveedor, grado, pureza, isómeros, dilución de fábrica, procedencia, lote), que apunta al estándar | V3-5: tu versión es un material tuyo con `based_on_id`, que hereda | **Encaja.** Su decisión abierta 3 ya la contestó V3-5. Lo nuevo son los campos del frasco: grado, proveedor, pureza. Los lotes siguen aplazados (plan §46) |
| Hedione HC o Iso E Super Plus son versiones, no materiales nuevos | V3-2: los 89 productos de la v2 son materiales comunes, cada uno por su lado | **Decidida (V3-13):** son fichas comunes de su categoría, cada una con su composición; el buscador las agrupa |
| Núcleo de 13 campos: nombre y sinónimos, CAS, familia, facetas, piso, evolución, tenacidad, potencia, umbral, difusión, efecto, función, dilución recomendada | V3-6 y plan §34: familias, uso y duración, fuera al principio | **Decidida (V3-14):** entra desde el principio, en columnas que admiten vacío |
| Campos propios por tipo: casa, origen de síntesis e isómeros (molécula); forma, especie, parte, método, quimiotipo y procedencia (natural); casa, código y qué quiere oler (composición) | El material tiene especie, parte, proceso, quimiotipo, INCI y origen | **Se suman** (V3-12, V3-13, V3-14) |
| Tablas aparte: dosis por fuente (mínima, típica, máxima y su base), relaciones, descriptores por fuente, perfumes de referencia | No están en el plan | **Decidida (V3-14):** la dosis, con el núcleo; el resto, después |
| IFRA: varias filas si cae bajo varios estándares; manda el menor | `regulations`, una fila por miembro y categoría, con `group_key` | **Encaja** |
| Un dato que falta es vacío, nunca cero; todo porcentaje lleva su base; los componentes no se expanden solos y su cantidad es exacta, máxima, rango o desconocida; los límites son por sustancia | §3, §5 | **Encaja.** La dosis por fuente tiene que llevar su base |
| Cada dato con su fuente; el material, con una confianza | Componentes y regulaciones llevan autoridad y fuente | **Decidida (V3-14):** la confianza del material entra con el núcleo |
| Un dato puede estar en disputa: tabla `conflicts` | Los conflictos se deciden en CSV del repo (`datos/v2/conflictos/`) | **Pregunta 7.10** |
| El IFRA de segunda mano no se usa para calcular | IFRA sale solo de los archivos de IFRA (P37); V3-7 | **Encaja** |
| Varios CAS por material | Un `cas` por material | **Pregunta 7.9** |
| Escalas abiertas: tenacidad y familia | — | **Pregunta 7.11** |
| Los datos: 111 materiales investigados | P37: nada del laboratorio entra en la app | **Decidida (V3-15):** entran en tu cuenta, como tus versiones de los comunes o materiales tuyos (§6.5). Cambia P37 |
| Capa del usuario: diluciones preparadas, cata y lectura, ejes estéticos | Plan §46: `material_preferences`, aplazado | **Aplazado**, sin cerrar la puerta: es tuyo, no del material |

### 9.2 · Los duplicados del buscador, medidos en la v2

Medido sobre `datos/v2/materiales.csv` (4260 materiales):

- **210 CAS los comparten 906 materiales**, todos naturales. Casi siempre son formas y grados de la misma planta, entrados uno por término del FIG (lotes de la fase 6, D14). El limón (8008-56-8) sale **10 veces**: expresado, destilado, lavado, concentrado 5x y 10x, absoluto concentrado… La lavanda (8000-28-0), 9.
- **43 nombres los comparten 120 materiales.** Algunos son duplicados exactos: el mismo material entró una vez desde tu cuaderno y la tienda (M00…) y otra desde el FIG (M03…). Así pasa con «Lemon oil, expressed» (M00045 y M03525), «Mandarin oil» (M00047 y M03556) y «Cade oil» (M00054 y M03941). Otros no son exactos: «Cistus absolute» sale con dos CAS distintos (8016-26-0 y 89997-74-0; por tu referencia, seguramente el americano y el europeo), y «alpha-Bisabolol» sale 6 veces con 6 CAS, que parecen isómeros.
- **581 de los 1183 naturales no dicen su especie**, así que hoy no todos se pueden agrupar por especie + parte + método. Los que no la dicen se agrupan por CAS.

Por eso la pregunta 7.6 (decidida: V3-13) separa dos cosas: **fusionar** lo que es el mismo material dos veces (con tu visto bueno, en un CSV de conflictos) y **agrupar** lo que son formas o grados distintos de un mismo estándar.
