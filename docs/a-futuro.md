# Lo que no se hace aún, pero se tiene en cuenta

*Abierto el 2026-10-01, a petición del usuario: «no se tiene que hacer aún pero se ha de tener
en cuenta a futuro» es algo que dice mucho, y se estaba perdiendo entre el interrogatorio, las
decisiones y la conversación.*

**La regla:** cuando el usuario aparca algo para más adelante, entra aquí el mismo día, con
de dónde sale y **qué no debe cerrarse hoy** para que se pueda hacer luego. Lo que se decide
sigue pasando por el [interrogatorio](interrogatorio.md); lo aplazado de las decisiones está en
[§8](decisiones.md#8--aplazado). Esto es el índice de todo, para que nada se quede solo en un chat.

Cada fila: **qué**, **de dónde** (pregunta o fecha) y **qué no hay que cerrar ahora**.

---

## 1 · El glosario y los materiales

| Qué | De dónde | Qué no hay que cerrar ahora |
|---|---|---|
| **Una sección «Glosario», aparte del banco y de la biblioteca de fórmulas del usuario.** Para recorrer todo: los materiales de serie, los propios, las fórmulas y, si se establece, el perfume final, **con filtros** por esos tipos | P61 (2026-10-01); P15 ya la nombraba como «glosario de visualización»; P45 (filtros) | Que un material propio, una fórmula y uno de serie se describan con **la misma ficha** y los mismos campos. Nada de la ficha puede depender de que el material venga del catálogo |
| **Alta de materiales completa**, a la altura de los de serie: constituyentes, uso, CAS, forma, documentos. **No el material temporal rápido**, que sigue para el banco | P5, P15, P61; plan, fase 5 | El material provisional del banco no es el alta: no se le añaden campos hasta parecerlo. El modelo de datos del material propio = el de una fila del glosario |
| **Ajustar un material a mi proveedor**: lo que declara su proveedor (constituyentes, límites), guardado con su documento y su fecha, por encima de la capa general y **nunca por encima de IFRA** | P60, §5.6 | Cada cifra ya dice su autoridad (§5.6): la capa del proveedor se suma como una más, sin cambiar el cálculo. Después de las formas de los naturales (P54) |
| **Leer el certificado de un proveedor**, como el de Firmenich para *Black Agar 296985* (2023): el tope por categoría y la **sección 2.2**, cada sustancia restringida con su cantidad en el producto. La 2.2 es lo que la app necesita: el propio certificado avisa de que sus topes no valen si otros materiales llevan las mismas sustancias | P61, PDF del usuario (2026-10-01) | La app suma por sustancia (§5.3): un material con su 2.2 entra como cualquier otro con constituyentes. El tope por categoría del certificado es dato, no sustituye a la suma |
| **Los límites que se ponen los proveedores** en moléculas sin estándar IFRA (Cascalone, Mimosal…): ¿se enseñan en la ficha, con su nombre y nunca como IFRA? | X-001 (2026-09-30) | **Pendiente de decidir** |
| **Las formas de un natural**: aceite, absoluto, CO2… comparten CAS y no comparten IFRA | P54 | Las formas siguen separadas mientras su IFRA difiera |
| **Uso de un natural cuando la fuente no dice la forma** (A: vale para todas, marcado; B: solo la más común; C: nada) | 2026-10-01 | **Pendiente de respuesta** |
| **CosIng** (Comisión Europea): el INCI distingue la forma («Lavandula Angustifolia Oil» frente a «… Flower Extract») con su CAS y su EC. Puede ayudar a separar las formas | Documentos del usuario, 2026-10-01 | Se comprueba antes cómo se descarga y en qué condiciones |
| ***Essential Oil Safety*** (Tisserand y Young): perfiles de 400 aceites y 206 constituyentes, como referencia (capa 3 de §5.6), citada | P60 | Es referencia, no norma |
| **Normas ISO de aceites esenciales** (ISO/TC 54), de pago: rangos de los constituyentes principales | P60 | Cuando haya producto |
| **Alérgenos de la UE**: con el Reglamento (UE) 2023/1545 son **80**, los 24 de antes más 56 nuevos, con sus umbrales de etiquetado | §8; documentos del usuario | La maquinaria por sustancia ya vale (§5.3); falta el dato |
| **Otras categorías IFRA**, además de la 4 | §5.1, §8 | Las 18 están archivadas en `datos/ifra/` |
| **El estragol del anetol natural** | X-001 | Al frente C |
| **Las unas 640 filas de las tiendas sin unir** al glosario | P55 | Quedan en `proveedores-sin-unir.csv`, nunca pegadas a otro material |
| **Las trazas como franja**: los lotes de búsqueda las recogen, pero aún no se usan | U-003 a U-005 | Se guardan en los lotes |
| **Buscar en otros idiomas**, con una capa general, no solo español | P43, §8 | |

## 2 · El banco y lo visual

| Qué | De dónde | Qué no hay que cerrar ahora |
|---|---|---|
| **Las ideas del usuario para la barra de uso** | «tengo un par de ideas pero para luego», 2026-09-30 | La barra de cuatro variables es la base (E5) |
| **La pirámide dentro de la proyección**, con bocetos | P50 | El hueco se queda (P50: no se rellena por falta de datos) |
| **Un arreglo de colores que represente la mezcla**, en la cabecera | P25, §8 | |
| **Los datos de los gráficos**: reparto entre salida y fondo, longevidad por horas | P24, §8 | Cada gráfico se calcula por material (§10.3) |
| **Resaltado cruzado** entre historial y gráficos | §8, §10.3 | |
| **Glosario visual e identificador olorífico**; el *play* con las infografías | P15, P33, P34, §8 | El historial guarda cada cambio |
| **El visualizador sinestésico** y el baremo de uso como variable | P34 | |
| **Cómo estimula cada olor el cerebro** | P32, frente 7 | Se investiga antes de enseñar nada |
| **Recuperar un punto del historial** | §3.4, §8 | |

## 3 · Las fórmulas

| Qué | De dónde | Qué no hay que cerrar ahora |
|---|---|---|
| **Acorde o perfume al guardar**; la galería con filtros, **un icono y un visualizador por fórmula** | P45 (abierta) | El tipo decidiría qué lectura de IFRA se destaca (§5.4) |
| **Las categorías generales** visibles | P46, frente 8 | |
| **Replicar una fórmula** | P47 (exploración) | |
| **Exportar al cuaderno** (Markdown y CSV) | Plan, fase 5 | |
| **Lo que va antes del banco** | §0, §8 | El banco ya tiene botón atrás |
| **Cómo «Sin nombre (4)» pasó a «Zara tabaco»** | P52 (abierta) | |

## 4 · Producto y plataforma

| Qué | De dónde | Qué no hay que cerrar ahora |
|---|---|---|
| **Móvil**, Android e iOS, con la misma base | P14, P21, P22 | Cada pantalla se piensa para ancho estrecho y **sin hover**: lo que hoy sale al pasar el ratón tiene que poder salir con un toque |
| **Producto**: publicar y **licencias de los datos** antes de distribuir. No solo IFRA y el FIG: también lo leído de TGSC, PerfumersWorld y las búsquedas (U-002 a U-005) | P21, §8 | Cada cifra guarda su fuente, para poder quitar una fuente entera si su licencia no lo permite |
| **La versión *high-end***: información general para quien empieza, y exacta, con sus documentos, para quien ajusta a su proveedor | P60 | |
| **El icono del instalador** | Plan | |
| **Cotejar el Excel de IFRA con los PDF de cada estándar** ([biblioteca de normas IFRA](https://ifrafragrance.org/es/biblioteca-de-normas-ifra)): IFRA dice que manda el PDF y no garantiza el Excel. Los mismos 263 estándares; se bajan una vez y se compara el límite de cada categoría, el tipo y los CAS | Usuario, 2026-10-01; `datos/ifra/51/LEEME.md` | Antes de distribuir. Cualquier diferencia: manda el PDF, y se corrige el script de importación, no los datos |
