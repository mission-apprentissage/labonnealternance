import { createReadStream } from "fs"
import path from "path"

import Joi from "joi"
import { filterData, oleoduc, transformData, writeData } from "oleoduc"

import __dirname from "../../../../common/dirname"
import { logger } from "../../../../common/logger"
import { ReferentielOpco } from "../../../../common/model/index"
import { fileDownloader, parseCsv } from "../../../../common/utils/fileUtils"
import config from "../../../../config"
import { runScript } from "../../../scriptWrapper"

const importer = async (filePath, remoteFileName, opco_label) => {
  logger.info("Downloading file...")
  await fileDownloader(filePath, remoteFileName, config.ftp.constructys)

  logger.info(`Deleting collection entries for ${opco_label}...`)
  await ReferentielOpco.deleteMany({ opco_label })

  logger.info("Importing Data...")

  const stat = {
    error: 0,
    total: 0,
    imported: 0,
  }

  await oleoduc(
    createReadStream(filePath),
    parseCsv(),
    filterData((e) => e.Mails),
    transformData((e) => {
      const emails: string[] = []
      const { Siret, Mails } = e

      const emailsArray = Mails.split(/,|;| /).filter((x) => x)
      const emailsArrayDuplicateFree = [...new Set(emailsArray)]

      for (const email of emailsArrayDuplicateFree) {
        stat.total++
        const { error, value } = Joi.string().email().validate(email, { abortEarly: false })

        if (error) {
          stat.error++
          return
        }

        stat.imported++
        emails.push(value)
      }

      return { siret_code: Siret, emails: [...new Set(emails)] }
    }),
    writeData(
      async ({ siret_code, emails }) => {
        await ReferentielOpco.create({ opco_label, siret_code, emails })
      },
      { parallel: 500 }
    )
  )

  logger.info("Data import done.")
  return stat
}

runScript(async () => {
  logger.info("Constructys data import starting...")
  const dirname = __dirname(import.meta.url)
  const filePath = path.resolve(dirname, "./constructys-data.csv")
  const remoteFileName = "CTYS_MATCHA.csv"
  const opco_label = "Constructys"

  const result = await importer(filePath, remoteFileName, opco_label)
  return result
})
