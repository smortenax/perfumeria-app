# IFRA Transparency List, edición de 2025

**El listado entero de los ingredientes que la industria declara usar**: la «paleta del
perfumista», según IFRA. IFRA no la da como archivo, sino como una tabla en su web, de 24
ingredientes por página. [`scripts/leer_transparency_list.py`](../../../scripts/leer_transparency_list.py)
la leyó entera el 2026-09-27, página a página y con calma, porque el usuario lo pidió.
**No se edita a mano.**

| | |
|---|---|
| Páginas | 154 |
| Filas | 3691 (IFRA anuncia 3312 ingredientes de olor y 379 funcionales) |
| CAS distintos | 3055: los naturales comparten CAS entre variantes |
| Naturales | 1021, con su categoría ISO 9235 (`E2.12`: hoja, aceite esencial destilado) |
| Sin CAS | 3 |

[`procedencia.json`](procedencia.json) guarda la fecha, las cuentas y la huella del CSV.

## Lo que hay que saber

- **Las tres columnas son las de la tabla de IFRA**: `cas`, `nombre_principal` y
  `categoria_natural`. Esta última solo la llevan los naturales.
- **Los nombres van tal como los escribe IFRA**, con dos rarezas de su web:
  - un «_» detrás de una coma, un paréntesis, un corchete o un guion es un corte de línea
    dentro del nombre («1,_2-Pentanediol», «3-_[(2-ethylhexyl)_oxy]_-»). El glosario lo
    limpia al mostrarlo;
  - un «_» suelto ocupa el sitio de una letra griega o una prima perdidas, como en
    «(+)-_-Bisabolol» o «_,_-Dimethylbenzenepentanol», y se deja.
    Se deja tal cual.
- **IFRA no publica condiciones de reutilización de la lista**, y el laboratorio tampoco
  las encontró. **Antes de distribuir la app como producto hay que revisar la licencia**
  (plan, «Después»).
- **La lista no trae restricciones.** Las restricciones están en los estándares
  (`../51/`): un ingrediente de la lista que no está en su índice no tiene estándar propio.
