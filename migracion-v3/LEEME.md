# La migración a la v3

El puente entre la v2 y la v3 (V3-21). Lee la v2 (`datos/v2/`, con su propio cargador y su
validador), el glosario de la v1 (`datos/glosario/`, congelado: se lee, no se toca) y los
archivos de IFRA (`datos/ifra/51/`), y escribe lo común, tratado y citado, para `v3/datos/`.
Nada de aquí entra en la v3: cuando la v3 tenga sus datos, esta carpeta se queda en este repo.

## Cómo va

1. **Migrar una tanda:** `node migracion-v3/tanda-<n>-<nombre>.ts` escribe sus CSV y su
   `informe.md` en `migracion-v3/tandas/<n>-<nombre>/`. Si `validar:v2` da un error, no escribe nada.
   Dos ejecuciones dan los mismos bytes.
2. **Revisar el informe:** qué entra, de dónde, cómo se traduce y qué hay que mirar.
3. **Aprobar** (solo con el visto bueno del usuario, en el chat):
   `node migracion-v3/aprobar.ts <n>-<nombre> "<sus palabras>"`. Copia los CSV a `v3/datos/` y
   apunta la aprobación en `migracion-v3/tandas/aprobadas.csv` y en `v3/datos/tandas.csv`, que
   viaja con los datos.
4. **Commit** de `v3/datos/`, y **cargar** desde `v3/`: `npm run datos:cargar`. Una segunda carga
   no cambia ninguna fila; `data_version` guarda el commit de los datos (V3-26).

## Las tandas

| Tanda | Qué | Pasos del plan |
|---|---|---|
| 1 · materiales | Los materiales comunes de la v2, sus productos, sus otros nombres, CAS y familias | 4.1, 4.2, 4.4, 4.7 |
| 2 · composición | Lo que lleva cada material, con su autoridad y su fuente | 4.3, 4.4 |
| 3 · IFRA | Las regulaciones y los requisitos, y los topes de fabricante | 4.4, 4.5, 4.6 |
| 4 · categorías y duplicados | Los grupos del buscador y lo que se fusiona, con tus decisiones | 4.8 |
| 5 · laboratorio | Tus 111 materiales, en tu cuenta | 4.9 |

## Los ids

Cada fila lleva un UUID v5 calculado de su clave de la v2 (`lib/ids.ts`): volver a migrar da los
mismos ids, y una fórmula de la v2 encuentra su material por su id de siempre.
