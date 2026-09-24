# 05 — Librería global e intercambio de fórmulas

---

## 1. El problema

Formulair exporta a PDF, Markdown y TSV. Los tres son formatos para que **un humano lea**. Ninguno se puede volver a importar en otra instalación y reconstruir la fórmula, porque falta lo esencial: una forma inequívoca de decir *qué material es este*.

"Ambrox" puede ser Ambroxan de Symrise, Ambroxide, Cetalox de Firmenich, Amberlyn de otro proveedor, o una base con Ambroxan al 50 % en DPG. Sin resolver eso, pegar una fórmula ajena es un ejercicio de adivinación.

Hay un segundo problema, más sutil y que casi nadie ve: en el modelo de Formulair **la dilución vive en la entrada de fórmula**. Una fórmula lleva pegada la infraestructura del taller de quien la escribió — que tenía el vetiver al 10 % y el índol al 1 %. Esa información es ruido para el receptor, que tiene sus propias diluciones.

Resolver estas dos cosas es lo que el usuario identifica correctamente como el diferencial frente a la competencia.

---

## 2. Códigos canónicos de material

Un identificador con espacio de nombres, legible, estable y que degrada bien cuando no hay estructura conocida.

```
MOL:IK:XBGNERSKEKDZDS-UHFFFAOYSA-N        Molécula con estructura conocida
MOL:CAS:54464-57-2                        Molécula sin InChIKey disponible
NAT:citrus-bergamia:peel:cold-pressed:it  Natural
BASE:givaudan:nombre-comercial            Base o cautivo propietario
ACC:7f3a91c4                              Acorde de usuario, por hash de contenido
LOCAL:<uuid>                              Solo local, no compartible
```

### Reglas de resolución, en orden

1. **Moléculas puras** → `MOL:IK:` con el InChIKey. Es la mejor clave posible: se calcula de forma determinista a partir de la estructura, es libre de derechos, y dos personas que partan de la misma molécula llegan al mismo código sin ponerse de acuerdo. El CAS y el PubChem CID se guardan como identificadores secundarios para búsqueda y visualización.
2. **Sin InChIKey** → `MOL:CAS:`. Los números CAS individuales están ampliamente publicados y son la lengua franca del sector; se usan como identificador de visualización. No dependas de una copia del registro CAS: consulta contra fuentes abiertas (PubChem, ChEBI) para poblar estructura y sinónimos.
3. **Naturales** → clave compuesta, porque un aceite esencial no es una sustancia sino una familia: `NAT:<especie-en-slug>:<parte>:<método>:<origen-ISO>`. Con un campo aparte para quimiotipo. Bergamota prensada en frío de Calabria y bergamota rectificada sin bergapteno son materiales distintos y tienen que tener códigos distintos.
4. **Bases y cautivos** → `BASE:<casa>:<slug>`. Se marcan como **no reproducibles**: quien reciba una fórmula que las use verá un aviso de que ese componente no es replicable sin acceso a ese proveedor. No lo escondas; que se vea es información útil.
5. **Acordes de usuario** → `ACC:` + los primeros 8 caracteres del hash del contenido normalizado. Dos personas que construyan el mismo acorde con las mismas partes obtienen el mismo código, lo cual es exactamente lo que se quiere.

### Cálculo del hash de contenido

```
normalizar(acorde):
  aplanar a la profundidad 1 (los subacordes se resuelven a sus propios códigos, no se expanden)
  ordenar componentes por código canónico ascendente
  normalizar las partes a suma 1000, redondeo half-even con reparto de residuo
  serializar como líneas "codigo:partes\n"
  hash = SHA-256 de la cadena en UTF-8
```

El nombre, las notas, la categoría y el sello **no entran en el hash**. Un acorde es su proporción.

---

## 3. La librería global

Un catálogo central de materiales, consultable por todas las instalaciones, que resuelve códigos a información canónica.

### Qué contiene

- Código canónico, nombre preferido, sinónimos, identificadores secundarios.
- Familia olfativa por defecto y descriptores.
- Clase de volatilidad y tenacidad de referencia.
- Densidad, punto de inflamación, solubilidad.
- Proveedores conocidos, sin precios.
- **Sello olfativo agregado del panel de la comunidad**, con su dispersión.

### Qué NO contiene

- Precios y proveedores del usuario. Son datos privados.
- Fórmulas privadas.
- Límites IFRA precargados sin verificación de licencia. Ver `docs/03` §7.

### Gobierno

- Aportaciones de la comunidad con revisión: cualquiera propone un material o corrige un dato, y hace falta confirmación de N usuarios o de un revisor para que entre en el canon.
- Historial de cambios completo por campo.
- Fusión de duplicados con redirección permanente del código antiguo al nuevo, para no romper fórmulas ya compartidas.
- Vía de descarga completa en volcados periódicos, para que la app funcione sin red y para que nadie quede atrapado.

### Sincronización con la biblioteca local

El usuario tiene su propia biblioteca, con sus nombres, sus proveedores y sus precios. Cada material local puede estar **vinculado** a un código canónico o no. La vinculación es la que permite compartir; no vincular es una opción legítima.

Vinculación asistida: al crear un material, se busca por nombre y CAS en la librería global y se ofrecen candidatos. Nunca se vincula automáticamente sin confirmación — un falso positivo aquí propaga un error a todas las fórmulas que usen ese material.

---

## 4. Formato de intercambio

Tres representaciones del mismo contenido, la misma información en todas.

### 4.1 Texto legible — el formato de copiar y pegar

El principal. Tiene que sobrevivir a WhatsApp, a un foro, a un correo, a una captura de pantalla leída por un humano.

```
=PFX1 kind=accord name="Ámbar seco" parts=1000 author=@nombre lic=attribution
+ MOL:CAS:6790-58-5      Cetalox              320
+ MOL:CAS:8016-26-0      Labdanum abs.        210
+ MOL:CAS:121-33-5       Vainillina           140
+ MOL:IK:GDVKFRBCXAPAQJ  Ambrettolide         180
+ NAT:cistus-ladanifer:leaf:absolute:es       150
=SEAL hue=2750 chr=620 lum=310 grn=280 pow=740 tnc=96 ero=520 nar=380 cln=240
=END sum=1000 hash=7f3a91c4
```

Reglas:

- Primera línea `=PFX1` con la versión del formato y los metadatos. `kind` ∈ `accord | concentrate | perfume`.
- Cada componente en una línea que empieza por `+`, con código canónico, etiqueta legible opcional y cantidad. La etiqueta es cortesía para el lector humano: **el parseador la ignora**.
- Las cantidades son **partes normalizadas a 1000** para acordes y concentrados. Nunca gramos: los gramos son del taller de origen y no significan nada en destino.
- **Sin diluciones.** Todo se expresa como materia pura. La dilución es una decisión local del receptor. Este es el punto que hace posible el intercambio.
- `=SEAL` opcional, con los ejes del sello agregado. Permite que el receptor vea a qué debería oler antes de pesar nada.
- `=END` con la suma de control y el hash de contenido. Si la suma no cuadra o el hash no coincide, la app avisa de que el texto llegó truncado o alterado — que es lo que pasa siempre al pegar desde chats.
- Codificación UTF-8, saltos de línea `\n`, tolerante a `\r\n` y a espacios de más.

### 4.2 Una sola línea

Para cuando el formato multilínea se rompe:

```
pfx1:H4sIAAAAAAAA...
```

Es el JSON canónico, comprimido con gzip y codificado en base64url. Un solo bloque, sin espacios, resistente a cualquier medio. La app detecta el prefijo `pfx1:` en el portapapeles y ofrece importar directamente.

### 4.3 JSON canónico

Para la API, los ficheros `.pfx` y los volcados.

```json
{
  "format": "pfx1",
  "kind": "accord",
  "name": "Ámbar seco",
  "author": "@nombre",
  "license": "attribution",
  "parent": "ACC:1a2b3c4d",
  "components": [
    { "code": "MOL:CAS:6790-58-5", "label": "Cetalox", "parts": 320 },
    { "code": "NAT:cistus-ladanifer:leaf:absolute:es", "parts": 150 }
  ],
  "seal": { "hue": 2750, "chroma": 620, "luminance": 310, "power": 740 },
  "hash": "7f3a91c4"
}
```

---

## 5. Al pegar: el flujo de resolución

Es la experiencia que decide si esta función es un truco o una revolución. La app detecta contenido `=PFX1` o `pfx1:` en el portapapeles y ofrece importar sin que haya que ir a ningún menú.

Para cada componente:

1. **¿Existe un material local vinculado a ese código?** → se usa, a la dilución que el usuario tenga por defecto para ese material.
2. **¿Existe local por CAS o por nombre, pero sin vincular?** → se propone la vinculación, con los dos materiales lado a lado y confirmación explícita.
3. **¿Existe solo en la librería global?** → se ofrece crear el material local a partir de la ficha canónica, con un clic.
4. **¿No existe en ningún sitio?** → se crea un marcador de posición, la fórmula se importa igualmente y el componente queda señalado en rojo. **Nunca se aborta la importación entera por un componente desconocido.**

Pantalla de resolución: tres columnas — lo que viene, con qué se ha emparejado, y qué se va a hacer. Todo editable antes de confirmar. Un resumen arriba: "12 de 14 resueltos, 1 por vincular, 1 desconocido".

Después de importar, la app propone **traducir a diluciones locales**: dado el stock y las diluciones habituales del usuario, calcula los pesos concretos para el lote que quiera hacer. Es el paso que convierte "he recibido una fórmula" en "puedo pesarla ahora".

---

## 6. Atribución, licencia y derivaciones

- Cada acorde o fórmula compartida lleva `author`, `license` ∈ `private | attribution | open`, y `parent` cuando deriva de otra.
- Al importar, la app conserva la procedencia y la muestra en la ficha. Si se modifica, se crea un nodo hijo en el grafo de derivaciones y se conserva el enlace al original.
- **Grafo de bifurcaciones**: desde cualquier acorde público se ve de qué deriva y qué derivó de él. Es la función que puede convertir esto en algo con vida propia — la genealogía de un acorde es interesante para todo el mundo.
- Contadores públicos de usos y derivaciones. Sin votos ni estrellas: que un acorde se use es la única señal de calidad que no se puede fingir cómodamente.

---

## 7. Casos límite que hay que resolver bien

| Caso | Comportamiento |
|---|---|
| Componente sin código canónico (`LOCAL:`) | Se excluye del texto exportado, con un aviso claro de que la fórmula compartida está incompleta y de cuánto porcentaje falta |
| Base propietaria | Se comparte con su código, marcada como no reproducible. El receptor ve qué proporción de la fórmula no puede replicar |
| Acorde anidado | Se exporta por referencia (`ACC:`), con opción de exportar en paquete incluyendo las definiciones de los subacordes |
| Suma que no da 1000 | Error de validación con la desviación exacta, y opción de renormalizar |
| Código redirigido tras una fusión | Se resuelve al destino y se avisa una sola vez |
| Versión de formato futura | `=PFX2` → mensaje pidiendo actualizar, sin intentar interpretarlo a medias |
| Texto pegado con saltos rotos | El parseador tolera espacios y líneas vacías; el hash es lo que detecta la mutilación real |

---

## 8. Enlaces profundos y códigos QR

- `perfumeapp://import?d=<base64url>` para compartir entre dispositivos.
- QR con el mismo contenido, para talleres y clases. Un formador proyecta el QR del acorde del día y treinta alumnos lo tienen en la app en cinco segundos. Este uso concreto puede ser el mejor canal de adopción que tenga el producto.

---

## 9. Orden de implementación

1. Códigos canónicos y hash de contenido en `packages/core`. Sin ellos no hay nada.
2. Serializador y parseador en `packages/exchange`, con tests de ida y vuelta sobre 100 fórmulas generadas.
3. Detección de portapapeles y pantalla de resolución. Con esto solo, dos usuarios ya pueden intercambiar sin servidor.
4. Librería global de solo lectura, alimentada con un volcado inicial curado.
5. Aportaciones, revisión y grafo de derivaciones.

Los tres primeros pasos funcionan **sin backend**. Entrégalos antes que nada: el valor de compartir se demuestra entre dos personas, no necesita comunidad para probarse.
