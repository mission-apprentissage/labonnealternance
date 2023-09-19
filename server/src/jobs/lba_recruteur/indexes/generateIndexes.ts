import { logger } from "../../../common/logger"
import { DiplomesMetiers, DomainesMetiers, FormationCatalogue, LbaCompany, Recruiter } from "../../../common/model/index"
import { rebuildIndex } from "../../../common/utils/esUtils"

export const generateIndexes = async (payload) => {
  const indexList = payload?.index_list ?? "recruiters,formationcatalogues,bonnesboites,diplomesmetiers,domainesmetiers"
  const recreate = payload?.recreate ?? false
  const list = indexList.split(",")

  await Promise.all(
    list.map(async (index) => {
      switch (index) {
        case "domainesmetiers": {
          await DomainesMetiers.syncIndexes()
          await rebuildIndex(DomainesMetiers, { skipNotFound: true, recreate })
          break
        }
        case "diplomesmetiers": {
          await DiplomesMetiers.syncIndexes()
          await rebuildIndex(DiplomesMetiers, { skipNotFound: true, recreate })
          break
        }
        case "lbacompanies": {
          await LbaCompany.syncIndexes()
          await rebuildIndex(LbaCompany, { skipNotFound: true, recreate })
          break
        }
        case "formationcatalogues": {
          await FormationCatalogue.syncIndexes()
          await rebuildIndex(FormationCatalogue, { skipNotFound: true, recreate })
          break
        }
        case "recruiters": {
          await Recruiter.syncIndexes()
          await rebuildIndex(Recruiter, { skipNotFound: true, recreate })
          break
        }
        default: {
          logger.error(`Attention l'index "${index}" ne fait pas partie de la liste elligible : recruiters,formationcatalogues,lbacompanies,diplomesmetiers,domainesmetiers`)
          break
        }
      }
    })
  )
}
