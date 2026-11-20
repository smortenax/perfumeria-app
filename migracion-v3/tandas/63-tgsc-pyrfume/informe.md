# Tanda 63 · Los descriptores de TGSC que publica Pyrfume

*Generada por `migracion-v3/tanda-63-tgsc-pyrfume.ts` sobre lo común de `891650c`, desde `migracion-v3/web/tgsc/pyrfume-63.csv`. Escribe `v3/datos/materials.csv` y `material_descriptors.csv` enteros: solo añade descriptores y llena la familia donde estaba vacía. Sin aprobar.*

**Por qué:** el usuario, 2026-11-19: «usa los de pyrfume y guardo yo las páginas». TGSC devuelve 403 a las lecturas automáticas; Pyrfume publica en GitHub los descriptores de olor de TGSC por CAS (`pyrfume-data/goodscents`: `behavior.csv` y `stimuli.csv`).

**Cómo:** `migracion-v3/web/tgsc/pyrfume.py` baja esos dos archivos (apunta su sha256), los cruza por CAS exacto con las 10 moléculas de `migracion-v3/web/tgsc/lista.csv` y da su lista de descriptores, con la concentración y el disolvente con que TGSC la olió. Un natural no se cruza por CAS.

**Resultado:** 9 descriptores; 1 familia.

**Para mirar antes de aprobar:**

- **No hay horas, uso ni fuerza:** Pyrfume no los publica. Salen de las páginas de TGSC que vas a guardar (`migracion-v3/web/tgsc/lista.md`).
- **La familia** (solo el linolenato de metilo, que no la tenía) es la primera palabra de la lista que la app sabe leer («fruity; fatty; oily» → fruity): es una lectura de la sesión.
- **La licencia:** el manifiesto de Pyrfume dice «see LICENSE for use restrictions; Pyrfume developers make no claims concerning copyright», y ese LICENSE no está en el repositorio. Los datos son de TGSC. Para tu uso, bien; si la app se distribuye como producto, es una duda abierta (cada material lo apunta en sus notas).

| Material | CAS | Descriptores (TGSC) | Familia | Ficha |
|---|---|---|---|---|
| 1-Octen-3-one Stabilised | 4312-99-6 | metallic, vegetable, musty, dirty, mushroom, broccoli, chicken, herbal, savory, cabbage, fishy, earthy | — | TGSC 1027981 (at 0.1 % in triacetin) |
| 2-Hydroxybenzaldehyde | 90-02-8 | spicy, medicinal, cinnamon, cooling, wintergreen | — | TGSC 1028641 (at 10.0 % in dipropylene glycol) |
| 3,4-Xylenol | 95-65-8 | dry, flat | — | TGSC 1036991 |
| 4-Propylphenol | 645-56-7 | phenolic, medicinal | — | TGSC 1037241 (at 0.1 % in propylene glycol) |
| Aldambre | 1725-03-7 | — | — | Pyrfume no tiene este CAS |
| Methyl linolenate | 7361-80-0 | fruity, fatty, oily | fruity | TGSC 1477771 (at 100.0 %) |
| Narcisse Oxyacetate | 67028-40-4 | fruity, powdery, brown, cherry, hay | — | TGSC 1023241 (at 10.0 % in dipropylene glycol) |
| Phenylethyl Mercaptan | 4410-99-5 | rubbery, sulfurous | — | TGSC 1049141 (at 0.1 % in propylene glycol) |
| Thialdine | 638-17-5 | meaty, sulfurous, nutty, clam, hazelnut, earthy, corn | — | TGSC 1576841 (at 0.1 % in propylene glycol) |
| Vinyl Sulfurol | 1759-28-0 | musty, vegetable, root beer, cocoa, nutty, rooty | — | TGSC 1028541 (at 0.1 % in dipropylene glycol) |
