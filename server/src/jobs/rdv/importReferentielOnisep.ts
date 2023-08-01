import axios from "axios"
import { pipeline } from "stream/promises"
import { createReadStream } from "node:fs"
import { writeFile } from "node:fs/promises"
import { oleoduc, transformData, writeData, filterData } from "oleoduc"
import { logger } from "../../common/logger.js"
import { parseCsv } from "../../common/utils/fileUtils.js"
import { ReferentielOnisep } from "../../common/model/index.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"

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
    beforeImportationDatabaseRows: await ReferentielOnisep.estimatedDocumentCount({}),
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

  await ReferentielOnisep.deleteMany({})

  await oleoduc(
    createReadStream(stats.filePath, { encoding: "utf-8" }),
    parseCsv(),
    filterData((row: TCsvRow) => row["ID action IDEO2"] && row["Clé ministère éducatif MA"]),
    transformData((row: TCsvRow) => {
      return {
        id_action_ideo2: row["ID action IDEO2"],
        cle_ministere_educatif: row["Clé ministère éducatif MA"],
      }
    }),
    writeData((transformedData) => ReferentielOnisep.create(transformedData), { parallel: 50 })
  )

  stats.afterImportationDatabaseRows = await ReferentielOnisep.estimatedDocumentCount({})

  logger.info("Cron #importReferentielOnisep done.", stats)
}
