# Decisiones de la v2 del modelo de materiales

Aprobadas por el usuario el 2026-10-02, al abrir la v2. Esta es la autoridad de la v2
(`CLAUDE.md`, «Trabajo en la v2»). Si una tarea choca con algo de aquí, se para y se pregunta.
Una decisión nueva entra con su porqué y de dónde sale.

## D1 — Identidad de un natural

Un natural se identifica por **especie + parte + proceso + quimiotipo**. El **CAS** y el **INCI**
son atributos, no la clave. La clave técnica es un id estable de `datos/v2/registro-ids.csv`,
asignado una vez y nunca recalculado.

## D2 — Un placeholder nunca da «dentro»

Un placeholder (autoridad `literatura` o `consenso`) **nunca da «dentro»** en IFRA. Como mucho
da **«acotado»**, usando el **máximo de su fuente**.

## D3 — Proveedor y lote

El proveedor se modela **a nivel de producto**. El **lote es un campo opcional** del producto.

## D4 — Tope del fabricante

El tope del fabricante es **del producto**, no de la sustancia. Si se **conoce su causa**, se
modela como **constituyente**.

## D5 — Alcance del modelo y de los datos

El **modelo** cubre **todas las categorías IFRA** y los **alérgenos UE**. Los **datos**, de
momento, **solo la categoría 4**.

## D6 — Fuentes de investigación

Las investigaciones pasan a `datos/fuentes/`, cada una con su **estado de revisión**. **Solo
entra en los datos lo revisado.**

## Jerarquía de autoridad

De mayor a menor; cuando dos fuentes chocan, manda la de más arriba:

1. **lote** (certificado del lote concreto)
2. **producto** (ficha o certificado del producto)
3. **anexo IFRA**
4. **literatura**
5. **consenso**
6. **desconocido**

`literatura` y `consenso` son las autoridades de los placeholders (D2). Lo **desconocido nunca
vale cero ni se pinta en verde** (decisiones v1, §1.2 y §5.5).

## Reglas que se derivan

- IFRA limita por **grupo regulador (estándar)**, no por CAS; las sustancias tienen alias de CAS.
- Cada cifra de composición lleva **valor, tipo** (`tipico`, `maximo`, `rango`), **autoridad** y
  **documento de origen**.
- El uso habitual y la duración son otra capa, con su base, y no se mezclan con IFRA.
- Los datos los escribe un script determinista. Cada conflicto va a
  `datos/v2/conflictos/<lote>.csv` y lo decide el usuario. `npm run validar:v2` pasa antes de
  cada commit de datos.
