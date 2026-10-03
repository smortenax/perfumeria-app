# Estado de la v2 del modelo de materiales

Se lee al empezar cada sesión y se actualiza al terminar (30 líneas como máximo).
Autoridad: [`decisiones-v2.md`](decisiones-v2.md) (D1–D12). La v1 está congelada en la etiqueta
`glosario-v1`; sus errores, en [`errores-v1.md`](errores-v1.md).

**Se trabaja en `main`** desde la fusión de `v2-materiales` (avance rápido a `df6c28a`, 2026-10-03 05:17, tras pedirlo el usuario); la rama se borró.

## Fases

- [x] **Fases 0 a 2** (hasta el 2026-10-03): esquema, validador, IFRA de punta a punta, D2, D7 y D8.
- [x] **Fase 3 — La F-001 entera en la v2**: lotes 3a a 3d, 60 materiales ([`comparacion-fase3.md`](comparacion-fase3.md); pendientes por tienda en [`pendientes-F001.md`](pendientes-F001.md)).
- [x] **Fase 4 — Los 32 productos de Perfumiarz**: 4a (23 documentados) y 4b (9 sin certificado o con otro). La
  pimienta entra con su certificado `pct:100` (D12). Los rangos de SDS no son composición. Evidencia en
  `datos/v2/evidencia/`; pedidos a Perfumiarz en `pendientes-perfumiarz.md`. D12 y la regla de los rangos de SDS: **aprobadas**.
- [x] **Fase 5 — La v2 por defecto en la app**: migración al abrir (D13, copia en `copias-v1`), ficha «De dónde sale», explicaciones del «no»
  y del «no se sabe», barra con D12, repositorio fusionado con la v1 «sin revisar», informe con tu biblioteca ([`comparacion-fase5.md`](comparacion-fase5.md)).
- [ ] **Fase 6 — El resto del glosario**, por clase, en lotes de 300 como máximo (`scripts/v2/glosario.py`, lotes congelados en
  `glosario-lotes.json`). Solo identidad y datos de IFRA; los conflictos se clasifican solos. Lo que usa tu biblioteca queda para el
  final (`glosario-despues.csv`). **Lote 6a** (moléculas, 300): entran las 300, sin conflicto. El aviso de origen desconocido es solo
  para materiales con producto tuyo.

## Condiciones de IFRA (D11), a 2026-10-03

- **Probada:** el musgo de roble de IFF (067): su certificado IFRA es la acreditación. **Supuesta:** el cade
  (119), por consenso. **Pendientes:** linalol (187), cedro Atlas (184), metil ionona gamma (063) y allyl amyl
  glycolate (188). **No aplica:** la especificación de PAH del 078, que es del aceite de pirólisis, a un
  resinoide (`especificaciones-excluidas.csv`, por proceso, sin suponer nada).
