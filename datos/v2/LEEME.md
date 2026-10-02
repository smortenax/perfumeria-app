# Datos de la v2: el modelo de materiales

La autoridad es [`docs/v2/decisiones-v2.md`](../../docs/v2/decisiones-v2.md). Esta carpeta
la escribe [`scripts/v2/alta.py`](../../scripts/v2/alta.py) desde las entradas de
[`docs/v2/altas/`](../../docs/v2/altas/), nunca a mano fila a fila, y **`npm run validar:v2` tiene
que pasar antes de cada commit de datos**. La salida completa va a `validacion.txt`, que no
se guarda en Git.

## Ids

Cada sustancia, material, producto, lote, documento y grupo tiene un id de
[`registro-ids.csv`](registro-ids.csv), **asignado una vez y nunca recalculado**. Nunca sale de
un número de fila. Un id retirado no se reutiliza.

| Entidad | Forma |
|---|---|
| sustancia | `S00001` |
| material | `M00001` |
| producto | `P00001` |
| lote | `L00001` |
| documento | `D00001` |
| grupo | `G00001` |

## Las cifras

- **Porcentajes en texto decimal** con punto (`12.5`). El validador los lee como fracciones
  exactas.
- **La composición va en % de la materia pura del contenedor.** La de un producto también: su
  **dilución es solo un dato del producto** (`dilucion_pct`) y nunca entra en su composición.
- Cada cifra de composición lleva **tipo** (`tipico`, `maximo`, `rango`), **autoridad** y
  **documento**. La autoridad va con el contenedor: `lote` en un `L`, `producto` en un `P`, y
  `anexo-ifra`, `literatura` o `consenso` en un `M`. De mayor a menor autoridad: lote > producto
  > anexo IFRA > literatura > consenso > desconocido.
- **Un placeholder** (`literatura` o `consenso`) nunca da «dentro» en IFRA, como mucho
  «acotado», con el máximo de su fuente (D2).
- **Lo desconocido no vale cero.** Por eso cada fuente declara su cobertura.

## Tablas

| Archivo | Una fila es | Columnas |
|---|---|---|
| `registro-ids.csv` | un id | `id, entidad, clave, alta, estado` (`activo`/`retirado`), `notas` |
| `sustancias.csv` | una sustancia | `id, nombre, notas` |
| `sustancia-cas.csv` | un CAS de una sustancia | `id_sustancia, cas, relacion` (`principal`/`isomero`/`mezcla`/`obsoleto`), `notas` |
| `grupos.csv` | un estándar IFRA o un alérgeno UE | `id, tipo` (`estandar-ifra`/`alergeno-ue`), `referencia` (`IFRA_STD_005`…), `nombre, notas` |
| `grupo-miembros.csv` | un miembro de un grupo | `id_grupo, id_miembro, subgrupo, notas` |
| `materiales.csv` | un material | `id, tipo` (`sustancia`/`natural`/`base`/`formula`), `nombre, id_sustancia, especie, parte, proceso, quimiotipo, cas, inci, excepciones, motivo_excepcion, notas` |
| `composicion.csv` | un componente de un material, producto o lote | `id_contenedor, id_componente, min, tipico, max, tipo_valor, autoridad, id_documento, notas` |
| `coberturas.csv` | qué cubre la composición de una fuente | `id_contenedor, id_documento, cobertura` (`reguladas-completa`/`solo-alergenos`/`parcial`/`desconocida`), `notas` |
| `productos.csv` | un producto de un proveedor (D3) | `id, id_material, nombre, fabricante, codigo, tienda, url, dilucion_pct, id_diluyente, notas` |
| `topes.csv` | el tope de un fabricante para su producto (D4) | `id_producto, categoria` (`4`, `5a`…), `max_pct, id_documento, notas` |
| `lotes.csv` | un lote de un producto (opcional, D3) | `id, id_producto, codigo_lote, fecha, notas` |
| `documentos.csv` | una fuente | `id, tipo` (`coa`/`sds`/`certificado-ifra`/`ficha`/`anexo-ifra`/`articulo`/`consenso`/`otro`), `titulo, emisor, fecha, ruta, estado_revision` (`pendiente`/`revisado`), `notas` |
| `usos.csv` | un uso habitual o una duración, con su base | `id_material, magnitud` (`uso-habitual`/`duracion`), `min, tipico, max, unidad, base, autoridad, id_documento, notas` |
| `v1-a-v2.csv` | un id del glosario v1 y su id v2 | `id_v2, id_v1` |

Más detalle:
- **Un natural** se identifica por especie + parte + proceso + quimiotipo (D1). El CAS y el
  INCI son atributos.
- **IFRA limita por grupo**, no por CAS. Los límites se leen de `datos/ifra/51/` tal cual y
  aquí no se copian. Un miembro es una sustancia o un material que IFRA limita como tal: los
  estándares por familia (089, 184) y un natural cuyo CAS está en el índice (el musgo de roble,
  067). `subgrupo` separa los grupos del 097 y del 181.
- **Un material `sustancia` sin composición** es su propia sustancia al 100 % y no necesita
  cobertura. Si tiene filas, por ejemplo las impurezas de un producto, sí la necesita.
- **Un `natural` o una `base` sin filas propias** de composición llevan una cobertura
  `desconocida` explícita, con `id_documento` vacío.
- **`excepciones`** salta a sabiendas las reglas `suma` o `naturales` (lista separada por `;`)
  y exige un `motivo_excepcion`.
- **El tope de un fabricante** es del producto. Si se conoce su causa, se modela como
  constituyente (D4).
- **El uso y la duración** son otra capa y nunca se mezclan con IFRA.

## Reglas de `npm run validar:v2`

Solo los **errores** dan código 1. Los **avisos** se muestran y los decide el usuario. El
número de línea cuenta la cabecera como línea 1.

| Regla | Comprueba |
|---|---|
| `esquema` | cada archivo existe y tiene exactamente sus columnas |
| `cas` | formato y dígito de control |
| `ids` | únicos, con la forma de su entidad y registrados como tal; un id activo existe en su tabla |
| `huerfanos` | toda referencia apunta a algo que existe y del tipo correcto |
| `valores` | números entre 0 y 100; min ≤ típico ≤ máx; `tipico` exige típico, `maximo` exige máx, `rango` exige mín y máx |
| `suma` | por contenedor y documento, las cotas inferiores no pasan de 100,5 %, salvo con la excepción `suma` |
| `ciclos` | ningún material se contiene a sí mismo, tampoco a través de sus productos o lotes |
| `naturales` | un material `sustancia` no lleva ningún natural dentro, salvo con la excepción `naturales`; las bases sí pueden |
| `procedencia` | toda cifra lleva autoridad válida y documento, y el documento está `revisado` (D6) |
| `natural` | todo natural tiene especie |
| `coherencia` | valores de los campos cerrados, autoridad ↔ contenedor, un solo CAS principal por sustancia y en una sola sustancia, el estándar existe en IFRA 51 |
| `cobertura` | cada (contenedor, documento) con composición declara su cobertura; naturales y bases sin composición, `desconocida` |
| `v1` | cada `id_v1` existe en `datos/glosario/materiales.csv` y no apunta a dos `id_v2` |
| `duplicado` *(aviso)* | el mismo componente y contenedor, con la misma autoridad, en dos documentos con cifras distintas |

El código está en [`src/v2/`](../../src/v2/), y la orden en
[`scripts/validar_v2.ts`](../../scripts/validar_v2.ts). Las pruebas tienen un caso que pasa y
uno que falla por regla, en `src/v2/fixtures/`.
