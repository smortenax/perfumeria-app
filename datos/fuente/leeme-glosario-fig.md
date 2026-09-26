> 📥 **Copiado del laboratorio** (`conocimiento/lenguaje/fig/README.md`, commit `debf755`) por `scripts/importar_datos.py`. **No se edita aquí**: se corrige en el laboratorio y se vuelve a importar.

# IFRA FIG — el vocabulario oficial del olor

El **IFRA Fragrance Ingredient Glossary (FIG)** es el programa de IFRA que describe el olor
de los ingredientes de perfumería con un vocabulario común. Edición de abril de 2020.

> **Cita obligatoria** en cualquier uso, total o parcial: *«Information derived from the
> IFRA Fragrance Ingredient Glossary, developed by The International Fragrance
> Association»*. Uso sujeto a los términos de ifrafragrance.org/glossary/terms.

| | |
|---|---|
| 📖 **[Descriptores](https://github.com/smortenax/perfumeria-lab/blob/debf755f2ae0b24d55774a07fe7f37f3d2a78211/conocimiento/lenguaje/fig/descriptores.md)** | Los **27 descriptores primarios**, con su definición oficial: *acidic, aldehydic, amber, animal-like…* Es el glosario de términos |
| 📋 **[`glosario-fig.csv`](https://github.com/smortenax/perfumeria-lab/blob/debf755f2ae0b24d55774a07fe7f37f3d2a78211/conocimiento/lenguaje/fig/glosario-fig.csv)** | **3119 ingredientes**: CAS, nombre y tres descriptores (el primario y dos más). La columna `actualizado` marca los que cambiaron respecto a la edición original |

## Para qué sirve aquí

- **Vocabulario para describir**: una red de palabras con definición, para cuando falta el
  nombre de lo que se huele. Es el eje de los [lenguajes del olor](https://github.com/smortenax/perfumeria-lab/blob/debf755f2ae0b24d55774a07fe7f37f3d2a78211/conocimiento/lenguaje/README.md), junto a los de cada autor. Complementa el [lenguaje descriptivo](https://github.com/smortenax/perfumeria-lab/blob/debf755f2ae0b24d55774a07fe7f37f3d2a78211/conocimiento/tecnicas/lenguaje-descriptivo.md)
  y la [rejilla](https://github.com/smortenax/perfumeria-lab/blob/debf755f2ae0b24d55774a07fe7f37f3d2a78211/conocimiento/tecnicas/rejilla-de-evaluacion.md).
- **Cotejo**: los descriptores de cada material de la paleta salen, cruzados por CAS, en el
  [catálogo](https://github.com/smortenax/perfumeria-lab/blob/debf755f2ae0b24d55774a07fe7f37f3d2a78211/vistas/catalogo.md). **48 de los 54 están en el FIG**; faltan
  los que no tienen CAS o no lo registra (trufa, ámbar gris, cilantro, haba tonka, láudano,
  y el cinámico mientras no se sepa cuál es).
- **Para explorar ingredientes que no están en casa**, buscando por descriptor.

🔴 **Nunca antes de catar.** Los descriptores de un material son una etiqueta: leerlos
antes de oler es *priming*, igual que leer la rejilla antes de la apertura. Se consultan
en el cotejo, al cerrar la cata.

⚠️ El FIG **describe, no regula**: que un ingrediente esté aquí no dice nada de sus
límites. Eso está en la [normativa](https://github.com/smortenax/perfumeria-lab/blob/debf755f2ae0b24d55774a07fe7f37f3d2a78211/conocimiento/normativa/README.md).
