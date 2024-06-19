import { createReadStream } from "fs"
import path from "path"

import Joi from "joi"
import { ObjectId } from "mongodb"
import { filterData, oleoduc, transformData, writeData } from "oleoduc"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import __dirname from "../../../../common/dirname"
import { logger } from "../../../../common/logger"
import { fileDownloader, parseCsv } from "../../../../common/utils/fileUtils"
import config from "../../../../config"
import { runScript } from "../../../scriptWrapper"

const importer = async (filePath, remoteFileName, opco_label) => {
  logger.info("Downloading file...")
  await fileDownloader(filePath, remoteFileName, config.ftp.ocapiat)

  logger.info(`Deleting collection entries for ${opco_label}...`)
  await getDbCollection("referentielopcos").deleteMany({ opco_label })

  logger.info("Importing Data...")

  const stat = {
    error: 0,
    total: 0,
    imported: 0,
  }

  await oleoduc(
    createReadStream(filePath),
    parseCsv({ trim: true, delimiter: ";" }),
    filterData((e) => e["Email du contact"]),
    transformData((e) => {
      const emails: string[] = []

      const Siret = e.Siret
      const email = e["Email du contact"]
      const emailAsArray = email.split(/,|;| /).filter((x) => x)

      for (const email of emailAsArray) {
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
        await getDbCollection("referentielopcos").insertOne({ _id: new ObjectId(), opco_label, siret_code, emails })
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
  const filePath = path.resolve(dirname, "./ocapiat-data.csv")
  const remoteFileName = "ContactsEntreprisesOPSIcsv.csv"
  const opco_label = "OCAPIAT"

  const result = await importer(filePath, remoteFileName, opco_label)
  return result
})
