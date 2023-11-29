import { createReadStream } from "fs"
import path from "path"

import { oleoduc, transformData, writeData } from "oleoduc"
import { removeAccents } from "shared"
import { OPCOS } from "shared/constants/recruteur"

import { notifyToSlack } from "@/common/utils/slackUtils"
import { prepareReferentielOpcoForInsert } from "@/services/opco.service"

import __dirname from "../../../../common/dirname"
import { logger } from "../../../../common/logger"
import { ReferentielOpco } from "../../../../common/model/index"
import { fileDownloader, parseCsv } from "../../../../common/utils/fileUtils"
import config from "../../../../config"

const importer = async (filePath: string, opco_label: OPCOS) => {
  logger.info(`Deleting collection entries for ${opco_label}...`)
  await ReferentielOpco.deleteMany({ opco_label })

  logger.info("Importing Data...")

  const stats = {
    error: 0,
    total: 0,
    imported: 0,
  }

  await oleoduc(
    createReadStream(filePath),
    parseCsv({ delimiter: ";", encoding: "latin1" /* identique à ISO-8859-1 */ }),
    transformData((e) => {
      const { Siret } = e
      stats.total++
      const csvEmailStr = e["Email du contact"]
      const emailsArray = removeAccents(csvEmailStr)
        .split(/,|;| /)
        .filter((x) => x)
      const referentielOpt = prepareReferentielOpcoForInsert({ opco_label, siret_code: Siret, emails: emailsArray })
      if (referentielOpt) {
        stats.imported++
        return referentielOpt
      } else {
        logger.error("could not import", { siret: Siret, emails: csvEmailStr })
        stats.error++
        return
      }
    }),
    writeData(
      async (referentiel) => {
        const { siret_code } = referentiel
        await ReferentielOpco.findOneAndUpdate({ siret_code }, { $set: referentiel }, { upsert: true }).lean()
      },
      { parallel: 500 }
    )
  )

  logger.info("Data import done.")
  await notifyToSlack({
    subject: "import referentiel opco Constructys",
    message: `${stats.total} documents. ${stats.error} erreurs. ${stats.imported} mises à jour`,
    error: stats.error > 0,
  })
  return stats
}

export const importReferentielOpcoFromConstructys = async () => {
  logger.info("Constructys data import starting...")

  logger.info("Downloading file...")
  const dirname = __dirname(import.meta.url)
  const filePath = path.resolve(dirname, "./constructys-data.csv")
  const remoteFileName = "CTYS_MATCHA.csv"
  await fileDownloader(filePath, remoteFileName, config.ftp.constructys)

  logger.info("Importing file...")
  const opco_label = OPCOS.CONSTRUCTYS
  const result = await importer(filePath, opco_label)
  return result
}
