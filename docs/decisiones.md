# Decisiones de la app — v3

**Lo que manda sobre qué es la app y cómo se comporta.** Sale del
[interrogatorio](interrogatorio.md) del 2026-09-25, que guarda la respuesta literal de cada
decisión (`P1` a `P22`), y de lo que seguía vigente de la
[v2](antecedentes/decisiones-v2-2026-09-23.md) (`v2 §x`). Los
[antecedentes](antecedentes/README.md) no obligan a nada.

> 🟡 **Borrador para revisar, 2026-09-25.** Muchas lecturas del interrogatorio quedaron
> «por confirmar»; se confirman aquí, de una vez. Lo que no sea lo que el usuario quiso
> decir se corrige en este documento, con fecha. El punto de [§2.5](#25--la-dilución-es-un-dato-de-la-línea-no-un-producto)
> que habría cambiado la v2 **se resolvió el mismo día: se mantiene la v2**.

Actualizado: **2026-09-25**

---

# 0 · Qué es la app

| | |
|---|---|
| **Para quién** | Para el usuario, primero. **Puede acabar siendo un producto independiente** (P21): nada de lo que se decida debe cerrar esa puerta |
| **Para qué** | **Documentar y adjuntar formulaciones** con la información que no se ve a simple vista: IFRA, composición real, historia. **No es un inventario** (P1, P6) |
| **Partes** | El **banco**, donde se formula, que es **el foco de ahora** · la **biblioteca de fórmulas** · el **alta de materiales** · el **glosario visual** de materiales y fórmulas, más adelante (P15). Lo que va antes del banco está sin diseñar |
| **Dónde** | **Ejecutable propio para Windows**, instalable, sin navegador, hecho con **Tauri 2**. El móvil (Android e iOS) viene después, con la misma base de código; mientras tanto, cada decisión se toma **pensando en poder llevarla** a pantalla estrecha (P14, P21, P22) |
| **Autonomía** | **Funciona sola y sin internet.** Lleva dentro sus datos de referencia y **no necesita el repositorio para funcionar** (P2, P16) |

---

# 1 · Las tres reglas que no se negocian

*De la v2, intactas.*

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

*«Iso E Super hasta el 80 % de la fórmula»* contra *«IFRA cat 4 = 20 %»* parecieron
contradecirse durante siete semanas. **Son el mismo número**: 80 % del concentrado × 25 % =
20 % del producto.

## 1.2 · Lo que no se sabe no vale cero

**Una carga desconocida no puede contarse como ausencia.**

> 🔴 **Ante un dato que falta, la app dice «no puedo comprobarlo», nunca «vas bien».**
> Un aviso verde falso es peor que no tener aviso.

La tintura de haba tonka **está llena de cumarina**, la cumarina tiene techo (1,5 % cat 4) y
su carga es `SIN DATO`. Cualquier comprobación de cumarina que ignore esa tintura **da un
resultado falso, no incompleto**.

## 1.3 · El rango del proveedor no es el límite IFRA

Una alerta que diga *«pasas el límite IFRA»* usando un rango de proveedor **está
mintiendo**. Una que diga *«pasas el rango de diseño que recomienda tu proveedor»* es igual
de útil **y es verdad**. Por eso `limites-de-uso.csv` lleva la columna **`naturaleza`**.

El proveedor **no es siempre el más estricto**: Cashmeran, 5,00 % de Maese contra **3,80 %**
de IFRA; geraniol, 5,00 % contra **4,70 %**. **La app muestra los dos y avisa con el
menor.**

---

# 2 · Materiales

## 2.1 · Cuatro tipos, cada uno con su señal

| Tipo | Qué es | IFRA |
|---|---|---|
| **Base** | Los materiales conocidos, el glosario, cada uno con su CAS | Por CAS, de fuente primaria ([§5](#5--ifra)) |
| **Propio** | Dado de alta por el usuario **con los mismos campos que uno de la base**, o con **huecos marcados**: una tintura sin carga conocida, un IFRA desconocido | El suyo, o «desconocido» donde haya hueco |
| **Provisional** | **Solo un nombre**, para no parar a definirlo | Desconocido: la fórmula lo avisa |
| **Fórmula como material** | El vector de una fórmula ([§2.4](#24--el-id-de-material-de-una-fórmula-es-su-vector)) | Por sustancia, sobre su desglose |

- **Cada tipo lleva una señal visual propia**, un icono u otra, por definir. Así un nombre
  propio no se confunde con uno de la base (P11).
- **Los propios se añaden a propósito**: viven en las fórmulas del usuario, pero **no son la
  paleta base** (P7). Una tintura propia con sus pruebas de límites es el caso típico.

## 2.2 · Los materiales son vectores, y no cambian

- **Un material define cómo se reparte, no cuánto hay.** La cantidad es siempre la que se
  escribe al añadir, y se desglosa en sus proporciones (P10).
- **Un material no cambia nunca.** Lo que cambia son las fórmulas. Una fórmula que se usa
  como material es un material nuevo, fijo en ese momento (P1, P18).

## 2.3 · Un material compuesto se guarda plano, con la procedencia aparte

*P9.*

- **Se guarda desglosado hasta las materias primas**, con CAS o, si no hay, el nombre, en %
  de la mezcla y **con los diluyentes incluidos**. Ejemplo del usuario:
  `mat(DPG 50 % · 15932-80-6 10 % · Angelica seed absolute 20 % · Anisyl alcohol 20 %)`.
- **IFRA se calcula siempre sobre ese desglose.** De dónde salió («Acorde de higos,
  25-09-2026») es **un dato legible aparte**, que no entra en el cálculo.
- **Un producto que ya viene diluido de fábrica no es un compuesto: tiene pureza.** El
  castoreum del proveedor es castoreum con **pureza 20 %**, y el resto es su disolvente
  ([§2.5](#25--la-dilución-es-un-dato-de-la-línea-no-un-producto)). *Corregido el 2026-09-25: la primera redacción lo
  trataba como compuesto.*


## 2.4 · El ID de material de una fórmula es su vector

*P18.*

- **Cada fórmula tiene un ID de material, y es lo que manda al importarla.** Al usar una
  fórmula como material **solo viaja su vector**: la concentración de cada material,
  diluyentes incluidos. **Ni historial, ni tara, ni lotes, ni notas.**
- **El ID se calcula a partir del vector.** Dos composiciones idénticas dan el mismo ID, y
  cualquier edición da uno nuevo. Así, **«los materiales no cambian» se cumple por
  construcción**: lo que se importó ayer sigue siendo ese vector aunque la fórmula cambie
  hoy. Hay precedente en [`05-libreria-global-e-intercambio.md`](antecedentes/formulacion/05-libreria-global-e-intercambio.md) §2.
- **El vector guarda proporciones exactas, no porcentajes redondeados.** El % es solo cómo
  se muestra. Es la regla de la v2 «las bases no pierden decimales»: un componente de 1,2 µg
  sigue siéndolo.
- **La importación no puede fallar, tampoco en otro proyecto.** Los componentes de la base
  se resuelven por CAS. **Los propios y los provisionales viajan con su definición dentro**;
  si no, al llegar serían desconocidos.

## 2.5 · La dilución es un dato de la línea, no un producto

*P7, v2 §2.2.*

**Sigue en pie el argumento central de la v2:** hay **un solo eugenol**, con un solo CAS y
una sola fuente IFRA, y la dilución es un dato encima. Si «Eugenol 10 % DPG» fuese un
material propio, alguien tendría que copiarle el techo IFRA, y una copia se desincroniza.

| Lo que se gana | |
|---|---|
| **Una sola fila por sustancia** | Imprescindible para sumar por sustancia ([§5.3](#53--se-suma-por-sustancia-desde-el-diseño)): dos entradas de eugenol contarían como dos sustancias |
| **La materia real se calcula sola** | Es `peso × concentración` |
| **El disolvente es un dato** | Y con él, lo que arrastra cada adición. DPG y alcohol no son lo mismo: uno se queda en la piel y el otro no |

**Lo que cambia respecto a la v2:** ya **no hay frascos dados de alta** entre los que elegir
(P6). La dilución se escribe en la línea, con memoria: sale **la última con que se usó ese
material**, y hay **diluciones favoritas** fijadas por material (P7).

**Qué porcentaje se escribe: la concentración final de materia pura.** Confirmado por el
usuario el 2026-09-25: *«sobre los materiales solo hay pureza y porcentaje, si compras una
dilucion y la diluyes pones el porcentaje final diluido no el de la dilucion»*.

- **Un material tiene pureza**: cómo viene del proveedor. 100 % si es puro; castoreum,
  20 %; IBQ, 40 %.
- **En la línea se escribe el porcentaje final**: la concentración de materia pura en lo
  que se vierte. Castoreum al 20 %, 0,100 g en 2,000 g: se escribe **1 %**, no 5 %.
- **Se mantiene la regla de la v2**: al usuario nunca se le pide el % del producto del
  proveedor. La app **no deja escribir un porcentaje mayor que la pureza**, y sabe qué
  disolvente lleva cada adición: el del producto, si está declarado, más el diluyente
  añadido.

**Por qué importa, con los casos de la paleta:**

| Material | Producto del proveedor | Frasco de trabajo | **Materia real** |
|---|---|---|---|
| **Castoreum** | 20 % de absoluto | 0,100 g en 2,000 g | **1 % de absoluto** |
| **IBQ** | 40 % en DPG | 0,250 g en 2,000 g | **5 % de IBQ** |
| **Cashmeran** | 50 % en DPG | — | 50 % |

Si la app guardara una sola concentración, **el castoreum al 5 % se leería como 5 % de
absoluto, y el error sería de cinco veces**. La v2 corrigió esta misma tabla el día en que
se escribió, y la escribía quien acababa de enunciar la regla de las tres bases.

---

# 3 · Fórmulas

## 3.1 · Se editan, con deshacer

Añadir, quitar y cambiar cantidades, con **deshacer** (P1, P4). Se pierde el uno a uno con
el banco real, y se gana lo que es el propósito: **documentar**.

## 3.2 · Sin dependencias: guardar y guardar como

*P15, P19, P20.*

- **Las fórmulas no dependen unas de otras**, aunque una salga de otra. **Las distingue el
  nombre.**
- **Guardar** sustituye la fórmula. **Guardar como** crea una variación, una fórmula nueva
  con un nombre que lleve el matiz.
- **Al guardar como, la app pregunta si sigue en el mismo vial.** Si sigue, el recipiente
  pasa a la variación, y la original queda como **receta sin vial** (ya no se reabre
  pesando). Si no, pide la tara nueva.
- **La variación se lleva una copia del historial** hasta ese momento y sigue sola. Es una
  copia, no un vínculo.

## 3.3 · La cabecera: recipiente y lotes

*P12, P13; los lotes, del Banco v2.*

| Campo | Qué es |
|---|---|
| **Nombre** | Lo que distingue una fórmula de otra |
| **Recipiente** | Capacidad y **tara**, pesada con la precisión del trabajo |
| **Lote de trabajo** | Lo que se está formulando |
| **Lote final** | Lo esperado, con el alcohol. **IFRA se mide sobre él** |

**El porqué, con un caso del cuaderno.** El export del Banco de
[F-001-v1](https://github.com/smortenax/perfumeria-lab/blob/master/formulas/f-001-lejia/v1.md) calculaba los porcentajes sobre **70 g**, un
«final esperado» sin actualizar, en vez de sobre los **8,745 g** reales: **todos los números
salieron ocho veces por debajo**. Lote de trabajo y lote final tienen que estar a la vista y
ser inequívocos.

## 3.4 · El historial manda

*P8, P18; evoluciona «el log es la fórmula» de la v2.*

- **El historial es la secuencia de cambios**, cada uno con su material y su cantidad, en
  orden. **Cada cambio es un fotograma, no un momento en el tiempo.**
- **La composición actual se deriva del historial**, así que no hay dos fuentes de verdad.
  La edición libre de §3.1 son más cambios en el historial.
- **Notas opcionales**, sobre todo al hacer una mezcla: cómo cambió la fórmula un material,
  para tenerlo en cuenta en las siguientes. **Cada nota marca un punto del historial.**
- **Poder volver a un punto anterior no es requisito**; está por evaluar.
- **Tiene que ser más que una tabla de números.** Guardar cada cambio es lo que hará posible
  el *play* ([§8](#8--aplazado)).

## 3.5 · Reabrir pesando

*P12.*

**Al reabrir una fórmula con vial, se pesa.** Peso bruto menos tara es **lo que queda de
verdad**. La app escala todos los componentes a esa masa, y lo apunta en el historial como
un fotograma. **No hace falta contar usos**: la báscula ya incluye lo usado en otras
fórmulas, las muestras, lo derramado y lo evaporado.

Por qué importa: añadir 1 g sobre la receta de 10 g da un 9,1 %; sobre los 8 g que quedan
de verdad, un 11,1 % (P10).

⚠️ **Escalar en proporción supone que todo se va por igual.** Es cierto para lo que sale del
vial por uso, **no para lo que se evapora**, que se lleva antes el alcohol y las salidas. La
app lo avisa cuando la pérdida es grande o ha pasado tiempo.

## 3.6 · Una fórmula como material

*P7, P10, P18.*

Se añade como cualquier material. **Viaja solo su vector** (§2.4): al añadir X mg, se
reparten entre sus componentes en su proporción exacta. La línea se ve como «Nombre de la
fórmula, X mg», y cada componente suma su parte a la fórmula. **Al añadir no hay límite ni
aviso de cantidad**: los materiales son vectores.

---

# 4 · La barra de añadir

*P7, P11. [Captura anotada por el usuario](media/2026-09-25-barra-de-anadir-anotada.png).*

**Cuatro zonas, de izquierda a derecha**, y el cursor salta de una a la siguiente:

| Zona | Qué hace |
|---|---|
| **➕** | Lo que no está en la paleta base: **material nuevo rápido** (basta un nombre), **fórmula como material** y **de mis materiales** |
| **Buscador** | **Un solo buscador**, que **se queda con el material elegido**: no hay campo «Seleccionado». **Dos interruptores independientes**, uno para incluir **mis materiales** y otro para **fórmulas como material**, porque la base IFRA ya es enorme |
| **Dilución** | Porcentaje, **100 % por defecto**, y al lado el **diluyente**, uno habitual o uno provisional. Sale **la última dilución** con que se usó ese material; las **favoritas**, siempre a mano |
| **Cantidad** | **mg por defecto**; la unidad se puede cambiar a g para lotes grandes. **Enter añade** |

---

# 5 · IFRA

## 5.1 · Fuente primaria, categoría 4, con su enmienda

*v2 §2.3.*

- **La fuente es [`ifra-cat4.csv`](https://github.com/smortenax/perfumeria-lab/blob/master/conocimiento/normativa/ifra-cat4.csv)**, sacada de los
  PDF de los 216 estándares de la **51.ª enmienda** y del índice oficial por CAS.
  **Confianza alta**: es el documento de IFRA.
- **Solo la categoría 4.** El laboratorio hace perfume de piel. Las 18 categorías están
  archivadas en [`2026-09-23-ifra-18-categorias.csv`](https://github.com/smortenax/perfumeria-lab/blob/master/fuentes/investigaciones/2026-09-23-ifra-18-categorias.csv);
  elegir otra categoría es una posibilidad futura.
- **La enmienda va como dato.** Un techo sin versión caduca en silencio.

## 5.2 · La base entera necesita IFRA por CAS

*P5.* Hoy IFRA está transcrito solo para **los 54 materiales de la paleta**. Para que la
base sea el glosario entero hace falta **una tabla de los 216 estándares por CAS**, en
categoría 4. Es trabajo de datos, con el método ya escrito en
[la investigación de los 216 estándares](https://github.com/smortenax/perfumeria-lab/blob/master/fuentes/investigaciones/2026-09-23-niveles-de-uso-y-los-216-estandares.md).
Mientras tanto, lo que no esté en la tabla es **«sin comprobar»**, no «sin estándar».

## 5.3 · Se suma por sustancia, desde el diseño

*P3, v2 §2.1.*

Un estándar IFRA **no limita un frasco: limita una sustancia, venga de donde venga.**

- **El modelo lleva constituyentes desde el principio.** Cada material puede declarar las
  sustancias reguladas o alérgenas que contiene, con su %, su base y su fuente.
- **El cálculo suma por sustancia** sobre toda la fórmula, desglosada.
- **Se carga lo que se sabe.** Sin constituyentes declarados, un material cuenta solo con
  su techo propio: es el funcionamiento esperado, no un error.
- **Los alérgenos declarables usan la misma maquinaria**, con otra tabla. Sus umbrales de
  declaración en etiqueta son el **vacío 12** de `fuentes/vacios.md`: no se inventan.

**Los cuatro casos que ya están en la paleta:**

| Sustancia con techo | Fuentes a la vez en casa | |
|---|---|---|
| 🔴 **Cumarina** *(1,5 %)* | El frasco al 9 % **+ la tintura de haba tonka** | Carga de la tintura **sin dato** |
| 🔴 **Citral** *(estándar propio)* | **Litsea cubeba** (sobre todo citral) + limón + mandarina | La litsea figura como «sin estándar propio» y su constituyente principal sí lo tiene |
| 🔴 **Linalol** *(especificación)* | Frasco al 50 % + cilantro + lavanda + bergamota + litsea | Sin tope %, pero cuenta para alérgenos |
| 🔴 **HAP ≤ 1 ppb** | **Cade + estoraque** | **Explícitamente acumulativo en el estándar** |

Esto cierra **por diseño** los falsos negativos de buscar por CAS: el constituyente
restringido dentro de un natural sin estándar propio. **Buscar por CAS no lo encuentra
nunca; un modelo de composición sí.**

## 5.4 · Dos lecturas, siempre, sobre el lote final

*P13, P17.*

El panel de IFRA da **siempre las dos**, salidas del mismo cálculo:

1. **¿Se puede usar tal cual, a su lote final?** En un acorde, lo normal es que no.
2. **¿Hasta qué % se puede usar en un perfume?** Vale para cualquier perfume, sea cual sea
   su tamaño.

No hay «modo acorde». Como mucho, cambia cuál de las dos se destaca.

## 5.5 · Lo desconocido siempre se avisa

*P3, P7, §1.2.*

- Un material provisional, un diluyente provisional, una carga `SIN DATO` o un constituyente
  sin cuantificar salen **marcados**, nunca en verde.
- Con desconocidos, la segunda lectura dice **«hasta X %, según lo conocido»** y qué no se ha
  podido contar.
- **«Sin estándar propio» no es «sin obligaciones».** El cade y el estoraque se rigen por un
  **certificado del proveedor**, no por un porcentaje: aparecen como **condición** que
  cumplir, no como cifra.

---

# 6 · Guardar, datos y cuaderno

| | |
|---|---|
| **Guardar lo guarda todo** | Historial y todas las variables de la fórmula, aunque nunca se exporte (P16, P18) |
| **Formato** | **JSON, un archivo por fórmula**: la cabecera, el historial con un cambio por línea, y la composición actual para poder leerla sin la app. Es texto: se lee, y Git ve los cambios línea a línea (P18) |
| **Dónde** | **Archivos en el disco**, con guardado automático. **Nada depende de la memoria del navegador**, que se borra al limpiar los datos (P16, P21) |
| **Datos de referencia** | Un **paquete versionado**, generado desde el repositorio del laboratorio ([`perfumeria-lab`](https://github.com/smortenax/perfumeria-lab)) e incluido en la app: IFRA, glosario, niveles de uso, constituyentes. Dice de qué commit del laboratorio sale (P2) |
| **Vuelta al cuaderno** | **Exportar es una acción aparte**: las fórmulas a Markdown en `formulas/`, los materiales propios a CSV (P16) |
| **Convención del cuaderno** | Markdown y CSV, **nunca `.xlsx`** (v2) |

---

# 7 · Lo que queda del Banco v2

| Decisión de la v2 | En la v3 |
|---|---|
| **Se trabaja en miligramos** | ✅ Vigente. La unidad se puede cambiar; **mg por defecto** (§4) |
| **El log es la fórmula** | 🔄 Evoluciona: **el historial manda**, con edición libre (§3.4) |
| **Avisos de pesada**: <20 mg muestra su error; <5 mg sale **impesable** | ✅ Vigente |
| **Trazas en ppm** por debajo de 0,001 g, y al pulsar salen todos los decimales | ✅ Vigente |
| **Una base es inmutable** | 🔄 Evoluciona: **el material-vector no cambia** (§2.2, §2.4) |
| **Las bases no pierden decimales** | ✅ Vigente: **el vector guarda proporciones exactas** (§2.4) |
| **CSV y Markdown, nunca `.xlsx`** | ✅ Vigente para el cuaderno; la app guarda en JSON (§6) |
| **«Total g» ≠ «materia real»** | ✅ Vigente |

---

# 8 · Aplazado

| | Lo que ya queda preparado |
|---|---|
| **Glosario visual** de materiales y fórmulas: la línea paralela | Se sigue en [`antecedentes/lenguaje-visual/`](antecedentes/README.md) |
| ***Play* del historial**: la fórmula animada, fotograma a fotograma, con las infografías | El historial guarda cada cambio (§3.4) |
| **Móvil**, Android e iOS | Misma base de código (Tauri 2). Android se prueba en el emulador de Android Studio desde Windows; **iOS necesita un Mac** para probarse en el iPhone y para publicar |
| **Umbrales de alérgenos** de la UE | La maquinaria por sustancia (§5.3); el dato es el vacío 12 |
| **Otras categorías IFRA** | Las 18 archivadas (§5.1) |
| **Recuperar un punto del historial** | Por evaluar (§3.4) |
| **Producto**: publicar, licencias de los datos (IFRA, FIG) antes de distribuir | El ID-vector ya sirve para compartir (§2.4). El repositorio propio ya existe (2026-09-25) |
| **Lo que va antes del banco** | Sin diseñar (§0) |

---

# 9 · Superado

Se tacha, no se borra: el texto original sigue en los antecedentes.

| Lo que se dijo | Dónde | Superado por |
|---|---|---|
| ~~IFRA fuera de la primera versión~~ | [Entradas del 11-08](antecedentes/formulacion/entradas-para-decisiones-app.md) | P3, 2026-09-25: la fuente primaria existe; IFRA entra desde el diseño |
| ~~No cargar datos IFRA en la app~~ | [03 §7](antecedentes/formulacion/03-motor-de-calculo.md), brief §7 | P3, P2: la app lleva IFRA dentro |
| ~~El sello olfativo como razón de ser~~ | [Brief](antecedentes/formulacion/00-brief-agosto-ex-claude-md.md) §1 | Línea paralela, aplazada (§8) |
| ~~Stock por lotes y movimientos; alta y baja en un clic~~ | [02 §3](antecedentes/formulacion/02-dominio-y-datos.md), entradas del 11-08 | P6: sin inventario; solo se pesa al reabrir (§3.5) |
| ~~Acordes anidados con vínculo vivo, versión fijada, ciclos, profundidad máxima~~ | 02 §1, 03 §4 | P1, P9, P18: vectores fijos (§2.4) |
| ~~Elegir entre frascos dados de alta~~ | v2 §2.2 | P6, P7: dilución en la línea (§2.5) |
| ~~Escribir el % del producto, con la materia pura al lado~~ | Propuesta de la v3, 2026-09-25 | El usuario, el mismo día: pureza y porcentaje final (§2.5) |
| ~~Fórmulas que solo crecen, con estados fijos~~ | Primera lectura de P1 | Corrección de P1: se editan (§3.1) |
| ~~Descendencia entre fórmulas, árbol madre → hijas~~ | Primera lectura de P1; opción C de P15 | P15: sin dependencias (§3.2) |
| ~~React + Postgres + servidor + Capacitor~~ | Brief §3 | P21: Tauri 2, sin servidor |
| ~~Las 18 categorías IFRA a elegir~~ | Decisión del 23-09 | Reorganización del 23-09: solo la 4 (§5.1) |

---

## Cómo se añade una decisión

**Pasa por el [interrogatorio](interrogatorio.md)**: pregunta con código, respuesta literal y
lectura. Luego se escribe aquí **con su porqué**, no solo el qué: dentro de seis meses el qué
se recuerda y el porqué no. Una decisión entra cuando viene de algo que pasó: un error
cometido, una corrección del usuario o un dato verificado.
