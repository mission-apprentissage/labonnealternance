import { oleoduc, writeData } from "oleoduc"

import { logger } from "../../common/logger"
import { FormationCatalogue } from "../../common/model/index"
import { rebuildIndex, resetIndexAndDb } from "../../common/utils/esUtils"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import { countFormations, getAllFormationsFromCatalogue } from "../../services/catalogue.service"

const importFormations = async () => {
  logger.info(`Début import`)

  const stats = {
    total: 0,
    created: 0,
    failed: 0,
  }

  try {
    await oleoduc(
      await getAllFormationsFromCatalogue(),
      writeData(async (formation) => {
        stats.total++
        try {
          // use MongoDB to add only add selected field from getAllFormationFromCatalogue() function and speedup the process
          // @ts-expect-error: TODO
          await FormationCatalogue.collection.insertOne(formation)
          stats.created++
        } catch (e) {
          stats.failed++
        }
      }),
      { parallel: 500 }
    )

    return stats
  } catch (error) {
    // stop here if not able to get trainings (keep existing ones)
    logger.error(`Error fetching formations from Catalogue`, error)
    throw new Error("Error fetching formations from Catalogue")
  }
}

export const importCatalogueFormationJob = async () => {
  logger.info(" -- Import formations catalogue -- ")

  try {
    const countCatalogue = await countFormations()

    // if catalogue is empty, stop the process
    if (!countCatalogue) {
      await notifyToSlack({
        subject: "IMPORT FORMATION",
        message: `Import formations catalogue annulée: aucunes formations recensées sur le catalogue. (Erreur disponibilité API catalogue)`,
      })
      return
    }

    await resetIndexAndDb("formationcatalogues", FormationCatalogue, { requireAsciiFolding: true })

    const stats = await importFormations()

    await rebuildIndex(FormationCatalogue)

    logger.info(`Fin traitement`)

    await notifyToSlack({ subject: "IMPORT FORMATION", message: `Import formations catalogue terminé. ${stats.created} OK. ${stats.failed} erreur(s)`, error: false })

    return {
      result: "Import formations catalogue terminé",
      nb_formations: stats.created,
      erreurs: stats.failed,
    }
  } catch (error) {
    sentryCaptureException(error)
    logger.error(error)
    await notifyToSlack({ subject: "IMPORT FORMATION", message: `ECHEC Import formations catalogue`, error: true })
  }
}
