# Usos habituales y constituyentes regulados: método (P54, P59)

**Por qué.** Dos cosas faltan para que la ficha del material y la suma de IFRA sean fiables:
- **cuánto se suele usar de cada material** (P59): la franja de consenso de la ficha;
- **qué lleva de cada sustancia regulada cada natural** que el anexo de IFRA no cubre: hoy
  son unos 550 «sin dato», y lo que aportan a un componente IFRA no se puede sumar.

Y con los dos perfiles delante, **los duplicados (P54) se deciden solos**: las formas de una
planta con el mismo perfil de constituyentes y de uso se pliegan; las que difieren, no.

## Dos frentes

| Frente | Qué se busca | Base | Fuentes |
|---|---|---|---|
| **U · Uso** | rango de uso, mínimo y máximo | % del concentrado (la materia aromática); si la fuente da otra base, se apunta cuál | TGSC, fichas de las casas (IFF, Givaudan, Firmenich, Symrise…), Perfumer's Apprentice, Fraterworks, Scentspiracy, `niveles-de-uso.md` del laboratorio |
| **C · Constituyentes** | % de cada sustancia con estándar IFRA dentro de un natural | % del natural | declaraciones de alérgenos y fichas de seguridad de proveedores, ScenTree, TGSC, literatura |

**El consenso sale del contraste:** con una sola fuente es «recomendación de un proveedor» y
se nombra así; con dos o más que coinciden, consenso, con la confianza según el acuerdo.

## Cómo se trabaja
- **Agentes baratos (Sonnet) recopilan**, en lotes de unos 25 materiales, dos a la vez, cada
  uno en su rama. Cada lote es un CSV en `lotes/`, **una fila por fuente**, con cita, URL y
  fecha. **Ningún número sin fuente.** Lo que no encuentran se apunta como no encontrado, no
  se deja en blanco ni se estima.
- **Opus audita cada lote antes de que cuente:** comprueba una muestra contra la fuente,
  contrasta las fuentes entre sí, marca los desacuerdos y rechaza lo que no se pueda
  verificar. La auditoría queda escrita en `auditorias/`.
- **Solo lo auditado entra en el glosario**, por un script, con su confianza.

## Orden
1. **Piloto:** la paleta del laboratorio y las fórmulas F-001 y F-002 (unos 55 materiales).
   Tras él se mide el rendimiento (cuánto se encuentra) y la calidad (cuánto pasa la
   auditoría) antes de escalar.
2. Lo que venden Olfatorium, Maese Lab y Perfumiarz (unos 900).
3. El resto del glosario.

## Formato de los lotes

`lotes/U-NNN.csv` (uso):
`material_id, cas, nombre, fuente, tipo_fuente, url, consultado, cita, min_pct, max_pct, base, notas`
- `tipo_fuente`: proveedor, base-de-datos, literatura, foro, laboratorio;
- `base`: concentrado, producto o desconocida;
- `cita`: la frase de la fuente, 25 palabras como mucho.

`lotes/C-NNN.csv` (constituyentes):
`material_id, cas, nombre, constituyente, cas_constituyente, estandar_ifra, min_pct, max_pct, tipo_valor, fuente, tipo_fuente, url, consultado, cita, notas`
- `tipo_valor`: rango, típico o máximo.
