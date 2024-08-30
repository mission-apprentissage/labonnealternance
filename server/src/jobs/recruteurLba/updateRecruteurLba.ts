import { oleoduc, transformData, writeData } from "oleoduc"
import { ILbaCompany, ZLbaCompany } from "shared/models/recruteurLba.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { logMessage } from "../../common/utils/logMessage"
import { notifyToSlack } from "../../common/utils/slackUtils"

import { checkIfAlgoFileIsNew, countCompaniesInFile, downloadAlgoCompanyFile, getCompanyMissingData, readCompaniesFromJson, removePredictionFile } from "./recruteurLbaUtil"

// nombre minimal arbitraire de sociétés attendus dans le fichier
const MIN_COMPANY_THRESHOLD = 200000

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

const processCompanies = async () => {
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

export default async function updateLbaCompanies({
  useAlgoFile = false,
  clearMongo = false,
  forceRecreate = false,
  sourceFile = null,
}: {
  useAlgoFile?: boolean
  clearMongo?: boolean
  forceRecreate?: boolean
  sourceFile?: string | null
}) {
  try {
    logger.info("Start updateLbaCompanies jobs ")
    console.info({ useAlgoFile, clearMongo, forceRecreate })
    if (useAlgoFile) {
      if (!forceRecreate) {
        await checkIfAlgoFileIsNew("algo companies")
      }

      await downloadAlgoCompanyFile(sourceFile)

      if (!forceRecreate) {
        const companyCount = await countCompaniesInFile()
        if (companyCount < MIN_COMPANY_THRESHOLD) {
          await notifyToSlack({
            subject: "IMPORT SOCIETES ISSUES DE L'ALGO",
            message: `Import sociétés issues de l'algo avorté car le fichier ne comporte pas assez de sociétés. ${companyCount} sociétés / ${MIN_COMPANY_THRESHOLD} minimum attendu`,
            error: true,
          })
          throw new Error(`Nombre de sociétés insuffisant : ${companyCount}`)
        }
      }
    }

    if (clearMongo) {
      logger.info("Clear recruteurlba collection")
      await getDbCollection("recruteurslba").deleteMany({})
    }

    if (useAlgoFile) {
      await processCompanies()
    }

    logger.info("End updateLbaCompanies jobs ")

    await notifyToSlack({ subject: "IMPORT SOCIETES ISSUES DE L'ALGO", message: `Import sociétés issues de l'algo terminé. ${count} sociétés importées`, error: false })
  } catch (err) {
    logger.error(err)
  } finally {
    await cleanUp()
  }
}
