# Entradas redactadas para transcribir a `decisiones-app.md`

Lo que declaraste en el mensaje del 11 de agosto de 2026 son decisiones de producto, y
por la regla 1 no valen mientras vivan en un mensaje suelto. Aquí van redactadas.

**Transcribe solo las cuatro primeras.** Las tres últimas dependen de D4, D5 y D6 y no
están cerradas.

---

## Aplazamiento del módulo IFRA

**Fecha**: 2026-08-11

**Decisión**: el módulo IFRA queda fuera de la primera versión. No hay comprobación de
límites, ni indicador en la barra de fórmula, ni importador de límites.

**Razón**: se sabe que la información existe y dónde está; no aporta valor hasta que haya
fórmulas reales que comprobar, y la enmienda vigente está registrada como vacío sin
verificar (`vacios.md` #11 frente a `docs/03` §7, que la afirma como hecho).

**Consecuencia advertida**: ninguna estructural. `docs/03` §7 calcula IFRA sobre la
fórmula desplegada y con duplicados fusionados, y ese aplanado hace falta igualmente para
porcentajes, coste y consumo de stock (`docs/02` §1, regla dura). El módulo se añade
después sin rehacer nada.

**Pendiente**: reescribir `docs/03` §7 para que la enmienda y los plazos figuren como
hueco declarado y no como dato, hasta verificar contra `ifrafragrance.org`.

---

## Aplazamiento del lenguaje visual del sello

**Fecha**: 2026-08-11

**Decisión**: la taxonomía nueva y la representación gráfica del olor quedan fuera de la
primera versión.

**Razón**: es una pieza compleja, con cuatro conflictos abiertos sin resolver
(`docs/06` §8) y con un orden de trabajo que empieza por pruebas con quince perfumistas
(`docs/06` §11) que hoy no se pueden hacer.

**Consecuencia advertida**: `CLAUDE.md` §1 llama al sello "la razón de ser del producto,
no una función más", y `CLAUDE.md` §2 hace depender de él el principio de que el color
codifica en vez de decorar. Con el sello aplazado, el color vuelve a ser categoría elegida
por el usuario, como en el referente. Esas dos frases de `CLAUDE.md` hay que reescribirlas
o el brief queda mintiendo.

**Pendiente**: D4 decide si además de no dibujar se deja de capturar.

---

## La calculadora de dilución es herramienta de primera línea

**Fecha**: 2026-08-11

**Decisión**: entra en la primera versión una calculadora de dilución de campos
enlazados, en la que se fija el porcentaje deseado y una de las masas y el resto se
resuelve solo.

**Razón**: es la operación que más veces se repite en el banco y la que más tiempo ahorra
por lo poco que cuesta construirla.

**Consecuencia advertida**: no es una herramienta independiente. Es el mismo cálculo del
motor (`docs/03` §3) restringido a una entrada, y tiene que ser una vista sobre él. Si se
implementa con aritmética propia hay dos fuentes de verdad y divergen, que es exactamente
el defecto del referente que el proyecto existe para corregir (`CLAUDE.md` §2).

**Pendiente**: la semántica del bloqueo. Con cuatro magnitudes enlazadas y dos grados de
libertad, "bloquear una" no basta para determinar qué se mueve al editar una tercera.

---

## Alta y baja de existencias en un clic

**Fecha**: 2026-08-11

**Decisión**: dar de alta y de baja existencias tiene que costar un clic desde donde se
esté trabajando, sin abrir formularios ni rellenar campos.

**Razón**: el inventario que exige entrada de datos por adelantado no se mantiene, y
mantenerlo es la única condición para que sirva de algo.

**Consecuencia advertida**: `docs/02` §3 ya lo dice en otras palabras — el stock es una
capa que se enciende, nunca una obligación, y nunca bloquea la creación de una fórmula.

**Pendiente**: D5 decide el alcance del modelo que hay debajo del clic.

---

---

## No transcribir todavía

- **Alcance de la captura del sello** — abierto en D4.
- **Alcance del modelo de stock** — abierto en D5.
- **Qué es un "registro de notas"** — abierto en D6.
- **Destinatario, superficie y fichero de brief** — abiertos en D1, D2 y D3, sin responder.
