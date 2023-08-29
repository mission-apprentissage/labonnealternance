import { LbaCompany, DiplomesMetiers, DomainesMetiers, FormationCatalogue, Recruiter } from "../../../common/model/index.js"
import { rebuildIndex } from "../../../common/utils/esUtils.js"
import { logger } from "../../../common/logger.js"

export const generateIndexes = async (indexList = "recruiters,formationcatalogues,bonnesboites,diplomesmetiers,domainesmetiers") => {
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
        case "lbacompanies": {
          await LbaCompany.syncIndexes()
          await rebuildIndex(LbaCompany, { skipNotFound: true })
          break
        }
        case "formationcatalogues": {
          await FormationCatalogue.syncIndexes()
          await rebuildIndex(FormationCatalogue, { skipNotFound: true })
          break
        }
        case "recruiters": {
          await Recruiter.syncIndexes()
          await rebuildIndex(Recruiter, { skipNotFound: true })
          break
        }
        default: {
          logger.error(`Attention l'index "${index}" ne fait pas partie de la liste elligible`)
          break
        }
      }
    })
  )
}
