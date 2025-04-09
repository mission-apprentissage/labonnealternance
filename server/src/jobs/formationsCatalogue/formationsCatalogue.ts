import { ObjectId } from "mongodb"
import { oleoduc, writeData } from "oleoduc"
import { zFormationCatalogueSchemaNew } from "shared/models/index"

import { convertStringCoordinatesToGeoPoint } from "@/common/utils/geolib"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
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
          delete formation._id // break parsing / insertion otherwise
          formation.lieu_formation_geopoint = convertStringCoordinatesToGeoPoint(formation.lieu_formation_geo_coordonnees)
          const parsedFormation = zFormationCatalogueSchemaNew.parse(formation)

          await getDbCollection("formationcatalogues").insertOne({ _id: new ObjectId(), ...parsedFormation })
          stats.created++
        } catch (e) {
          logger.error("Erreur enregistrement de formation", e)
          stats.failed++
        }
      }),
      { parallel: 10 }
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

    await getDbCollection("formationcatalogues").deleteMany({})

    const stats = await importFormations()

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
