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

## Lo que queda por mirar

La pasada de juicio los dejó marcados, y siguen abiertos. **El 1333-58-0 ya no:** el usuario
lo dio también como IBQ, y es ²′IBQ.

| CAS | Qué pasa |
|---|---|
| 131812-52-7 · 131812-67-4 | Los dos traen «Okoumal» como candidato; no se sabe a cuál corresponde |
| 13837-56-4 · 7392-19-0 | Los dos traen «Limetol / Linaloyl oxide» (óxido de linalilo, cis y trans) |
| 130066-44-3 | Trae «Lyral» como candidato, que ya lleva el 31906-04-4 |
| 23178-88-3 · 72691-24-8 | «Dragosantol» sale en varios bisabololes y no queda claro de cuál es |
| 89-88-3 · 68129-81-7 | Los dos son vetiverol: puede ser un registro doble |
| 56973-85-4 | Cetona de gálbano: seis nombres de casa (Dynascone, Galbascone…) y ninguno claramente predominante |
| 7779-50-2 | PubChem da «Ambrettol»; el nombre de uso puede ser «Ambrettolide» |

**Falta también** lo que no está en el glosario: los disolventes (DEP, IPM, TEC) y algunas
moléculas conocidas (Georgywood, Silvial, Nectaryl), porque no están en el FIG ni en IFRA.
