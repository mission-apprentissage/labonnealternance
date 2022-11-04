import { Formulaire } from "../../../common/model/index.js";
import { rebuildIndex } from "../../../common/utils/esUtils.js";

export const generateIndexes = async () => {
  await Formulaire.syncIndexes();
  await rebuildIndex("formulaires", Formulaire);
};
