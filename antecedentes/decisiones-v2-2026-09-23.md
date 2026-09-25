# Decisiones tomadas para la herramienta

> 🗄️ **Archivada el 2026-09-25.** Es la v2 de las decisiones, tal como estaba. **Manda la
> [v3](../decisiones.md)**, que conserva lo vigente de aquí y dice qué quedó superado.


**Lo que ya está decidido sobre cómo debe comportarse el Banco de Formulación cuando se
itere.** No es una lista de deseos: cada entrada viene de un error cometido, de una
corrección del usuario o de un dato verificado. **Se lee antes de tocar la herramienta.**

Actualizado: **2026-09-23**

---

# 🔴 BLOQUE 1 — Las tres reglas que no se negocian

## 1.1 · Un número sin su base es una trampa

**El error más caro del proyecto, y ha aparecido cuatro veces.** Los porcentajes de este
oficio se escriben en tres bases distintas y **nadie las declara**:

| Base | Qué es | Factor al 25 % de extracto |
|---|---|---|
| **% del producto terminado** | El frasco entero, alcohol incluido. **Es la base de IFRA** | ×1 |
| **% del concentrado** | Solo la materia aromática. Es la base de casi todo lo que dicen los proveedores y los foros | **×4** |
| **% de la dilución** | Sobre una solución que ya viene diluida *(castoreum al 20 %, IBQ al 40 %)* | variable |

> 🔴 **Todo número que la app guarde o muestre lleva su base pegada.** Un campo, no un
> comentario. **Un número sin base no se guarda.**

**Cómo se ha visto que falla:** *«Iso E Super hasta el 80 % de la fórmula»* contra
*«IFRA cat 4 = 20 %»* parecieron contradecirse durante siete semanas. **Son el mismo
número**: 80 % del concentrado × 25 % = 20 % del producto.

## 1.2 · Lo que no se sabe no vale cero

**Una carga desconocida no puede contarse como ausencia.** Las tinturas de la casa no
declaran cuánta materia llevan; el absoluto de trufa es una esencia compuesta sin
composición publicada.

> 🔴 **Ante un dato que falta, la app dice «no puedo comprobarlo», nunca «vas bien».**
> Un aviso verde falso es peor que no tener aviso.

⚠️ **Caso concreto ya en la paleta:** la tintura de haba tonka **está llena de cumarina**
y la cumarina tiene techo (1,5 % cat 4). Su carga es `SIN DATO`. Cualquier comprobación
de cumarina que ignore esa tintura **da un resultado falso, no incompleto**.

## 1.3 · El rango del proveedor no es el límite IFRA

De `2026-09-21-limites-de-uso-maese-lab.md`. Una alerta que diga *«pasas el límite
IFRA»* usando un rango de proveedor **está mintiendo**. Una que diga *«pasas el rango de
diseño que recomienda tu proveedor»* es igual de útil **y es verdad**.

> ✅ Por eso `limites-de-uso.csv` lleva la columna **`naturaleza`**. **Sin ella el dato
> es una trampa; con ella, es la función.**

🔴 **Y desde el 2026-09-23, con los techos reales en la mano, hay un matiz nuevo: el
proveedor NO es siempre el más estricto.** Cashmeran (5,00 % de Maese contra **3,80 %**
de IFRA) y geraniol (5,00 % contra **4,70 %**). **La app muestra los dos y avisa con el
menor.**

---

# 🆕 BLOQUE 2 — Lo decidido el 2026-09-23

## 2.1 · 🔴 Los límites son acumulativos, y no por material: **por sustancia**

> *«habría que tener en cuenta todos cuyos límites son acumulativos… de manera que te
> restrinja no solo el material en su máximo sino la combinación de varios»*

**Correcto, y el problema es un nivel más profundo de lo que parece.** Un estándar IFRA
**no limita un frasco: limita una sustancia, venga de donde venga.** El techo de cumarina
es el techo de *toda la cumarina del perfume*, esté puesta a propósito o llegue dentro de
un natural.

### Los cuatro casos que ya están en esta paleta

| Sustancia con techo | Fuentes simultáneas en casa | |
|---|---|---|
| 🔴 **Cumarina** *(1,5 %)* | El frasco al 9 % **+ la tintura de haba tonka** | Carga de la tintura **sin dato** |
| 🔴 **Citral** *(estándar propio)* | **Litsea cubeba** (mayoritariamente citral) + limón + mandarina | 🎯 **La litsea figura como «sin estándar propio» y su constituyente principal sí lo tiene** |
| 🔴 **Linalol** *(especificación)* | Frasco al 50 % + **cilantro** + lavanda + bergamota + litsea | Sin tope %, pero cuenta para alérgenos |
| 🔴 **HAP ≤1 ppb** | **Cade + estoraque** *(y birch tar y opoponax, si entran)* | **Explícitamente acumulativo en el estándar** |

🎯 **Esto resuelve por diseño un agujero que el repositorio ya tenía identificado y no
sabía cerrar:** los *falsos negativos del método por CAS* —el constituyente restringido
dentro de un natural que no tiene estándar propio—. **Buscar por CAS no los encuentra
nunca. Un modelo de composición sí.**

### Lo que implica en el modelo de datos

**Cada material necesita una lista de sus constituyentes regulados con su porcentaje**,
no solo su propio CAS:

```
litsea-cubeba:
  constituyentes:
    - citral:    70 %   (confianza: media, rango típico de la literatura)
    - limoneno:   8 %
```

Y el comprobador **suma por sustancia sobre todas las filas de la fórmula**, no por fila.

⚠️ **Y encima se apila una tercera capa: los alérgenos declarables** —eugenol, geraniol,
linalol, cumarina, alcohol bencílico, citral— **que también se suman por sustancia** y no
son un techo de seguridad sino una obligación de etiqueta. **Misma maquinaria, otra
tabla.**

> **Decisión: se deja para una iteración futura**, con el modelo anotado aquí. Lo que sí
> entra ya es **no fingir que no existe**: cuando un material de la fórmula tenga
> constituyentes regulados sin cuantificar, la app lo marca *(regla 1.2)*.

## 2.2 · ✅ Una dilución **no es un producto nuevo**: es un estado del material

> *«la mejor manera de dar de alta las diluciones, en vez de como producto nuevo, como
> una opción antes de añadir… das de alta tus diluciones en la manera en la que están:
> eugenol y seleccionar 11 % y DPG, de manera que eugenol tiene toda la carga de datos y
> es fuente directa de IFRA, no algo que alguien crea»*

🎯 **Es la decisión de arquitectura correcta, y el argumento que la cierra es el que da
el usuario: la fuente del dato.** Si «Eugenol 10 % DPG» fuese una entrada propia,
**alguien tendría que copiarle el techo IFRA** — y una copia se desincroniza. Con la
dilución como atributo, **hay un solo Eugenol, con un solo CAS y un solo estándar**, y
el 10 % es una operación aritmética encima.

### Lo que se gana, y no es solo limpieza

| | |
|---|---|
| ✅ **Una sola fila de verdad por sustancia** | Imprescindible para el sumatorio de 2.1: si hay dos entradas de eugenol, el acumulador las cuenta como sustancias distintas y falla |
| ✅ **«Materia real» se calcula sola** | Es literalmente `peso × concentración`. Deja de ser una columna que mantener |
| ✅ **El disolvente se vuelve dato** | Y con él, el totalizador de arrastre de DPG sale gratis — y separa DPG de alcohol, que no son lo mismo: uno acaba en la piel y el otro no |
| ✅ **Varios frascos del mismo material conviven** | **Ya pasa con seis**: Benjuí, Sandalmysore, Galaxolide y Ethylene Brassylate *(50 % y 10 %)*, Ebanol, AAG. Como atributo son un selector; como productos serían doce fichas |
| ✅ **Espeja la estructura del repositorio** | La ficha ya tiene `dilucion:` *(de fábrica)* y `dilucion_trabajo:` *(el frasco preparado)*. **El modelo de la app = el modelo de la ficha** |

### 🔴 El caveat que hay que implementar desde el principio: **son dos capas, no una**

**Algunos materiales ya vienen diluidos de fábrica**, y encima se les hace una dilución
de trabajo:

| Material | Producto del proveedor | Frasco de trabajo | **Materia real** |
|---|---|---|---|
| **Castoreum** | 20 % de absoluto | 0,100 g en 2,000 g | **1 % de absoluto** |
| **IBQ** | 40 % en DPG | 0,250 g en 2,000 g | **5 % de IBQ** |
| **Cashmeran** | 50 % en DPG | — | 50 % |

> 🔴 **Si la app guarda una sola concentración, el castoreum al 5 % se lee como 5 % de
> absoluto y el error es de cinco veces.** Hacen falta **`pureza_producto` y
> `dilucion_trabajo` como campos separados**, y la materia real es el producto de los dos.


> 🔧 **Esta tabla se corrigió el mismo día que se escribió, y el error es la mejor
> justificación que tiene la regla 1.1.** Decía *«5 % de ese producto → 2 % de IBQ»*:
> las dos cifras estaban mal —0,250 g sobre 2,000 g es el 12,5 % del producto, y la
> materia real es el 5 %—. **Lo escribió quien acababa de enunciar la regla de las tres
> bases, en el párrafo siguiente.**
>
> ✅ **De ahí sale una decisión de interfaz, no solo de modelo: la app etiqueta y pide
> los porcentajes en MATERIA PURA**, y la conversión desde la pureza del bote la hace
> ella. **Al usuario nunca se le pregunta un «% del producto del proveedor».**

**Es el mismo error de base de la regla 1.1**, y se cometió en este laboratorio el
2026-09-23 al planificar esos dos frascos. **Que quede en el esquema, no en la cabeza.**

### Cómo se ve en la interfaz

```
[ buscar material ]  →  Eugenol
                        ┌────────────────────────────────┐
                        │ ○ puro (98 %)                  │
                        │ ● 10,11 % en DPG  · 2026-09-23 │  ← frascos ya dados de alta
                        │ + dar de alta otra dilución    │
                        └────────────────────────────────┘
        [ 125 ] mg  →  materia real 12,6 mg · arrastra 112 mg de DPG
```

**Dar de alta una dilución = material + porcentaje + disolvente + fecha.** Cuatro campos.
**Ninguno de ellos es el techo IFRA**, y ese es justo el punto.

## 2.3 · La app lleva los IFRA reales, de fuente primaria

**La fuente es [`conocimiento/normativa/ifra-cat4.csv`](../../conocimiento/normativa/ifra-cat4.csv)**:
una fila por material de la paleta, con su estado, el techo de **categoría 4** en % del
producto terminado, el estándar, **la URL de su PDF**, la enmienda, las condiciones y los
constituyentes regulados. Cómo se lee, en su [README](../../conocimiento/normativa/README.md).

| | |
|---|---|
| **Fuente** | Los 216 PDF de estándar individual de la 51ª enmienda, descargados y leídos, y el índice oficial buscado por CAS |
| **Confianza** | **Alta** — es el documento de IFRA, no la interpretación de nadie |
| **Categorías** | 🔧 **Solo la 4** *(ver abajo)* |

> 🔧 **Cambiado el 2026-09-23, en la reorganización del repositorio, por decisión del
> usuario.** Esta decisión decía *«las 18, no solo la 4: la app debe dejar elegir
> categoría»*. **Ahora es solo la 4**: el laboratorio hace perfume de piel y las otras
> diecisiete son ruido en la mesa de trabajo. **No se ha perdido nada:** la transcripción
> completa de las 18 está archivada en
> [`fuentes/investigaciones/2026-09-23-ifra-18-categorias.csv`](../../fuentes/investigaciones/2026-09-23-ifra-18-categorias.csv),
> y cada fila de la fuente enlaza el PDF de su estándar. **Elegir categoría pasa de
> requisito a posibilidad futura.**

⚠️ **Y tiene que llevar la enmienda como dato.** Hoy es la 51ª y la 52ª está en consulta.
**Un techo sin versión caduca en silencio.**

🔴 **Lo que la app debe distinguir, y la fuente ya distingue:** *«sin estándar propio»*
no es *«sin obligaciones»*. El cade y el estoraque no se gobiernan con un porcentaje sino
con **un certificado del proveedor** (columna `condicion`); los tipos `sin verificar` y
`no evaluable` son estados propios, y `constituyentes_regulados` es la semilla del modelo
de 2.1. **Nada de eso se pinta en verde.**

---

# BLOQUE 3 — Lo que ya está decidido y vigente *(v2, 2026-09-19)*

| | |
|---|---|
| **Se trabaja en miligramos** | `21`, no `0,021`. Hace visible el límite de la báscula |
| **El log es la fórmula** | Todo se deriva de la lista cronológica. Deshacer = quitar la última. **No hay dos fuentes de verdad** |
| **Avisos de pesada** | <20 mg muestra su error; <5 mg sale **impesable**. Es la lección del AAG hecha interfaz |
| **Trazas en ppm** | Por debajo de 0,001 g, y pulsando salen todos los decimales |
| **Una base es inmutable** | Editarla no existe: se crea otra. Misma lógica que los `vN` |
| **Las bases no pierden decimales** | Reparto por fracción exacta de gramos de origen, nunca por porcentaje redondeado |
| **CSV y Markdown, nunca `.xlsx`** | Para que el histórico sea legible en diffs de Git |
| **«Total g» ≠ «materia real»** | Los techos se miden sobre la materia real. Leerlos en el peso es equivocarse por diez |

---

## Cómo se añade una decisión aquí

**Una decisión entra cuando viene de algo que pasó**, no de una idea suelta: un error
cometido, una corrección del usuario, un dato verificado. **Se escribe el porqué, no solo
el qué** — dentro de seis meses el qué se recuerda y el porqué no.
