# perfumeria-app

App de **formulación de perfumería**: formular, documentar cada fórmula con su historia y
comprobar IFRA por sustancia, **sin conexión**. Primero un ejecutable de Windows (Tauri 2);
el móvil, después.

| | |
|---|---|
| 📐 **[Decisiones](docs/decisiones.md)** | **Lo que manda**: qué es la app y cómo se comporta. v3, 2026-09-25 |
| 🗺️ **[Plan de desarrollo](docs/plan-desarrollo.md)** | El orden de trabajo y cuándo está lista la formulación |
| ❓ [Interrogatorio](docs/interrogatorio.md) | De dónde sale cada decisión, con la respuesta literal del usuario |
| 🗂️ [Antecedentes](docs/antecedentes/README.md) | Lo escrito antes, **no vinculante**: Formulair, el primer brief, el lenguaje visual, el Banco v2 |

## Los datos

**Vienen del laboratorio**, [`perfumeria-lab`](https://github.com/smortenax/perfumeria-lab), y
los trae [`scripts/importar_datos.py`](scripts/importar_datos.py) a `datos/fuente/`, con un
`procedencia.json` que dice **de qué commit** salen. **No se editan a mano.**

| Archivo | Qué es para la app |
|---|---|
| `ifra-cat4.csv` | IFRA: techo de categoría 4, tipo de estándar, condiciones y constituyentes regulados. **La única fuente de IFRA** |
| `niveles-de-uso.csv` | Poder olfativo, consenso y dosis recomendada por material |
| `limites-de-uso.csv` | Rangos del proveedor, con su base y su naturaleza: **no es IFRA** |
| `inventario.csv` | Los materiales del laboratorio, generado desde sus fichas |
| `glosario-fig.csv` | Descriptores oficiales IFRA FIG por CAS |
| `leeme-*.md` · `fig-descriptores.md` | **Qué significa cada columna**, copiado del laboratorio: cómo se lee `ifra-cat4.csv`, los niveles de uso, y el FIG con sus 27 descriptores y **la cita obligatoria de IFRA** |

🔴 **La regla 1.1 —todo número con su base— vale igual para los CSV.**

## Para arrancarla

```bash
npm install
npm run tauri dev
```

`npm run tauri build` genera el instalador de Windows en `src-tauri/target/release/bundle/`.
El código va en inglés y la interfaz en español, desde [`src/i18n/es.ts`](src/i18n/es.ts).

`npm test` pasa las pruebas del núcleo (`src/core/`): TypeScript puro, sin pantallas.

**Estado:** fases 1 y 2 terminadas: el esqueleto de Tauri 2 y el núcleo, con F-001-v1
reproducida al miligramo. El diseño avanza en paralelo, en el
[lienzo de bocetos](https://claude.ai/artifact/RXLX4e5WKR6xFNApMeyphj). Lo siguiente es la
fase 3: el paquete de datos de referencia.
