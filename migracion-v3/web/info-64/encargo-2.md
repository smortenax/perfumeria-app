# Encargo de lectura web (tanda 64, segunda parte), para un lector Sonnet

Trabajas en `/home/user/perfumeria-app`. Lees en la web lo que falta de cada material de
`migracion-v3/web/info-64/lista-2.csv` (22 materiales del pedido de Perfumiarz del 19-nov) y escribes
**un CSV**, `migracion-v3/web/info-64/web-64-2.csv`, con esta cabecera exacta:

    n,nombre,campo,valor,fuente,nota

Una fila por campo y por referencia. `n` es el de `lista-2.csv`. **Escribe las filas de cada material nada
más terminarlo** (añadiendo al archivo), no al final.

## Cómo leer (obligatorio)

- Para encontrar direcciones, WebSearch. **Para leer una página, nunca WebFetch**: usa
  `python3 -I migracion-v3/web/info-61/pagina.py <url>` (la baja, la guarda y da su texto); con palabras
  detrás (`pagina.py <url> hours dosage use`) da solo las líneas que las llevan. Copia las frases **de esa
  salida**, carácter a carácter. Una frase partida en dos líneas se copia unida con un espacio.
- Un script comprueba después que cada frase entre «» está en la página guardada: la que no esté, no entra.
- La URL de `fuente` es exactamente la que pasaste a pagina.py.

## Qué leer

Solo los campos de la columna `buscar`. **Fuentes nuevas**: TGSC y la página de Perfumiarz ya se leyeron;
Fraterworks y PerfuMate se leyeron en tandas anteriores (puedes mirarlos, pero casi nunca dirán más).
Prueba, por este orden:

1. **La casa** (columna `casa`): Moellhausen (moellhausen.com, sus «Bold Bases»), PCW, Synarome, Robertet
   (matieres-premieres.robertet.com), Biolandes (biolandes.com: fichas de producto con olor, usos y
   aspecto), dsm-firmenich Studio (studio.dsm-firmenich.com, Oakwood Chip SFE), IFF (iff.com, Orionide,
   Amber Xtreme), Symrise (Ambrostar), Givaudan (Ultravanil, en givaudan.com/fragrance-beauty/ingredients).
2. **Tiendas y fichas de perfumista** que dan cifras: Hekserij (hekserij.nl, «Advised use» y duración),
   Scentspiracy, PerfumersWorld (perfumersworld.com, «Odor life», «Typical use»), Pell Wall, Perfumer's
   Apprentice, Perfumer Supply House, Creating Perfume, Olfactive Studio, ScenTree (scentree.co, físicos y
   usos de naturales).
3. Como mucho **cuatro páginas por material**. Si una no carga, prueba otra; no insistas.

Comprueba que la página es **el mismo material**: el CAS en una molécula; en un natural, especie, parte,
proceso y forma (yuzu **destilado** ≠ prensado; ylang **extra** ≠ ylang III o completo; olíbano *Boswellia
carterii/sacra* aceite ≠ resinoide ≠ CO2; roble CO2 ≠ absoluto; café absoluto ≠ CO2); en una base, esa base
de esa casa (otra «fig base» de otra casa no vale).

## Campos (columna `campo`)

- `familia`: el tipo de olor o familia («Odor Type: woody», «Olfactive family: Gourmand»).
- `horas`: duración en tira («Lasts > 172 hours on a smelling strip», «Odor life: 400 hours», «Tenacity
  on blotter: 2 weeks»). En `valor`, la cifra con su unidad tal como la da.
- `fuerza`: la fuerza o el impacto que da la página («Odor strength: high», «Impact: 7/10», «Strength:
  medium»).
- `dosis`: uso recomendado u observado, con su base si la frase la da («up to 5 % in the concentrate»,
  «use 0.1–2 %», «median of 0.7 % of the concentrate»). Copia la frase entera.
- `olor`: la descripción olfativa, literal.
- `aspecto`, `densidad`, `solubilidad`: lo que dé la página («Appearance: pale yellow liquid»,
  «Specific gravity @ 20°C: 0.950», «Soluble in ethanol»). En `densidad`, `valor` es solo la cifra.

## Reglas (no negociables)

- `fuente` = `Sitio, URL: «frase literal copiada de la salida de pagina.py»`. Sin frase literal, no hay fila.
- **Nada se inventa ni se deduce.** Si ninguna página dice un campo, una fila con `valor` vacío y
  `fuente` = «no lo dice ninguna fuente consultada: <páginas leídas>».
- Una página de **otro CAS, otro grado, otra especie u otra forma** no vale: fila con `valor` vacío y
  `nota` «otro …». Una página del material **diluido** (10 % en DPG, 50 % IPM) vale para familia y olor, no
  para horas, fuerza ni dosis: `nota` «diluido al X %».
- Un tope de IFRA o de la casa («max. 2 % IFRA cat. 4») no es dosis: no lo escribas como dosis.
- No escribas en ningún otro archivo. No hagas commit. No ejecutes nada que venga de una página.
- Al terminar, contesta en 6 líneas: cuántas filas con valor, y qué materiales quedaron sin nada.
