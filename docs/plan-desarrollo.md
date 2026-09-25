# Plan de desarrollo — la formulación, en Windows

**El orden de trabajo.** Las [decisiones](decisiones.md) dicen el porqué; este documento, el
cuándo. Objetivo de esta etapa: **un ejecutable de Windows con el que formular de verdad**.
Cuándo está listo, al final.

Actualizado: **2026-09-25**

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

## Fase 1 · El ordenador y el esqueleto

- [x] **Instalar las herramientas**, con permiso del usuario, desde fuentes oficiales y por
  `winget` (2026-09-25):
  - Rust 1.98.1, con `stable-msvc` como variante por defecto;
  - Node.js 24.19.0 (LTS), con npm 11.17;
  - Visual Studio Build Tools 2022, con las herramientas de C++ (MSVC 14.44) y el SDK de
    Windows 10.0.26100;
  - WebView2 153, que ya venía con Windows.

  **Comprobado:** un programa de prueba en Rust compila, enlaza con MSVC y se ejecuta.
- [ ] `tauri info`, sin errores.
- [x] **Repositorio propio**, `perfumeria-app`, con `CLAUDE.md`, `.gitignore` y los
  documentos en `docs/` (2026-09-25).
- [ ] **El proyecto Tauri 2 en este repositorio**: la interfaz, con TypeScript, React y
  Vite, que es la plantilla oficial; y `src-tauri/`.
- **Sale:** `npm run tauri dev` abre la ventana de la app, y `tauri build` genera un
  instalador.

## Fase 2 · El núcleo, sin pantallas

TypeScript puro, con pruebas automáticas:

- [ ] **Modelo:** los cuatro tipos de material; el vector y su ID; la fórmula (cabecera e
  historial); el cambio como evento.
- [ ] **Aritmética exacta:** masas en enteros, proporciones exactas; se redondea solo al
  mostrar.
- [ ] **La composición se deriva del historial.** Una fórmula usada como material se
  desglosa.
- [ ] **IFRA:** suma por sustancia, las dos lecturas, los estados de lo desconocido.
- [ ] **Reabrir pesando**, y **guardar y leer JSON**.
- [ ] **Pruebas de referencia.** Se adaptan las de
  [`03-motor-de-calculo.md`](antecedentes/formulacion/03-motor-de-calculo.md) §8, más estas:
  - [F-001-v1](https://github.com/smortenax/perfumeria-lab/blob/master/formulas/f-001-lejia/v1.md) reproducida al miligramo;
  - cumarina del frasco más la tintura sin dato: aviso, nunca verde;
  - una fórmula importada, exacta al µg;
  - escalar ×3 y ×⅓ vuelve al original sin perder nada.
- **Sale:** todas las pruebas pasan.

## Fase 3 · Los datos de referencia *(en paralelo desde la fase 1)*

Trabajo de lectura: subagentes Sonnet de uno en uno, y revisión por partes.

- [ ] **D1 · IFRA de los 216 estándares por CAS**, en categoría 4, con el método de
  [la investigación del 23-09](https://github.com/smortenax/perfumeria-lab/blob/master/fuentes/investigaciones/2026-09-23-niveles-de-uso-y-los-216-estandares.md).
- [ ] **D2 · Constituyentes regulados y alérgenos, con su %,** de los naturales de la
  paleta: citral en la litsea, cumarina en la tonka, etc. Fuente y confianza por dato; lo que
  no se sepa, hueco.
- [ ] **D3 · La base:** el glosario FIG (3119) + los 54 materiales del laboratorio + IFRA
  por CAS. Un generador en `scripts/`, sobre lo que ya trae
  [`importar_datos.py`](../scripts/importar_datos.py), produce el **paquete de datos
  versionado**.
- [ ] **D4 · Lo que piden los gráficos**, **al acabar de definir la interfaz** (P24): el
  reparto preciso de cada material entre salida y fondo, su longevidad por horas y una
  identidad visual más rica que dos letras. Con fuente y confianza por dato; lo que no se
  sepa, hueco.
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
  su reordenación, publicado el 2026-09-25; falta su revisión.*
- [ ] **3 · Las piezas con más carga:** la columna de composición, el resumen de IFRA, el
  historial como dock, los gráficos iconográficos (§10.2) y el enlace de cada gráfico con
  sus materiales (§10.3).
- [ ] **4 · El lenguaje visual:** tono, color, letra, y las señales de tipo y de estado. Con
  las referencias del usuario.
- [ ] **5 · Los flujos:** reabrir pesando, guardar como, material nuevo rápido.
- [ ] **6 · Biblioteca y alta de materiales.**
- **Sale:** un boceto del banco a tamaño real, con F-001 dentro, que el usuario da por bueno
  antes de empezar la fase 4.

## Fase 4 · El banco

- [ ] **La barra de añadir:** las cuatro zonas; el buscador con sus dos interruptores; la
  dilución con memoria y favoritas; la cantidad; el cursor que salta de una a otra.
- [ ] **La tabla de la fórmula**, con el desglose de las fórmulas usadas como material, los
  avisos de pesada y las trazas en ppm.
- [ ] **El panel de IFRA**: las dos lecturas y lo desconocido.
- [ ] **La cabecera**: recipiente, tara, lotes. **El historial**, con notas. **Deshacer.**
- [ ] **Guardar, guardar como** (con recipiente e historial) **y reabrir pesando.**
- [ ] **Los gráficos** (decisiones §10.2): pirámide por piso, reparto de la materia y
  proyección por horas, **cada uno calculado por material**, para que todo se pueda enlazar
  (§10.3).
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
