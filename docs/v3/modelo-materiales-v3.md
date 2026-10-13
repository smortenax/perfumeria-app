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
| Dos tablas: nombres comerciales y perfil (familia, uso, duración) | **Fuera al principio**: el material tiene `name` (§2.5) | Plan §34 |
| Productos «basados en» su material general | Cada producto es **un material común con su composición entera**, que escribe el script | Tú (V3-2) + plan §17 |
| D7, pura por convención; D8 y D12, la dilución y el certificado tal como se compra | **No hacen falta como reglas**: salen del propio modelo (§3.4 y §3.6) | Plan §8, §24 |
| Uso habitual, duración, la base de cada número | Fuera al principio: el plan no los tiene | Plan §34 |
| Los cuatro estados, la jerarquía de autoridad, lo desconocido nunca cero | **Se quedan**: el plan los mantiene | Plan §31, §32 |
| Glosario, tu versión de un común, «lo que tengo» | Se quedan | Tú (V3-3) |

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
  - quién es su dueño: `owner_id`.
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
| **7.6** | **¿Cómo deja de salir diez veces el mismo material?** (§9.2) | **Agrupar:** un estándar por identidad, y debajo sus formas, grados y productos, cada uno con su composición; una columna `standard_id` que solo agrupa, sin heredar. Los duplicados exactos se fusionan con tu visto bueno. **Fusionar:** los grados y productos salen de lo común y pasan a ser versiones tuyas, como dice la referencia al pie de la letra | **Agrupar.** Algunos grados cambian IFRA (sin furocumarinas, bajo en cumarina) y necesitan su propia composición en lo común. Es lo que la v1 ya hacía con las formas de un natural: una fila por planta en el buscador (P54) |
| **7.7** | **¿Entra el núcleo de la ficha desde el principio?** Los 13 campos de la referencia (§3): olor, comportamiento, uso | **Sí, el núcleo y la dosis por fuente**; las relaciones, los descriptores, los perfumes de referencia y la física, en una fase posterior. **Todo ahora.** **Nada aún**, como decía V3-6 | **El núcleo y la dosis.** Son lo que pediste registrar, y caben en columnas que admiten vacío. El resto son tablas nuevas que esperan a que el glosario funcione. Cambia el «fuera al principio» de V3-6 |
| **7.8** | **¿Entran en la base común los 111 materiales del laboratorio?** | **Sí, por script**, con su fuente y como `literature` o `consensus`. **No**, como decía P37 | **Sí.** Sin ellos, el núcleo nace casi vacío. Por V3-7, nunca dan «dentro» en IFRA, y el IFRA de segunda mano no entra (regla 7 de la referencia) |
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
| 89 productos | Materiales comunes: su composición es la de su material general más la de su certificado, escrita por el script (V3-2). Sus 13 topes, `manufacturer` |
| 3140 cifras de composición | `material_components`, con su autoridad y su documento como fuente |
| 263 estándares de IFRA 51 y 2 condiciones | `regulations` |
| Los 7 disolventes de la app | Ya son sustancias de la v2: esas moléculas, con la marca `solvent` (V3-12) |
| **No entra al principio** | El perfil (familia, color), uso, duración, las 10 concentraciones por defecto, los lotes, los documentos como tabla |

---

## 9 · Tu referencia del laboratorio (2026-10-13)

*Tu archivo está en [`referencia-materiales-lab.md`](referencia-materiales-lab.md), tal como lo pasaste. Sus `esquema.sql` y `materiales.sqlite` están en el laboratorio, no aquí.*

### 9.1 · Cómo encaja con lo decidido

| Lo que dice la referencia | Lo decidido en la v3 | Queda |
|---|---|---|
| Tres tipos por lo que define al material: `molecule`, `natural`, `composition` (+ `provisional`). El disolvente es una molécula con función «disolvente» | V3-4: `substance`, `mixture`, `solvent`, `provisional`, `frozen` | **Decidida (V3-12):** los de la referencia, más `frozen`; el disolvente, una marca |
| Estándar (lo común) y versión (tu frasco: proveedor, grado, pureza, isómeros, dilución de fábrica, procedencia, lote), que apunta al estándar | V3-5: tu versión es un material tuyo con `based_on_id`, que hereda | **Encaja.** Su decisión abierta 3 ya la contestó V3-5. Lo nuevo son los campos del frasco: grado, proveedor, pureza. Los lotes siguen aplazados (plan §46) |
| Hedione HC o Iso E Super Plus son versiones, no materiales nuevos | V3-2: los 89 productos de la v2 son materiales comunes, cada uno por su lado | **Choca en el buscador:** hoy salen como materiales aparte. **Pregunta 7.6** |
| Núcleo de 13 campos: nombre y sinónimos, CAS, familia, facetas, piso, evolución, tenacidad, potencia, umbral, difusión, efecto, función, dilución recomendada | V3-6 y plan §34: familias, uso y duración, fuera al principio | **Choca. Pregunta 7.7** |
| Campos propios por tipo: casa, origen de síntesis e isómeros (molécula); forma, especie, parte, método, quimiotipo y procedencia (natural); casa, código y qué quiere oler (composición) | El material tiene especie, parte, proceso, quimiotipo, INCI y origen | **Se suman** con 7.5 y 7.7 |
| Tablas aparte: dosis por fuente (mínima, típica, máxima y su base), relaciones, descriptores por fuente, perfumes de referencia | No están en el plan | **Pregunta 7.7** (la dosis, con el núcleo; el resto, después) |
| IFRA: varias filas si cae bajo varios estándares; manda el menor | `regulations`, una fila por miembro y categoría, con `group_key` | **Encaja** |
| Un dato que falta es vacío, nunca cero; todo porcentaje lleva su base; los componentes no se expanden solos y su cantidad es exacta, máxima, rango o desconocida; los límites son por sustancia | §3, §5 | **Encaja.** La dosis por fuente tiene que llevar su base |
| Cada dato con su fuente; el material, con una confianza | Componentes y regulaciones llevan autoridad y fuente | **Nuevo:** la confianza del material, con 7.7 |
| Un dato puede estar en disputa: tabla `conflicts` | Los conflictos se deciden en CSV del repo (`datos/v2/conflictos/`) | **Pregunta 7.10** |
| El IFRA de segunda mano no se usa para calcular | IFRA sale solo de los archivos de IFRA (P37); V3-7 | **Encaja** |
| Varios CAS por material | Un `cas` por material | **Pregunta 7.9** |
| Escalas abiertas: tenacidad y familia | — | **Pregunta 7.11** |
| Los datos: 111 materiales investigados | P37: nada del laboratorio entra en la app | **Pregunta 7.8** |
| Capa del usuario: diluciones preparadas, cata y lectura, ejes estéticos | Plan §46: `material_preferences`, aplazado | **Aplazado**, sin cerrar la puerta: es tuyo, no del material |

### 9.2 · Los duplicados del buscador, medidos en la v2

Medido sobre `datos/v2/materiales.csv` (4260 materiales):

- **210 CAS los comparten 906 materiales**, todos naturales. Casi siempre son formas y grados de la misma planta, entrados uno por término del FIG (lotes de la fase 6, D14). El limón (8008-56-8) sale **10 veces**: expresado, destilado, lavado, concentrado 5x y 10x, absoluto concentrado… La lavanda (8000-28-0), 9.
- **43 nombres los comparten 120 materiales.** Algunos son duplicados exactos: el mismo material entró una vez desde tu cuaderno y la tienda (M00…) y otra desde el FIG (M03…). Así pasa con «Lemon oil, expressed» (M00045 y M03525), «Mandarin oil» (M00047 y M03556) y «Cade oil» (M00054 y M03941). Otros no son exactos: «Cistus absolute» sale con dos CAS distintos (8016-26-0 y 89997-74-0; por tu referencia, seguramente el americano y el europeo), y «alpha-Bisabolol» sale 6 veces con 6 CAS, que parecen isómeros.
- **581 de los 1183 naturales no dicen su especie**, así que hoy no todos se pueden agrupar por especie + parte + método. Los que no la dicen se agrupan por CAS.

Por eso la pregunta 7.6 separa dos cosas: **fusionar** lo que es el mismo material dos veces (con tu visto bueno, en un CSV de conflictos) y **agrupar** lo que son formas o grados distintos de un mismo estándar.
