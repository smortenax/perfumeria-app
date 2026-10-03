# Lo que falta para cerrar la F-001 en la v2

Cada material de la F-001 que sigue **pendiente** en la v2 ([`comparacion-fase3.md`](comparacion-fase3.md)),
el documento que lo cerraría y a qué tienda pedírselo. Es para escribirles. Lo pendiente de dos tiendas:
**Olfatorium** (6 materiales) y **Maese Lab** (2). Una prueba (`src/v2/fase3.test.ts`) comprueba que cada
pendiente de la F-001 sale aquí.

**Qué pedir siempre:** el certificado de conformidad IFRA (51.ª enmienda) **del producto**, con la lista de
sustancias restringidas y su concentración (no solo los límites por categoría); para un natural, además, el
**número de lote** de tu frasco y el **certificado de análisis (CoA) con el GC-MS de ese lote**. Para una
especificación de IFRA, lo que acredita que el material la cumple (se dice abajo).

## Olfatorium

| En la F-001 | Producto | Qué falta | Documento que lo cierra |
|---|---|---|---|
| **Cedro Atlas** | Cedro Atlas | Su **especificación** de peróxidos (STD 184, pináceas) no está acreditada | Certificado IFRA que diga que cumple el STD 184, con el índice de peróxidos o si lleva antioxidante |
| **Allyl Amyl Glycolate** | Allyl Amyl Glycolate | Su **especificación** de alcohol alílico libre (STD 188, ésteres alílicos) no está acreditada | Certificado IFRA que diga que cumple el STD 188 (alcohol alílico libre < 0,1 %) |
| **Patchouli** | Patchouli | **Cantidades:** no hay datos de sus constituyentes, y el anexo de IFRA no tiene este natural | Certificado IFRA con las restringidas y su CoA con el GC-MS del lote; la declaración de alérgenos de la UE |
| **Absoluto de Tabaco** | Absoluto de Tabaco | **Cantidades:** solo hay la cumarina de un certificado de otro proveedor, y no prueba su lote | Certificado IFRA del producto y su CoA con el GC-MS del lote |
| **Resinoide Benjuí** | Resinoide de benjuí | **Cantidades:** solo hay las cifras de un certificado de otro proveedor (benjuí de Siam) | Certificado IFRA del producto y su CoA con el GC-MS del lote; la especie (¿*Styrax tonkinensis*?) |
| **Sandalmysore Core** | Sandalmysore Core | **Cantidades:** es una base y no se sabe qué lleva | Su composición (el proveedor la trata como confidencial): al menos el certificado IFRA con las restringidas |

## Maese Lab

| En la F-001 | Producto | Qué falta | Documento que lo cierra |
|---|---|---|---|
| **Haba tonka (tintura)** | Haba tonka (semillas), tintura comercial | **Cantidades:** no declara la carga de la tintura ni su cumarina, y la cumarina tiene techo | La carga de la tintura (% de haba) y el certificado IFRA o un análisis con la cumarina |
| **Ámbar gris (tintura)** | Ámbar gris, tintura comercial (purificado) | **Cantidades:** no hay ficha ni perfil documentado | Certificado IFRA y la ficha de la tintura (carga, vehículo, qué contiene) |

## Las dos clases de pendiente

- **Por cantidades:** no se sabe cuánto lleva de una sustancia con techo. Con el certificado y el GC-MS
  se cierra con números.
- **Por especificaciones por acreditar:** IFRA obliga a algo que no es un porcentaje (peróxidos,
  alcohol alílico libre…). Se cierra con una frase firmada del proveedor, no con una cifra.

Fuera de la F-001, en la v2 hay otras especificaciones pendientes por el mismo motivo (linalol, STD 187; metil
ionona gamma, STD 063): se piden igual a Olfatorium y a Maese Lab respectivamente.
