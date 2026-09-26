import glosarioFig from "../../datos/fuente/glosario-fig.csv?raw";
import ifraCat4 from "../../datos/fuente/ifra-cat4.csv?raw";
import inventario from "../../datos/fuente/inventario.csv?raw";
import procedencia from "../../datos/fuente/procedencia.json";
import { buildCatalog } from "./catalog";

/** The catalog of the test bench, built once from the imported lab data. */
export const catalog = buildCatalog({ inventario, ifraCat4, glosarioFig, procedencia });
