# Comparación de la fase 3: F-001 entera, con la v1 y con la v2

Fecha: 2026-10-03. La reproducen las pruebas de [`src/v2/fase3.test.ts`](../../src/v2/fase3.test.ts): cada
diferencia de este documento es una aserción de esa prueba. La fórmula es la F-001-v1 del cuaderno, al
miligramo, sin dilución de lote de trabajo ni lote final: la base es el frasco tal cual. Categoría 4, IFRA 51.

## Las correspondencias

Cada línea de la F-001 va, en la v2, a su producto, y en la v1, a **la fila del glosario que elegiste en cada
lote** (`datos/v2/v1-a-v2.csv`). El alcohol es un diluyente de la app en los dos.

| Material de la F-001 | v2 | v1 (la que elegiste) |
|---|---|---|
| Hedione | `P00032` (sustancia) | `fig:2351` Hedione |
| Dartanol | `P00015` (sustancia) | `fig:412` Bacdanol |
| Iso E Super | `P00034` (sustancia) | `fig:92` Iso E Super |
| Diphenyl Oxide | `P00016` (sustancia) | `fig:1689` Diphenyl ether |
| Florosa | `P00020` (sustancia) | `fig:464` Florol |
| Alcohol Feniletílico | `P00026` (sustancia) | `fig:2657` Phenethyl alcohol |
| Cedro Atlas | `P00043` (natural) | `fig:1357` Cedarwood oil, Atlas |
| Cashmeran | `P00013` (sustancia) | `fig:924` Cashmeran |
| Ebanol | `P00017` (sustancia) | `fig:722` Ebanol |
| Ionona Alpha | `P00033` (sustancia) | `fig:1051` alpha-Ionone |
| Polysantol | `P00037` (sustancia) | `fig:607` Polysantol |
| Sandalmysore Core | `P00038` (base) | `fig:487` Hindinol |
| Lavanda | `P00003` (natural) | `fig:2183` Lavender oil |
| Patchouli | `P00049` (natural) | `fig:2599` Patchouli oil |
| Haba tonka (semillas), tintura comercial | `P00057` (natural) | `fig:2992` Tonka bean tincture |
| Mayol | `P00035` (sustancia) | `fig:1447` Mayol |
| Isobutilquinoleína (IBQ) | `P00021` (sustancia) | `fig:938` Isobutyl quinoline |
| Ámbar gris, tintura comercial (purificado) | `P00055` (natural) | `fig:1069` Ambergris tincture |
| Ethylene Brassylate | `P00030` (sustancia) | `fig:1818` Musk T |
| Absoluto de Tabaco | `P00041` (natural) | `fig:2982` Tobacco leaf absolute |
| Resinoide de estírax (estoraque) | `P00051` (natural) | `fig:2914` Styrax resinoid |
| Resinoide de benjuí | `P00050` (natural) | `fig:1168` Benzoin resinoid, Siam |
| Allyl Amyl Glycolate | `P00027` (sustancia) | `fig:1012` Allyl amyl glycolate |
| Dihydromyrcenol | `P00028` (sustancia) | `fig:1672` Dihydromyrcenol |

## Resultado

| | v1 | v2 |
|---|---|---|
| ¿Pasa en el frasco tal cual? | No se sabe | No se sabe |
| ¿Algo se pasa de su techo? | No | No |
| Uso máximo en un perfume | 100 % (nada se acerca) | 100 % |
| Sin comprobar | 0 | 0 |
| Pendiente | tabaco, pachulí, estírax, ámbar gris | tabaco, pachulí, estírax, ámbar gris, tonka, Sandalmysore Core, benjuí, cedro, AAG |

**Las dos dan lo mismo en lo que importa:** ningún estándar se pasa y la lectura 1 queda abierta, porque hay
materiales con datos pendientes. Cambia **por qué** y **con qué cifras**.

## Lo que no cambia

Las moléculas dan **las mismas cifras** en las dos: OTNE del Iso E Super (4,254 %), Cashmeran (0,629 %),
Polysantol (0,271 %), Mayol (0,183 %); y lo que da el anexo de IFRA, igual: cedreno y longifoleno del cedro,
y octenil acetato, 2-hexenal y geraniol de la lavanda, y el techo del estírax (0,046 % de 0,64 %).

## Las diferencias, una a una

### 1. La lavanda: con la fila que elegiste, ya no falla

Con la fila que apuntaba la v1 antes, `fig:2179` (tres formas mezcladas, la peor de todas), la F-001 daba
**«no»** por 0,016 % de 7-metoxicumarina, con un techo de 0,01 %: son 17 mg de lavanda con el 8 % del
concreto. Con la fila que elegiste, el aceite (`fig:2183`), y con el aceite de la v2, ese «no» desaparece.
La prueba 8 lo fija en los dos sentidos.

### 2. Cinco estándares que solo trae la v1

La v1 suma a cada material lo que declara cualquier proveedor del mismo CAS; la v2 respeta la jerarquía: si el
anexo de IFRA cubre las sustancias reguladas, **cierra la lista** para lo de menos autoridad (D9).

- Estírax: bencil cinamato, bencil salicilato y eugenol, de la lista de alérgenos de Firmenich, que el anexo
  ya cubre sin ellos.
- Lavanda: alfa-bisabolol, de un certificado de PerfumersWorld.
- Haba tonka: la dihidrocumarina, por la razón del punto 4.

Ninguna de las cinco se acerca a su techo, así que no cambia el veredicto.

### 3. Un placeholder está «acotado», nunca «dentro» (D2)

El benjuí (alcohol bencílico, benzoato de bencilo, isoeugenol, propenilguetol y 2-metoxi-4-propilfenol) y la
cumarina del tabaco vienen de certificados de otros proveedores: en la v2 salen **acotados**, y en la v1,
«dentro», como si fueran datos del frasco.

### 4. La cumarina y la tintura de haba tonka

La v1 suma cumarina de la tintura de haba tonka, la lavanda, el estírax y el tabaco: 0,107 %. Casi toda sale de
la tintura, y **es un error de la v1**: le aplica a la tintura la composición del anexo de IFRA para el **absoluto**
de haba tonka (cumarina 56,77 %, dihidrocumarina 1,85 %), como si la tintura fuera el absoluto puro y sin
diluir (`errores-v1.md`). La v2 no lo hace (otra forma, P54): la tintura no tiene cifra, porque el proveedor no
declara su carga ni su cumarina, y queda **pendiente**, como pediste. Por eso la cumarina de la v2 es la del
tabaco, acotada, y no cubre lo que la tintura pueda llevar: es un hueco, no un cero.

### 5. Las listas de otro material desaparecen

La v1 traía al Polysantol la lista de alérgenos del **fenilhexanol** (de ahí su benzaldehído) y al Sandalmysore
Core la del **Santaliff Toco** (de ahí su aporte de OTNE): son de otro material y la v2 las descartó
(`errores-v1.md`). El Sandalmysore Core, además, entra como **base** con composición desconocida, como decía tu
cuaderno, y queda pendiente.

### 6. Tres especificaciones pendientes

El cedro (STD 184, peróxidos), el AAG (STD 188, alcohol alílico libre) y el estírax (STD 078) llevan su
especificación como información en la v1. En la v2, **ninguna afirmación la cumple todavía** (no hay fila en
`condiciones.csv`), así que queda pendiente. Es la regla nueva de condiciones: probada, supuesta o pendiente.
La del estírax merece mirarse: la especificación de PAH del 078 es del aceite de pirólisis, y el material es un
resinoide.

### 7. Las condiciones

La v1 enseña como condiciones frases informativas («incluye constituyentes declarados por proveedores»,
«variante sin concretar»). La v2 solo enseña lo que IFRA obliga: del estírax, que una variante está prohibida.
Nada está supuesto en esta fórmula.

## Lo que esta comparación no prueba

- No hay fórmula de prueba con el cade (probada en las pruebas del adaptador) ni con el grupo de fototóxicos:
  la F-001 no lleva ninguno.
- Las cifras de los placeholders son de otro lote del mismo material: no prueban el del usuario (D9).
