# Certificados de los proveedores del usuario

Certificados de conformidad IFRA de productos concretos que el usuario tiene o va a comprar. Los
PDF son los originales; [`certificados.csv`](certificados.csv) los transcribe
[`scripts/leer_certificados.py`](../../../scripts/leer_certificados.py): los topes por categoría
(sección 1) y cada sustancia con su cantidad en el producto (2.1 prohibidas, 2.2 restringidas).
**No se edita a mano.**

| Archivo | Producto | Proveedor | Revisado | Nota |
|---|---|---|---|---|
| `firmenich-castoreum-synth-184004-ifra51.pdf` | Castoreum Synth 184004 | Firmenich (lo vende Perfumiarz) | 2023-08-25 | El castóreo sintético que el usuario piensa comprar; el suyo de hoy es el absoluto natural, sin constituyentes conocidos. Sus 11 alérgenos coinciden con la lista de Perfumiarz (C-003, sin fila en el glosario); el certificado da 20 sustancias |
| `firmenich-black-agar-296985-ifra51.pdf` | Black Agar 296985 | Firmenich | 2023-08-25 | El ejemplo del formato (P61) |

**Cuándo entran en la app:** con el alta de materiales propios (P61, [a-futuro](../../a-futuro.md)).
Entonces la sección 2.2 son los constituyentes del material, y la app los suma por sustancia (§5.3).
**El certificado no manda sobre IFRA:** cada sustancia se juzga con los estándares de `datos/ifra/`.
