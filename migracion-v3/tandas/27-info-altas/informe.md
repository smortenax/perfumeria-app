# Tanda 27 · La información clave de los botes del 2026-10-26

*Generada por `migracion-v3/tanda-27-info-altas.ts` sobre lo común de `main` (commit `6b00bcd`), con la búsqueda en `migracion-v3/web/info-altas-26-oct/` y el certificado de Auranone del laboratorio (commit `7c7fe20`). Escribe `v3/datos/material_doses.csv` y `v3/datos/material_components.csv` enteros, con lo nuevo añadido: no cambia ni borra nada de lo que hay. Sin aprobar.*

**Qué entra:** 5 dosis de uso (de páginas que la sesión releyó) y 27 constituyentes con su CAS y su cifra (composiciones publicadas que recoge Fraterworks y el certificado de otro proveedor de Auranone: literatura, no el lote comprado). Ninguna cifra de IFRA: esas salen solo de los archivos de IFRA, por el CAS. Lo demás de la búsqueda (identidad, pistas de IFRA de las tiendas, documentos, lo que no se encontró) está en la tarea `docs-v3/tareas/2026-10-27-info-altas.md`.

| Material | Dosis nuevas | Constituyentes nuevos |
|---|---|---|
| Auranone | 0 | 3 |
| Gálbano, aceite esencial | 1 | 7 |
| Mirra, aceite esencial | 1 | 11 |
| Opopónax, aceite esencial | 1 | 6 |
| Orris Givco | 1 | 0 |
| Polysantol | 1 | 0 |

## Conflictos (los decides tú; no se escriben)

- **Ambrarome**: ahora 0.0004 / 0.00438 / 0.008 (web: Fraterworks, https://fraterworks.com/products/ambrarome); https://fraterworks.com/products/ambrarome-absolute da hoy mín. tr. %, mediana 0.05 %, máx. 50 %. la tanda 23 tiene mediana 0.438 % (de /products/ambrarome, que hoy da 404); lo decide el usuario.
- **Clearwood**: ahora 0.001 / 0.0015 / 0.002 (web: Fraterworks, https://fraterworks.com/products/clearwood); https://fraterworks.com/products/clearwood da hoy mín. 0.1 %, mediana 0.311 %, máx. 6 %. la tanda 23 tiene mediana 0.15 % y máximo 0.2 %; lo decide el usuario.

## Dosis nuevas

| Material | Mín. | Típico | Máx. | Fuente |
|---|---|---|---|---|
| Mirra, aceite esencial | — | 0.0006 | 0.07 | web: Fraterworks, https://fraterworks.com/products/myrrh-oil: «Myrrh Oil appears in 2% of the perfumes we have analysed, at a median of 0.06% of the concentrate.» |
| Gálbano, aceite esencial | 0.00035 | 0.003 | 0.015 | web: Fraterworks, https://fraterworks.com/products/galbanum-oil-iran-wild: «0.3% Median use in perfumes · 0.035% Minimum observed · 1.5% Maximum observed» |
| Opopónax, aceite esencial | — | 0.0007 | 0.015 | web: Fraterworks, https://fraterworks.com/products/opoponax-oil-1: «Opoponax Oil appears in 1% of the perfumes we have analysed» |
| Orris Givco | 0.008 | 0.01 | 0.018 | web: Fraterworks, https://fraterworks.com/products/orris-givco: «Orris Givco® 204/20 is used at a median of 1% of the concentrate in the formulas we have analysed.» |
| Polysantol | 0.0001 | 0.006 | 0.542 | web: Fraterworks, https://fraterworks.com/products/polysantol: «0.6% Median use in perfumes · 0.01% Minimum observed · 54.2% Maximum observed» |

Las cifras son fracciones del concentrado (0.006 = 0,6 %).

## Constituyentes nuevos

| Material | Constituyente | CAS | Cantidad |
|---|---|---|---|
| Mirra, aceite esencial | delta-Elemene | 20307-84-0 | 0.2879 |
| Mirra, aceite esencial | alpha-Copaene | 3856-25-5 | 0.1002 |
| Mirra, aceite esencial | beta-Elemene | 515-13-9 | 0.0619 |
| Mirra, aceite esencial | alpha-Bergamotene | 17699-05-7 | 0.049 |
| Mirra, aceite esencial | Lindestrene | 2221-88-7 | 0.035 |
| Mirra, aceite esencial | beta-Ocimene (total isomers) | 3338-55-4 | 0.0317 |
| Mirra, aceite esencial | Limonene | 138-86-3 | 0.0042 |
| Mirra, aceite esencial | Myrcene | 123-35-3 | 0.0045 |
| Mirra, aceite esencial | beta-Caryophyllene | 87-44-5 | 0.0008 |
| Mirra, aceite esencial | Furanodien-6-one | 24268-41-5 | 0.004 |
| Mirra, aceite esencial | Curzerene | 17910-09-7 | 0.0009 |
| Opopónax, aceite esencial | alpha-Bergamotene (total isomers) | 13474-59-4 | 0.15 |
| Opopónax, aceite esencial | alpha-Santalene | 512-61-8 | 0.1 |
| Opopónax, aceite esencial | beta-Bisabolene | 495-61-4 | 0.05 |
| Opopónax, aceite esencial | alpha-Copaene | 3856-25-5 | 0.05 |
| Opopónax, aceite esencial | beta-Elemene | 515-13-9 | 0.05 |
| Opopónax, aceite esencial | delta-Cadinene | 483-76-1 | 0.05 |
| Gálbano, aceite esencial | beta-Pinene | 127-91-3 | 0.4509–0.599 |
| Gálbano, aceite esencial | alpha-Pinene | 80-56-8 | 0.026–0.15 |
| Gálbano, aceite esencial | delta-3-Carene | 13466-78-9 | 0.01–0.2 |
| Gálbano, aceite esencial | cis-Chrysanthenyl acetate | 50764-55-1 | 0.061 |
| Gálbano, aceite esencial | Limonene | 138-86-3 | 0.0075–0.045 |
| Gálbano, aceite esencial | Geraniol | 106-24-1 | 0.016 |
| Gálbano, aceite esencial | Myrcene | 123-35-3 | 0.006–0.037 |
| Auranone | 4-(4-Hydroxyphenyl)butan-2-one | 5471-51-2 | 0.0015 |
| Auranone | Cyclopentadecanolide | 106-02-5 | 0.04838 |
| Auranone | Methyl ionone, mixed isomers | 1335-46-2 | 0.00198 |
