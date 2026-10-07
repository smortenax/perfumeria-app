# Revisión del plan v3, contrastado con la v2

*2026-10-07. Revisa `PLAN_V3.md` (el que subiste al hilo; igual que `docs/v3/PLAN_V3.md` del repo) contra la v2 tal como está en `main`. Lo que digo de la v2 sale del código y de los documentos que cito; lo que es opinión mía va marcado como propuesta.*

---

## 0 · En una pantalla

**El plan acierta en la arquitectura y en el núcleo de la fórmula.** Historial como fuente de verdad, mezcla derivada, la dilución en la línea, masas en µg enteros, lo desconocido nunca cero, el motor en TypeScript puro: todo eso **ya es la v2** (`src/core/compose.ts`, `src/core/model/formula.ts`) y el plan lo conserva casi palabra por palabra.

**Donde se queda corto es en los materiales y en IFRA.** El `Material` del plan es el de la v1 (una fila plana con CAS), no el de la v2. La v2 tiene 18 tablas y 16 decisiones (D1–D16) que el plan no menciona, y varias las rompe:

- IFRA limita **por grupo (estándar)**, no por material; el plan cuelga `regulations` de cada material.
- El **tope del fabricante es del producto** (D4); el plan no tiene productos.
- **Sin cobertura no se distingue «no lo lleva» de «no se sabe»** (§1.2), y el plan no la tiene.
- Las **condiciones probadas, supuestas o pendientes** (D11), la **revisión de documentos** (D6), las **enmiendas** de IFRA y los **alias de CAS** no aparecen.
- Tampoco las piezas del banco que usas cada día: **última dilución y favoritas, el nombre del frasco, los diluyentes propios, el recipiente con su tara, las versiones de una fórmula, la capa de familias, uso y duración, y los nombres comerciales y siglas**.

**Nada de esto obliga a abandonar el plan:** se resuelve añadiendo unas pocas tablas que ya existen como CSV en la v2. Mi propuesta es que **la v3 cambie el almacenamiento y la plataforma, no el dominio**: las decisiones de la v2 siguen vigentes y el esquema se traduce desde la v2.

**Sobre «no diseñar la base de datos desde cero»** (la idea de tu amigo): tiene razón, y la estructura ya hecha que mejor encaja **es la v2 misma**, con patrones conocidos para lo que la v2 no tenía (multiusuario, RLS). Lo detallo en el §4.

**Te pido cinco decisiones** (§5.1); el resto lo resuelvo con un default que te digo (§5.2).

---

## 1 · Lo que el plan ya conserva de la v2 (no hay que tocarlo)

| Del plan | En la v2 |
|---|---|
| Historial → `compose()` → mezcla; sin tabla de mezcla | `replay()` y `compose()` en `src/core/compose.ts`; decisiones §3.4 |
| Eventos `add`, `set_mass`, `remove`, `reweigh`, `note` | Idénticos: `Change` en `src/core/model/formula.ts` |
| La dilución no crea material; se agrega por identidad | Decisiones §2.5 y D8; `breakdown()` |
| Masas en µg `bigint`, `Ratio` exacto | `src/core/arith/` |
| `within / bounded / unknown / exceeds` | `Verdict` en `src/core/ifra.ts` |
| Jerarquía lote > producto > anexo > literatura > consenso | `AUTHORITIES` en `src/v2/model.ts` |
| CSV versionados + scripts de importación | `scripts/v2/alta.py`, `npm run validar:v2` |

---

## 2 · Lo que el plan omite o rompe de la v2, y cómo resolverlo

### 2.1 · Materiales e IFRA

| # | Qué hay en la v2 | Qué pasa con el plan | Propuesta |
|---|---|---|---|
| M1 | **Sustancia ≠ material.** `sustancias.csv` (3074) y `sustancia-cas.csv` con alias (`principal`, `isomero`, `mezcla`, `obsoleto`). IFRA cubre la sustancia «con cualquier CAS» (D15, §5.2) | Un solo `cas text` por material. Se pierden los alias y la suma por sustancia cuando dos materiales comparten sustancia | Tabla `substances` + `substance_cas`. Un material de tipo `sustancia` apunta a su sustancia |
| M2 | **IFRA por grupo.** `grupos.csv` (263 estándares), `grupo-miembros.csv` con subgrupos (097, 181), miembros que son sustancias o materiales (089, 184), estándares de clase (D16) | `regulations.material_id` con `max_value`: habría que copiar el techo a cada miembro. Es el error que la decisión §2.5 ya descartó: una copia se desincroniza | `ifra_standards` + `ifra_limits` (estándar × categoría × enmienda) + `ifra_members` (estándar → sustancia o material, con subgrupo) |
| M3 | **Grupos combinados (D10, STD 089):** la suma de fototóxicos en % de su techo | `group_key` sin semántica | Columna `combined_group` en el estándar; el motor ya lo hace (`IfraSubstance.combined`) |
| M4 | **Condiciones (D11):** probada / supuesta / pendiente, con su documento | `requirement text`: no hay forma de decir «probada» | Tabla `ifra_conditions` (contenedor, estándar, afirmación, autoridad, documento) |
| M5 | **Cobertura.** `coberturas.csv` (1236 filas): `reguladas-completa`, `solo-alergenos`, `parcial`, `desconocida`. Sin ella, un constituyente que no sale es «no se sabe», nunca cero | No existe. `Concentration.unknown` es por componente, pero lo grave es el componente **que no está en la lista** | Tabla `material_sources` (contenedor, documento, cobertura): cada lista de componentes declara qué cubre |
| M6 | **Productos (D3), topes del fabricante (D4), concentración por producto (D12), migración al producto que tienes (D13).** 89 productos, 13 topes, 10 concentraciones | Productos y lotes fuera de alcance; `regime = manufacturer` cuelga el tope del material, que es lo que D4 prohíbe | Tabla `products` ya (con `ceiling` y concentración por defecto). Los lotes pueden esperar: hoy hay 0 |
| M7 | **Documentos con estado de revisión (D6):** solo lo revisado entra en los datos. 34 documentos | `source text`: no se puede exigir «revisado» | Tabla `documents` mínima: metadatos y estado, **sin subir PDFs**. Los PDFs siguen donde están |
| M8 | **Enmienda de IFRA como dato** (§5.1); la **Fase 7** de la v2 es justamente preparar la enmienda siguiente | No hay columna de enmienda | `ifra_amendments`; cada límite lleva la suya. La fórmula guarda con cuál se comprobó |
| M9 | **Tipos de cifra** `tipico / maximo / rango` y **D2** (un placeholder nunca da «dentro») | `exact / max / range / unknown`. «exact» no existe en la v2 y es engañoso: una cifra típica no es exacta | Mantener los tipos de la v2 |
| M10 | **D7 (pura por convención), origen, impurezas conocidas, exclusiones por proceso, excepciones del validador** | Ausentes | Columnas en `materials` (`origin`) y dos tablas pequeñas. Hoy tienen 0–1 filas, pero las reglas ya están en el motor |
| M11 | **Ids estables de `registro-ids.csv`** (7750, `S/M/P/D/G`), «nunca recalculados». Los citan la evidencia, los conflictos y las notas | `uuid` sin rastro del id de la v2 | `uuid` como clave técnica **y** columna `ref` única con el id de la v2. El importador hace *upsert* por `ref` |

### 2.2 · Fórmulas y banco

| # | Qué hay en la v2 | Qué pasa con el plan | Propuesta |
|---|---|---|---|
| F1 | **Recipiente y tara** en la cabecera (§3.3); repesar rechaza un bruto por encima de tara + contenido (P52); «receta sin vial» (§3.2) | La cabecera no tiene recipiente | `container_capacity_ml`, `container_tare_ug`, `has_vial` |
| F2 | **Versiones:** familia, número y de cuál sale (P44); la biblioteca las agrupa | Solo `parent_id` | `parent_id` + `family_id` + `version_number`. La variación **copia** el historial (§3.2: copia, no vínculo) |
| F3 | **Fórmula como material = vector plano y exacto** (§2.3, §2.4): proporciones `Ratio`, id por hash SHA-256, viaja con sus propios y provisionales dentro | Material privado con `material_components` en `numeric` (%) y expansión recursiva | Congelar como vector **plano** y guardar cada componente como **masa en µg (`bigint`)**: la proporción exacta se recalcula. Un `numeric` no guarda 1/3. Inmutable una vez creado |
| F4 | **Deshacer** borra, a propósito («solo deshacer borra», §6) | El historial es intocable | Deshacer = borrar el **último** evento, solo ese, con una función en la BD. Nada más se borra ni se edita |
| F5 | **Preferencias por material:** última dilución, dos favoritas, **nombre del frasco** (P56); **diluyentes propios** provisionales (`src/bench/prefs.ts`) | `material_preferences` aplazado «si se quieren favoritas», pero ya existen y la barra gira en torno a ellas (§4) | Tabla `user_material_prefs` y `user_diluents` desde el principio |
| F6 | **La enmienda con que se comprobó** va en el archivo (P44): así se nota si cambió el veredicto | No está | `checked_amendment` en la fórmula |
| F7 | **Exportar al cuaderno** (Markdown y CSV, §6) y **JSON legible por fórmula** que Git ve | Desaparecen los archivos | Exportar a JSON (formato actual `perfumeria/formula/1`) y Markdown como acción. Sirve también de copia de seguridad (ver H6) |
| F8 | **Diluyentes de la app** (DPG, alcohol, IPM, DEP, TEC, triacetina, BB) marcados como `solvent`: la materia aromática los excluye | `kind` sin definir | `materials.is_solvent`; los siete como materiales globales |

### 2.3 · La capa que se ve: búsqueda, iconos, gráficos

Hoy el buscador, los iconos, las familias, el uso habitual y los gráficos **siguen saliendo del glosario de la v1** (`datos/glosario/materiales.csv`, 4347 filas, 65 columnas, congelado), con la v2 encima para IFRA y procedencia (`src/data/catalog.ts`, `src/data/merged.ts`). El plan no dice nada de esto:

| # | Qué | Propuesta |
|---|---|---|
| V1 | Nombre comercial, sigla, sinónimos (FIG, PubChem, IFRA), nombres de tienda, búsqueda tolerante al español (P38, P43) | Tabla `material_names` (nombre, tipo, fuente) |
| V2 | Icono, distintivo ⁶IBQ, carácter del tipo de natural (P39, P40) | Columnas en `material_profile` |
| V3 | Familia y matiz con su color (P48), descriptores del FIG | `material_profile` + `scent_families` |
| V4 | Uso habitual con su base y fuentes (P59), duración, presión de vapor (piezas 8, 12, 13) | `material_profile` / `usos`, **siempre con su base** (§1.1) |
| V5 | Las formas de un natural en una fila por planta (P54) | Se deriva en el cliente, como hoy |

**Cómo llega a la v3:** un script lee el glosario v1 (sin editarlo, sigue congelado) y lo une a los ids de la v2 con `v1-a-v2.csv`. Así no se pierde nada y la v1 no entra como modelo.

---

## 3 · Huecos técnicos del plan

| # | Hueco | Por qué importa | Propuesta |
|---|---|---|---|
| H1 | **Sin conexión.** El plan deja «offline completo» fuera. La decisión vigente es «funciona sola y sin internet» (§0, P2, P16) | Pesas en el banco: si se corta la red a mitad de una mezcla, se pierden adiciones | Decisión 4 |
| H2 | **`numeric` y `bigint` llegan como `number` de JavaScript** por la API de Supabase (PostgREST los manda como números JSON) | Rompe la aritmética exacta sin avisar: `0.1` vuelve como coma flotante | Leer y escribir esas columnas como texto (`col::text` en vistas o funciones) y convertir a `Ratio`/`bigint` en el dominio. Prueba que lo vigile |
| H3 | **Quién escribe los datos globales.** RLS impide a los usuarios; el plan no dice quién sí | | Solo los scripts, con la clave de servicio, desde los CSV (Decisión 2) |
| H4 | **Un material global no puede contener uno privado**, y un evento no debe apuntar al material privado de otro. Una clave foránea no respeta RLS | Fuga o incoherencia | Disparadores (*triggers*) que lo comprueben |
| H5 | **Cargar el catálogo.** 4260 materiales, 3140 cifras de composición: el motor IFRA corre en el cliente | Consultar material a material sería lento | Una instantánea versionada del catálogo, descargada una vez y guardada en el navegador; se renueva cuando cambia la versión de los datos. Es lo que hace hoy `src/v2/lazy.ts`, con otra fuente |
| H6 | **Copias de seguridad.** En el plan gratuito de Supabase no hay copias descargables y el proyecto se pausa tras una semana sin uso (según su página de precios; lo compruebo antes de montar nada) | Tus fórmulas pasan a vivir solo ahí | Volcado nocturno (`pg_dump`) con una acción de GitHub a un repositorio privado, y exportar a JSON desde la app (F7) |
| H7 | **La transición deja de lado la app que usas.** El paso 1 del plan es «eliminar Tauri» | Te quedas sin banco hasta que la v3 funcione | La v2 sigue intacta hasta que la v3 pase las pruebas de equivalencia; Tauri se quita al final |
| H8 | **Pruebas de equivalencia** sin definir | «Mismo resultado» tiene que ser medible | Las de referencia de `src/core` (F-001) y el informe de tu biblioteca (`biblioteca.tool.test.ts`, el de `comparacion-fase6.md`): mismo informe IFRA, línea a línea |
| H9 | **Las fórmulas actuales están en tu disco** (`Documentos\Perfumería\Fórmulas`), no en el repo, con claves `cas:`, `own:`, `prov:`, `vec:`, `solv:` y de la v2 | El importador necesita leerlas y traducir cada clave | Reutilizar `src/v2/migrate.ts` (D13) y leer la carpeta desde tu equipo cuando toque |
| H10 | **Licencias de los datos** (a-futuro §4): IFRA, FIG, TGSC. Una web con más usuarios es distribuir | No se puede abrir a otros sin revisarlo | Decisión 5 |
| H11 | **Dos pestañas a la vez** sobre la misma fórmula | `UNIQUE(formula_id, seq)` choca | El cliente reintenta con el `seq` siguiente; el último en llegar vuelve a leer |
| H12 | **Drizzle y Supabase CLI** tienen cada uno su carpeta de migraciones; el plan pide «una única historia» | | Drizzle genera el SQL dentro de `supabase/migrations/` y se aplica con la CLI de Supabase; RLS y disparadores, en SQL en la misma carpeta |
| H13 | **Móvil.** Tauri iba a dar Android e iOS | Sin Tauri, el móvil es la web | Web adaptable a pantalla estrecha + instalable (PWA). Ya es requisito (§4 de a-futuro: sin *hover*) |

---

## 4 · ¿Partir de una estructura ya hecha?

Tu amigo tiene razón en que no conviene inventar el esquema. La pregunta es **de qué estructura partir**. Hay cuatro candidatas:

| Opción | Qué es | A favor | En contra |
|---|---|---|---|
| **A · El esquema de otra app de perfumería** | Por ejemplo [Perfumers Vault](https://apps.apple.com/app/id1525381567) o [perfumenuke](https://github.com/nuke-haus/perfumenuke) (código abierto) | Ideas de campos y pantallas | Modelan IFRA por CAS de ingrediente, que es justo lo que la v2 corrigió (D15, §5.3); sin historial; licencias por mirar. No he leído su código: lo digo por lo que publican |
| **B · Patrones genéricos probados** | Lista de materiales (BOM) para `material_components`; *ledger* de solo-añadir para el historial; producto / variante / lote de un ERP como Odoo; el patrón multiusuario con RLS de la documentación de Supabase | Probados, sin licencia, cubren lo que la v2 no tenía (usuarios, permisos) | No saben nada de IFRA |
| **C · Estándares de identificación química** | CAS, EC, InChIKey, CosIng, PubChem | Para identificar sustancias y cruzar fuentes | No dan estructura de tablas |
| **D · La v2 misma** | 18 tablas con columnas documentadas (`datos/v2/LEEME.md`), un validador de 18 reglas, 7750 ids estables y datos cargados y revisados | Es la estructura ya hecha que mejor encaja: está hecha para tu dominio y ya pasó 6 fases | Pensada para CSV de un solo usuario: le falta `owner_id`, RLS y las preferencias |

**Recomendación: D + B.** Se traduce la v2 a Postgres casi tabla por tabla, y se toman de B los patrones que faltan. Donde de verdad se ahorra trabajo «no partiendo de cero» es en **el esqueleto**: una plantilla oficial de Supabase con Vite, React y autenticación da el inicio de sesión, RLS y el despliegue hechos. C entra como columnas (CAS, InChIKey), no como estructura.

### Esquema resultante (borrador, para que veas el tamaño)

```text
Referencia global (escriben solo los scripts; leen todos)
  substances, substance_cas
  materials            (+ ref, owner_id, is_solvent, origin, species/part/process/chemotype)
  material_components  (+ value_type, min/typical/max, authority, document_id)
  material_sources     (cobertura por contenedor y documento)
  products             (+ tope del fabricante, concentración por defecto)
  documents            (metadatos y estado de revisión, sin archivos)
  ifra_amendments, ifra_standards, ifra_limits, ifra_members, ifra_conditions
  material_profile, material_names, scent_families     (la capa que se ve)
  data_version         (qué commit de los CSV hay cargado)

Del usuario (RLS por owner_id)
  materials (privados), material_components (de los privados)
  formulas  (+ recipiente, tara, versión, enmienda comprobada)
  formula_events
  user_material_prefs, user_diluents
```

Unas 20 tablas frente a las 5 del plan. Las 15 de más no son conceptos nuevos: son las que la v2 ya tiene y usa.

---

## 5 · Decisiones

### 5.1 · Las que necesito de ti, de una en una

Van en orden: cada una condiciona la siguiente.

**Decisión 1 · ¿Siguen vigentes las decisiones de la v2 (D1–D16 y las de `docs/decisiones.md`) en la v3?**

| Opción | Qué pasa |
|---|---|
| **A · Sí, todas** *(recomendada)* | La v3 cambia el almacenamiento y la plataforma, no el dominio. El plan se corrige donde choca (§2) |
| B · Se revisan una a una | Cada choque del §2 pasa por el interrogatorio. Más lento, y se arriesga a perder lo que ya se probó |
| C · Manda el plan | Se pierde lo del §2.1; habría que reconstruir IFRA por material |

Dejarla abierta bloquea el esquema entero. `CLAUDE.md` dice que si una tarea choca con `decisiones-v2.md` se para y se pregunta; por eso es la primera.

**Decisión 2 · ¿Dónde viven los datos de referencia (IFRA, materiales, productos, documentos)?**

| Opción | Qué pasa |
|---|---|
| **A · En los CSV del repo; la BD es una copia que cargan los scripts** *(recomendada)* | Siguen valiendo los scripts deterministas, los conflictos que decides tú, `validar:v2` y la revisión en Git. La BD se rehace cuando quieras |
| B · En la BD; los CSV se exportan | Se edita más rápido, pero se pierde la revisión por Git y la regla de «nada se fusiona en silencio» |
| C · Se editan en la app con un rol de administrador | Lo más cómodo a la larga, y lo más caro de construir ahora |

Tus fórmulas y tus materiales privados viven en la BD en cualquier caso. Bloquea la fase de extracción de datos, no el esqueleto.

**Decisión 3 · ¿Qué modelo de materiales tiene la v3?**

| Opción | Qué pasa |
|---|---|
| A · El del plan (5 tablas) | Se pierden D3, D4, D6, D9, D11, D12, D13 y la cobertura |
| **B · El de la v2 traducido, sin lo que hoy está vacío** *(recomendada)* | El esquema del §4. Los lotes, los usos y las impurezas entran cuando tengan filas; el modelo ya los admite |
| C · El de la v2 entero, 1 a 1 | Lo mismo que B, con tablas vacías desde el día uno |

Bloquea el esqueleto de la BD.

**Decisión 4 · ¿Qué pasa si se corta internet mientras pesas?**

| Opción | Qué pasa |
|---|---|
| A · Nada: hace falta conexión | Lo más simple. Si se corta, lo que pesas no se guarda hasta que vuelva, y puede perderse |
| **B · Se sigue pesando: el catálogo está guardado en el navegador y los eventos esperan en una cola local** *(recomendada)* | Cubre el caso real del banco sin construir una sincronización completa. Los eventos son de solo-añadir, así que la cola es sencilla |
| C · Sin conexión completo (SQLite en el navegador y sincronización) | Lo que decía la decisión §0; es lo que el plan saca, con razón, por su coste |

No bloquea el esqueleto: se puede montar A y añadir B antes de usarla en el banco.

**Decisión 5 · ¿Quién va a usar la v3, de momento?**

| Opción | Qué pasa |
|---|---|
| **A · Solo tú; el registro de usuarios cerrado** *(recomendada)* | Multiusuario de diseño (RLS desde el principio), sin distribuir datos con licencia |
| B · Tú y gente invitada | Antes hay que revisar las licencias de IFRA, el FIG y TGSC (a-futuro §4) |
| C · Abierta | Lo mismo que B, más cuentas, abusos y costes |

No bloquea: con A no se cierra ninguna puerta.

### 5.2 · Las que resuelvo con un default (dime si alguno no te vale)

| Tema | Default |
|---|---|
| Repositorio | El mismo, `perfumeria-app`, con la web en una carpeta nueva y `src/core` compartido. La v2 sigue funcionando hasta la equivalencia (H7) |
| Ids | `uuid` + `ref` con el id de la v2 (M11) |
| Fórmula como material | Vector plano y exacto, en µg, inmutable (F3) |
| Versiones | `parent_id` + `family_id` + `version_number`, copiando el historial (F2) |
| Deshacer | Borra solo el último evento (F4) |
| Preferencias y diluyentes propios | Tablas propias desde el principio (F5) |
| La capa que se ve | `material_profile` y `material_names`, importadas del glosario v1 por `v1-a-v2.csv` (§2.3) |
| Migraciones | Drizzle genera, la CLI de Supabase aplica, una sola carpeta (H12) |
| Exactitud | `numeric` y `bigint` viajan como texto (H2) |
| Copias | Volcado nocturno a un repositorio privado + exportar a JSON (H6, F7) |
| Categoría IFRA | La 4, como hoy; el modelo guarda las 18 (D5) |
| Móvil | Web adaptable e instalable (H13) |

---

## 6 · Lo que viene después

Cuando estén las decisiones 1 a 3, escribo el **plan ejecutivo**, paso a paso y con cada paso comprobable:

1. **Esqueleto:** proyecto Supabase local en WSL, Vite y React, autenticación, la primera migración con RLS, y `src/core` funcionando en el navegador con sus pruebas.
2. **Esquema:** las tablas del §4, con sus restricciones y disparadores, y pruebas de RLS.
3. **Extracción de datos:** un importador determinista de `datos/v2/` e IFRA 51, con `validar:v2` antes y un recuento después; luego la capa que se ve.
4. **Adaptador:** construir el `IfraData` actual desde la BD (como `src/v2/to-ifra.ts` desde los CSV) y comparar el informe de tu biblioteca, línea a línea.
5. **El banco en la web**, pantalla por pantalla, y la importación de tus fórmulas.
6. **Retirar Tauri y los cargadores de CSV** cuando la equivalencia pase.

**Supuestos que he hecho:** que «el estado actual» que mencionas es `main` a 2026-10-07 (Fase 6 hecha, Fase 7 sin empezar), y que la cifra de pausa y copias de Supabase es la de su plan gratuito actual, que confirmaré antes de montar nada.
