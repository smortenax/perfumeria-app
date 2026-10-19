# Catas: diseño de la primera versión (2026-10-18)

Decidido con el usuario en el proyecto LAB a partir de `Perfumery/app/prompt-catas-app.md`. Cuatro decisiones:

1. **La app manda.** Las catas nuevas solo en la app; `diario/` del laboratorio queda de archivo; las 102 fichas en blanco dejan de usarse; las fichas rellenas se consultan como catas de legado (`lab_evaluations.sheet`).
2. **La ficha**: la de abajo (campos y pestañas por tiempo). Primero migrar la tradición de forma usable; cribar o bajar densidad, después.
3. **Esquema en columnas** (V3-41), con vocabularios estándar por código fijo.
4. **Alcance: catar y cola.** Sesión con hasta 4 tiras, pestañas, temporizadores con aviso con la app abierta, cierre y cotejo, legado para consultar, y la cola de pendientes (`lo tengo` sin catar, agrupada por disolvente y dilución, progreso, los 12 del pedido del 2026-10-18 marcados). Dictado: el del teclado del móvil. Aparcado: vista comparativa horizontal, curva multilínea, selector hex, cotejo asistido, exportar a .md.

---

## Sistema de catas: diagnóstico (2026-10-18)

Fuente: `Perfumery/app/prompt-catas-app.md` (escrito hoy) y lo que manda leer. Leído desde tu PC, sin tocar nada.

### Una corrección al prompt antes de empezar

Las **8 fichas que el prompt cita como rellenas son todas `formato: pre-rejilla`** (sesiones 1 y 2, 31-jul y 3-ago).
Se escribieron antes de que existiera la rejilla, así que **no sirven para podar campos**: su silencio no significa
nada. Las únicas con la rejilla v2 usada de verdad son **tres**: Resinoide Benjuí y Galaxolide (sesión 3, 5-ago) y
Ethylene Brassylate (sin cotejo). La poda se hace con esas tres. Son pocas (la rejilla pedía tres sesiones), pero
es lo que hay.

### Qué funciona

- **Apertura a ciegas primero.** El mejor material del diario sale de ahí (Allyl Amyl Glycolate: la cata corrigió la
  familia del kit por su cuenta, el mismo día que la fuente; Galaxolide: cuatro coincidencias directas).
- **La curva de cuatro segmentos discrimina.** Rellena en las tres, y dibuja formas distintas (escalera en Benjuí,
  plana en Galaxolide, joroba en E. Brassylate).
- **La batería de descartes con `sí / — / ?`** se rellena entera y el `?` se usa (floral, animálico, dulce, verde).
- **El sinestésico (C1-C5) se responde siempre**, con palabras propias.
- **Lo horizontal es donde aparece el aprendizaje**: tablas de "tres verdes", "árbol por fuera / por dentro",
  los cotejos de sesión. Las fichas sueltas no lo dan; hoy se hace a mano en texto.

### Qué no funciona

- **D2 difusión, D3 tenacidad, D4 volumen y el canal a distancia: vacíos en las tres.** Nunca se olió a distancia
  (el propio cotejo de Galaxolide lo apunta como error repetido). Si se quedan, tienen que ser un aviso con
  temporizador, no una casilla.
- **B2 altura choca con D1 impacto**: en Benjuí, altura «imperceptible» e impacto «intenso». O se fusionan o se
  definen mejor.
- **C2 temperatura se contesta como evolución** («apertura fresca, cierre caliente»): un slider de un solo valor se
  queda corto; necesita inicio y final, o ir a la evolución.
- **A1 (25 familias) falla justo la familia documentada** en las dos con cotejo (no se marcó balsámica en Benjuí ni
  almizclada en Galaxolide). No es un fallo de la ficha, es un dato; pero confirma que A1 + A2 + batería se solapan.
- **La zona fija (G1-G7, R1-R3) se rellena solo en marcas**; G4-G6 en texto quedan vacíos.

### Por qué no la usas

La plantilla son ~12 KB y ~400 líneas de Markdown para una tira que dura minutos. Rellenar casillas `[x]` y `█` a
mano en un txt con la tira en la mano es lento, y no hay temporizador ni aviso para t30/t60/24 h, que es justo lo que
se queda en blanco. Resultado: **la última cata es del 5 de agosto**, hace dos meses y medio.

### Lo que ya existe en la app

`v3` tiene `lab_evaluations` (107 filas cargadas en la tanda 8) con `status`, `smelling_tip`, `reading` y `sheet`
en texto, y **una sola cata por material** (`UNIQUE(user_id, material_id)`). Para sesiones con varias tiras y repetir
catas hace falta un esquema nuevo encima. `lab_dilutions` ya tiene tus diluciones (fracción, disolvente, fecha).

---

## Decisión 2: la ficha de cata en la app (versión 2, 2026-10-18)

Rehecha con tu explicación del 18-oct, sobre la poda que aprobaste. La regla general es **migrar la tradición de las
hojas de cata de forma usable**. Cribar más o bajar la densidad se mira después, con catas hechas en la app.

### Dónde vive

- **Un apartado propio, «Catas»**, en la barra de la app, al lado de Materiales y Formulación.
- **Cada cata va vinculada a un material tuyo**, pero **no toca su ficha**: no escribe en su familia, sus
  descriptores ni sus categorías. Es información extra. Desde la ficha del material se podrá ir a sus catas.

### Cómo es cada tipo de campo

| Tipo | Control | Campos |
|---|---|---|
| **Identidad del olor** | Texto o dictado por voz | Apertura (t0), descripción de cada tiempo, cosa o sitio, campo olfativo propio, imagen revisada, metáfora, notas |
| **Sinestésicas** | Texto, como hasta ahora; el vocabulario de arranque, como pista debajo | Textura y peso, temperatura, forma, color, brillo |
| **Categorías no excluyentes** | Casillas | Familia percibida (Calkin y Jellinek, las 24), grupo de Ellena, **familias de la app** (las 9 de P48 con su color: Cítrico, Verde, Ozónico, Floral, Frutal, Especiado, Amaderado, Animal, Transformado) |
| **Efecto** (Jellinek) | Selector de un polo por eje: rico o fresco, gentle o active | El cuadro limpio, energizante, narcótico… |
| **Intensidad** | Slider | Intensidad de cerca (altura e impacto juntos, como se aprobó) |
| **Elección única** | Botones | Complejidad, bocanada B1-B3, papel, versatilidad, modo de decaer, R1-R3 |
| **Batería de descartes** | Una fila por eje con `sí · — · ? · n/r` | Los 8 ejes |
| **Curva** | Cuatro columnas que se tocan | Los 4 segmentos |

Las familias de la app van **además de** las 24 de Calkin y Jellinek, no en su lugar. Así la cata se puede comparar
con el color que la app ya da a cada material, sin cambiarlo.

### Pestañas por tiempo

Una pestaña por momento: **t0 · t5 · t30 · t60 · 24 h · días** (t15 y extra, si se añaden).

- **t0**: solo la apertura, a ciegas. Se guarda una vez y no se puede editar.
- **t5**: el desglose entero.
- **t30 en adelante**: **lo que puede cambiar con el tiempo, con la misma libertad que la hoja**: descripción, curva,
  intensidad, sinestésicas, familias percibidas, batería y cosa o sitio. Cada pestaña empieza vacía, sin copiar la
  anterior, para no condicionar. Un bloque que no tocas en una pestaña cuenta como «sin dato», y uno que marcas como
  revisado y no cambias cuenta como «igual», que es la regla de la bitácora.
- Cada pestaña lleva su temporizador y su aviso, y las dos preguntas de distancia («¿se nota de cerca?», «¿desde
  donde estás?»). Con ellas sale la tenacidad en horas.
- Con las pestañas se puede **comparar dos tiempos** y ver solo lo que cambió (la idea 3 de `mejoras-sistema-cata.md`).

### Lo fijo, una vez por material (al cerrar)

Papel, efecto, versatilidad, modo de decaer, R1-R3, sesgos de fiabilidad, afinidades y destinos (texto opcional), y el
cotejo, que solo se abre con la serie cerrada.

### Lo que sigue fuera, como se aprobó

La bitácora de pasadas y la lista «al cerrar» (las hace la app) y la prueba de las manos (aplazada).

---

## Decisión 3: esquema de sesiones y catas (decidido: columnas, 2026-10-18)

Sigue `campos.md` v2 y lo que ya hace la v3: lo tuyo con `user_id` y RLS, **un atributo por columna** (V3-41), lo que
no se corrige **solo se añade** (como `formula_events`) y la tenacidad en horas (V3-42). **Nada escribe en
`materials`**: la cata solo apunta al material.

### Tablas nuevas

**`tasting_sessions`**: una sentada en el banco.
`id · user_id · started_at · ended_at · note`

**`tasting_strips`**: una tira dentro de la sesión.
`id · session_id · user_id · material_id · dilution_id (→ lab_dilutions, opcional) · fraction · solvent · dose ·
applied_at · blind_label (A, B, C, D) · closed_at`
La fracción y el disolvente se copian al crear la tira, para que el dato no cambie si luego editas el frasco. Mientras
catas ves `blind_label`; el nombre del material no aparece hasta cerrar la t5.

**`tasting_moments`**: una pestaña de tiempo de una tira (t0, t5, t30…). Lleva una columna por campo de los que
cambian con el tiempo: `moment · at · text · intensity · texture · temperature · shape · color · brightness ·
thing_or_place · complexity · puff · near_detectable · far_detectable`, más la marca de qué bloques se revisaron.
Tiene tablas hijas para lo que es una lista: familias percibidas (Calkin y Jellinek, Ellena y P48), los 8 ejes de la
batería con su estado y los 4 segmentos de la curva. La fila de t0 no se puede cambiar (disparador); una corrección en
otro momento es una lectura nueva.

**`tasting_closures`**: el cierre, uno por tira: papel, efecto (dos ejes), versatilidad, modo de decaer, R1-R3,
sesgos, afinidades y destinos en texto, y el cotejo. La tenacidad no se guarda: se calcula desde el último momento con
`near_detectable = true`.

### Vocabularios estándar

Todo lo que se elige de una lista se guarda con **un código fijo**, validado por la base de datos (CHECK o tabla de
catálogo), y no como texto libre: las 24 familias de Calkin y Jellinek, los 9 grupos de Ellena, las 9 familias de
P48, los 8 ejes de la batería y sus 4 estados, los polos del efecto, la bocanada, la complejidad, el papel, la
versatilidad, el modo de decaer y R1-R3. La etiqueta que ves es aparte del código, así que renombrar una opción no
rompe las catas que ya existen. Lo descriptivo (apertura, descripciones, sinestésicas) sigue siendo texto libre.

### Lo que ya existe

- **`lab_evaluations`** (107 filas, una por material) se queda como **archivo**, con las 11 fichas en Markdown en
  `sheet`. Su `status` alimenta la cola del plan de catas hasta que haya tiras cerradas.
- **`lab_dilutions`** es lo que el prompt llama `user_bottles`: de ahí salen la fracción y el disolvente de cada tira.

---

## Cómo vive la cata a partir de ahora (construido el 2026-10-19)

1. **De dónde salen los materiales:** la pestaña **Cola** de «Catas» lista todos tus materiales que aún no has catado (cambio del 2026-10-19: no solo «lo tengo»), agrupados por tu última dilución (concentración habitual y disolvente). Cuenta como catado lo que tiene una tira cerrada en la app o una ficha del laboratorio marcada «catado». «Marcar» lo sube arriba con su motivo (p. ej. «pedido 2026-10-18»).
2. **La sesión:** «A la sesión» (o «Añadir tira») crea la tira con la siguiente letra libre (A-D), el frasco y la dosis. Desde ahí solo ves la letra.
3. **t0:** la apertura, del tirón (con el dictado del teclado si quieres). Se guarda una vez; la app y la base de datos no dejan corregirla.
4. **t5:** el desglose entero. Al terminarlo, «Terminar t5 y ver el nombre».
5. **t30 en adelante:** cada pestaña empieza vacía, con su cuenta atrás y su aviso (con la app abierta). Se escribe lo que cambió y se marca «Revisado: sigue igual» lo que no; «Comparar con» dice qué bloques cambiaron. «¿Se nota de cerca?» en cada tiempo da la tenacidad.
6. **Cierre:** lo fijo (modo de decaer, papel, efecto, versatilidad, R1-R3, sesgos, afinidades y destinos) y «Cerrar la serie»; solo entonces se abre el cotejo.
7. **Adónde va:** a tus tablas `tasting_*` (tu cuenta, con RLS, sincronizadas sin conexión). Nada se escribe en el material. Las catas cerradas salen en **Catadas**; las fichas del laboratorio, en **Legado**, de solo lectura.
