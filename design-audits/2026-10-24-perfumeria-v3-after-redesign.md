---
audit: 2026-10-24-perfumeria-v3-after-redesign
target: perfumeria-app v3 publicada tras el rediseño «Molecule poster» (V3-73, PR #3), toda la app
vault_version: designVault ded28ee
status: awaiting-picks
---

# Auditoría: Perfumery v3 · toda la app tras el rediseño · 2026-10-24

## Brief

- **Objetivo:** la v3 tal como está en `main` (`52e8c12`), compilada (`vite build` + `vite preview`) con la cuenta de prueba A y Supabase/PowerSync locales.
- **Lentes:** UX profunda (tus quejas son de uso), UI estándar, estética estándar (los referentes más allá de la skill de Apple) y accesibilidad ligera. Código, datos, plataforma y movimiento: apagados.
- **Apetito:** equilibrado.
- **Usuario:** tú, en el PC (banco de trabajo, báscula de 0,001 g) y en el móvil (catas, consultar, apuntar).
- **Tareas clave:**
  1. Añadir un material al banco desde una dilución tuya.
  2. Dar de alta un frasco de dilución que ya tienes hecho.
  3. Pasar de una fórmula a otra (otra versión, otro banco) y usar una fórmula como material.
  4. Llevar una cata (momentos que tocan).
- **Supuestos:**
  - «El selector de fórmula» son los diálogos que eligen una fórmula o un banco desde el banco: «Formula as material…» y «Move to another bench…».
  - «El selector desde la fórmula actual» es pasar a otra fórmula o versión estando dentro de una.
  - Si te referías a otro, dímelo y lo cambio.
- **Fuera de este informe:**
  - Lo del iPhone es un fallo técnico, no de diseño. Va aparte, en la rama `claude/fix-ios-storage`.
  - Las familias siguen en espera (V3-73).

## Veredicto

El rediseño arregló la navegación y el reparto del espacio en las pantallas principales. Los flujos secundarios (diálogos, altas, avisos) siguen como en la v2: listas planas con radios del navegador, formularios que empiezan por la calculadora y contadores que no coinciden entre sí.

La causa que más cierra es que **no hay un selector común**. Cada sitio que elige una fórmula o un banco inventa su lista. El mismo navegador de bancos de Formulación, reutilizado en los diálogos y en la cabecera del banco, resuelve tus dos quejas del selector.

En lo visual, la app está en el nivel «sistema limpio» de la skill de Apple. El siguiente escalón, que la propia dirección elegida pide (D-0005: «data as bar lengths»), es enseñar los datos como gráfico y no solo como texto.

## Puntuación

| Lente | Profundidad | Nota | Lo principal |
| --- | --- | --- | --- |
| UX | profunda | 2 | Cuatro graves: selectores planos, sin cambio de fórmula dentro del banco, alta de dilución solo por pesos, avisos de cata repetidos y con cifras distintas |
| UI | estándar | 3 | Una grave: la acción principal es negra en los diálogos del banco y verde en el resto; además, controles del navegador y 12 radios de esquina |
| Estética | estándar | 3 | Una grave, de gusto: el rasgo «datos como longitud de barra» de D-0005 no llega al banco ni a las catas |
| Accesibilidad | ligera | 3 | Una grave: los diálogos del banco no son diálogos (sin `role="dialog"`, sin llevar ni devolver el foco) |

Notas: 5 solo pulido · 4 solo menores · 3 de una a tres graves · 2 cuatro o más graves · 1 algún bloqueo.

## Cobertura de la bóveda

- **Vacíos:**
  - `35-style-profiles` está vacío: la estética se juzga contra D-0005 (la dirección elegida) y contra los referentes.
  - `60-components` y `70-specs` están vacíos: no hay especificación de diálogo, selector ni formulario con que comparar. Por eso los hallazgos de componentes citan principios y no especificaciones.
- **Referentes:**
  - Los 83 referentes y las 38 piezas de biblioteca son candidatos que **no has puntuado** (D-0004, gusto 0).
  - Sirven de ejemplo, nunca de regla. Todo lo que se apoya solo en ellos va marcado como **gusto**.
- **P-LAYOUT-02:**
  - Su recorrido termina en la skill de Apple (kb-eval-14, nivel E).
  - Por eso lo del móvil (F-06) es medido en posición y de gusto en la regla.
- **Comprobaciones hechas:**
  - Revisión visual sobre la versión compilada, a 390, 1024 y 1440 px y al 200 % de texto: 0 errores en las nueve pantallas. Ayer siete; hoy, además, el alta de dilución y la cola de catas.
  - Avisos: controles del navegador en el alta de dilución (2 `select`, 1 fecha) y un `<progress>` en la cola.
  - Datos frente a imagen, tres muestras:
    - Acetato de linalilo y Bergamota (cítricos) se ven amarillos.
    - Cedro Atlas (amaderado) se ve marrón.
    - Coinciden en la ficha, la composición y el historial.
    - La leyenda del donut coincide con sus porciones.

## Inventario de decisiones

| Lente | Decisión de la app | Veredicto | Nota |
| --- | --- | --- | --- |
| UI | Barra lateral plegable; abajo en el teléfono | alineada | D-0005, F-03 |
| UI | Acento verde para la acción principal | se desvía, sin registro | En los diálogos del banco la principal es negra (`bench.css` `.modal-actions .primary`) |
| UI | Radios de esquina: panel 4, control 8, orbe 10 | se desvía, sin registro | 12 valores distintos en CSS (6, 999, 8, 10, 12, 50 %, 3, 0, 2, 1,5 px…) |
| UX | Elegir fórmula o banco con un diálogo de radios | se desvía, sin registro | Formulación usa lista de bancos con su detalle; los diálogos, una lista plana |
| UX | Alta de dilución: calculadora y luego pesos | se desvía de tu uso | V3-67 fija la cifra exacta de lo pesado, no que pesar sea la única forma de alta; los frascos de la tanda 19 ya existen sin pesos |
| UX | Avisos de cata como banderolas encima del título | se desvía, sin registro | Uno por momento: 6 a la vez |
| Estética | Datos como longitud de barra (rasgo de D-0005) | parcial | Inicio y ficha sí; composición, IFRA de cada línea y catas, solo cifras |
| Estética | El orbe enmarcado como único elemento expresivo | alineada | D-0005, V3-73 |

## Causas de fondo

1. **No hay un selector común de fórmulas y bancos.** Cierra F-01, F-02 y F-07: un componente «navegador de bancos» (la lista de Formulación) reutilizado en los diálogos y en la cabecera del banco.
2. **Los diálogos del banco son los de la v2, sin portar.** Cierra F-08, F-11 y F-13: un `Modal` del sistema, con semántica de diálogo, foco, acento y una lista de opciones con aspecto de fila.
3. **Los formularios piden el caso raro primero.** Cierra F-03, F-09 y F-12: primero el modo («ya la tengo» / «calcularla»), luego los campos, con controles propios.
4. **Cada pantalla cuenta las catas a su manera.** Cierra F-05 y F-16: una sola definición de «lo que toca» para Inicio, la insignia, el aviso y la tarjeta.
5. **Los datos se enseñan como texto donde la dirección pide barras.** Cierra F-15 y F-16.

## Hallazgos

### F-01 · Los selectores de fórmula y banco son una lista plana de radios

- **Lente, gravedad, confianza:** UX · grave · fundamentada
- **Dónde:** banco → «+» de Material → «Formula as material…» (`05-formula-as-material-1440.png`, `-390.png`); banco → Opciones → «Move to another bench…» (`07-bench-move-1440.png`); `bench/Dialogs.tsx:107` (`ChoiceDialog`).
- **Pruebas:**
  - Todas las opciones van en una columna, sin agrupar por banco, sin buscar, sin orbe y sin versiones.
  - La etiqueta repite el nombre («Cuir · Cuir (saved now)»).
  - El radio va encima de su texto, por la regla global `label { flex-direction: column }` de `App.css:79`.
  - Para elegir hay que recordar a qué banco pertenece cada fórmula.
- **Regla:** P-UX-04 (P-UX-04 ← kb-cog-01.c2, nivel C; ← kb-cog-09.c1, nivel B; ← kb-hci-03.c2, nivel B). La coherencia con la pantalla de Formulación es heurística de Nielsen (kb-hci-03.c2, nivel B).
- **Por qué importa:** con 11 bancos y 8 fórmulas ya cuesta. Con tus 47 fórmulas de la nube, la lista plana deja de servir.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | Radio y texto en una fila; etiqueta «Cuir v2 · banco Cuir», sin repetir; botón «Usar» en vez de «OK» | `Dialogs.tsx`, `bench.css` | S | bajo | se lee mejor, pero sigue plana |
| L2 Ajuste | Un componente `BenchPicker`: los bancos a la izquierda y sus fórmulas, con versiones, a la derecha (como Formulación), con buscador. Lo usan «Formula as material» y «Move» | nuevo componente; `Bench.tsx`; `Library.tsx` lo comparte | M | bajo | **elige como en Formulación**, que es lo que pides |
| L3 Rehacer | L2, y además el «+» de Material abre el selector en un panel lateral (no modal) que deja ver la composición | banco | M | medio | elegir sin perder de vista la fórmula |
| L4 Repensar | Una paleta de órdenes (Ctrl+K): ir a cualquier fórmula, material o frasco escribiendo | toda la app | L | medio | lo más rápido para quien tiene muchas fórmulas |

**Recomendado:** L2, porque resuelve tu queja con un solo componente que reutilizan los dos diálogos y la cabecera (F-02).

### F-02 · Dentro de una fórmula no se puede pasar a otra ni a otra versión

- **Lente, gravedad, confianza:** UX · grave · fundamentada
- **Dónde:** cabecera del banco (`03-bench-1440.png`).
- **Pruebas:**
  - La cabecera solo tiene «←», el nombre, la intención, deshacer, rehacer y Opciones.
  - Para ir de «Cuir v3» a «Cuir v2» hay que volver a Formulación, abrir el banco «Cuir» y elegir.
  - El «←» lleva a Formulación sin abrir el banco de donde venías.
- **Regla:** P-UX-04 (recorrido arriba) y P-UX-06 (← kb-hci-03.c2, nivel B).
- **Por qué importa:** comparar versiones es tu forma de trabajar (núcleos, adiciones y versiones). Cada vuelta son tres pasos y recordar dónde estabas.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | El «←» abre Formulación con el banco de la fórmula ya abierto | `App.tsx` (ruta) | S | bajo | vuelve donde estabas |
| L2 Ajuste | Miga en la cabecera: «Cuir ▾ / Cuir v3 ▾». El primer menú son los bancos; el segundo, las fórmulas y versiones del banco. Usa el `BenchPicker` de F-01 | `Bench.tsx`, F-01 | M | bajo | cambiar de versión en un clic |
| L3 Rehacer | L2, y además «Comparar con…»: la composición de otra versión al lado | banco | L | medio | ver qué cambió entre v2 y v3 |
| L4 Repensar | n/a: L3 ya cubre el trabajo por versiones sin cambiar la estructura | | | | |

**Recomendado:** L2 (junto con F-01).

### F-03 · Dar de alta una dilución que ya tienes hecha obliga a pasar por la calculadora y los pesos

- **Lente, gravedad, confianza:** UX · grave · fundamentada (es un bloqueo cuando no tienes los pesos)
- **Dónde:** Diluciones → «New dilution» (`09-new-dilution-1440.png`, `-390.png`); `dilution/Dilutions.tsx:175-437`.
- **Pruebas:**
  - El formulario empieza por «Calculator» (% que quieres, cantidad total, diluyente) y sigue con «What you weighed».
  - «Save» está desactivado hasta escribir los gramos del material y de cada diluyente (`disabled={!weighed && !onlyWords}`).
  - Un frasco hecho hace meses, del que solo sabes «10 % en DPG», **no se puede dar de alta**.
  - Los frascos de la tanda 19 ya existen sin pesos (`massUg` nulo), así que el modelo lo admite.
  - Tus palabras: «arriba pones la dilución si ya está; si las vas a calcular seleccionas calcular».
- **Regla:**
  - P-UX-02 (← kb-con-04.c1 y .c5, nivel B): el formulario dice sus reglas antes y deja claro qué es opcional.
  - P-UX-04 (recorrido arriba).
  - Valores por defecto sensatos (lente UX).
- **Por qué importa:** el caso habitual, apuntar un frasco que ya está en la estantería, es el más difícil; el caso de preparar uno nuevo, el más fácil.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | La calculadora, plegada bajo «Calcular cuánto pesar»; los pesos, opcionales si escribes el % | `Dilutions.tsx` | S | medio: hay que guardar sin pesos | se puede dar de alta, pero la pantalla sigue pareciendo de cálculo |
| L2 Ajuste | Arriba, dos opciones: **«Ya la tengo hecha»** (material, % final, diluyentes con su reparto, fecha; los pesos, opcionales, en «Afinar con lo pesado») y **«Calcularla»** (% deseado y peso final → cuánto pesar de cada cosa → «Ya lo he pesado» rellena los pesos). Como tú lo describiste | `Dilutions.tsx`, `db` (frasco sin pesos, como la tanda 19), textos | M | bajo | **tu flujo, tal cual** |
| L3 Rehacer | L2, y además el alta desde el banco: el «+» de «Your dilutions of it» abre «Ya la tengo hecha» en un panel, con el material puesto, y vuelve al banco con el frasco elegido | banco, Diluciones | M | medio | no sales del banco para apuntar un frasco |
| L4 Repensar | n/a | | | | |

**Recomendado:** L2. L3 puede ir en una segunda tanda.

### F-04 · Los frascos repiten el %: «at 10 % · 10 % · in DPG»

- **Lente, gravedad, confianza:** UX · menor · medida
- **Dónde:** Diluciones, lista (`08-dilutions-1440.png`); también en las tarjetas de la cata («10 % in DPG»), que sí están bien.
- **Pruebas:** la etiqueta por defecto es «at 10 %» (`Dilutions.tsx`, `calculate`), y la línea añade el % exacto.
- **Regla:** heurística «estética y diseño mínimo» (kb-hci-03.c2, nivel B).
- **Por qué importa:** ruido en cada fila; además, cuando la etiqueta y la cifra exacta difieren (10 % frente a 9,98 %), no se ve cuál manda.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | Si la etiqueta es solo el %, no se repite; si hay nombre, «Nombre · 9,98 % en DPG» | `bottleText` | S | bajo | filas limpias |
| L2 Ajuste | Fila con orbe, % grande en cifras y diluyentes como fichas (como los botones de la barra de añadir) | lista | S | bajo | coherente con el banco |
| L3–L4 | n/a: es una fila | | | | |

**Recomendado:** L1.

### F-05 · Catas: seis banderolas repiten lo que dicen las tarjetas, y cada sitio cuenta otra cosa

- **Lente, gravedad, confianza:** UX · grave · medida
- **Dónde:** Catas (`10-evaluations-1440.png`); Inicio (`01-home-1440.png`); insignia de la barra lateral.
- **Pruebas:**
  - Encima del título hay 6 banderolas ámbar a todo el ancho, una por momento («Strip A: t60 is due», «Strip B: t30 is due»…), y empujan el título 300 px.
  - Las tarjetas ya dicen «due t60».
  - Inicio dice «0 to evaluate · 1 open session» con un «0» grande.
  - La insignia dice 3 y las banderolas, 6.
- **Regla:** P-UX-05 (← kb-hci-03.c2, nivel B; ← kb-hci-01.c2, nivel C): estado visible y coherente.
- **Por qué importa:** el «0» grande de Inicio dice que no hay nada que hacer cuando tienes seis momentos esperando. Lo que importa de verdad (oler la tira ahora) queda debajo de seis avisos iguales.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | Una sola banderola: «Toca ahora: A t60 · B t30, t60 · C t5, t30, t60»; Inicio y la insignia cuentan lo mismo («6 momentos») | `Tasting.tsx`, `Home.tsx`, `useDue.ts` | S | bajo | una cifra para todo |
| L2 Ajuste | Sin banderola: la tarjeta de la tira se marca (borde de acento) con su botón «Oler t60 ahora»; Inicio enseña «6 momentos ahora» como cifra grande | catas, Inicio | M | bajo | la acción en el sitio de la acción |
| L3 Rehacer | La sesión como línea de tiempo: una fila por tira, los momentos como marcas en el tiempo (hechas, ahora, por venir), al estilo del calendario de ref-0034 | catas | L | medio | ver el ritmo de la sesión de un vistazo |
| L4 Repensar | n/a | | | | |

**Recomendado:** L2.

### F-06 · En el móvil, el banco enseña primero el frasco y los gramos; la barra de añadir queda abajo

- **Lente, gravedad, confianza:** UX · grave · medida (la posición) y de gusto (la regla, P-LAYOUT-02, termina en nivel E)
- **Dónde:** banco a 390 px (`03-bench-390.png`).
- **Pruebas:**
  - El campo de material empieza en y = 570 de 844.
  - «Add» queda fuera de la primera pantalla.
  - La cabecera ocupa tres filas (nombre, intención, deshacer y opciones), y el frasco con sus gramos, 280 px.
- **Regla:** P-LAYOUT-02 (← kb-eval-14.c3, nivel E) y Fitts (lo frecuente, cerca: lente UX).
- **Por qué importa:** en el móvil añadir es lo frecuente, y la tara y el lote se miran poco.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | En estrecho, la barra de añadir sube sobre el frasco; la intención, plegada en una línea | `bench.css` (orden) | S | bajo | añadir sin desplazarse |
| L2 Ajuste | El frasco y los gramos, en una línea plegable («5,130 g · sin tara ▸»); deshacer y opciones, junto al nombre | banco | M | bajo | la primera pantalla es la tarea |
| L3 Rehacer | En el móvil, la barra de añadir fija abajo (sobre el historial), como un campo de mensajes | banco | L | medio | se añade desde cualquier punto |
| L4 Repensar | n/a | | | | |

**Recomendado:** L2.

### F-07 · Bancos vacíos y listas sin estado vacío

- **Lente, gravedad, confianza:** UX · menor · medida
- **Dónde:**
  - Formulación: 7 de 11 bancos dicen «0 formulas» (`02-formulation-1440.png`); al abrir uno, solo «New formula».
  - Diluciones sin frascos.
  - La cola de catas.
- **Regla:** P-UX-05 (recorrido arriba). Referente de forma: ref-0072, ref-0073 (estado vacío con título, una frase y una acción; candidatos sin puntuar).
- **Por qué importa:** un banco vacío no dice qué es ni qué hacer con él (crear la primera fórmula o borrarlo).

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | Texto de estado vacío con su acción en cada lista vacía | textos | S | bajo | sabes qué hacer |
| L2 Ajuste | Un componente `EmptyState` (icono u orbe, título, frase, acción principal y secundaria), usado en las cinco listas | nuevo componente | S | bajo | coherente |
| L3–L4 | n/a | | | | |

**Recomendado:** L2.

### F-08 · Los diálogos del banco usan radios del navegador con el texto debajo

- **Lente, gravedad, confianza:** UI · menor · medida
- **Dónde:** `ChoiceDialog`, `SaveAsDialog`, `ReweighDialog`, `UseFormulaDialog` (`bench/Dialogs.tsx:129, 200, 217, 271, 317`).
- **Pruebas:**
  - Nueve `input type="radio"` sin estilo propio.
  - El texto cae bajo el radio por la regla global de `label` (`App.css:79`).
  - La revisión visual lo marca como `native-control`.
- **Regla:** lente UI, coherencia de componentes; P-LAYOUT-01 (← kb-data-12.c5, nivel B): lo que va junto, junto.
- **Por qué importa:** es lo único de la app que todavía parece una página del navegador.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | `.radio { flex-direction: row }` y el radio con `accent-color` del acento | `bench.css` | S | bajo | se lee bien |
| L2 Ajuste | Opciones como filas pulsables (como los frascos de la barra de añadir), con `aria-pressed` o `role="radio"` | `Dialogs.tsx` | S | bajo | coherente con el banco |
| L3–L4 | n/a | | | | |

**Recomendado:** L2 (sale casi gratis con F-01 y F-13).

### F-09 · Selectores y fecha del navegador en los formularios

- **Lente, gravedad, confianza:** UI · menor · medida
- **Dónde:**
  - 13 `<select>` en la app.
  - En el alta de dilución, 2 `select` y 1 fecha (`visual-qa-new-dilution-queue.md`).
  - Un `<progress>` en la cola de catas.
- **Regla:** lente UI, coherencia de componentes.
- **Por qué importa:** cada navegador los pinta distinto (en el iPhone, la rueda de iOS), y no siguen los tokens.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | Quedan nativos: en el móvil, la rueda de iOS es cómoda | | ninguno | | |
| L1 Parche | Estilo propio con `appearance: none`, borde de control, flecha y radio de token | CSS | S | bajo | se ven de la casa |
| L2 Ajuste | Los diluyentes, como fichas (igual que en el banco), en vez de `select` | Diluciones | M | bajo | el mismo gesto en las dos pantallas |
| L3–L4 | n/a | | | | |

**Recomendado:** L1 para todos y L2 para los diluyentes (entra con F-03).

### F-10 · Doce radios de esquina y colores sueltos fuera de los tokens

- **Lente, gravedad, confianza:** UI · menor · medida
- **Dónde:**
  - `border-radius` con 12 valores distintos (6, 999, 8, 10, 12 px, 50 %, 3, 0, 2, 1,5 px, y los dos tokens).
  - 38 colores hexadecimales en CSS fuera de `tokens.css` (23 en `bench.css`, 15 en `App.css`).
  - 28 en TSX (`Bottle.tsx` 16, `Charts.tsx` 11).
- **Regla:** AGENTS de la bóveda, «usa solo tokens»; lente estética, recuento de voces.
- **Por qué importa:** cada valor suelto es un sitio que no cambia cuando cambies el verde provisional.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | Cada radio, al token más cercano (4, 8, 10, `999` para píldoras); los colores, a tokens (ámbar, rojo, azul de estado como tokens nuevos) | CSS | M | bajo | cambiar el acento cambia toda la app |
| L2 Ajuste | Lo mismo para el frasco y los gráficos (SVG con `currentColor` y variables) | `Bottle.tsx`, `Charts.tsx` | M | bajo | |
| L3–L4 | n/a | | | | |

**Recomendado:** L1, y L2 antes de tocar el color del acento.

### F-11 · La acción principal es negra en los diálogos del banco y verde en el resto

- **Lente, gravedad, confianza:** UI · grave · medida
- **Dónde:**
  - Diálogos del banco: «OK» negro (`05-formula-as-material-1440.png`; `bench.css` `.modal-actions .primary`).
  - Catas: «Add strip» verde; «Alerts» y «End the session» en negrita; «Delete the session» normal, sin color de peligro (`10-evaluations-1440.png`).
- **Regla:** D-0005: un solo acento, para la acción principal de cada vista. Lente UI: cada color significa una cosa.
- **Por qué importa:** la acción principal cambia de color según la pantalla, y la que borra la sesión se parece a las demás.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | La principal de los diálogos, al acento; «Delete the session», en rojo de peligro y separado | `bench.css`, `tasting.css` | S | bajo | un significado por color |
| L2 Ajuste | Un componente `Button` con tres variantes (principal, secundaria, peligro) usado en toda la app | componentes | M | bajo | no se vuelve a desviar |
| L3–L4 | n/a | | | | |

**Recomendado:** L2.

### F-12 · Alta de dilución: título a la derecha, «← Back» pequeño y media pantalla vacía

- **Lente, gravedad, confianza:** UI · pulido · medida
- **Dónde:** `09-new-dilution-1440.png`.
- **Pruebas:**
  - El título «New dilution» va alineado a la derecha, frente a «← Back».
  - «← Back» mide 20 px de alto.
  - La lista sigue a la izquierda mientras se rellena un formulario de 1200 px.
- **Regla:** P-LAYOUT-01 (recorrido arriba); objetivo de 24 px (WCAG 2.5.8).
- **Por qué importa:** pequeños tropiezos en una pantalla que vas a usar a menudo.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | Título a la izquierda, «Back» como botón de 44 px | CSS | S | bajo | |
| L2 Ajuste | Con F-03 L2, el formulario se queda en un panel más corto | Diluciones | entra en F-03 | | |
| L3–L4 | n/a | | | | |

**Recomendado:** L1.

### F-13 · Los diálogos del banco no son diálogos: el foco no entra ni vuelve

- **Lente, gravedad, confianza:** accesibilidad · grave · medida
- **Dónde:** `bench/Dialogs.tsx:12-47` (`Modal`).
- **Pruebas:**
  - Es un `<form>` dentro de un fondo, sin `role="dialog"`, sin `aria-modal` ni título enlazado.
  - No lleva el foco dentro al abrir, no lo retiene y no lo devuelve al botón que lo abrió. Escape sí cierra.
- **Regla:** P-INTER-01 (← kb-a11y-04, nivel D, APG).
- **Por qué importa:** con teclado o lector de pantalla, el diálogo aparece pero el foco sigue en el banco de detrás.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | Solo con un registro de decisión: es un mínimo de accesibilidad | | | | |
| L1 Parche | `role="dialog"`, `aria-modal`, `aria-labelledby`; el foco al primer campo al abrir y de vuelta al cerrar | `Dialogs.tsx` | S | bajo | cumple P-INTER-01 |
| L2 Ajuste | Pasar a `<dialog>` nativo con `showModal()` (foco y fondo inerte gratis) | `Dialogs.tsx` | S | bajo | menos código propio |
| L3–L4 | n/a | | | | |

**Recomendado:** L2.

### F-14 · Los orbes de la composición y del historial no llevan la comprobación de color

- **Lente, gravedad, confianza:** estética · pulido · medida
- **Dónde:** `bench/Bench.tsx` (`orbOf`); en Materials sí la llevan (`data-qa-expect-color`).
- **Regla:** paso 3 del protocolo (datos frente a imagen).
- **Por qué importa:** si el color de un orbe se rompe en el banco, como pasó con el lila, la revisión visual no lo verá.

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L1 Parche | Pasar `expectColor` también en el banco | `Bench.tsx` | S | bajo | la revisión lo vigila |
| L0, L2–L4 | n/a | | | | |

**Recomendado:** L1.

### F-15 · El nivel visual se queda en «sistema limpio»: los datos van en texto donde la dirección pide barras

- **Lente, gravedad, confianza:** estética · grave · gusto (contra el rasgo de D-0005 y referentes sin puntuar)
- **Dónde:**
  - Composición del banco: cifras sin barra.
  - IFRA de cada línea: «IFRA ≥ 31 % · ≤ 140 mg left».
  - Momentos de cata: píldoras tachadas.
  - Cabecera del banco: el frasco dibujado como única imagen.
- **Pruebas:**
  - D-0005 elige «Molecule poster» por «big type, data as bar lengths».
  - Inicio y la ficha lo cumplen (cifras grandes, fuerza en barras, duración en escala).
  - El banco y las catas no.
- **Regla:** rasgo de D-0005. Ejemplos (candidatos sin puntuar, D-0004):
  - ref-0081, barra ordenada que empieza en cero, para el reparto.
  - ref-0082, piruleta o puntos de Cleveland para «lo que usas frente al techo».
  - ref-0074 y ref-0078, cifras grandes arriba y detalle debajo.
  - ref-0034 (calendario) y ref-0014 (dial de radio), el tiempo como forma.
  - ref-0048 (CELL), datos como gráfico sin perder el valor.
- **Por qué importa:** es la diferencia entre una app ordenada y una que se lee de un vistazo. Es justo lo que pides al decir que la skill de Apple es el primer paso.

Las mejoras, de menor a mayor:

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | En cada línea de la composición, una barra fina con su % de la materia aromática, ordenable por tamaño (ref-0081) | `CompositionList.tsx`, CSS | S | bajo | el reparto se ve sin leer cifras |
| L2 Ajuste | L1, y además: el IFRA de cada línea como piruleta, con la marca de lo usado y la del techo (ref-0082); la cabecera del banco en cuatro cifras grandes (materia aromática %, g en el frasco, nº de materiales, máximo IFRA %), con el frasco al lado (ref-0074, ref-0078); los momentos de la cata como marcas en una línea de tiempo (ref-0034) | banco, catas | M | bajo | **los datos como forma, en las pantallas de trabajo** |
| L3 Rehacer | L2, y además un elemento de identidad que nace del nombre (como hacen ref-0021 a ref-0026 con una sola idea): el orbe o la molécula en los estados vacíos, el inicio y la carga. Movimiento medido de la biblioteca: mot-0001 (contar las cifras de Inicio), mot-0008 (aviso «Añadido · Deshacer» al añadir), mot-0005 (la línea nueva entra en la composición), mot-0007 («guardado»); sin efectos en las pantallas de trabajo (P-LAYOUT-03) | toda la app | L | medio | personalidad propia, más allá del sistema |
| L4 Repensar | Otra pasada del selector de tokens para el acento (el verde es provisional). Candidatos cuyos textos pasan 4,5:1 y cuyo acento pasa 3:1 sobre su fondo: pal-0009 *nord* (claro, acento azul frío), pal-0001 *coffee* (acento ámbar, pero solo oscuro) y pal-0007 *luxury* (casi negro con acento blanco, solo oscuro). Además, el frasco dibujado como los de ámbar de PORONA (ref-0026) | tokens | M | medio | el color de la casa |

**Recomendado:** L2. L3 y el acento (L4), cuando quieras hacer la pasada de identidad.

### F-16 · Los momentos hechos se tachan, y tachado se lee como «cancelado»

- **Lente, gravedad, confianza:** UI · menor · gusto
- **Dónde:** tarjetas de tira (`10-evaluations-1440.png`): «~~t0~~ ~~t5~~ ~~t30~~ **t60**».
- **Regla:** convención; lente UI, estados visibles.
- **Por qué importa:** confunde «hecho» con «saltado».

| Nivel | Cambio | Toca | Esfuerzo | Riesgo | Ganancia |
| --- | --- | --- | --- | --- | --- |
| L0 Aceptar | nada | | ninguno | | |
| L1 Parche | Hecho con ✓ y relleno suave; ahora con acento; por venir, en contorno | `tasting.css` | S | bajo | se lee sin leyenda |
| L2 Ajuste | Entra en F-15 L2 (línea de tiempo) | | | | |
| L3–L4 | n/a | | | | |

**Recomendado:** L1, o L2 si eliges F-15 L2.

## Victorias rápidas (L1, mayor ganancia primero)

1. F-02 L1: «←» abre el banco de donde venías.
2. F-05 L1: un solo aviso de catas y la misma cifra en todas partes.
3. F-06 L1: en el móvil, la barra de añadir antes que el frasco.
4. F-11 L1: la acción principal en verde también en los diálogos; borrar, en rojo.
5. F-13 L1: los diálogos llevan y devuelven el foco.
6. F-04 L1: sin el % repetido en los frascos.
7. F-08 L1, F-12 L1, F-14 L1 y F-16 L1.

## Hoja de decisión

Rellena la columna «Elección». Nada cambia en la app antes de eso.

| Hallazgo | Elección (L0 a L4) | Nota |
| --- | --- | --- |
| F-01 Selectores planos | | |
| F-02 Cambiar de fórmula dentro del banco | | |
| F-03 Alta de dilución hecha | | |
| F-04 % repetido en frascos | | |
| F-05 Avisos de cata | | |
| F-06 Banco en el móvil | | |
| F-07 Estados vacíos | | |
| F-08 Radios de los diálogos | | |
| F-09 Controles del navegador | | |
| F-10 Radios y colores fuera de tokens | | |
| F-11 Color de la acción principal | | |
| F-12 Cabecera del alta de dilución | | |
| F-13 Diálogos accesibles | | |
| F-14 Comprobación de color de los orbes | | |
| F-15 Datos como forma (nivel visual) | | |
| F-16 Momentos tachados | | |

## Para la bóveda

- **Faltan especificaciones** (`70-specs` y `60-components` vacíos) de cuatro componentes que esta auditoría pide y que reutilizaría cualquier otra app: diálogo, selector de lista (`BenchPicker`), estado vacío y botón con variantes.
- **Referentes sin puntuar:** si puntúas ref-0074, ref-0078, ref-0081, ref-0082, ref-0034 y ref-0072, la próxima auditoría podrá apoyarse en ellos como gusto tuyo y no solo como ejemplo.
- **Perfil de estilo:** `35-style-profiles` sigue vacío. D-0005 hace de perfil; convendría escribirlo como `style-perfumeria` con sus rasgos («datos como longitud de barra», «el orbe como único elemento expresivo»…), para que la lente estética pueda dar pasa o falla por rasgo.

## Verificación

| Hallazgo | Resultado | Pruebas |
| --- | --- | --- |
| | | |
