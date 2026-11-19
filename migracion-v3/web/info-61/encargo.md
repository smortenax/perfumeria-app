# Encargo de lectura web (tanda 61), para un subagente por lote

Lee en la web lo que falta de cada material del lote y escribe **un CSV** en
`migracion-v3/web/info-61/web-61-<LOTE>.csv` (LOTE de dos cifras: 00, 01…), con esta cabecera exacta:

    n,nombre,campo,valor,fuente,nota

Una fila por campo y por referencia. `n` es el número del material en `lista.csv` (repítelo en cada fila).
Escribe el archivo **nada más terminar cada material** (añadiendo filas), no al final de todo.

## Cómo leer (obligatorio)

- **Para encontrar direcciones**, WebSearch. **Para leer una página, nunca WebFetch** (resume y no deja
  copiar): usa `python3 -I migracion-v3/web/info-61/pagina.py <url>`, que la baja, la guarda en caché y
  imprime su texto; con palabras detrás (`pagina.py <url> dose use median`) imprime solo las líneas que
  las llevan. Copia las frases **de esa salida**, carácter a carácter.
- La consolidación comprueba que cada frase entre «» está en la página guardada: la que no esté, no
  entra. Una frase que en la salida va partida en dos líneas se copia unida con un espacio.
- La URL de la columna `fuente` es exactamente la que pasaste a `pagina.py`.

## Qué leer

La columna `buscar` de `lista.csv` dice qué campos faltan de cada material: lee **solo esos**.

1. **TGSC no**: devuelve 403 a las lecturas automáticas; no lo intentes.
2. Primero la página del producto si `url_producto` la da (Maese Lab, Perfumiarz, Harrison Joseph):
   casa, dosis, olor. Después, **hasta dos referencias independientes**, comprobando que el CAS (o la
   especie, parte y proceso de un natural) es el del material: Fraterworks (fraterworks.com/products/…),
   la página de la casa (Givaudan, Firmenich, IFF, Symrise, Moellhausen, Robertet, Synarome, PCW…),
   Perfumer's Apprentice, Scentspiracy, PerfumersWorld, Premiere Peau, Pell Wall.
3. **Harrison Joseph:** WebSearch no indexa su web. Sus direcciones están en
   `migracion-v3/web/info-61/harrison-joseph-urls.txt` (búscalas con `grep -i`); sus páginas dan el CAS y
   el olor, no la casa, la dosis ni las horas: para eso, las otras referencias, buscando por CAS.
4. Como mucho tres páginas por material. Si una página no carga, prueba otra; no insistas.

## Campos (columna `campo`)

- `cas`, `especie`: lo que da la página para el material.
- `casa`: el fabricante que declara la página (de la molécula o la base, no la tienda).
- `familia`: el tipo de olor («Odor Type: woody», «Olfactive family: Amber»).
- `horas`: duración en tira («400 hours at 100%», «Lasts > 172 hours on a smelling strip»).
- `fuerza`: «Odor Strength: medium», «high», o la escala de la página (8/10).
- `dosis`: uso recomendado u observado, con su base si la frase la da («Up to 5% in the fragrance
  concentrate»; «use 0.1–2 %»; «median of 0.7% of the concentrate»; «0.01 to 0.5 % in the finished
  fragrance»). Copia la frase entera, con la base.
- `olor`: la descripción olfativa, literal.

## Reglas (no negociables)

- **La columna `fuente`** es `Sitio, URL: «frase literal copiada de la página»`. La frase entre «» se
  copia tal cual, sin traducir ni resumir. Si no puedes copiar una frase literal, no escribas la fila.
- **Nada se inventa ni se deduce.** Si ninguna página dice un campo, escribe una fila con `valor` vacío
  y `fuente` = «no lo dice ninguna fuente consultada: <páginas leídas>».
- Una página de **otro CAS, otro grado u otra especie** no vale: anótala con valor vacío y nota
  «otro CAS: …». Una página del material **diluido** (10 % en DPG, una tintura al 25 %) vale para
  familia y olor, no para horas, fuerza ni dosis: escribe en `nota` «diluido al X %».
- Una **tintura** (cardamomo, ámbar gris, ambreta, tonka, canela) es otro material que su aceite o su
  absoluto: una página del aceite no vale para sus horas, fuerza ni dosis (nota «otra forma»).
- No escribas en ningún otro archivo. No hagas commit.
- Al terminar, contesta en 5 líneas: cuántas filas, y qué materiales quedaron sin nada.
