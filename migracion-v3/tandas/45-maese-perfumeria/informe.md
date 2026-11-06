# Tanda 45 · Los materiales de perfumería de Maese Lab, con su fuerza de 1 a 10

*Propuesta para revisar, sin aprobar. **No toca `v3/datos/`**: es el catálogo investigado, del que
saldrán las altas que elijas. Los datos y los scripts están en `migracion-v3/web/maese-perfumeria/`.*

**Por qué** (orko kill, 2026-11-06): «buscar toda la información de los materiales que hay de maese lab,
los categorizados en el apartado de perfumeria […] se buscan los distintivos de los materiales que sí que
hay en la web, nombre y cas. Y se busca y se contrasta nombre y cas con las webs de referencia necesarias
para determinar la potencia es importante llegar a consenso […] con particularidades como entender la
potencia real de una tintura».

## Qué entra

Los productos de maeselab.com del 2026-11-06 en cuatro categorías: «Aroma Chemicals, Fracciones y
Moléculas» (151), «Absolutos, CO2, Resinoides y Reducciones» (74), «Aceites esenciales» (194) y, de
«Tinturas y Extractos vegetales», las 137 del filtro «Apto para Perfumería: Sí» (de 199). **556 en total.**
El filtro «Apto para Perfumería» solo existe en las tinturas: en las otras categorías no quita nada.
Quedan fuera las «Esencias aromáticas» (78 acordes sin CAS ni composición), los hidrolatos (26) y los
oleomacerados (13).

## Cómo se hizo

1. **La ficha técnica de cada producto**, copiada literal (`fichas/lote*.txt`): nombre, tipo, método,
   parte, origen, INCI, CAS, pureza, y en las tinturas la graduación y la «Cantidad de Cargas».
2. **El cruce con PerfuMate** (`cruzar.py`, la misma copia de PerfuMate que leyeron las tandas 21 y 43):
   por CAS; si no, por nombre; si no, por la especie del INCI con el mismo proceso. El CAS del disolvente
   (etanol, propanodiol, DPG…) no cuenta.
3. **100 parejas elegidas a mano** (`equivalencias.csv`), cada una con su motivo, cuando el cruce no
   encontró nada o encontró otro proceso. Son propuesta de la sesión.
4. **La fuerza** (`consenso.py` → `consenso.csv`): el impacto de PerfuMate, de 1 a 10, tal cual (V3-82).
   - «mismo»: el mismo material. «pariente»: otra especie del género u otro proceso (confianza media).
   - «base»: una tintura o una dilución. Su impacto se estima desde el del material puro:
     **impacto − 3 · log10(1/fracción)**; al 10 %, tres puntos menos. Las anclas y las fuentes, en
     `fuentes-tinturas.md` (PerfuMate: vainilla 7 → su tintura 4, orris 6 → 3; Arctander vía
     Scentspiracy: las tinturas se hacen del 3 al 20 %). Si la tintura no dice su porcentaje, se toma
     el 10 % y se dice.
5. **El contraste**: con lo común de la v3 (129 productos coinciden por CAS con un común) y, para lo que
   PerfuMate no tiene, con la web (TGSC, Eden Botanicals; `segunda-fuente-*.csv`). La fuerza en palabras
   de TGSC **no se convierte a número** (V3-97): va en su columna.

## Resultado

| Categoría | Productos | Alta | Media | Baja (estimada) | Solo en palabras | Sin dato |
|---|---|---|---|---|---|---|
| Aroma chemicals | 151 | 133 | 14 | 0 | 1 | 3 |
| Absolutos, CO2, resinoides | 74 | 23 | 18 | 16 | 0 | 17 |
| Aceites esenciales | 194 | 107 | 64 | 3 | 4 | 16 |
| Tinturas y extractos | 137 | 2 | 0 | 71 | 0 | 64 |
| **Total** | **556** | **265** | **96** | **90** | **5** | **100** |

- **Alta**: el mismo material en PerfuMate (por CAS o por pareja a mano) y sin desacuerdo con lo común.
- **Media**: por nombre o especie, un pariente, o PerfuMate y lo común no dicen lo mismo.
- **Baja (estimada)**: tinturas y diluciones, por la regla de arriba.
- **Sin dato** (100): PerfuMate no lo tiene y la web no lo dice. 42 se buscaron a mano (TGSC no trae
  «Odor Strength» para ellos); 58, sobre todo tinturas de algas, hongos, resinas de pino y copales, **no
  se buscaron uno a uno**: las primeras búsquedas de ese tipo no dieron nada. Quedan vacíos, no a cero.

## Para mirar antes de aprobar

- **La regla de las tinturas** es una propuesta de la sesión. La alternativa, para el planificador: usar
  el impacto del material puro y multiplicar la cantidad por la fracción aromática (V3-98 ya pondera por
  cantidad). Las dos cifras están en `consenso.csv`.
- **Diez desacuerdos con lo común** (mismo CAS, otro producto de PerfuMate): Amberfleur y Timbersilk 4
  frente a Iso E Super 2; Ambroxan Cristal 7 frente a Ambermor 8; musgo de roble 7 frente a 8; cardamomo
  7 frente a 8; cilantro 6 frente a 8; enebro 5 frente a 6; naranja sanguina 5 frente a 4; petitgrain
  limón 7 y mandarina 6 frente a 5. Están en la columna `contraste`.
- **Errores en la web de Maese Lab**: CAS que no pasan el dígito de control (fenilacetato de etilo
  4940-97-3, debe ser 101-97-3; haba tonka 90028-06-2; eneldo 8006-75-4; madreselva 64-18-5), el CAS del
  agua escrito 7732-18-6, -7, -8 o -9 en 13 tinturas (el bueno es 7732-18-5: parece una hoja de cálculo
  que arrastró la celda) y 28 productos sin CAS. El «Jengibre fresco» lleva el INCI del plai (*Zingiber
  cassumunar*), y va con el impacto del plai.
- **Lo que no es evidencia**: la fuerza de Maese en sus textos («muy fuerte, diluir al 1 %») se copia en
  `nota_web` de `cruce.csv`, pero no decide nada.

## Qué falta para que llegue a la app

Nada se carga hasta que elijas. Los siguientes pasos posibles: dar de alta en lo común los que tengas
o quieras (con su impacto y su fuente), o poner el impacto en tus versiones de los que ya tienes de
Maese Lab. Cualquiera de los dos es otra tanda, que escribe `v3/datos/`.
