# perfumeria-app — instrucciones de trabajo

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
- **Una decisión nueva pasa por [`docs/interrogatorio.md`](docs/interrogatorio.md)**:
  pregunta con código, respuesta literal del usuario y lectura. Después entra en las
  decisiones, **con su porqué**.

## El laboratorio

- **Es el repositorio hermano `../Perfumery`** ([`perfumeria-lab`](https://github.com/smortenax/perfumeria-lab)),
  el cuaderno del usuario. **La app no lo necesita para funcionar.**
- **Sus datos entran con [`scripts/importar_datos.py`](scripts/importar_datos.py)**, que los
  copia a `datos/fuente/` y apunta de qué commit salen. **`datos/` no se edita a mano.**
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
