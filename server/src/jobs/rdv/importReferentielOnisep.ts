import axios from "axios"
import { oleoduc, transformData, writeData, filterData } from "oleoduc"
import { logger } from "../../common/logger.js"
import { parseCsv } from "../../common/utils/fileUtils.js"
import { ReferentielOnisep } from "../../common/model/index.js"

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

  const { data } = await axios.get("https://data.lheo.org/export/csv/relations/widget-mna-ideo/widget_mna_ideo", {
    maxContentLength: Infinity,
    responseType: "stream",
  })

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

  logger.info("Cron #importReferentielOnisep done.")
}
