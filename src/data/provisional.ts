import glosarioFig from "../../datos/fuente/glosario-fig.csv?raw";
import ifraCat4 from "../../datos/fuente/ifra-cat4.csv?raw";
import procedencia from "../../datos/fuente/procedencia.json";
import { buildCatalog } from "./catalog";

/** The catalog of the test bench, built once from the imported data. No material of the user is read (P36). */
export const catalog = buildCatalog({ ifraCat4, glosarioFig, procedencia });
