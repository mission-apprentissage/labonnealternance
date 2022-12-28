import Sentry from "@sentry/node"
import { oleoduc, writeData } from "oleoduc"
import { countFormations, getAllFormationsFromCatalogue } from "../../common/components/catalogue.js"
import { logger } from "../../common/logger.js"
import { FormationCatalogue } from "../../common/model/index.js"
import { rebuildIndex, resetIndexAndDb } from "../../common/utils/esUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"

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

export default async function () {
  logger.info(" -- Import formations catalogue -- ")

  try {
    const countCatalogue = await countFormations()

    // if catalogue is empty, stop the process
    if (!countCatalogue) return

    await resetIndexAndDb("formationcatalogues", FormationCatalogue, { requireAsciiFolding: true })

    const stats = await importFormations()

    await rebuildIndex(FormationCatalogue)

    logger.info(`Fin traitement`)

    await notifyToSlack({ subject: "IMPORT FORMATION", message: `Import formations catalogue terminé. ${stats.created} OK. ${stats.failed} erreur(s)` })

    return {
      result: "Import formations catalogue terminé",
      nb_formations: stats.created,
      erreurs: stats.failed,
    }
  } catch (error) {
    Sentry.captureException(error)
    logger.error(error)
    await notifyToSlack({ subject: "IMPORT FORMATION", message: `ECHEC Import formations catalogue` })
  }
}
