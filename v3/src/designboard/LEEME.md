# Copia del runtime de Designboard

Copia de [smortenax/designboard](https://github.com/smortenax/designboard) `main` (hoy `4aa3488`),
porque la v3 no importa nada de fuera de su carpeta (V3-21). La escribe, entera, este comando
lanzado desde designboard:

    npm run copy-runtime -- ../perfumeria-app/v3/src/designboard src/apps/perfumeria

Copia el runtime (`runtime/`, `core/`) y la config del tablero para Perfumería con todo lo que
importa: las piezas del historial, el panel, el orbe, el inicio, los nombres de token y el archivo
de tokens. Cada archivo lleva una cabecera con el commit y la versión del runtime. Aquí no se
edita nada: se cambia en designboard y se vuelve a copiar. `v3/designboard.config.ts` solo
reexporta `apps/perfumeria/designboard.config.ts`.

La composición está en `v3/designboard.composition.json` y la escribe el tablero. Con
`npm run dev`, `HistoryDock` la relee cada segundo, así que lo que se guarda en el tablero se ve
sin recargar.
