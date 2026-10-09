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
| Seis tipos de la v2: sustancia, natural, base, disolvente, provisional, fórmula | El plan no enumera los tipos. Propongo los que cambian el cálculo, nada más (§2.3) | Plan §15 |
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
- **2.3 · Los tipos (`kind`)** *[Tú, V3-4: el plan no los enumeraba]*. Solo los que cambian lo que hace la app:

  | Tipo | Qué hace la app con él |
  |---|---|
  | `substance` | Una molécula. **Sin componentes, es ella misma**: pura |
  | `mixture` | Un natural o una base. **Sin componentes, su contenido es desconocido** |
  | `solvent` | DPG, alcohol, IPM, DEP, TEC, triacetina, BB. **No cuenta como materia aromática** |
  | `provisional` | Solo un nombre. Todo desconocido |
  | `frozen` | Una fórmula congelada. Su composición no se puede editar |

  Natural y base no se separan porque la app los trata igual. Un natural se reconoce porque tiene especie.

- **2.4 · Los ids** *[Propuesta]*. Cada material tiene un id único. Para los que vienen de la v2, el script lo calcula a partir del suyo (`M00001`), así que **volver a importar da siempre los mismos ids** sin guardar una columna más.
- **2.5 · Nombres** *[Plan §15]*. Un solo `name`. Hoy el buscador también encuentra por nombre comercial y sigla («Hedione», «IBQ»), que salen del glosario de la v1. **Pregunta 7.3.**

---

## 3 · La composición

- **3.1 · Una fila por componente** *[Plan §21]*: el material, el componente, la cantidad, la autoridad y la fuente.
- **3.2 · La cantidad es de uno de cuatro tipos** *[Plan §22]*:
  - `exact`, una cifra;
  - `max`, «como mucho»;
  - `range`, entre dos;
  - `unknown`, lo lleva pero no se sabe cuánto.
- **3.3 · La mezcla no se abre; IFRA, sí** *[Plan §23, §24]*. En la fórmula ves los materiales que usaste. Para IFRA, la app los abre en sus componentes, y estos en los suyos, hasta el final.
- **3.4 · Dónde se para al abrir** *[Propuesta, por el tipo de §2.3]*:
  - **una sustancia sin componentes** es ella misma (lo que la v2 llamaba «pura por convención»);
  - **una mezcla o un provisional sin componentes** son desconocidos, y cuentan en el peor caso.
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
- **5.4 · Una cifra de literatura o consenso nunca da «dentro», como mucho «acotada»**. Es la regla D2 de la v2. El plan no la menciona ni la contradice, y el motor ya la hace. **Pregunta 7.4.**

---

## 6 · El glosario: común y tuyo

- **6.1 · Lo común lo escribe solo el script**, desde los datos del repositorio. Todos lo leen y nadie lo cambia *[Plan §17, §40]*.
- **6.2 · Tus materiales** solo los ves tú. Llevan los mismos campos, componentes y regulaciones que los comunes *[Plan §18; Tú, V3-3]*.
- **6.3 · Tu versión de un material común** no cambia el común y sale junto a él *[Tú, V3-3]*. Es un material tuyo que **apunta al común** (`based_on_id`) *[Tú, V3-5]*:
  - **hereda** su composición, sus regulaciones y sus datos;
  - **añade lo tuyo**: tus cifras mandan sobre las del común por su autoridad (tu certificado de producto sobre el anexo), y tus límites se suman a los de IFRA, con el más estricto mandando;
  - **un cambio de IFRA en el común te llega solo**.
- **6.4 · «Lo que tengo»**: marcas los materiales que tienes, sin cantidades. Con el interruptor encendido, el buscador del banco solo te enseña esos *[Tú, V3-3]*.
  - Una tabla pequeña de usuario y material.
  - El plan solo excluye el «inventario avanzado» (§45).

---

## 7 · Preguntas, de una en una

| # | Pregunta | Opciones | Recomiendo |
|---|---|---|---|
| ~~7.1~~ | ~~¿Valen los cinco tipos de §2.3?~~ | **Decidida (V3-4, 2026-10-09): los cinco** | |
| ~~7.2~~ | ~~¿Cómo se hace tu versión de un común?~~ | **Decidida (V3-5, 2026-10-09): vínculo** | |
| **7.3** | **¿Por qué nombres busca el buscador?** | **A** · Solo `name` (el plan tal cual) · **B** · `name` + una lista de otros nombres (comercial, sigla, sinónimos) en el mismo material | **B**: nadie busca «6-sec-Butylquinoline» |
| 7.4 | ¿Se queda la regla D2 (§5.4)? | Sí / No | Sí: sin ella una cifra de consenso daría un verde que no está probado |

---

## 8 · Qué entra de la v2

| De la v2 | En la v3 |
|---|---|
| 3070 sustancias | `substance` |
| 1183 naturales y 7 bases | `mixture` |
| 89 productos | Materiales comunes: su composición es la de su material general más la de su certificado, escrita por el script (V3-2). Sus 13 topes, `manufacturer` |
| 3140 cifras de composición | `material_components`, con su autoridad y su documento como fuente |
| 263 estándares de IFRA 51 y 2 condiciones | `regulations` |
| Los 7 disolventes de la app | `solvent` |
| **No entra al principio** | Nombres comerciales y perfil (según 7.3), uso, duración, las 10 concentraciones por defecto, los lotes, los documentos como tabla |
