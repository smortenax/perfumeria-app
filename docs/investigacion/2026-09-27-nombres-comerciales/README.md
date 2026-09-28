# Los nombres comerciales del glosario (P38)

**2026-09-27.** La capa que pone encima de cada molécula su nombre de uso y su sigla:
Hedione, Iso E Super, ⁶IBQ. El resultado es
[`datos/glosario/origen/nombres-comerciales.csv`](../../../datos/glosario/origen/nombres-comerciales.csv),
con la fuente y la confianza de cada fila.

## Cómo se hizo

1. **PubChem, por CAS.** [`scripts/buscar_sinonimos.py`](../../../scripts/buscar_sinonimos.py)
   trajo los sinónimos de las 2415 moléculas del glosario: 2263 tienen alguno y ninguna
   petición falló. Se guardan en `datos/glosario/.cache/`, fuera de Git.
2. **Un filtro.** Quita los códigos (UNII, DTXSID, proveedores…) y los nombres sistemáticos,
   y deja los nombres cortos: los candidatos. Salen 688 moléculas sin ninguno.
3. **Los de IFRA.** Se suman los que IFRA marca como *commercial name* en el overview.
4. **Una pasada de juicio.** Un subagente Sonnet leyó los siete lotes con el
   [encargo](encargo.md) y eligió, CAS por CAS, el nombre predominante y la sigla. Sale un
   nombre solo si es claramente como se conoce el material; la mayoría no tienen. Resultado:
   283 filas.
5. **Una comprobación automática.** Cada nombre que dice salir de PubChem o de IFRA tiene
   que estar en esa fuente para ese CAS. **No falló ninguno.**
6. **Una revisión**, en [`revision.csv`](revision.csv):
   - **quita tres elecciones que no son el nombre de uso.** «Aldehyde C-19» no es como se
     llama al butirato de bencilo, «Laurine» no le quita el sitio a «Hydroxycitronellal», y
     «Flomine» no es la amilcinámica. Pasan a otros nombres, que se siguen buscando;
   - **añade lo que el filtro o la pasada dejaron fuera:**
     - Javanol, Bacdanol, Romandolide, Velvione, Muscenone, Nirvanolide, Serenolide,
       Dupical, Floralozone, Doremox, Heliotropin, Furaneol, Brahmanol, Ysamber K,
       Spirambrene, Grisalva, Amberketal y Ambrinol;
     - los Aldehyde C-8 a C-12;
     - Isobutyl quinoline;
     - las siglas HCA, ACA, PEA, BB, DMBCA, MNA y EMPG.

     **Cada CAS se comprobó con el nombre químico del glosario.**

## El resultado

- **303 materiales con nombre comercial y 25 con sigla**, en 310 filas.
- **Fuente del nombre:**
  - PubChem, 240;
  - IFRA, 43;
  - uso del sector, 20.
- **Confianza:**
  - alta, 100;
  - media, 193;
  - baja, 17.

  Lo que es solo «uso del sector» nunca pasa de media.
- **13 nombres se comparten entre CAS**, a propósito: son isómeros o el mismo material con
  dos registros. Por ejemplo, Iso E Super, Mayol, Tonalide o Vertenex. **Cuando la sigla se
  comparte, el icono lleva un distintivo** (P39): ⁶IBQ, ²IBQ y ²′IBQ; ¹OTNE y ¹′OTNE; ¹AHTN
  y ⁶AHTN.

## La pasada con la web

Tras la primera versión, el usuario pidió completar lo que faltaba. Un segundo subagente
Sonnet trabajó con [otro encargo](web/encargo.md), con un tope de 150 búsquedas y 60
lecturas; gastó 73 y 43. **Un nombre solo entra si una página lo pone junto a ese CAS
exacto**, y la página queda apuntada. Sus salidas están en [`web/`](web/).

- **Los casos dudosos:**
  - Okoumal es de los CAS 131812-52-7 y 131812-67-4, según la página de Givaudan;
  - Limetol es solo del 7392-19-0; el 13837-56-4 se queda sin él;
  - Lyral cubre también el 130066-44-3;
  - Galbascone (IFF) es el predominante de la cetona de gálbano;
  - el 7779-50-2 es Ambrettolide, y «Ambrettol» pasa a otro nombre;
  - «Dragosantol» no es de ninguno de los dos bisabololes, porque su CAS es el 515-69-5;
  - los dos vetiverol son un registro doble del mismo natural, sin marca.
- **Los 20 nombres que eran solo «uso del sector» tienen ya una página**, casi siempre la de
  la casa o ScenTree.
- **28 nombres nuevos:**
  - 16 del compendio de Firmenich de 2016: las damasconas, Florex, Fructalate, Delphol
    HC…;
  - 12 de búsquedas sueltas: Okoumal, Limetol, Ambermax, Glycolierral, los segundos CAS de
    Spirambrene y Ysamber K…
- **Dos decisiones de la revisión:**
  - **Pyralone** es la marca de Givaudan para el 65442-31-1. Queda como otro nombre, y
    delante sigue «Isobutyl quinoline», que es lo que el usuario confirmó;
  - **el compendio de Firmenich se leyó en una copia no oficial** de la web. Se cita el
    documento y no el enlace, y la confianza se queda en media como mucho. Pasa lo mismo con
    The Good Scents Company, cuyas condiciones de uso son restrictivas.
- **Catálogos que no se pudieron leer:**
  - los PDF de Givaudan y de Takasago, porque son imagen o pasan del tamaño;
  - IFF, que bloquea la lectura;
  - Kao, BASF y Zeon, que no se intentaron.

  Si hacen falta, el usuario puede descargar esos catálogos y leerlos aquí.

**Resultado: 331 materiales con nombre comercial y 25 con sigla, en 338 filas.** 60 filas
tienen página web. Confianza: 114 alta, 207 media y 17 baja.

## Los catálogos de las casas

El usuario descargó cuatro catálogos oficiales (2026-09-27). **No se guardan en el
repositorio**, porque son documentos de las casas. Lo que se sacó de ellos está en
[`catalogos/`](catalogos/), y los scripts, en [`scripts/`](scripts/).

| Catálogo | Qué trae | Qué dio |
|---|---|---|
| Takasago, *Aroma Ingredients Compendium* (2024) | una ficha por producto, **con su CAS** | 54 productos |
| Firmenich, *Perfumery Ingredients* (2020) | código y nombre, sin CAS | 119 moléculas, sin las bases compuestas |
| Givaudan, *Fragrance Ingredients Sustainability Profile* (2024) | código y nombre, sin CAS | 146 productos |
| dsm-firmenich, *Sharing Innovation Collection* (2025) | novedades, sobre todo bases, sin CAS | nada |

**Cuando el catálogo no da el CAS, se empareja por el nombre**, primero con los nombres del
glosario y después con los sinónimos de PubChem. Si no, se pregunta a PubChem por el
nombre. Así tienen CAS 158 de los 265 productos de Firmenich y Givaudan.

**Se aplicaron estas reglas:**
- **Un nombre que solo es el químico con un grado** («Citral Extra», «Pinene beta»,
  «Nopol T») **no es nombre comercial.** Se compara sin mirar el orden de las palabras ni
  las marcas de isómero.
- **Un nombre de casa va delante si el material no tenía ninguno.** Si ya tenía uno, pasa a
  otros nombres, y la casa queda apuntada.
- **Si la revisión dejó un material sin nombre delante a propósito**, como el
  hidroxicitronelal, se respeta.
- **La confianza es alta cuando el catálogo da el CAS**, y media cuando se emparejó por el
  nombre.
- **Dos correcciones a mano en Takasago:**
  - la página 49 es Orbitone T;
  - la ficha de Polyambrol trae el CAS de la dihidro-beta-ionona, cuando su estructura es
    un octahidronaftalenol. Es una errata del catálogo, y se deja fuera.

**Resultado:**
- **14 nombres nuevos**:
  - de Takasago: Biomuguet, Hindinol, Hedirosa, Matsutakeol, Sakura Salicylate, Florantone
    T, Violet T…;
  - de Givaudan: Undecavertol y Verdantiol;
  - de Firmenich: Oxane.
- **7 otros nombres**: Dextramber junto a Timberol, Jasmodione junto a Hedione…
- **Tres materiales de Takasago no estaban en ningún listado de IFRA ni en el FIG**:
  l-Dihydro Citronellol (68680-98-8), Levocitrile (35931-93-2) y Thesaron (246872-25-3).
  **El usuario pidió añadirlos**, y entran al glosario como `cat:CAS`, con la página del
  catálogo como fuente
  ([`materiales-de-catalogos.csv`](../../../datos/glosario/origen/materiales-de-catalogos.csv)).
- **Unas 60 moléculas de casa se quedan sin CAS**, porque ni PubChem ni el glosario las
  conocen por ese nombre: Myroxyde, Plicatone, Lilyflore, Clearwood, Paradisamide…

## Las moléculas nuevas de la Transparency List

Con la *Transparency List* entraron **689 moléculas que el glosario no tenía**. Un
subagente Sonnet las leyó con el mismo [encargo](encargo.md), en dos lotes. **Casi todas son
ingredientes funcionales sin nombre de perfumería**: tintes, conservantes, filtros UV,
disolventes, ácidos grasos, polímeros. La comprobación automática no falló en ninguna.

- **16 filas, en [`transparencia/nombres.csv`](transparencia/nombres.csv):**
  - los refrescantes: Frescolat MGC, MPC y ML (Symrise), Physcool, Evercool 180, y la
    sigla WS-23;
  - Rosyfolia, Isolongifolanone, Alpinal diethyl acetal, Guaiazulene, Isopulegol (dos
    CAS, isómeros), Phlorol (o-etilfenol) y gamma-Irone.
- **Confianza:** alta 9, media 5, baja 2.
- **Una corrección de la revisión:** PubChem cuelga «Methyl Ionone Gamma» del 79-68-5, pero
  ese es el nombre comercial de las metiliononas (127-51-5). El 79-68-5 es la gamma-irona,
  y ese nombre va delante.
- **Dudosos, en baja:** Anapear (189440-77-5) y Sinodor (20770-40-5). Son el único
  candidato de PubChem y no hay otra fuente que diga que son nombres de mercado.
- **Frescolat ML** es «uso del sector»: PubChem solo da *menthyl lactate* para ese CAS.

**Resultado: 363 materiales con nombre comercial y 26 con sigla, en 373 filas.** Confianza:
153 alta, 201 media y 19 baja.

**Añadido el 2026-09-28: *allyl amyl glycolate*** (67634-00-8), que no salía al buscar un
material de F-001. PubChem no lo tiene entre sus sinónimos; los distribuidores lo venden con
ese nombre y ese CAS (Sigma-Aldrich, Parchem). Confianza media. Va en
[`web/d-sueltos.csv`](web/d-sueltos.csv). **Quedan 364 con nombre comercial.**

## Lo que queda por mirar

| CAS | Qué pasa |
|---|---|
| 13837-56-4 | Algunas fichas de proveedor lo llaman «Limetol», pero la página de Givaudan da otro CAS |
| 23178-88-3 · 72691-24-8 | Bisabololes sin nombre comercial propio |
| 89-88-3 · 68129-81-7 | Vetiverol: registro doble del mismo natural |
