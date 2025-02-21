import { oleoduc, writeData } from "oleoduc"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { logMessage } from "../../common/utils/logMessage"
import { notifyToSlack } from "../../common/utils/slackUtils"
import { CFADOCK_FILTER_LIMIT, fetchOpcosFromCFADock } from "../../services/cfadock.service"
import { cfaDockOpcoItemToIOpco, saveOpco } from "../../services/opco.service"

import { checkIfAlgoFileIsNew, downloadAlgoCompanyFile, readCompaniesFromJson, removePredictionFile } from "./recruteurLbaUtil"

let errorCount = 0
let sirenSet: Set<string> = new Set()
let sirenWithoutOpco = new Set()

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getSirenOpcosFromCFADock = async () => {
  logger.info(`find and save opcos for ${CFADOCK_FILTER_LIMIT} siren`)

  try {
    const cfaDockOpcoItems = await fetchOpcosFromCFADock(sirenSet)

    if (cfaDockOpcoItems.length) {
      await Promise.all(
        cfaDockOpcoItems.map(async (sirenFilterObj) => {
          await saveOpco(cfaDockOpcoItemToIOpco(sirenFilterObj))
        })
      )
      errorCount += sirenSet.size - cfaDockOpcoItems.length

      sirenSet.forEach((siren) => {
        if (!cfaDockOpcoItems.some((item) => item.filters.siret === siren)) {
          sirenWithoutOpco.add(siren)
        }
      })
    } else {
      logger.error("CFA Dock returned no found/notFound opcos")
    }
  } catch (err) {
    logger.error("CFA Dock Error for siren set")
    logger.error(err)
  }

  // rate limiter 30 query / 60 seconds
  await sleep(2000)

  sirenSet = new Set()
}

const cleanUp = () => {
  errorCount = 0
  sirenWithoutOpco = new Set()
}

export default async function updateOpcoCompanies({ ClearMongo = false, ForceRecreate = false }: { ClearMongo?: boolean; ForceRecreate?: boolean }) {
  try {
    logMessage("info", " -- Start bulk opco determination -- ")

    if (!ForceRecreate) {
      await checkIfAlgoFileIsNew("opco companies")
    }

    await downloadAlgoCompanyFile()

    if (ClearMongo) {
      logMessage("info", `Clearing opcos db...`)
      await getDbCollection("opcos").deleteMany({})
    }

    await oleoduc(
      await readCompaniesFromJson(),
      writeData(async (company) => {
        const siren = company.siret.toString().padStart(14, "0").substring(0, 9)

        if ((await getDbCollection("opcos").countDocuments({ siren })) === 0 && !sirenWithoutOpco.has(siren)) {
          sirenSet.add(siren)
        }
        if (sirenSet.size > 0 && sirenSet.size % CFADOCK_FILTER_LIMIT === 0) {
          await getSirenOpcosFromCFADock()
        }
      })
    )

    if (sirenSet.size > 0) {
      await getSirenOpcosFromCFADock()
    }

    logMessage("info", `Sirens opco not found ${errorCount}`)

    logMessage("info", `End bulk opco determination`)

    await notifyToSlack({ subject: "RESOLUTION OPCOS", message: `Collecte des opcos par Siret terminée. ${errorCount} not found`, error: false })

    await removePredictionFile()

    logMessage("info", `Temporary files removed`)
  } catch (err) {
    logMessage("error", err)
    logMessage("error", "Bulk opco determination interrupted")
  }
  await cleanUp()
}
