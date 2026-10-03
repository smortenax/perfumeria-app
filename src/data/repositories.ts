import { IFRA_FILES, v2Dataset } from "../v2/data";
import { v2RepositoryOf } from "../v2/repository";
import { catalog } from "./provisional";
import { mergedRepository } from "./merged";
import { repositoryOf, type MaterialRepository, type ModelVersion } from "./repository";

const v1 = repositoryOf("v1", catalog);
let v2: MaterialRepository | null = null;
let reviewed: MaterialRepository | null = null;

/** Only what datos/v2/ has, reviewed: built the first time it is asked for. */
export function reviewedV2(): MaterialRepository {
  if (!reviewed) {
    const data = v2Dataset();
    // The date of the last alta that wrote the data.
    const generated = data.ids.reduce((last, e) => (e.added > last ? e.added : last), "");
    reviewed = v2RepositoryOf(data, IFRA_FILES, generated);
  }
  return reviewed;
}

/**
 * The repository of a model: v1, the glossary, as it was; v2, the one of the app since Phase 5: every material of datos/v2/ and,
 * marked «v1, sin revisar», those that only the glossary has, with their IFRA as before.
 */
export function repositoryFor(version: ModelVersion): MaterialRepository {
  if (version === "v1") {
    return v1;
  }
  v2 ??= mergedRepository(v1, reviewedV2(), v2Dataset());
  return v2;
}
