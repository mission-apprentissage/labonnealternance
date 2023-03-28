import { BonnesBoites, DiplomesMetiers, DomainesMetiers, FormationCatalogue, Formulaire } from "../../../common/model/index.js"
import { rebuildIndex } from "../../../common/utils/esUtils.js"

export const generateIndexes = async (indexList = "formulaires,formationcatalogues,bonnesboites,diplomesmetiers,domainesmetiers") => {
  const list = indexList.split(",")

  await Promise.all(
    list.map(async (index) => {
      switch (index) {
        case "domainesmetiers": {
          await DomainesMetiers.syncIndexes()
          await rebuildIndex(DomainesMetiers, { skipNotFound: true })
          break
        }
        case "diplomesmetiers": {
          await DiplomesMetiers.syncIndexes()
          await rebuildIndex(DiplomesMetiers, { skipNotFound: true })
          break
        }
        case "bonnesboites": {
          await BonnesBoites.syncIndexes()
          await rebuildIndex(BonnesBoites, { skipNotFound: true })
          break
        }
        case "formationcatalogues": {
          await FormationCatalogue.syncIndexes()
          await rebuildIndex(FormationCatalogue, { skipNotFound: true })
          break
        }
        case "formulaires": {
          await Formulaire.syncIndexes()
          await rebuildIndex(Formulaire, { skipNotFound: true })
          break
        }
        default:
          break
      }
    })
  )
}
