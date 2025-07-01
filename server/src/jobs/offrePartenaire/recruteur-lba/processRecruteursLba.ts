/**
 * Recruteurs LBA alorithm file is updated every sunday (normally)
 * This file is processed every sunday
 *
 */

import Stream from "node:stream"

import { logger } from "@/common/logger"
import { fillComputedRecruteursLba, importRecruteursLbaFromComputedToJobsPartners } from "@/jobs/offrePartenaire/fillComputedRecruteursLba"

import { checkIfAlgoFileAlreadyProcessed, importRecruteurLbaToComputed, importRecruteursLbaRaw } from "./importRecruteursLbaRaw"

export const processRecruteursLba = async ({ sourceFileReadStream, skipCheckFileDate = false }: { sourceFileReadStream?: Stream.Readable; skipCheckFileDate?: boolean } = {}) => {
  logger.info("début de processRecruteursLba")
  if (!skipCheckFileDate) {
    const fileAlreadyProcessed = await checkIfAlgoFileAlreadyProcessed()
    if (fileAlreadyProcessed) {
      logger.info("processRecruteursLba: le fichier a déjà été traité")
      return
    }
  }

  await importRecruteursLbaRaw(sourceFileReadStream)
  await importRecruteurLbaToComputed()
  await fillComputedRecruteursLba()
  await importRecruteursLbaFromComputedToJobsPartners()
  logger.info("fin de processRecruteursLba")
}
