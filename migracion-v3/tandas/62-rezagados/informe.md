# Tanda 62 · Los rezagados: los materiales que tienes con más huecos

*Generada por `migracion-v3/tanda-62-rezagados.ts` sobre lo común de `70b73df` (con las tandas 60 y 61 ya aprobadas), desde `migracion-v3/web/rezagados/`. Escribe `v3/datos/materials.csv`, `material_doses.csv` y `material_descriptors.csv` enteros: solo llena campos vacíos del material común y añade filas. Sin aprobar.*

**Por qué:** bandeja del laboratorio, 2026-11-18: «listar todas las fichas incompletas de los materiales que el usuario ya tiene»; el usuario, 2026-11-19: «empieza la línea de información».

**Cómo:** `migracion-v3/web/rezagados/lista.ts` toma de `migracion-v3/fichas-incompletas/` los 18 con más huecos que se llenan en lo común (familia, fabricante, CAS, uso, duración, fuerza, descriptores). **El producto y los documentos son de tu frasco:** no salen de la web y siguen vacíos. Lectura web y reglas, las de la tanda 60 (TGSC no responde; un subagente Sonnet; `consolidar.py`): frase literal, una página de otro CAS u otra forma no cuenta (el aceite no vale para una tintura), disputados si no coinciden, impacto solo de PerfuMate y del mismo material (V3-97).

**Resultado:** 1 campos llenos; 0 usos habituales; 6 descriptores; 1 disputados.

**Por qué es la 62:** esta lectura se aprobó como «tanda 61» (el usuario, 2026-11-19: «Apruebo la 61, fusiona y publica»), pero otra sesión ya había fusionado su propia tanda 61 (`61-rezagados-y-usos`, PR #80, que leyó 32 rezagados). Rehecha sobre ese `main`, solo llena lo que la otra dejó vacío y no repite sus descriptores.

**Para mirar antes de aprobar:**

- **Por qué se llena tan poco:** de estos 18, casi nadie publica ficha. Para los de Harrison Joseph solo hay páginas de Parchem (un distribuidor, sin casa, horas ni dosis); las tinturas y esencias de Maese Lab solo tienen la página de Maese (nivel y olor). TGSC, que daría horas y usos, devuelve 403 a las lecturas automáticas. Lo que queda vacío sigue en `migracion-v3/fichas-incompletas/`.
- **El cardamomo villoso (*Amomum villosum*):** el primer lector tomó la tintura de cardamomo negro de Maese por la tuya; el usuario, 2026-11-19: «tambien tienen cardamomo villoso tienen blanco verde villoso y negro». Su página (`maeselab.com/cardamomo-villoso-semilla-perfumeria/`) confirma la especie («Amomum Villosum Seed Extract», semilla, Java, 96°), pero no da olor, uso ni duración.
- **El fabricante** solo se toma de la ficha de la tienda donde compraste el frasco (3,4-xilenol, Perfumiarz → Sigma Aldrich). El KAO del aldehído hexilcinámico es el producto de Perfumiarz y tu frasco es de Maese Lab: no se usa.
- **Las horas de otra tintura** (ámbar gris 2 % y ambreta 20 % de Fraterworks) no valen para las de Maese Lab, de concentración desconocida: no se usan. El cypriol de Fraterworks es la misma especie (*Cyperus scariosus*) con otro CAS (91771-62-9): sus horas entran y el CAS queda en disputa.

| Material | Le faltaba | Lo que se llena |
|---|---|---|
| Villous cardamom, tincture | cas family doses tenacity strength | — |
| Green cardamom, tincture | doses tenacity | — |
| Truffle essence | cas family tenacity strength | — |
| Phenylethyl Mercaptan | house doses tenacity | — |
| 1-Octen-3-one Stabilised | house tenacity | — |
| Ambrette, tincture | doses tenacity | — |
| Methyl linolenate | family house tenacity descriptors | — |
| Narcisse Oxyacetate | house tenacity strength | — |
| 4-Propylphenol | house doses tenacity strength | — |
| Alpha-hexyl cinnamic aldehyde | house doses | — |
| Honey, aromatic essence | cas doses tenacity strength | — |
| Dewfruit TEC | cas tenacity | — |
| Thialdine | house doses tenacity strength | — |
| Auranone | cas tenacity | — |
| Black Agar 296985 | cas tenacity | — |
| Cypriol / Nagarmotha EO | doses tenacity | — |
| Ambergris, commercial tincture (purified) | cas doses tenacity | — |
| 3,4-Xylenol | doses tenacity | house = Sigma Aldrich |

## Disputados

| Material | Campo | Va | Otras referencias |
|---|---|---|---|
| Cypriol / Nagarmotha EO | cas | 68916-60-9 (se queda) | 91771-62-9 (Fraterworks, https://fraterworks.com/products/cypriol-nagarmotha-oil: «> 140 hours on a smelling strip.») |
