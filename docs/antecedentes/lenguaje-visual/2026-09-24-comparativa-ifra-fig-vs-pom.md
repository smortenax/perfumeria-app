---
frente: sin número — Comparativa IFRA FIG (27 descriptores primarios) frente al Principal Odor Map (POM)
fecha: 2026-09-24
herramienta: chat con web (Claude, búsqueda web) + el documento IFRA FIG que aportaste
confianza: baja   # el cruce descriptor a descriptor es deducción mía; los datos sobre el POM son de alta o media
---

# IFRA FIG frente al Principal Odor Map

> **Atribución IFRA (obligatoria según el propio documento):** *Information derived from the IFRA
> Fragrance Ingredient Glossary, developed by The International Fragrance Association.*

## Resumen — lo que cambia para el laboratorio

- **No son cosas del mismo tipo.** El FIG es un vocabulario: 27 definiciones en prosa. El POM es un
  espacio de 256 dimensiones que una red neuronal calcula a partir de la estructura de una molécula
  suelta. Lo comparable con el FIG no es el mapa, sino las **138 etiquetas** con que se entrenó (más
  las **55** que usó el panel humano de validación).
- **Cobertura, según mi cruce (`baja`):** de los 27 primarios del FIG, 23 tienen equivalente directo
  entre las 138 etiquetas, 3 son parciales (*acidic*, *food-like*, *gourmand*) y 1 no tiene
  equivalente (*marine*). Tabla en el Hallazgo 2 y CSV en el anexo.
- **Lo que las 138 etiquetas tienen y el FIG no** afecta a tu eje estético: *leathery*, *phenolic*,
  *coumarinic*, *waxy*, *soapy*, *metallic*, *medicinal*. Ninguno de los dos sistemas tiene un
  descriptor propio para **incienso** ni para **azafrán**; lo más cercano es *balsamic* y *amber*.
- **Enlace con el Frente 3:** «metálico» (P20) y «jabonoso» (P21) son etiquetas del POM y **no**
  descriptores primarios del FIG. Eso explica que no salgan entre los 27.
- **Límites del POM para tu paleta:** solo modela moléculas sueltas (no absolutos, resinoides,
  tinturas ni mezclas), no incluye la concentración (no predice intensidad por encima del umbral) y
  es especialmente flojo con *musk*.
- **Aplicación posible:** el modelo de Osmo no es público, pero existe una réplica abierta
  (OpenPOM). Podría dar probabilidades de etiqueta para los sintéticos de tu paleta a partir de su
  SMILES y compararlas con el descriptor FIG de cada CAS. Es propuesta mía (`baja`).
- **Cuidado con las palabras iguales:** *aldehydic* y *aromatic* pueden tener un centro semántico
  distinto en cada sistema (ver Discrepancias).

## Hallazgos

### 1. Qué es cada sistema

| Dimensión | IFRA FIG (27 primarios) | Principal Odor Map |
|---|---|---|
| Qué es | Lista alfabética de definiciones en prosa (documento aportado, edición de abril de 2020) | Penúltima capa de una red neuronal de grafos (MPNN); 256 dimensiones |
| Unidad | El ingrediente (según tu briefing, 3119 por CAS) | La molécula individual, a partir de su grafo químico |
| Vocabulario | 27 descriptores primarios | 138 etiquetas de entrenamiento (GoodScents + Leffingwell); 55 en el léxico del panel |
| Jerarquía | No visible en el documento aportado | La jerarquía emerge de los datos (p. ej. jazmín y lavanda como subtipos de floral) |
| Origen del dato | Definición del sector (IFRA) | ~5000 moléculas con etiquetas de bases de datos de aromas y sabores; validación con panel entrenado de 15 personas y 400 moléculas nuevas |
| Intensidad y concentración | No se trata | La longitud del vector equivale a detectabilidad; la concentración no está en el mapa |
| Acceso | Público (ifrafragrance.org) | Modelo de Osmo sin API pública; réplica abierta OpenPOM |

- Fuentes: documento IFRA FIG aportado; Lee et al. (2023) y su preprint, ver Fuentes.
  Confianza: `alta` para el POM (artículo revisado por pares y preprint), `alta` para el FIG (es el
  documento que tienes).
- Sobre el acceso: un directorio de herramientas dice que Osmo solo se ofrece mediante su casa de
  fragancias con IA (Osmo Studio), sin API pública (`baja`); en el fragmento de su web oficial que
  vi no aparece una API pública, pero no he revisado la web entera. La réplica abierta y su tutorial
  en DeepChem están en las
  Fuentes. Benchmark de OpenPOM: AUC-ROC de 0,8872 (validación cruzada de 5 particiones, conjunto de
  10 modelos por partición; el AUC-ROC no tiene «base» porcentual).

### 2. Cruce de los 27 descriptores primarios del FIG con las 138 etiquetas GS/LF

Todo este cruce es **deducción mía** (`baja`): lo he hecho comparando la definición del FIG con el
nombre de cada etiqueta, sin acceso a las definiciones de las etiquetas.

| IFRA FIG | Etiquetas GS/LF más cercanas | Cobertura | Nota |
|---|---|---|---|
| ACIDIC | sour, sharp, pungent | parcial | *sour* suena más a gusto; ninguna coincide del todo |
| ALDEHYDIC | aldehydic | directa | Centro semántico por comprobar |
| AMBER | amber | directa | |
| ANIMAL-LIKE | animal | directa | El FIG incluye fecal y almizclado; GS/LF separa además *musk* |
| ANISIC | anisic | directa | |
| AROMATIC | aromatic | directa con reserva | Centro semántico por comprobar |
| BALSAMIC | balsamic | directa | |
| CAMPHORACEOUS | camphoreous | directa | Grafía distinta |
| CITRUS | citrus; lemon, orange, grapefruit, bergamot | directa | El POM añade hijos específicos |
| EARTHY | earthy | directa | |
| FLORAL | floral; rose, jasmin, lily, muguet, hyacinth, violet, geranium, orangeflower, hawthorn | directa | El POM trocea las flores |
| FOOD-LIKE | savory, cooked, roasted, vegetable, meaty, beefy | parcial | El FIG agrupa lo salado; el POM lo separa |
| FRUITY | fruity; apple, apricot, banana, berry, cherry, grape, melon, peach, pear, pineapple, plum, raspberry, strawberry, tropical, juicy, ripe, fruit skin | directa | El FIG excluye los cítricos |
| GOURMAND | caramellic, chocolate, cocoa, coffee, creamy, sweet, vanilla, buttery, milky, dairy, malty, popcorn | parcial | Sin etiqueta propia |
| GREEN | green; grassy, leafy, weedy, cucumber | directa | |
| HERBAL | herbal | directa | |
| HONEY | honey | directa | |
| MARINE | sin equivalente | ninguna | Lo más próximo, *ozone* y *fresh*, no es «orilla del mar» |
| MINTY | mint; cooling | directa | |
| MUSK-LIKE | musk | directa | El POM lo predice peor que ninguna otra etiqueta |
| OZONIC | ozone | directa | Pocas moléculas de entrenamiento |
| POWDERY | powdery | directa | |
| SMOKY | smoky; burnt, phenolic | directa | |
| SPICY | spicy; cinnamon, clove | directa | |
| SULFUROUS | sulfurous; garlic, onion, alliaceous, cabbage | directa | |
| TOBACCO-LIKE | tobacco | directa | |
| WOODY | woody; cedar, sandalwood, vetiver, pine | directa | |

- Las 138 etiquetas las he reconstruido de dos listados de la misma fuente (el preprint del POM y el
  tutorial de DeepChem sobre OpenPOM); suman 138, coherente con la cifra del artículo.
  Confianza en la lista: `alta`.

### 3. Etiquetas de las 138 que el FIG no tiene como primarias

| Grupo | Etiquetas |
|---|---|
| Cuero y fenoles | leathery, phenolic |
| Dulce, cumarínico, lácteo | vanilla, coumarinic, lactonic, ketonic, tea, hay |
| Textura y carácter | waxy, oily, fatty, dry, warm, clean, fresh, natural, soapy, metallic, medicinal |
| Químico o de disolvente | solvent, alcoholic, ethereal, gassy, terpenic |
| Estado o defecto | fermented, musty, mushroom, sweaty, cheesy, fishy, bitter, sour, odorless |
| Otros | cortex, sweet |

- Puntos donde mirar en tu paleta (deducción mía, `baja`): *coumarinic* con la cumarina y la tintura
  de haba tonka; *phenolic* con el etil-4-fenol y el eugenol; *leathery* con la IBQ y el castoreum.
- **Lo que no está en ninguno de los dos sistemas:** incienso, azafrán y resina como descriptores
  propios. Comprobado contra el listado de 138 etiquetas y contra los 27 del FIG.

### 4. Límites del POM que condicionan la comparación

- **Solo moléculas sueltas.** El artículo habla de olores evocados por moléculas individuales.
  Para tus naturales y tinturas (absoluto de tabaco, láudano, estoraque, cade, ámbar gris) no hay
  predicción posible; sí para los sintéticos, si tienes su estructura. `alta` (lo primero) y
  `baja` (la consecuencia para tu paleta, que es mía).
- **La concentración no entra en el mapa.** Predice el umbral de detección, no la intensidad por
  encima del umbral, que depende de la concentración. `alta`.
- **Las etiquetas no rinden igual.** Mejor con las de estructura clara (ajo, pescado); peor con
  *musk*, que agrupa al menos cinco clases estructurales (macrocíclicos, policíclicos, nitro,
  esteroideos y de cadena lineal). Rinde poco con *ozone*, *sharp* y *fermented*, por falta de
  ejemplos. `alta`.
- **Cobertura química.** No hay predicciones fiables para motivos que no estén en el entrenamiento;
  el artículo pone el ejemplo de un almizcle macrocíclico si no hubiera macrociclos. `alta`.
- **Impurezas.** En el control de calidad de 50 estímulos, en 18 el olor lo causaba un contaminante y
  en 16 contribuían el compuesto y contaminantes; en 12 solo el compuesto nominal (base: 50
  estímulos). ⚠️ Es un dato de calidad de materia prima que también te afecta al catar: el olor de un
  producto comprado puede no ser el del compuesto nominal. `alta`.

### 5. Tres maneras de comparar en la práctica (propuestas mías, `baja`)

1. **Semántica, ya hecha** en el Hallazgo 2. Falta verificar las definiciones de las etiquetas GS/LF.
2. **Empírica:** correr OpenPOM sobre los SMILES de los sintéticos de tu paleta, tomar las etiquetas
   más probables y medir cuántas caen en el descriptor primario que el FIG asigna a ese CAS.
3. **Perceptiva:** comparar las etiquetas del POM con tus rejillas de cata a ciegas, y ver dónde
   coinciden la máquina, el FIG y tú.

## Discrepancias

- **Aldehydic.** DISCREPANCIA de posible centro semántico: el FIG lo define como ropa planchada
  limpia, subdivisible en cítrico y ozónico; un léxico de sabores de un laboratorio (no es GS/LF) lo
  define como graso, céreo y verde, con el hexanal como ejemplo. No he podido ver la definición de
  GS/LF, así que no arbitro. `baja`.
- **Aromatic.** DISCREPANCIA de posible centro semántico: el FIG habla de hierbas y especias
  culinarias con carácter difusivo; el mismo léxico de sabores lo define como fragante, frutal, dulce
  y de tipo éster, con el acetato de linalilo como ejemplo. Tampoco he visto la definición de GS/LF. `baja`.
  Léxico: https://flavorchemists.com/wp-content/uploads/2020/06/Lexicon-new-2019.pdf

## No encontrado

- **Las 55 etiquetas exactas del léxico del panel** (Tabla S1 y Data S1 del artículo): NO ENCONTRADO.
  Solo sé que son un subconjunto de las 138, que priorizaron términos amplios como *fruity* y
  *floral* e incluyeron específicos, y que en el análisis por etiqueta aparecen, entre otras, *musk*,
  *hay*, *nutty*, *garlic*, *cheesy*, *fishy*, *camphoreous*, *cooling*, *ozone*, *sharp* y *fermented*.
- **Definiciones de cada etiqueta GS/LF:** NO ENCONTRADO.
- **Un cruce publicado entre el FIG y las etiquetas del POM:** NO ENCONTRADO (no he visto ninguno).
- **Acceso público al modelo de Osmo:** NO ENCONTRADO; solo consta una réplica abierta.

## Preguntas nuevas que han salido

1. ¿Cuáles son las 55 etiquetas del panel y cuántas coinciden con los 27 del FIG?
2. ¿Cómo se define cada etiqueta en GoodScents y en Leffingwell? Sin eso, *aldehydic* y *aromatic*
   siguen en duda.
3. El inventario de datos de Pyrfume incluye un conjunto llamado `arctander_1960` con carácter
   olfativo humano (https://github.com/pyrfume/pyrfume-data, `media`). Si contiene los descriptores
   de Arctander por material, podría servir para P8 a P10 del Frente 3 y para tu glosario. ¿Qué
   contiene exactamente?
4. ¿Tus 153 términos de 13 sistemas incluyen ya las etiquetas GS/LF, Dravnieks o DREAM? El artículo
   del POM valida contra Dravnieks y DREAM.
5. ¿Tienes los SMILES de los sintéticos de la paleta, o hay que sacarlos por CAS?

## Fuentes

- Lee BK, Mayhew EJ, et al. (2023), *A principal odor map unifies diverse tasks in olfactory
  perception*, Science 381(6661):999-1006, DOI 10.1126/science.ade4401 — https://www.science.org/doi/10.1126/science.ade4401 ; https://pubmed.ncbi.nlm.nih.gov/37651511/
- Preprint del mismo trabajo (contiene el listado de 138 etiquetas y el texto sobre las 55) — https://www.biorxiv.org/content/10.1101/2022.09.01.504602v2.full
- DeepChem, tutorial de OpenPOM con las 138 etiquetas — https://github.com/deepchem/deepchem/blob/master/examples/tutorials/Predict_Multi_Label_Odor_Descriptors_using_OpenPOM.ipynb
- OpenPOM (réplica abierta) — https://github.com/ARY2260/openpom
- Pyrfume-data (inventario de conjuntos) — https://github.com/pyrfume/pyrfume-data
- Osmo, «About» — https://osmo.ai/about
- Directorio de herramientas (acceso comercial a Osmo), `baja` — https://www.ki-syndikat.de/tools/osmo-ai/
- IEEE Spectrum, «Digital smell» — https://spectrum.ieee.org/digital-smell
- Léxico de sabores (FlavorChemists), `baja` para este uso — https://flavorchemists.com/wp-content/uploads/2020/06/Lexicon-new-2019.pdf
- IFRA Fragrance Ingredient Glossary (edición de abril de 2020), documento aportado por el usuario.

## Anexo — cruce en CSV

```csv
ifra_fig,pom_gslf_etiquetas,cobertura,nota
ACIDIC,"sour; sharp; pungent",parcial,"sour suena a gusto"
ALDEHYDIC,aldehydic,directa,"centro semantico por comprobar"
AMBER,amber,directa,
ANIMAL-LIKE,animal,directa,"GS/LF separa ademas musk"
ANISIC,anisic,directa,
AROMATIC,aromatic,directa_con_reserva,"centro semantico por comprobar"
BALSAMIC,balsamic,directa,
CAMPHORACEOUS,camphoreous,directa,"grafia distinta"
CITRUS,"citrus; lemon; orange; grapefruit; bergamot",directa,
EARTHY,earthy,directa,
FLORAL,"floral; rose; jasmin; lily; muguet; hyacinth; violet; geranium; orangeflower; hawthorn",directa,
FOOD-LIKE,"savory; cooked; roasted; vegetable; meaty; beefy",parcial,
FRUITY,"fruity; apple; apricot; banana; berry; cherry; grape; melon; peach; pear; pineapple; plum; raspberry; strawberry; tropical; juicy; ripe; fruit skin",directa,"FIG excluye citricos"
GOURMAND,"caramellic; chocolate; cocoa; coffee; creamy; sweet; vanilla; buttery; milky; dairy; malty; popcorn",parcial,"sin etiqueta propia"
GREEN,"green; grassy; leafy; weedy; cucumber",directa,
HERBAL,herbal,directa,
HONEY,honey,directa,
MARINE,,ninguna,"ozone y fresh no son orilla del mar"
MINTY,"mint; cooling",directa,
MUSK-LIKE,musk,directa,"POM predice musk peor que otras etiquetas"
OZONIC,ozone,directa,"pocos ejemplos de entrenamiento"
POWDERY,powdery,directa,
SMOKY,"smoky; burnt; phenolic",directa,
SPICY,"spicy; cinnamon; clove",directa,
SULFUROUS,"sulfurous; garlic; onion; alliaceous; cabbage",directa,
TOBACCO-LIKE,tobacco,directa,
WOODY,"woody; cedar; sandalwood; vetiver; pine",directa,
```
