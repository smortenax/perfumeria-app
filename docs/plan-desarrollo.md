# Plan de desarrollo — la formulación, en Windows

**El orden de trabajo.** Las [decisiones](decisiones.md) dicen el porqué; este documento, el
cuándo. Objetivo de esta etapa: **un ejecutable de Windows con el que formular de verdad**.
Cuándo está listo, al final.

Actualizado: **2026-09-26**

---

## Cómo se trabaja

- **La app tiene su propio repositorio, este**, separado del laboratorio desde el
  2026-09-25, con la historia de sus documentos. Así el contexto de trabajo, la memoria y el
  historial de Git de la app no se mezclan con los del laboratorio. Del laboratorio solo
  llegan datos (fase 3) y la bandeja de entradas (ver `CLAUDE.md`).
- **Código e identificadores, en inglés. La interfaz, en español**, desde un archivo de
  textos, para poder traducirla si llega a producto. La documentación, en español.
- **Cada fase acaba en algo comprobable**, y cada paso se sube con su commit.
- **Primero el núcleo, con pruebas; después las pantallas.** Si el cálculo falla una vez, la
  app deja de merecer confianza.

---

## Fase 0 · Consolidar la intención ✅

- [x] [Interrogatorio](interrogatorio.md), P1 a P22.
- [x] [Decisiones v3](decisiones.md), borrador. La v2 está archivada.
- [x] Este plan.
- [x] **Revisión del usuario de la v3.** El punto de §2.5 se resolvió el 2026-09-25: pureza y
  porcentaje final. Para lo demás, el usuario dio paso a la instalación («por todo el
  resto»). Cualquier corrección posterior se hace en el documento, con fecha.

## Fase 1 · El ordenador y el esqueleto ✅

- [x] **Instalar las herramientas**, con permiso del usuario, desde fuentes oficiales y por
  `winget` (2026-09-25):
  - Rust 1.98.1, con `stable-msvc` como variante por defecto;
  - Node.js 24.19.0 (LTS), con npm 11.17;
  - Visual Studio Build Tools 2022, con las herramientas de C++ (MSVC 14.44) y el SDK de
    Windows 10.0.26100;
  - WebView2 153, que ya venía con Windows.

  **Comprobado:** un programa de prueba en Rust compila, enlaza con MSVC y se ejecuta.
- [x] `tauri info`, sin errores (2026-09-26).
- [x] **Repositorio propio**, `perfumeria-app`, con `CLAUDE.md`, `.gitignore` y los
  documentos en `docs/` (2026-09-25).
- [x] **El proyecto Tauri 2 en este repositorio** (2026-09-26), con la plantilla oficial
  (`create-tauri-app` 4.7.4, `react-ts`): React 19, Vite 8, TypeScript 6 y Tauri 2.11.
  Adaptada en tres cosas:
  - los textos de la interfaz salen de `src/i18n/es.ts`;
  - la ventana se llama «Perfumería» y mide 1280 × 800;
  - fuera el ejemplo de saludo de la plantilla.

  El identificador, `com.smortenax.perfumeria`, es provisional: se puede cambiar antes de
  publicar, no después.
- [x] **`npm run tauri dev` abre la ventana** (2026-09-26). La primera compilación tardó
  1 min 19 s.
- [x] **`npm run tauri build` genera el instalador** (2026-09-26): `Perfumeria_0.1.0_x64-setup.exe`
  (NSIS, 1,4 MB) y `Perfumeria_0.1.0_x64_en-US.msi` (2,0 MB). La primera vez, Tauri descargó
  WiX 3.14 y NSIS 3.11 de sus repositorios oficiales en GitHub.
- **Sale:** `npm run tauri dev` abre la ventana de la app, y `tauri build` genera un
  instalador.

## Fase 2 · El núcleo, sin pantallas ✅

TypeScript puro, con pruebas automáticas:

- [x] **Modelo:** los cuatro tipos de material; el vector y su ID; la fórmula (cabecera e
  historial); el cambio como evento. En `src/core/model/` (2026-09-26). El ID de un vector
  es el SHA-256 de su forma canónica.
- [x] **Aritmética exacta:** masas en enteros, proporciones exactas; se redondea solo al
  mostrar. En `src/core/arith/` (2026-09-26). **Cómo se cumple:** lo pesado entra en
  microgramos enteros; lo derivado (materia pura, desgloses, repesados) es una fracción
  exacta. Así no hay restos que repartir, y un componente de 1,2 µg sigue siéndolo.
- [x] **La composición se deriva del historial.** Una fórmula usada como material se
  desglosa. En `src/core/compose.ts` (2026-09-26). Se puede leer en cualquier fotograma,
  que es lo que necesita el *play*.
- [x] **IFRA:** suma por sustancia, las dos lecturas, los estados de lo desconocido. En
  `src/core/ifra.ts` (2026-09-26). Cada sustancia sale **dentro**, **se pasa**, **sin
  comprobar** o **acotada**. «Acotada» es una carga sin dato que ni en el peor caso (todo el
  material fuese esa sustancia) llega al techo: el razonamiento del cuaderno con la
  cumarina de F-001. **Confirmado por el usuario el 2026-09-26 (P31)**; nunca se pinta como
  «dentro». El resultado se da con el peor caso, y el núcleo da también el otro extremo:
  al pasar el ratón se verá el rango.
- [x] **Reabrir pesando**, como un cambio más del historial (2026-09-26).
- [x] **Guardar y leer JSON**, en `src/core/io/` (2026-09-26): un archivo por fórmula con la
  cabecera, un material y un cambio por línea, y la composición legible sin la app. Los
  materiales viajan con su definición, y al leer se comprueba que cada vector sigue
  cuadrando con su ID.
- [x] **Pruebas de referencia.** Se adaptan las de
  [`03-motor-de-calculo.md`](antecedentes/formulacion/03-motor-de-calculo.md) §8, más estas:
  - [x] [F-001-v1](https://github.com/smortenax/perfumeria-lab/blob/master/formulas/f-001-lejia/v1.md) reproducida al miligramo (2026-09-26). Una
    cifra no coincide con el cuaderno, y el que falla es el cuaderno: el alcohol sale al
    63,68 %, no al 63,67 %, porque el cuaderno redondeó su masa antes de dividir;
  - [x] cumarina del frasco más la tintura sin dato: aviso, nunca verde. Con 1,35 %
    conocido y hasta 1,85 % posible, sale «sin comprobar»;
  - [x] una carga acotada deja decir «sí» a la primera lectura, y la segunda la cuenta en su
    peor caso (P31);
  - [x] una fórmula importada, exacta al µg, y por debajo: sus fracciones no se redondean;
  - [x] escalar ×3 y ×⅓, repesando, vuelve al original µg a µg.

  De las pruebas de `03`, T1, T6, T7 y T10 están adaptadas y pasan. T5 sobra: con
  fracciones exactas no hay restos que repartir, y la prueba de los tercios la sustituye. T9,
  IFRA sobre el lote final, también pasa. T2 a T4 (las operaciones de dilución de Formulair) y T8 (los ciclos) no
  aplican a la v3: esas operaciones no están decididas, y un vector es una foto fija, así
  que no puede haber ciclos.
- **Sale:** todas las pruebas pasan. **Hecho el 2026-09-26: 46 pruebas, todas en verde** (`npm test`).

## Fase 3 · Los datos de referencia *(en paralelo desde la fase 1)*

Trabajo de lectura: subagentes Sonnet de uno en uno, y revisión por partes.

- [ ] **D1 · IFRA de los 216 estándares por CAS**, en categoría 4, con el método de
  [la investigación del 23-09](https://github.com/smortenax/perfumeria-lab/blob/master/fuentes/investigaciones/2026-09-23-niveles-de-uso-y-los-216-estandares.md).
- [ ] **D2 · Constituyentes regulados y alérgenos, con su %,** de los naturales de la
  paleta: citral en la litsea, cumarina en la tonka, etc. Fuente y confianza por dato; lo que
  no se sepa, hueco.
- [ ] **D3 · La base:** el universo del glosario FIG (2588 CAS en 3119 filas) + IFRA por CAS
  + la capa propia. **Sin los 54 materiales del laboratorio** (P35, por confirmar): los del
  usuario que no estén en la base se dan de alta como propios. Un generador en `scripts/`, sobre lo que ya trae
  [`importar_datos.py`](../scripts/importar_datos.py), produce el **paquete de datos
  versionado**. **Ojo con la clave:** el CAS no es único en el glosario; 176 CAS se repiten en
  707 filas (P32).
- [ ] **D4 · La capa propia de cada material** (P24, P29, P30), **al acabar de definir la
  interfaz**: posición entre salida y fondo (0 a 1), duración en horas, color, sigla, y los
  datos del mapa de olores (FIG, POM, intensidad). **Se investiga en el laboratorio**, con
  fuente y confianza por dato, y entra en la app con `importar_datos.py`. Lo que no se sepa,
  hueco. La referencia IFRA en bruto no se toca. **Encargada al laboratorio el 2026-09-26**
  (P32), en dos frentes: el 6, la base descriptiva, y el 7, el POM y el cerebro
  ([`encargos/`](encargos/)). Con P34 y P35, la capa lleva además el **nivel de uso
  habitual**, y una **categorización propia** en lugar de la del FIG; es universal y sin
  descripciones del usuario. **La parte A de los dos frentes está hecha** (2026-09-26): de
  dónde sale cada campo y qué cubre.
- **Sale:** la app carga el paquete sin red, y dice su versión y su fecha.

## Diseño *(en paralelo, desde el 2026-09-25)*

Bocetos en HTML, fuera del código de la app: **el núcleo sigue primero**. Cada decisión pasa
por el [interrogatorio](interrogatorio.md), desde la ronda 9, y se enseña con bocetos. Los
bocetos viven en el [lienzo de bocetos](https://claude.ai/artifact/RXLX4e5WKR6xFNApMeyphj),
donde el usuario puede comentar sobre cada zona.

- [x] **1 · Qué manda en el banco.** P23: el boceto del usuario, con el historial como dock
  ([decisiones §10.1](decisiones.md)). 2026-09-25.
- [ ] **2 · Dónde va cada pieza**, a tamaño real, y cómo se pliega en pantalla estrecha.
  *Boceto 1 a 1440 × 900 con F-001-v1 dentro, revisado por el usuario (P24). Boceto 2, con
  su reordenación, revisado (P25). Boceto 3, con la barra por teclado, revisado (P26).
  Boceto 4, publicado el 2026-09-26: el play rehace el frasco y los gráficos pieza a pieza.
  Cerrada P27: la app no guarda la pureza ni limita el porcentaje. Retocado con P28; falta
  su revisión.*
- [ ] **3 · Las piezas con más carga:** la columna de composición, el resumen de IFRA, el
  historial como dock, los gráficos iconográficos (§10.2) y el enlace de cada gráfico con
  sus materiales (§10.3). *Reabierto con P33: antes se deciden las categorías de infografía,
  tras una [investigación de visualización de datos](investigacion/2026-09-26-visualizacion-de-datos/README.md)
  en cinco piezas.*
- [ ] **4 · El lenguaje visual:** tono, color, letra, y las señales de tipo y de estado. Con
  las referencias del usuario.
- [ ] **5 · Los flujos:** reabrir pesando, guardar como, material nuevo rápido.
- [ ] **6 · Biblioteca y alta de materiales.**
- **Sale:** un boceto del banco a tamaño real, con F-001 dentro, que el usuario da por bueno
  antes de empezar la fase 4.

## Fase 4 · El banco

- [ ] **La barra de añadir** (decisiones §4): material, cantidad, dilución, añadir y
  estrella; el buscador con sus dos interruptores; las dos opciones de dilución, con memoria
  y favoritas; **todo con el teclado**, Ctrl+Intro incluido.
- [ ] **La tabla de la fórmula**, con el desglose de las fórmulas usadas como material, los
  avisos de pesada y las trazas en ppm.
- [ ] **El panel de IFRA**: las dos lecturas y lo desconocido.
- [ ] **La cabecera**: recipiente, tara, lotes. **El historial**, con notas. **Deshacer.**
- [ ] **Guardar, guardar como** (con recipiente e historial) **y reabrir pesando.**
- [ ] **Los gráficos** (decisiones §10.2): pirámide por piso, reparto de la materia y
  proyección por horas, **cada uno calculado por material**, para que todo se pueda enlazar
  (§10.3).
- [ ] **El *play* del historial** (§3.4): los gráficos a cero y, adición a adición, otra
  vez hasta el final.
- **Sale:** F-001 se formula de principio a fin en la app.

## Fase 5 · Biblioteca de fórmulas y alta de materiales

- [ ] **Biblioteca:** listar, abrir, guardar como, usar como material.
- [ ] **Alta de materiales:** propio (con los campos de la base, o con huecos marcados),
  provisional, y compuesto por código.
- [ ] **Exportar al cuaderno:** las fórmulas a Markdown en `formulas/`, y los materiales
  propios a CSV.
- **Sale:** F-001 exportada es un Markdown válido en el cuaderno.

## Fase 6 · El ejecutable

- [ ] **Instalador de Windows** con nombre, icono y carpeta de datos.
- [ ] **Una semana de uso real en el banco**, apuntando lo que falle, como se hizo con F-001
  y el Banco v2.
- **Sale:** la formulación está lista, según el criterio de abajo.

---

## Cuándo está lista la formulación

- [ ] Se instala con un `.exe` y **funciona sin internet**.
- [ ] **F-001-v1 se recrea y sus números coinciden** con los del cuaderno.
- [ ] **Las dos lecturas de IFRA coinciden con el cálculo a mano** en tres casos, uno de
  ellos con desconocidos.
- [ ] Guardar, cerrar y abrir **conserva el historial entero**.
- [ ] Una fórmula usada como material **se desglosa exacta al µg**.
- [ ] **Reabrir pesando** escala bien.
- [ ] **Exportar** deja un Markdown válido en `formulas/`.

---

## Después

- **Móvil.** La interfaz se prueba en el **emulador de Android Studio**, que viene con las
  herramientas de Android que Tauri necesita de todos modos. Es más fiable para desarrollar
  que BlueStacks, que está pensado para juegos. **iOS necesita un Mac** para probarse en el
  iPhone y para publicar.
- **Glosario visual y *play* del historial**: la línea paralela.
- **Producto:** licencias de los datos antes de distribuir, y publicación.
