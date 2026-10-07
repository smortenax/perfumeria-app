# Los materiales en la v3: lo que he entendido

*2026-10-07. Para que lo corrijas punto por punto: cada afirmación lleva un número («el 3.4 no», «el 6.2 sí, pero…»). Sale del plan v3, de tus mensajes de hoy y de la v2 donde no choca (V3-1). Lo que es propuesta mía va marcado **(propuesta)**; lo que no sé, en el §10.*

---

## 0 · En tres frases

1. **Un material es algo que se puede verter en una fórmula o que forma parte de otro material.** Una sustancia, un aceite, una base, un disolvente, tu acorde guardado.
2. **Hay un glosario común**, que trae la app y nadie cambia, y **lo tuyo**, que lo amplía sin tocarlo: tus materiales, tus versiones de los comunes y la lista de lo que tienes.
3. **Cada material dice de qué está hecho y qué le limita**, y cada cifra dice de dónde sale. De ahí la app calcula IFRA, y lo que no se sabe nunca cuenta como cero.

---

## 1 · Qué es un material y qué no

- **1.1** Un material es **una cosa con identidad propia**: Linalol, Bergamot oil expressed, DPG, Castoreum Synthetic, «Base rosa de ayer».
- **1.2** **La dilución no es un material** (plan §8). «Geosmina al 1 % en DPG» es Geosmina, pesada así en una adición. En la mezcla salen Geosmina y DPG por separado.
- **1.3** **Un natural se identifica por especie + parte + proceso + quimiotipo.** El CAS y el INCI son datos del material, no lo que lo identifica: dos formas de la misma planta (aceite y absoluto) comparten CAS y son dos materiales, porque su IFRA difiere.
- **1.4** Cada material común tiene un **id estable que no cambia nunca** (`M00001`…), además del interno de la base de datos.

---

## 2 · Los tipos

| # | Tipo | Qué es | Ejemplo | Cuántos trae la v2 |
|---|---|---|---|---|
| 2.1 | **Sustancia** | Una molécula, con su CAS | Linalol, Hedione | 3070 |
| 2.2 | **Natural** | Un producto de una planta o un animal, por especie, parte y proceso | Bergamot oil expressed, Lavender absolute | 1183 |
| 2.3 | **Base** | Una mezcla comercial cuya fórmula no se conoce entera | Castoreum Synthetic, Black Agar 296985 | 7 |
| 2.4 | **Disolvente** | Lo que diluye y no es materia aromática | DPG, alcohol, IPM, DEP, TEC, triacetina, benzoato de bencilo | 7 |
| 2.5 | **Provisional** | Solo un nombre, para no parar a definirlo. Todo lo demás es desconocido | «Musk de Juan» | — |
| 2.6 | **Fórmula guardada como material** | Una foto fija de una fórmula, para usarla en otras (plan §27) | «Acorde de higos, 25-09» | — |

- **2.7** Además del tipo, un material tiene **dos ejes**, que valen para cualquier tipo:
  - **Común o tuyo** (§6): de quién es.
  - **Original o basado en otro** (§7): si es una versión de otro material. Así entran **los 89 productos de la v2** (V3-2): «Geraniol 98 % de Maese Lab» es un material común basado en Geraniol.
- **2.8** Una sustancia de un material **sin documentos de su producto cuenta como pura, por convención**, y la ficha lo dice. Si es un aislado natural o se le conocen impurezas reguladas, queda pendiente (D7 de la v2).

---

## 3 · Los atributos (la ficha)

Todos los materiales tienen la **misma ficha**, sean comunes o tuyos. Un campo vacío es «no se sabe», nunca cero.

**3.1 · Identidad**

| Campo | Para quién |
|---|---|
| Nombre, tipo | Todos |
| CAS, INCI | Si los tiene; son datos, no la clave |
| Especie, parte, proceso, quimiotipo | Naturales |
| Origen: sintético, aislado natural o desconocido | Sustancias |

**3.2 · Composición:** de qué está hecho (§4).

**3.3 · Regulación:** qué le limita (§5).

**3.4 · Nombres** (cómo se encuentra): nombre comercial, sigla (IBQ, HCA), sinónimos (del FIG, de IFRA, de PubChem), nombres de tienda y nombres de otras casas. El buscador encuentra por cualquiera de ellos, por el CAS y con la grafía española.

**3.5 · Perfil** (cómo se describe y se dibuja). Hoy sale del glosario de la v1:

| Campo | Qué es |
|---|---|
| Icono | La sigla o la abreviatura, con su distintivo (⁶IBQ) y la letra del tipo de natural |
| Familia y matiz | Una de las 8 familias con su color, más «Transformado» |
| Descriptores | Los tres del FIG |
| Uso habitual | Mínimo, máximo y techo, **en % del concentrado**; si es consenso de varias fuentes o recomendación de una; las fuentes |
| Duración | Horas estimadas y banda; en las moléculas, de la presión de vapor |

- **3.6** **Todo número lleva su base pegada** (% del concentrado, % del producto terminado, % de la dilución). Un número sin base no se guarda.
- **3.7** **El uso habitual y la duración son otra capa**: nunca se mezclan con IFRA. Un uso habitual que pase del límite IFRA sale en rojo, y manda IFRA.

---

## 4 · La composición

- **4.1** Un material puede **contener otros materiales**, cada uno con una cantidad. Un aceite contiene sus sustancias; una base, las que declara su certificado; tu acorde guardado, lo que pesaste.
- **4.2** Cada cantidad es de uno de cuatro tipos: **exacta** (una cifra típica), **máximo** («< 0,1 %»), **rango** (de 2 a 5 %) o **desconocida**.
- **4.3** Cada cantidad dice **su autoridad y su fuente**. De más a menos: **lote** > **producto** (su ficha o certificado) > **anexo de IFRA** > **literatura** > **consenso**. Si dos fuentes chocan, manda la de arriba.
- **4.4** **Una cifra de literatura o de consenso nunca da «dentro» en IFRA**: como mucho «acotado», con el máximo de su fuente.
- **4.5** **Cada lista de componentes dice qué cubre**:
  - **completa en las reguladas**: lo que no sale, no está;
  - **solo alérgenos**;
  - **parcial**;
  - **desconocida**: lo que no sale, no se sabe.

  Es lo que permite distinguir «no lleva cumarina» de «no sé si lleva cumarina».
- **4.6** La composición está **en % de la materia pura** del material. La dilución con que se compra no entra (es de la adición), salvo que el certificado sea del producto tal como se compra: entonces vale tal cual y se pesa al 100 % de ese producto (D12).
- **4.7** Al calcular, **un material se abre en sus componentes, y estos en los suyos**, hasta llegar a sustancias (plan §24). En la fórmula sigue saliendo el material que usaste; abrirlo solo sirve para IFRA.
- **4.8** **Ningún material se contiene a sí mismo**, ni a través de otros.

---

## 5 · La regulación

- **5.1** Una regulación es **de un material** (plan §28) y es de uno de dos regímenes:
  - **IFRA**: los estándares, con su enmienda (hoy la 51);
  - **fabricante**: el tope que un fabricante da para su producto.
- **5.2** Hay cuatro clases:
  - **máximo por categoría**: hoy se usa la 4, y se guardan las 18;
  - **prohibido**;
  - **requisito**: una especificación que cumplir, como «el cade, rectificado»;
  - **requisito cumplido**: quién dice que se cumple. Con documento del producto, **probado**; con literatura o consenso, **supuesto**; sin nada, **pendiente**.
- **5.3** **IFRA limita una sustancia venga de donde venga.** Se suma lo que aporta cada material de la fórmula, abierto hasta sus sustancias.
- **5.4** Los miembros de un mismo estándar **comparten grupo**: los isómeros de una sustancia, o los aceites fototóxicos del 089. En un grupo se suma la parte de cada miembro sobre su techo, y el total no pasa de 1.
- **5.5** **El tope del fabricante es de su producto**, no de la sustancia: sale aparte de IFRA y no decide las dos lecturas.
- **5.6** **Cada sustancia sale en uno de cuatro estados:**
  - **dentro**;
  - **acotada**: hay algo desconocido, pero ni en el peor caso llega al techo;
  - **sin comprobar**;
  - **se pasa**.

---

## 6 · Lo común y lo tuyo

- **6.1** **El glosario común** lo trae la app. Lo escribe solo un script desde los datos revisados del repositorio, y **ningún usuario lo cambia**. Todos lo leen.
- **6.2** **Tus materiales** solo los ves tú. Los creas en el glosario, de cualquier tipo, con la misma ficha que los comunes (§3), sus propias regulaciones IFRA incluidas.
- **6.3** **Un provisional** se crea desde el banco con solo su nombre, para no parar. Más tarde se completa en el glosario.
- **6.4** **Lo que haces en el glosario nunca sustituye lo común: lo amplía.**

---

## 7 · Tu versión de un material común

- **7.1** **Ajustar un material común crea tu versión, basada en él.** Por ejemplo, la bergamota de tu proveedor con su certificado.
- **7.2** **Hereda todo lo del común**: composición, regulaciones y ficha. **Añade lo tuyo**: cifras con su autoridad (tu certificado manda sobre el anexo, §4.3), límites y nombres.
- **7.3** **Nunca quita un límite de IFRA, solo añade.** Si añades un límite, cuentan los dos y manda el más estricto.
- **7.4** **El común y tu versión salen los dos** en el buscador, la tuya marcada como tuya.
- **7.5** Es el mismo mecanismo que los productos de la v2 (V3-2), solo que lo tuyo es privado.

---

## 8 · Lo que tienes

- **8.1** En el glosario **marcas los materiales que tienes en el laboratorio**, de golpe o poco a poco, con el buscador.
- **8.2** **Es una lista, sin cantidades**: no es un inventario.
- **8.3** **Con el interruptor encendido**, el buscador del banco solo enseña lo que tienes. **Apagado**, enseña todo.
- **8.4** **(propuesta)** Tus materiales y tus versiones cuentan como «los tengo» al crearlos, y lo puedes quitar.

---

## 9 · Lo que entra de la v2

Los 3070 materiales `sustancia` de la v2 envuelven cada uno una sustancia de su propia tabla (3074 en total, con un solo CAS cada una). En la v3 son la misma cosa: el material tipo sustancia es la sustancia.

| Qué | Cuántos |
|---|---|
| Sustancias, naturales, bases | 4260 |
| Productos, como versiones comunes | 89 |
| Disolventes | 7 |
| Cifras de composición | 3140 |
| Estándares de IFRA 51 | 263 |
| Topes de fabricante | 13 |
| Condiciones probadas o supuestas | 2 |
| Nombres y perfil, del glosario de la v1 | 4347 filas, unidas por `v1-a-v2.csv` |

---

## 10 · Lo que no sé y necesito que me digas

| # | Pregunta | Mi propuesta |
|---|---|---|
| 10.1 | **¿El provisional es un tipo o un estado?** ¿Un «Musk de Juan» que luego completas pasa a ser una base? | Un estado: al completarlo eliges su tipo |
| 10.2 | **¿Se puede hacer tu versión de un producto** (una versión de una versión)? | Sí: hereda en cadena |
| 10.3 | **«Lo que tengo», ¿se marca sobre el material general o sobre el producto concreto?** | Sobre lo que elijas; marcar el general no marca sus productos |
| 10.4 | **¿Tus límites solo pueden ser más estrictos que IFRA?** | Sí (§7.3) |
| 10.5 | **El perfil (familia, uso, duración) de tus materiales**, ¿lo rellenas tú a mano? | Sí, con su base y su fuente, como cualquier cifra |
| 10.6 | **¿Una fórmula guardada como material** también se puede ajustar y marcar como «la tengo»? | Sí: es un material tuyo como los demás |
