# Encargo de lectura web (tanda 60), para un subagente por lote

Lee en la web la ficha de cada material del lote y escribe **un CSV** en
`migracion-v3/web/info-18-nov/web-60-0<LOTE>.csv`, con esta cabecera exacta:

    n,nombre,campo,valor,fuente,nota

Una fila por campo y por referencia. `n` es el número del material en el lote (repítelo en cada fila).
Escribe el archivo **nada más terminar cada material** (añadiendo filas), no al final de todo.

## Qué leer, para cada material

1. **TGSC no**: devuelve 403 a las lecturas automáticas (lote 0, 2026-11-19); no lo intentes.
2. **Dos referencias independientes**, comprobando que el CAS de la página es el del material: Fraterworks (fraterworks.com/products/...), la página de la casa
   (Givaudan, Firmenich, IFF, Symrise, Moellhausen, Robertet, Biolandes, PCW…), Perfumer's Apprentice,
   Scentspiracy o PerfumersWorld. Para una base de una casa (Moellhausen, PCW, Synarome, Robertet), la
   página de la casa o de un distribuidor que copie su ficha.
3. Como mucho tres páginas por material. Si una página no carga, prueba otra; no insistas.

## Campos (columna `campo`)

- `nombre`: el nombre que da la página. En `nota`, «CAS coincide» o «CAS de la página X, no coincide».
- `cas`: solo si el material del lote no tiene CAS (Ambrostar, Orionide, Trisamber, Tropicalia), el
  CAS que da la página.
- `casa`: el fabricante que declara la página.
- `familia`: el tipo de olor de la página («Odor Type: woody», «Olfactive family: Amber»).
- `nivel`: nota de salida, corazón o fondo, si la página lo dice.
- `horas`: duración en tira («400 hours at 100%», «Lasts > 172 hours on a smelling strip»).
- `fuerza`: «Odor Strength: medium», «high», o una escala de la página (8/10).
- `estado`: aspecto («colorless clear liquid», «white crystals»).
- `dosis`: uso recomendado («Up to 5.0000% in the fragrance concentrate»; «use 0.1–2 %»).
- `olor`: la descripción olfativa, literal.
- `tipo`: solo para Tropicalia: si es una molécula, una base (mezcla) o un natural.

## Cómo leer una página para citarla literal

WebFetch devuelve un resumen, no el texto: **no cites lo que devuelve WebFetch**. Úsalo, o WebSearch, solo
para encontrar la URL. Para citar, baja la página con `curl -sL -A "Mozilla/5.0" <url>` y saca su texto
visible con un script (quitando etiquetas), y copia de ahí la frase. Si una web bloquea curl, no la cites:
pasa a otra. En la `nota` no hace falta decir cómo la leíste.

## Reglas (no negociables)

- **La columna `fuente`** es `Sitio, URL: «frase literal copiada de la página»`. La frase entre «» se
  copia tal cual, sin traducir ni resumir. Si no puedes copiar una frase literal, no escribas la fila.
- **Nada se inventa ni se deduce.** Si ninguna página dice un campo, escribe una fila con `valor` vacío
  y `fuente` = «no lo dice ninguna fuente consultada: <páginas leídas>».
- Una página de **otro CAS, otro grado u otra especie** no vale: anótala con valor vacío y nota
  «otro CAS: …» o «otra especie: …». Una página del material **diluido** (10 % en DPG) vale para
  familia, nivel y olor, no para horas, fuerza, dosis ni estado: escribe en `nota` «diluido al X %».
- Un natural se identifica por especie, parte y proceso: el yuzu de este lote es **destilado**; uno de
  presión en frío es otro material (nota «otro proceso»). El olíbano es *Boswellia carterii*.
- No escribas en ningún otro archivo. No hagas commit.
- Al terminar, contesta en 5 líneas: cuántas filas, y qué materiales quedaron sin TGSC.
