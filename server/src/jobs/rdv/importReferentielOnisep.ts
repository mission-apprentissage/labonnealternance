import axios from "axios"
import { pipeline } from "stream/promises"
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
 * @description Gets Catalogue etablissments informations and insert in etablissement collection.
 * @returns {Promise<void>}
 */
export const importReferentielOnisep = async () => {
  logger.info("Cron #importReferentielOnisep started.")

  // Large file of ~50k lines
  const { data } = await axios.get("https://data.lheo.org/export/csv/relations/widget-mna-ideo/widget_mna_ideo", {
    maxContentLength: Infinity,
    responseType: "stream",
  })

  // Check if the file is too light
  const minCsvRowsThreshold = 10000
  let numberOfRows = 0
  await pipeline(
    data,
    parseCsv(),
    transformData(() => {
      numberOfRows += 1
    })
  )

  logger.info("Number of formations in csv file", { numberOfRows, minCsvRowsThreshold })

  if (numberOfRows < minCsvRowsThreshold) {
    await notifyToSlack({
      subject: "IMPORT ONISEP MAPPING (id_action_ideo2 > cle_ministere_educatif)",
      message: `Import du mapping Onisep avorté car le fichier ne comporte pas de formations (suspicions de bug). ${numberOfRows} formations / ${minCsvRowsThreshold} minimum attendu`,
      error: true,
    })
    return
  }

  await ReferentielOnisep.deleteMany()

  await oleoduc(
    data,
    parseCsv(),
    filterData((row: TCsvRow) => row["ID action IDEO2"] && row["Clé ministère éducatif MA"]),
    transformData((row: TCsvRow) => ({
      id_action_ideo2: row["ID action IDEO2"],
      cle_ministere_educatif: row["Clé ministère éducatif MA"],
    })),
    writeData((transformedData) => ReferentielOnisep.create(transformedData), { parallel: 50 })
  )

  logger.info("Cron #importReferentielOnisep done.", { numberOfRows })
}
