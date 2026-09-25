> 📥 **Copiado del laboratorio** (`conocimiento/normativa/README.md`, commit `9949c5f`) por `scripts/importar_datos.py`. **No se edita aquí**: se corrige en el laboratorio y se vuelve a importar.

# Normativa — IFRA, categoría 4

**La única fuente de IFRA del repositorio.** Cualquier otro sitio que hable de un techo
IFRA —el catálogo, la paleta, una ficha, la app— lo toma de aquí o enlaza aquí.

📄 **[`ifra-cat4.csv`](https://github.com/smortenax/perfumeria-lab/blob/9949c5fae215667eebbe460148311164aedd8ca3/conocimiento/normativa/ifra-cat4.csv)** — una fila por material de la paleta *(dos si
hay duda sobre qué estándar le aplica)*, con su estado IFRA, el techo de categoría 4 y el
PDF del estándar.

## Por qué solo la categoría 4

IFRA fija límites distintos para cada tipo de producto: dieciocho categorías, entre ellas
desodorantes, pasta de dientes o detergentes. **La categoría 4 es la del perfume que se
lleva en la piel**, que es lo único que hace este laboratorio. Las otras diecisiete son
ruido en la mesa de trabajo.

**Si algún día hace falta otra**, está en el PDF de cada estándar (columna `pdf`). La
transcripción completa de las 18 categorías de los estándares que tocan la paleta, tal
como se sacó de los PDF el 2026-09-23, está archivada en
[`fuentes/investigaciones/2026-09-23-ifra-18-categorias.csv`](https://github.com/smortenax/perfumeria-lab/blob/9949c5fae215667eebbe460148311164aedd8ca3/fuentes/investigaciones/2026-09-23-ifra-18-categorias.csv).

## Cómo se lee

| Columna | Qué es |
|---|---|
| `cat4_pct_producto_terminado` | **El techo, en % del producto terminado** —el frasco entero, alcohol incluido—. En un lote de 10 g, × 0,1 = gramos. Número con punto decimal, para que la app lo lea sin conversión. Vacío si el estándar no fija porcentaje |
| `tipo` | Qué clase de límite es (abajo) |
| `condicion` | Lo que el techo no dice: qué forma está prohibida, qué suma con qué, qué falta |
| `constituyentes_regulados` | Sustancias con estándar o alérgenos que el material **lleva dentro** |
| `estandar` · `pdf` · `enmienda` | El estándar (`IFRA_STD_NNN`), su PDF y la enmienda. **Un techo sin versión caduca en silencio** |
| `fuente` · `verificado` · `confianza` | De dónde sale y cuándo se comprobó |

| `tipo` | Significa |
|---|---|
| **Restricción** | Hay un tope numérico |
| **Prohibición** | No se usa. En esta paleta solo recae sobre formas **crudas**: el estoraque de casa es resinoide, y el cade, probablemente rectificado, pendiente de certificado (vacío 46) |
| **Especificación** | Limita **cómo está** el material (pureza, peróxidos, HAP), no cuánto se pone |
| **sin estándar propio** | Su CAS no aparece en el índice de la 51ª enmienda. **No es «sin obligaciones»** (abajo) |
| **sin verificar** | No se ha podido buscar: falta el CAS. Lo que no se sabe no vale cero |
| **no evaluable** | Composición o carga desconocida: la comprobación es **imposible**, no favorable |

## 🔴 Los tres avisos

1. **«Sin estándar propio» no es «sin obligaciones».** Buscar por CAS contesta *«¿tiene
   este material estándar?»*, no *«¿puedo usarlo sin mirar nada más?»*. Se escapan tres
   cosas: el **constituyente** restringido (la tuyona de la salvia, el citral de la
   litsea), el **vecino** con otro CAS (bergamota expresada, naranja amarga, vetiver
   acetilado) y el **estándar transversal de furocumarinas en aceites esenciales**, que
   no tiene CAS y afecta a los cítricos. Por eso existe la columna
   `constituyentes_regulados`.
2. **Los límites son por sustancia, no por frasco.** La cumarina del frasco y la que
   arrastra la tintura de haba tonka suman contra el mismo techo; los HAP del cade y del
   estoraque, también. Modelo en
   las [decisiones de la app](https://github.com/smortenax/perfumeria-app/blob/main/docs/decisiones.md) §5.3.
3. **Ante dos límites, manda el menor.** El rango del proveedor
   ([`materias-primas/_datos/limites-de-uso.csv`](https://github.com/smortenax/perfumeria-lab/blob/9949c5fae215667eebbe460148311164aedd8ca3/materias-primas/_datos/limites-de-uso.csv)) es
   diseño; el techo IFRA tiene consecuencias. **Y el proveedor no siempre es el más
   estricto**: Cashmeran y geraniol.

## De dónde sale

| | |
|---|---|
| **Qué materiales tienen estándar** | *Index of IFRA Standards, 51st Amendment*, buscando el CAS de cada material — [investigación del 2026-09-21](https://github.com/smortenax/perfumeria-lab/blob/9949c5fae215667eebbe460148311164aedd8ca3/fuentes/investigaciones/2026-09-21-ifra-por-cas-indice-oficial.md) |
| **Cuánto permite cada estándar** | Los 216 PDF de estándar individual de la 51ª enmienda, descargados y leídos — [investigación del 2026-09-23](https://github.com/smortenax/perfumeria-lab/blob/9949c5fae215667eebbe460148311164aedd8ca3/fuentes/investigaciones/2026-09-23-niveles-de-uso-y-los-216-estandares.md) |
| **Los materiales de la ampliación de septiembre** | [Investigación del 2026-09-21](https://github.com/smortenax/perfumeria-lab/blob/9949c5fae215667eebbe460148311164aedd8ca3/fuentes/investigaciones/2026-09-21-ifra-ampliacion-septiembre.md) |

**Confianza alta** para lo que viene de los documentos de IFRA. Las cifras IFRA de
catálogos, foros o de la propia investigación web **no bastan** para dar por buena una
fórmula de piel: se contrastan aquí.

## Lo pendiente

- **Ámbar gris**: `sin verificar`. No consta cómo se decidió que no tenía estándar; la
  etiqueta trae un CAS, 84836-94-2, con el que se puede buscar.
- **Pachulí**: sin estándar propio buscando el CAS habitual del aceite (8014-09-3), que el
  proveedor no declara: confirmarlo en la etiqueta o la ficha técnica.
- **AAG**: comprobar si le aplica el estándar IFRA de clase para **ésteres alílicos**
  (alcohol alílico libre < 0,1 %). Una búsqueda por CAS no lo encontraría. **Sin
  verificar**: señalado en la revisión de la fase 3.
- **Absoluto de trufa** y **tintura de haba tonka**: `no evaluable` mientras no se
  conozca lo que llevan dentro.
- **Citral**: tiene estándar propio y llega por la litsea, el limón y la mandarina, pero
  su techo no está transcrito.
- **La 52ª enmienda** está en consulta: cuando se publique, esta tabla se revisa entera.
