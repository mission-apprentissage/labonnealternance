import { BonnesBoites, DiplomesMetiers, DomainesMetiers, FormationCatalogue, Formulaire } from "../../../common/model/index.js"
import { rebuildIndex } from "../../../common/utils/esUtils.js"

export const generateIndexes = async () => {
  await Formulaire.syncIndexes()
  await rebuildIndex(Formulaire, { skipNotFound: true })
  await FormationCatalogue.syncIndexes()
  await rebuildIndex(FormationCatalogue, { skipNotFound: true })
  await BonnesBoites.syncIndexes()
  await rebuildIndex(BonnesBoites, { skipNotFound: true })
  await DiplomesMetiers.syncIndexes()
  await rebuildIndex(DiplomesMetiers, { skipNotFound: true })
  await DomainesMetiers.syncIndexes()
  await rebuildIndex(DomainesMetiers, { skipNotFound: true })
}
