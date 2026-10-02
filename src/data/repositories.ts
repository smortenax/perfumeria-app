import { IFRA_FILES, v2Dataset } from "../v2/data";
import { v2RepositoryOf } from "../v2/repository";
import { catalog } from "./provisional";
import { repositoryOf, type MaterialRepository, type ModelVersion } from "./repository";

const v1 = repositoryOf("v1", catalog);
let v2: MaterialRepository | null = null;

/** The repository of a model: v1, the glossary; v2, datos/v2/, built the first time it is asked for. */
export function repositoryFor(version: ModelVersion): MaterialRepository {
  if (version === "v1") {
    return v1;
  }
  if (!v2) {
    const data = v2Dataset();
    // The date of the last alta that wrote the data.
    const generated = data.ids.reduce((last, e) => (e.added > last ? e.added : last), "");
    v2 = v2RepositoryOf(data, IFRA_FILES, generated);
  }
  return v2;
}
