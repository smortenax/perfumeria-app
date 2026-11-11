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
   de la web va en su columna y, solo cuando no hay otra cifra, acota el consenso general (abajo).

## Resultado

| Categoría | Productos | Alta | Media | Baja (estimada) | Baja (web en palabras) | Muy baja (consenso general) | Sin dato |
|---|---|---|---|---|---|---|---|
| Aroma chemicals | 151 | 133 | 14 | 0 | 1 | 0 | 3 |
| Absolutos, CO2, resinoides | 74 | 21 | 18 | 19 | 1 | 15 | 0 |
| Aceites esenciales | 194 | 107 | 64 | 3 | 9 | 11 | 0 |
| Tinturas y extractos | 137 | 2 | 0 | 71 | 7 | 57 | 0 |
| **Total** | **556** | **263** | **96** | **93** | **18** | **83** | **3** |

- **Alta**: el mismo material en PerfuMate (por CAS o por pareja a mano) y sin desacuerdo con lo común.
- **Media**: por nombre o especie, un pariente, o PerfuMate y lo común no dicen lo mismo.
- **Baja (estimada)**: tinturas y diluciones (también lo que la web vende diluido: castóreo al 20 %,
  resinoides al 50 % en propanodiol, pepino CO2 al 1 %), por la regla de arriba.
- **Baja (web en palabras)** (18; 4 con dos referentes que coinciden, 14 con uno; añadido el 2026-11-06
  a petición del usuario: «para lo que falta va a buscarlo a otros referentes de internet […] contrastar
  los referentes ya que a veces la búsqueda cita malas fuentes»): PerfuMate no tiene el material, pero un
  referente de la web dice su fuerza en palabras (TGSC «Odor Strength», Premiere Peau, Eden Botanicals,
  Fraterworks). Se parte del consenso general (abajo) y la cifra se lleva dentro del nivel que dice la web
  (low 1–3, medium 4–6, high 7–8, very high 9–10); en las tinturas, después, la regla de la dilución.
  **Esto es propuesta de la sesión y choca con V3-97** («sin convertirla»): si no la quieres, esos 18
  vuelven a «muy baja» y las palabras se quedan solo en su columna.
- **Muy baja (consenso general)** (83; añadido el 2026-11-06 a petición del usuario: «Aunque sea
  consensos generales»): ni PerfuMate ni la web dicen la fuerza de ese material. Se toma la mediana de
  PerfuMate de su género botánico (por ejemplo, *Thymus*: 7; *Cupressus*: 5) y, si PerfuMate no tiene el
  género, la de su tipo (aceites esenciales 6, de 240; absolutos 7, de 97; CO2 7, de 21; resinoides 6,
  de 7). En las tinturas, después, la regla de la dilución. Es un relleno para que el planificador no
  quede vacío, no un dato del material: la cebolla, por ejemplo, sale 6 y casi seguro es más.
- **Sin dato** (3): Avalone (sin CAS), lactato de butilo y estireno; TGSC no trae su fuerza.
- **Cómo se buscó en la web** (2026-11-06): los 105 que no tenían fuente directa, uno a uno, en tres
  rondas (`segunda-fuente-r1.csv`, `-r2`, `-r3`). Para cada uno, la búsqueda general primero y después
  la página del referente que cita, leída: solo vale lo que dice un proveedor o una base de datos de
  perfumería (TGSC, Premiere Peau, Eden Botanicals, Fraterworks, Scentspiracy), no una reseña, una tienda
  de aromaterapia ni el resumen del buscador. 19 dieron fuerza; en los demás, la columna `fuente` dice qué
  se buscó y que no lo dice ninguna fuente consultada. Los hongos, las algas, los frutos y las raíces de
  alimentación (plátano, maca, nigella…) no tienen material de perfumería conocido y no se buscaron.

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
- **Los CO2**: ninguna fuente da cuánto más fuertes son que el aceite o el absoluto. Premiere Peau
  (https://premierepeau.com/pages/glossary-terms/co2-extracts) y From Nature With Love los describen como
  más completos y fieles («richer and more complete than rose otto»), no como más concentrados; por eso un
  CO2 puro va con el impacto de PerfuMate o, si no está, con la mediana de los CO2 (7).

## Qué falta para que llegue a la app

Nada se carga hasta que elijas. Los siguientes pasos posibles: dar de alta en lo común los que tengas
o quieras (con su impacto y su fuente), o poner el impacto en tus versiones de los que ya tienes de
Maese Lab. Cualquiera de los dos es otra tanda, que escribe `v3/datos/`.
