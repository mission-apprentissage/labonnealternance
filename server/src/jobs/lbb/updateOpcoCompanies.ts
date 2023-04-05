import { oleoduc, writeData } from "oleoduc"
import { logger } from "../../common/logger.js"
import { Opco } from "../../common/model/index.js"
import { logMessage } from "../../common/utils/logMessage.js"
import { CFADOCK_FILTER_LIMIT, fetchOpcosFromCFADock } from "../../service/cfaDock/fetchOpcosFromCFADock.js"
import { saveOpco } from "../../service/opco.js"
import { downloadAlgoCompanyFile, getMemoizedOpcoShortName, readCompaniesFromJson, removePredictionFile } from "./bonnesBoitesUtils.js"
let errorCount = 0

let sirenSet = new Set()
let sirenWithoutOpco = new Set()

let i = 0

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getSirenOpcosFromCFADock = async () => {
  logger.info(`find and save opcos for ${CFADOCK_FILTER_LIMIT} siren`)

  try {
    const response = await fetchOpcosFromCFADock(sirenSet)

    if (response?.data?.found) {
      response.data.found.forEach(async (sirenFilterObj) => {
        if (
          (await saveOpco({
            siren: sirenFilterObj.filters.siret,
            opco: sirenFilterObj.opcoName,
            opco_short_name: getMemoizedOpcoShortName(sirenFilterObj.opcoName),
            url: sirenFilterObj.url,
            idcc: sirenFilterObj.idcc,
          })) === "ok"
        ) {
          i++
          if (i % 10000 === 0) {
            logger.info(`${i} sirens inserted`)
          }
        }
      })

      response.data.notFound.forEach(async (sirenFilterObj) => {
        errorCount++
        sirenWithoutOpco.add(sirenFilterObj.filters.siret)
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
  i = 0
  errorCount = 0
  sirenWithoutOpco = new Set()
}

export default async function updateOpcoCompanies({ ClearMongo = false }) {
  try {
    logMessage("info", " -- Start bulk opco determination -- ")

    await downloadAlgoCompanyFile()

    if (ClearMongo) {
      logMessage("info", `Clearing opcos db...`)
      await Opco.deleteMany({})
    }

    await oleoduc(
      await readCompaniesFromJson(),
      writeData(async (company) => {
        const siren = company.siret.toString().padStart(14, "0").substring(0, 9)

        if (!sirenWithoutOpco.has(siren)) {
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

    await removePredictionFile()

    logMessage("info", `Temporary files removed`)
  } catch (err) {
    logMessage("error", err)
    logMessage("error", "Bulk opco determination interrupted")
  }
  await cleanUp()
}
