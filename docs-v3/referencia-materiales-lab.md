# Materiales en la v3 — referencia para el plan

Cómo se modela un material y cómo se comporta, a partir de lo probado en el laboratorio con
111 materiales reales. Es la referencia para `PLAN_V3`; el detalle de columnas está en
[`esquema.sql`](esquema.sql) y los datos, en [`materiales.sqlite`](materiales.sqlite).

Extiende lo que el plan ya dice (§15–23: `Material`, `owner_id`, `MaterialComponent`,
`Concentration`). Lo nuevo va marcado con **(nuevo)**.

## 1. Qué es un material: tres categorías

`MaterialKind` no estaba definido en el plan. Son tres, según **qué define al material**:

| `kind` | Lo define | Su identidad es | Ejemplos |
|---|---|---|---|
| `molecule` | su química | el CAS | Hedione, ionona alpha, cumarina, DPG |
| `natural` | su origen | especie + parte + método | aceites esenciales, absolutos, resinoides, tinturas |
| `composition` | su receta | el producto de una casa | Cassis Base 345 B, Auranone, una base propia |

Más `provisional`, que ya está en el plan (§19).

Reglas de clasificación, que el plan debería recoger:

- **Decide la química, no cómo se vende ni si es natural.** La cumarina natural es una
  molécula. Una mezcla de isómeros (Iso E Super, óxido de rosa) es una molécula.
- **Un semisintético sacado de un natural es `natural`** (guayaco acetilado): su
  composición varía porque varía su materia de partida.
- **Los disolventes son materiales** (`molecule`), con función «disolvente».
- **La dilución no es una categoría**: es un estado del frasco. Galaxolide al 50 % sigue
  siendo Galaxolide.

## 2. Estándar y versión **(nuevo)**

Es la distinción que más simplifica:

- **El estándar** es el material global (`owner_id = NULL`): lo que vale para cualquier
  usuario y proveedor. Hedione es Hedione.
- **La versión** es el frasco concreto de un usuario: proveedor, grado, pureza, proporción
  de isómeros, dilución de fábrica. Vive en la capa del usuario y apunta al estándar.

Consecuencias:

- Hedione HC, Iso E Super Plus o un eugenol al 98 % **son versiones**, no materiales
  nuevos. Se distinguen por un campo de grado.
- En un natural, la versión lleva además procedencia, quimiotipo y lote.
- Una composición casi nunca tiene versiones: el producto es el estándar.
- Dos materiales distintos que se venden con el mismo nombre (α-amil y α-hexil cinámico)
  **son dos estándares**. Pasó de verdad: hubo que separarlos.

## 3. Qué lleva un material

**Núcleo, común a las tres categorías** (13 campos; es lo que mide si un material está
«completo»):

| Bloque | Campos |
|---|---|
| Identidad | nombre y sinónimos · CAS |
| Olor | familia (una) · facetas (dos o tres) |
| Comportamiento | piso · evolución por tramos · tenacidad · potencia · umbral · difusión · efecto en la mezcla |
| Uso | función · dilución recomendada |
| Seguridad | IFRA (tabla aparte) |

**Propio de cada categoría:**

| `kind` | Campos |
|---|---|
| `molecule` | casa original · origen de síntesis · isómeros |
| `natural` | forma (aceite esencial, absoluto…) · especie · parte · método · quimiotipo · procedencia |
| `composition` | casa · código · qué quiere oler |

**Opcional y compacto:** física (estado, color, solubilidad, densidad, punto de fusión,
estabilidad, incompatibilidades).

**En tablas aparte, porque son varias filas por material:**

- **Componentes** — `material_components`, como en el plan (§21–22).
- **Dosis** — una fila por fuente, con mínimo, típica, máxima y **su base**. Nunca un
  número suelto: las fuentes no coinciden y hay que conservarlas todas.
- **Relaciones** — combina con, choca con, sustituto. Apuntan a otro material si existe.
- **Descriptores por fuente** y **perfumes de referencia**.
- **IFRA** — varias filas si el material cae bajo varios estándares; manda el menor.

**Capa del usuario** (`user_*`): su frasco (la versión), sus diluciones preparadas, su
cata y su lectura, y **sus ejes estéticos**, que son su sistema y no del material.

## 4. Cómo se comporta

1. **Un dato que falta es `NULL`, nunca cero.** Sobre todo en IFRA y en componentes:
   desconocido no es «sin restricción» (ya en el plan, §19).
2. **Todo porcentaje lleva su base**: del concentrado, del producto terminado o «sin
   declarar». Mezclarlas es el error más frecuente de las fuentes.
3. **Los componentes no se expanden solos** (plan, §23), y su cantidad es exacta, máxima,
   rango o desconocida. Para un natural, lo habitual es rango o máxima.
4. **Los límites son por sustancia.** La misma sustancia que llega por dos materiales suma
   contra el mismo techo; por eso los componentes regulados de un natural tienen que
   enlazar con la molécula.
5. **Un dato puede estar en disputa (nuevo).** El campo guarda un valor provisional y una
   tabla `conflicts` dice qué choca con qué y según quién, en estado pendiente o resuelto.
   La app debería poder enseñar que un dato es provisional.
6. **Cada dato lleva su fuente** (etiquetas cortas) y el material, una confianza.
7. **El IFRA de segunda mano no se usa para calcular.** Se guarda como texto, marcado
   «sin verificar» y sin número; solo cuenta el comprobado contra el estándar.

## 5. Escalas

| Campo | Escala | Estado |
|---|---|---|
| Piso | salida · salida-corazón · corazón · corazón-fondo · fondo | cerrada |
| Potencia | bajo · medio · alto · muy alto | cerrada |
| Tenacidad | horas en tira, material puro | **abierta** |
| Evolución | cinco tramos (0–15 min · 15 min–2 h · 2–8 h · 8–24 h · más de 24 h), intensidad 0–3 | definida, sin datos: sale de la cata |
| Familia olfativa | texto libre | **abierta**: falta el vocabulario |

## 6. Lo que enseñó rellenarla

Con 106 materiales investigados por dos vías independientes (búsqueda web y The Good
Scents Company):

- **El núcleo se llena bien**: 10 campos de 13 de media. Lo que casi nunca aparece es el
  umbral, la difusión y la evolución.
- **Quedan 222 conflictos pendientes.** Por campo: familia 36, identidad 32, tenacidad 29,
  dosis 29, CAS 20, potencia 18, estado físico 16, IFRA 16.
- **La identidad es el problema de fondo** (32 casos): la ficha pública no es exactamente
  la del frasco — otro CAS, otro isómero, otra parte de la planta, una ficha genérica. Es
  el argumento a favor de separar estándar y versión.
- **Los naturales tienen dos CAS**, el europeo y el americano. El modelo tiene que admitir
  varios por material.
- **La tenacidad no es comparable entre fuentes**: chocan en los dos sentidos y por más de
  diez veces. Hay que decidir de dónde sale antes de enseñarla como número.
- **La dosis máxima varía hasta diez veces entre fuentes**, en parte por la base.

## 7. Decisiones abiertas para el plan

1. De dónde sale la tenacidad, y si se enseña como número o como tramo.
2. El vocabulario de familias olfativas.
3. Si la versión del usuario es una fila ligada al estándar (como está aquí) o un material
   privado que hereda de él.
4. Si los conflictos viajan a la app o se quedan en el laboratorio.
5. Varios CAS por material: lista en el propio material o tabla aparte.
