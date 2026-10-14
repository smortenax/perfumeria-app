# Tanda 6 · La capa de IFRA

*Generada por `migracion-v3/tanda-6-capa-ifra.ts` (plan, paso 4.4; V3-35), solo de los archivos de IFRA (`datos/ifra/51/`, P37), del commit `d4c1e55`. Va a lo común, pero en su propia capa: sus tablas no son de los materiales, y bajan por su propio canal («ifra»).*

**Qué entra:**

- **263 estándares** (`ifra_standards.csv`), con sus notas tal como las escribe IFRA y su enmienda: 59 de la 51, 116 de la 49 y el resto de enmiendas anteriores que la 51 mantiene.
- **3004 límites por categoría** (`ifra_limits.csv`): 3002 techos en fracción del producto terminado y 2 prohibiciones de una categoría. En la categoría 4, la que usa la app: 177 techos y 0 prohibiciones. «ver-nota» toma la cifra de su nota; «sin-restriccion» o nada, ninguna fila. **76 estándares prohíben sin límite en ninguna categoría**: la app prohíbe el material como tal, o con especificación, una variante (el cade; V3-25).
- **481 CAS regulados** (`ifra_substances.csv`), con su subgrupo y sus sinónimos cuando IFRA los da. El subgrupo es un encabezado de la lista de IFRA, no otro techo.
- **1030 filas del anexo de naturales** (`ifra_annex.csv`): lo que IFRA dice que trae cada natural, en fracción del natural, con su otro CAS. 3 no dicen el estándar de su constituyente (el CAS lo enlaza igual). 61 no traen CAS principal, solo otros CAS (el absoluto de ylang-ylang): la app los busca también por ellos. 1 filas repetidas iguales entran una vez.

**Lo decidido encima del texto de IFRA:**

- **El grupo «furocumarinas»** (V3-27): el 089 y los estándares de los aceites fototóxicos que nombra (086 a 096) suman contra sus techos, como un grupo combinado.
- **Un límite expresado como un constituyente** (V3-27):
  - IFRA_STD_089: 5-MOP, CAS 484-20-8 (bergapteno; en.wikipedia.org/wiki/Bergapten y fishersci.ca (CAS RN 484-20-8), leídos el 2026-10-14)
- **Prohibidas como tal, con techo** (V3-30; su nota dice «as such should not be used»):
  - IFRA_STD_110 (cis-and trans-Asarone)
  - IFRA_STD_112 (Benzyl cyanide)
  - IFRA_STD_154 (Isophorone)
  - IFRA_STD_158 (7-Methoxycoumarin)
  - IFRA_STD_179 (Safrole, Isosafrole and Dihydrosafrole)
- **Una variante prohibida** (V3-31), regla a regla, la primera que casa (`ifra_variant_rules.csv`, 17 reglas):
  - **IFRA_STD_097**: especie contiene «erecta» → prohibida; especie contiene «minuta» → permitida; especie contiene «patula» → permitida. Lee «Tagetes erecta should not be used…»; la restricción, «only applies to Tagetes patula and Tagetes minuta».
  - **IFRA_STD_071**: proceso contiene «absoluto» → permitida; proceso contiene «extracto» → permitida; proceso contiene «destilad» → permitida; proceso contiene «aceite» → permitida; proceso contiene «resinoide» → permitida; proceso contiene «rectificado» → permitida. Lee «Peru balsam crude should not be used…»; la restricción, a sus extractos y destilados.
  - **IFRA_STD_078**: proceso contiene «absoluto» → permitida; proceso contiene «extracto» → permitida; proceso contiene «destilad» → permitida; proceso contiene «aceite» → permitida; proceso contiene «resinoide» → permitida; proceso contiene «rectificado» → permitida. Lee «Crude gums of Liquidambar… should not be used…»; solo extractos o destilados de la exudación.
  - **IFRA_STD_083**: proceso empieza por «absoluto» → permitida; proceso empieza por «aceite» → prohibida. Lee «Verbena oils… should not be used…»; «Only Verbena absolutes… can be used».
- **Los estándares de clase** (V3-44): IFRA_STD_188, IFRA_STD_184, IFRA_STD_089 no listan ningún CAS en los archivos de IFRA; toman los 26 miembros que les dio la v2 por nombre (`grupo-miembros.csv`), marcados «miembro por nombre, según la v2 (V3-44)». Sus límites siguen saliendo de IFRA.
- **La especificación que no es de un proceso** (`ifra_spec_exclusions.csv`, 1): de `datos/v2/exclusiones.csv`, con su nota y la decisión del usuario que cita (el resinoide de estoraque no lleva la especificación de HAP del aceite de pirólisis).

**Lo que no entra:** ningún material. La pertenencia de los materiales de la v2 a cada estándar (`grupo-miembros.csv`) era de la v2: en la v3 un material dice su CAS y la app lo busca aquí.

**Para revisar** (2):

- 8016-84-0 sale dos veces en IFRA_STD_097 (subgrupos «Prohibition of Tagetes erecta» y «Restriction and Specification of Tagetes patula and Tagetes minuta»): entra una fila con los dos.
- Anexo: «Lavandin concrete» con alpha-Bisabolol al 1.91 % sale dos veces igual en naturales.csv; entra una.
