# Fase 5.2 y 5.3 · El buscador de la v3 con tus materiales

*Generado por `migracion-v3/fase-5/buscador.test.ts` con el buscador de la app (`v3/src/db/search.ts`) sobre lo común (`v3/datos/`) y tus versiones (`migracion-v3/tandas/8-tu-version/`). Los nombres salen de la v1 (`datos/glosario/materiales.csv`, por la pareja de `respuestas/laboratorio.csv` y `datos/v2/v1-a-v2.csv`; commit `d4c1e55`) y del laboratorio (`materiales.sqlite`, commit `c0e81e3`, abierto solo para leer), no de la v3: un nombre que la migración perdiera saldría aquí.*

## 5.2 · Cada material tuyo, por sus nombres de la v1 y del laboratorio

- **111 materiales, 2462 nombres** (cada nombre una vez por material). **2443 lo encuentran** (tu versión, en una fila de la lista) y **19 no**: 19 por una decisión y **0 sin explicar**.
- De los que lo encuentran, 2443 lo dan entre las 12 primeras filas y 0 más abajo (el nombre lo comparten muchos materiales).

| De dónde sale el nombre | Nombres | No lo encuentran | Más abajo de la fila 12 |
|---|---|---|---|
| laboratorio: nombre | 111 | 0 | 0 |
| laboratorio: sinónimo | 1049 | 0 | 0 |
| laboratorio: tu frasco | 75 | 0 | 0 |
| v1: CAS | 107 | 2 | 0 |
| v1: código | 120 | 17 | 0 |
| v1: nombre | 82 | 0 | 0 |
| v1: nombre comercial | 54 | 0 | 0 |
| v1: nombre de IFRA | 8 | 0 | 0 |
| v1: nombre de tienda | 129 | 0 | 0 |
| v1: sigla | 5 | 0 | 0 |
| v1: sinónimo | 722 | 0 | 0 |

**Los que no lo encuentran:**

| Material | Nombre | De dónde sale | Motivo |
|---|---|---|---|
| Aceite de cade (enebro) | CadO | v1 fig:1287: código | V3-45: su abreviatura es CdO; los otros códigos de la v1 no entran |
| Aldambre | 947-05-7 | v1 tl:947-05-7: CAS | V3-45: respondiste «fuera» en respuestas/cas-de-la-v1.csv |
| Aldehído C11 MOA | AlM | v1 prod:symrise-656012: código | V3-45: su abreviatura es Met; los otros códigos de la v1 no entran |
| Ambrettolide | Am2 | v1 tienda:63286-42-0: código | V3-45: su abreviatura es HH; los otros códigos de la v1 no entran |
| Castoreum | CsE | v1 fig:1345: código | V3-45: su abreviatura es CtA; los otros códigos de la v1 no entran |
| Cilantro | COHO | v1 fig:1529: código | V3-45: su abreviatura es COSO; los otros códigos de la v1 no entran |
| Dihydromyrcenol | OOM | v1 fig:946: código | V3-45: su abreviatura es Di18; los otros códigos de la v1 no entran |
| Haba tonka (semillas), tintura comercial | TOBE | v1 fig:2990: código | V3-45: su abreviatura es TBT; los otros códigos de la v1 no entran |
| Iso E Super | OE | v1 fig:94: código | V3-45: su abreviatura es OT; los otros códigos de la v1 no entran |
| Láudano de jara | LaO | v1 fig:2150: código | V3-45: su abreviatura es LaA; los otros códigos de la v1 no entran |
| Musgo de roble, absoluto | OAI | v1 prod:iff-00133097: código | V3-45: su abreviatura es OaA; los otros códigos de la v1 no entran |
| Naranja dulce | ORPO | v1 fig:2557: código | V3-45: su abreviatura es ORSO; los otros códigos de la v1 no entran |
| Olíbano (Boswellia sacra), aceite esencial | 8016-36-2 | v1 fig:2521: CAS | V3-45: respondiste «fuera» en respuestas/cas-de-la-v1.csv |
| Olíbano (Boswellia sacra), aceite esencial | OlSO | v1 ncs:olibanum-sacra-oil: código | V3-45: su abreviatura es OlO; los otros códigos de la v1 no entran |
| Patchouli | PcO | v1 fig:2600: código | V3-45: su abreviatura es PtO; los otros códigos de la v1 no entran |
| Resinoide de benjuí | BGS | v1 fig:1165: código | V3-45: su abreviatura es BSR; los otros códigos de la v1 no entran |
| Resinoide de estírax (estoraque) | SR | v1 fig:2913: código | V3-45: su abreviatura es StR; los otros códigos de la v1 no entran |
| Salvia Officinalis | SSO | v1 fig:2839: código | V3-45: su abreviatura es SDO; los otros códigos de la v1 no entran |
| Vetiver | VtO | v1 fig:3087: código | V3-45: su abreviatura es VeO; los otros códigos de la v1 no entran |


## 5.3 · El buscador no repite

- **Una fila por categoría:** en los 111, tu versión sale en la misma fila que su material común (V3-13). Hoy cada categoría tiene un solo material común (tanda 9): ninguna especie ni CAS se repite entre los tuyos.
- **Ningún nombre dos veces sin algo que lo distinga**, buscando el nombre de cada material y «lemon», «limón», «lavender», «lavanda», «cedar», «cedro», «bergamot», «rose», «musk», «amber»: ninguno. Tu versión y su común se llaman igual, pero una es tuya (con su tienda y su frasco) y la otra común.
- **Ninguna fórmula guarda una categoría:** en el esquema, solo `materials.category_id` apunta a `material_categories` (las migraciones de `v3/supabase/migrations/`).

**Lo que da cada búsqueda de prueba** (filas, y cuántos materiales debajo):

- «lemon»: Limón (2) · Geraniol 98% (2) · Iso E Super (2) · DPG (dipropilenglicol) (2) · Eucaliptol (2)
- «limón»: Limón (2) · Eucaliptol (2) · Geraniol 98% (2) · Dihydromyrcenol (2) · DPG (dipropilenglicol) (2)
- «lavender»: Lavanda (2)
- «lavanda»: Lavanda (2) · Salvia Officinalis (2)
- «cedar»: Cedro Atlas (2) · Cedro chino, aceite esencial (2) · Cedramber (2)
- «cedro»: Cedramber (2) · Cedro Atlas (2) · Cedro chino, aceite esencial (2)
- «bergamot»: Bergamota sin bergaptenos (2) · Acetato de linalilo (2)
- «rose»: Geraniol 98% (2) · Óxido de rosa (2) · Eucaliptol (2) · Láudano de jara (2) · Acetato de linalilo (2)
- «musk»: Cashmeran (2) · Galaxolide (2) · Ambrettolide (2) · Ethylene Brassylate (2) · Musgo de roble, absoluto (2)
- «amber»: Ambermor (2) · Ambrinol S (2) · Iso E Super (2) · Aldehído C12 MNA (2) · Ámbar gris, tintura comercial (purificado) (2) · Cedramber (2) · Norlimbanol (2) · Galaxolide (2) · Ambrettolide (2) · Ajenjo, aceite esencial (2) · Resinoide de estírax (estoraque) (2)
