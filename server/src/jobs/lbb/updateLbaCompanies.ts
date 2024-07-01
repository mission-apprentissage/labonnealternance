import { oleoduc, transformData, writeData } from "oleoduc"
import { ILbaCompany, ZLbaCompany } from "shared/models/lbaCompany.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { checkIsDiffusible } from "@/services/etablissement.service"

import { logMessage } from "../../common/utils/logMessage"
import { notifyToSlack } from "../../common/utils/slackUtils"

import { checkIfAlgoFileIsNew, countCompaniesInFile, downloadAlgoCompanyFile, getCompanyMissingData, readCompaniesFromJson, removePredictionFile } from "./lbaCompaniesUtils"

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

  if (!rawCompany.enseigne) {
    logMessage("error", `Error processing company. Company ${rawCompany.siret} has no name`)
    return null
  }

  if (await !checkIsDiffusible(rawCompany.siret)) {
    return null
  }

  const unsubscribedLbaCompany = await getDbCollection("unsubscribedbonnesboites").findOne(
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
          await getDbCollection("bonnesboites").insertOne(parsedCompany)
        }
      } catch (err) {
        logMessage("error", err)
      }
    })
  )
}

export default async function updateLbaCompanies({
  UseAlgoFile = false,
  ClearMongo = false,
  ForceRecreate = false,
  SourceFile = null,
}: {
  UseAlgoFile?: boolean
  ClearMongo?: boolean
  ForceRecreate?: boolean
  SourceFile?: string | null
}) {
  try {
    logMessage("info", " -- Start updating lbb db with new algo -- ")

    console.info("UseAlgoFile : ", UseAlgoFile, " - ClearMongo : ", ClearMongo, " - ForceRecreate : ", ForceRecreate)

    if (UseAlgoFile) {
      if (!ForceRecreate) {
        await checkIfAlgoFileIsNew("algo companies")
      }

      await downloadAlgoCompanyFile(SourceFile)

      if (!ForceRecreate) {
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

    if (ClearMongo) {
      logMessage("info", `Clearing bonnesboites db...`)
      await getDbCollection("bonnesboites").deleteMany({})
    }

    if (UseAlgoFile) {
      await processCompanies()
    }

    logMessage("info", `End updating lbb db`)

    await notifyToSlack({ subject: "IMPORT SOCIETES ISSUES DE L'ALGO", message: `Import sociétés issues de l'algo terminé. ${count} sociétés importées`, error: false })
  } catch (err) {
    logMessage("error", err)
  } finally {
    await cleanUp()
  }
}
