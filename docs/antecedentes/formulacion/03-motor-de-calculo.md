# 03 — Motor de cálculo

Este documento es la especificación funcional de `packages/core`. Se implementa **antes que cualquier interfaz** y con cobertura de tests completa. Si el motor falla una vez, el usuario deja de confiar en la app para siempre.

---

## 1. Aritmética

**Regla**: cero coma flotante en el dominio.

- Masas: `bigint` en microgramos. 1 g = 1 000 000 µg. Un lote de 5 kg cabe de sobra en un entero de 64 bits.
- Concentraciones y porcentajes: enteros en partes por millón. 12,5 % = 125 000 ppm.
- Precios: decimales exactos con `decimal.js`, 4 posiciones.
- Redondeo: **solo en la capa de presentación**, nunca entre pasos de cálculo. Esto corrige directamente el defecto que Formulair reconoce en su FAQ, donde redondear a 3 decimales en cada paso de escalado acumula desviaciones.
- Al mostrar gramos, redondeo a 3 decimales con modo *half-even*.

Cuando un escalado produce una masa no representable, el motor **reparte el residuo** en lugar de perderlo: se calculan todas las masas escaladas con división entera, se suma el residuo total y se distribuye de mayor a menor componente hasta agotarlo. Así la suma de las partes es siempre exactamente el total pedido.

---

## 2. Vocabulario formal

Para una fórmula con entradas `i = 1..n` y entradas de disolvente libre `j = 1..m`:

| Símbolo | Definición |
|---|---|
| `wᵢ` | masa pesada de la entrada `i`, tal como va a la balanza |
| `dᵢ` | dilución de la entrada `i`, en fracción (ppm / 10⁶) |
| `pᵢ = wᵢ · dᵢ` | **materia pura** aportada por la entrada `i` |
| `bᵢ = wᵢ · (1 − dᵢ)` | **disolvente ligado**: el que viene dentro de la dilución |
| `fⱼ` | masa de disolvente libre `j`, añadido como entrada propia |
| `P = Σ pᵢ` | total de materia pura, el concentrado real |
| `B = Σ bᵢ` | disolvente ligado total |
| `F = Σ fⱼ` | disolvente libre total |
| `W = Σ wᵢ + F = P + B + F` | peso total de la fórmula |

Definiciones derivadas:

- Concentración **absoluta** de la entrada `i`: `pᵢ / W`
- Concentración **relativa** de la entrada `i`: `pᵢ / P`
- Graduación de la fórmula: `P / W`

La distinción entre disolvente ligado y libre es la abstracción central heredada de Formulair. Consérvala tal cual: sin ella, la mitad de las operaciones siguientes no se pueden expresar.

---

## 3. Las ocho operaciones

Cada una recibe la fórmula y devuelve una fórmula nueva. Son puras: nada muta.

### 3.1 Cambio de dilución, conservando peso
`setDilutionPreservingWeight(entry, d')`

```
wᵢ ← wᵢ            (sin cambio)
dᵢ ← d'
```
Cambia `pᵢ`, cambia `P`, `W` se mantiene. Uso: "he pesado lo mismo pero de otro frasco".

### 3.2 Cambio de dilución, conservando porcentaje
`setDilutionPreservingRatio(entry, d')`

```
wᵢ' = pᵢ / d'      (mantiene pᵢ constante)
Δ = wᵢ' − wᵢ
W' = W + Δ
```
`P` intacta, proporciones relativas intactas, pero el peso total y por tanto las concentraciones absolutas cambian. Uso: "quiero la misma cantidad de materia, pero pesándola diluida".

### 3.3 Cambio de dilución, intercambiando disolvente
`setDilutionExchangingSolvent(entry, d')`

```
wᵢ' = pᵢ / d'
Δ = wᵢ' − wᵢ
F' = F − Δ            (se reparte entre las entradas de disolvente libre)
W' = W               (constante)
```
Precondición: si `Δ > 0` hace falta `F ≥ Δ`. Si no, error `INSUFFICIENT_FREE_SOLVENT` con el déficit exacto.

Esta es la operación más lograda del referente y merece explicación en la interfaz. Permite reescribir una fórmula escalada para que use un prediluido más concentrado sin cambiar ni una proporción, evitando tener que preparar litros de dilución al 1 % por adelantado. Es exactamente el problema que hace que la gente abandone las hojas de cálculo.

Reparto de `F'` entre varias entradas de disolvente libre: proporcional a su masa actual, con reparto de residuo como en §1.

### 3.4 Escalar por peso de una entrada
`scaleToEntryWeight(entry, wTarget)`

```
k = wTarget / wᵢ
todas las masas ← masa · k      (entradas y disolvente libre)
```
Las entradas con `locked = true` no se multiplican; el factor se recalcula sobre el resto para conservar el total pedido, y si eso es imposible se devuelve error explícito.

### 3.5 Escalar por porcentaje de una entrada
`scaleToEntryPercentage(entry, αTarget)`

Se mantiene `P` y todas las `wᵢ`; se ajusta el disolvente libre:

```
W' = pᵢ / αTarget
F' = W' − Σ wᵢ
```
Si `F' < 0`: error `CANNOT_REACH_CONCENTRATION`, con el mensaje de que hay que liberar disolvente ligado bajando diluciones (operación 3.3) antes de poder alcanzar esa concentración.

### 3.6 Escalar a peso total
`scaleToTotalWeight(WTarget)` → `k = WTarget / W`, se aplica a todo.

### 3.7 Escalar por factor
`scaleByFactor(k)` → trivial, con reparto de residuo.

### 3.8 Escalar a graduación absoluta
`scaleToStrength(αTarget)`

```
W' = P / αTarget
F' = W' − Σ wᵢ
```
Mismas precondiciones que 3.5. Variante `scaleStrengthByFactor(k)`: `αTarget = k · (P/W)`.

---

## 4. Aplanado de acordes

```
flatten(node, inheritedFraction) → FlatEntry[]

si node es Material:
    emitir { material, mass = inheritedFraction · nodeMass, path }
si node es Accord:
    total = Σ parts de sus componentes
    para cada componente c:
        flatten(c.target, inheritedFraction · nodeMass · c.parts / total)
```

Detalles obligatorios:

- **Detección de ciclos** antes de recorrer: DFS con conjunto de visitados sobre el grafo de acordes. Error `CYCLIC_ACCORD` con la ruta completa.
- **Profundidad máxima 5**. Error `ACCORD_TOO_DEEP`.
- **Fusión de duplicados**: si el mismo material aparece por dos ramas, en la vista desplegada se muestran las dos líneas con su ruta (`Acorde ámbar › Labdanum`), pero en el cálculo de porcentajes, IFRA y stock se suman. Es una fuente clásica de sobrepasar límites IFRA sin darse cuenta y hay que resolverla bien.
- **Reparto de residuo** en cada nivel, para que la suma de las hojas sea exactamente la masa del nodo padre.
- Cada `FlatEntry` conserva `path: string[]` para poder mostrar la procedencia y para agrupar.

---

## 5. Pirámide olfativa

Formulair reparte en cinco niveles de sustantividad usando el entero 0–4 de cada materia. Lo mantenemos como respaldo, pero preferimos el dato medido.

```
si material.tenacityHours existe:
    nivel = bucket(tenacityHours)
si no:
    nivel = material.volatilityClass
```

Cortes por defecto, editables en ajustes:

| Nivel | Nombre | Tenacidad |
|---|---|---|
| 0 | Salida | < 2 h |
| 1 | Salida-corazón | 2 – 6 h |
| 2 | Corazón | 6 – 24 h |
| 3 | Corazón-fondo | 24 – 72 h |
| 4 | Fondo | > 72 h |

La pirámide se calcula sobre materia pura (`pᵢ`), **no** sobre masa pesada: si no, el disolvente distorsiona el reparto. Dos modos de ponderación, conmutables:

- **Por masa**: `Σ pᵢ` por nivel, sobre `P`. Es lo que hace Formulair.
- **Por peso perceptual**: `Σ pᵢ · potenciaᵢ` por nivel. Es más honesto — 0,2 g de un material muy potente ocupan más pirámide que 30 g de uno flojo — y solo es posible porque tenemos el eje de potencia del sello (`docs/04`). Marca esta como la vista por defecto en cuanto haya datos de potencia.

---

## 6. Coste

```
costeEntrada = pᵢ · costePorGramoDelMaterial
             + bᵢ · costePorGramoDelDisolvente
```

Formulair calcula el coste de la entrada usando el coste por gramo de la materia junto con la dilución. Añadimos el coste del disolvente ligado, que en diluciones al 1 % no es despreciable.

El coste se propaga por el árbol de acordes: el coste de un acorde es la suma del coste de sus hojas aplanadas. Un acorde puede además mostrar un **coste por gramo efectivo**, que es lo que permite razonar sobre él como si fuera un material.

Coste real de un lote producido: se usa el precio de compra de los **lotes concretos consumidos**, no el coste teórico del material. La diferencia entre ambos es un informe útil.

---

## 7. IFRA

### Modelo de datos

```
IfraLimit {
  material     → Material
  amendment    texto        "51"
  standardType enum         restriction | prohibition | specification
  category     1..12        Categoría de producto IFRA
  limitPpm     entero
  note?        texto
}
```

Las normas IFRA se organizan por categorías de producto definidas según la vía y la intensidad de exposición cutánea. La categoría 4 es la relevante para perfumería fina hidroalcohólica. La enmienda 51 se notificó en junio de 2023 y sigue siendo la vigente, con adiciones técnicas incorporándose de forma continua a medida que el RIFM completa evaluaciones; los plazos de adaptación para formulaciones existentes vencieron en junio de 2026.

### Cálculo

Sobre la fórmula **desplegada y con duplicados fusionados**, y **sobre el producto final**, no sobre el concentrado:

```
concentraciónEnProductoFinal_i = (pᵢ / P) · graduaciónDelPerfume
```

Un material al 8 % del concentrado, en un eau de parfum al 20 %, está al 1,6 % del producto final. Comparar contra el límite del concentrado es el error habitual, y en la dirección peligrosa.

Salida por material: `ok` / `aviso al 80 % del límite` / `excedido`, con la concentración calculada, el límite, y el margen en gramos que se puede añadir todavía. En la fórmula, un indicador agregado en la barra superior.

### Advertencia de licencia

**No incluyas una base de datos IFRA precargada en el repositorio.** Formulair evita deliberadamente hacerlo y avisa de que la responsabilidad de cumplir es del usuario. Diseña el importador (CSV/XLSX con columnas material, CAS, categoría, límite, enmienda) y deja que el usuario cargue el dato desde la fuente oficial. El disclaimer legal aparece la primera vez que se activa el módulo.

---

## 8. Casos de prueba obligatorios

Estos van en `fixtures/formulas/` como tests golden. Todos con números redondos para que un humano pueda verificarlos a mano.

**T1 — Porcentajes básicos.** Fórmula: A 10 g al 100 %, B 20 g al 10 %, alcohol 70 g.
`P = 10 + 2 = 12`, `B = 18`, `F = 70`, `W = 100`.
Absoluta de A = 10 %; absoluta de B = 2 %; relativa de A = 83,333 %; graduación = 12 %.

**T2 — Intercambio de disolvente.** Sobre T1, pasar B de 10 % a 20 %.
`w_B' = 2 / 0,2 = 10 g`. `Δ = −10`. Alcohol pasa a 80 g. `W = 100`, `P = 12`. Ni una concentración cambia. Este es el test que demuestra que el motor está bien.

**T3 — Sin disolvente suficiente.** Sobre T1, pasar B de 10 % a 1 %. `w_B' = 200 g`, `Δ = +180`, `F = 70 < 180`. Debe devolver `INSUFFICIENT_FREE_SOLVENT` con déficit 110 g.

**T4 — Escalar a graduación.** Sobre T1, llevar a 20 %. `W' = 12/0,2 = 60`. `Σwᵢ = 30`. `F' = 30 g` de alcohol. Total 60 g.

**T5 — Escalado con residuo.** Fórmula de 3 entradas de 1 g cada una, escalar a un total de 10 g. Cada una debería ser 3,333333… g. El motor debe devolver dos entradas a 3 333 333 µg y una a 3 333 334 µg, sumando exactamente 10 000 000 µg.

**T6 — Aplanado.** Concentrado con 30 g del acorde X. X = {A: 500 partes, acorde Y: 500 partes}. Y = {B: 250, C: 750}. Resultado: A 15 g, B 3,75 g, C 11,25 g. Suma exacta 30 g.

**T7 — Duplicado por dos ramas.** Material A presente directamente a 5 g y dentro de un acorde a 3 g. La vista desplegada muestra dos líneas; el cálculo IFRA y de porcentaje usa 8 g.

**T8 — Ciclo.** Acorde X contiene Y, Y contiene X. Debe devolver `CYCLIC_ACCORD` con la ruta, sin desbordar la pila.

**T9 — IFRA sobre producto final.** Material con límite de categoría 4 del 2 %, al 8 % del concentrado, en un perfume al 20 %. Resultado: 1,6 %, cumple, margen restante hasta el 2 %.

**T10 — Idempotencia.** Escalar por factor 3 y después por 1/3 devuelve exactamente la fórmula original, µg a µg. Este test es el que caza los errores de redondeo.
