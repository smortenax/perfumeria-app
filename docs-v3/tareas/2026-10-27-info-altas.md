# Tarea · La información clave que falta de los botes del 2026-10-26

*Abierta el 2026-10-27, a petición del usuario: «con una tarea vinculada de buscar la info que falte para
los que no se tiene informacion clave». Va con las tandas 23 (los 20 materiales en lo común) y 24 (tus
versiones y los 23 frascos). Lo que se encuentre entra por otra tanda, citado (documento, página, frase).*

## Qué es «información clave»

Lo que hace falta para decidir **cuánto se puede usar** y **a qué dilución** (el criterio de la
conversación del 2026-10-26: lo que se usa en una fórmula de 1-2 g, a 20 mg por gota):

1. **IFRA**: el límite en categoría 4, o los constituyentes que lo marcan. La app lo calcula por el CAS
   (capa de IFRA) y por el anexo; un producto sin CAS solo lo tiene por su certificado.
2. **Alérgenos y constituyentes**: la declaración de alérgenos de la UE o la SDS del fabricante.
3. **Uso habitual**: mínimo, mediana y máximo en el concentrado, con su fuente.
4. **Identidad**: que el producto sea lo que dice la ficha (CAS, casa, código).

## Dónde se busca

- **Documentos del fabricante o la tienda** (certificado IFRA, alérgenos, SDS, TDS): el usuario los descarga
  de Perfumiarz y de Maese Lab y los deja en el laboratorio. Son lo único que da 1 y 2 de las bases.
- **Web**, para 3 y 4: Fraterworks (estadística de uso), TGSC, la casa (IFF, Givaudan, Firmenich, Symrise).
- **Cifras de IFRA**: solo de los archivos de IFRA (P37); un número de una tienda es una pista, no un límite.

## Lo que se encontró y lo que falta (2026-10-27, tanda 27, sin aprobar)

Búsqueda en la web (cuatro subagentes, de uno en uno; sus filas, con URL, frase y confianza, en
`migracion-v3/web/info-altas-26-oct/parte-1..4.csv`) y en el laboratorio (solo lectura). Lo que la
sesión releyó ella misma está en `verificado.csv`; solo eso entra en los datos, por la **tanda 27**
(`migracion-v3/tandas/27-info-altas/`). **IFRA:** solo de los archivos de IFRA (`v3/datos/ifra_*.csv`),
por el CAS; las cifras de las tiendas van como **pista**, nunca como límite.

**No se pudo leer desde este entorno:** perfumiarz.pl, thegoodscentscompany.com, studio.dsm-firmenich.com,
firmenich.com, www.iff.com, chemical.kao.com, premierepeau.com, eng.hekserij.nl y scent.vn (no resuelven), y
los PDF enlazados de las tiendas (no se abrieron). Por eso faltan los documentos de Perfumiarz y casi
todo lo de las casas. Las frases que un subagente solo tenía resumidas están marcadas «(resumen, no
literal)» en sus filas y **no entran en los datos**.

| Material | IFRA (archivos de IFRA; pista de tienda aparte) | Alérgenos / constituyentes | Uso habitual (% del concentrado) | Identidad |
|---|---|---|---|---|
| Prunella (Firmenich 975617) | sin CAS: solo por certificado. Pista: Fraterworks, «No restriction» en cat. 4 | **faltan**; Fraterworks: «Built around an overdose of phenoxyethyl isobutyrate» (sin %) | Fraterworks: mediana 0,8, máx. 4 (ya en la tanda 23 con máx. 1,5: **revisar**) | Firmenich 975617 (Fraterworks) |
| Shangralide (IFF, Oliffac 0712) | sin CAS. Pista: Fraterworks, IFRA 51 «Coming Soon» | Scentspiracy: ≈ 55 % de HHCB (Galaxolide) en DPG, **sin verificar** | TGSC: hasta 5 % (no se pudo releer); Fraterworks: sin estadística | «Oliffac 0712» solo aparece en el nombre de la SDS de IFF (2020): **no es un código de producto confirmado** |
| Orris Givco 204/2/20 (Givaudan) | sin CAS. Pistas que no coinciden: 25,7 % (IFRA 49, Fraterworks) y 40,08 % (IFRA 51, The Fragrance Foundry) | **faltan**: solo el aviso «May cause an allergic skin reaction» | **mín. 0,8 · mediana 1 · máx. 1,8 (Fraterworks, entra)** | Fraterworks lo llama «204/20»; The Fragrance Foundry, «204/2/20» |
| Ambrarome (Synarome) | sin CAS. Pista: Fraterworks, 5 % en cat. 4 (IFRA 51) | **faltan**; Fraterworks: «labdanum gum extract ethyl ester» | Fraterworks hoy: mediana 0,05, máx. 50 → **conflicto** con la tanda 23 (mediana 0,438) | **No es una molécula**: «ethyl-esterification product derived from the resin extract of the labdanum» (Fraterworks). Fraterworks lo vende al 50 % en **TEC**; la dilución en DPG de Perfumiarz no se pudo comprobar |
| Auranone (Perfumiarz) | sin CAS: solo por certificado. Pista: el certificado IFRA 51 de **Perfumer's Apprentice** (laboratorio) da 49,60 % en cat. 4 | **del certificado de PA (otro proveedor), entra como literatura:** 4-(4-hidroxifenil)butan-2-ona 0,15 %, ciclopentadecanolida 4,838 %, metil ionona 0,198 % | **falta** (Fraterworks no lo tiene) | Firmenich 911383, solo por la dirección de su web (no carga) |
| Mirra, aceite esencial | sin estándar por su CAS. Pista: Fraterworks, 40 % en cat. 4 | **11 constituyentes de la tabla de Fraterworks (análisis publicados, no tu lote), entran como literatura**; alérgenos del bote de Perfumiarz: **faltan** | **mediana 0,06 · máx. 7 (Fraterworks, entra)** | Fraterworks: C. myrrha, Etiopía (su lote) |
| Luminide (IFF) | sin estándar por su CAS | — (molécula) | solo «hasta 3 %» (IFF, de un resumen); **falta la mediana**: Fraterworks no lo vende | IFF, 1392321-41-3 |
| Clearwood (Firmenich) | sin estándar por su CAS. Pista: Fraterworks, 100 % en cat. 4 | **faltan** (Fraterworks solo enlaza el PDF de alérgenos) | Fraterworks hoy: mediana 0,311, mín. 0,1, máx. 6 → **conflicto** con la tanda 23 (0,15 / 0,2) | biotecnología rica en patchoulol, no aceite de pachulí. CAS 1450625-49-6 (EE. UU. y otros) y 84238-39-1 (UE, China), según Scentspiracy, **sin verificar**; código PE 970953, de un resumen |
| Opopónax, aceite esencial | estándar 70: 0,43 % (por el CAS 8021-36-1). Pista: Fraterworks, «Coming Soon» | **6 constituyentes con CAS de la tabla de Fraterworks (Maradufu, 1982), entran como literatura**; alérgenos del bote: **faltan** (Maese Lab no da documentos) | **mediana 0,07 · máx. 1,5 (Fraterworks, entra)** | Maese Lab: *Commiphora erythraea*, Somalia, CAS 93686-00-1 / 100084-96-6; Fraterworks: var. *glabrescens*, CAS 8021-36-1. Misma especie: el «guidottii» no se confirma |
| Gálbano, aceite esencial | anexo: solo pentadecanolida (no limita). Pista: Fraterworks, 10 % | **7 constituyentes de la tabla de Fraterworks (lote de Persia), entran como literatura**, entre ellos geraniol 1,6 %; alérgenos del bote de Maese Lab: **faltan** | **mín. 0,035 · mediana 0,3 · máx. 1,5 (Fraterworks, entra)** | Maese Lab: *Ferula galbaniflua*, Turquía, CAS 93165-40-3 / 8023-91-4 (sin documentos) |
| Ambreta, tintura | anexo: farnesol, 0,2 % de la tintura (no limita) | **faltan** (Maese Lab no da documentos) | **falta** | Maese Lab: semillas de *Abelmoschus moschatus* en alcohol de 96º, CAS 64-17-5 y 84455-19-6 (de un resumen) |
| Cardamomo verde, tintura | el anexo solo tiene el aceite y el absoluto | **faltan** | **falta** | Maese Lab: vainas de Sri Lanka, alcohol de 80º, CAS 85940-32-5 (de un resumen) |
| Cardamomo villoso, tintura | sin CAS | **faltan** | **falta** | **Maese Lab no tiene ficha de «cardamomo villoso»**; lo más cercano es su «cardamomo negro», *Amomum subulatum*. **Confirmar con el bote o la factura** |
| Ajenjo, aceite esencial | anexo: alfa-tuyona 3 % y beta-tuyona 42 % del aceite (estándar 102) | **faltan**; las cifras de tuyona encontradas son de resúmenes (Sigma-Aldrich, scent.vn) y no entran | **falta** | Fraterworks no vende *A. absinthium* |
| Filbertone (Symrise) | sin estándar por su CAS | — | ya en la tanda 23; Fraterworks hoy da mediana «tr.» y máx. 0,5: **revisar** | qué CAS es el de la marca (81925-81-7 o el del isómero E, 102322-83-8): **sin resolver** |
| Exaltolide Total (Firmenich) | estándar 26: 2,4 % | **lo que lleva «Total» no lo da nadie**; Scentspiracy: pureza en torno al 92 % (de un resumen) | ya en la tanda 23; Fraterworks hoy: mediana 0,895, máx. 22: **revisar** | Firmenich 935985 |
| Polysantol | estándar 211: 1,1 % (Fraterworks da lo mismo) | — | **mín. 0,01 · mediana 0,6 · máx. 54,2 (Fraterworks, entra: la cita que faltaba)** | Firmenich |
| Sandalmysore Core | sin estándar por su CAS | — | la cita sigue faltando: Fraterworks da 404; Kao, de un resumen: 1–15 % | **la casa es Kao, no Givaudan** (de un resumen; chemical.kao.com no carga): **revisar** |

## Los documentos de los fabricantes (2026-10-28, tandas 28 y 29, sin aprobar)

**Perfumiarz publica la SDS, el certificado IFRA y los alérgenos de cada producto** (enlaces en su ficha; el
entorno en la nube los baja con `curl` aunque WebFetch no llegue). Leídos línea a línea a
`migracion-v3/web/info-altas-26-oct/documentos-perfumiarz.csv` (cada fila con su archivo, su página y su
frase) y comprobados por la sesión. Van a **tu versión** de cada material (V3-39), autoridad «producto»:
tanda **28** (de tu cuenta).

| Tu bote (Perfumiarz) | Tope del fabricante, cat. 4 | Alérgenos / constituyentes del documento | Identidad que da el documento |
|---|---|---|---|
| Prunella 975617 | «No Restriction» (IFRA 51; escaneo leído como imagen) | 2 alérgenos (cumarina 0,0100 %…) | Firmenich; código de Perfumiarz W16120 |
| Shangralide Oliffac 0712 | el certificado de IFF no da tabla: conforme con la 51; benzoato de bencilo e hidroxicitronelal < 0,1 % | Galaxolide (hexametilindanopirano) 55 %… | IFF, sales number 30R31963 |
| Orris Givco 204/2/20 | **40,08 %** (IFRA 51, Givaudan, 03-10-2023) | 14 alérgenos y la SDS (beta-ionona 50–70 %…) | Givaudan, sales no. 21000663 |
| Ambrarome 50 % (DPG) | **1,63 %** (certificado de Synarome para «Ambrarome Absolu», ref. 102869; lleva p-cresol 0,3066 %) | 8 alérgenos | Synarome 102869 |
| Auranone | **49,6072 %** (IFRA 51, Firmenich) | metil ionona 0,0020 %, la SDS (oxaciclohexadecenona 7,5–10 %…) | **Firmenich 911383** (ficha técnica y certificado de análisis del lote 63038) |
| Myrrh Oil | «No Restriction» | 9 alérgenos | — |
| Isobutavan | «no safety limits have been established» | vainillina 0,060 % | Givaudan 1465543 |
| Luminide, Filbertone, Para-cresol, Operanide | sin certificado (solo SDS) | — | la SDS de para-cresol es de p-cresol puro de Sigma-Aldrich, no del 10 % en IPM |

**De Maese Lab no hay documentos en su web.** Para sus productos, la tanda **29** (de lo común) lee los que
Fraterworks publica para **su** lote (`documentos-fraterworks.csv`): alérgenos del opopónax (Payan Bertrand) y del
gálbano, la composición de Clearwood (patchoulol 30–40 %…), la pentadecanolida de Exaltolide Total (96,4 %, del
certificado de Firmenich) y el tolueno de Veramoss. Son literatura, no tus botes.

**Los dos conflictos de uso:** la cifra de la tanda 23 se queda y pasa a «en disputa»; entran las de hoy de
Fraterworks y, para Clearwood, un tercer referente (Scentspiracy: «Typical usage levels: Fine fragrance:
1–5%»). Para Ambrarome no se encontró tercer referente (Hekserij, Perfumer's Apprentice, Scentspiracy,
Synarome: no lo dicen). **Corrección:** la tanda 23 sí sacó la dosis de Ambrarome de la misma página
(`/products/ambrarome-absolute`); la nota de la 27 que decía «de /products/ambrarome, que da 404» estaba mal.

## El ajenjo: dos especies distintas (2026-10-28)

El usuario: «el ajenjo de perfumiarz es significativamente diferente del de maese … tiene algo amaderado que
el de maese no tiene y es mucho mas dulce».

- **Perfumiarz, «Wormwood Oil (artemisia absinthium)»:** es «ABSINTHE ESSENCE» de PCW (Grasse), código ABS-1.
  SDS: CAS 8008-93-3, «Artemisia oil (Absinthium oil, Wormwood oil)». Certificado IFRA 51 (14-03-2025):
  «Thujone … 546-80-5 … 60,00000 %», **cat. 4: 2,333333 %**. Alérgenos: beta-cariofileno 10 %, linalol 4 %,
  pineno 2,5 %, limoneno 2 %… El beta-cariofileno puede explicar lo amaderado. Es tu versión actual del ajenjo común.
- **Maese Lab:** la única ficha que da su web al buscar «ajenjo» es el **«Aceite Esencial de Artemisa Annua»**:
  «Parte Utilizada: Hoja», «Origen: ESPAÑA», «INCI: Artemisia Annua Herb Oil», «Nº CAS: 84775-74-6»,
  «Componentes / Quimiotipo: Camphor, 1,8-Cineol, D-Germacrene, a-Humulene», «también conocida como Ajenjo
  Dulce o Chino». **No es la misma especie** (*A. annua*, no *A. absinthium*): la diferencia no es de la parte
  de la planta, sino de la especie. Hay que confirmarlo con la etiqueta o la factura del bote.
- **Cómo está hoy:** el frasco nº 17 de la tanda 24 («Ajenjo AE», al 10 %) cuelga del ajenjo común
  (*A. absinthium*), así que la app le aplica la tuyona (anexo: estándar 102). *A. annua* no está en el
  anexo ni tiene estándar por su CAS en los archivos de IFRA.
- **Decidido por el usuario (2026-10-28), «Por identidad (Recomendada)»:** otra especie, parte, proceso,
  tratamiento o quimiotipo es otro material del glosario; otro proveedor, origen o lote es otra
  especificación tuya; la categoría solo agrupa en el buscador. **Propuesta para `decisiones-v3.md` como
  V3-85** (esta sesión no toca ese archivo).
- **Tanda 30 (común, sin aprobar):** «Artemisa annua (ajenjo dulce), aceite esencial», con lo que dice la
  ficha de Maese Lab citado, en la categoría del ajenjo (que gana «ajenjo dulce» y «artemisa annua» como
  otros nombres); al ajenjo común, una nota para no confundirlos. Se aprueba después de la 29.
- **Tanda 31 (tu cuenta, sin aprobar):** tu especificación de Maese Lab, con «lo tengo», y el frasco nº 17
  movido a ella (misma fila, mismos pesos). **Antes de aprobarla, confirma la etiqueta o la factura.**
- **Tu ajenjo de Perfumiarz** gana en la tanda 28 lo de PCW: tope de 2,333333 % en cat. 4, tuyona 60 % y
  sus alérgenos, con autoridad «producto».

## Para descargar (tú)

**Actualizado el 2026-10-28:** los de Perfumiarz ya están (Perfumiarz los publica). Falta lo de Maese Lab y lo que Perfumiarz no publica (IFRA y alérgenos de Luminide, Filbertone, Para-cresol y Operanide).

Son los únicos documentos que responden a IFRA y a los alérgenos de *tu* bote. Déjalos en el
laboratorio (`materias-primas/_datos/certificados-ifra/`) y otra tanda los lee.

| Tienda | Producto | Documentos |
|---|---|---|
| Perfumiarz | Prunella® 975617 | certificado IFRA 51, alérgenos UE, SDS |
| Perfumiarz | Shangralide Oliffac 0712 | certificado IFRA 51 (si ya existe), alérgenos UE, SDS |
| Perfumiarz | Orris Givco® 204/2/20 | certificado IFRA 51 de Givaudan, alérgenos UE, SDS |
| Perfumiarz | Ambrarome 50% (DPG) | certificado IFRA 51, alérgenos UE, SDS (y que diga si va en DPG o en TEC) |
| Perfumiarz | Auranone | certificado IFRA 51 (el del laboratorio es de Perfumer's Apprentice), alérgenos UE, SDS |
| Perfumiarz | Myrrh Oil | certificado IFRA, alérgenos UE, SDS |
| Perfumiarz | Luminide™ 25% (DPG) | SDS (dilución), IFRA |
| Perfumiarz | Filbertone 1% (TEC) | SDS (dilución y CAS) |
| Perfumiarz | Para Cresol 10% (IPM) | SDS (dilución) |
| Maese Lab | Aceite Esencial de Opoponax / de Gálbano | alérgenos UE y SDS (la web no los da: pedirlos) |
| Maese Lab | Tinturas de ambreta, cardamomo verde y «cardamomo villoso» | composición (% de planta), alérgenos y SDS; y la especie del villoso |
| Maese Lab | Exaltolide Total, Veramoss | SDS y alérgenos (qué lleva «Total») |
| — | Ajenjo, aceite esencial | certificado IFRA o COA con la tuyona |

Si no los dan, Fraterworks publica la SDS, el IFRA 51 y los alérgenos de Prunella, Shangralide, Orris Givco,
Ambrarome, Clearwood, Filbertone y Exaltolide Total: son de *su* lote y servirían de pista.

## Lo que sigue sin cifra (búsqueda del 2026-10-28, `parte-5.csv`; no entra en ninguna tanda)

- **Auranone, uso:** ninguna fuente seria (TGSC, Perfumer's Apprentice, Pell Wall, Scentspiracy, Fraterworks);
  solo un blog (glooshi.com, «hasta 5 %», confianza baja).
- **Luminide, mediana:** no lo dice nadie; IFF «hasta 3 %» solo por el resumen del buscador (su web da 403).
- **Tinturas de ambreta y de cardamomo verde, uso:** TGSC y Fraterworks no dan dosis de la tintura. Como
  referencia de otras formas: el aceite de ambreta «up to 0.5 %» (TGSC es1024691), el aceite de cardamomo
  12 % y el CO2 6 % (TGSC es1618841 y es1052481). No son de la tintura.
- **Exaltolide Total:** nadie nombra lo que lleva además de la pentadecanolida; solo la pureza (Vigon «PURITY
  % 92 - 100»; Scentspiracy «~92%»), que encaja con el 96,4 % del certificado de Firmenich.

## Para pedir a Maese Lab (correo listo para copiar)

> Hola: compré el 26 de octubre los productos de abajo y necesito, de cada uno, la ficha de datos de
> seguridad (SDS), el certificado IFRA (enmienda 51) y la declaración de alérgenos de la UE (Reglamento
> 2023/1545), del lote que me enviasteis:
>
> - Aceite Esencial de Opoponax - 100% natural
> - Aceite Esencial de Gálbano - 100% Natural
> - Aceite Esencial de Artemisa Annua - 100% Natural (¿podéis confirmar que el que me enviasteis es
>   Artemisia annua y no Artemisia absinthium?)
> - Exaltolide Total (y qué lleva además de la pentadecanolida)
> - Veramoss (Evernyl)
> - Clearwood
> - Indol y Etil vainillina
> - Tinturas de ambreta, de cardamomo verde y de cardamomo «villoso» (y, de las tres, la especie, la
>   parte de la planta, el disolvente y el porcentaje de planta)
>
> Muchas gracias.

## Para que lo veas (no se ha hecho nada)

- **Conflictos de uso:** Fraterworks ha cambiado sus estadísticas desde el 26-oct. Ambrarome y Clearwood
  chocan con la tanda 23 (en el informe de la tanda 27); Prunella, Filbertone y Exaltolide Total también
  difieren y no se han releído.
- **Constituyentes de literatura y la app (comprobado leyendo, 2026-10-28):** `v3/src/db/to-ifra.ts` ya trata
  una cifra de literatura o de consenso como no sabida, con su máximo como cota (línea 67): da «acotado»,
  nunca «dentro». Para un mismo CAS manda la fila de más autoridad (lote, producto, IFRA, literatura; línea
  270), así que el certificado de tu bote manda sobre la literatura. Un constituyente sin CAS se guarda
  aparte (`rest`) y no cruza con IFRA. No hace falta tocar la app.
- **Cambios de la app o del esquema:** ninguno hace falta para esta tanda. Una «pista de IFRA» de una
  tienda no tiene sitio en el esquema; aquí queda solo en la tarea.

## Hecho cuando

- Cada fila tiene IFRA, alérgenos y uso con su documento citado, o «no lo dice» con dónde se buscó.
- Lo encontrado entra por una tanda aprobada por el usuario; esta tarea se cierra en `estado.md`.
