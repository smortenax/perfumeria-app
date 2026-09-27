# Lo que el FIG tiene e IFRA no: el ejercicio inverso

**2026-09-27.** Hasta ahora, el glosario se completaba buscando para cada material sus
referencias. El usuario pidió lo contrario: **partir de lo que no está documentado por IFRA
y averiguar por qué**. ¿Es el mismo material con otro CAS, una variante, o algo que no se
regula? Y lo dijo así: *«ifra debería ser más completa que fig en tanto y en cuanto es una
regla»*.

## Primero, qué es cada lista

- **Los estándares de IFRA son la regla**, y su índice es completo: lo que no está en él
  no tiene estándar propio.
- **La Transparency List no es una regla.** Es la lista de lo que las empresas de IFRA
  declararon usar en su encuesta de 2025. Un ingrediente puede faltar porque nadie lo
  declaró ese año, aunque siga siendo legal.
- **El FIG es de abril de 2020.** Lo que dejó de declararse entre 2020 y 2025 está en el
  FIG y no en la lista. **Esto es una inferencia:** no tenemos la lista de 2020 para
  comprobarlo material a material.

Por eso IFRA no tiene por qué contener todo el FIG. Lo que sí debe hacer la regla es
**cubrir cualquier CAS de una sustancia regulada**, y eso es lo que se buscó.

## Cómo se buscó

[`scripts/relacionar_moleculas.py`](../../../scripts/relacionar_moleculas.py) compara cada
molécula con las que IFRA lista, por su **InChIKey** de PubChem:
- si coinciden los dos primeros bloques, es **el mismo compuesto con otro CAS**;
- si solo coincide el primero, es **la misma molécula con otra estereoquímica**: un
  isómero óptico o geométrico, o la mezcla sin especificar.

Los naturales se comparan por su CAS y por el nombre de la planta. El resultado va en la
columna `fuera_de_ifra` del glosario, y las relaciones en
[`equivalencias.csv`](../../../datos/glosario/origen/equivalencias.csv).

## Los 355 del FIG que no están en nada de IFRA

| Por qué | Moléculas | Naturales |
|---|---|---|
| El mismo compuesto, con otro CAS, que uno que IFRA lista | 10 | — |
| Otra estereoquímica de una molécula que IFRA lista | 16 | — |
| Otra forma de un natural que IFRA lista con el mismo CAS | — | 44 |
| IFRA lista otras formas de esa planta, con otro CAS | — | 14 |
| No aparece en la lista de 2025 | 260 | 11 |

Ejemplos:
- **mismo compuesto con otro CAS:** el mentol racémico (15356-70-4) frente al mentol
  (89-78-1); el terpinol frente al alfa-terpineol;
- **otra estereoquímica:** el (R)- y el (S)-butan-2-ol frente al butan-2-ol; el acetato de
  bornilo frente al de isobornilo.

## Lo que importa para la seguridad: siete moléculas heredan un estándar

Los estándares de IFRA cubren su sustancia **«con cualquier CAS con que se la
identifique»**, no solo los que listan. Al buscar en todo el glosario, y no solo en el FIG,
salieron **siete moléculas sin estándar que son la misma que una regulada**. Hasta hoy el
banco las daba por libres; ahora heredan el estándar, con el motivo en sus condiciones:

| CAS | Molécula | Hereda |
|---|---|---|
| 78605-96-6 | alfa-Amilcinamaldehído trans | STD 005, 7 % en cat. 4 |
| 71048-83-4 | una forma de la delta-damascona | STD 077 |
| 165184-98-5 | 2-Hexil-(E)-cinamaldehído | STD 040, 9,9 % |
| 130066-44-3 | el segundo CAS del Lyral | STD 044 |
| 624-15-7 | 3,7-Dimetil-2,6-octadien-1-ol, geraniol y nerol sin especificar | STD 037, 4,7 %, en el peor caso |
| 117-98-6 | Acetato de vetiverilo | STD 002 |
| 59056-93-8 | un estereoisómero del Iso E Super | STD 068, 20 % |

**Una excepción, revisada a mano: el nerol no hereda el estándar de geraniol.** Es el
isómero Z, un compuesto con identidad propia, y el estándar no lo cubre. La comparación
automática los junta porque solo mira cómo están unidos los átomos.

## Lo que queda

- **260 moléculas y 11 naturales del FIG no están en ninguna lista de IFRA de hoy.** Con la
  lista de 2020 se podría confirmar si dejaron de declararse; no la tenemos.
- **41 moléculas del FIG no tienen CID en PubChem**, así que no se pudieron comparar.
