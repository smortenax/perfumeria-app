# perfumeria-app — instrucciones de trabajo

## Trabajo en la v2 (desde 2026-10)

**Para cualquier tarea de la v2, la autoridad es `docs/v2/`**: `decisiones-v2.md` y
`estado.md`. No se lee `docs/interrogatorio.md` ni `docs/decisiones.md` enteros: si hace
falta una sección, se busca con grep y se lee solo esa.

**Al empezar cada sesión:** leer `docs/v2/estado.md` (qué está hecho y qué sigue). Al
terminar: actualizarlo, en 30 líneas como máximo, y hacer commit.

### Lo que no se toca
- La v1 está congelada: `datos/glosario/`, `scripts/generar_glosario.py` y los scripts
  que la alimentan. Se leen, nunca se editan ni se regeneran.
- `src/core/` solo cambia si una prueba demuestra que hace falta, y se explica en el commit.
  La v2 llega al motor por un adaptador que construye el `IfraData` actual.

### El modelo
- Un material se identifica por un id estable de `datos/v2/registro-ids.csv`, asignado una
  vez. Nunca sale de un número de fila ni se recalcula.
- Un natural se identifica por especie + parte + proceso + quimiotipo. El CAS y el INCI son
  atributos, no la clave.
- IFRA limita por grupo regulador (estándar), no por CAS. Las sustancias tienen alias de CAS.
- Cada cifra de composición lleva: valor, tipo (`tipico`, `maximo`, `rango`), autoridad
  (`lote`, `producto`, `anexo-ifra`, `literatura`, `consenso`) y documento de origen.
- Un placeholder (autoridad `literatura` o `consenso`) nunca da «dentro» en IFRA: como mucho
  «acotado». Para IFRA se usa el máximo de su fuente.
- El tope de un fabricante es del producto, no de la sustancia. Si se conoce su causa, se
  modela como constituyente.
- El uso habitual y la duración son otra capa, con su base, y nunca se mezclan con IFRA.

### Cómo se migra
- Los datos los escribe un script determinista, nunca Claude fila a fila.
- Nada se fusiona en silencio: cada conflicto va a `datos/v2/conflictos/<lote>.csv` y lo
  decide el usuario.
- Lo que el fabricante declara en su propio documento es evidencia, incluido el nombre que da
  al producto (NAT., NEAT, ABS, PG): prueba lo que declara. No prueba lo que calla (un título
  sin PG no prueba que sea puro), y lo que se infiere (TYPE → reconstrucción) no es evidencia.
  El nombre que pone la tienda no es evidencia. Lo que un documento puede responder (tipo,
  dilución, origen, forma) se responde con su texto, extraído por script, y cada recomendación
  cita la frase y la página. Si el documento no lo dice, se dice "no lo dice", no se supone. (`scripts/v2/evidencia.py` → `datos/v2/evidencia/<lote>.csv`. La regla
  de no abrir los PDF vale para las cifras, no para clasificar.)
- `npm run validar:v2` tiene que pasar antes de cada commit de datos.
- Si una tarea choca con `decisiones-v2.md`, se para y se pregunta.
- Nunca se fusiona ni se cambia de rama sin que el usuario lo pida.

App de **formulación de perfumería**: formular, documentar las fórmulas y comprobar IFRA,
sin conexión. **Ejecutable de Windows con Tauri 2** primero; móvil (Android e iOS) después,
con la misma base. Es la herramienta propia del usuario y **puede acabar siendo un
producto**: nada debe cerrar esa puerta.

## Antes de tocar nada

- **Manda [`docs/decisiones.md`](docs/decisiones.md).** Cada decisión cita de dónde sale.
  Si una tarea choca con una decisión, se para y se pregunta; no se reinterpreta.
- **El orden de trabajo es [`docs/plan-desarrollo.md`](docs/plan-desarrollo.md).** Lo hecho
  se marca ahí.
- **[`docs/antecedentes/`](docs/antecedentes/README.md) no obliga a nada.** Son documentos
  anteriores que se contradicen entre sí. Si algo de ahí choca con las decisiones, ganan las
  decisiones.
- **Lo que el usuario deja para más adelante entra el mismo día en
  [`docs/a-futuro.md`](docs/a-futuro.md)**, con de dónde sale y qué no hay que cerrar hoy. Antes
  de diseñar algo, se mira ahí qué puerta tiene que quedar abierta.
- **Una decisión nueva pasa por [`docs/interrogatorio.md`](docs/interrogatorio.md)**:
  pregunta con código, respuesta literal del usuario y lectura. Después entra en las
  decisiones, **con su porqué**.

## El laboratorio

- **Es el repositorio hermano `../Perfumery`** ([`perfumeria-lab`](https://github.com/smortenax/perfumeria-lab)),
  el cuaderno del usuario. **La app no lo necesita para funcionar.**
- **Nada suyo entra hoy en la app (P37).** Su transcripción de IFRA y sus materiales solo
  servían para probarla. **IFRA sale de los archivos de IFRA** (`datos/ifra/`, con
  [`scripts/importar_ifra.py`](scripts/importar_ifra.py)), y **el glosario**, del FIG con las
  abreviaturas del usuario y de IFRA (`datos/glosario/`, con
  [`scripts/generar_glosario.py`](scripts/generar_glosario.py)).
  [`scripts/importar_datos.py`](scripts/importar_datos.py) trae la capa propia (D4), que es
  investigación del laboratorio y no material del usuario: la presión de vapor, las familias
  con su color y la duración (P42, P48). Apunta de qué commit sale lo que trae. **`datos/` no se edita a mano**: lo generan los
  scripts.
- **Bandeja de entradas: `../Perfumery/app/entradas.md`.** Ahí el laboratorio apunta lo que
  descubre en el banco y afecta a la app. **Al empezar a trabajar, se mira si hay entradas
  nuevas** y se llevan al interrogatorio.
- **Desde aquí no se escribe en el laboratorio**, salvo para marcar como llevada una entrada
  de la bandeja.

## Cómo se trabaja

- **Núcleo primero:** TypeScript puro, con pruebas, antes que ninguna pantalla. Interfaz con
  React y Vite, dentro de Tauri 2.
- **Código, identificadores y comentarios, en inglés.** **La interfaz, en español**, desde un
  archivo de textos. **La documentación, en español.**
- **Aritmética exacta:** masas en enteros y proporciones exactas; se redondea solo al
  mostrar. **Todo número lleva su base** (decisiones §1.1). **Lo desconocido nunca vale
  cero ni se pinta en verde** (§1.2, §5.5).
- **Una prueba de referencia que falla no se arregla tocando la prueba.** Se explica por qué
  el resultado anterior era incorrecto.
- **Commit y push por cada paso terminado.** En Windows: mensaje a un archivo y
  `git commit -F`; archivos en UTF-8 y con finales de línea LF (`.gitattributes`).

## Con el usuario

- **En español.** Suele responder en prosa: se interpreta, se escribe la lectura y se le pide
  que la confirme.
- **Las decisiones, de una en una**, con opciones, una recomendación y lo que cuesta dejarla
  abierta.
- La parte visual y la de UX/UI están **casi sin definir**: lo que hay es provisional. El
  usuario está explorando referencias.

## Lo que ya se sabe del usuario

*Aprendido en las sesiones del laboratorio hasta el 2026-09-25. Aquí porque la memoria de
Claude va por carpeta y no viaja sola.*

- **Formula por núcleos y adiciones, evaluando entre cada una**, no desde recetas cerradas.
  Pesa en gramos con una **báscula de 0,001 g** y trabaja en **mg**. Por eso la app gira en
  torno a la barra de añadir y al historial.
- **Revisa los números.** Un número sin fuente se dice en la misma frase en que se da, no
  solo en un documento. Ha detectado cifras dadas sin respaldo y usadas como regla.
- **Se puede buscar en la web** para rellenar huecos técnicos. El resultado se guarda con
  su fuente y su confianza. Las cifras IFRA salen solo de los archivos de IFRA, en
  `datos/ifra/` (P37).
- **Cuando tiene razón, se le concede rápido.** Ha corregido con acierto propuestas del
  interrogatorio: fórmulas editables, sin inventario, pesar al reabrir, pureza y porcentaje
  final.
- **El coste de uso le importa.** Para leer mucho, subagentes baratos (Sonnet) **de uno en
  uno**, que escriben cada pieza nada más terminarla; la revisión se hace por partes. Nunca
  cinco subagentes caros en paralelo.
- **Para investigar con NotebookLM o Gemini** hace falta un prompt distinto que con
  Claude: una pregunta cada vez, diciendo qué campos, cuántos elementos y qué cita se
  quieren. La plantilla está en el laboratorio,
  [`fuentes/frentes/00-prompt-notebooklm.md`](https://github.com/smortenax/perfumeria-lab/blob/master/fuentes/frentes/00-prompt-notebooklm.md).

## Del laboratorio, para cuando toque

Está en `../Perfumery`; **se consulta allí, no se copia** hasta que haga falta:

- **Para las pruebas de la fase 2:** [F-001-v1](https://github.com/smortenax/perfumeria-lab/blob/master/formulas/f-001-lejia/v1.md),
  la primera fórmula real, con su composición en gramos.
- **Para el glosario visual y el identificador olorífico:** el hub
  [`conocimiento/lenguaje/`](https://github.com/smortenax/perfumeria-lab/tree/master/conocimiento/lenguaje),
  con `descriptores.csv` (153 términos de 13 sistemas, cruzados con el FIG), y los frentes
  de investigación 4 (química del eje) y 5 (identificador olorífico) de
  [`fuentes/frentes/`](https://github.com/smortenax/perfumeria-lab/tree/master/fuentes/frentes).
- **Para los materiales:** las fichas de `materias-primas/` y los límites de proveedor, con
  sus investigaciones en `fuentes/investigaciones/`.
