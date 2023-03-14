import { oleoduc, transformData, writeData } from "oleoduc"
import _ from "lodash-es"
import { BonnesBoites } from "../../common/model/index.js"
import { rebuildIndex } from "../../common/utils/esUtils.js"
import { logMessage } from "../../common/utils/logMessage.js"
import { insertSAVECompanies, updateSAVECompanies, removeSAVECompanies } from "./updateSAVECompanies.js"

import { downloadAlgoCompanyFile, getCompanyMissingData, readCompaniesFromJson, removePredictionFile } from "./bonnesBoitesUtils.js"

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

  const company = await getCompanyMissingData(rawCompany)

  return company
}

const processCompanies = async () => {
  await oleoduc(
    await readCompaniesFromJson(),
    transformData((company) => prepareCompany(company), { parallel: 8 }),
    writeData(async (company) => {
      try {
        let bonneBoite = await BonnesBoites.findOne({ siret: company.siret })
        if (!bonneBoite) {
          bonneBoite = new BonnesBoites(company)
          await bonneBoite.save()
        }
      } catch (err) {
        logMessage("error", err)
      }
    })
  )
}

export default async function updateBonnesBoites({ ClearMongo = false, BuildIndex = false, UseSave = false }) {
  try {
    logMessage("info", " -- Start updating lbb db with new algo -- ")

    console.log(ClearMongo, BuildIndex, UseSave)

    await downloadAlgoCompanyFile()

    if (ClearMongo) {
      logMessage("info", `Clearing bonnesboites db...`)
      await BonnesBoites.deleteMany({})
    }

    await processCompanies()

    if (UseSave) {
      await insertSAVECompanies()
      await updateSAVECompanies()
      await removeSAVECompanies()
    }

    if (BuildIndex) {
      await rebuildIndex(BonnesBoites, { skipNotFound: true })
    }

    logMessage("info", `End updating lbb db`)
  } catch (err) {
    logMessage("error", err)
  } finally {
    await cleanUp()
  }
}
