import { createReadStream } from "node:fs"
import { writeFile } from "node:fs/promises"
import { Transform, Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import axios from "axios"
import { ObjectId } from "mongodb"
import type { IReferentielOnisep } from "shared/models/index"

import { logger } from "@/common/logger"
import { parseCsv } from "@/common/utils/fileUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

type TCsvRow = {
  "ID formation MA": string
  "Source IDEO2": string
  "ID formation IDEO2": string
  "ID action IDEO2": string
  "ID enseignement IDEO2": string
  "Clé ministère éducatif MA": string
}

export const importReferentielOnisep = async () => {
  logger.info("Cron #importReferentielOnisep started.")
  const stats = {
    csvRows: 0,
    minCsvRowsThreshold: 10000,
    beforeImportationDatabaseRows: await getDbCollection("referentieloniseps").estimatedDocumentCount({}),
    afterImportationDatabaseRows: 0,
    filePath: "./widget_mna_ideo.csv",
  }

  // Téléchargement du CSV
  const { data } = await axios.get("https://data.lheo.org/export/csv/relations/widget-mna-ideo/widget_mna_ideo", {
    maxContentLength: Infinity,
  })
  await writeFile(stats.filePath, data, { encoding: "utf-8" })

  // Étape 1 — compter les lignes
  await pipeline(
    createReadStream(stats.filePath, { encoding: "utf-8" }),
    parseCsv(),
    new Writable({
      objectMode: true,
      write(_, __, callback) {
        stats.csvRows++
        callback()
      },
    })
  )

  if (stats.csvRows < stats.minCsvRowsThreshold) {
    await notifyToSlack({
      subject: "IMPORT ONISEP MAPPING (id_action_ideo2 > cle_ministere_educatif)",
      message: `Import du mapping Onisep avorté : ${stats.csvRows} lignes / minimum requis : ${stats.minCsvRowsThreshold}`,
      error: true,
    })
    return
  }

  await getDbCollection("referentieloniseps").deleteMany({})

  // Étape 2 — transformer et insérer les lignes valides
  try {
    await pipeline(
      createReadStream(stats.filePath, { encoding: "utf-8" }),
      parseCsv(),
      new Transform({
        objectMode: true,
        transform(row: TCsvRow, _, callback) {
          if (row["ID action IDEO2"] && row["Clé ministère éducatif MA"]) {
            const refOnisep: IReferentielOnisep = {
              _id: new ObjectId(),
              id_action_ideo2: row["ID action IDEO2"],
              cle_ministere_educatif: row["Clé ministère éducatif MA"],
              created_at: new Date(),
            }
            callback(null, refOnisep)
          } else {
            callback() // Skip row
          }
        },
      }),
      new Writable({
        objectMode: true,
        highWaterMark: 10,
        write: async (doc: IReferentielOnisep, _, callback) => {
          try {
            await getDbCollection("referentieloniseps").insertOne(doc)
            callback()
          } catch (err: any) {
            callback(err)
          }
        },
      })
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
