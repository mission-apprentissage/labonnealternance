import { createReadStream } from "node:fs"
import { writeFile } from "node:fs/promises"
import { pipeline } from "stream/promises"

import axios from "axios"
import { ObjectId } from "mongodb"
import { filterData, oleoduc, transformData, writeData } from "oleoduc"
import { IReferentielOnisep } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { parseCsv } from "../../common/utils/fileUtils"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"

type TCsvRow = {
  "ID formation MA": string
  "Source IDEO2": string
  "ID formation IDEO2": string
  "ID action IDEO2": string
  "ID enseignement IDEO2": string
  "Clé ministère éducatif MA": string
}

/**
 * @description Retrieve and save un database ONISEP mapping.
 * @returns {Promise<void>}
 */
export const importReferentielOnisep = async () => {
  logger.info("Cron #importReferentielOnisep started.")
  const stats = {
    csvRows: 0,
    minCsvRowsThreshold: 10000,
    beforeImportationDatabaseRows: await getDbCollection("referentieloniseps").estimatedDocumentCount({}),
    afterImportationDatabaseRows: 0,
    filePath: "./widget_mna_ideo.csv",
  }

  // Large file of ~50k lines
  const { data } = await axios.get("https://data.lheo.org/export/csv/relations/widget-mna-ideo/widget_mna_ideo", {
    maxContentLength: Infinity,
  })

  // Save file locally
  await writeFile(stats.filePath, data, { encoding: "utf-8" })

  // Count number of formation before import
  await pipeline(
    createReadStream(stats.filePath, { encoding: "utf-8" }),
    parseCsv(),
    transformData(() => {
      stats.csvRows += 1
    })
  )

  // If there a too few formations, it's probably a bug, we stop the process and send a Slack notification
  if (stats.csvRows < stats.minCsvRowsThreshold) {
    await notifyToSlack({
      subject: "IMPORT ONISEP MAPPING (id_action_ideo2 > cle_ministere_educatif)",
      message: `Import du mapping Onisep avorté car le fichier ne comporte pas de formations (suspicions de bug). ${stats.csvRows} formations / ${stats.minCsvRowsThreshold} minimum attendu`,
      error: true,
    })
    return
  }

  await getDbCollection("referentieloniseps").deleteMany({})

  try {
    await oleoduc(
      createReadStream(stats.filePath, { encoding: "utf-8" }),
      parseCsv(),
      filterData((row: TCsvRow) => row["ID action IDEO2"] && row["Clé ministère éducatif MA"]),
      transformData((row: TCsvRow) => {
        const refOnisep: IReferentielOnisep = {
          _id: new ObjectId(),
          id_action_ideo2: row["ID action IDEO2"],
          cle_ministere_educatif: row["Clé ministère éducatif MA"],
          created_at: new Date(),
        }
        return refOnisep
      }),
      writeData((transformedData: IReferentielOnisep) => getDbCollection("referentieloniseps").insertOne(transformedData), { parallel: 10 })
    )

    stats.afterImportationDatabaseRows = await getDbCollection("referentieloniseps").estimatedDocumentCount({})

    await notifyToSlack({
      subject: "IMPORT ONISEP",
      message: `Import du mapping Onisep — existantes: ${stats.beforeImportationDatabaseRows} / importées: ${stats.afterImportationDatabaseRows}`,
    })
  } catch (error) {
    await notifyToSlack({
      subject: "IMPORT ONISEP",
      message: `Erreur lors de l'import ONISEP`,
      error: true,
    })
    sentryCaptureException(error)
  }
  logger.info("Cron #importReferentielOnisep done.")
}
