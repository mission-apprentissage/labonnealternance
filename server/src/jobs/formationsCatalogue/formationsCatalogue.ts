import { Transform, Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import { ObjectId } from "mongodb"
import { zFormationCatalogueSchemaNew } from "shared/models/index"
import streamJson from "stream-json"

import streamers from "stream-json/streamers/StreamArray.js"

import { logger } from "@/common/logger"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { countFormations, getAllFormationsFromCatalogue } from "@/services/catalogue.service"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { convertStringCoordinatesToGeoPoint } from "@/common/utils/geolib"

export const importCatalogueFormationJob = async () => {
  logger.info(" -- Import formations catalogue -- ")
  const stats = {
    total: 0,
    created: 0,
    failed: 0,
  }

  try {
    const countCatalogue = await countFormations()
    if (!countCatalogue) {
      await notifyToSlack({
        subject: "IMPORT FORMATION",
        message: `Import formations catalogue annulée: aucunes formations recensées sur le catalogue. (Erreur disponibilité API catalogue)`,
      })
      return
    }

    await getDbCollection("formationcatalogues").deleteMany({})

    const formationsStream = await getAllFormationsFromCatalogue()

    await pipeline(
      formationsStream,
      streamJson.parser(),
      streamers.streamArray(),
      new Transform({
        objectMode: true,
        transform(chunk, _encoding, callback) {
          callback(null, chunk.value)
        },
      }),
      new Writable({
        objectMode: true,
        async write(formation, _encoding, callback) {
          stats.total++
          try {
            delete formation._id
            formation.lieu_formation_geopoint = convertStringCoordinatesToGeoPoint(formation.lieu_formation_geo_coordonnees)

            const parsedFormation = zFormationCatalogueSchemaNew.parse(formation)

            await getDbCollection("formationcatalogues").insertOne({
              _id: new ObjectId(),
              ...parsedFormation,
            })

            stats.created++
          } catch (e) {
            logger.error(e, "Erreur enregistrement de formation")
            stats.failed++
          }

          callback()
        },
      })
    )

    logger.info(`Fin traitement`)
    await notifyToSlack({
      subject: "IMPORT FORMATION",
      message: `Import formations catalogue terminé. ${stats.created} OK. ${stats.failed} erreur(s)`,
      error: false,
    })

    return {
      result: "Import formations catalogue terminé",
      nb_formations: stats.created,
      erreurs: stats.failed,
    }
  } catch (error) {
    sentryCaptureException(error)
    logger.error(error)
    await notifyToSlack({
      subject: "IMPORT FORMATION",
      message: `ECHEC Import formations catalogue`,
      error: true,
    })
  }
}
