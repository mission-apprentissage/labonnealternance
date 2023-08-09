// @ts-nocheck
import { oleoduc, transformData, writeData } from "oleoduc"
import _ from "lodash-es"
import { BonnesBoites, UnsubscribedBonneBoite } from "../../db/index.js"
import { rebuildIndex } from "../../common/utils/esUtils.js"
import { logMessage } from "../../common/utils/logMessage.js"
import { insertSAVECompanies, updateSAVECompanies, removeSAVECompanies } from "./updateSAVECompanies.js"

import { countCompaniesInFile, downloadAlgoCompanyFile, getCompanyMissingData, checkIfAlgoFileIsNew, readCompaniesFromJson, removePredictionFile } from "./bonnesBoitesUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"

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

const prepareCompany = async (rawCompany) => {
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

  const unsubscribedBonneBoite = await UnsubscribedBonneBoite.findOne({ siret: rawCompany.siret }, { siret: 1, _id: 0 })
  if (unsubscribedBonneBoite) {
    return null
  }

  const company = await getCompanyMissingData(rawCompany)

  return company
}

const processCompanies = async () => {
  await oleoduc(
    await readCompaniesFromJson(),
    transformData((company) => prepareCompany(company), { parallel: 8 }),
    writeData(async (bonneBoite) => {
      try {
        if (bonneBoite) {
          // contourne mongoose pour éviter la réindexation systématique à chaque insertion.
          await BonnesBoites.collection.insertOne(bonneBoite)
        }
      } catch (err) {
        logMessage("error", err)
      }
    })
  )
}

export default async function updateBonnesBoites({ UseAlgoFile = false, ClearMongo = false, BuildIndex = false, UseSave = false, ForceRecreate = false }) {
  try {
    logMessage("info", " -- Start updating lbb db with new algo -- ")

    console.log("UseAlgoFile : ", UseAlgoFile, " - ClearMongo : ", ClearMongo, " - BuildIndex : ", BuildIndex, " - UseSave : ", UseSave, " - ForceRecreate : ", ForceRecreate)

    if (UseAlgoFile) {
      if (!ForceRecreate) {
        await checkIfAlgoFileIsNew("algo companies")
      }

      await downloadAlgoCompanyFile()

      if (!ForceRecreate) {
        const companyCount = await countCompaniesInFile()
        if (companyCount < MIN_COMPANY_THRESHOLD) {
          notifyToSlack({
            subject: "IMPORT BONNES BOITES",
            message: `Import bonnesboites avorté car le fichier ne comporte pas assez de sociétés. ${companyCount} sociétés / ${MIN_COMPANY_THRESHOLD} minimum attendu`,
            error: true,
          })
          throw new Error(`Nombre de sociétés insuffisant : ${companyCount}`)
        }
      }
    }

    if (ClearMongo) {
      logMessage("info", `Clearing bonnesboites db...`)
      await BonnesBoites.deleteMany({})
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
      await rebuildIndex(BonnesBoites, { skipNotFound: true })
    }

    logMessage("info", `End updating lbb db`)

    await notifyToSlack({ subject: "IMPORT BONNES BOITES", message: `Import bonnesboites terminé. ${count} sociétés importées`, error: false })
  } catch (err) {
    logMessage("error", err)
  } finally {
    await cleanUp()
  }
}
