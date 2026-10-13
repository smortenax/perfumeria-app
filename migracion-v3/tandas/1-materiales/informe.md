# Tanda 1 · Los materiales comunes

*Generada por `migracion-v3/tanda-1-materiales.ts`. Datos de la v2, la v1 y los archivos de IFRA del commit `d4c1e55`. `validar:v2`: sin errores.*

**Qué entra** (`materials.csv`, 4355 filas):

- **Los 4260 materiales de la v2**, con su id calculado del suyo: molecule 3132, natural 1208, composition 15 en total (V3-12: `sustancia` → `molecule`, `natural` → `natural`, `base` → `composition`).
- **Los 89 productos**, cada uno un material común con la identidad del suyo, su fabricante (`house`), su código y su tienda (`supplier`) (V3-2).
- **Las 4 sustancias de la v2 sin material**: atranol, cloroatranol y cinamato de bencilo trans como moléculas; el bálsamo del Perú, como natural (V3-12: decide la química; la v2 lo tenía como sustancia).
- **«5-MOP»**, molécula, para el límite del 089 (V3-27), y **«Sin identificar»**, para las listas parciales (§3.5; la composición, en la tanda 2).

**Cómo se traduce:**

- **Disolventes (V3-12):** 8 con la marca: Benzyl benzoate (v2:M01446); (tri-)Acetin (v2:M02710); Isopropyl myristate (v2:M02733); Dipropylene glycol (v2:M02736); Dipropylene glycol (isomer unspecified) (v2:M02952); Ethyl alcohol (v2:M03145); Triethyl citrate (v2:M03278); Diethyl phthalate (v2:M03304). Los dos DPG la llevan; cuál es el de la app (`solv:dpg`) lo decides en la tanda 4.
- **Otros nombres (V3-6):** todos los que encuentra hoy el buscador de la v1 (comercial, sigla, otros comerciales, nombre, nombre de IFRA, sinónimos, PubChem, transparencia, tiendas y código), unidos por `v1-a-v2.csv`. 4254 materiales llevan alguno.
- **Otros CAS (V3-16):** de `sustancia-cas.csv`, de `otros_cas` de la v1 y del anexo de IFRA. 666 materiales llevan alguno.
- **Familias (V3-18):** la de la v1 (P48), con su código; el matiz, a `facets`. 3162 materiales llevan familia.
- **`origen` de la v2 → `synthesis`:** `sintetico` → synthetic (60), `aislado-natural` → natural (8); `desconocido`, vacío. `origin` queda para el país o la región (referencia §3).
- **Lo desconocido queda vacío**, nunca un valor: «no lo dice» y «desconocido» de la v2 son vacíos.
- **La fuente de cada material**, en `sources`: su id de la v2 y las filas de la v1 de las que salen sus nombres y su familia.

**Para revisar** (0):

- Nada.

**Lo que no entra en esta tanda:** la composición (tanda 2), IFRA (tanda 3), las categorías y los duplicados (tanda 4, con tus decisiones) y lo del laboratorio (tanda 5, en tu cuenta).
