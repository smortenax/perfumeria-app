# Encargo: el nombre comercial predominante de cada molécula del glosario

La app de formulación tiene un glosario de materiales con nombres químicos (del IFRA FIG y
de los estándares de IFRA). **Nadie busca «6-sec-Butylquinoline»: busca «Isobutyl
quinoline» o «IBQ».** Hay que poner encima de cada molécula su **nombre comercial
predominante** y su **sigla comercial**, cuando los tenga. El nombre químico se queda; los
dos valdrán en la búsqueda.

## Qué tienes

Los archivos `lote-1.txt` a `lote-N.txt`, en esta misma carpeta. Una línea por CAS:

```
CAS | nombre(s) en el glosario | IFRA: nombres comerciales que da IFRA | PubChem: sinónimos candidatos
```

Los candidatos de PubChem están filtrados a mano: quedan nombres cortos, pero también
sinónimos químicos y algo de ruido. **Un guion (`-`) quiere decir que no hay nada.**

## Qué decides, CAS por CAS

1. **`nombre_comercial`**: el nombre con el que un perfumista compra, pide y habla de ese
   material, **cuando es distinto del nombre del glosario**.
   - Vale una marca: Hedione, Iso E Super, Galaxolide, Ambroxan, Cashmeran, Calone,
     Helional, Lilial, Lyral, Florhydral, Javanol, Sandalore, Ebanol, Polysantol, Bacdanol,
     Habanolide, Tonalide, Karanal, Timberol, Vertofix, Cetalox, Veramoss, Mayol, Triplal…
   - Vale también un nombre de uso del sector, aunque no sea marca, si es claramente como se
     le conoce: Isobutyl quinoline, Aldehyde C-14 (peach), Aldehyde C-18 (coconut)…
   - **Si solo es una variante de escritura del nombre del glosario**, déjalo vacío.
     «alpha-Hexylcinnamaldehyde» frente a «Hexyl cinnamic aldehyde» no necesita nombre
     comercial, aunque sí puede llevar sigla (HCA).
   - **Si varias casas lo venden con nombres distintos, el predominante** es el más usado.
     Los demás van en `otros_nombres`.
   - **La mayoría de las filas no tendrán nada.** Linalool, Coumarin o Vanillin ya son el
     nombre de uso. No rellenes por rellenar.
2. **`sigla`**: solo las siglas que el sector usa de verdad: IBQ, HCA, PEA, HHCB, AHTN,
   OTNE, DMBCA, BB, DEP, IPM, TEC… Nada inventado.
   - **Si el sector usa la misma sigla para más de un CAS**, pónsela a todos y dilo en la
     nota. La app les añade un distintivo sacado del nombre químico: ⁶IBQ y ²IBQ.
3. **`otros_nombres`**: otros nombres comerciales del mismo CAS, separados por ` | `. Solo
   nombres comerciales o de uso, no sinónimos químicos.
4. **`casa`**: la casa dueña del nombre predominante, si lo sabes: Firmenich (hoy
   dsm-firmenich), Givaudan, IFF, Symrise, Kao, Takasago, BASF… Vacío si es genérico.
5. **`fuente_nombre`** y **`fuente_sigla`**, una de estas tres:
   - `pubchem`, si aparece tal cual entre los candidatos de PubChem de esa línea;
   - `ifra`, si aparece entre los de IFRA;
   - `uso-del-sector`, si no aparece en la línea pero lo sabes con seguridad. **En ese caso,
     la confianza es como mucho `media`.**
6. **`confianza`**:
   - `alta`: nombre muy conocido y en los candidatos;
   - `media`: predominio discutible, o solo de uso del sector;
   - `baja`: dudoso. En la duda, mejor vacío.
7. **`nota`**, en español y corta: lo que haga falta saber. Por ejemplo, si el mismo nombre
   se usa en el mercado para otro CAS: «IBQ» se aplica a veces al 6-sec-butilquinolina
   (65442-31-1) y otras al 2-isobutilquinolina (93-19-6).

**Nunca cambies un CAS ni le pongas a un CAS un nombre que sea de otro.** Si no sabes con
seguridad a qué CAS corresponde un nombre, no lo pongas.

## Cómo entregas

- **Un archivo por lote, nada más terminarlo**: `salida-1.csv` para `lote-1.txt`, y así.
  En UTF-8 y con esta cabecera:
  ```
  cas,nombre_comercial,fuente_nombre,sigla,fuente_sigla,otros_nombres,casa,confianza,nota
  ```
- **Solo las filas con `nombre_comercial` o `sigla`.** Entrecomilla los campos que lleven
  comas.
- **Sin buscar en la web**: tu conocimiento y los candidatos de cada línea.
- Al final, un resumen de pocas líneas:
  - cuántas filas hay por lote;
  - cuántas son de `uso-del-sector`;
  - los casos dudosos que merezca revisar.
