import estandarCas from "../../datos/ifra/51/estandar-cas.csv?raw";
import estandares from "../../datos/ifra/51/estandares.csv?raw";
import { loadDataset } from "./load.ts";
import type { Dataset } from "./model.ts";
import type { IfraFiles } from "./to-ifra.ts";

/**
 * The v2 data as the app ships it: the CSV files of datos/v2/, read at build time, and IFRA's
 * files for the limits. `npm run validar:v2` has already passed on them before every commit.
 */
const files = import.meta.glob<string>("../../datos/v2/*.csv", { query: "?raw", import: "default", eager: true });

export function v2Dataset(): Dataset {
  const { dataset, issues } = loadDataset((file) => files[`../../datos/v2/${file}`] ?? null);
  if (issues.length > 0) {
    throw new Error(`datos/v2: ${issues.map((i) => `${i.file}:${i.line} ${i.message}`).join("; ")}`);
  }
  return dataset;
}

export const IFRA_FILES: IfraFiles = { estandares, estandarCas, amendment: "51" };
