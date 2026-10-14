# Tanda 8 · Tu versión de cada material, en tu cuenta

*Generada por `migracion-v3/tanda-8-tu-version.ts` desde `../Perfumery/biblioteca/materiales.sqlite` (commit `c0e81e3` del laboratorio, abierto solo para leer), la v2 (commit `d4c1e55`) y la tanda 7 aprobada (`v3/datos/materials.csv`). **No va a `v3/datos/`**: es tuya (V3-15, V3-36). Con tu visto bueno, `aprobar.ts --cuenta` la apunta y `cargar-laboratorio.ts <tu correo>` la carga en tu cuenta.*

**Qué entra:**

- **111 versiones tuyas** (`materials.csv`), una por material del laboratorio, cada una sobre su común de la tanda 7 (`based_on_id`, V3-5): heredan su identidad, su ficha general y su IFRA, y añaden lo tuyo.
  - **Tu frasco** (110): tienda, producto, página, grado y casa declarada; sus notas, como «Frasco: …».
  - **Lo de tu material concreto que la tanda 7 apartó** (V3-43): 424 frases de los textos generales, en el mismo campo. La parte general de cada texto coincide con la aprobada en la tanda 7 (0 diferencias).
  - **El IFRA de segunda mano** (V3-32), en 107: el tipo y el estándar «· sin verificar», sin cifras; 74 notas de condición con cifras se quedan en el laboratorio. Su conflicto pendiente, como «en disputa».
- **Las filas de tu material** que la tanda 7 apartó (V3-43): 83 descriptores, 75 relaciones, 0 perfumes de referencia y 1 dosis.
- **Lo que declaran los certificados de tus productos** (V3-39): 62 filas de composición (autoridad `product`; D12: cifras del producto tal como se compra), de 9 materiales, 14 con un material tuyo como componente y 48 con la sustancia por su CAS y su nombre; 13 topes del fabricante, y 2 afirmaciones de una especificación (el cade rectificado, por consenso: supuesta).
- **Tu laboratorio** (V3-36): 110 «lo tengo», 51 diluciones, 107 catas y 132 ejes.

**Lo que no entra:** la composición del laboratorio (V3-33), las voces (V3-40) y la dilución de compra de tus frascos (no se registra: la dilución se elige en la app).

**Para revisar** (2):

- MAT-resinoide-benjui: un frasco del laboratorio sin porcentaje («puro (100 %) — Benzoin Siam Resinoid de IFF, comprado a Perf…») es el frasco puro, no una dilución: va a las notas de tu versión.
- MAT-salvia-officinalis: un frasco del laboratorio sin porcentaje («puro — 5 ml comprados, sin pesar; 0,699 g gastados en la dil…») es el frasco puro, no una dilución: va a las notas de tu versión.
