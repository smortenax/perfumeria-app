# Estado de la v2 del modelo de materiales

Se lee al empezar cada sesión y se actualiza al terminar (30 líneas como máximo).
Autoridad: [`decisiones-v2.md`](decisiones-v2.md) (D1–D10). La v1 está congelada en la etiqueta
`glosario-v1`; sus errores, en [`errores-v1.md`](errores-v1.md).

## Fases

- [x] **Fases 0 a 2** (hasta el 2026-10-03): esquema, validador, IFRA de punta a punta, D2, D7 y D8.
- [ ] **Fase 3 — La F-001 entera en la v2**, por lotes (`docs/v2/lotes.json`, `alta.py --lote`).
  Cierre: la F-001 se calcula entera con la v2 y su comparación con la v1 queda explicada, con la
  correspondencia de cada material elegida por el usuario. Hechos 3a, 3b y 3c; falta el **3d** (abajo).
- [ ] **Fase 4 — Los 32 productos de Perfumiarz**, en dos lotes: 23 documentados y 9 parciales o sin
  documentos. Las sustancias de los certificados salen de `docs/proveedores/productos-sustancias.csv`.
  Los topes van por producto (D4).
- [ ] **Fase 5 — La v2 por defecto en la app.** Lo que solo está en la v1 aparece como «v1, sin
  revisar». Las fórmulas se migran al abrirlas, con registro-ids y comprobación de CAS. La ficha
  enseña la autoridad y el documento de cada cifra. **Requisito:** la interfaz explica cada «no»,
  incluido el grupo combinado de fototóxicos (D10) con sus miembros y su suma (`combinedChecks`).
- [ ] **Fase 6 — El resto del glosario**, por clase, en lotes de 300 como máximo, con los conflictos
  agrupados por tipo. Nada entra con más autoridad que su fuente. Buscar los errores de `errores-v1.md`.

## Hecho el 2026-10-03

- Reabiertos con la D9 los 4 documentos de 3a y 3b: alfa-amil cinámico y Safraleine, de otro
  proveedor (placeholders); Polysantol y Sandalmysore Core, de otro material (errores de la v1).
- Los estándares de naturales 086–096 se reconocen también por especie + parte + proceso
  (`docs/v2/estandares-naturales.csv`): solo afecta a la bergamota FCF, que es el STD 087.

## Siguiente

- **Lote 3d**: cade, láudano, cacao y olíbano de Maese Lab; tinturas y bases (ámbar gris, haba tonka,
  trufa). Al entrar el cade, modelar el STD 078 (PAH del estírax de pirólisis y del cade rectificado).
