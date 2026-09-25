> 📥 **Copiado del laboratorio** (`materias-primas/_datos/niveles-de-uso.md`, commit `9949c5f`) por `scripts/importar_datos.py`. **No se edita aquí**: se corrige en el laboratorio y se vuelve a importar.

---
id: REF-niveles-de-uso
tipo: referencia
nombre: Niveles de uso de toda la paleta — poder, consenso y dosis para 10 g
fecha: 2026-09-23
confianza: media para el consenso · media para la recomendación
---

# Niveles de uso — los 54 materiales

**Cuatro preguntas por material**, que son cuatro cosas distintas y se confunden entre sí
constantemente:

| | Qué es | Quién lo dice |
|---|---|---|
| 🔬 **Poder olfativo** | Cuánto pesa en la mezcla por gramo | La nariz, y el umbral publicado |
| ⚖️ **IFRA categoría 4** | El **máximo legal** en producto terminado de piel | IFRA, 51ª enmienda — **en la [normativa](https://github.com/smortenax/perfumeria-lab/blob/9949c5fae215667eebbe460148311164aedd8ca3/conocimiento/normativa/README.md)**, su única fuente |
| 👥 **Consenso** | Lo que **de hecho** se pone, aunque no haya ley | Perfumistas, foros, fórmulas publicadas |
| 🎯 **Recomendación** | Por dónde empezar **en un lote de 10 g** | Este repositorio |

**Esta página responde las otras tres.** El [catálogo](https://github.com/smortenax/perfumeria-lab/blob/9949c5fae215667eebbe460148311164aedd8ca3/vistas/catalogo.md) las junta con el
techo IFRA, material a material.

> 🎯 **La intuición que abrió esto era correcta, y se quedaba corta.**
> *«aunque no sea limitado por la IFRA nadie usa más de un 5 % de cistus jara o labdanum»*
> **IFRA no lo limita — y el consenso real es 0,1–1 %, hasta 2 %.** Cinco a cincuenta
> veces por debajo del 5 %. **La regla no escrita es más severa que la escrita.**

---

## 🔴 Lo primero: la base. Sin esto los números no significan nada

Las tres columnas hablan de **tres denominadores distintos**, y es el error que este
repositorio lleva corrigiendo desde julio.

| Columna | Base | En un lote de 10 g |
|---|---|---|
| **IFRA cat 4** | % del **producto terminado** | × 0,1 → gramos |
| **Consenso** | % del **concentrado** | × 0,025 → gramos |
| **Recomendación** | gramos, directamente | — |

**El lote de referencia es el que ya se usa:** 10 g de perfume alcohólico con **≈2,5 g de
materia aromática (25 %)**. Es la proporción real de `F-001-v1` —2,4519 g sobre 8,745 g—
redondeada.

> **Un 1 % del concentrado son 0,025 g.** Un 1 % IFRA son 0,100 g. **Difieren en 4×**, y
> ese factor es exactamente la contradicción del Iso E Super que llevaba abierta desde el
> 31 de julio.

⚠️ **Si algún día el lote va al 20 % o al 30 %, las columnas de consenso y recomendación
cambian y la de IFRA no.** La de IFRA es la única que no depende de cómo se diluya.

---

## Las tablas

**Cómo leer una fila:** *«pon **X g** de materia pura, que salen de pesar **Y g** del
frasco Z»*. El techo IFRA —en la normativa y en el catálogo— es un muro, no un objetivo:
la recomendación suele estar **muy por debajo**, y eso es lo normal.

### SALIDA  *(8)*

| Material | Poder | Consenso | **Recomendado** | Del frasco |
|---|---|---|---|---|
| **Bergamota sin bergaptenos** | medio-alto | 3–10 % | **0,1250 g** | 0,125 g del puro |
| **Dihydromyrcenol** | alto | 1–10 % · proveedor hasta 75 % | **0,0750 g** | 0,750 g del 10 % DPG (kit) |
| **Lavanda** | alto | 1–10 % | **0,0750 g** | 0,075 g del puro |
| **Limon** | medio-alto | 2–10 % | **0,1000 g** | 0,100 g del puro |
| **Linalol** | medio | 1–20 % | **0,1250 g** | 0,250 g del 50 % DPG |
| **Mandarina** | medio | 1–10 % | **0,1000 g** | 0,100 g del puro |
| **Methyl Pamplemousse** | muy alto | 0,1–1 % · proveedor 0,1–10 % | **0,0075 g** | 0,075 g del 10 % DPG (kit) |
| **Naranja dulce** | medio-bajo | 2–15 % | **0,1250 g** | 0,125 g del puro |

### SALIDA–CORAZON  *(5)*

| Material | Poder | Consenso | **Recomendado** | Del frasco |
|---|---|---|---|---|
| **Acetato de bencilo** | medio-alto | 1–10 % | **0,0750 g** | 0,075 g del puro |
| **Allyl Amyl Glycolate** | EXTREMO | 0,01–0,5 % · proveedor hasta 1 % | **0,0013 g** | 0,125 g del 1 % DPG (tanda 3) |
| **Cilantro** | medio | 0,5–3 % | **0,0250 g** | 0,025 g del puro |
| **Litsea Cubeba** | alto | 0,5–5 % | **0,0375 g** | 0,037 g del puro |
| **Salvia Officinalis** | alto | 0,1–1 % | **0,0075 g** | 0,007 g del puro |

### CORAZON  *(10)*

| Material | Poder | Consenso | **Recomendado** | Del frasco |
|---|---|---|---|---|
| **Alcohol Feniletilico** | bajo (material de bloque) | 1–20 % | **0,1250 g** | 0,125 g del puro |
| **Aldehido alfa-amil cinamico** | medio | 1–10 % | **0,0750 g** | 0,075 g del puro |
| **Diphenyl Oxide** | muy alto | 0,1–1 % · proveedor 0,02–0,80 % | **0,0125 g** | 0,013 g del puro |
| **Eugenol 98 %** | alto | 0,1–2 % | **0,0125 g** | 0,124 g del 10,11 % DPG |
| **Florosa** | medio-alto | 1–10 % · proveedor 0,50–6,00 % | **0,0750 g** | 0,075 g del puro |
| **Geraniol 98 %** | medio | 1–10 % | **0,0500 g** | 0,050 g del puro |
| **Hedione** | bajo (material de bloque) | 5–30 % · proveedor hasta 50 % | **0,2500 g** | 0,250 g del puro |
| **Mayol** | medio | 1–10 % · proveedor hasta 20 % | **0,0750 g** | 0,075 g del puro |
| **Safraleine** | muy alto | 0,1–1 % · proveedor 0,20–3,00 % | **0,0075 g** | 0,074 g del 10,13 % DPG |
| **Stemone** | muy alto | 0,1–1 % · proveedor 0,1–5 % | **0,0075 g** | 0,075 g del 10 % DPG (kit) |

### CORAZON–FONDO  *(6)*

| Material | Poder | Consenso | **Recomendado** | Del frasco |
|---|---|---|---|---|
| **Aldehido C14 (gamma-undecalactona)** | alto | 0,1–1 % | **0,0075 g** | 0,075 g del 10 % DPG (tanda 4) |
| **Aldehido C18 (gamma-nonalactona)** | alto | 0,05–0,5 % | **0,0050 g** | 0,050 g del 10 % DPG (tanda 4) |
| **Etil-4-fenol** | EXTREMO | 0,001–0,05 % | **0,0003 g** | 0,023 g del 1,09 % DPG |
| **Ionona Alpha** | medio-alto | 0,5–5 % · proveedor hasta 15 % | **0,0500 g** | 0,500 g del 10 % alcohol (kit) |
| **Metil ionona gamma** | medio | 1–10 % | **0,0750 g** | 0,075 g del puro |
| **Vertenex (PTBCHA)** | medio | 1–10 % · proveedor hasta 20 % | **0,0750 g** | 0,075 g del puro |

### FONDO  *(25)*

| Material | Poder | Consenso | **Recomendado** | Del frasco |
|---|---|---|---|---|
| **Absoluto de Tabaco** | alto | 0,1–1 % | **0,0050 g** | 0,050 g del 10 % DPG (kit) |
| **Absoluto de trufa** | sin medir | sin consenso publicado | **0,0050 g** | 0,005 g del puro (catar antes) |
| **Aceite de cade (enebro)** | EXTREMO | 0,01–0,5 % · proveedor 0,001–0,03 % | **0,0013 g** | 0,116 g del 1,08 % DPG |
| **Ambar gris (tintura)** | bajo (es una tintura) | 1–5 % de la tintura | **0,0750 g** | 0,075 g del tintura tal cual |
| **Ambermor** | alto | 0,5–3 % · proveedor 0,10–2,50 % | **0,0250 g** | 0,500 g del 5,00 % alcohol |
| **Cashmeran** | alto | 0,1–7 % (hasta 20 % en nicho) | **0,0250 g** | 0,050 g del 50 % DPG |
| **Castoreum (producto al 20 %)** | muy alto | 0,1–1 % del producto · proveedor trazas–0,50 % | **0,0025 g** | 0,050 g del 5 % (revisado, ver abajo) |
| **Cedro Atlas** | medio | 1–10 % | **0,0750 g** | 0,075 g del puro |
| **Cumarina natural** | medio-alto | 0,5–3 % | **0,0375 g** | 0,417 g del 9,00 % alcohol · o el polvo |
| **Dartanol** | alto | 0,5–5 % · proveedor 1,00–8,00 % | **0,0500 g** | 0,050 g del puro |
| **Ebanol** | muy alto | 0,5–1 % | **0,0125 g** | 0,124 g del 10,05 % DPG |
| **Ethyl Maltol** | muy alto | 0,05–1 % | **0,0050 g** | 0,100 g del 4,99 % DPG |
| **Ethylene Brassylate** | medio-bajo (bloque) | 0,5–3 % · proveedor hasta 10 % | **0,0750 g** | 0,150 g del 50 % DPG |
| **Galaxolide** | bajo-medio (bloque) | 2–10 % (hasta 30 %) | **0,1250 g** | 0,250 g del 50 % DPG |
| **Haba tonka (tintura)** | bajo (es una tintura) | 1–5 % de la tintura | **0,0750 g** | 0,075 g del tintura tal cual |
| **Iso E Super** | bajo (anosmia parcial frecuente) | 5–30 % | **0,2500 g** | 0,250 g del puro |
| **Isobutil Quinoleina (producto al 40 %)** | EXTREMO | 0,1–1 % de IBQ puro · proveedor 0,01–0,30 % | **0,0075 g** | 0,019 g del 40 % DPG · y un 5 % (ver abajo) |
| **Laudano de jara** | muy alto | 0,1–1 % (hasta 2 %) | **0,0125 g** | 0,064 g del 19,60 % alcohol |
| **Patchouli** | alto | 1–10 % | **0,0500 g** | 0,050 g del puro |
| **Polysantol** | muy alto | 1–4 % · proveedor hasta 2 % | **0,0250 g** | 0,250 g del 10 % DPG (kit) |
| **Resinoide Benjui** | medio | 1–5 % | **0,0500 g** | 0,100 g del 50 % DPG |
| **Resinoide Estyrax (estoraque)** | alto | 0,5–3 % | **0,0250 g** | 0,250 g del 10 % DPG (kit) |
| **Sandalmysore Core** | alto | 1–5 % | **0,0500 g** | 0,100 g del 50 % DPG |
| **Vainillina** | alto | 0,5–3 % (hasta 10 % gourmand) | **0,0250 g** | 0,125 g del 20,00 % alcohol · o el polvo |
| **Vetiver** | alto | 1–5 % | **0,0500 g** | 0,500 g del 10 % DPG (kit) |

---

# ⚖️ Los once techos IFRA reales — **vacíos 11 y 58 cerrados**

**Hasta hoy el repositorio sabía qué materiales tenían estándar pero no con qué número.**
El índice oficial dice el *tipo* de estándar y no publica porcentajes; los porcentajes
están en el PDF de cada estándar individual.

**Se han descargado los 216 estándares de la 51ª enmienda, se ha extraído su texto y se
ha buscado cada CAS de la paleta dentro.** La tabla de techos que salió de ahí vive ahora
en un solo sitio, la **[normativa](https://github.com/smortenax/perfumeria-lab/blob/9949c5fae215667eebbe460148311164aedd8ca3/conocimiento/normativa/README.md)**, con el PDF de
cada estándar. Aquí queda lo que cambió al tenerlos.

## 🎯 Tres lecturas que cambian cosas

**1. La ambigüedad amil/hexil resulta inofensiva** *(vacío 51)*. No se sabe cuál de los
dos está en el frasco, pero **los dos techos son altísimos** —7,0 % y 9,9 %— y el
consenso de uso es 1–10 % del concentrado, o sea **≤0,25 g**, tres veces por debajo del
más severo. ✅ **Se puede formular sin resolver el vacío.** Se adopta el del amil por ser
el conservador.

**2. La metil ionona al 30 % es, en la práctica, ilimitada.** Tenía etiqueta de
«Restricción + Especificación» y daba respeto. **El respeto se lo merece la
especificación —es una cuestión de calidad del lote, no de cantidad—, no el tope.**

**3. Maese Lab es mucho más conservador que IFRA, y ahora se puede medir cuánto.**

| Material | Maese Lab, cat 4 | **IFRA, cat 4** | Factor |
|---|---|---|---|
| **Eugenol** | 0,01–0,30 % | **2,5 %** | **8×** en el extremo alto |
| **Cashmeran** | 0,50–5,00 % | **3,8 %** | ⚠️ **Maese permite más** |
| **Geraniol** | 0,50–5,00 % | **4,7 %** | ⚠️ **Maese permite más** |

🔴 **Y esto invierte el criterio que se venía usando.** *«Sigue las reglas del proveedor
y la reputación queda cubierta»* funcionaba mientras el proveedor fuese siempre el más
estricto. **En Cashmeran y geraniol no lo es:** el extremo alto de su rango de diseño
(5,00 %) **se pasa del techo IFRA** (3,8 % y 4,7 %).

> ✅ **Regla nueva: manda el menor de los dos.** El rango del proveedor es una
> recomendación de diseño; **el techo IFRA es el que tiene consecuencias.**

---

# 🔴 El único material donde el consenso se pasa de IFRA: el estoraque

**Es el techo más bajo de toda la paleta: 0,64 % de producto terminado = 0,064 g en un
lote de 10 g.** Y el consenso de uso para un resinoide de estoraque es **0,5–3 % del
concentrado**.

| Uso | g de materia | % del producto | ¿Cabe? |
|---|---|---|---|
| 0,5 % del concentrado | 0,0125 g | 0,125 % | ✅ |
| **1 % — recomendado** | **0,025 g** | 0,25 % | ✅ |
| 2 % del concentrado | 0,050 g | 0,50 % | ✅ justo |
| 🔴 **3 % del concentrado** | 0,075 g | **0,75 %** | 🔴 **se pasa** |

🎯 **En los otros 53 materiales el consenso va por debajo del techo con holgura. En el
estoraque se cruzan.** Es exactamente el caso que la futura función de aviso de la app
tiene que detectar: **no basta con avisar cuando te acercas al techo, hay que avisar
cuando una dosis perfectamente normal en el oficio ya lo cruza.**

⚠️ Sigue abierto el **vacío 57**: si el resinoide es la forma rectificada. La prohibición
del STD 078 recae sobre **la goma cruda**; el resinoide está expresamente permitido, y
por eso tiene un número de categoría 4 en vez de un «no».

---

# 🔧 Dos correcciones a la tanda 3, antes de prepararla

**Los frascos al 1 % de castoreum y de IBQ estaban mal dimensionados**, y lo revela el
propio principio del arrastre absoluto.

## Castoreum — **5 %, no 1 %**

Dosis de partida: **0,1 % del concentrado del producto al 20 % = 0,0025 g.**

| Frasco | Solución a pesar | **DPG que arrastra** |
|---|---|---|
| El 20 % que ya hay | 0,0125 g | 🔴 por debajo del suelo de pesada |
| 🔴 **Al 1 %** | **0,250 g** | 🔴 **0,248 g — un tercio del presupuesto entero de `F-001-v1`** |
| ✅ **Al 5 %** | **0,050 g** | **0,048 g** |

**Y hay un segundo motivo, más prosaico: solo hay 1 ml de castoreum en todo el
laboratorio.** El frasco al 1 % iba a ser de 2 g, que a 0,250 g por uso dan **ocho usos**.
Al 5 %, **cuarenta**.

> **Receta revisada: 0,100 g del 20 % + 1,900 g de DPG = 2,000 g al 5,00 %.**
> *(Los mismos gramos, la misma operación — cambia solo la etiqueta y lo que significa.)*

⚠️ **Ojo con la base**: este frasco es el **5 % del producto del proveedor**, que ya viene
al 20 %. En absoluto de castoreum es un **1 %**. La etiqueta debe decirlo.

## IBQ — **un 5 %, no un 1 %**

**El IBQ es de los extremos de la paleta** —*«mi archienemigo»*, dice el hilo de
Basenotes que más lo discute— y se usa a **0,1–1 % de IBQ puro** sobre el concentrado.

| Uso | IBQ puro | Del frasco al 40 % | Del 1 % | Del **5 %** |
|---|---|---|---|---|
| 0,05 % *(traza)* | 0,00125 g | 🔴 0,003 g | 0,313 g 🔴 | ✅ **0,063 g** |
| **0,3 % — recomendado** | 0,0075 g | ✅ **0,019 g** | 0,750 g 🔴🔴 | 0,375 g 🔴 |

🎯 **La pareja que cubre todo el rango es 40 % + 5 %, no 40 % + 1 %.** El 40 % sirve para
el uso normal —0,019 g, justo en el suelo de la báscula— y el 5 % para la traza. **El 1 %
no servía para nada: en traza mete un tercio de gramo de DPG y en uso normal, tres
cuartos.**

> **Receta revisada: 0,250 g del 40 % + 1,750 g de DPG = 2,000 g al 5,00 % de IBQ.**

### 🔧 Corrección de la etiqueta — 2026-09-23, el mismo día

**La receta estaba bien y la etiqueta mal.** Se escribió *«2,000 g al 5,00 % del
producto (= 2 % de IBQ puro)»*. **Los dos números eran falsos:** 0,250 g sobre 2,000 g
es el **12,5 % del producto del proveedor**, y la materia real es 0,250 × 0,40 = 0,100 g,
o sea **5,00 % de IBQ**.

🔴 **Es el error de base de la regla 1.1, cometido en el párrafo siguiente a enunciarla.**
Prueba de que la regla no sobra: **el que sabe que hay tres bases también se equivoca de
base.** Lo que no falla es escribir la cuenta.

> ✅ **Convención que se adopta a partir de aquí: los frascos se etiquetan por MATERIA
> PURA, siempre.** `IBQ 5 %` es 5 % de IBQ. `Castoreum 1 %` es 1 % de absoluto. **Nunca
> «5 % del producto del proveedor»**, que es un número que solo significa algo si además
> recuerdas a qué venía diluido el bote.
>
> 🎯 **Es la misma decisión que la de la app** —la fórmula es la materia, no el frasco—
> aplicada a la etiqueta física.

⚠️ **Y eso renombra el frasco del castoreum**: la receta `0,100 g del 20 % + 1,900 g de
DPG` no es *«al 5 %»* sino **al 1 % de absoluto**. **Mismos gramos, misma operación,
etiqueta correcta.**

✅ **El AAG al 1 % sí se mantiene**, y por contraste se ve por qué. En `F-001-v1` el AAG
iba a **0,0021 g — el 0,086 % del concentrado— y dominó la fórmula entera.** El uso útil
está *por debajo* de eso: 0,01–0,05 %, o sea **0,00025–0,00125 g de materia**. Desde el
frasco al 10 % serían 0,0025–0,0125 g, **por debajo del suelo de pesada**. Desde el 1 %,
**0,025–0,125 g**. 🎯 **El 1 % es el único frasco con el que ese material es dosificable.**

---

# ✅ Cotejo contra `F-001-v1` — la primera auditoría real de la fórmula

**Ahora que hay techos con número, se puede hacer la pregunta que la app hará sola.**

## IFRA: los cinco materiales restringidos que contiene, y los cinco pasan

| Material | % del producto | **Techo cat 4** | Margen |
|---|---|---|---|
| Iso E Super | 4,25 % | 20 % | ✅ ×4,7 |
| Cashmeran | 0,63 % | 3,8 % | ✅ ×6,0 |
| Polysantol | 0,27 % | 1,1 % | ✅ ×4,1 |
| Mayol | 0,18 % | 4,7 % | ✅ ×26 |
| Resinoide de estoraque | 0,046 % | 0,64 % | ✅ ×14 |

> 🎯 **`F-001-v1` cumple IFRA categoría 4 en todo lo que lleva.** Es la primera vez que
> el repositorio puede afirmarlo con números en vez de con la ausencia de alarma.

## Consenso: ahí sí hay dos cosas que mirar

| Material | % del concentrado | Consenso | |
|---|---|---|---|
| 🔴 **Diphenyl Oxide** | **14,7 %** | 0,1–1 % | **≈15× por encima** |
| 🔴 **Dartanol** | **17,0 %** | 0,5–5 % | **≈3,4× por encima** |
| ⚠️ Florosa | 10,9 % | 1–10 % | justo por encima |
| ⚠️ Ebanol | 1,63 % | 0,5–1 % | algo alto |
| Hedione | 25,2 % | 5–30 % | ✅ alto y normal |
| Iso E Super | 15,2 % | 5–30 % | ✅ |
| AAG | 0,086 % | 0,01–0,5 % | ✅ **dentro del rango, y dominó** |

⚠️ **Esto no es un error: el Diphenyl Oxide y el Cashmeran son el núcleo declarado del
brief.** Una fórmula construida *alrededor* de un material lo lleva por encima del
consenso por definición — el consenso describe el uso como modificador.

🎯 **Lo que sí dice el número es cuánto se está saliendo del uso normal, que es
información que no se tenía.** Y explica una observación del diario sin necesidad de
otra hipótesis: **con el Diphenyl Oxide a quince veces el uso habitual, que tape cosas no
es un misterio.**

🎯 **Y el AAG cierra el círculo al revés:** iba **dentro** del consenso y aun así dominó.
**El consenso no es un seguro** — es dónde se mueve la gente, no dónde deja de notarse.

---

# 🔴 El arrastre de los frascos del kit, cuando el material es de bloque

**El principio del arrastre absoluto tiene una consecuencia que hasta ahora no se había
mirado: los frascos al 10 % que vinieron del kit son un problema para los materiales que
se usan en cantidad.**

| Material | Uso recomendado | Del 10 % | **DPG arrastrado** |
|---|---|---|---|
| 🔴 **Dihydromyrcenol** | 3 % → 0,075 g | 0,750 g | 🔴 **0,675 g** |
| 🔴 **Vetiver** | 2 % → 0,050 g | 0,500 g | 🔴 **0,450 g** |
| **Polysantol** | 1 % → 0,025 g | 0,250 g | 0,225 g |
| **Estoraque** | 1 % → 0,025 g | 0,250 g | 0,225 g |

**Referencia:** `F-001-v1` acumuló **0,725 g de DPG entre veinticuatro materiales.**

🎯 **Un solo dihydromyrcenol usado como material de salida lo consume entero.** Y no es
un material potente: es un fresco de bloque, de los que se ponen a cucharadas.

✅ **Qué hacer**, por orden de preferencia:

1. **Comprarlos puros.** Son baratos y es la solución de fondo — el dihydromyrcenol y el
   vetiver no necesitan dilución para nada.
2. **Decidir el DPG a propósito.** Si la fórmula quiere fijación, 0,675 g de DPG en 10 g
   es un 6,75 % perfectamente defendible — **siempre que esté escrito en la fórmula**.
3. **Aceptarlo en exploración y no en la versión buena.**

> ⚠️ **La ionona alpha al 10 % está en alcohol, no en DPG, y por eso no entra en esta
> tabla.** Arrastra 0,45 g de alcohol en la dosis recomendada — y el alcohol también es
> una decisión, pero se evapora.

---

---

# 🎯 ¿Son un peligro real los rojos? No — y eso mueve el peligro de sitio

**Objeción del usuario, y es correcta:**

> *«incluso los que están en rojo no son peligro real, todos son manejables con la
> precisión que tengo y las reducciones que se manejan; simplemente hay unos que la orden
> es de 2 a 4 gotas del material al 10 % en el lote de 10 g»*

## La regla de las 2–4 gotas es exacta, y se puede poner el número

Con la gota medida —**19,3 mg en DPG**, 28 gotas de Ebanol para 540 mg:

| | g de solución | g de materia | % del producto | % del concentrado |
|---|---|---|---|---|
| **2 gotas del 10 %** | 0,039 g | 0,0039 g | **0,039 %** | 0,15 % |
| **4 gotas del 10 %** | 0,077 g | 0,0077 g | **0,077 %** | 0,31 % |

🎯 **El techo más bajo de toda la paleta es el estoraque, 0,64 % del producto. Cuatro
gotas de un frasco al 10 % están ocho veces por debajo de él.** Y el estoraque es el
peor caso: contra el eugenol el margen es de ×32.

**Dicho en gotas, que es como se maneja:** para tocar el techo harían falta **33 gotas**
de estoraque al 10 %, **57** de Polysantol, **128** de eugenol. **Nadie echa 128 gotas de
nada por descuido.**

✅ **Y la regla describe bien una familia entera.** Los frascos al 10 % en DPG son,
todos, territorio de 2 a 4 gotas: **Safraleine · Stemone · Ebanol · aldehído C14 ·
aldehído C18 · absoluto de tabaco** *(y el ethyl maltol al 5 %, que son 5)*.

## 🔧 Pero la regla tiene dos bordes, y conviene saber dónde están

### Borde 1 — **los frascos en alcohol no son territorio de gotas**

Dos motivos que se suman: **están menos concentrados** y **la gota es más pequeña**
(≈12,5 mg frente a 19,3, por tensión superficial — *pendiente de medir*).

| Frasco | Dosis recomendada | En gotas |
|---|---|---|
| Jara 19,60 % | 0,0125 g de materia | ✅ 5 gotas |
| Vainillina 20 % | 0,025 g | ✅ 10 gotas |
| 🔴 **Cumarina 9 %** | 0,0375 g | **33 gotas** |
| 🔴 **Ambermor 5 %** | 0,025 g | **40 gotas** |

**A partir de unas quince gotas contar deja de ser un método**: es lento, y el error de
conteo crece con el número. **Ahí se pesa.** 🎯 *(Y es otra forma de llegar al principio
de los sólidos: la cumarina en polvo existe precisamente para esto.)*

### Borde 2 — 🔴 **el margen se cierra donde se deja de usar la gota**

**Margen = techo IFRA ÷ dosis recomendada.**

| Material | Techo en 10 g | Dosis | **Margen** | |
|---|---|---|---|---|
| 🔴 **Limón** *(puro)* | 0,200 g | 0,100 g | **×2,0** | ~10 gotas del material puro |
| 🔴 **Estoraque** | 0,064 g | 0,025 g | **×2,6** | y el consenso lo cruza |
| 🔴 **Cumarina** *(polvo)* | 0,150 g | 0,0375 g | ×4,0 | **×1,0 si se usa de bloque fougère** |
| 🔴 **Polysantol** | 0,110 g | 0,025 g | ×4,4 | **×1,1 en el alto del consenso** |
| Mayol | 0,470 g | 0,075 g | ×6,3 | |
| Iso E Super | 2,000 g | 0,250 g | ×8,0 | |
| Geraniol | 0,470 g | 0,050 g | ×9,4 | |
| Cashmeran | 0,380 g | 0,025 g | ×15 | |
| Eugenol | 0,250 g | 0,0125 g | ×20 | |
| Metil ionona | 3,000 g | 0,075 g | ×40 | |

## 🎯 La inversión: el peligro no está en los potentes

**Tres de los cuatro márgenes estrechos son materiales que se usan en masa, no en
gotas** — el limón, la cumarina de bloque y, si se apura el rango, el Polysantol.

> **Los potentes son seguros *porque* son potentes.** Echar 33 gotas de estoraque no pasa
> por descuido: **olería mal muchísimo antes de ser ilegal.** El techo olfativo llega
> primero y hace de freno.
>
> 🔴 **Donde no hay freno es en los materiales suaves**, los que se ponen a cucharadas
> porque no molestan. **Ahí la nariz no avisa, y el único aviso es la báscula.**

⚠️ **Y el limón es el caso puro de eso, por partida doble:** margen de ×2, y su
restricción **no es olfativa sino fototóxica**. **No hay ninguna señal sensorial de que
te has pasado** — el perfume huele igual de bien con 0,10 g que con 0,25 g. Es el único
material de la paleta donde equivocarse es literalmente invisible.

## ⚠️ Lo único que no se compone: el presupuesto de HAP

**Cada techo porcentual es por material y se evalúa por separado.** Hay una excepción, y
está en casa: el límite de **HAP ≤1 ppb del cade es acumulativo** con el birch tar, el
opoponax y el estoraque. 🎯 **Ahí «cada uno va bien» no basta: van al mismo presupuesto.**
Con cade y estoraque los dos en la paleta, es el único sitio donde hay que sumar.

---

> ## ✅ En resumen, y la conclusión es la del usuario
>
> **Con las diluciones hechas, la báscula de 1 mg y el gotero de 19,3 mg, ningún material
> de esta paleta se acerca a su techo IFRA en un uso normal.** La regla de las 2–4 gotas
> del frasco al 10 % deja un factor de ocho contra el peor caso.
>
> **Lo que este documento sirve no es para tener miedo: es para saber dónde mirar cuando
> el margen se estrecha** — y resultan ser cuatro casos, ninguno de ellos de los
> materiales que dan respeto.

## Confianza, honestamente

| Columna | Confianza | Por qué |
|---|---|---|
| **IFRA cat 4** *(en la normativa)* | 🟢 **alta** | PDF del estándar, fuente primaria, extraído y verificado |
| **Poder olfativo** | 🟡 media | Clases cualitativas; **faltan umbrales medidos** — vacío 49 |
| **Consenso** | 🟡 media | Foros, fichas técnicas y fórmulas publicadas. **No es una fuente, son varias, y no coinciden del todo** |
| **Recomendación** | 🟡 media | Criterio de este repositorio cruzando las tres |

🔴 **Las cuatro filas de confianza baja** —cilantro, salvia, absoluto de trufa, y las dos
tinturas— **no tienen consenso publicado que merezca ese nombre**. Ahí la recomendación
es un punto de partida prudente, no un dato.

⚠️ **El absoluto de trufa no se puede evaluar en absoluto**: es una esencia compuesta de
composición desconocida (vacío 48). **Se cata y se decide, no hay número que traer.**
