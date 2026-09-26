# IFRA, 51.ª enmienda

**Todo lo de IFRA sale de IFRA (P37).** Los originales están en [`origen/`](origen/): el
usuario los descargó de la web de IFRA el 2026-09-26. Las tablas de esta carpeta las
genera [`scripts/importar_ifra.py`](../../../scripts/importar_ifra.py). **No se editan a
mano**: si algo está mal, se corrige el script y se vuelve a generar.
[`procedencia.json`](procedencia.json) guarda la huella de cada original y las cuentas.

**Aviso de IFRA**, en la primera celda del overview: el Excel es una ayuda, y **manda el PDF
de cada estándar**. IFRA no garantiza que el Excel esté bien.

| Tabla | Una fila es | Filas |
|---|---|---|
| [`estandares.csv`](estandares.csv) | un estándar, con su límite en cada categoría | 263 |
| [`estandar-cas.csv`](estandar-cas.csv) | un CAS de un estándar, con sus sinónimos | 456, con 455 CAS distintos |
| [`naturales.csv`](naturales.csv) | un constituyente regulado dentro de un natural (el anexo) | 1031, de 302 naturales |
| [`bases-schiff.csv`](bases-schiff.csv) | una base de Schiff y el aldehído que lleva | 16 |

## Las celdas de categoría

`cat_1` a `cat_12` son las 18 columnas de categoría del overview (1, 2, 3, 4, 5A a 5D, 6, 7A,
7B, 8, 9, 10A, 10B, 11A, 11B y 12). En % del producto terminado. Cada celda vale:
- **un número**, con punto decimal. El script quita el ruido de los decimales binarios
  (`1.6000000000000001E-4` pasa a `0.00016`) y lee la coma que IFRA usa a veces (`0,10` pasa
  a `0.1`);
- **`sin-restriccion`**: IFRA escribe «No Restriction»;
- **`prohibido`**: prohibido en esa categoría, «0.0 (Prohibited)»;
- **`ver-nota`**: «See Notebox». La sustancia está prohibida como tal, y la nota pone un
  tope a lo que llega de los naturales. Ese tope va en `limite_nota`, leído de la nota;
- **vacía**: IFRA no da cifra. Pasa en las prohibiciones y en las especificaciones.

`limite_expresado_como` dice cómo se cuenta el límite cuando no es la sustancia misma. Solo
pasa en el `IFRA_STD_089`, los cítricos, que cuentan como bergapteno (5-MOP).

## Lo que hay que saber

- **Los tipos**: `prohibicion`, `restriccion` y `especificacion` valen «sí» según el tipo de
  IFRA (`RESTRICTION_SPECIFICATION`…). Las notas de cada tipo van en inglés, tal como las
  escribe IFRA.
- **Tres estándares van por familia, sin CAS**:
  - el 089, cítricos y otros con furocumarinas;
  - el 184, derivados de pináceas;
  - el 188, ésteres alílicos.
- **`grupo`**, en `estandar-cas.csv`: algunos estándares separan sus CAS en grupos. En el 097,
  del tagetes, el mismo CAS está en la prohibición (*T. erecta*) y en la restricción
  (*T. patula* y *T. minuta*). En el 181, de la sabina, cada grupo tiene sus propios CAS.
- **El anexo identifica un natural por su variante**, no por su CAS. El mismo CAS reúne a
  veces varias variantes con valores distintos: el 8008-56-8, del limón, reúne el exprimido,
  la esencia y el destilado.
- **`estandar_constituyente`**: el estándar del constituyente, buscado por su CAS. El
  *benzyl trans-cinnamate* (78277-23-3) no está en ningún estándar.
- **`aviso`**: hay una errata en el original. En el *Cassia bark oil*, el alcohol cinámico
  pone «0..3», y se lee 0,3.
