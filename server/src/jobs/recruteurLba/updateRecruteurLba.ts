import { oleoduc, transformData, writeData } from "oleoduc"
import { ILbaCompany, ZLbaCompany } from "shared/models/recruteurLba.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { logMessage } from "../../common/utils/logMessage"
import { notifyToSlack } from "../../common/utils/slackUtils"

import {
  checkIfAlgoFileIsNew,
  getCompanyMissingData,
  getRecruteursLbaFileFromS3,
  readCompaniesFromJson,
  removePredictionFile,
  verifyRecruteurLBAAlgoFileDataVolume,
} from "./recruteurLbaUtil"

let count = 0

const cleanUp = async () => {
  // clearing memory and reseting params
  count = 0
  await removePredictionFile()
}

const printProgress = () => {
  if (count % 5000 === 0) {
    logMessage("info", ` -- update ${count}`)
  }
}

const prepareCompany = async (rawCompany): Promise<ILbaCompany | null> => {
  count++
  printProgress()
  rawCompany.siret = rawCompany.siret.toString().padStart(14, "0")
  if (!rawCompany.enseigne && rawCompany.raison_sociale) {
    rawCompany.enseigne = rawCompany.raison_sociale
  }

  rawCompany.phone = rawCompany.phone ? rawCompany.phone.toString().padStart(10, "0") : null
  rawCompany.zip_code = rawCompany.zip_code ? rawCompany.zip_code.toString().padStart(5, "0") : null

  if (!rawCompany.enseigne) {
    logMessage("error", `Error processing company. Company ${rawCompany.siret} has no name`)
    return null
  }

  const unsubscribedLbaCompany = await getDbCollection("unsubscribedrecruteurslba").findOne(
    { siret: rawCompany.siret },
    {
      projection: {
        siret: 1,
        _id: 0,
      },
    }
  )
  if (unsubscribedLbaCompany) {
    return null
  }

  const company = await getCompanyMissingData(rawCompany)

  return company
}

const processAlgoCompanies = async () => {
  await oleoduc(
    await readCompaniesFromJson(),
    transformData((company) => prepareCompany(company), { parallel: 8 }),
    writeData(async (lbaCompany) => {
      try {
        if (lbaCompany) {
          const parsedCompany = ZLbaCompany.parse(lbaCompany)
          await getDbCollection("recruteurslba").insertOne(parsedCompany)
        }
      } catch (err) {
        logMessage("error", err)
      }
    })
  )
}

export default async function importRecruteurLBAFromAlgoFile({ clearMongo = false, sourceFile = null }: { clearMongo?: boolean; sourceFile?: string | null }) {
  try {
    logger.info("Start importRecruteurLBAFromAlgoFile jobs ")
    logger.info(`recruteurslba collection clear : ${clearMongo}`)

    if (clearMongo) {
      logger.info("Clear recruteurlba collection")
      await getDbCollection("recruteurslba").deleteMany({})
    }

    await checkIfAlgoFileIsNew("algo companies")
    await getRecruteursLbaFileFromS3(sourceFile)
    await verifyRecruteurLBAAlgoFileDataVolume()
    await processAlgoCompanies()

    logger.info("End importRecruteurLBAFromAlgoFile jobs ")

    await notifyToSlack({ subject: "IMPORT SOCIETES ISSUES DE L'ALGO", message: `Import sociétés issues de l'algo terminé. ${count} sociétés importées`, error: false })
  } catch (err) {
    logger.error(err)
  } finally {
    await cleanUp()
  }
}
