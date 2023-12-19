import { oleoduc, transformData, writeData } from "oleoduc"
import { ILbaCompany, ZLbaCompany } from "shared/models/lbaCompany.model"

import { checkIsDiffusible } from "@/services/etablissement.service"

import { LbaCompany, UnsubscribedLbaCompany } from "../../common/model"
import { rebuildIndex } from "../../common/utils/esUtils"
import { logMessage } from "../../common/utils/logMessage"
import { notifyToSlack } from "../../common/utils/slackUtils"

import {
  checkIfAlgoFileIsNew,
  countCompaniesInFile,
  createAssetsFolder,
  downloadAlgoCompanyFile,
  getCompanyMissingData,
  readCompaniesFromJson,
  removePredictionFile,
} from "./lbaCompaniesUtils"
import { insertSAVECompanies, removeSAVECompanies, updateSAVECompanies } from "./updateSAVECompanies"

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

  const unsubscribedLbaCompany = await UnsubscribedLbaCompany.findOne({ siret: rawCompany.siret }, { siret: 1, _id: 0 })
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
          const parsedCompany = ZLbaCompany.parse(lbaCompany.toObject())
          // contourne mongoose pour éviter la réindexation systématique à chaque insertion.
          await LbaCompany.collection.insertOne(new LbaCompany(parsedCompany))
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
  BuildIndex = false,
  UseSave = false,
  ForceRecreate = false,
  SourceFile = null,
}: {
  UseAlgoFile?: boolean
  ClearMongo?: boolean
  BuildIndex?: boolean
  UseSave?: boolean
  ForceRecreate?: boolean
  SourceFile?: string | null
}) {
  try {
    logMessage("info", " -- Start updating lbb db with new algo -- ")

    console.log("UseAlgoFile : ", UseAlgoFile, " - ClearMongo : ", ClearMongo, " - BuildIndex : ", BuildIndex, " - UseSave : ", UseSave, " - ForceRecreate : ", ForceRecreate)

    if (UseAlgoFile) {
      if (!ForceRecreate) {
        await checkIfAlgoFileIsNew("algo companies")
      }

      await createAssetsFolder()

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
      await LbaCompany.deleteMany({})
    }

    if (UseAlgoFile) {
      await processCompanies()
    }

    if (UseSave) {
      await insertSAVECompanies()
      await updateSAVECompanies()
      await removeSAVECompanies()
    }

    if (BuildIndex) {
      await rebuildIndex(LbaCompany, { skipNotFound: true, recreate: true })
    }

    logMessage("info", `End updating lbb db`)

    await notifyToSlack({ subject: "IMPORT SOCIETES ISSUES DE L'ALGO", message: `Import sociétés issues de l'algo terminé. ${count} sociétés importées`, error: false })
  } catch (err) {
    logMessage("error", err)
  } finally {
    await cleanUp()
  }
}
